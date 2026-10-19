import './style.css'
import { cities, dates } from './poster-layout'

const svgNS = 'http://www.w3.org/2000/svg'
const poster = document.createElementNS(svgNS, 'svg')
poster.setAttribute('viewBox', '0 0 1024 1536')
poster.setAttribute('role', 'img')
poster.setAttribute('aria-labelledby', 'poster-title')
const title = document.createElementNS(svgNS, 'title')
title.id = 'poster-title'
title.textContent = '공연 도시와 날짜: Graz부터 Paris까지'
poster.append(title)
for (const item of [...cities.map(row => ({ ...row, text: row.city })), ...dates]) {
  const text = document.createElementNS(svgNS, 'text')
  text.setAttribute('x', String(item.x))
  text.setAttribute('y', String(item.y))
  text.setAttribute('font-size', String(item.size))
  text.setAttribute('fill', item.lime ? '#a8f000' : '#0b0b0a')
  text.textContent = item.text
  poster.append(text)
}
document.querySelector<HTMLDivElement>('#app')!.append(poster)
