import * as THREE from 'three'
import type { RoomMotion } from './room-presence'

type Walker = { actor: THREE.Group; seat: THREE.Group; label: HTMLElement; target: THREE.Vector3; yaw: number; standing: boolean; moving: boolean; updated: number; seq: number; limbs: { object: THREE.Object3D; position: THREE.Vector3; rotation: THREE.Euler; side: number; leg: boolean }[] }
export function createRoomMovement(selfId: string, send: (motion: RoomMotion) => void, cameraYaw: () => number) {
  const walkers = new Map<string, Walker>(), keys = new Set<string>()
  let stickX = 0, stickY = 0, lastFrame = 0, lastSent = 0, sequence = 0, wasMoving = false
  const root = document.createElement('section'); root.className = 'movement-controls'; root.setAttribute('aria-label', '내 캐릭터 이동')
  root.innerHTML = '<button id="toggle-walking" type="button" aria-pressed="false">일어나기 ↗</button><p id="movement-hint" role="status">일어나 방 안을 산책해요</p><div class="walk-stick" role="group" aria-label="드래그해서 이동"><span class="stick-arrow north">↑</span><span class="stick-arrow south">↓</span><span class="stick-arrow west">←</span><span class="stick-arrow east">→</span><i></i></div>'
  document.querySelector('#app')!.append(root)
  const button = root.querySelector<HTMLButtonElement>('button')!, hint = root.querySelector('p')!, stick = root.querySelector<HTMLElement>('.walk-stick')!, knob = stick.querySelector('i')!
  const isBlocked = () => !!document.querySelector('dialog[open]') || document.hidden
  function refresh() {
    const standing = !!walkers.get(selfId)?.standing
    root.classList.toggle('is-walking', standing); document.body.classList.toggle('room-walking', standing)
    button.textContent = standing ? '자리에 앉기 ↙' : '일어나기 ↗'; button.setAttribute('aria-pressed', String(standing))
    hint.textContent = standing ? 'WASD · 방향키 / 조이스틱으로 이동' : '일어나 방 안을 산책해요'
  }
  function publish() {
    const w = walkers.get(selfId); if (!w) return
    send({ x: w.target.x, z: w.target.z, yaw: w.yaw, standing: w.standing, moving: w.moving, seq: ++sequence }); lastSent = performance.now()
  }
  function stand() {
    const w = walkers.get(selfId); if (!w || w.standing) return
    w.standing = true; w.target.copy(w.seat.position).multiplyScalar(1.4); w.target.y = 0; w.yaw = w.seat.rotation.y
    w.actor.position.copy(w.target); refresh(); publish()
  }
  button.addEventListener('click', () => {
    if (isBlocked()) return
    const w = walkers.get(selfId); if (!w) return
    if (!w.standing) { stand(); return }
    w.standing = false; w.moving = false; w.target.copy(w.seat.position); w.yaw = w.seat.rotation.y; keys.clear(); resetStick(); refresh(); publish()
  })
  const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
  window.addEventListener('keydown', event => {
    if (!movementKeys.has(event.code) || isBlocked() || /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName)) return
    event.preventDefault(); keys.add(event.code); stand()
  })
  window.addEventListener('keyup', event => { keys.delete(event.code) })
  function resetStick() { stickX = stickY = 0; knob.style.transform = 'translate(-50%,-50%)' }
  let pointer: number | undefined
  function updateStick(event: PointerEvent) {
    const rect = stick.getBoundingClientRect(), x = (event.clientX - rect.left - rect.width / 2) / 35, y = (event.clientY - rect.top - rect.height / 2) / 35, length = Math.max(1, Math.hypot(x, y))
    stickX = x / length; stickY = y / length; knob.style.transform = `translate(calc(-50% + ${stickX * 27}px),calc(-50% + ${stickY * 27}px))`
  }
  stick.addEventListener('pointerdown', event => { if (isBlocked() || pointer !== undefined) return; event.preventDefault(); pointer = event.pointerId; stick.setPointerCapture(pointer); stand(); updateStick(event) })
  stick.addEventListener('pointermove', event => { if (event.pointerId === pointer) updateStick(event) })
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(name, () => { pointer = undefined; resetStick() })
  function stopInput() { keys.clear(); pointer = undefined; resetStick(); const w = walkers.get(selfId); if (w?.moving) { w.moving = false; publish() } }
  window.addEventListener('blur', stopInput); document.addEventListener('visibilitychange', stopInput)
  function blocked(x: number, z: number) {
    if (Math.hypot(x, z) < 2.24) return true
    for (const w of walkers.values()) if (Math.hypot(x - w.seat.position.x, z - w.seat.position.z) < .68) return true
    return Math.hypot(x + 5.6, z + 3.2) < .9 || Math.hypot(x - 5.3, z + 2.9) < .85 || (x > 3.6 && z < -3.2)
  }
  return {
    add(id: string, actor: THREE.Group, seat: THREE.Group, label: HTMLElement) {
      const limbs: Walker['limbs'] = []
      for (const object of actor.children) {
        const { x, y } = object.position
        if ((y < .8 && Math.abs(x) > .07) || (Math.abs(x) > .27 && y > 1 && y < 1.5)) limbs.push({ object, position: object.position.clone(), rotation: object.rotation.clone(), side: x < 0 ? -1 : 1, leg: y < .8 })
      }
      walkers.set(id, { actor, seat, label, target: seat.position.clone(), yaw: seat.rotation.y, standing: false, moving: false, updated: 0, seq: -1, limbs }); refresh()
    },
    remove(id: string) { walkers.delete(id) },
    receive(id: string, motion: RoomMotion) {
      const w = walkers.get(id); if (!w || id === selfId || motion.seq <= w.seq) return
      w.seq = motion.seq; w.standing = motion.standing; w.moving = motion.moving; w.target.set(motion.x, 0, motion.z); w.yaw = motion.yaw; w.updated = performance.now()
    },
    publish,
    update(now: number) {
      const dt = Math.min(.05, Math.max(0, (now - (lastFrame || now)) / 1000)); lastFrame = now
      const self = walkers.get(selfId)
      if (self) {
        let x = 0, y = 0
        if (!isBlocked()) { x = stickX + Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')); y = stickY + Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) }
        if (Math.hypot(x, y) > .12) {
          stand(); const len = Math.max(1, Math.hypot(x, y)), yaw = cameraYaw(), dx = (x * Math.cos(yaw) + y * Math.sin(yaw)) / len * 2.8 * dt, dz = (-x * Math.sin(yaw) + y * Math.cos(yaw)) / len * 2.8 * dt
          const nx = THREE.MathUtils.clamp(self.target.x + dx, -6.45, 6.45), nz = THREE.MathUtils.clamp(self.target.z + dz, -4.1, 5)
          const beforeX = self.target.x, beforeZ = self.target.z
          if (!blocked(nx, self.target.z)) self.target.x = nx
          if (!blocked(self.target.x, nz)) self.target.z = nz
          self.moving = Math.hypot(self.target.x - beforeX, self.target.z - beforeZ) > .0001
          self.yaw = Math.atan2(dx, dz)
        } else self.moving = false
        if ((self.moving && now - lastSent >= 100) || (self.standing && now - lastSent >= 1500) || wasMoving !== self.moving) publish()
        wasMoving = self.moving
      }
      for (const [id, w] of walkers) {
        if (!w.standing) { w.target.copy(w.seat.position); w.yaw = w.seat.rotation.y }
        if (id !== selfId && now - w.updated > 450) w.moving = false
        w.actor.position.lerp(w.target, 1 - Math.exp(-dt * 16))
        const turn = Math.atan2(Math.sin(w.yaw - w.actor.rotation.y), Math.cos(w.yaw - w.actor.rotation.y)); w.actor.rotation.y += turn * (1 - Math.exp(-dt * 14))
        const swing = w.standing && w.moving ? Math.sin(now * .013) : 0
        w.actor.position.y = w.standing ? -.34 + Math.abs(swing) * .055 : Math.sin(now * .0014) * .012
        for (const limb of w.limbs) { limb.object.position.copy(limb.position); limb.object.rotation.copy(limb.rotation); if (w.standing) { limb.object.position.z += swing * limb.side * (limb.leg ? .14 : -.1); limb.object.rotation.x += swing * limb.side * .15 } }
        const label = w.label
        if (label) { label.dataset.posture = w.standing ? 'standing' : 'seated'; label.dataset.x = w.actor.position.x.toFixed(2); label.dataset.z = w.actor.position.z.toFixed(2) }
      }
    }
  }
}
