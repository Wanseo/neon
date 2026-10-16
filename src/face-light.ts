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
  // Index-based noise keeps each fragment anchored to the face instead of flickering.
  const noise = (seed: number) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
    return value - Math.floor(value)
  }
  const center = { x: (1 - landmarks[1]!.x) * width, y: landmarks[1]!.y * height }
  const cloud = (x: number, y: number, rx: number, ry: number, angle: number, alpha: number, bright: boolean) => {
    context.save()
    context.translate(x, y)
    context.rotate(angle)
    context.scale(rx, ry)
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1)
    gradient.addColorStop(0, bright ? '#ffffed' : '#d7ff94')
    gradient.addColorStop(.22, bright ? '#f4ffd7' : '#c7ff76')
    gradient.addColorStop(.55, 'rgba(197,255,111,0.38)')
    gradient.addColorStop(1, 'rgba(184,255,96,0)')
    context.fillStyle = gradient
    context.globalAlpha = alpha
    context.beginPath()
    context.arc(0, 0, 1, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
  context.save()
  context.globalCompositeOperation = 'screen'
  // Soft, uneven pools replace the continuous rim stroke.
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!
    const b = points[i + 1]!
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    const taper = Math.sin(Math.PI * (i + .5) / (points.length - 1)) ** .4
    cloud(a.x, a.y, core * (4 + noise(i + 1) * 4), core * (3 + bloom * 4), angle,
      taper * (.12 + bloom * .12), false)
    for (let part = 0; part < 3; part++) {
      const seed = i * 3 + part + 1
      if (noise(seed * 7) < .28) continue
      const t = (part + .15 + noise(seed * 3) * .65) / 3
      const x = a.x + (b.x - a.x) * t
      const y = a.y + (b.y - a.y) * t
      let nx = -Math.sin(angle)
      let ny = Math.cos(angle)
      if (nx * (x - center.x) + ny * (y - center.y) < 0) { nx = -nx; ny = -ny }
      const spread = (noise(seed * 11) - .3) * core * (2 + bloom * 4)
      const slip = (noise(seed * 13) - .5) * core * 2
      const px = x + nx * spread + Math.cos(angle) * slip
      const py = y + ny * spread + Math.sin(angle) * slip
      const size = .55 + noise(seed * 17) * 1.8
      const twist = angle + (noise(seed * 19) - .5) * 1.7
      // Each white shard has its own wide translucent lime diffusion.
      cloud(px, py, core * size * (2.8 + bloom * 2), core * (1.6 + bloom * 2.3), twist,
        taper * (.18 + noise(seed * 23) * .2), false)
      cloud(px, py, core * size, core * (.3 + noise(seed * 29) * .65), twist,
        taper * (.4 + noise(seed * 31) * .5), true)
      if (noise(seed * 37) > .65) {
        cloud(px + nx * core * (3 + noise(seed * 41) * 3), py + ny * core * (3 + noise(seed * 41) * 3),
          core * 1.8, core * .8, twist, taper * .22, false)
      }
    }
  }
  context.restore()
}
