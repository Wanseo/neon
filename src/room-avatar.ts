import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Soft toy-like proportions, a straight bob, and a large pink ribbon.
export function createRoomAvatarHead(parent: THREE.Group, hair: THREE.MeshStandardMaterial,role:'dad'|'daughter'='daughter') {
  const head = new THREE.Group(); head.position.set(0, 2.01, 0); parent.add(head)
  const skin = new THREE.MeshStandardMaterial({ color: '#f7c58d', roughness: .85 })
  const white = new THREE.MeshStandardMaterial({ color: '#fff5dc', roughness: .8 })
  const eyesMaterial = new THREE.MeshStandardMaterial({ color: '#49473e', roughness: .75 })
  const eyeShine = new THREE.MeshStandardMaterial({ color: '#6c6a5d', roughness: .75 })
  const noseMaterial = new THREE.MeshStandardMaterial({ color: '#d57c42', roughness: .85 })
  const smileMaterial = new THREE.MeshStandardMaterial({ color: '#7a4c32', roughness: .9 })
  const cheekMaterial = new THREE.MeshStandardMaterial({ color: '#f0ac80', roughness: 1 })
  const ribbonMaterial = new THREE.MeshStandardMaterial({ color: '#ed6aa8', roughness: .65 })
  parent.userData.avatarMaterials=[skin,white,eyesMaterial,eyeShine,noseMaterial,smileMaterial,cheekMaterial,ribbonMaterial]
  function ellipsoid(group: THREE.Object3D, material: THREE.Material, position: number[], scale: number[]) {
    const object = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material)
    object.position.set(position[0], position[1], position[2]); object.scale.set(scale[0], scale[1], scale[2]); group.add(object); return object
  }
  function roundedBox(group: THREE.Object3D, width: number, height: number, depth: number, radius: number, material: THREE.Material, x: number, y: number, z: number) {
    const geometry = new THREE.BoxGeometry(width, height, depth, 8, 8, 8), positions = geometry.attributes.position
    const half = new THREE.Vector3(width / 2 - radius, height / 2 - radius, depth / 2 - radius), point = new THREE.Vector3(), center = new THREE.Vector3()
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i); center.copy(point).clamp(half.clone().negate(), half)
      point.sub(center).normalize().multiplyScalar(radius).add(center); positions.setXYZ(i, point.x, point.y, point.z)
    }
    geometry.deleteAttribute('normal');geometry.deleteAttribute('uv');const smoothGeometry=mergeVertices(geometry,1e-4);smoothGeometry.computeVertexNormals();geometry.dispose();const object = new THREE.Mesh(smoothGeometry, material); object.position.set(x, y, z); object.castShadow = true; group.add(object); return object
  }
  const backHair=ellipsoid(head,hair,role==='dad'?[0,.22,-.10]:[0,.015,-.145],role==='dad'?[.445,.31,.35]:[.465,.54,.37]);backHair.castShadow=true
  roundedBox(head, .81, .77, .61, .19, skin, 0, -.025, .015)
  roundedBox(head,.78,role==='dad'?.21:.29,.17,.055,hair,0,role==='dad'?.30:.254,.276)
  for (const side of [-1, 1]) {
    const sideHair=ellipsoid(head,hair,role==='dad'?[side*.385,.13,-.02]:[side*.398,-.045,.025],role==='dad'?[.075,.19,.13]:[.092,.45,.18]);sideHair.rotation.z=-side*.035;sideHair.castShadow=true
    ellipsoid(head, skin, [side * .405, -.07, .015], [.045, .085, .055])
    ellipsoid(head, cheekMaterial, [side * .255, -.15, .322], [.085, .027, .006])
  }
  const eyes: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(side * .175, .015, .325); head.add(eye); eyes.push(eye)
    ellipsoid(eye, white, [0, 0, 0], [.096, .122, .014])
    ellipsoid(eye, eyesMaterial, [side * .014, 0, .015], [.07, .105, .009])
    ellipsoid(eye, eyeShine, [side * .019, .019, .023], [.017, .055, .003])
    const lashPath = new THREE.CatmullRomCurve3([new THREE.Vector3(-.09, .025, .001), new THREE.Vector3(-.071, .105, .003), new THREE.Vector3(0, .126, .003), new THREE.Vector3(.072, .09, .002)])
    eye.add(new THREE.Mesh(new THREE.TubeGeometry(lashPath, 14, .005, 5, false), smileMaterial))
    for (let i = 0; i < 2; i++) {
      const lash = new THREE.Mesh(new THREE.CapsuleGeometry(.004, .024, 3, 5), smileMaterial)
      lash.position.set(side * (.078 + i * .009), .08 - i * .024, 0); lash.rotation.z = side * .9; eye.add(lash)
    }
  }
  ellipsoid(head, noseMaterial, [0, -.088, .344], [.055, .027, .023])
  const smilePath = new THREE.CatmullRomCurve3([new THREE.Vector3(-.097, -.198, .327), new THREE.Vector3(-.035, -.211, .334), new THREE.Vector3(.035, -.211, .334), new THREE.Vector3(.097, -.185, .327)])
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smilePath, 18, .009, 6, false), smileMaterial); head.add(smile)
  if(role==='daughter'){
  // Rounded triangular fabric loops create the silhouette of the reference bow.
  const bow = new THREE.Group(); bow.position.set(0, .58, -.015); head.add(bow)
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape(); shape.moveTo(side * .015, -.02); shape.bezierCurveTo(side * .10, .12, side * .29, .27, side * .33, .13); shape.bezierCurveTo(side * .36, .02, side * .24, -.14, side * .07, -.09); shape.quadraticCurveTo(side * .025, -.08, side * .015, -.02)
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .07, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 3, steps: 1, curveSegments: 14 })
    const loop = new THREE.Mesh(geometry, ribbonMaterial); loop.castShadow = true; bow.add(loop)
  }
  ellipsoid(bow, ribbonMaterial, [0, -.015, .065], [.085, .085, .07])
  }
  parent.userData.labelHeight=role==='dad'?2.8:3.0
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.095, .10, .17, 16), skin); neck.position.set(0, 1.61, 0); parent.add(neck)
  return (time: number, blowing: boolean) => {
    const blink = Math.sin(time * .83) > .996
    for (const eye of eyes) eye.scale.y = blink ? .1 : 1
    smile.scale.set(blowing ? .55 : 1, blowing ? 1.1 : 1, 1)
    head.rotation.z = Math.sin(time * .55) * .018; head.rotation.x = blowing ? .10 : -.02
  }
}
