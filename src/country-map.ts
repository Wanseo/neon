import mapData from './data/maps.json'
import { cities } from './poster-layout'
import type { HoverRow } from './hover-motion'

type CityKey = keyof typeof mapData.cities
type CountryKey = keyof typeof mapData.countries
const ns = 'http://www.w3.org/2000/svg'

export function installCountryMap(poster: SVGSVGElement, rows: HoverRow[], motion: { select: (index: number) => void; refreshGeometry: () => void }) {
  const panel = document.createElement('section')
  panel.className = 'country-panel'
  panel.setAttribute('aria-label', '선택한 도시의 국가와 위치')
  panel.setAttribute('aria-hidden', 'true')
  panel.inert = true
  panel.innerHTML = `<button class="map-close" type="button" aria-label="지도 닫기">×</button>
    <svg class="country-map" viewBox="0 0 600 600" role="img" aria-labelledby="map-title">
      <title id="map-title"></title><g class="country-outline"></g>
      <g class="city-marker"><rect x="-6" y="-6" width="12" height="12" /></g>
    </svg><div class="map-caption"><span class="map-country"></span><span class="map-city"></span></div>
    <a class="map-credit" href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames · Natural Earth</a>`
  document.querySelector('#app')!.append(panel)
  const outline = panel.querySelector<SVGGElement>('.country-outline')!
  const marker = panel.querySelector<SVGGElement>('.city-marker')!
  const close = panel.querySelector<HTMLButtonElement>('.map-close')!
  let selected = -1
  let countryCode = ''

  function show(index: number) {
    if (selected === index) { hide(); return }
    const row = cities[index]!
    const city = mapData.cities[row.city as CityKey]
    if (!city) return
    const country = mapData.countries[city.country as CountryKey]
    if (countryCode !== city.country) {
      const paths = country.paths.map(d => {
        const path = document.createElementNS(ns, 'path')
        path.setAttribute('d', d)
        path.setAttribute('pathLength', '1')
        return path
      })
      outline.replaceChildren(...paths)
      countryCode = city.country
    }
    marker.style.transform = `translate(${city.x}px, ${city.y}px)`
    panel.querySelector('#map-title')!.textContent = `${country.name}, ${row.city} 위치`
    panel.querySelector('.map-country')!.textContent = country.name === 'United States of America' ? 'United States' : country.name
    panel.querySelector('.map-city')!.textContent = row.city
    rows.forEach((item, i) => item.group.setAttribute('aria-pressed', String(i === index)))
    selected = index
    panel.inert = false
    panel.setAttribute('aria-hidden', 'false')
    document.body.classList.add('map-open')
    motion.select(index)
  }
  function hide() {
    document.body.classList.remove('map-open')
    panel.setAttribute('aria-hidden', 'true')
    panel.inert = true
    rows.forEach(item => item.group.setAttribute('aria-pressed', 'false'))
    const previous = selected
    selected = -1
    countryCode = ''
    motion.select(-1)
    if (document.activeElement === close && previous >= 0) rows[previous]!.group.focus({ preventScroll: true })
  }
  rows.forEach((row, index) => {
    row.group.setAttribute('role', 'button')
    row.group.setAttribute('tabindex', '0')
    row.group.setAttribute('aria-label', `${cities[index]!.city} 지도 보기`)
    row.group.setAttribute('aria-pressed', 'false')
    row.group.addEventListener('click', () => show(index))
    row.group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(index) }
    })
  })
  close.addEventListener('click', hide)
  window.addEventListener('keydown', event => { if (event.key === 'Escape' && selected >= 0) hide() })
  poster.addEventListener('transitionend', motion.refreshGeometry)
}
