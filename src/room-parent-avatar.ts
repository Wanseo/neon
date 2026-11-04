import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// Original parent avatars inspired by warm proportions, round frames and everyday clothing.
export function createRoomParentAvatar(parent: THREE.Group, role: 'dad' | 'mom', outfit: THREE.MeshStandardMaterial, hair: THREE.MeshStandardMaterial) {
  const skin = new THREE.MeshStandardMaterial({ color: '#f0c39c', roughness: .8 })
  const cream = new THREE.MeshStandardMaterial({ color: '#fff3db', roughness: .8 })
  const iris = new THREE.MeshStandardMaterial({ color: '#514335', roughness: .65 })
  const frames = new THREE.MeshStandardMaterial({ color: '#44493c', roughness: .6, metalness: .08 })
  const mouthMaterial = new THREE.MeshStandardMaterial({ color: '#9a6144', roughness: .9 })
  const beard = new THREE.MeshStandardMaterial({ color: '#a28664', roughness: 1 })
  const noseMaterial = new THREE.MeshStandardMaterial({ color: '#e3a271', roughness: .9 })
  const gold = new THREE.MeshStandardMaterial({ color: '#d7b36b', roughness: .35, metalness: .5 })
  const pants = new THREE.MeshStandardMaterial({ color: '#bab28f', roughness: .95 })
  const leather = new THREE.MeshStandardMaterial({ color: '#795c43', roughness: .8 })
  const collarMaterial = new THREE.MeshStandardMaterial({ color: '#bad0b3', roughness: .95 })
  parent.userData.avatarMaterials = [skin, cream, iris, frames, mouthMaterial, beard, noseMaterial, gold, pants, leather, collarMaterial]
  function ball(group: THREE.Object3D, material: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) {
    const object = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), material); object.position.set(x, y, z); object.scale.set(sx, sy, sz); group.add(object); return object
  }
  function curve(group: THREE.Object3D, points: number[][], radius: number, material: THREE.Material) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])))
    const object = new THREE.Mesh(new THREE.TubeGeometry(path, 18, radius, 6, false), material); group.add(object); return object
  }
  function box(group: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) {
    const object = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); object.position.set(x, y, z); group.add(object); return object
  }
  const head = new THREE.Group(); head.position.set(0, 2.07, 0); parent.add(head)
  if (role === 'mom') {
    const back = ball(head, hair, 0, -.045, -.13, .46, .56, .31); back.castShadow = true
    for (const side of [-1, 1]) { const lock = ball(head, hair, side * .37, -.13, -.03, .105, .43, .19); lock.rotation.z = -side * .08; lock.castShadow = true }
  }
  const faceGeometry=new RoundedBoxGeometry(role==='dad'?.88:.84,.75,.65,5,.21)
  let faceMaterial=skin
  if(role==='dad'){
    faceMaterial=skin.clone();faceMaterial.vertexColors=true;parent.userData.avatarMaterials.push(faceMaterial)
    const positions=faceGeometry.attributes.position,colors=new Float32Array(positions.count*3),whiteTint=new THREE.Color('#ffffff'),beardTint=new THREE.Color('#ac957b'),color=new THREE.Color()
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i)
      const lower=1-THREE.MathUtils.smoothstep(y,-.29,-.09),front=THREE.MathUtils.smoothstep(z,.05,.25),mouthOpening=1-.9*Math.exp(-((x/.18)**2+((y+.19)/.065)**2)*1.7)
      color.copy(whiteTint).lerp(beardTint,lower*front*mouthOpening*.58);color.toArray(colors,i*3)
    }
    faceGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
  }
  const face = new THREE.Mesh(faceGeometry,faceMaterial); face.position.set(0, -.015, .015); face.castShadow = true; head.add(face)
  for (const side of [-1, 1]) ball(head, skin, side * .44, -.06, .015, .075, .105, .06)
  const crown = ball(head, hair, 0, .25, -.07, role === 'dad' ? .455 : .45, role === 'dad' ? .29 : .32, .38); crown.castShadow = true
  if (role === 'dad') {
    for (let i = 0; i < 6; i++) { const tuft = ball(head, hair, -.30 + i * .116, .29 + Math.sin(i * .6) * .055, .245, .11, .08, .095); tuft.rotation.z = -.3 + i * .045; tuft.castShadow = true }
    for (const side of [-1, 1]) ball(head, hair, side * .397, .075, -.005, .065, .18, .12)
  } else {
    const leftBang=ball(head,hair,-.13,.345,.23,.078,.215,.09);leftBang.rotation.z=-.62
    const rightBang=ball(head,hair,.14,.345,.23,.085,.22,.09);rightBang.rotation.z=.62
    for (const side of [-1, 1]) {
      const earring = new THREE.Mesh(new THREE.TorusGeometry(.032, .008, 6, 20), gold); earring.position.set(side * .45, -.19, .105); head.add(earring)
    }
  }
  const eyes: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(side * .195, .025, .345); head.add(eye); eyes.push(eye)
    ball(eye, cream, 0, 0, 0, .108, .125, .012)
    ball(eye, iris, side * .014, .002, .013, .057, .098, .009)
    ball(eye, cream, -.014, .048, .022, .010, .017, .003)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.154, .014, 7, 40), frames); ring.position.set(side * .195, .028, .388); head.add(ring)
    curve(head, [[side * .345, .038, .385], [side * .42, .055, .25], [side * .47, .025, .06]], .011, frames)
    curve(head, [[side * .115, .237, .307], [side * .19, .258, .315], [side * .27, .237, .301]], role === 'dad' ? .018 : .010, hair)
  }
  curve(head, [[-.04, .05, .39], [0, .071, .401], [.04, .05, .39]], .012, frames)
  ball(head, noseMaterial, 0, -.073, .36, .043, .066, .042)
  const smile = curve(head, [[-.10, -.195, .336], [-.035, -.225, .348], [.035, -.225, .348], [.10, -.195, .336]], .009, mouthMaterial)
  if (role === 'dad') {
    curve(head,[[-.085,-.148,.346],[-.043,-.139,.354],[0,-.153,.357],[.043,-.139,.354],[.085,-.148,.346]],.009,beard)
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.10, .11, .18, 16), skin); neck.position.y = 1.65; parent.add(neck)
  if (role === 'dad') {
    const shirt = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .33, 6, 20), outfit); shirt.position.y = 1.23; shirt.scale.z = .8; shirt.castShadow = true; parent.add(shirt)
    for (const side of [-1, 1]) { const collar = box(parent, .14, .06, .10, collarMaterial, side * .08, 1.51, .15); collar.rotation.z = side * .3 }
    box(parent, .008, .38, .009, collarMaterial, 0, 1.24, .218)
    for (let i = 0; i < 4; i++) ball(parent, cream, 0, 1.40 - i * .09, .225, .012, .015, .007)
  } else {
    // A small original botanical print, drawn procedurally instead of copying the reference.
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#eee4cc'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 17; i++) {
      const x = (i * 79 + 23) % 256, y = (i * 113 + 17) % 256, r = 7 + i % 4
      ctx.fillStyle = ['#d5a799', '#c4b38b', '#b4bca0', '#bcaec0'][i % 4]
      for (let petal = 0; petal < 6; petal++) { const a = petal / 6 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * .65, y + Math.sin(a) * r * .65, r * .5, r * .4, a, 0, Math.PI * 2); ctx.fill() }
      ctx.fillStyle = '#eee4cc'; ctx.beginPath(); ctx.arc(x, y, r * .23, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#a9b293'; ctx.beginPath(); ctx.ellipse(x + 12, y + 10, 5, 2, -.6, 0, Math.PI * 2); ctx.fill()
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; parent.userData.avatarTextures = [texture]
    outfit.color.set('#ffffff'); outfit.map = texture; outfit.needsUpdate = true
    const bodice = new THREE.Mesh(new THREE.CylinderGeometry(.225, .285, .42, 32), outfit); bodice.position.y = 1.31; bodice.castShadow = true; parent.add(bodice)
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.28, .39, .34, 36), outfit); skirt.position.y = .94; skirt.castShadow = true; parent.add(skirt)
    const waistband = new THREE.Mesh(new THREE.CylinderGeometry(.288, .288, .025, 32), cream); waistband.position.y = 1.115; parent.add(waistband)
  }
  for (const side of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.11, .16, 5, 14), outfit); sleeve.position.set(side * .32, 1.37, .12); sleeve.rotation.x = -.65; parent.add(sleeve)
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.077, .18, 4, 12), skin); arm.position.set(side * .34, 1.18, .28); arm.rotation.x = -.85; parent.add(arm)
    ball(parent, skin, side * .34, 1.09, .415, .095)
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.078, .27, 4, 12), role === 'dad' ? pants : skin); leg.position.set(side * .16, .66, .20); parent.add(leg)
    ball(parent, leather, side * .16, .43, .29, .10, .075, .15)
    if (role === 'mom') { ball(parent, skin, side * .16, .485, .28, .071, .025, .08); box(parent, .14, .017, .035, leather, side * .16, .50, .29) }
  }
  parent.userData.labelHeight = 2.95
  return (time: number, blowing: boolean) => {
    const blink = Math.sin(time * .83) > .996
    eyes.forEach(eye => eye.scale.y = blink ? .12 : 1)
    smile.scale.x = blowing ? .55 : 1
    head.rotation.x = blowing ? .10 : -.02; head.rotation.z = Math.sin(time * .55) * .015
  }
}
