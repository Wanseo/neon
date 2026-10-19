import './style.css'
import backgroundUrl from './assets/blue-paper.png'
import { cities, alignmentReference } from './poster-layout'
import { alignCity, fitCitySize } from './align-city'
import { installHoverMotion, type HoverRow } from './hover-motion'

const svgNS = 'http://www.w3.org/2000/svg'
const poster = document.createElementNS(svgNS, 'svg')
poster.setAttribute('viewBox', '0 0 1024 1536')
poster.setAttribute('role', 'img')
poster.setAttribute('aria-labelledby', 'poster-title')
const title = document.createElementNS(svgNS, 'title')
title.id = 'poster-title'
title.textContent = `도시: ${cities.map(row => row.city).join(', ')}`
poster.append(title)

const background = new Image()
background.src = backgroundUrl
// Prepare both assets together so the first visible frame contains the whole poster.
await Promise.all([
  document.fonts.load('900 100px "Poster Inter Tight"').catch(() => []),
  background.decode().catch(() => {}),
])
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
  word.append(text)
  group.append(word)
  poster.append(group)
  hoverRows.push({ group, word, text, top, bottom: previousBottom })
}
const posterHeight = Math.max(1536, previousBottom + 26)
poster.setAttribute('viewBox', `0 0 1024 ${posterHeight}`)
poster.style.setProperty('--poster-ratio', String(1024 / posterHeight))
// A stationary transparent surface prevents pointerleave when lettering slides away.
const hoverSurface = document.createElementNS(svgNS, 'rect')
hoverSurface.setAttribute('width', '1024')
hoverSurface.setAttribute('height', String(posterHeight))
hoverSurface.setAttribute('fill', 'transparent')
hoverSurface.setAttribute('pointer-events', 'all')
hoverSurface.setAttribute('aria-hidden', 'true')
poster.insertBefore(hoverSurface, title.nextSibling)
document.querySelector<HTMLDivElement>('#app')!.append(poster)

installHoverMotion(poster, hoverRows, left, right)

requestAnimationFrame(() => { document.documentElement.classList.add('is-ready') })
