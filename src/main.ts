import './style.css'
import frontUrl from './assets/mint-hoodie-front-slouched.png'
import backUrl from './assets/mint-hoodie-back.png'
import walkingUrl from './assets/mint-hoodie-walk-slouched.png'
import { walkRoute } from './walk-route'
import { createMusicPlayer } from './music'

const app = document.querySelector<HTMLDivElement>('#app')!
app.className = 'reference-walk'
const music = createMusicPlayer(app)
const photos = walkRoute.map(place => {
  const frame = document.createElement('div')
  frame.className = 'route-photo'
  const image = new Image()
  image.src = place.image; image.alt = ''; image.draggable = false
  image.addEventListener('load', () => paint())
  frame.append(image); app.append(frame)
  return frame
})
const character = document.createElement('div')
character.className = 'route-character'
character.setAttribute('role', 'button'); character.tabIndex = 0
character.setAttribute('aria-label', '픽셀 캐릭터와 골목 걷기 시작 또는 일시 정지')
character.innerHTML = `<img class="route-front" src="${frontUrl}" alt="" draggable="false"><img class="route-back" src="${backUrl}" alt="" draggable="false"><div class="route-side"><img src="${walkingUrl}" alt="" draggable="false"></div>`
const heading = document.createElement('header')
heading.className = 'location'
heading.innerHTML = '<p class="journey">연희동 · 행복한나눔 인근</p><h1></h1><p class="place-description"></p>'
const progress = document.createElement('div')
progress.className = 'route-progress'
progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-label', '사진 속 산책 진행률')
progress.setAttribute('aria-valuemin', '0'); progress.setAttribute('aria-valuemax', '100')
const hint = document.createElement('p')
hint.className = 'keyboard-hint'
hint.textContent = '↑ ↓ 앞뒤 · ← → 좌우 · SPACE 걷기 / 멈추기'
const controls = document.createElement('div')
controls.className = 'walk-actions'
controls.innerHTML = '<button class="walk-toggle" type="button">클릭해서 골목 안으로 걷기</button><button class="walk-reset" type="button">처음으로</button>'
const touch = document.createElement('div')
touch.className = 'touch-controls'
touch.innerHTML = '<button data-key="ArrowLeft" aria-label="왼쪽">←</button><button data-key="ArrowUp" aria-label="앞으로">↑</button><button data-key="ArrowDown" aria-label="뒤로">↓</button><button data-key="ArrowRight" aria-label="오른쪽">→</button>'
app.append(character, heading, progress, hint, controls, touch)
const toggle = controls.querySelector<HTMLButtonElement>('.walk-toggle')!
const held = new Set<string>()
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
let position = 0, lateral = 0, started = false, automatic = false
let frame = 0, lastTime = 0, stepTime = 0, stage = -1, lastPercent = -1
let initialFacing = 0
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const axis = (positive: string[], negative: string[]) => Number(positive.some(k => held.has(k))) - Number(negative.some(k => held.has(k)))

