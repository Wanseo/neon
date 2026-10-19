import './style.css'
import { rows } from './poster-layout'
import { fitText } from './fit-text'

const svgNS = 'http://www.w3.org/2000/svg'
const poster = document.createElementNS(svgNS, 'svg')
poster.setAttribute('viewBox', '0 0 1024 1536')
poster.setAttribute('role', 'img')
poster.setAttribute('aria-labelledby', 'poster-title')
const title = document.createElementNS(svgNS, 'title')
title.id = 'poster-title'
title.textContent = '공연 도시와 날짜: Graz부터 Paris까지'
poster.append(title)

// Measure the actual loaded font before fitting glyphs, avoiding fallback-font widths.
await document.fonts.load('900 100px "Poster Inter Tight"')
const context = document.createElement('canvas').getContext('2d')!
context.font = '900 100px "Poster Inter Tight"'
for (const row of rows) {
  const metrics = context.measureText(row.text)
  const { scaleX, scaleY, offsetX, offsetY } = fitText(metrics, row.box)
  const text = document.createElementNS(svgNS, 'text')
  text.setAttribute('x', '0')
  text.setAttribute('y', '0')
  text.setAttribute('font-size', '100')
  text.setAttribute('transform', `matrix(${scaleX} 0 0 ${scaleY} ${offsetX} ${offsetY})`)
  text.setAttribute('fill', row.lime ? '#a8f000' : '#0b0b0a')
  text.textContent = row.text
  poster.append(text)
}
document.querySelector<HTMLDivElement>('#app')!.append(poster)
