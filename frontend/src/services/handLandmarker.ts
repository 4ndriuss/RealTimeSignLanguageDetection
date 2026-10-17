/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HAND_LANDMARKER_MODEL_PATH, HAND_LANDMARKER_OPTIONS, MEDIAPIPE_WASM_PATH } from '../config';
import { HAND_CONNECTIONS } from '../components/HandSvgIcons';
import type { Landmark } from './features';

let landmarkerPromise: Promise<HandLandmarker> | null = null;

async function createLandmarker(): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
  const create = (delegate: 'GPU' | 'CPU') =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: HAND_LANDMARKER_MODEL_PATH, delegate },
      runningMode: 'VIDEO',
      numHands: HAND_LANDMARKER_OPTIONS.numHands,
      minHandDetectionConfidence: HAND_LANDMARKER_OPTIONS.minConfidence,
      minHandPresenceConfidence: HAND_LANDMARKER_OPTIONS.minConfidence,
    });

  try {
    return await create('GPU');
  } catch (err) {
    console.warn('MediaPipe GPU delegate unavailable, falling back to CPU:', err);
    return create('CPU');
  }
}

/**
 * Returns a shared HandLandmarker. Loading the WASM + model takes a moment,
 * so it is created once and reused across camera restarts.
 */
export function getHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((err) => {
      landmarkerPromise = null; // allow a retry on the next call
      throw err;
    });
  }
  return landmarkerPromise;
}

/** Draws the hand skeleton (same colors as draw_styled_landmarks in Python). */
export function drawHands(ctx: CanvasRenderingContext2D, hands: Landmark[][]): void {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0000ff';
  ctx.fillStyle = '#00ff00';
  for (const hand of hands) {
    ctx.beginPath();
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.moveTo(hand[a].x * width, hand[a].y * height);
      ctx.lineTo(hand[b].x * width, hand[b].y * height);
    }
    ctx.stroke();

    for (const lm of hand) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}
