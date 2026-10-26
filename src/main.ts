import './style.css'
import characterUrl from './assets/mint-hoodie-character.png'

const character = document.createElement('img')
character.className = 'pixel-character'
character.src = characterUrl
character.alt = '파란 후드를 뒤집어쓰고 민트색 앞머리와 안경, 검정 바지를 착용한 픽셀 캐릭터'
character.draggable = false
character.decoding = 'sync'
document.querySelector<HTMLDivElement>('#app')!.append(character)

const held = new Set<string>()
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
let x = 0, facing = 1, frame = 0, lastTime = 0, stepTime = 0
let limit = 0
const direction = () => Number(held.has('ArrowRight') || held.has('KeyD')) - Number(held.has('ArrowLeft') || held.has('KeyA'))
function paint(walking = false) {
  const bounce = walking && !reducedMotion.matches ? -Math.abs(Math.sin(stepTime * 12)) * 2 : 0
  character.style.transform = `translate3d(${x}px, ${bounce}px, 0) scaleX(${facing})`
}
function measure() {
  limit = Math.max(0, (innerWidth - character.getBoundingClientRect().width) / 2 - 12)
  x = Math.max(-limit, Math.min(limit, x))
  paint()
}
function move(time: number) {
  frame = 0
  const dt = lastTime ? Math.min((time - lastTime) / 1000, .04) : 1 / 60
  lastTime = time
  const axis = direction()
  if (!axis) { lastTime = 0; stepTime = 0; paint(); return }
  facing = axis
  const previous = x
  x = Math.max(-limit, Math.min(limit, x + axis * 240 * dt))
  stepTime += dt
  paint(x !== previous)
  frame = requestAnimationFrame(move)
}
function release() {
  held.clear()
  cancelAnimationFrame(frame)
  frame = 0; lastTime = 0; stepTime = 0
  paint()
}
window.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code) || event.metaKey || event.ctrlKey || event.altKey) return
  if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return
  event.preventDefault()
  held.add(event.code)
  if (!frame) frame = requestAnimationFrame(move)
})
window.addEventListener('keyup', event => {
  held.delete(event.code)
  if (!direction()) release()
})
window.addEventListener('blur', release)
document.addEventListener('visibilitychange', () => { if (document.hidden) release() })
window.addEventListener('resize', measure)
character.addEventListener('load', measure)
new ResizeObserver(measure).observe(character)
