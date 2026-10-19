import './style.css'
import backgroundUrl from './assets/blue-paper.png'
import inkUrl from './assets/stone-ink.png'
import { cities, alignmentReference } from './poster-layout'
import { alignCity, fitCitySize } from './align-city'
import { installHoverMotion, type HoverRow } from './hover-motion'
import { installCountryMap } from './country-map'

const svgNS = 'http://www.w3.org/2000/svg'
const poster = document.createElementNS(svgNS, 'svg')
poster.setAttribute('viewBox', '0 0 1024 1536')
poster.classList.add('city-poster')
poster.setAttribute('role', 'group')
poster.setAttribute('aria-labelledby', 'poster-title')
const title = document.createElementNS(svgNS, 'title')
title.id = 'poster-title'
title.textContent = `도시: ${cities.map(row => row.city).join(', ')}`
poster.append(title)
const defs = document.createElementNS(svgNS, 'defs')
const inkPattern = document.createElementNS(svgNS, 'pattern')
inkPattern.id = 'stone-ink'
inkPattern.setAttribute('patternUnits', 'userSpaceOnUse')
inkPattern.setAttribute('width', '512')
inkPattern.setAttribute('height', '512')
const inkImage = document.createElementNS(svgNS, 'image')
inkImage.setAttribute('href', inkUrl)
inkImage.setAttribute('width', '512')
inkImage.setAttribute('height', '512')
inkPattern.append(inkImage)
defs.append(inkPattern)
poster.append(defs)

const background = new Image()
background.src = backgroundUrl
const inkAsset = new Image()
inkAsset.src = inkUrl
// Prepare both assets together so the first visible frame contains the whole poster.
await Promise.all([
  document.fonts.load('900 100px "Poster Inter Tight"').catch(() => []),
  background.decode().catch(() => {}),
  inkAsset.decode().catch(() => {}),
])
// Bake the fixed brightness lift once, instead of filtering the texture every frame.
if (inkAsset.naturalWidth) {
  const texture = document.createElement('canvas')
  texture.width = texture.height = 512
  const textureContext = texture.getContext('2d')!
  textureContext.drawImage(inkAsset, 0, 0, 512, 512)
  const pixels = textureContext.getImageData(0, 0, 512, 512)
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i] += 51
    pixels.data[i + 1] += 51
    pixels.data[i + 2] += 51
  }
  textureContext.putImageData(pixels, 0, 0)
  const cachedTexture = new Image()
  cachedTexture.src = texture.toDataURL()
  await cachedTexture.decode()
  inkImage.setAttribute('href', cachedTexture.src)
}
const context = document.createElement('canvas').getContext('2d')!
const reference = alignmentReference
context.font = `900 ${reference.size}px "Poster Inter Tight"`
const referenceMetrics = context.measureText(reference.city)
const left = reference.x - referenceMetrics.actualBoundingBoxLeft
const right = reference.x + referenceMetrics.actualBoundingBoxRight

const family = '"Poster Inter Tight"'
let previousBottom = 0
const hoverRows: HoverRow[] = []
for (const [index, row] of cities.entries()) {
  context.font = `900 ${row.size}px ${family}`
  const originalMetrics = context.measureText(row.city)
  const originalTop = row.y - originalMetrics.actualBoundingBoxAscent
  const size = fitCitySize(context, row.city, right - left, family)
  const metrics = context.measureText(row.city)
  // Keep original positions where possible, moving a row only to avoid overlap.
  const top = index === 0 ? originalTop : Math.max(originalTop, previousBottom + 6)
  const y = top + metrics.actualBoundingBoxAscent
  previousBottom = y + metrics.actualBoundingBoxDescent
  const text = document.createElementNS(svgNS, 'text')
  text.setAttribute('y', String(y))
  text.setAttribute('font-size', String(size))
  text.setAttribute('fill', '#0b0b0a')
  text.style.fontKerning = 'none'
  text.style.fontVariantLigatures = 'none'
  context.font = `900 ${size}px ${family}`
  for (const glyph of alignCity(context, row.city, left, right)) {
    const span = document.createElementNS(svgNS, 'tspan')
    span.setAttribute('x', String(glyph.x))
    span.textContent = glyph.character
    text.append(span)
  }
  const group = document.createElementNS(svgNS, 'g')
  const word = document.createElementNS(svgNS, 'g')
  const ink = text.cloneNode(true) as SVGTextElement
  ink.setAttribute('fill', 'url(#stone-ink)')
  ink.setAttribute('stroke', '#080808')
  ink.setAttribute('stroke-width', '1.5')
  ink.setAttribute('stroke-linejoin', 'round')
  ink.setAttribute('paint-order', 'stroke fill')
  ink.setAttribute('opacity', '0')
  ink.setAttribute('aria-hidden', 'true')
  ink.setAttribute('pointer-events', 'none')
  word.append(text, ink)
  group.append(word)
  poster.append(group)
  hoverRows.push({ group, word, text, ink, top, bottom: previousBottom })
}
// Trim unused vertical margins so the whole type block fits larger without cropping.
const posterTop = hoverRows[0]!.top - 12
const posterHeight = previousBottom - posterTop + 12
poster.setAttribute('viewBox', `0 ${posterTop} 1024 ${posterHeight}`)
poster.style.setProperty('--poster-ratio', String(1024 / posterHeight))
// A stationary transparent surface prevents pointerleave when lettering slides away.
const hoverSurface = document.createElementNS(svgNS, 'rect')
hoverSurface.setAttribute('width', '1024')
hoverSurface.setAttribute('y', String(posterTop))
hoverSurface.setAttribute('height', String(posterHeight))
hoverSurface.setAttribute('fill', 'transparent')
hoverSurface.setAttribute('pointer-events', 'all')
hoverSurface.setAttribute('aria-hidden', 'true')
poster.insertBefore(hoverSurface, title.nextSibling)
document.querySelector<HTMLDivElement>('#app')!.append(poster)

const motion = installHoverMotion(poster, hoverRows, left, right)
installCountryMap(poster, hoverRows, motion)

requestAnimationFrame(() => { document.documentElement.classList.add('is-ready') })
