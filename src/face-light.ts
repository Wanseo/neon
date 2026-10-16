import type { FaceMesh, NormalizedLandmarkList } from '@mediapipe/face_mesh'

type Constructor = new (options: { locateFile: (file: string) => string }) => FaceMesh
let library: Promise<Constructor> | undefined
export async function createFaceTracker() {
  library ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${import.meta.env.BASE_URL}mediapipe/face_mesh.js`
    script.onload = () => resolve((window as unknown as { FaceMesh: Constructor }).FaceMesh)
    script.onerror = () => { library = undefined; script.remove(); reject(new Error('Face tracking load failed')) }
    document.head.append(script)
  })
  const Tracker = await library
  const tracker = new Tracker({ locateFile: file => `${import.meta.env.BASE_URL}mediapipe/${file}` })
  tracker.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: .5, minTrackingConfidence: .5 })
  return tracker
}

// Follow only the temples, cheeks, and jaw. Never draw eye, nose, or mouth landmarks.
const contour = [127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356]
export function drawFaceLight(context: CanvasRenderingContext2D, landmarks: NormalizedLandmarkList, width: number, height: number, bloom: number) {
  if (!landmarks.length) return
  const points = contour.map(index => ({ x: (1 - landmarks[index]!.x) * width, y: landmarks[index]!.y * height }))
  const faceWidth = Math.hypot(points[0]!.x - points[points.length - 1]!.x, points[0]!.y - points[points.length - 1]!.y)
  const core = Math.max(1.5, faceWidth * .023)
  context.save()
  context.globalCompositeOperation = 'screen'
  context.lineCap = 'round'
  context.lineJoin = 'round'
  // Draw short overlapping segments with a tapered intensity at each temple.
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!
    const b = points[i + 1]!
    const taper = Math.sin(Math.PI * (i + .5) / (points.length - 1)) ** .4
    for (const layer of [0, 1, 2]) {
      context.beginPath()
      context.moveTo(a.x, a.y)
      context.lineTo(b.x, b.y)
      context.lineWidth = core * [4.5, 2.1, .85][layer]!
      context.strokeStyle = ['#b8ff60', '#e4ffb8', '#fcffe9'][layer]!
      context.globalAlpha = taper * [.13 + bloom * .07, .28, .65][layer]!
      context.filter = `blur(${core * [2.8 + bloom, .9, .35][layer]!}px)`
      context.stroke()
    }
  }
  context.restore()
}
