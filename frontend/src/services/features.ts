/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TypeScript port of `extract_keypoints` in utils/features.py.
 *
 * The browser runs MediaPipe and sends only these 152 numbers to the API, so
 * this MUST produce exactly what the model was trained on. Keep it in sync
 * with the Python version; `npm run test:parity` verifies both agree.
 *
 * Layout:
 *   [  0: 63]  Hand 1 (leftmost on screen): 21 landmarks x (x, y, z), normalized
 *   [ 63:126]  Hand 2 (rightmost on screen): 21 landmarks x (x, y, z), normalized
 *   [126:151]  25 distances between the fingertips of hand 1 and hand 2
 *   [151]      Number of detected hands
 */

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export const NUM_LANDMARKS = 21;
export const HAND_FEATURES = NUM_LANDMARKS * 3;
export const INTER_FEATURES = 25;
export const NUM_FEATURES = 2 * HAND_FEATURES + INTER_FEATURES + 1;

/** Wrist -> middle finger MCP: a rigid bone used as the hand-size reference. */
const SCALE_LANDMARK = 9;
const FINGERTIPS = [4, 8, 12, 16, 20];

type Point3 = [number, number, number];

/** Normalized landmarks -> aspect-correct pixel coordinates (z scaled by width). */
function toPixels(hand: Landmark[], width: number, height: number): Point3[] {
  return hand.map((lm) => [lm.x * width, lm.y * height, lm.z * width]);
}

/**
 * Returns the 152-feature vector, or `null` when no hand is detected
 * (the Python version returns all zeros in that case).
 */
export function extractKeypoints(
  handLandmarks: Landmark[][],
  width: number,
  height: number,
): number[] | null {
  const hands = handLandmarks.slice(0, 2).map((h) => toPixels(h, width, height));
  const n = hands.length;
  if (n === 0) return null;

  // Sort left to right by the wrist x coordinate (Array.sort is stable, like Python's).
  hands.sort((a, b) => a[0][0] - b[0][0]);

  // Average palm length of the detected hands as the normalization scale.
  const validScales = hands
    .map((k) => Math.hypot(k[SCALE_LANDMARK][0] - k[0][0], k[SCALE_LANDMARK][1] - k[0][1]))
    .filter((s) => s > 1e-6);
  const scale = validScales.length > 0
    ? validScales.reduce((a, b) => a + b, 0) / validScales.length
    : 1.0;

  // Combined centroid of all detected landmarks.
  const origin: Point3 = [0, 0, 0];
  const total = n * NUM_LANDMARKS;
  for (const hand of hands) {
    for (const p of hand) {
      origin[0] += p[0];
      origin[1] += p[1];
      origin[2] += p[2];
    }
  }
  origin[0] /= total;
  origin[1] /= total;
  origin[2] /= total;

  const normalized: Point3[][] = hands.map((hand) =>
    hand.map((p) => [
      (p[0] - origin[0]) / scale,
      (p[1] - origin[1]) / scale,
      (p[2] - origin[2]) / scale,
    ]),
  );

  const features = new Array<number>(NUM_FEATURES).fill(0);
  normalized.forEach((hand, h) => {
    hand.forEach((p, i) => {
      const offset = h * HAND_FEATURES + i * 3;
      features[offset] = p[0];
      features[offset + 1] = p[1];
      features[offset + 2] = p[2];
    });
  });

  if (n === 2) {
    let offset = 2 * HAND_FEATURES;
    for (const i of FINGERTIPS) {
      for (const j of FINGERTIPS) {
        const a = normalized[0][i];
        const b = normalized[1][j];
        features[offset++] = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      }
    }
  }

  features[NUM_FEATURES - 1] = n;
  return features;
}
