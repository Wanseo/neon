type RGB = readonly [number, number, number]
export interface NeonStyle {
  background: string
  shadow: RGB
  body: RGB
  rim: RGB
  highlight: RGB
}

// Transfer only the reference's colors and edge treatment; no shape or texture is sampled.
export const styles: readonly NeonStyle[] = [
  { background: '#ff350d', shadow: [0, 112, 151], body: [0, 204, 225], rim: [255, 156, 207], highlight: [216, 251, 255] },
  { background: '#cbd0f5', shadow: [193, 0, 51], body: [255, 13, 62], rim: [255, 133, 182], highlight: [255, 216, 236] },
  { background: '#039dc3', shadow: [87, 112, 65], body: [255, 150, 92], rim: [225, 151, 176], highlight: [255, 196, 187] },
  { background: '#ff91c5', shadow: [77, 136, 158], body: [255, 35, 146], rim: [255, 152, 211], highlight: [255, 216, 233] },
  { background: '#afd2ec', shadow: [0, 98, 78], body: [255, 103, 34], rim: [255, 57, 19], highlight: [255, 196, 175] },
  { background: '#ff3d0c', shadow: [21, 154, 171], body: [0, 220, 224], rim: [255, 164, 221], highlight: [255, 244, 255] },
  { background: '#03adc1', shadow: [98, 130, 45], body: [255, 162, 90], rim: [123, 153, 67], highlight: [255, 191, 133] },
  { background: '#072a12', shadow: [205, 88, 53], body: [255, 189, 207], rim: [255, 131, 108], highlight: [255, 228, 235] },
  { background: '#acd5f3', shadow: [211, 87, 71], body: [255, 130, 88], rim: [255, 179, 187], highlight: [255, 225, 228] },
]

export function createToneTable(style: NeonStyle) {
  const table = new Float32Array(256 * 3)
  for (let tone = 0; tone < 256; tone++) {
    // Compress internal contrast after spatial blur: broad shading, no fine face features.
    const t = .42 + .55 * Math.pow(tone / 255, .8)
    for (let channel = 0; channel < 3; channel++) {
      table[tone * 3 + channel] = style.shadow[channel]! * (1 - t) + style.body[channel]! * t
    }
  }
  return table
}