function paint(walking = false) {
  const index = Math.min(walkRoute.length - 1, Math.floor(position))
  const t = clamp(position - index)
  const scene = walkRoute[index]!
  const fade = reducedMotion.matches ? 0 : clamp((t - .82) / .18)
  photos.forEach((photo, i) => {
    const plate = walkRoute[i]!
    const image = photo.querySelector('img')!
    const imageWidth = image.naturalWidth || 1200
    const panelHeight = (image.naturalHeight || 900 * plate.rows) / plate.rows
    const fit = Math.max(innerWidth / imageWidth, innerHeight / panelHeight)
    image.style.width = `${imageWidth * fit}px`
    image.style.height = `${panelHeight * plate.rows * fit}px`
    image.style.left = `${(innerWidth - imageWidth * fit) * plate.focus}px`
    image.style.top = `${(innerHeight - panelHeight * fit) / 2 - plate.row * panelHeight * fit}px`
    photo.style.zIndex = String(i === index + 1 ? 1 : 0)
    photo.style.opacity = String(i === index ? 1 : i === index + 1 ? fade : 0)
    const local = i === index ? t : 0
    const pan = walkRoute[i]!.pan
    photo.style.transform = `scale(${1 + pan * 2}) translateX(${pan ? (local - .5) * pan * 100 : 0}%)`
  })
  const bounce = walking && !reducedMotion.matches ? -Math.abs(Math.sin(stepTime * 11)) * 2 : 0
  const scale = started ? mix(scene.scale[0], scene.scale[1], t) : 1
  // Keep the actor on the visible pavement even when the photo is cropped on mobile.
  let px = started ? mix(scene.start[0], scene.end[0], t) : .5
  if (innerWidth / innerHeight < 1 && scene.name === '연희로27다길') px = mix(.53, .43, t)
  const py = started ? mix(scene.start[1], scene.end[1], t) : .88
  const side = initialFacing !== 0 || (started && scene.view === 'side')
  character.dataset.view = side ? 'side' : started ? 'back' : 'front'
  const edge = character.offsetWidth * scale / innerWidth / 2 + .02
  character.style.left = `${clamp(px + lateral * .07, edge, 1 - edge) * 100}%`
  character.style.top = `${py * 100}%`
  const sway = walking && !reducedMotion.matches ? Math.sin(stepTime * 8) * .7 : 0
  character.style.transform = `translate(-50%, -100%) scale(${scale}) translateY(${bounce}px) rotate(${sway}deg)`
  const sideHolder = character.querySelector<HTMLElement>('.route-side')!
  sideHolder.style.transform = `scaleX(${initialFacing || (started ? -1 : 1)})`
  const sprite = walking && !reducedMotion.matches ? [1, 2, 3, 2][Math.floor(stepTime * 8) % 4]! : 0
  sideHolder.querySelector('img')!.style.transform = `translateX(${-sprite * 25}%)`
  if (stage !== index) {
    stage = index
    heading.querySelector('h1')!.textContent = scene.name
    heading.querySelector('.place-description')!.textContent = scene.description
  }
  const percent = Math.round(position / walkRoute.length * 100)
  if (percent !== lastPercent) {
    lastPercent = percent
    progress.style.setProperty('--progress', `${percent}%`)
    progress.setAttribute('aria-valuenow', String(percent))
    progress.setAttribute('aria-valuetext', `${scene.name}, ${percent}%`)
  }
  app.dataset.stage = String(index); app.dataset.position = position.toFixed(4)
  app.dataset.lateral = lateral.toFixed(3); app.dataset.walking = String(walking)
  toggle.textContent = !started ? '클릭해서 골목 안으로 걷기' : position >= walkRoute.length ? '여기까지 걸었어요 · 다시 걷기' : automatic ? '일시 정지' : '계속 걷기'
}
function ensureFrame() { if (!frame) frame = requestAnimationFrame(update) }
function pxForMovement() {
  if (!started) return .5
  const index = Math.min(walkRoute.length - 1, Math.floor(position))
  const scene = walkRoute[index]!
  const t = clamp(position - index)
  if (innerWidth / innerHeight < 1 && scene.name === '연희로27다길') return mix(.53, .43, t)
  return mix(scene.start[0], scene.end[0], t)
}
function update(time: number) {
  frame = 0
  const dt = lastTime ? clamp((time - lastTime) / 1000, 0, .04) : 1 / 60
  lastTime = time
  const forward = axis(['ArrowUp', 'KeyW'], ['ArrowDown', 'KeyS'])
  const sideways = axis(['ArrowRight', 'KeyD'], ['ArrowLeft', 'KeyA'])
  const previous = position, previousLateral = lateral
  if (forward) { started = true; if (!sideways) initialFacing = 0 }
  const speed = forward && sideways ? Math.SQRT1_2 : 1
  position = clamp(position + (automatic ? .105 : forward * .13 * speed) * dt, 0, walkRoute.length)
  const sceneIndex = Math.min(walkRoute.length - 1, Math.floor(position))
  const scene = walkRoute[sceneIndex]!
  const size = started ? mix(scene.scale[0], scene.scale[1], clamp(position - sceneIndex)) : 1
  const edge = character.offsetWidth * size / innerWidth / 2 + .02
  lateral = clamp(lateral + sideways * dt * 2.8 * speed, (edge - pxForMovement()) / .07, (1 - edge - pxForMovement()) / .07)
  if (sideways) initialFacing = sideways
  if (position >= walkRoute.length) automatic = false
  const walking = position !== previous || lateral !== previousLateral
  if (walking) stepTime += dt
  paint(walking)
  if (automatic || held.size) ensureFrame()
  else lastTime = 0
}
function toggleWalk() {
  if (position >= walkRoute.length) { position = 0; lateral = 0 }
  started = true; automatic = !automatic
  if (automatic) initialFacing = 0
  if (automatic) music.start()
  paint(); if (automatic) ensureFrame()
}
function stopInput() {
  held.clear(); automatic = false
  cancelAnimationFrame(frame); frame = 0; lastTime = 0
  paint()
}
function reset() {
  stopInput(); position = 0; lateral = 0; started = false; initialFacing = 0; stepTime = 0
  paint()
}
function press(key: string) {
  automatic = false
  // Turn on keydown, before the first movement frame, even at a screen edge.
  if (key === 'ArrowLeft' || key === 'KeyA') {
    initialFacing = -1
    held.delete('ArrowRight'); held.delete('KeyD')
  } else if (key === 'ArrowRight' || key === 'KeyD') {
    initialFacing = 1
    held.delete('ArrowLeft'); held.delete('KeyA')
  }
  held.add(key)
  paint()
  ensureFrame()
}
toggle.addEventListener('click', toggleWalk)
controls.querySelector('.walk-reset')!.addEventListener('click', reset)
character.addEventListener('click', toggleWalk)
character.addEventListener('keydown', event => {
  if (event.code === 'Enter') { event.preventDefault(); toggleWalk() }
})
window.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))) return
  if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD','Space'].includes(event.code)) return
  if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return
  event.preventDefault()
  if (event.code === 'Space') { if (!event.repeat) toggleWalk(); return }
  if (event.code === 'ArrowDown' && !started) { initialFacing = 0; stopInput(); return }
  press(event.code)
})
window.addEventListener('keyup', event => { held.delete(event.code) })
for (const button of touch.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); press(button.dataset.key!) })
  for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type, () => held.delete(button.dataset.key!))
}
window.addEventListener('blur', stopInput)
document.addEventListener('visibilitychange', () => { if (document.hidden) stopInput() })
window.addEventListener('resize', () => paint())
paint()
