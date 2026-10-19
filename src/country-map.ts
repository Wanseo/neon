import mapData from './data/maps.json'
import { cities } from './poster-layout'
import { cityInfo } from './data/city-info'
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
    <a class="map-museum" target="_blank" rel="noreferrer"></a>
    <a class="map-credit" href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames · Natural Earth</a>`
  const clock = document.createElement('time')
  clock.className = 'city-clock'
  clock.hidden = true
  document.querySelector('#app')!.append(clock)
  document.querySelector('#app')!.append(panel)
  const outline = panel.querySelector<SVGGElement>('.country-outline')!
  const marker = panel.querySelector<SVGGElement>('.city-marker')!
  const close = panel.querySelector<HTMLButtonElement>('.map-close')!
  let selected = -1
  let countryCode = ''
  let clockTimer: ReturnType<typeof setInterval> | undefined
  let clockFormat: Intl.DateTimeFormat | null = null
  function updateClock() {
    if (!clockFormat || document.hidden) return
    const now = new Date()
    clock.dateTime = now.toISOString()
    clock.textContent = clockFormat.format(now)
  }
  document.addEventListener('visibilitychange', updateClock)
  window.addEventListener('pagehide', () => clearInterval(clockTimer))
  window.addEventListener('pageshow', () => {
    if (selected >= 0) { clearInterval(clockTimer); updateClock(); clockTimer = setInterval(updateClock, 1000) }
  })

  function positionPanel(index: number) {
    const bounds = rows[index]!.text.getBoundingClientRect()
    const right = bounds.right
    const left = right + 12
    panel.style.setProperty('--map-left', `${left}px`)
    panel.style.setProperty('--map-width', `${Math.max(0, Math.min(260, window.innerWidth - left - 12))}px`)
    clock.style.right = `${window.innerWidth - bounds.left + 18}px`
    clock.style.fontSize = `${poster.getBoundingClientRect().width / 1024 * 47}px`
  }
  window.addEventListener('resize', () => {
    if (selected >= 0) positionPanel(selected)
  })

  function show(index: number) {
    if (selected === index) { hide(); return }
    const row = cities[index]!
    const info = cityInfo[row.city]
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
    const museum = panel.querySelector<HTMLAnchorElement>('.map-museum')!
    museum.textContent = info.museum
    museum.href = info.url
    museum.setAttribute('aria-label', `${info.museum} 공식 홈페이지 (새 탭)`)
    clockFormat = new Intl.DateTimeFormat('en-GB', { timeZone: info.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    clock.setAttribute('aria-label', `${row.city} 현지 시간`)
    clock.hidden = false
    updateClock()
    clearInterval(clockTimer)
    clockTimer = setInterval(updateClock, 1000)
    rows.forEach((item, i) => item.group.setAttribute('aria-pressed', String(i === index)))
    selected = index
    positionPanel(index)
    panel.inert = false
    panel.setAttribute('aria-hidden', 'false')
    document.body.classList.add('map-open')
    motion.select(index)
  }
  function hide() {
    clock.hidden = true
    clearInterval(clockTimer)
    clockFormat = null
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
