import './style.css'
import { createStreet3D } from './street-3d'
import characterUrl from './assets/mint-hoodie-character.png'
import walkingUrl from './assets/mint-hoodie-walk.png'
import bridgeUrl from './assets/route-bridge.jpg'
import mapoUrl from './assets/route-mapo.jpg'
import roadUrl from './assets/route-yeonhui-road.jpg'
import yeonhuiUrl from './assets/route-yeonhui.jpg'

const locations = [
  { name: '양화대교 북단', subtitle: '한강을 건너, 동네로', image: bridgeUrl },
  { name: '합정 · 망원 일대', subtitle: '낮은 건물과 저녁 불빛 사이', image: mapoUrl },
  { name: '연희로', subtitle: '연희동으로 이어지는 길', image: roadUrl },
  { name: '연희동', subtitle: '담장 너머로 저녁이 내려앉는 곳', image: yeonhuiUrl },
]
const app = document.querySelector<HTMLDivElement>('#app')!
const world = document.createElement('div')
world.className = 'street-world'
world.setAttribute('aria-hidden', 'true')
for (const place of locations) {
  const scene = document.createElement('section')
  scene.className = 'street-section'
  const image = document.createElement('img')
  image.src = place.image; image.alt = ''; image.draggable = false
  scene.append(image); world.append(scene)
}
const character = document.createElement('div')
character.className = 'pixel-character'
character.setAttribute('role', 'img')
character.setAttribute('aria-label', '민트색 머리와 파란 후드 차림으로 연희동을 향해 걷는 픽셀 캐릭터')
const front = document.createElement('img')
front.className = 'character-front'
front.src = characterUrl; front.alt = ''; front.draggable = false
const walkSheet = document.createElement('img')
walkSheet.className = 'character-walk'
walkSheet.src = walkingUrl; walkSheet.alt = ''; walkSheet.draggable = false
character.append(front, walkSheet)
const heading = document.createElement('header')
heading.className = 'location'
heading.innerHTML = '<p class="journey">양화대교에서 연희동까지</p><h1></h1><p class="place-description"></p>'
const progress = document.createElement('div')
progress.className = 'route-progress'
progress.setAttribute('aria-label', '산책 경로 진행률')
progress.setAttribute('role', 'progressbar')
progress.setAttribute('aria-valuemin', '0'); progress.setAttribute('aria-valuemax', '100')
const hint = document.createElement('p')
hint.className = 'keyboard-hint'; hint.textContent = '← → / A D  이동'
const touch = document.createElement('div')
touch.className = 'touch-controls'
touch.innerHTML = '<button type="button" data-key="ArrowLeft" aria-label="왼쪽으로 이동">←</button><button type="button" data-key="ArrowRight" aria-label="오른쪽으로 이동">→</button>'
app.append(world, character, heading, progress, hint, touch)
let street3D: ReturnType<typeof createStreet3D> | undefined
try {
  street3D = createStreet3D(app)
  app.classList.add('has-3d-street')
} catch { /* Keep the illustrated route available without WebGL. */ }

const held = new Set<string>()
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
let x = innerWidth * .23, facing = 1, frame = 0, lastTime = 0, stepTime = 0
let worldWidth = 0, sectionWidth = 0, characterWidth = 0, stage = -1, progressValue = -1
let hasTurned = false, drawnSprite = -1
const direction = () => Number(held.has('ArrowRight') || held.has('KeyD')) - Number(held.has('ArrowLeft') || held.has('KeyA'))
function paint(walking = false) {
  const camera = Math.max(0, Math.min(worldWidth - innerWidth, x - innerWidth * .45))
  const bounce = walking && !reducedMotion.matches ? -Math.abs(Math.sin(stepTime * 12)) * 2 : 0
  const projected = street3D?.render(x, camera, sectionWidth, worldWidth)
  const screenX = projected ? Math.max(characterWidth / 2 + 20, Math.min(innerWidth - characterWidth / 2 - 20, projected.x)) : x - camera
  if (projected) character.style.bottom = `${innerHeight - projected.y - 8}px`
  world.style.transform = `translate3d(${-camera}px, 0, 0)`
  character.style.transform = `translate3d(${screenX - characterWidth / 2}px, ${bounce}px, 0) scaleX(${facing})`
  character.classList.toggle('is-side', hasTurned && walkSheet.complete && walkSheet.naturalWidth > 0)
  const sprite = walking && !reducedMotion.matches ? [1, 2, 3, 2][Math.floor(stepTime * 8) % 4]! : 0
  if (sprite !== drawnSprite) {
    walkSheet.style.transform = `translateX(${-sprite * 25}%)`
    drawnSprite = sprite
  }
  const nextStage = Math.min(locations.length - 1, Math.max(0, Math.floor(x / sectionWidth)))
  if (nextStage !== stage) {
    stage = nextStage
    heading.querySelector('h1')!.textContent = locations[stage]!.name
    heading.querySelector('.place-description')!.textContent = locations[stage]!.subtitle
  }
  const percent = Math.round(x / Math.max(1, worldWidth - characterWidth / 2 - 20) * 100)
  if (percent !== progressValue) {
    progressValue = percent
    progress.style.setProperty('--progress', `${percent}%`)
    progress.setAttribute('aria-valuenow', String(percent))
    progress.setAttribute('aria-valuetext', `${locations[stage]!.name}, ${percent}%`)
  }
}
function measure() {
  const previousWidth = worldWidth
  const fraction = previousWidth ? x / previousWidth : 0
  sectionWidth = Math.max(innerWidth, innerHeight * 2.5)
  worldWidth = sectionWidth * locations.length
  app.style.setProperty('--section-width', `${sectionWidth}px`)
  characterWidth = character.getBoundingClientRect().width
  if (previousWidth) x = fraction * worldWidth
  x = Math.max(characterWidth / 2 + 20, Math.min(worldWidth - characterWidth / 2 - 20, x))
  paint()
}
function move(time: number) {
  frame = 0
  const dt = lastTime ? Math.min((time - lastTime) / 1000, .04) : 1 / 60
  lastTime = time
  const axis = direction()
  if (!axis) { lastTime = 0; stepTime = 0; paint(); return }
  facing = axis
  hasTurned = true
  const previous = x
  x = Math.max(characterWidth / 2 + 20, Math.min(worldWidth - characterWidth / 2 - 20, x + axis * 290 * dt))
  stepTime += dt
  paint(x !== previous)
  frame = requestAnimationFrame(move)
}
function release() {
  held.clear(); cancelAnimationFrame(frame)
  frame = 0; lastTime = 0; stepTime = 0; paint()
}
function press(key: string) { held.add(key); if (!frame) frame = requestAnimationFrame(move) }
window.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code) || event.metaKey || event.ctrlKey || event.altKey) return
  if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return
  event.preventDefault(); press(event.code)
})
window.addEventListener('keyup', event => { held.delete(event.code); if (!held.size) release() })
for (const button of touch.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('pointerdown', event => { button.setPointerCapture(event.pointerId); press(button.dataset.key!) })
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => { held.delete(button.dataset.key!); if (!held.size) release() })
}
window.addEventListener('blur', release)
document.addEventListener('visibilitychange', () => { if (document.hidden) release() })
window.addEventListener('resize', measure)
front.addEventListener('load', measure)
walkSheet.addEventListener('load', () => paint())
new ResizeObserver(measure).observe(character)
measure()
