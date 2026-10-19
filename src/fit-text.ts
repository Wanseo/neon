export function fitText(metrics: Pick<TextMetrics, 'actualBoundingBoxLeft' | 'actualBoundingBoxRight' | 'actualBoundingBoxAscent' | 'actualBoundingBoxDescent'>, box: readonly [number, number, number, number]) {
  const [x, y, width, height] = box
  const scaleX = width / (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight)
  const scaleY = height / (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)
  const offsetX = x + metrics.actualBoundingBoxLeft * scaleX
  const offsetY = y + metrics.actualBoundingBoxAscent * scaleY
  return { scaleX, scaleY, offsetX, offsetY }
}
