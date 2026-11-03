import * as THREE from 'three'
import { createSparkles } from './sparkles'

type Destination = { name: string; english: string; color: string; palette: string[]; radius: number; kind: 'rock' | 'bands' | 'earth'; ring?: boolean }
const destinations: Destination[] = [
  { name: '수성', english: 'MERCURY', color: '#b3aaa0', palette: ['#655f58', '#b0a699', '#82796d'], radius: 34, kind: 'rock' },
  { name: '금성', english: 'VENUS', color: '#e6c48a', palette: ['#a8804e', '#e6c28a', '#cfaa70'], radius: 51, kind: 'bands' },
  { name: '지구', english: 'EARTH', color: '#79b5e0', palette: ['#125a97', '#679c82', '#dceaf0'], radius: 54, kind: 'earth' },
  { name: '화성', english: 'MARS', color: '#d88661', palette: ['#9f4e36', '#d48c60', '#743f31'], radius: 42, kind: 'rock' },
  { name: '목성', english: 'JUPITER', color: '#dfb48f', palette: ['#b27e61', '#e5d2b2', '#9c6d55', '#d4b38c'], radius: 105, kind: 'bands' },
  { name: '토성', english: 'SATURN', color: '#ddcb9b', palette: ['#b09a70', '#e9d8a9', '#c6b58b'], radius: 88, kind: 'bands', ring: true },
  { name: '천왕성', english: 'URANUS', color: '#a4dedf', palette: ['#77b8c2', '#c0e6e1', '#9fd0d3'], radius: 68, kind: 'bands', ring: true },
  { name: '해왕성', english: 'NEPTUNE', color: '#6689e3', palette: ['#25499c', '#5a80d7', '#3562ba'], radius: 65, kind: 'bands' },
  { name: '명왕성', english: 'PLUTO', color: '#c3b2a0', palette: ['#76665b', '#c9b9a6', '#a38e7d'], radius: 28, kind: 'rock' }
]

