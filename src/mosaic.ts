import type { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation'
import { createPattern } from './patterns'
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
  const textures = canvases.map((_, index) => createPattern(index, size))
  const texturePixels = textures.map(texture => texture.getContext('2d')!.getImageData(0, 0, size, size).data)
  const contexts = canvases.map(canvas => {
    canvas.width = canvas.height = size
    return canvas.getContext('2d')!
  })
  const mask = document.createElement('canvas')
  mask.width = mask.height = size
  const maskContext = mask.getContext('2d', { willReadFrequently: true })!
  const light = document.createElement('canvas')
  light.width = light.height = size
  const lightContext = light.getContext('2d')!
  const image = lightContext.createImageData(size, size)
  const distance = new Float32Array(size * size)
  const strength = new Float32Array(size * size)
  let previous: Float32Array | null = null

  function preview() {
    previous = null
    contexts.forEach((context, i) => context.drawImage(textures[i]!, 0, 0))
  }
  preview()

  function render(results: Results, spread: number) {
    // Mirror and center-crop once; every tile shares the exact same silhouette.
    const source = results.segmentationMask
    const side = Math.min(source.width, source.height)
    maskContext.save()
    maskContext.clearRect(0, 0, size, size)
    maskContext.translate(size, 0)
    maskContext.scale(-1, 1)
    maskContext.filter = 'blur(1px)'
    maskContext.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, size, size)
    maskContext.restore()
    const pixels = maskContext.getImageData(0, 0, size, size).data
    // Short temporal smoothing keeps the hair/shoulder contour from sparkling.
    if (!previous) previous = new Float32Array(size * size)
    for (let i = 0; i < previous.length; i++) {
      const value = previous[i]! * .25 + pixels[i * 4]! * .75
      previous[i] = value
      pixels[i * 4] = value
    }
    inwardDistance(pixels, size, distance)
    const reach = 8 + spread * 43
    for (let i = 0; i < strength.length; i++) {
      const occupancy = Math.max(0, Math.min(1, (pixels[i * 4]! - 65) / 145))
      const d = distance[i]!
      // Light originates at the contour and decays inward, carrying each tile's shapes.
      strength[i] = occupancy * (.28 + .72 * Math.exp(-d / reach))
    }
    contexts.forEach((context, tile) => {
      const texture = texturePixels[tile]!
      for (let i = 0; i < strength.length; i++) {
        const j = i * 4
        const energy = strength[i]!
        const rim = Math.exp(-distance[i]! / 3) * energy
        for (let channel = 0; channel < 3; channel++) {
          image.data[j + channel] = Math.min(255, texture[j + channel]! * (1 + rim * .38) + rim * 45)
        }
        image.data[j + 3] = energy * 255
      }
      lightContext.putImageData(image, 0, 0)
      context.fillStyle = '#020204'
      context.fillRect(0, 0, size, size)
      // Keep a faint echo of the composition around the person.
      context.globalAlpha = .055
      context.drawImage(textures[tile]!, 0, 0)
      context.globalAlpha = 1
      context.save()
      context.globalCompositeOperation = 'screen'
      context.filter = 'blur(13px)'
      context.globalAlpha = .7
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
