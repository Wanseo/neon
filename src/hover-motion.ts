export interface HoverRow {
  group: SVGGElement
  word: SVGGElement
  text: SVGTextElement
  ink: SVGTextElement
  top: number
  bottom: number
}

export function installHoverMotion(poster: SVGSVGElement, rows: HoverRow[], left: number, right: number) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const amounts = rows.map(() => 0)
  const colors = rows.map(() => 0)
  const shifts = rows.map(() => 0)
  let active = -1
  let selectionAnchor: { x: number; y: number } | null = null
  let panY = 0
  let frame = 0
  let lastTime = 0
  let lastMoveTime = -Infinity
  let lastPointer: { x: number; y: number } | null = null

  function animate(time: number) {
    const dt = lastTime ? Math.min(time - lastTime, 50) : 16.67
    lastTime = time
    const easing = reducedMotion.matches ? 1 : 1 - Math.exp(-dt / 95)
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
    // Let the cursor catch a stationary target: pause list travel while the
    // user is moving, but keep highlight/scale feedback immediate.
    const aiming = active >= 0 && time - lastMoveTime < 85
    const followPan = (value: number, target: number) => {
      if (Math.abs(target - value) <= .01) return target
      moving = true
      if (aiming) return value
      const step = (target - value) * (1 - Math.exp(-dt / 230))
      const maxStep = dt * .8
      return value + Math.max(-maxStep, Math.min(maxStep, step))
    }
    panY = followPan(panY, targetY)
    rows.forEach((row, index) => {
      const scale = 1 + .16 * amounts[index]!
      const cy = (row.top + row.bottom) / 2
      row.group.setAttribute('transform', `translate(0 ${shifts[index]! + panY})`)
      row.word.setAttribute('transform', `translate(${centerX} ${cy}) scale(${scale}) translate(${-centerX} ${-cy})`)
      row.ink.setAttribute('opacity', String(colors[index]!))
    })
    if (moving) frame = requestAnimationFrame(animate)
    else { frame = 0; lastTime = 0 }
  }
  function update() { if (!frame) frame = requestAnimationFrame(animate) }
  function reset() { active = -1; selectionAnchor = null; lastPointer = null; lastMoveTime = -Infinity; update() }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return
    if (!lastPointer || Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y) >= 1.5) {
      lastMoveTime = performance.now()
      lastPointer = { x: event.clientX, y: event.clientY }
    }
    const matrix = poster.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const bounds = poster.getBoundingClientRect()
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom
    if (outside) { reset(); return }
    const outsideColumn = point.x < left - 90 || point.x > right + 90
    if (outsideColumn) { reset(); return }
    // Ignore only tiny physical jitter. A new deliberate hover can interrupt
    // the current transition immediately; empty space still preserves selection.
    if (active >= 0 && selectionAnchor && Math.hypot(event.clientX - selectionAnchor.x, event.clientY - selectionAnchor.y) < 3) return
    let next = -1
    let nearest = Infinity
    rows.forEach((row, index) => {
      const scale = 1 + .16 * amounts[index]!
      const centerY = (row.top + row.bottom) / 2 + shifts[index]! + panY
      const halfHeight = (row.bottom - row.top) * scale / 2
      const halfWidth = (right - left) * scale / 2
      const centerX = (left + right) / 2
      const distance = Math.abs(point.y - centerY)
      if (Math.abs(point.x - centerX) <= halfWidth + 8 && distance <= halfHeight + 3 && distance < nearest) {
        next = index
        nearest = distance
      }
    })
    if (next < 0 && active >= 0) return
    if (next !== active) {
      selectionAnchor = next < 0 ? null : { x: event.clientX, y: event.clientY }
      active = next
      update()
    }
  })
  window.addEventListener('pointerout', event => { if (!event.relatedTarget) reset() })
  window.addEventListener('pointercancel', reset)
  reducedMotion.addEventListener('change', update)
  window.addEventListener('blur', reset)
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0 })
}
