import * as THREE from 'three'

// A sculpted, expressive face built as native 3D geometry, so every camera angle works.
export function createRoomAvatarHead(parent: THREE.Group, hair: THREE.MeshStandardMaterial) {
  const head = new THREE.Group(); head.position.set(0, 2.04, 0); parent.add(head)
  const skin = new THREE.MeshStandardMaterial({ color: '#efd0b2', roughness: .63 })
  const white = new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: .3 })
  const iris = new THREE.MeshStandardMaterial({ color: '#715432', roughness: .22 })
  const dark = new THREE.MeshStandardMaterial({ color: '#211e1b', roughness: .38 })
  const lips = new THREE.MeshStandardMaterial({ color: '#bd706c', roughness: .55 })
  const blush = new THREE.MeshStandardMaterial({ color: '#e9ae9a', roughness: .8 })
  const highlight = new THREE.MeshBasicMaterial({ color: '#fffdf5' })
  function ellipsoid(group: THREE.Object3D, material: THREE.Material, position: number[], scale: number[]) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), material)
    mesh.position.set(position[0], position[1], position[2]); mesh.scale.set(scale[0], scale[1], scale[2]); mesh.castShadow = true; group.add(mesh); return mesh
  }
  function curve(group: THREE.Object3D, points: number[][], radius: number, material: THREE.Material) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])))
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 14, radius, 6, false), material); mesh.castShadow = true; group.add(mesh); return mesh
  }
  const face=ellipsoid(head,skin,[0,0,0],[.345,.405,.315]);face.castShadow=true
  const facePositions=face.geometry.attributes.position
  for(let i=0;i<facePositions.count;i++){const y=facePositions.getY(i);if(y<-.1)facePositions.setX(i,facePositions.getX(i)*(1-.12*Math.abs(y)))}
  face.geometry.computeVertexNormals()
  // A soft jaw and small ears keep the silhouette round, with a defined chin.
  for (const side of [-1, 1]) {
    ellipsoid(head, skin, [side * .335, -.015, -.005], [.055, .095, .055])
    ellipsoid(head, blush, [side * .354, -.012, .028], [.025, .055, .018])
  }
  ellipsoid(head, skin, [0, -.005, .302], [.045, .10, .046])
  ellipsoid(head, skin, [0, -.055, .357], [.056, .049, .054])
  const eyes: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(side * .137, .049, .287); head.add(eye); eyes.push(eye)
    ellipsoid(eye, white, [0, 0, 0], [.105, .074, .058])
    ellipsoid(eye, iris, [-side * .006, -.002, .05], [.051, .061, .022])
    ellipsoid(eye, dark, [-side * .006, 0, .069], [.031, .043, .009])
    ellipsoid(eye, highlight, [-.018, .025, .079], [.014, .017, .005])
    ellipsoid(eye, highlight, [.013, -.021, .079], [.005, .006, .003])
    curve(eye, [[-.096, .013, .013], [-.064, .062, .039], [0, .074, .04], [.066, .053, .035], [.098, .008, .013]], .006, dark)
    for (let i = 0; i < 3; i++) {
      const x = side * (.062 + i * .012)
      curve(eye, [[x, .048 - i * .008, .038], [x + side * .023, .063 - i * .006, .035]], .0035, dark)
    }
    const x = side * .137
    curve(head, [[x - .087, .175, .277], [x - .035, .195, .297], [x + .025, .193, .297], [x + .078, .176, .275]], .012, hair)
  }
  const mouth = new THREE.Group(); mouth.position.set(0, -.167, .304); head.add(mouth)
  ellipsoid(mouth, lips, [-.026, .005, .016], [.045, .016, .016])
  ellipsoid(mouth, lips, [.026, .005, .016], [.045, .016, .016])
  ellipsoid(mouth, lips, [0, -.014, .017], [.064, .018, .019])
  curve(mouth, [[-.061, -.002, .029], [0, -.001, .033], [.061, -.002, .029]], .0025, dark)

  // The bob is open at the face, with a swept side part and separate tapered locks.
  const positions: number[] = [], indices: number[] = [], around = 56, rows = 22
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= around; x++) {
    const phi = x / around * Math.PI * 2 - Math.PI
    const front = Math.max(0, Math.cos(phi)), side = Math.abs(Math.sin(phi))
    const limit = 2.43 - front * 1.47 + side * front * .25
    const theta = y / rows * limit
    const volume = 1 + .025 * Math.sin(phi * 5 + theta * 2)
    positions.push(Math.sin(phi) * Math.sin(theta) * .405 * volume, .065 + Math.cos(theta) * .455, -.025 + Math.cos(phi) * Math.sin(theta) * .35 * volume)
    if (y < rows && x < around) { const a = y * (around + 1) + x, b = a + around + 1; indices.push(a, b, a + 1, b, b + 1, a + 1) }
  }
  const capGeometry = new THREE.BufferGeometry(); capGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); capGeometry.setIndex(indices); capGeometry.computeVertexNormals()
  const cap = new THREE.Mesh(capGeometry, hair); cap.castShadow = true; head.add(cap)
  for (const side of [-1, 1]) {
    const lock = ellipsoid(head, hair, [side * .325, -.12, -.07], [.135, .34, .22]); lock.rotation.z = side * -.12
    for (let i = 0; i < 3; i++) {
      const strand = ellipsoid(head, hair, [side * (.24 + i * .045), -.34 - i * .013, -.04 + i * .025], [.075, .115, .125]); strand.rotation.z = side * (.2 + i * .16)
    }
  }
  curve(head, [[-.08, .49, -.005], [-.20, .41, .15], [-.30, .23, .19], [-.365, -.02, .14], [-.35, -.28, .07], [-.27, -.4, .035]], .052, hair)
  curve(head, [[-.07, .49, 0], [.14, .44, .11], [.29, .29, .20], [.36, .075, .16], [.36, -.19, .08], [.32, -.4, .005]], .068, hair)
  // A narrow seam suggests the part without a painted texture.
  curve(head, [[-.071, .492, .005], [-.085, .453, .10], [-.105, .383, .20]], .004, skin)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.09, .105, .2, 16), skin); neck.position.set(0, 1.64, 0); parent.add(neck)
  return (time: number, blowing: boolean) => {
    const blink = Math.sin(time * .83) > .996
    for (const eye of eyes) eye.scale.y = blink ? .12 : blowing ? .8 : 1
    mouth.scale.set(blowing ? .6 : 1, blowing ? 1.4 : 1, 1)
    head.rotation.z = Math.sin(time * .55) * .018
    head.rotation.x = blowing ? .09 : -.025
  }
}
