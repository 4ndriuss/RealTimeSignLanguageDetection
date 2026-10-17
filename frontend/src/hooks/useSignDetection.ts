/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HandLandmarker } from '@mediapipe/tasks-vision';
import { API_RETRY_DELAY_MS, SMOOTHING } from '../config';
import { extractKeypoints, NUM_FEATURES } from '../services/features';
import { drawHands, getHandLandmarker } from '../services/handLandmarker';
import { fetchHealth, predictFeatures } from '../services/signApi';
import { PredictionSmoother, SmoothedPrediction } from '../services/smoothing';
import type { CameraStatus } from '../types';

export type DetectionError = 'unsupported' | 'denied' | 'camera' | 'model';
export type ApiStatus = 'unknown' | 'online' | 'offline' | 'mismatch';

/** Minimum confidence change worth a React re-render (0.5%). */
const CONFIDENCE_EPSILON = 0.005;
const FPS_UPDATE_MS = 500;

/**
 * Real-time pipeline, executed once per new video frame:
 *   webcam -> MediaPipe (in the browser) -> 152 features -> API -> smoothing.
 *
 * Only one API request is in flight at a time; frames arriving meanwhile are
 * still tracked/drawn locally, and the next request always uses the latest
 * frame. React state is only updated when something visible changes, so the
 * per-frame work does not trigger re-renders.
 */
export function useSignDetection(showOverlay: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<DetectionError | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('unknown');
  const [result, setResult] = useState<SmoothedPrediction | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [fps, setFps] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const smootherRef = useRef(new PredictionSmoother(SMOOTHING));
  const runningRef = useRef(false);
  const startingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const retryAtRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const showOverlayRef = useRef(showOverlay);
  const publishedRef = useRef<SmoothedPrediction | null>(null);
  const handDetectedRef = useRef(false);
  const fpsRef = useRef({ frames: 0, since: 0 });

  // The render loop reads the latest toggle value through a ref, avoiding
  // the stale-closure bug of the previous implementation.
  useEffect(() => {
    showOverlayRef.current = showOverlay;
    if (!showOverlay) clearCanvas(canvasRef.current);
  }, [showOverlay]);

  const publish = useCallback((next: SmoothedPrediction | null) => {
    const prev = publishedRef.current;
    const changed =
      (prev === null) !== (next === null) ||
      (prev !== null &&
        next !== null &&
        (prev.label !== next.label || Math.abs(prev.confidence - next.confidence) > CONFIDENCE_EPSILON));
    if (changed) {
      publishedRef.current = next;
      setResult(next);
    }
  }, []);

  const updateHandDetected = useCallback((value: boolean) => {
    if (handDetectedRef.current !== value) {
      handDetectedRef.current = value;
      setHandDetected(value);
    }
  }, []);

  const requestPrediction = useCallback(
    (features: number[]) => {
      inFlightRef.current = true;
      const controller = new AbortController();
      abortRef.current = controller;

      predictFeatures(features, controller.signal)
        .then((data) => {
          if (!runningRef.current) return;
          setApiStatus('online');
          publish(
            smootherRef.current.addPrediction(data.predicted_label, data.confidence, performance.now()),
          );
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          console.error('Prediction request failed:', err);
          setApiStatus('offline');
          retryAtRef.current = performance.now() + API_RETRY_DELAY_MS;
        })
        .finally(() => {
          if (abortRef.current === controller) inFlightRef.current = false;
        });
    },
    [publish],
  );

  const processFrame = useCallback(() => {
    if (!runningRef.current) return;
    rafRef.current = requestAnimationFrame(processFrame);

    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    // Skip until a *new* video frame is available (rAF may run faster than the camera).
    if (!video || !landmarker || video.readyState < 2 || video.currentTime === lastVideoTimeRef.current) {
      return;
    }
    lastVideoTimeRef.current = video.currentTime;

    const now = performance.now();
    const hands = landmarker.detectForVideo(video, now).landmarks;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && showOverlayRef.current) drawHands(ctx, hands);

    const fpsStats = fpsRef.current;
    fpsStats.frames++;
    if (now - fpsStats.since >= FPS_UPDATE_MS) {
      setFps(Math.round((fpsStats.frames * 1000) / (now - fpsStats.since)));
      fpsStats.frames = 0;
      fpsStats.since = now;
    }

    const features = extractKeypoints(hands, video.videoWidth, video.videoHeight);
    if (features) {
      updateHandDetected(true);
      if (!inFlightRef.current && now >= retryAtRef.current) requestPrediction(features);
    } else {
      updateHandDetected(false);
      publish(smootherRef.current.markNoHand(now));
    }
  }, [publish, requestPrediction, updateHandDetected]);

  const stop = useCallback(() => {
    runningRef.current = false;
    startingRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    abortRef.current?.abort();
    inFlightRef.current = false;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    clearCanvas(canvasRef.current);

    smootherRef.current.reset();
    publish(null);
    updateHandDetected(false);
    setFps(0);
    setStatus('idle');
  }, [publish, updateHandDetected]);

  const start = useCallback(async () => {
    if (runningRef.current || startingRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unsupported');
      setStatus('error');
      return;
    }
    startingRef.current = true;
    setError(null);
    setStatus('loading');

    try {
      // Load the model and check the backend while the camera permission prompt is open.
      const landmarkerPromise = getHandLandmarker();
      fetchHealth()
        .then((health) => setApiStatus(health.num_features === NUM_FEATURES ? 'online' : 'mismatch'))
        .catch(() => setApiStatus('offline'));

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
      } catch (err) {
        console.warn('Failed to open camera:', err);
        const name = (err as DOMException)?.name;
        const isDenied = name === 'NotAllowedError' || name === 'PermissionDeniedError';
        setError(isDenied ? 'denied' : 'camera');
        setStatus(isDenied ? 'denied' : 'error');
        return;
      }

      if (!startingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      try {
        landmarkerRef.current = await landmarkerPromise;
      } catch (err) {
        console.error('Failed to load MediaPipe HandLandmarker:', err);
        stream.getTracks().forEach((track) => track.stop());
        setError('model');
        setStatus('error');
        return;
      }

      const video = videoRef.current;
      if (!video || !startingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      smootherRef.current.reset();
      lastVideoTimeRef.current = -1;
      retryAtRef.current = 0;
      fpsRef.current = { frames: 0, since: performance.now() };
      runningRef.current = true;
      setStatus('active');
      rafRef.current = requestAnimationFrame(processFrame);
    } finally {
      startingRef.current = false;
    }
  }, [processFrame]);

  // Release the camera when the component unmounts.
  useEffect(() => stop, [stop]);

  return { videoRef, canvasRef, status, error, apiStatus, result, handDetected, fps, start, stop };
}

function clearCanvas(canvas: HTMLCanvasElement | null) {
  canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
}
