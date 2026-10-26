import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Real geometry for the neighborhood; the pixel character remains a billboard.
export function createStreet3D(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = .78
  renderer.domElement.className = 'street-3d'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x263f80)
  const fog = new THREE.FogExp2(0x28334e, .035)
  scene.fog = fog
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .08, 180)
  const ambient = new THREE.HemisphereLight(0x8997d4, 0x171b29, .85)
  scene.add(ambient)
  const moon = new THREE.DirectionalLight(0xa6b5ff, .7)
  moon.position.set(-8, 15, 9); scene.add(moon)
  const warm = new THREE.DirectionalLight(0xffd1a0, .08)
  warm.position.set(8, 4, 3); scene.add(warm)
  const skyMaterial = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { dawn: { value: 0 }, aspect: { value: innerWidth / innerHeight } },
    vertexShader: 'varying vec2 uvSky; void main(){uvSky=uv;gl_Position=vec4(position.xy,.999,1.);}',
    fragmentShader: `
      precision highp float;
      varying vec2 uvSky; uniform float dawn; uniform float aspect;
      float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float cloud(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(noise(i),noise(i+vec2(1,0)),f.x),mix(noise(i+vec2(0,1)),noise(i+vec2(1)),f.x),f.y);}
      void main(){
        vec3 top=mix(vec3(.10,.16,.34),vec3(.44,.63,.75),dawn);
        vec3 horizon=mix(vec3(.28,.37,.62),vec3(.99,.86,.65),dawn);
        vec3 color=mix(horizon,top,smoothstep(.05,.95,uvSky.y));
        float clouds=cloud(uvSky*vec2(6.,15.))*.65+cloud(uvSky*vec2(13.,32.))*.35;
        color+=vec3(.08,.085,.10)*(clouds-.5)*(1.-dawn*.6);
        vec2 delta=(uvSky-vec2(.76,mix(.20,.86,dawn)))*vec2(aspect,1.);
        float distance=length(delta);
        color+=vec3(1.,.67,.34)*exp(-distance*8.)*dawn*.42;
        color=mix(color,vec3(1.,.94,.78),(1.-smoothstep(.025,.036,distance))*smoothstep(.45,.8,dawn));
        gl_FragColor=vec4(color,1.);
      }`,
  })
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMaterial)
  sky.frustumCulled = false; sky.renderOrder = -1000; scene.add(sky)
  const city = new THREE.Group(); scene.add(city)
  const materials = new Map<number, THREE.MeshStandardMaterial>()
  const material = (color: number) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .95 }))
    return materials.get(color)!
  }
  const lit = new THREE.MeshStandardMaterial({ color: 0xddc6a3, emissive: 0xffb15e, emissiveIntensity: .75 })
  const cool = new THREE.MeshStandardMaterial({ color: 0x9dcff3, emissive: 0x598cc5, emissiveIntensity: .65 })
  function box(x: number, y: number, z: number, w: number, h: number, d: number, color: number | THREE.Material, parent: THREE.Object3D = city) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? material(color) : color)
    mesh.position.set(x, y, z); parent.add(mesh); return mesh
  }
  function cylinder(x: number, y: number, z: number, radius: number, height: number, color: number) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 8), material(color))
    mesh.position.set(x, y, z); city.add(mesh); return mesh
  }
  let seed = 53017
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  function signTexture(text: string, background: string, color: string) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 128)
    ctx.fillStyle = color; ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(text, 256, 68)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshStandardMaterial({ map: texture, roughness: 1 })
  }
  const shopSigns = [signTexture('동네 부동산', '#a68f55', '#302c29'), signTexture('유 리', '#c6c3b8', '#754b4e'), signTexture('한 의 원', '#bbbdb7', '#3d4a5c'), signTexture('분 식', '#8c6868', '#d1c8b9')]
  // Subtle surface variation keeps masonry from looking like pristine toy blocks.
  const masonryCanvas = document.createElement('canvas'); masonryCanvas.width = masonryCanvas.height = 128
  const masonry = masonryCanvas.getContext('2d')!
  masonry.fillStyle = '#b0a9a3'; masonry.fillRect(0, 0, 128, 128)
  for (let row = 0; row < 16; row++) for (let col = -1; col < 9; col++) {
    const value = 137 + ((row * 13 + col * 17) % 25)
    masonry.fillStyle = `rgb(${value},${value - 4},${value - 7})`
    masonry.fillRect(col * 16 + (row % 2) * 8, row * 8 + 1, 15, 7)
  }
  const masonryMap = new THREE.CanvasTexture(masonryCanvas)
  masonryMap.colorSpace = THREE.SRGBColorSpace
  function tree(x: number, z: number, size = 1) {
    cylinder(x, 1.1 * size, z, .12 * size, 2.2 * size, 0x343532)
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry((.75 + random() * .3) * size, 0), material(i % 2 ? 0x28483f : 0x365849))
      leaf.position.set(x + (random() - .5) * size, (2.1 + random() * .65) * size, z + (random() - .5) * size)
      city.add(leaf)
    }
  }
  function lamp(x: number) {
    cylinder(x, 2.2, 3.25, .055, 4.4, 0x313844)
    box(x + .32, 4.38, 3.25, .72, .08, .09, 0x313844)
    box(x + .6, 4.29, 3.25, .4, .09, .24, lit)
    // A flat warm pool on the paving, rather than many expensive point lights.
    const pool = new THREE.Mesh(new THREE.CircleGeometry(.8, 20), new THREE.MeshBasicMaterial({ color: 0xd8ab77, transparent: true, opacity: .08, depthWrite: false }))
    pool.rotation.x = -Math.PI / 2; pool.position.set(x + .3, .193, 3.7); city.add(pool)
  }
  function house(x: number, width: number, height: number, shop: boolean, residential: boolean) {
    const palette = [0x55566c, 0x696571, 0x676374, 0x454c65, 0x6c6666]
    const color = palette[Math.floor(random() * palette.length)]!
    material(color).map = masonryMap
    box(x, height / 2 + .19, .3, width, height, 3.8, color)
    box(x, height + .25, .3, width + .18, .16, 4, 0x41465a)
    const floors = Math.max(1, Math.floor(height / 1.2))
    const cols = Math.max(2, Math.floor(width / .8))
    for (let floor = 0; floor < floors; floor++) for (let column = 0; column < cols; column++) {
      const wx = x - width / 2 + (column + .5) * width / cols
      const wy = .75 + floor * 1.12
      if (wy > height - .2) continue
      box(wx, wy, 2.225, .43, .63, .06, 0x252c40)
      box(wx, wy, 2.265, .32, .48, .025, random() > .45 ? lit : 0x2e3c58)
      box(wx, wy, 2.29, .018, .49, .02, 0x51505a)
    }
    if (shop) {
      box(x, .83, 2.28, width * .82, 1.16, .09, cool)
      for (let i = -1; i <= 1; i++) box(x + i * width * .27, .83, 2.35, .045, 1.2, .07, 0x333c53)
      box(x, 1.58, 2.4, width * .94, .24, .42, 0x476292)
      for (let i = 0; i < 5; i++) box(x - width * .35 + i * width * .17, 1.58, 2.63, .13, .035, .02, paleSign)
      box(x, 1.72, 2.66, width * .9, .34, .04, shopSigns[Math.floor(random() * shopSigns.length)]!)
      // Door steps, posted notices and lower shutters echo the reference street.
      box(x, .26, 2.58, width * .88, .17, .7, 0x5f6268)
      box(x + width * .22, .82, 2.38, .25, .35, .015, 0xb8b8b0)
      if (random() > .5) for (let i = 0; i < 10; i++) box(x - width * .28, .38 + i * .09, 2.4, width * .28, .028, .025, 0x5d626c)
    } else {
      box(x + width * .25, .9, 2.26, .52, 1.4, .07, 0x323a4e)
      box(x + width * .25 + .16, .92, 2.32, .04, .04, .035, 0xc9bb92)
    }
    if (residential) {
      box(x, .7, 2.8, width + .2, 1.05, .22, 0x767581)
      box(x, 1.25, 2.8, width + .3, .12, .35, 0xaaa2a0)
      box(x + width * .25, .7, 2.96, .78, 1.12, .07, 0x343b48)
      for (let i = 0; i < 6; i++) box(x + width * .25 - .33 + i * .13, .7, 3.02, .035, 1.05, .03, 0x4d5662)
      tree(x - width * .22, 1.5, .75)
    }
    if (random() > .5) box(x - width * .3, height - .1, 2.33, .48, .32, .16, 0x8a8d9b)
  }
  const paleSign = material(0xc7d4da)
  function parkedCar(x: number, color: number) {
    const z = 6.1
    box(x, .48, z, 2.1, .48, .95, color)
    box(x - .1, .94, z, 1.2, .5, .86, color)
    box(x - .1, 1.0, z + .443, 1.04, .29, .02, 0x273747)
    box(x - .1, 1.0, z + .46, .04, .36, .03, 0x5d6570)
    for (const side of [-1, 1]) {
      box(x + side * .69, .22, z + .46, .34, .38, .14, 0x181d25)
      box(x + side * .69, .22, z + .54, .17, .18, .025, 0x767c88)
    }
    box(x + 1.06, .52, z + .31, .035, .12, .22, paleSign)
    box(x - 1.06, .52, z + .31, .035, .12, .22, 0x814c51)
  }
  let builtWidth = -1
  function rebuild(total: number, section: number) {
    while (city.children.length) {
      const mesh = city.children[0] as THREE.Mesh
      mesh.geometry?.dispose(); city.remove(mesh)
    }
    seed = 53017
    box(total / 2, -.08, 7.2, total + 40, .16, 4.4, 0x30394f)
    const bankStart = section * .65
    box((total + bankStart) / 2 + 10, -.1, -4, total - bankStart + 20, .2, 15, 0x353e51)
    box(total / 2, .08, 4.1, total + 10, .18, 1.65, 0x7a7c8a)
    box(total / 2, .1, 4.98, total + 10, .2, .12, 0xaaa3a0)
    box(total / 2, .01, 7.3, total + 10, .04, .045, 0xc1ad6a)
    for (let x = -5; x < total + 8; x += .8) box(x, .178, 4.1, .018, .008, 1.6, 0x5d6376)
    for (let x = -5; x < total + 8; x += 3.2) box(x, .179, 4.1, 3.2, .008, .018, 0x5d6376)
    // The river and bridge occupy the first district behind the walkable bank.
    box(section * .25, -.1, -11, section * 1.5, .08, 25, 0x274e79)
    for (let i = 0; i < 95; i++) {
      box(-5 + random() * section * 1.3, -.045, -1 - random() * 22, .2 + random() * .8, .007, .025, i % 5 ? 0x436f9b : 0x8a9abd)
    }
    box(section * .2, 1.65, -8.5, section * 1.7, .3, 2.8, 0x6b7390)
    for (let x = -8; x < section * .75; x += 3.8) {
      box(x, .65, -8.5, .65, 1.7, 2.4, 0x65718b)
      box(x, 1.92, -7.12, .045, .42, .045, 0xb1b3bb)
    }
    for (let x = -2; x < section * .62; x += .6) {
      box(x, .72, 2.4, .045, 1.08, .045, 0x777f93)
      box(x, 1.26, 2.4, .62, .065, .08, 0x939aad)
    }
    for (let x = -15; x < total + 18; x += 2.8) {
      const height = 3 + random() * 6
      box(x, height / 2, -19 - random() * 8, 2.2, height, 2, 0x35466e)
    }
    for (let x = -8; x < total + 20; ) {
      const width = 2.5 + random() * 1.7
      const zone = Math.floor(x / section)
      house(x + width / 2, width, zone >= 3 ? 2.8 + random() : 3.2 + random() * 2, zone === 1 || (zone === 2 && random() > .4), zone >= 3)
      x += width + .3 + random() * .5
    }
    for (let x = 1; x < total; x += 7.5) { lamp(x); if (x > section * .7 && random() > .4) tree(x + 2.5, 2.9, .75) }
    for (let x = section * 1.1; x < total - 2; x += 8.5) {
      parkedCar(x, random() > .5 ? 0x858b91 : 0x282e3b)
      for (let i = 0; i < 4; i++) box(x + i * .55, .025, 7.4, .23, .025, 1.7, i % 2 ? 0x91886b : 0x939798)
    }
    // Sagging wires are real curves stretching between utility poles.
    for (let x = 3; x < total; x += 10) {
      cylinder(x, 3.1, 2.95, .085, 6.2, 0x535969)
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 5.8, 2.95), new THREE.Vector3(x + 5, 5.25, 2.95), new THREE.Vector3(x + 10, 5.8, 2.95)])
      const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, .015, 3, false), material(0x20283c)); city.add(cable)
    }
    // Opposite facades face inward across the same street.
    const opposite = new THREE.Group()
    for (const child of [...city.children]) {
      const mesh = child as THREE.Mesh
      if (mesh.position.z > 3.3 || mesh.position.z < -2 || mesh.position.y < .2) continue
      const copy = mesh.clone()
      copy.geometry = mesh.geometry.clone()
      copy.position.z = 14.4 - mesh.position.z
      copy.rotation.y = Math.PI
      opposite.add(copy)
    }
    for (const child of [...opposite.children]) { opposite.remove(child); city.add(child) }
    // Continuous paving under the camera and between both building rows.
    box(total / 2, -.15, 7.2, total + 60, .12, 12, 0x30394f)
    // Static architecture shares a small set of draw calls, even on long walks.
    city.updateMatrixWorld(true)
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
    for (const child of [...city.children]) {
      const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
      const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
      if (!batches.has(mesh.material)) batches.set(mesh.material, [])
      batches.get(mesh.material)!.push(geometry)
      mesh.geometry.dispose(); city.remove(mesh)
    }
    for (const [mat, geometries] of batches) {
      const merged = mergeGeometries(geometries)
      if (merged) city.add(new THREE.Mesh(merged, mat))
      for (const geometry of geometries) geometry.dispose()
    }
  }
  host.prepend(renderer.domElement)
  const point = new THREE.Vector3()
  let morning = 0
  const dawnColor = new THREE.Color(0x28334e), dayColor = new THREE.Color(0xb2bcc0)
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false)
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
  }
  resize(); window.addEventListener('resize', resize)
  return {
    render(playerX: number, cameraX: number, sectionPixels: number, totalPixels: number, immersion = 0, walkTime = 0) {
      const total = totalPixels / 100, section = sectionPixels / 100
      if (Math.abs(total - builtWidth) > .01) { rebuild(total, section); builtWidth = total }
      const center = (cameraX + innerWidth / 2) / 100
      const progress = Math.min(1, playerX / Math.max(1, totalPixels - 120))
      // Advancing the walk brings the morning; walking back does not rewind time.
      morning = Math.max(morning, THREE.MathUtils.smoothstep(progress, .38, 1))
      skyMaterial.uniforms.dawn!.value = morning
      skyMaterial.uniforms.aspect!.value = innerWidth / innerHeight
      ambient.intensity = .85 + morning * 1.8
      ambient.color.set(0x8997d4).lerp(new THREE.Color(0xe4e6da), morning)
      moon.intensity = .7 + morning * .45
      warm.intensity = .08 + morning * 2.4
      warm.position.set(center + 10, 3 + morning * 10, -6)
      fog.color.copy(dawnColor).lerp(dayColor, morning)
      fog.density = .035 - morning * .018
      renderer.toneMappingExposure = .78 + morning * .35
      lit.emissiveIntensity = .75 * (1 - morning * .8)
      cool.emissiveIntensity = .65 * (1 - morning * .65)
      host.style.setProperty('--morning', String(morning))
      host.dataset.daylight = morning.toFixed(3)
      const player = playerX / 100
      const bob = Math.sin(walkTime * 10) * .025 * immersion
      camera.position.set(player + 7 * (1 - immersion) - 1.1 * immersion, 2.4 - .7 * immersion + bob, 7.2 + 5 * (1 - immersion))
      camera.lookAt(player + 14 * immersion, 1.55 + bob, 7.2)
      camera.updateMatrixWorld()
      renderer.render(scene, camera)
      point.set(playerX / 100, .19, 7.2).project(camera)
      return { x: (point.x + 1) / 2 * innerWidth, y: (1 - point.y) / 2 * innerHeight }
    },
  }
}
