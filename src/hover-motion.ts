export interface HoverRow {
  group: SVGGElement
  word: SVGGElement
  text: SVGTextElement
  top: number
  bottom: number
}

export function installHoverMotion(poster: SVGSVGElement, rows: HoverRow[], left: number, right: number) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const amounts = rows.map(() => 0)
  const colors = rows.map(() => 0)
  const shifts = rows.map(() => 0)
  let active = -1
  let panY = 0
  let panX = 0
  let frame = 0
  let lastTime = 0

  function animate(time: number) {
    const dt = lastTime ? Math.min(time - lastTime, 50) : 16.67
    lastTime = time
    const easing = reducedMotion.matches ? 1 : 1 - Math.exp(-dt / 155)
    let moving = false
    const follow = (value: number, target: number, tolerance = .0005) => {
      const next = value + (target - value) * easing
      if (Math.abs(target - next) > tolerance) { moving = true; return next }
      return target
    }
    const activeCenter = active < 0 ? 0 : (rows[active]!.top + rows[active]!.bottom) / 2
    const extra = rows.map((row, index) => {
      const height = row.bottom - row.top
      const center = (row.top + row.bottom) / 2
      const target = active >= 0 && !reducedMotion.matches
        ? Math.exp(-.5 * ((activeCenter - center) / (height * .56)) ** 2) : 0
      amounts[index] = follow(amounts[index]!, target)
      colors[index] = follow(colors[index]!, active === index ? 1 : 0)
      return height * .16 * amounts[index]!
    })
    const total = extra.reduce((sum, value) => sum + value, 0)
    let preceding = 0
    rows.forEach((_, index) => {
      shifts[index] = preceding + extra[index]! / 2 - total / 2
      preceding += extra[index]!
    })
    const centerX = (left + right) / 2
    const viewBox = poster.viewBox.baseVal
    const targetY = active < 0 || reducedMotion.matches ? 0 : viewBox.y + viewBox.height / 2 - activeCenter - shifts[active]!
    const targetX = active < 0 || reducedMotion.matches ? 0 : viewBox.x + viewBox.width / 2 - centerX
    panY = follow(panY, targetY, .01)
    panX = follow(panX, targetX, .01)
    rows.forEach((row, index) => {
      const scale = 1 + .16 * amounts[index]!
      const cy = (row.top + row.bottom) / 2
      row.group.setAttribute('transform', `translate(${panX} ${shifts[index]! + panY})`)
      row.word.setAttribute('transform', `translate(${centerX} ${cy}) scale(${scale}) translate(${-centerX} ${-cy})`)
      const blend = colors[index]!
      const color = [11 + (168 - 11) * blend, 11 + (240 - 11) * blend, 10 * (1 - blend)].map(Math.round)
      row.text.setAttribute('fill', `rgb(${color.join(' ')})`)
    })
    if (moving) frame = requestAnimationFrame(animate)
    else { frame = 0; lastTime = 0 }
  }
  function update() { if (!frame) frame = requestAnimationFrame(animate) }
  function reset() { active = -1; update() }
  poster.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return
    const matrix = poster.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    // Keep hit regions fixed while the visible lettering moves to the center.
    // Otherwise a tiny pointer movement can select another sliding row or reset it.
    const insideX = point.x >= left - 8 && point.x <= right + 8
    if (insideX && active >= 0) {
      const selected = rows[active]!
      if (point.y >= selected.top - 8 && point.y <= selected.bottom + 8) return
    }
    let next = -1
    let nearest = Infinity
    if (insideX) rows.forEach((row, index) => {
      const centerY = (row.top + row.bottom) / 2
      const distance = Math.abs(point.y - centerY)
      if (point.y >= row.top - 3 && point.y <= row.bottom + 3 && distance < nearest) {
        next = index
        nearest = distance
      }
    })
    active = next
    update()
  })
  poster.addEventListener('pointerleave', reset)
  poster.addEventListener('pointercancel', reset)
  reducedMotion.addEventListener('change', update)
  window.addEventListener('blur', reset)
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0 })
}
