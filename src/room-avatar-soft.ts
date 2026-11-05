import * as THREE from 'three'

// A continuous pillow surface: no flat box faces or hard corner transitions.
export function plushGeometry(width: number, height: number, depth: number, softness = .72) {
  const geometry = new THREE.SphereGeometry(1, 40, 28), positions = geometry.attributes.position
  const rounded = (value: number) => Math.sign(value) * Math.pow(Math.abs(value), softness)
  for (let i = 0; i < positions.count; i++) positions.setXYZ(i, rounded(positions.getX(i)) * width / 2, rounded(positions.getY(i)) * height / 2, rounded(positions.getZ(i)) * depth / 2)
  geometry.computeVertexNormals()
  return geometry
}