export function createPlanetTravel(canvas: HTMLCanvasElement, astronaut: THREE.Group, friends: THREE.Group[], onReturn: () => void) {
  document.querySelector('#app')!.insertAdjacentHTML('beforeend', `
    <nav class="planet-nav glass" aria-label="태양계 여행 목적지"><div class="planet-nav-heading">태양계 여행 <span>가고 싶은 별을 눌러보세요</span></div><div class="planet-list">${destinations.map((p, i) => `<button data-planet="${i}" aria-label="${p.name}으로 날아가기" aria-pressed="false"><i style="--planet-color:${p.color}" class="planet-icon ${p.ring ? 'ringed' : ''}"></i><span>${p.name}</span></button>`).join('')}</div></nav>
    <section class="travel-info" hidden aria-live="polite"><span class="eyebrow" id="travel-english"></span><h1 id="travel-name"></h1><p id="travel-status"></p><div class="travel-progress"><i></i></div><span class="travel-note">상상 속 태양계 · 거리와 크기를 줄인 여행</span></section>
    <div class="travel-controls glass" hidden><span>WASD 이동 · SPACE 상승 · SHIFT 하강<br>드래그로 둘러보기 · 휠로 확대 / 축소</span><button id="return-moon">☾ 달로 돌아가기</button></div>`)
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#02050c')
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 50000)
  scene.add(new THREE.HemisphereLight(0xd3e7ff, 0x1c1724, 2))
  const sunlight = new THREE.DirectionalLight(0xffe3bc, 3.3); sunlight.position.set(-1000, 700, 1200); scene.add(sunlight)
  const starsGeometry = new THREE.BufferGeometry(), stars = []
  let seed = 918; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  for (let i = 0; i < 4800; i++) { const v = new THREE.Vector3(random() - .5, random() - .5, random() - .5).normalize().multiplyScalar(12000); stars.push(v.x, v.y, v.z) }
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3))
  const starfield = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xd7e5ff, size: 4, sizeAttenuation: true })); scene.add(starfield)
  const planets = destinations.map((destination, index) => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512
    const ctx = c.getContext('2d')!; ctx.fillStyle = destination.palette[0]; ctx.fillRect(0, 0, 1024, 512)
    if (destination.kind === 'bands') {
      for (let y = 0; y < 512; y += 2) {
        ctx.fillStyle = destination.palette[Math.floor((Math.sin(y * .055) + 1) * 1.4) % destination.palette.length]; ctx.globalAlpha = .45 + random() * .4
        ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= 1024; x += 16) ctx.lineTo(x, y + Math.sin(x * .016 + y * .07) * 4); ctx.lineTo(1024, y + 5); ctx.lineTo(0, y + 5); ctx.fill()
      }
    } else {
      for (let i = 0; i < 1200; i++) {
        ctx.globalAlpha = .1 + random() * .35; ctx.fillStyle = destination.palette[Math.floor(random() * destination.palette.length)]
        ctx.beginPath(); ctx.ellipse(random() * 1024, random() * 512, 2 + random() * (destination.kind === 'earth' ? 70 : 30), 2 + random() * 22, random() * 6, 0, Math.PI * 2); ctx.fill()
      }
      if (destination.kind === 'earth') for (let i = 0; i < 140; i++) { ctx.globalAlpha = .3; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(random() * 1024, random() * 512, random() * 90 + 15, random() * 8 + 2, -.2, 0, Math.PI * 2); ctx.fill() }
    }
    ctx.globalAlpha = 1
    if (index === 4) { ctx.fillStyle = '#a85b41'; ctx.beginPath(); ctx.ellipse(700, 310, 66, 25, -.1, 0, Math.PI * 2); ctx.fill() }
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace
    const group = new THREE.Group(); group.position.set((index % 3 - 1) * 1200, Math.sin(index * .8) * 160, -1800 - index * 1300)
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(destination.radius, 64, 48), new THREE.MeshStandardMaterial({ map: texture, roughness: .9, emissive: destination.color, emissiveIntensity: .035 })); sphere.rotation.z = index === 6 ? 1.3 : .12; group.add(sphere)
    if (destination.ring) {
      const ringTextureCanvas = document.createElement('canvas'); ringTextureCanvas.width = 256; ringTextureCanvas.height = 1
      const rc = ringTextureCanvas.getContext('2d')!; for (let x = 0; x < 256; x++) { rc.fillStyle = `rgba(220,200,159,${.15 + random() * .65})`; rc.fillRect(x, 0, 1, 1) }
      const ringGeometry = new THREE.RingGeometry(destination.radius * 1.35, destination.radius * 2.1, 128)
      const uv = ringGeometry.attributes.uv, pos = ringGeometry.attributes.position
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i)) / destination.radius - 1.35) / .75, .5)
      const ring = new THREE.Mesh(ringGeometry, new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(ringTextureCanvas), color: destination.color, transparent: true, opacity: index === 6 ? .3 : .85, side: THREE.DoubleSide, roughness: 1, depthWrite: false })); ring.rotation.x = -1.12; ring.rotation.y = .18; group.add(ring)
    }
    scene.add(group); return { group, sphere, destination }
  })
  const explorer = astronaut.clone(true); explorer.position.set(0, 0, 0); explorer.rotation.set(0, Math.PI, 0); explorer.visible = true; scene.add(explorer)
  const companions = friends.map(friend => { const clone = friend.clone(true); clone.visible = true; scene.add(clone); return clone })
  const updateSparkles=createSparkles(scene)
  const warpPositions = new Float32Array(110 * 6), warpGeometry = new THREE.BufferGeometry(); warpGeometry.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3))
  const warpMaterial = new THREE.LineBasicMaterial({ color: 0x9acbff, transparent: true, opacity: 0, depthWrite: false }); const warp = new THREE.LineSegments(warpGeometry, warpMaterial); warp.frustumCulled = false; scene.add(warp)
  const roomName=document.querySelector('.room > span:nth-child(2)')!, originalRoom=roomName.innerHTML
  const info = document.querySelector<HTMLElement>('.travel-info')!, controls = document.querySelector<HTMLElement>('.travel-controls')!
  const name = document.querySelector('#travel-name')!, english = document.querySelector('#travel-english')!, status = document.querySelector('#travel-status')!, progress = document.querySelector<HTMLElement>('.travel-progress i')!
  let active = false, flying = false, selected = 0, travelTime = 0, travelStarted = 0, orbitYaw = 0, orbitPitch = .16, zoom = 16, down = false, lastX = 0, lastY = 0
  const start = new THREE.Vector3(), finish = new THREE.Vector3(), velocity = new THREE.Vector3()
  function select(index: number) {
    const wasActive = active; active = true; flying = true; selected = index; travelTime = 0; travelStarted=performance.now(); velocity.set(0, 0, 0)
    if (!wasActive) explorer.position.set(0, 0, 0)
    start.copy(explorer.position); const planet = planets[index]
    finish.copy(planet.group.position).add(new THREE.Vector3(0, planet.destination.radius * .25, planet.destination.radius * (planet.destination.ring ? 4.2 : 3.5)))
    document.body.classList.add('planet-travelling'); info.hidden = false; controls.hidden = false
    roomName.textContent=planet.destination.name+' 궤도';document.querySelector('.live')!.innerHTML='<i></i> 별빛 항해 중'
    english.textContent = planet.destination.english; name.textContent = `${planet.destination.name}으로 가는 중`; status.textContent = '별빛을 지나, 새로운 풍경으로.'
    document.querySelectorAll<HTMLButtonElement>('[data-planet]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.planet) === index)))
    orbitYaw = 0; orbitPitch = .16; zoom = 16
  }
  document.querySelectorAll<HTMLButtonElement>('[data-planet]').forEach(button => button.addEventListener('click', () => select(Number(button.dataset.planet))))
  document.querySelector('#return-moon')!.addEventListener('click', () => { active = false; flying = false; info.hidden = controls.hidden = true; document.body.classList.remove('planet-travelling');roomName.innerHTML=originalRoom; document.querySelectorAll('[data-planet]').forEach(button => button.setAttribute('aria-pressed', 'false')); onReturn() })
  canvas.addEventListener('pointerdown', e => { if (!active) return; down = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId) })
  canvas.addEventListener('pointermove', e => { if (!active || !down || flying) return; orbitYaw -= (e.clientX - lastX) * .005; orbitPitch = THREE.MathUtils.clamp(orbitPitch + (e.clientY - lastY) * .003, -1.1, 1.35); lastX = e.clientX; lastY = e.clientY })
  for (const event of ['pointerup', 'pointercancel']) canvas.addEventListener(event, () => down = false)
  canvas.addEventListener('wheel', e => { if (!active) return; e.preventDefault(); zoom = THREE.MathUtils.clamp(zoom + e.deltaY * .015, 5, 65) }, { passive: false })
  return {
    get active() { return active },
    update(dt: number, time: number, keys: Set<string>, renderer: THREE.WebGLRenderer) {
      const planet = planets[selected]; planets.forEach(p => p.sphere.rotation.y += dt * .035)
      if (flying) {
        travelTime = (performance.now()-travelStarted)/1000; const t = Math.min(1, travelTime / 4.8), ease = t * t * (3 - 2 * t)
        explorer.position.lerpVectors(start, finish, ease); explorer.position.y += Math.sin(t * Math.PI) * 180
        progress.style.width = `${Math.round(t * 100)}%`; status.textContent = `별빛 항해 중 · ${Math.round(t * 100)}%`
        if (t >= 1) { flying = false; name.textContent = `오늘은, ${planet.destination.name}에서.`; status.textContent = '도착했어요. 행성 곁에서 자유롭게 유영해 보세요.';document.querySelector('.live')!.innerHTML='<i></i> 행성 곁에서 유영 중' }
      } else {
        const dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'))
        const dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))
        const direction = new THREE.Vector3(dx, 0, dz); if (direction.lengthSq() > 1) direction.normalize(); direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitYaw)
        const dy = Number(keys.has(' ')) - Number(keys.has('shift'))
        velocity.lerp(new THREE.Vector3(direction.x * 48, dy * 48, direction.z * 48), 1 - Math.exp(-5 * dt)); explorer.position.addScaledVector(velocity, dt)
        const offset = explorer.position.clone().sub(planet.group.position), safeRadius = planet.destination.radius + 5
        if (offset.length() < safeRadius) explorer.position.copy(planet.group.position).add(offset.normalize().multiplyScalar(safeRadius))
      }
      explorer.rotation.x = -.23; explorer.rotation.y = orbitYaw + Math.PI; explorer.position.y += Math.sin(time * 1.5) * dt * .05
      companions.forEach((friend, i) => { friend.position.copy(explorer.position).add(new THREE.Vector3(i ? 3.5 : -3.5, i ? 1 : -.3, -2)); friend.rotation.y = time * .08; friend.position.y += Math.sin(time * 1.7 + i) * .15 })
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix()
      const focus = explorer.position.clone().add(new THREE.Vector3(0, 1.4, 0))
      camera.position.copy(focus).add(new THREE.Vector3(Math.sin(orbitYaw) * Math.cos(orbitPitch) * zoom, Math.sin(orbitPitch) * zoom, Math.cos(orbitYaw) * Math.cos(orbitPitch) * zoom))
      camera.lookAt(focus.clone().lerp(planet.group.position, flying ? .12 : .04)); starfield.position.copy(camera.position)
      warpMaterial.opacity = flying ? Math.sin(Math.min(travelTime / 4.8, 1) * Math.PI) * .55 : 0
      warp.position.copy(camera.position); warp.quaternion.copy(camera.quaternion)
      if (flying) for (let i = 0; i < 110; i++) { const angle = i * 2.39996, radius = 5 + (i % 13) * 2, z = -10 - ((time * 110 + i * 7) % 180); warpPositions.set([Math.cos(angle) * radius, Math.sin(angle) * radius, z, Math.cos(angle) * radius, Math.sin(angle) * radius, z - 10 - (i % 7)], i * 6) }
      warpGeometry.attributes.position.needsUpdate = true;updateSparkles(time,dt,explorer.position,companions[1].position); renderer.render(scene, camera)
    }
  }
}
