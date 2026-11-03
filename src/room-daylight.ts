import * as THREE from 'three'

const seoulTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t) }
export function getRoomTime(date = new Date()) {
  const parts = seoulTime.formatToParts(date)
  const hour = Number(parts.find(p => p.type === 'hour')!.value) + Number(parts.find(p => p.type === 'minute')!.value) / 60
  const daylight = smooth(hour - 6) * (1 - smooth(hour - 18))
  const twilight = Math.max(0, 1 - Math.abs(hour - 6.5) / 1.5, 1 - Math.abs(hour - 18.5) / 1.5)
  return { hour, daylight, twilight, phase: daylight < .1 ? 'night' : daylight < .9 ? 'twilight' : 'day' }
}

export function createRoomDaylight(canvas: HTMLCanvasElement, ambient: THREE.HemisphereLight, sun: THREE.DirectionalLight, fill: THREE.PointLight, scene: THREE.Scene) {
  const ctx = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
  const top = new THREE.Color(), middle = new THREE.Color(), bottom = new THREE.Color()
  const nightTop = new THREE.Color('#0b1730'), dayTop = new THREE.Color('#b6d6e3')
  const nightMiddle = new THREE.Color('#1d3047'), dayMiddle = new THREE.Color('#e4e5d1')
  const nightBottom = new THREE.Color('#354251'), dayBottom = new THREE.Color('#eee0be')
  const backgroundNight = new THREE.Color('#807869'), backgroundDay = new THREE.Color('#e8ddcc')
  let lastMinute = -1, nextCheck = 0
  function refresh(force = false) {
    const date = new Date(), minute = Math.floor(date.getTime() / 60000)
    if (!force && minute === lastMinute) return
    lastMinute = minute
    const { hour, daylight, twilight, phase } = getRoomTime(date)
    document.body.dataset.timeOfDay = phase
    top.copy(nightTop).lerp(dayTop, daylight).lerp(new THREE.Color('#b88eac'), twilight * .35)
    middle.copy(nightMiddle).lerp(dayMiddle, daylight).lerp(new THREE.Color('#edb28f'), twilight * .5)
    bottom.copy(nightBottom).lerp(dayBottom, daylight).lerp(new THREE.Color('#f1bf86'), twilight * .5)
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, `#${top.getHexString()}`); gradient.addColorStop(.55, `#${middle.getHexString()}`); gradient.addColorStop(1, `#${bottom.getHexString()}`)
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512)
    if (daylight < .95) {
      ctx.globalAlpha = (1 - daylight) * .85
      for (let i = 0; i < 65; i++) {
        const x = (i * 137.508 + 31) % 512, y = 20 + (i * 83.27) % 285
        ctx.fillStyle = i % 5 ? '#e3e9f0' : '#fbe5b1'; ctx.beginPath(); ctx.arc(x, y, i % 7 === 0 ? 1.4 : .7, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1 - daylight
      ctx.fillStyle = '#f5e9c8'; ctx.beginPath(); ctx.arc(355, 130, 23, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = `#${top.getHexString()}`; ctx.beginPath(); ctx.arc(365, 123, 22, 0, Math.PI * 2); ctx.fill()
    }
    if (daylight > .03) {
      ctx.globalAlpha = daylight
      const solarProgress = Math.max(0, Math.min(1, (hour - 6) / 13))
      ctx.fillStyle = '#fff2c7'; ctx.beginPath(); ctx.arc(90 + solarProgress * 340, 315 - Math.sin(solarProgress * Math.PI) * 205, 29, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    for (let i = 0; i < 3; i++) {
      const color = new THREE.Color(['#243a3b', '#1a2d30', '#142629'][i]).lerp(new THREE.Color(['#afb8a0', '#929f8d', '#7e9380'][i]), daylight)
      ctx.fillStyle = `#${color.getHexString()}`; ctx.beginPath(); ctx.moveTo(0, 512)
      for (let x = 0; x <= 512; x += 4) ctx.lineTo(x, 355 + i * 35 + Math.sin(x * .011 + i * 2) * 28)
      ctx.lineTo(512, 512); ctx.fill()
    }
    texture.needsUpdate = true
    ambient.intensity = 1.15 + daylight * 1.15
    ambient.color.set(daylight > .5 ? '#fff2db' : '#d2d8e9')
    sun.intensity = .06 + daylight * 3.34
    sun.color.set(new THREE.Color('#ffd0a0').lerp(new THREE.Color('#ffe4bc'), daylight * (1 - twilight)))
    fill.intensity = 10 + (1 - daylight) * 22
    fill.color.set(daylight > .5 ? '#ffe2bc' : '#ffd29b')
    scene.background = backgroundNight.clone().lerp(backgroundDay, daylight)
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(scene.background)
  }
  refresh(true)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(true) })
  return { texture, update(now: number) { if (now < nextCheck) return; nextCheck = now + 1000; refresh() } }
}
