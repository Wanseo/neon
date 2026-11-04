import * as THREE from 'three'
import type { AnimalStyle } from './room-avatar-style'

// Original animal designs: muted ceramics, small button eyes, asymmetric pocket embroidery.
// No reference images, character textures, signature costumes or franchise marks are used.
export function createRoomAnimalAvatar(parent: THREE.Group, style: AnimalStyle, outfit: THREE.MeshStandardMaterial) {
  const fur = new THREE.MeshStandardMaterial({ color: style.fur, roughness: .88 })
  const detail = new THREE.MeshStandardMaterial({ color: style.detail, roughness: .9 })
  const cream = new THREE.MeshStandardMaterial({ color: '#f2e6cf', roughness: .9 })
  const eyesMaterial = new THREE.MeshStandardMaterial({ color: '#3f3b35', roughness: .5 })
  const noseMaterial = new THREE.MeshStandardMaterial({ color: style.species === 'penguin' ? '#cda775' : '#6d5b51', roughness: .8 })
  const accent = new THREE.MeshStandardMaterial({ color: style.accent, roughness: .9 })
  const shine = new THREE.MeshBasicMaterial({ color: '#f7f0df' })
  parent.userData.avatarMaterials = [fur, detail, cream, eyesMaterial, noseMaterial, accent, shine]
  function ball(group: THREE.Object3D, material: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) {
    const object = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), material); object.position.set(x, y, z); object.scale.set(sx, sy, sz); object.castShadow = true; group.add(object); return object
  }
  function tube(group: THREE.Object3D, points: number[][], radius: number, material: THREE.Material) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])))
    const object = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, radius, 5, false), material); group.add(object); return object
  }
  const head = new THREE.Group(); head.position.set(0, 2.01, .015); parent.add(head)
  ball(head, fur, 0, 0, 0, .425, .375, .325)
  if (style.species === 'sheep') {
    ball(head, detail, 0, -.025, .12, .30, .29, .245)
    for (let i = 0; i < 13; i++) { const a = i / 13 * Math.PI * 2; ball(head, fur, Math.cos(a) * .34, Math.sin(a) * .29 + .055, -.005, .11) }
  }
  const triangleEar = (side: number, outer: THREE.Material, inner: THREE.Material, tall = .32) => {
    const shape = new THREE.Shape(); shape.moveTo(-.1, -.045); shape.quadraticCurveTo(-.11, .06, -.065, tall * .65); shape.quadraticCurveTo(0, tall + .045, .055, tall * .68); shape.quadraticCurveTo(.13, .02, .1, -.045); shape.closePath()
    const ear = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .065, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, curveSegments: 10 }), outer)
    ear.position.set(side * .285, .24, -.035); ear.rotation.z = -side * .17; head.add(ear)
    ball(ear, inner, 0, tall * .36, .083, .055, tall * .32, .009)
  }
  for (const side of [-1, 1]) {
    switch (style.species) {
      case 'cat': case 'fox': triangleEar(side, fur, detail, style.species === 'fox' ? .35 : .23); break
      case 'rabbit': {
        const ear = ball(head, fur, side * .21, .60 + side * .045, -.04, .105, .36, .09); ear.rotation.z = -side * .18
        ball(ear, detail, 0, 0, .86, .55, .73, .13); break
      }
      case 'bear':
        ball(head, fur, side * .31, .295, -.035, .145); ball(head, detail, side * .31, .295, .09, .081, .083, .024); break
      case 'dog': {
        const ear = ball(head, detail, side * .385, -.055, -.015, .125, .31, .105); ear.rotation.z = side * .18; break
      }
      case 'sheep':
        ball(head, detail, side * .405, .04, .015, .13, .075, .07); break
      case 'deer':
        triangleEar(side, fur, detail, .17)
        tube(head, [[side * .21, .28, -.08], [side * .24, .48, -.08], [side * .32, .61, -.10]], .025, accent)
        tube(head, [[side * .245, .43, -.08], [side * .13, .52, -.06]], .021, accent); break
      case 'frog':
        ball(head, fur, side * .245, .275, .045, .145); break
      case 'penguin':
        ball(head, detail, side * .16, -.005, .255, .185, .25, .06); break
    }
  }
  if (['cat', 'dog', 'bear', 'fox', 'deer'].includes(style.species)) {
    ball(head, style.species === 'dog' ? cream : detail, 0, -.13, .265, style.species === 'fox' ? .25 : .20, .12, .09)
  }
  const eyes: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(side*(style.species==='frog'?.245:.155),style.species==='frog'?.292:.04,style.species==='frog'?.194:style.species==='sheep'?.336:.309); head.add(eye); eyes.push(eye)
    ball(eye, eyesMaterial, 0, 0, 0, .039, .053, .014).castShadow = false
    ball(eye, shine, -.009, .019, .015, .010, .012, .003).castShadow = false
  }
  if (style.species !== 'frog') {
    const nose = ball(head, noseMaterial, 0, -.105, .355, .043, style.species === 'penguin' ? .038 : .027, style.species === 'penguin' ? .075 : .025)
    if (style.species === 'penguin') nose.rotation.x = -.25
  }
  const mouth = new THREE.Group(); head.add(mouth)
  const mouthZ=style.species==='frog'||style.species==='penguin'?.30:.343
  tube(mouth,[[-.065,-.185,mouthZ],[0,-.202,mouthZ+.01],[.065,-.179,mouthZ]],.007,eyesMaterial)
  if (style.species === 'cat') for (const side of [-1, 1]) for (let i = 0; i < 2; i++) tube(head, [[side * .20, -.11 - i * .033, .30], [side * .31, -.09 - i * .05, .26]], .003, noseMaterial)
  if (style.species === 'frog') for (const side of [-1, 1]) ball(head, detail, side * .27, -.12, .25, .065, .026, .009)
  if (style.species === 'deer') for (const side of [-1, 1]) for (let i = 0; i < 3; i++) ball(head, cream, side * (.25 + i * .032), -.07 - (i % 2) * .035, .265 - i * .025, .013, .018, .008)
  // Seated knit tunic, paws, and a deliberately simple non-signature pocket motif.
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.255, .32, 5, 16), outfit); torso.position.set(0, 1.21, 0); torso.scale.z = .8; parent.add(torso)
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.10, .27, 4, 10), outfit); arm.position.set(side * .33, 1.31, .18); arm.rotation.x = -.8; parent.add(arm)
    ball(parent, fur, side * .33, 1.12, .41, .105)
    ball(parent, fur, side * .15, .63, .19, .09, .23, .10)
    ball(parent, detail, side * .15, .43, .28, .11, .075, .155)
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.13, .025, 5, 22), cream); collar.rotation.x = Math.PI / 2; collar.position.y = 1.5; parent.add(collar)
  ball(parent, accent, -.11, 1.24, .215, .07, .085, .012)
  for (let i = 0; i < 2; i++) ball(parent, cream, -.13 + i * .045, 1.27, .228, .009)
  if (style.species === 'fox' || style.species === 'cat') {
    const tail = tube(parent, [[.17, .86, -.2], [.50, .9, -.38], [.6, 1.17, -.4]], style.species === 'fox' ? .11 : .045, fur); tail.castShadow = true
  }
  if (style.species === 'rabbit') ball(parent, cream, 0, .88, -.3, .10)
  if (style.species === 'penguin') ball(parent, detail, 0, 1.04, .175, .16, .21, .06)
  parent.userData.labelHeight = style.species === 'rabbit' ? 3.25 : style.species === 'deer' ? 3.0 : 2.85
  return (time: number, blowing: boolean) => {
    const blink = Math.sin(time * .83) > .996
    eyes.forEach(eye => eye.scale.y = blink ? .12 : 1)
    head.rotation.z = Math.sin(time * .6) * .025; head.rotation.x = blowing ? .12 : -.02
    mouth.scale.x = blowing ? .5 : 1
  }
}
