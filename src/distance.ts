// Inward distance from a binary person contour. Diagonal steps preserve rounded edges.
export function inwardDistance(mask: Uint8ClampedArray, size: number, output: Float32Array) {
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x
    output[i] = mask[i * 4]! < 115 || x === 0 || y === 0 || x === size - 1 || y === size - 1 ? 0 : size
  }
  for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) {
    const i = y * size + x
    output[i] = Math.min(output[i]!, output[i - 1]! + 1, output[i - size]! + 1, output[i - size - 1]! + 1.414, output[i - size + 1]! + 1.414)
  }
  for (let y = size - 2; y > 0; y--) for (let x = size - 2; x > 0; x--) {
    const i = y * size + x
    output[i] = Math.min(output[i]!, output[i + 1]! + 1, output[i + size]! + 1, output[i + size + 1]! + 1.414, output[i + size - 1]! + 1.414)
  }
  return output
}
