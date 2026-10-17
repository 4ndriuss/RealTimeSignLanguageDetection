/**
 * Verifies that `extractKeypoints` in `src/services/features.ts` produces
 * identical 152-element vectors to `extract_keypoints` in `../utils/features.py`
 * across 1-hand, 2-hand (sorted and unsorted), and non-square frame dimensions.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractKeypoints, Landmark, NUM_FEATURES } from '../src/services/features';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function makeHand(seed: number, offsetX: number): Landmark[] {
  const hand: Landmark[] = [];
  for (let i = 0; i < 21; i++) {
    const s = seed * 31 + i * 17;
    hand.push({
      x: offsetX + ((Math.sin(s) + 1) * 0.15),
      y: 0.2 + ((Math.cos(s * 1.3) + 1) * 0.25),
      z: Math.sin(s * 0.7) * 0.05,
    });
  }
  return hand;
}

const testCases = [
  { name: 'single hand (4:3 frame)', width: 640, height: 480, hands: [makeHand(1, 0.3)] },
  { name: 'two hands sorted (4:3 frame)', width: 640, height: 480, hands: [makeHand(2, 0.15), makeHand(3, 0.55)] },
  { name: 'two hands reversed order (must sort left-to-right)', width: 1280, height: 720, hands: [makeHand(4, 0.65), makeHand(5, 0.1)] },
  { name: 'square frame (640x640)', width: 640, height: 640, hands: [makeHand(6, 0.2), makeHand(7, 0.5)] },
];

const pyScript = `
import json, sys
sys.path.insert(0, ${JSON.stringify(ROOT_DIR)})
from utils.features import extract_keypoints

class LM:
    def __init__(self, d):
        self.x, self.y, self.z = d['x'], d['y'], d['z']

class Res:
    def __init__(self, hands):
        self.hand_landmarks = [[LM(p) for p in h] for h in hands]

cases = json.loads(sys.stdin.read())
out = []
for c in cases:
    vec = extract_keypoints(Res(c['hands']), (c['height'], c['width']))
    out.append(vec.tolist())
print(json.dumps(out))
`;

import { existsSync } from 'node:fs';

const venvPy = join(ROOT_DIR, 'venv', 'Scripts', 'python.exe');
const pyExecutable = existsSync(venvPy) ? venvPy : 'python';

const pyOutput = JSON.parse(
  execFileSync(pyExecutable, ['-c', pyScript], {
    input: JSON.stringify(testCases),
    encoding: 'utf-8',
  }),
) as number[][];

let maxDiff = 0;
testCases.forEach((tc, idx) => {
  const tsVec = extractKeypoints(tc.hands, tc.width, tc.height);
  const pyVec = pyOutput[idx];
  if (!tsVec || tsVec.length !== NUM_FEATURES || pyVec.length !== NUM_FEATURES) {
    throw new Error(`Length mismatch in case "${tc.name}"`);
  }
  for (let i = 0; i < NUM_FEATURES; i++) {
    const diff = Math.abs(tsVec[i] - pyVec[i]);
    if (diff > maxDiff) maxDiff = diff;
    if (diff > 1e-9) {
      throw new Error(
        `Parity mismatch in "${tc.name}" at index ${i}: TS=${tsVec[i]} vs PY=${pyVec[i]} (diff=${diff})`,
      );
    }
  }
  console.log(`[PASS] ${tc.name}`);
});

console.log(`All ${testCases.length} parity checks passed! Max absolute diff: ${maxDiff.toExponential(2)}`);
