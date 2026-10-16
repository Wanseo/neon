import type { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation'

type SegmenterConstructor = new (options: { locateFile: (file: string) => string }) => SelfieSegmentation
let library: Promise<SegmenterConstructor> | undefined

export async function createSegmenter() {
  library ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${import.meta.env.BASE_URL}mediapipe/selfie_segmentation.js`
    script.onload = () => resolve((window as unknown as { SelfieSegmentation: SegmenterConstructor }).SelfieSegmentation)
    script.onerror = () => { script.remove(); library = undefined; reject(new Error('Model load failed')) }
    document.head.append(script)
  })
  const Constructor = await library
  const segmenter = new Constructor({ locateFile: file => `${import.meta.env.BASE_URL}mediapipe/${file}` })
  segmenter.setOptions({ modelSelection: 1, selfieMode: false })
  return segmenter
}

// Only broad pools of light survive. No sharp source image is composited back in.
export function createNeonRenderer(canvas: HTMLCanvasElement, glow: HTMLInputElement, shadow: HTMLInputElement) {
  const context = canvas.getContext('2d')!
  const tone = document.createElement('canvas')
  const mask = document.createElement('canvas')
  const color = document.createElement('canvas')
  const toneContext = tone.getContext('2d', { willReadFrequently: true })!
  const maskContext = mask.getContext('2d', { willReadFrequently: true })!
  const colorContext = color.getContext('2d')!

  return (results: Results) => {
    const width = 480
    const height = Math.round(width * results.image.height / results.image.width)
    if (canvas.width !== width || canvas.height !== height) {
      for (const surface of [canvas, tone, mask, color]) { surface.width = width; surface.height = height }
    }
    const bloom = Number(glow.value) / 100
    const depth = Number(shadow.value) / 100
    // A large spatial blur removes eyes, nostrils, lips, and skin texture before recoloring.
    toneContext.save()
    toneContext.translate(width, 0)
    toneContext.scale(-1, 1)
    toneContext.filter = 'blur(24px)'
    toneContext.drawImage(results.image, 0, 0, width, height)
    toneContext.restore()
    maskContext.save()
    maskContext.clearRect(0, 0, width, height)
    maskContext.translate(width, 0)
    maskContext.scale(-1, 1)
    maskContext.filter = 'blur(2px)'
    maskContext.drawImage(results.segmentationMask, 0, 0, width, height)
    maskContext.restore()
    const image = toneContext.getImageData(0, 0, width, height)
    const matte = maskContext.getImageData(0, 0, width, height).data
    const data = image.data
    const confidence = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return 0
      return matte[(y * width + x) * 4]! / 255
    }
    const radius = 5
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const j = (y * width + x) * 4
      const occupancy = confidence(x, y)
      const inner = Math.min(confidence(x - radius, y), confidence(x + radius, y), confidence(x, y - radius), confidence(x, y + radius))
      const rim = Math.min(1, Math.max(0, occupancy - inner) * 2.8)
      const light = (data[j]! * .2126 + data[j + 1]! * .7152 + data[j + 2]! * .0722) / 255
      // Compress facial contrast into a continuous silhouette, keeping only large shadows.
      const darkness = Math.min(.95, .36 + (1 - light) * (.44 + depth * .24))
      const pigment = darkness * (1 - rim * .92)
      data[j] = 249 - pigment * 193
      data[j + 1] = 253 - pigment * 100
      data[j + 2] = 237 - pigment * 228
      data[j + 3] = Math.max(0, Math.min(1, (occupancy - .12) / .7)) * 255
    }
    colorContext.putImageData(image, 0, 0)
    context.fillStyle = '#fcfdf9'
    context.fillRect(0, 0, width, height)
    // A wide green halo bleeds into the white background, outside the silhouette.
    context.save()
    context.filter = `blur(${14 + bloom * 23}px)`
    context.globalAlpha = .35 + bloom * .3
    context.drawImage(color, 0, 0)
    context.restore()
    context.save()
    context.filter = `blur(${2 + bloom * 2}px)`
    context.globalAlpha = .88
    context.drawImage(color, 0, 0)
    context.restore()
  }
}
