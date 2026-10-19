export function alignCity(context: CanvasRenderingContext2D, word: string, left: number, right: number) {
  const characters = Array.from(word)
  const glyphs = characters.map((character, index) => {
    const metrics = context.measureText(character)
    // Include the font's pair kerning in each glyph's natural position.
    const prefixWidth = context.measureText(characters.slice(0, index + 1).join('')).width
    return { character, start: prefixWidth - metrics.width, metrics }
  })
  const first = glyphs[0]!
  const last = glyphs[glyphs.length - 1]!
  const naturalLeft = first.start - first.metrics.actualBoundingBoxLeft
  const naturalRight = last.start + last.metrics.actualBoundingBoxRight
  const tracking = characters.length > 1 ? (right - left - (naturalRight - naturalLeft)) / (characters.length - 1) : 0
  return glyphs.map((glyph, index) => ({
    character: glyph.character,
    x: left - naturalLeft + glyph.start + tracking * index,
  }))
}

// Fit with font size first; alignCity only corrects subpixel measurement rounding.
export function fitCitySize(context: CanvasRenderingContext2D, word: string, width: number, family: string) {
  let size = 100
  for (let iteration = 0; iteration < 5; iteration++) {
    context.font = `900 ${size}px ${family}`
    const metrics = context.measureText(word)
    size *= width / (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight)
  }
  context.font = `900 ${size}px ${family}`
  return size
}
