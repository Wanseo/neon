import type { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation'
import { styles, createToneTable } from './styles'
import { inwardDistance } from './distance'

type Constructor = new (config: { locateFile: (file: string) => string }) => SelfieSegmentation
let library: Promise<Constructor> | undefined
export async function createSegmenter() {
  library ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${import.meta.env.BASE_URL}mediapipe/selfie_segmentation.js`
    script.onload = () => resolve((window as unknown as { SelfieSegmentation: Constructor }).SelfieSegmentation)
    script.onerror = () => { library = undefined; script.remove(); reject(new Error('Model load failed')) }
    document.head.append(script)
  })
  const Model = await library
  const model = new Model({ locateFile: file => `${import.meta.env.BASE_URL}mediapipe/${file}` })
  model.setOptions({ modelSelection: 1, selfieMode: false })
  return model
}

export function createMosaic(canvases: HTMLCanvasElement[]) {
  const size = 288
  const maskSize = size * 3
  const toneTables = styles.map(createToneTable)
  const contexts = canvases.map(canvas => {
    canvas.width = canvas.height = size
    return canvas.getContext('2d')!
  })
  const mask = document.createElement('canvas')
  mask.width = mask.height = maskSize
  const maskContext = mask.getContext('2d', { willReadFrequently: true })!
  const tone = document.createElement('canvas')
  tone.width = tone.height = maskSize
  const toneContext = tone.getContext('2d', { willReadFrequently: true })!
  const light = document.createElement('canvas')
  light.width = light.height = size
  const lightContext = light.getContext('2d')!
  const image = lightContext.createImageData(size, size)
  const distance = new Float32Array(maskSize * maskSize)
  const strength = new Float32Array(maskSize * maskSize)
  const luminance = new Uint8Array(maskSize * maskSize)
  let previous: Float32Array | null = null

  function preview() {
    previous = null
    contexts.forEach((context, i) => {
      context.fillStyle = styles[i]!.background
      context.fillRect(0, 0, size, size)
    })
  }
  preview()

  function render(results: Results, spread: number) {
    // Mirror and center-crop ONE silhouette across the entire 3×3 composition.
    // Compute its contour globally so tile boundaries never create artificial rims.
    const source = results.segmentationMask
    const side = Math.min(source.width, source.height)
    maskContext.save()
    maskContext.clearRect(0, 0, maskSize, maskSize)
    maskContext.translate(maskSize, 0)
    maskContext.scale(-1, 1)
    maskContext.filter = 'blur(1px)'
    maskContext.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, maskSize, maskSize)
    maskContext.restore()
    // Use the actual person's broad light/shadow regions, never a fixed design.
    const camera = results.image
    const cameraSide = Math.min(camera.width, camera.height)
    toneContext.save()
    toneContext.clearRect(0, 0, maskSize, maskSize)
    toneContext.translate(maskSize, 0)
    toneContext.scale(-1, 1)
    // Remove small facial features before applying the palette.
    toneContext.filter = 'blur(56px)'
    toneContext.drawImage(camera, (camera.width - cameraSide) / 2, (camera.height - cameraSide) / 2, cameraSide, cameraSide, 0, 0, maskSize, maskSize)
    toneContext.restore()
    const tones = toneContext.getImageData(0, 0, maskSize, maskSize).data
    for (let i = 0; i < luminance.length; i++) {
      const j = i * 4
      luminance[i] = tones[j]! * .2126 + tones[j + 1]! * .7152 + tones[j + 2]! * .0722
    }
    const pixels = maskContext.getImageData(0, 0, maskSize, maskSize).data
    // Short temporal smoothing keeps the hair/shoulder contour from sparkling.
    if (!previous) previous = new Float32Array(maskSize * maskSize)
    for (let i = 0; i < previous.length; i++) {
      const value = previous[i]! * .25 + pixels[i * 4]! * .75
      previous[i] = value
      pixels[i * 4] = value
    }
    inwardDistance(pixels, maskSize, distance)
    const reach = 8 + spread * 46
    for (let i = 0; i < strength.length; i++) {
      const occupancy = Math.max(0, Math.min(1, (pixels[i * 4]! - 65) / 145))
      strength[i] = occupancy
    }
    contexts.forEach((context, tile) => {
      const style = styles[tile]!
      const toneTable = toneTables[tile]!
      const offsetX = (tile % 3) * size
      const offsetY = Math.floor(tile / 3) * size
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const j = (y * size + x) * 4
        const globalIndex = (offsetY + y) * maskSize + offsetX + x
        const energy = strength[globalIndex]!
        const rim = Math.exp(-distance[globalIndex]! / reach)
        const core = Math.exp(-distance[globalIndex]! / 5) * .55
        const toneIndex = luminance[globalIndex]! * 3
        for (let channel = 0; channel < 3; channel++) {
          const body = toneTable[toneIndex + channel]!
          const reflected = body * (1 - rim * .78) + style.rim[channel]! * rim * .78
          image.data[j + channel] = reflected * (1 - core) + style.highlight[channel]! * core
        }
        image.data[j + 3] = energy * 255
      }
      lightContext.putImageData(image, 0, 0)
      context.fillStyle = style.background
      context.fillRect(0, 0, size, size)
      context.save()
      context.globalCompositeOperation = 'screen'
      context.filter = 'blur(13px)'
      context.globalAlpha = .32 + spread * .2
      context.drawImage(light, 0, 0)
      context.restore()
      context.save()
      context.filter = 'blur(1px)'
      context.drawImage(light, 0, 0)
      context.restore()
    })
  }
  return { preview, render }
}
