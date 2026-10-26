import * as THREE from 'three'

export function createVoxelCharacter(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
  renderer.setClearColor(0, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.className = 'character-3d'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50)
  camera.position.set(0, 1.8, 7)
  camera.lookAt(0, 1.6, 0)
  scene.add(new THREE.HemisphereLight(0xd8e5ff, 0x34304a, 2.5))
  const light = new THREE.DirectionalLight(0xffdfb0, 3)
  light.position.set(-3, 5, 5); scene.add(light)
  const rim = new THREE.DirectionalLight(0x739aff, 2)
  rim.position.set(3, 3, -3); scene.add(rim)
  const model = new THREE.Group()
  scene.add(model)
  const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0 })
  const blue = material(0x3156bc), blueDark = material(0x233b85), blueLight = material(0x466bd1)
  const skin = material(0xe5b78f), mint = material(0x8dd2b8), darkMint = material(0x65aa94)
  const black = material(0x171923), sole = material(0x393b46), gray = material(0x777d8a), pale = material(0xd4d6d3)
  function box(parent: THREE.Object3D, size: number[], position: number[], mat: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat)
    mesh.position.set(position[0]!, position[1]!, position[2]!)
    parent.add(mesh); return mesh
  }
  // Chunky silhouette, with actual front, side and back surfaces.
  box(model, [.76, .92, .5], [0, 1.63, 0], blue)
  box(model, [.84, .18, .54], [0, 1.16, 0], blueDark)
  box(model, [.14, .76, .025], [0, 1.64, .265], gray)
  for (let i = 0; i < 5; i++) box(model, [.14, .045, .03], [0, 1.32 + i * .13, .282], pale)
  box(model, [.02, .88, .035], [0, 1.62, .31], blueDark)
  for (const side of [-1, 1]) {
    box(model, [.025, .4, .028], [side * .16, 1.9, .3], pale)
    box(model, [.21, .15, .04], [side * .21, 1.4, .29], blueDark)
  }
  box(model, [.26, .21, .28], [0, 2.16, .03], skin)
  const head = new THREE.Group(); model.add(head)
  box(head, [.69, .88, .55], [0, 2.66, -.08], blue)
  box(head, [.54, .1, .52], [0, 3.14, -.05], blueLight)
  box(head, [.79, .58, .53], [0, 2.69, -.08], blue)
  box(head, [.56, .76, .33], [0, 2.65, .17], skin)
  box(head, [.43, .12, .32], [0, 2.23, .13], skin)
  for (const side of [-1, 1]) box(head, [.12, .78, .31], [side * .35, 2.64, .12], blueDark)
  // Mint fringe emerges from the raised hood.
  for (let i = 0; i < 6; i++) {
    box(head, [.11, .16 + (i % 3) * .045, .11], [-.265 + i * .105, 2.99 - (i % 2) * .045, .36], i % 2 ? mint : darkMint)
  }
  box(head, [.1, .12, .12], [.13, 3.14, .22], mint)
  box(head, [.07, .11, .1], [0, 2.67, .39], skin)
  // Rectangular glasses have open centers, so the face has real depth.
  for (const side of [-1, 1]) {
    const eye = side * .155
    box(head, [.24, .035, .035], [eye, 2.79, .38], black)
    box(head, [.24, .035, .035], [eye, 2.59, .38], black)
    for (const edge of [-1, 1]) box(head, [.025, .2, .035], [eye + edge * .115, 2.69, .38], black)
    box(head, [.04, .07, .025], [eye, 2.7, .35], black)
    box(head, [.027, .03, .32], [side * .28, 2.77, .22], black)
  }
  box(head, [.08, .025, .035], [0, 2.71, .4], black)
  box(head, [.09, .018, .02], [0, 2.4, .35], blueDark)
  const arms: THREE.Group[] = [], legs: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * .49, 2.01, 0); model.add(arm)
    box(arm, [.24, .76, .35], [0, -.37, 0], blue)
    box(arm, [.25, .12, .35], [0, -.78, 0], blueDark)
    box(arm, [.17, .12, .24], [0, -.88, .03], skin)
    arm.rotation.z = side * .055; arms.push(arm)
    const leg = new THREE.Group(); leg.position.set(side * .21, 1.13, 0); model.add(leg)
    box(leg, [.36, .9, .4], [0, -.43, 0], black)
    box(leg, [.39, .16, .47], [0, -.89, .03], black)
    box(leg, [.4, .14, .64], [0, -1.025, .12], sole)
    box(leg, [.39, .11, .55], [0, -.98, .16], black)
    legs.push(leg)
  }
  // Soft contact shadow stays under the feet, independent of facing direction.
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.58, 32), new THREE.MeshBasicMaterial({ color: 0x111526, transparent: true, opacity: .16, depthWrite: false }))
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.01; shadow.scale.y = .5; scene.add(shadow)
  host.append(renderer.domElement)
  function resize() {
    const width = host.clientWidth, height = host.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height; camera.updateProjectionMatrix()
    renderer.render(scene, camera)
  }
  new ResizeObserver(resize).observe(host)
  resize()
  return {
    render(walking: boolean, facing: number, time: number, turned: boolean) {
      model.rotation.y = turned ? facing * 1.15 : -.15
      const stride = walking ? Math.sin(time * 10) * .52 : 0
      legs[0]!.rotation.x = stride; legs[1]!.rotation.x = -stride
      arms[0]!.rotation.x = -stride * .7; arms[1]!.rotation.x = stride * .7
      model.position.y = walking ? -1.08 * (1 - Math.cos(stride)) : 0
      head.rotation.z = walking ? Math.sin(time * 5) * .015 : 0
      renderer.render(scene, camera)
      host.dataset.facing = turned ? (facing > 0 ? 'right' : 'left') : 'front'
      host.dataset.walking = String(walking)
    },
  }
}
