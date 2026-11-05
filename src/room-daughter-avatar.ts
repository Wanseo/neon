import * as THREE from 'three'
import { plushGeometry } from './room-avatar-soft'
import { createAvatarRig } from './room-avatar-rig'

// A fully modeled outfit: curved hat, braided hair, tailored plaid and a real backpack.
export function createRoomDaughterAvatar(parent: THREE.Group) {
  const owner = parent, model = new THREE.Group(); model.name = 'daughter-proportions'; owner.add(model); parent = model
  const owned: THREE.Material[] = [], textures: THREE.Texture[] = []
  const mat = (color: string, roughness = .85) => { const m = new THREE.MeshStandardMaterial({ color, roughness }); owned.push(m); return m }
  const skin = mat('#f4c6ab', .74), innerEar = mat('#e8a294'), hair = mat('#423027', .7), hat = mat('#bd762e'), hatEdge = mat('#9b5c27'), stitch = mat('#a4652c'), white = mat('#f5e8ce'), iris = mat('#825738', .55), pupil = mat('#302b24', .5), nose = mat('#d97e48'), mouth = mat('#83513a'), leather = mat('#42312b', .62), sole = mat('#2e2523'), pants = mat('#825338'), backpack = mat('#c58232'), packEdge = mat('#a8692b'), brass = mat('#b99b4c', .45)
  function add(group: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m }
  function ball(group: THREE.Object3D, material: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) { const m = add(group, new THREE.SphereGeometry(1, 28, 20), material, x, y, z); m.scale.set(sx, sy, sz); return m }
  function round(group: THREE.Object3D, material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, r = .04) { return add(group, plushGeometry(w, h, d, r >= .07 ? .65 : .78), material, x, y, z) }
  function line(group: THREE.Object3D, material: THREE.Material, points: number[][], radius = .006) { return add(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2]))), 28, radius, 6, false), material) }
  function canvasMap(draw: (ctx: CanvasRenderingContext2D) => void) { const c = document.createElement('canvas'); c.width = c.height = 256; draw(c.getContext('2d')!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; textures.push(t); return t }
  const plaid = mat('#ffffff'); plaid.map = canvasMap(ctx => {
    ctx.fillStyle = '#5c5144'; ctx.fillRect(0, 0, 256, 256)
    for (let p = 0; p < 256; p += 128) { ctx.fillStyle = '#302f2b'; ctx.fillRect(p, 0, 48, 256); ctx.fillRect(0, p, 256, 48); ctx.fillStyle = '#794e45'; ctx.fillRect(p + 80, 0, 5, 256); ctx.fillRect(0, p + 80, 256, 5); ctx.fillStyle = '#7c6b54'; ctx.fillRect(p + 106, 0, 2, 256); ctx.fillRect(0, p + 106, 256, 2) }
    ctx.globalAlpha = .12; ctx.fillStyle = '#e8d2ae'; for (let y = 0; y < 256; y += 3) ctx.fillRect(0, y, 256, 1)
  })
  plaid.map!.wrapS = plaid.map!.wrapT = THREE.RepeatWrapping
  const knit = mat('#ffffff'); knit.map = canvasMap(ctx => { ctx.fillStyle = '#e6d7b7'; ctx.fillRect(0, 0, 256, 256); ctx.strokeStyle = '#c9bb9e'; ctx.lineWidth = 1; for (let x = 0; x < 256; x += 10) for (let y = 0; y < 256; y += 12) { ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y + 6); ctx.lineTo(x + 3, y); ctx.stroke() } })
  const cuff = mat('#ffffff'); cuff.map = canvasMap(ctx => { ctx.fillStyle = '#ce9b61'; ctx.fillRect(0, 0, 256, 256); for (let x = -32; x < 280; x += 64) for (let y = -32; y < 280; y += 64) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = ((x + y) / 64) % 2 ? '#693d2d' : '#ece0b7'; ctx.fillRect(-19, -19, 38, 38); ctx.restore() } })
  const head = new THREE.Group(); head.position.y = 1.79; head.scale.set(1.12, .90, 1); parent.add(head)
  ball(head, hair, 0, .04, -.08, .53, .42, .40)
  const face = add(head, plushGeometry(1.03, .87, .76, .95), skin, 0, -.035, .035)
  const faceZ = (x: number, y: number) => .035 + .38 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / .515, 2 / .95) - Math.pow(Math.abs(y + .035) / .435, 2 / .95)), .95 / 2)
  // Gentle cheek shading follows the curved face instead of a flat face sticker.
  const faceMaterial = skin.clone(); faceMaterial.vertexColors = true; owned.push(faceMaterial); face.material = faceMaterial
  const pos = face.geometry.attributes.position, colors = new Float32Array(pos.count * 3), color = new THREE.Color(), pink = new THREE.Color('#ecc0b3')
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const strength = Math.exp(-((Math.abs(x) - .32) ** 2 / .012 + (y + .14) ** 2 / .008)) * THREE.MathUtils.smoothstep(z, .12, .32); color.set('#ffffff').lerp(pink, strength * .6); color.toArray(colors, i * 3) }
  face.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  for (const side of [-1, 1]) { ball(head, skin, side * .53, -.08, 0, .10, .14, .075); ball(head, innerEar, side * .568, -.08, .035, .04, .075, .025) }
  // Short straight bangs tucked under the brim, with actual depth at the temples.
  round(head, hair, 0, .235, .327, .72, .17, .13, .045)
  for (const side of [-1, 1]) ball(head, hair, side * .444, .15, .09, .07, .25, .15)
  const eyes: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(side * .215, .015, faceZ(side * .215, .015) + .020); head.add(eye); eyes.push(eye)
    ball(eye, white, 0, 0, 0, .125, .135, .035); ball(eye, iris, .014, -.004, .025, .084, .115, .025); ball(eye, pupil, .021, -.005, .046, .027, .055, .012); ball(eye, white, -.010, .061, .051, .015, .023, .008)
    line(eye, mouth, [[-.109, .025, .015], [-.08, .12, .02], [0, .148, .022], [.08, .103, .02]], .007)
    for (let j = 0; j < 2; j++) line(eye, mouth, [[side * .085, .085 - j * .04, .018], [side * .118, .105 - j * .04, .015]], .005)
  }
  ball(head, nose, 0, -.115, faceZ(0, -.115) + .022, .060, .035, .033)
  const smile = line(head, mouth, [[-.11, -.245, faceZ(-.11, -.245)+.009], [-.045, -.263, faceZ(-.045, -.263)+.009], [0, -.253, faceZ(0, -.253)+.009], [.055, -.263, faceZ(.055, -.263)+.009], [.11, -.242, faceZ(.11, -.242)+.009]], .009)
  // Thick, interwoven braid lobes and tapered tips, visible from the back too.
  const braids: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const braid = new THREE.Group(); braid.position.set(side * .445, -.36, -.14); head.add(braid); braids.push(braid)
    for (let j = 0; j < 4; j++) { const knot = ball(braid, hair, side * j * .029 + (j % 2 ? .018 : -.018), -j * .135, 0, .085 - j * .006, .10, .08); knot.rotation.z = side * (j % 2 ? -.30 : .30) }
    const end = ball(braid, hair, side * .105, -.49, 0, .067, .10, .065); end.rotation.z = side * .55
  }
  // A wavy, thick brim and rounded crown, with curved fabric panel seams.
  const hatGroup = new THREE.Group(); hatGroup.position.set(0, .39, -.025); head.add(hatGroup)
  const crownProfile = new THREE.CatmullRomCurve3([new THREE.Vector3(.51, -.047, 0), new THREE.Vector3(.50, .08, 0), new THREE.Vector3(.45, .28, 0), new THREE.Vector3(.32, .46, 0), new THREE.Vector3(.12, .535, 0), new THREE.Vector3(.001, .54, 0)])
  for (const p of crownProfile.points) p.y = (p.y + .047) * .62 - .047
  const points = crownProfile.getPoints(40).map(p => new THREE.Vector2(p.x, p.y))
  const crown = add(hatGroup, new THREE.LatheGeometry(points, 64), hat); crown.scale.z = .84
  const segments = 64, rings = 8, vertices: number[] = [], indices: number[] = [], brimPoint = (r: number, a: number) => new THREE.Vector3(Math.cos(a) * r, -.045 - (r - .5) * .12 + (Math.cos(a * 2) * .060 + Math.sin(a * 3 + .4) * .016) * (r - .5) / .27, Math.sin(a) * r * .84)
  for (let ring = 0; ring <= rings; ring++) for (let j = 0; j <= segments; j++) { const v = brimPoint(.50 + ring / rings * .27, j / segments * Math.PI * 2); vertices.push(v.x, v.y, v.z) }
  for (let ring = 0; ring < rings; ring++) for (let j = 0; j < segments; j++) { const a = ring * (segments + 1) + j, b = a + segments + 1; indices.push(a, b, a + 1, a + 1, b, b + 1) }
  const brimGeometry = new THREE.BufferGeometry(); brimGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); brimGeometry.setIndex(indices); brimGeometry.computeVertexNormals()
  const brimMat = hat.clone(); brimMat.side = THREE.DoubleSide; owned.push(brimMat); add(hatGroup, brimGeometry, brimMat)
  const outer: number[][] = []; for (let j = 0; j <= 64; j++) { const v = brimPoint(.77, j / 64 * Math.PI * 2); outer.push([v.x, v.y, v.z]) } line(hatGroup, hatEdge, outer, .016)
  for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2; const seam = crownProfile.getPoints(30).slice(0, -3).map(p => [Math.cos(a) * (p.x + .002), p.y + .001, Math.sin(a) * (p.x + .002) * .84]); line(hatGroup, stitch, seam, .003) }

  const rig = createAvatarRig(parent, { hipHeight: .57, thighLength: .22, shoulderWidth: .22, shoulderHeight: 1.27, upperArmLength: .22, armSpread: .38 })
  const pose = rig.pose
  rig.pose = (stand, stride) => { pose(stand, stride); model.position.y = .35 * (1 - stand) }
  add(parent, new THREE.CylinderGeometry(.095, .105, .20, 20), skin, 0, 1.36)
  round(parent, knit, 0, 1.00, .015, .43, .59, .31, .075)
  // Open coat panels are separate rounded volumes, not a painted body texture.
  for (const side of [-1, 1]) {
    // A narrow, rounded neckline flows straight into the sloping sleeve cap.
    const panel = round(parent, plaid, side * .18, .995, .025, .285, .65, .39, .10); panel.rotation.z = -side * .06
    const lapel = round(parent, plaid, side * .115, 1.20, .211, .102, .24, .035, .012); lapel.rotation.z = side * -.25
    for (let j = 0; j < 2; j++) ball(parent, leather, side * .135, .99 - j * .15, .205, .019, .023, .009)
    round(parent, plaid, side * .225, .86, .205, .11, .06, .025, .012)
  }
  round(parent, plaid, 0, .99, -.16, .53, .61, .19, .08)
  const bag = new THREE.Group(); bag.position.set(0, 1.055, -.32); bag.scale.set(1, .93, 1); parent.add(bag)
  round(bag, backpack, 0, -.015, -.075, .49, .56, .22, .095); round(bag, packEdge, 0, .18, -.21, .42, .21, .075, .055); round(bag, backpack, 0, .205, -.235, .39, .16, .05, .045)
  round(bag, packEdge, 0, -.18, -.208, .30, .16, .10, .04); round(bag, backpack, 0, -.16, -.263, .28, .10, .025, .02)
  round(bag, leather, 0, .065, -.27, .047, .20, .018, .008)
  const buckle = add(bag, new THREE.TorusGeometry(.035, .008, 6, 4), brass, 0, .025, -.287); buckle.rotation.z = Math.PI / 4
  line(bag, packEdge, [[-.075, .25, 0], [-.06, .33, 0], [.06, .33, 0], [.075, .25, 0]], .025)
  for (const side of [-1, 1]) {
    line(parent, backpack, [[side * .16, 1.29, -.30], [side * .205, 1.32, -.06], [side * .205, 1.18, .21], [side * .22, .88, .20], [side * .21, .86, -.23]], .026)
    round(bag, backpack, side * .265, -.05, -.04, .07, .23, .13, .03)
  }
  for (let i = 0; i < 2; i++) {
    const thigh = add(rig.hips[i], new THREE.CapsuleGeometry(.105, .06, 6, 20), pants, 0, -.11); thigh.scale.z = .92
    ball(rig.knees[i], pants, 0, 0, 0, .094)
    add(rig.knees[i], new THREE.CapsuleGeometry(.101, .04, 6, 20), pants, 0, -.085)
    add(rig.knees[i], new THREE.CylinderGeometry(.106, .106, .09, 24), cuff, 0, -.18)
    round(rig.knees[i], leather, 0, -.245, .045, .23, .15, .30, .08); round(rig.knees[i], sole, 0, -.3125, .045, .215, .03, .31, .012)
    line(rig.knees[i], packEdge, [[-.065, -.20, .10], [0, -.19, .15], [.065, -.20, .10]], .009)
    add(rig.shoulders[i], new THREE.CapsuleGeometry(.102, .10, 6, 20), plaid, 0, -.11)
    add(rig.elbows[i], new THREE.CapsuleGeometry(.092, .10, 6, 20), plaid, 0, -.10)
    add(rig.elbows[i], new THREE.CylinderGeometry(.10, .10, .045, 20), pants, 0, -.205)
    ball(rig.elbows[i], skin, 0, -.265, .01, .105, .108, .102)
  }
  // Lower the torso with the shorter legs; seated lift preserves chair height.
  for (const child of model.children) if (!rig.hips.includes(child as THREE.Group)) child.position.y -= .11
  owner.userData.avatarRig = rig; owner.userData.avatarMaterials = owned; owner.userData.avatarTextures = textures; owner.userData.labelHeight = 2.79
  return (time: number, blowing: boolean) => { const blink = Math.sin(time * .83) > .996; eyes.forEach(e => e.scale.y = blink ? .1 : 1); smile.scale.x = blowing ? .5 : 1; head.rotation.x = blowing ? .10 : -.015; for (let i = 0; i < 2; i++) braids[i].rotation.z = Math.sin(time * 1.5 + i) * .025 }
}
