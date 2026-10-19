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
  const colors = rows.map(() => 0)
  const drawnOpacity = rows.map(() => 0)
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  rows.forEach(row => layer.append(row.group))
  poster.append(layer)
  let drawnPan = NaN
  let geometry: { bounds: DOMRect; inverse: DOMMatrix; unitsPerPixel: number } | null = null
  function readGeometry() {
    if (geometry) return geometry
    const matrix = poster.getScreenCTM()
    if (!matrix) return null
    const bounds = poster.getBoundingClientRect()
    geometry = { bounds, inverse: matrix.inverse(), unitsPerPixel: poster.viewBox.baseVal.height / bounds.height }
    return geometry
  }
  const invalidateGeometry = () => { geometry = null }
  const resizeObserver = new ResizeObserver(invalidateGeometry)
  resizeObserver.observe(poster)
  window.addEventListener('resize', invalidateGeometry)
  window.addEventListener('scroll', invalidateGeometry, { passive: true })
  let active = -1
  let selectionAnchor: { x: number; y: number } | null = null
  let panY = 0
  let scrollTarget: number | null = null
  let lastWheelTime = -Infinity
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
    rows.forEach((_, index) => {
      colors[index] = follow(colors[index]!, active === index ? 1 : 0)
    })
    const viewBox = poster.viewBox.baseVal
    const targetY = scrollTarget ?? (active < 0 || reducedMotion.matches ? 0 : viewBox.y + viewBox.height / 2 - activeCenter)
    // Slow travel while aiming, without stop/start pauses during pointer movement.
    const aiming = scrollTarget === null && active >= 0 && time - lastMoveTime < 85
    const followPan = (value: number, target: number) => {
      if (Math.abs(target - value) <= .01) return target
      moving = true
      if (reducedMotion.matches) return target
      const step = (target - value) * (1 - Math.exp(-dt / (scrollTarget === null ? 230 : 110)))
      const maxStep = dt * (aiming ? .25 : .8)
      return value + Math.max(-maxStep, Math.min(maxStep, step))
    }
    panY = followPan(panY, targetY)
    const renderedPan = Math.round(panY * 100) / 100
    if (renderedPan !== drawnPan) {
      layer.setAttribute('transform', `translate(0 ${renderedPan})`)
      drawnPan = renderedPan
    }
    rows.forEach((row, index) => {
      const opacity = Math.round(colors[index]! * 1000) / 1000
      if (opacity !== drawnOpacity[index]) {
        row.ink.setAttribute('opacity', String(opacity))
        drawnOpacity[index] = opacity
      }
    })
    if (moving) frame = requestAnimationFrame(animate)
    else { frame = 0; lastTime = 0 }
  }
  function update() { if (!frame) frame = requestAnimationFrame(animate) }
  function reset() { active = -1; selectionAnchor = null; lastPointer = null; lastMoveTime = -Infinity; update() }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || performance.now() - lastWheelTime < 160) return
    if (!lastPointer || Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y) >= 1.5) {
      lastMoveTime = performance.now()
      lastPointer = { x: event.clientX, y: event.clientY }
    }
    const cached = readGeometry()
    if (!cached) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(cached.inverse)
    const { bounds } = cached
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
      const centerY = (row.top + row.bottom) / 2 + panY
      const halfHeight = (row.bottom - row.top) / 2
      const halfWidth = (right - left) / 2
      const centerX = (left + right) / 2
      const distance = Math.abs(point.y - centerY)
      if (Math.abs(point.x - centerX) <= halfWidth + 8 && distance <= halfHeight + 3 && distance < nearest) {
        next = index
        nearest = distance
      }
    })
    if (next < 0 && active >= 0) return
    if (next !== active || (next >= 0 && scrollTarget !== null)) {
      scrollTarget = null
      selectionAnchor = next < 0 ? null : { x: event.clientX, y: event.clientY }
      active = next
      update()
    }
  })
  window.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || !event.deltaY) return
    const cached = readGeometry()
    if (!cached) return
    const { bounds, unitsPerPixel } = cached
    const viewBox = poster.viewBox.baseVal
    const deltaPixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1)
    const center = viewBox.y + viewBox.height / 2
    const minimum = center - (rows[rows.length - 1]!.top + rows[rows.length - 1]!.bottom) / 2
    const maximum = center - (rows[0]!.top + rows[0]!.bottom) / 2
    scrollTarget = Math.max(minimum, Math.min(maximum, (scrollTarget ?? panY) - deltaPixels * unitsPerPixel))
    lastWheelTime = performance.now()
    selectionAnchor = null
    // Highlight the city passing through the center without cancelling manual scrolling.
    let nearest = Infinity
    rows.forEach((row, index) => {
      const distance = Math.abs((row.top + row.bottom) / 2 + scrollTarget! - center)
      if (distance < nearest) { nearest = distance; active = index }
    })
    event.preventDefault()
    update()
  }, { passive: false })
  window.addEventListener('pointerout', event => { if (!event.relatedTarget) reset() })
  window.addEventListener('pointercancel', reset)
  reducedMotion.addEventListener('change', update)
  window.addEventListener('blur', reset)
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0 })
}
