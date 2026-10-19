export interface HoverRow {
  group: SVGGElement
  word: SVGGElement
  top: number
  bottom: number
}

// One continuous field follows the cursor; adjacent rows slide to make room.
export function installHoverMotion(poster: SVGSVGElement, rows: HoverRow[], left: number, right: number) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const amounts = rows.map(() => 0)
  let pointer: { x: number; y: number } | null = null
  let drift = 0
  let frame = 0
  let lastTime = 0

  function animate(time: number) {
    const dt = lastTime ? Math.min(time - lastTime, 50) : 16.67
    lastTime = time
    const easing = 1 - Math.exp(-dt / 115)
    let moving = false
    const extra = rows.map((row, index) => {
      const height = row.bottom - row.top
      const center = (row.top + row.bottom) / 2
      const target = pointer && !reducedMotion.matches
        ? Math.exp(-.5 * ((pointer.y - center) / (height * .56)) ** 2) : 0
      amounts[index] = amounts[index]! + (target - amounts[index]!) * easing
      if (Math.abs(target - amounts[index]!) > .0005) moving = true
      else amounts[index] = target
      return height * .16 * amounts[index]!
    })
    const targetDrift = pointer ? Math.max(-1, Math.min(1, (pointer.x - (left + right) / 2) / ((right - left) / 2))) * 7 : 0
    drift += (targetDrift - drift) * easing
    if (Math.abs(targetDrift - drift) > .01) moving = true
    const total = extra.reduce((sum, value) => sum + value, 0)
    let preceding = 0
    rows.forEach((row, index) => {
      const amount = amounts[index]!
      const scale = 1 + .16 * amount
      const cx = (left + right) / 2
      const cy = (row.top + row.bottom) / 2
      const shift = preceding + extra[index]! / 2 - total / 2
      row.group.setAttribute('transform', `translate(0 ${shift})`)
      row.word.setAttribute('transform', `translate(${cx + drift * amount} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`)
      preceding += extra[index]!
    })
    if (moving) frame = requestAnimationFrame(animate)
    else { frame = 0; lastTime = 0 }
  }
  function update() {
    if (!frame) frame = requestAnimationFrame(animate)
  }
  poster.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return
    const matrix = poster.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    pointer = point.x >= left && point.x <= right && point.y >= rows[0]!.top && point.y <= rows[rows.length - 1]!.bottom
      ? { x: point.x, y: point.y } : null
    update()
  })
  poster.addEventListener('pointerleave', () => { pointer = null; update() })
  poster.addEventListener('pointercancel', () => { pointer = null; update() })
  reducedMotion.addEventListener('change', update)
  window.addEventListener('blur', () => { pointer = null; update() })
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0 })
}
