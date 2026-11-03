import * as THREE from 'three'

export function createCompanions(scene: THREE.Scene, height: (x: number, z: number) => number) {
  const rust = new THREE.MeshStandardMaterial({ color: 0xb97c27, roughness: .86, metalness: .3 })
  const yellow = new THREE.MeshStandardMaterial({ color: 0xd5a041, roughness: .74, metalness: .25 })
  const steel = new THREE.MeshStandardMaterial({ color: 0x5c6060, roughness: .65, metalness: .65 })
  const rubber = new THREE.MeshStandardMaterial({ color: 0x282a2a, roughness: 1 })
  const shell = new THREE.MeshStandardMaterial({ color: 0xf1f4ef, roughness: .23, metalness: .12 })
  const face = new THREE.MeshStandardMaterial({ color: 0x030b14, roughness: .17, metalness: .5 })
  const blue = new THREE.MeshStandardMaterial({ color: 0x55c5ff, emissive: 0x128ce9, emissiveIntensity: 2, roughness: .3 })
  function part(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m
  }
  function box(parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) {
    return part(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z)
  }
  function badge(parent: THREE.Object3D, text: string, y: number) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64
    const c = canvas.getContext('2d')!; c.fillStyle = '#111a23bb'; c.beginPath(); c.roundRect(0, 0, 256, 64, 32); c.fill()
    c.fillStyle = '#e6e0d2'; c.font = '24px sans-serif'; c.textAlign = 'center'; c.fillText(text, 128, 41)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthWrite: false }))
    sprite.scale.set(1.6, .4, 1); sprite.position.y = y; parent.add(sprite)
  }
  const wall = new THREE.Group(); wall.name = 'WALL·E'; scene.add(wall)
  wall.position.set(-3.6, height(-3.6, 1), 1)
  box(wall, 1.05, .88, .8, yellow, 0, .98, 0)
  box(wall, 1.13, .13, .86, rust, 0, 1.46, 0)
  box(wall, .87, .27, .035, steel, 0, 1.26, .42)
  for (let i = 0; i < 5; i++) box(wall, .1, .12, .035, rubber, -.32 + i * .16, 1.26, .45)
  box(wall, .22, .24, .04, rust, -.29, .91, .43)
  const lettering = document.createElement('canvas'); lettering.width = 256; lettering.height = 96
  const lc = lettering.getContext('2d')!; lc.fillStyle = '#b98937'; lc.fillRect(0, 0, 256, 96)
  lc.fillStyle = '#423e35'; lc.font = 'bold 42px monospace'; lc.textAlign = 'center'; lc.fillText('WALL·E', 128, 65)
  part(wall, new THREE.PlaneGeometry(.68, .25), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(lettering), roughness: 1 }), .04, .75, .411)
  const treads: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const tread = new THREE.Group(); tread.position.x = side * .7; wall.add(tread); treads.push(tread)
    box(tread, .35, .52, 1.12, rubber, 0, .36, 0)
    for (const z of [-.36, 0, .36]) {
      const wheel = part(tread, new THREE.CylinderGeometry(.25, .25, .38, 16), steel, 0, .35, z); wheel.rotation.z = Math.PI / 2
      const hub = part(tread, new THREE.CylinderGeometry(.11, .11, .39, 12), rust, 0, .35, z); hub.rotation.z = Math.PI / 2
    }
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2
      const plate = box(tread, .41, .085, .15, rubber, 0, .35 + Math.cos(a) * .30, Math.sin(a) * .61)
      plate.rotation.x = -a
    }
  }
  box(wall, .18, .36, .17, steel, 0, 1.67, -.04)
  const head = new THREE.Group(); head.position.set(0, 1.91, .02); wall.add(head)
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.x = side * .29; eye.rotation.z = side * -.13; head.add(eye)
    const housing = part(eye, new THREE.CylinderGeometry(.265, .22, .38, 8), rust, 0, 0, 0); housing.rotation.x = Math.PI / 2
    const rim = part(eye, new THREE.CylinderGeometry(.22, .22, .045, 24), steel, 0, 0, .21); rim.rotation.x = Math.PI / 2
    const lens = part(eye, new THREE.SphereGeometry(.18, 24, 16), face, 0, 0, .24); lens.scale.z = .25
    const iris = part(eye, new THREE.SphereGeometry(.105, 20, 12), new THREE.MeshStandardMaterial({ color: 0x597a91, metalness: .8, roughness: .18 }), 0, 0, .28); iris.scale.z = .2
    part(eye, new THREE.SphereGeometry(.035, 12, 8), shell, -.045, .06, .30)
  }
  const wallArms: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * .57, 1.3, .05); wall.add(arm); wallArms.push(arm)
    box(arm, .16, .46, .18, rust, side * .13, -.2, 0)
    box(arm, .28, .12, .25, steel, side * .15, -.45, .06)
    for (const x of [-.08, .08]) box(arm, .065, .2, .08, steel, side * .15 + x, -.54, .16)
  }
  badge(wall, 'WALL·E', 2.65)

  const eve = new THREE.Group(); eve.name = 'EVE'; scene.add(eve); eve.position.set(3.3, height(3.3, -1) + 1.1, -1)
  const profile = [new THREE.Vector2(0, -.7), new THREE.Vector2(.14, -.64), new THREE.Vector2(.3, -.44), new THREE.Vector2(.43, -.08), new THREE.Vector2(.47, .32), new THREE.Vector2(.4, .48), new THREE.Vector2(0, .48)]
  part(eve, new THREE.LatheGeometry(profile, 40), shell, 0, .65, 0)
  const eveHead = new THREE.Group(); eveHead.position.y = 1.55; eve.add(eveHead)
  const helmet = part(eveHead, new THREE.SphereGeometry(.51, 40, 32), shell, 0, 0, 0); helmet.scale.set(1, 1.06, .85)
  const display = part(eveHead, new THREE.SphereGeometry(.415, 32, 24), face, 0, -.075, .18); display.scale.set(1, .73, .66)
  const eyes: THREE.Mesh[] = []
  for (const side of [-1, 1]) {
    const eye = part(eveHead, new THREE.SphereGeometry(.11, 24, 16), blue, side * .155, -.065, .438); eye.scale.set(1, .7, .15); eye.rotation.z = side * .17; eyes.push(eye)
  }
  const eveArms: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * .47, 1, 0); eve.add(arm); eveArms.push(arm)
    const fin = part(arm, new THREE.SphereGeometry(1, 24, 20), shell, side * .07, -.27, 0); fin.scale.set(.11, .42, .19); fin.rotation.z = side * .15
  }
  const glow = part(eve, new THREE.ConeGeometry(.11, .42, 20), new THREE.MeshBasicMaterial({ color: 0x68caff, transparent: true, opacity: .25, depthWrite: false }), 0, -.25, 0)
  glow.rotation.z = Math.PI
  badge(eve, 'EVE', 2.4)
  let waveUntil = 0
  function update(time: number, dt: number, player: THREE.Vector3) {
    const desired = [{ object: wall, x: player.x - 3.6, z: player.z - 3.5, hover: 0 }, { object: eve, x: player.x + 3.3, z: player.z - 4.5, hover: 1.1 }]
    for (const { object, x, z, hover } of desired) {
      const dx = x - object.position.x, dz = z - object.position.z, moving = Math.hypot(dx, dz) > .5
      if (moving) {
        const speed = object === wall ? 2.9 : 3.6, step = Math.min(dt * speed, Math.hypot(dx, dz)), angle = Math.atan2(dx, dz)
        object.position.x += Math.sin(angle) * step; object.position.z += Math.cos(angle) * step
        object.rotation.y += Math.atan2(Math.sin(angle - object.rotation.y), Math.cos(angle - object.rotation.y)) * Math.min(dt * 4, 1)
      } else {
        const angle = Math.atan2(player.x - object.position.x, player.z - object.position.z)
        object.rotation.y += Math.atan2(Math.sin(angle - object.rotation.y), Math.cos(angle - object.rotation.y)) * Math.min(dt * 2, 1)
      }
      const surface = height(object.position.x, object.position.z)
      const floatingHeight = object === eve ? Math.max(surface + hover, player.y + hover) : surface
      object.position.y = THREE.MathUtils.damp(object.position.y, floatingHeight + (object === eve ? Math.sin(time * 1.8) * .14 : moving ? Math.sin(time * 16) * .018 : 0), 4, dt)
      if (object === wall) treads.forEach((tread, i) => tread.rotation.x = moving ? Math.sin(time * 12 + i) * .015 : 0)
    }
    const waving = time < waveUntil
    head.rotation.z = Math.sin(time * .7) * .12
    wallArms[1].rotation.z = waving ? 2.3 + Math.sin(time * 8) * .3 : -.12
    eveArms[1].rotation.z = waving ? 2 + Math.sin(time * 7) * .25 : -.15 + Math.sin(time * 1.8) * .08
    eveArms[0].rotation.z = .15 - Math.sin(time * 1.8) * .08
    eve.rotation.z = Math.sin(time * 1.4) * .045
    const blink = Math.sin(time * 1.3) > .993; eyes.forEach(eye => eye.scale.y = blink ? .1 : .7)
  }
  return { objects: [wall, eve], update, greet(time: number) { waveUntil = time + 3 } }
}
