import { mkdir, copyFile, readdir } from 'node:fs/promises'
const target = new URL('../public/mediapipe/', import.meta.url)
await mkdir(target, { recursive: true })
for (const model of ['selfie_segmentation', 'face_mesh']) {
  const source = new URL(`../node_modules/@mediapipe/${model}/`, import.meta.url)
  for (const name of await readdir(source)) {
    if (/\.(js|wasm|binarypb|tflite|data)$/.test(name)) {
      await copyFile(new URL(name, source), new URL(name, target))
    }
  }
}
