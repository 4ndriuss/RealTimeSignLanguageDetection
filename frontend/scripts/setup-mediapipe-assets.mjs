/**
 * Copies the MediaPipe assets the browser needs into `public/`:
 *  - WASM runtime from the installed @mediapipe/tasks-vision package, so its
 *    version always matches the JS bundle (pinned by package-lock.json).
 *  - hand_landmarker.task: the exact model used by the Python pipeline
 *    (reused from ../utils if present, otherwise downloaded once).
 *
 * Runs automatically before `npm run dev` / `npm run build`. Both output
 * folders are git-ignored because they are large generated artifacts.
 */
import { copyFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(FRONTEND_DIR, 'public');

const WASM_SRC_DIR = join(FRONTEND_DIR, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const WASM_DEST_DIR = join(PUBLIC_DIR, 'mediapipe', 'wasm');
// SIMD build + non-SIMD fallback (FilesetResolver picks one at runtime).
const WASM_FILES = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

// Keep in sync with MODEL_URL in utils/mediapipe_utils.py.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const PYTHON_MODEL_PATH = join(FRONTEND_DIR, '..', 'utils', 'hand_landmarker.task');
const MODEL_DEST = join(PUBLIC_DIR, 'models', 'hand_landmarker.task');

async function fileSize(path) {
  try {
    return (await stat(path)).size;
  } catch {
    return -1;
  }
}

async function copyIfChanged(src, dest) {
  const srcSize = await fileSize(src);
  if (srcSize < 0) throw new Error(`Missing source file: ${src}`);
  if ((await fileSize(dest)) === srcSize) return false;
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
  return true;
}

async function setupWasm() {
  let copied = 0;
  for (const file of WASM_FILES) {
    if (await copyIfChanged(join(WASM_SRC_DIR, file), join(WASM_DEST_DIR, file))) copied++;
  }
  console.log(`[mediapipe] WASM runtime ready (${copied} file(s) updated).`);
}

async function setupModel() {
  if ((await fileSize(PYTHON_MODEL_PATH)) > 0) {
    await copyIfChanged(PYTHON_MODEL_PATH, MODEL_DEST);
    console.log('[mediapipe] Hand landmarker model ready (copied from utils/).');
    return;
  }
  if ((await fileSize(MODEL_DEST)) > 0) {
    console.log('[mediapipe] Hand landmarker model ready.');
    return;
  }

  console.log('[mediapipe] Downloading hand_landmarker.task (~7.5 MB)...');
  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error(`Model download failed: HTTP ${response.status}`);
  await mkdir(dirname(MODEL_DEST), { recursive: true });
  await writeFile(MODEL_DEST, Buffer.from(await response.arrayBuffer()));
  console.log('[mediapipe] Hand landmarker model downloaded.');
}

try {
  await setupWasm();
  await setupModel();
} catch (err) {
  console.error(`[mediapipe] Asset setup failed: ${err.message}`);
  process.exit(1);
}
