/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Central configuration for the sign detection pipeline. */

/** Base URL of the FastAPI backend (4_api.py). Override with VITE_API_URL. */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? 'http://127.0.0.1:8000';

/** Static assets prepared by `scripts/setup-mediapipe-assets.mjs`. */
export const MEDIAPIPE_WASM_PATH = `${import.meta.env.BASE_URL}mediapipe/wasm`;
export const HAND_LANDMARKER_MODEL_PATH = `${import.meta.env.BASE_URL}models/hand_landmarker.task`;

/** Same values as `create_landmarker()` defaults in utils/mediapipe_utils.py. */
export const HAND_LANDMARKER_OPTIONS = {
  numHands: 2,
  minConfidence: 0.5,
} as const;

/** Prediction smoothing (see services/smoothing.ts). */
export const SMOOTHING = {
  /** Only predictions from the last `windowMs` vote. */
  windowMs: 500,
  /** A new label is shown only if it holds at least this share of the votes... */
  minShare: 0.6,
  /** ...and at least this many votes (avoids reacting to a single frame). */
  minVotes: 3,
  /** Clear the result after the hand has been gone this long. */
  resetAfterMs: 500,
} as const;

/** Wait this long before retrying after a failed API request. */
export const API_RETRY_DELAY_MS = 1000;
