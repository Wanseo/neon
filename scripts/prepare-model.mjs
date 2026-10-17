import { mkdir, copyFile, readdir } from 'node:fs/promises'
const source = new URL('../node_modules/@mediapipe/selfie_segmentation/', import.meta.url)
const target = new URL('../public/mediapipe/', import.meta.url)
await mkdir(target, { recursive: true })
for (const file of await readdir(source)) {
  if (/\.(js|wasm|binarypb|tflite|data)$/.test(file)) await copyFile(new URL(file, source), new URL(file, target))
}
