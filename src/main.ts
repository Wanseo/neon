import './style.css'
import { cities, dates } from './poster-layout'
import { alignCity } from './align-city'

const svgNS = 'http://www.w3.org/2000/svg'
const poster = document.createElementNS(svgNS, 'svg')
poster.setAttribute('viewBox', '0 0 1024 1536')
poster.setAttribute('role', 'img')
poster.setAttribute('aria-labelledby', 'poster-title')
const title = document.createElementNS(svgNS, 'title')
title.id = 'poster-title'
title.textContent = '공연 도시와 날짜: Graz부터 Paris까지'
poster.append(title)

await document.fonts.load('900 100px "Poster Inter Tight"')
const context = document.createElement('canvas').getContext('2d')!
const reference = cities[0]
context.font = `900 ${reference.size}px "Poster Inter Tight"`
const referenceMetrics = context.measureText(reference.city)
const left = reference.x - referenceMetrics.actualBoundingBoxLeft
const right = reference.x + referenceMetrics.actualBoundingBoxRight

for (const row of cities) {
  const text = document.createElementNS(svgNS, 'text')
  text.setAttribute('y', String(row.y))
  text.setAttribute('font-size', String(row.size))
  text.setAttribute('fill', row.lime ? '#a8f000' : '#0b0b0a')
  if (row === reference) {
    text.setAttribute('x', String(row.x))
    text.textContent = row.city
  } else {
    text.style.fontKerning = 'none'
    text.style.fontVariantLigatures = 'none'
    context.font = `900 ${row.size}px "Poster Inter Tight"`
    for (const glyph of alignCity(context, row.city, left, right)) {
      const span = document.createElementNS(svgNS, 'tspan')
      span.setAttribute('x', String(glyph.x))
      span.textContent = glyph.character
      text.append(span)
    }
  }
  poster.append(text)
}
for (const row of dates) {
  const text = document.createElementNS(svgNS, 'text')
  text.setAttribute('x', String(row.x))
  text.setAttribute('y', String(row.y))
  text.setAttribute('font-size', String(row.size))
  text.setAttribute('fill', row.lime ? '#a8f000' : '#0b0b0a')
  text.textContent = row.text
  poster.append(text)
}
document.querySelector<HTMLDivElement>('#app')!.append(poster)
