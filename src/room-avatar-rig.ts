import * as THREE from 'three'

export type AvatarRig = { hips: THREE.Group[]; knees: THREE.Group[]; shoulders: THREE.Group[]; elbows: THREE.Group[]; pose: (stand: number, stride: number) => void }
type RigProportions = { hipHeight?: number; thighLength?: number; shoulderWidth?: number; shoulderHeight?: number; upperArmLength?: number; armSpread?: number }
export function createAvatarRig(parent: THREE.Group, proportions: RigProportions = {}): AvatarRig {
  const { hipHeight = .92, thighLength = .40, shoulderWidth = .32, shoulderHeight = 1.46, upperArmLength = .26, armSpread = .10 } = proportions
  const hips: THREE.Group[] = [], knees: THREE.Group[] = [], shoulders: THREE.Group[] = [], elbows: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const joint = (name: string, target: THREE.Object3D, x: number, y: number, z = 0) => { const g = new THREE.Group(); g.name = `${name}-${side < 0 ? 'L' : 'R'}`; g.position.set(x, y, z); target.add(g); return g }
    const hip = joint('hip', parent, side * .155, hipHeight), knee = joint('knee', hip, 0, -thighLength)
    const shoulder = joint('shoulder', parent, side * shoulderWidth, shoulderHeight), elbow = joint('elbow', shoulder, 0, -upperArmLength)
    hips.push(hip); knees.push(knee); shoulders.push(shoulder); elbows.push(elbow)
  }
  const rig: AvatarRig = { hips, knees, shoulders, elbows, pose(stand, stride) {
    for (let i = 0; i < 2; i++) {
      const step = stride * (i === 0 ? 1 : -1), seated = 1 - stand
      hips[i].rotation.x = -Math.PI / 2 * seated + step * .48 * stand
      knees[i].rotation.x = Math.PI / 2 * seated + Math.max(0, -step) * .65 * stand
      shoulders[i].rotation.x = -.82 * seated - step * .40 * stand
      shoulders[i].rotation.z = (i === 0 ? -armSpread : armSpread) * stand
      elbows[i].rotation.x = -.45 * seated - .10 * stand - Math.max(0, step) * .12 * stand
    }
  } }
  parent.userData.avatarRig = rig
  return rig
}

// Convert the earlier fixed limb meshes once. Animation then uses actual joints,
// including separate thighs and shins, rather than translating the seated meshes.
export function rigExistingAvatar(parent: THREE.Group) {
  const original = [...parent.children], rig = createAvatarRig(parent)
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1
    const legs = original.filter(o => o instanceof THREE.Mesh && o.position.y < .8 && Math.sign(o.position.x) === side && Math.abs(o.position.x) > .07)
    const calf = legs.sort((a, b) => b.position.y - a.position.y)[0] as THREE.Mesh | undefined
    if (calf) {
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.081, .24, 5, 14), calf.material); thigh.position.y = -.20; thigh.castShadow = true; rig.hips[i].add(thigh)
      const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(.079, 16, 12), calf.material); kneeCap.castShadow = true; rig.knees[i].add(kneeCap)
      for (const part of legs) {
        const oldY = part.position.y, oldZ = part.position.z
        rig.knees[i].add(part); part.position.x -= side * .155
        if (part === calf) { part.position.y = -.20; part.position.z = 0 }
        else { part.position.y = -.40 + (oldY - .43); part.position.z = oldZ - .20 }
      }
    }
    const arms = original.filter(o => o instanceof THREE.Mesh && Math.abs(o.position.x) > .27 && Math.sign(o.position.x) === side && o.position.y > 1 && o.position.y < 1.5).sort((a, b) => b.position.y - a.position.y)
    for (let j = 0; j < arms.length; j++) {
      const part = arms[j], last = j === arms.length - 1
      if (j === 0) { rig.shoulders[i].add(part); part.position.set(0, -.13, 0); part.rotation.set(0, 0, 0); part.scale.y *= .75 }
      else { rig.elbows[i].add(part); part.position.set(0, last ? -.28 : -.12, 0); part.rotation.set(0, 0, 0) }
    }
    if (arms.length === 2) {
      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .12, 4, 12), (arms[1] as THREE.Mesh).material); forearm.position.y = -.13; forearm.castShadow = true; rig.elbows[i].add(forearm)
    }
  }
  return rig
}
