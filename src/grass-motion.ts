import { createGrassBlades } from './grass-blades'

// A spring field parts the grass; individual blades flex in the breeze.
export function installGrassMotion(image: HTMLImageElement, soil?: HTMLImageElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const canvas = document.createElement('canvas')
  canvas.className = 'grass-motion'
  canvas.setAttribute('aria-hidden', 'true')
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false })
  if (!gl) return
  function shader(type: number, source: string) {
    const item = gl!.createShader(type)!
    gl!.shaderSource(item, source)
    gl!.compileShader(item)
    if (!gl!.getShaderParameter(item, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(item) || 'Grass shader failed')
    return item
  }
  const program = gl.createProgram()!
  try {
    gl.attachShader(program, shader(gl.VERTEX_SHADER, `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `))
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
      precision highp float;
      uniform sampler2D photograph;
      uniform sampler2D field;
      uniform sampler2D ground;
      uniform sampler2D opening;
      uniform vec2 resolution;
      uniform vec2 viewport;
      uniform vec2 crop;
      uniform vec2 groundCrop;
      uniform float windTime;
      void main() {
        vec2 screen = vec2(gl_FragCoord.x / resolution.x, 1.0 - gl_FragCoord.y / resolution.y);
        vec4 encoded = texture2D(field, screen) * 255.0;
        vec2 bend = (vec2(encoded.r * 256.0 + encoded.g, encoded.b * 256.0 + encoded.a) - 32768.0) / 32767.0;
        vec2 world = screen * viewport;
        // Fine tufts lean at different angles along the two banks of the track.
        float tuft = sin(world.x * .07 + sin(world.y * .017) * 2.0) * sin(world.y * .06);
        float angle = tuft * .12;
        bend = mat2(cos(angle), sin(angle), -sin(angle), cos(angle)) * bend * (1.0 + tuft * .1);
        // Let the separate blade geometry carry most of the bending, keeping
        // the photographic detail from stretching into soft bands.
        vec2 displaced = screen - bend * 16.0 / viewport;
        vec2 uv = (displaced - 0.5) * crop + 0.5;
        vec2 safeUV = clamp(uv, 0.001, 0.999);
        vec3 grass = texture2D(photograph, safeUV).rgb;
        vec2 texel = crop / viewport;
        vec3 nearby = (texture2D(photograph, safeUV + vec2(texel.x, 0.0)).rgb
          + texture2D(photograph, safeUV - vec2(texel.x, 0.0)).rgb
          + texture2D(photograph, safeUV + vec2(0.0, texel.y)).rgb
          + texture2D(photograph, safeUV - vec2(0.0, texel.y)).rgb) * .25;
        grass = clamp(grass * 1.3 - nearby * .3, 0.0, 1.0);
        vec2 groundUV = (screen - 0.5) * groundCrop + 0.5;
        vec3 earth = texture2D(ground, groundUV).rgb;
        float gap = texture2D(opening, screen).r;
        float exposed = smoothstep(.42, .58, gap);
        earth *= .88;
        gl_FragColor = vec4(mix(grass, earth, exposed), 1.0);
      }
    `))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
  } catch { return }
  gl.useProgram(program)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  function texture(unit: number) {
    gl!.activeTexture(gl!.TEXTURE0 + unit)
    const item = gl!.createTexture()!
    gl!.bindTexture(gl!.TEXTURE_2D, item)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
    return item
  }
  texture(0)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.uniform1i(gl.getUniformLocation(program, 'photograph'), 0)
  const fieldTexture = texture(1)
  gl.uniform1i(gl.getUniformLocation(program, 'field'), 1)
  texture(2)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, soil ?? image)
  gl.uniform1i(gl.getUniformLocation(program, 'ground'), 2)
  const openingTexture = texture(3)
  gl.uniform1i(gl.getUniformLocation(program, 'opening'), 3)
  let columns = 144
  let rows = 64
  let width = 1, height = 1
  let offsets = new Float32Array(0), velocities = new Float32Array(0), pixels = new Uint8Array(0)
  let openings = new Float32Array(0), openingPixels = new Uint8Array(0)
  let frame = 0, previousTime = 0
  let windTime = 0
  let fieldAwake = false
  const windUniform = gl.getUniformLocation(program, 'windTime')
  const blades = createGrassBlades(gl)
  let previousPointer: { x: number; y: number } | null = null
  let pending: { x: number; y: number }[] = []
  let lastTrailTime = -Infinity
  let apertureAmount = 0
  const path: { x: number; y: number }[] = []
  const maxTrailLength = 150
  function addPathPoint(x: number, y: number) {
    path.push({ x, y })
    let distance = 0
    for (let i = path.length - 1; i > 0; i--) {
      const a = path[i - 1]!, b = path[i]!
      const length = Math.hypot(b.x - a.x, b.y - a.y)
      if (distance + length > maxTrailLength) {
        const fraction = (maxTrailLength - distance) / length
        a.x = b.x + (a.x - b.x) * fraction
        a.y = b.y + (a.y - b.y) * fraction
        path.splice(0, i - 1)
        break
      }
      distance += length
    }
  }
  function paintOpening() {
    openings.fill(0)
    if (apertureAmount <= .01) return
    const lengths = path.slice(1).map((point, i) => Math.hypot(point.x - path[i]!.x, point.y - path[i]!.y))
    const total = lengths.reduce((sum, length) => sum + length, 0)
    if (total < .1) return
    let travelled = 0
    for (let segment = 1; segment < path.length; segment++) {
      const a = path[segment - 1]!, b = path[segment]!
      const dx = b.x - a.x, dy = b.y - a.y
      const length = lengths[segment - 1]!
      if (length < .01) continue
      const minX = Math.max(0, Math.floor((Math.min(a.x, b.x) - 11) / width * columns))
      const maxX = Math.min(columns - 1, Math.ceil((Math.max(a.x, b.x) + 11) / width * columns))
      const minY = Math.max(0, Math.floor((Math.min(a.y, b.y) - 11) / height * rows))
      const maxY = Math.min(rows - 1, Math.ceil((Math.max(a.y, b.y) + 11) / height * rows))
      for (let j = minY; j <= maxY; j++) for (let i = minX; i <= maxX; i++) {
        const px = (i + .5) / columns * width - a.x
        const py = (j + .5) / rows * height - a.y
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (length * length)))
        const progress = (travelled + t * length) / total
        const taper = Math.min(1, progress * 2.4) * Math.min(1, (1 - progress) * 12)
        const halfWidth = 9 * apertureAmount * taper ** .75
        const distance = Math.hypot(px - t * dx, py - t * dy)
        const index = j * columns + i
        openings[index] = Math.max(openings[index]!, Math.max(0, Math.min(1, (halfWidth - distance) / 1.5 + .5)))
      }
      travelled += length
    }
  }
  function draw() {
    gl!.useProgram(program)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer)
    gl!.enableVertexAttribArray(position)
    gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0)
    gl!.uniform1f(windUniform, windTime)
    gl!.drawArrays(gl!.TRIANGLES, 0, 6)
    blades.draw(windTime)
    gl!.useProgram(program)
  }
  function upload() {
    for (let i = 0; i < columns * rows; i++) {
      const x = Math.round(32768 + offsets[i * 2]! / 64 * 32767)
      const y = Math.round(32768 + offsets[i * 2 + 1]! / 64 * 32767)
      pixels[i * 4] = x >> 8
      pixels[i * 4 + 1] = x & 255
      pixels[i * 4 + 2] = y >> 8
      pixels[i * 4 + 3] = y & 255
    }
    gl!.activeTexture(gl!.TEXTURE1)
    gl!.bindTexture(gl!.TEXTURE_2D, fieldTexture)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, columns, rows, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, pixels)
    for (let i = 0; i < openings.length; i++) {
      openingPixels[i * 4] = soil ? Math.round(openings[i]! * 255) : 0
      openingPixels[i * 4 + 3] = 255
    }
    gl!.activeTexture(gl!.TEXTURE3)
    gl!.bindTexture(gl!.TEXTURE_2D, openingTexture)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, columns, rows, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, openingPixels)
    draw()
  }
  function brush(x: number, y: number, dx: number, dy: number) {
    const travel = Math.hypot(dx, dy)
    if (travel < .1) return
    const tx = dx / travel, ty = dy / travel
    const nx = -ty, ny = tx
    const halfWidth = 36
    const minX = Math.max(0, Math.floor((x - 56) / width * columns))
    const maxX = Math.min(columns - 1, Math.ceil((x + 56) / width * columns))
    const minY = Math.max(0, Math.floor((y - 56) / height * rows))
    const maxY = Math.min(rows - 1, Math.ceil((y + 56) / height * rows))
    for (let j = minY; j <= maxY; j++) for (let i = minX; i <= maxX; i++) {
      const rx = (i + .5) / columns * width - x
      const ry = (j + .5) / rows * height - y
      const across = rx * nx + ry * ny
      const along = rx * tx + ry * ty
      if (Math.abs(across) >= halfWidth || Math.abs(along) >= 20) continue
      // Only the narrow swept track bends. The two sides fall in opposite
      // directions perpendicular to travel; nothing expands radially.
      const edge = Math.max(0, 1 - (across / halfWidth) ** 2) ** 2
      const side = Math.tanh(across / 10)
      const weight = side * edge * Math.exp(-along * along / 100) * Math.min(travel / 6, 1)
      const index = (j * columns + i) * 2
      // Stable variation per tuft: both banks spread out, each at its own angle.
      const seed = Math.sin(i * 127.1 + j * 311.7) * 43758.5453
      const variation = seed - Math.floor(seed)
      const angle = (variation - .5) * 1.25
      const spreadX = nx * Math.cos(angle) - ny * Math.sin(angle)
      const spreadY = nx * Math.sin(angle) + ny * Math.cos(angle)
      const strength = 70 + variation * 55
      velocities[index]! += spreadX * strength * weight
      velocities[index + 1]! += spreadY * strength * weight
    }
  }
  function animate(time: number) {
    const dt = previousTime ? Math.min((time - previousTime) / 1000, .032) : 1 / 60
    previousTime = time
    windTime += dt
    if (!fieldAwake && pending.length === 0) {
      draw()
      frame = requestAnimationFrame(animate)
      return
    }
    let changedTrail = false
    if (pending.length && time - lastTrailTime > 650) path.length = 0
    for (const point of pending) {
      const start = previousPointer ?? point
      const dx = point.x - start.x, dy = point.y - start.y
      if (Math.hypot(dx, dy) >= .1) {
        if (!path.length) addPathPoint(start.x, start.y)
        changedTrail = true
      }
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6))
      for (let i = 0; i < steps; i++) {
        brush(start.x + dx * (i + .5) / steps, start.y + dy * (i + .5) / steps, dx / steps, dy / steps)
        if (Math.hypot(dx, dy) >= .1) addPathPoint(start.x + dx * (i + 1) / steps, start.y + dy * (i + 1) / steps)
      }
      previousPointer = point
    }
    pending = []
    if (changedTrail) lastTrailTime = time
    // Briefly hold the opening, then close its pointed ends towards the center.
    apertureAmount = Math.max(0, Math.min(1, 1 - (time - lastTrailTime - 140) / 420))
    paintOpening()
    let moving = false
    for (let i = 0; i < offsets.length; i++) {
      velocities[i]! += (-offsets[i]! * 38 - velocities[i]! * 10) * dt
      offsets[i] = Math.max(-9, Math.min(9, offsets[i]! + velocities[i]! * dt))
      if (Math.abs(offsets[i]!) > .12 || Math.abs(velocities[i]!) > .12) moving = true
      else offsets[i] = velocities[i] = 0
    }
    if (apertureAmount > 0) moving = true
    upload()
    fieldAwake = moving
    frame = requestAnimationFrame(animate)
  }
  function resize() {
    width = window.innerWidth; height = window.innerHeight
    const ratio = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.uniform2f(gl!.getUniformLocation(program, 'resolution'), canvas.width, canvas.height)
    gl!.uniform2f(gl!.getUniformLocation(program, 'viewport'), width, height)
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
    gl!.uniform2f(gl!.getUniformLocation(program, 'crop'), width / (image.naturalWidth * scale), height / (image.naturalHeight * scale))
    blades.resize(width, height, width / (image.naturalWidth * scale), height / (image.naturalHeight * scale))
    const groundImage = soil ?? image
    const groundScale = Math.max(width / groundImage.naturalWidth, height / groundImage.naturalHeight)
    gl!.uniform2f(gl!.getUniformLocation(program, 'groundCrop'), width / (groundImage.naturalWidth * groundScale), height / (groundImage.naturalHeight * groundScale))
    columns = Math.max(96, Math.min(384, Math.ceil(width / 5)))
    rows = Math.max(64, Math.min(512, Math.ceil(height / 5)))
    offsets = new Float32Array(columns * rows * 2)
    velocities = new Float32Array(offsets.length)
    pixels = new Uint8Array(columns * rows * 4)
    openings = new Float32Array(columns * rows)
    openingPixels = new Uint8Array(columns * rows * 4)
    previousPointer = null; pending = []
    apertureAmount = 0; lastTrailTime = -Infinity; path.length = 0
    upload()
  }
  window.addEventListener('pointermove', event => {
    pending.push({ x: event.clientX, y: event.clientY })
    if (pending.length > 24) pending.shift()
    if (!frame) frame = requestAnimationFrame(animate)
  }, { passive: true })
  window.addEventListener('pointerout', event => { if (!event.relatedTarget) previousPointer = null })
  window.addEventListener('blur', () => { previousPointer = null; pending = [] })
  window.addEventListener('resize', resize)
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(frame); canvas.remove() })
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; previousTime = 0; previousPointer = null })
  const resume = () => {
    if (!document.hidden && !frame && canvas.isConnected) frame = requestAnimationFrame(animate)
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; pending = []; previousPointer = null }
    else resume()
  })
  window.addEventListener('pageshow', resume)
  resize()
  document.querySelector('#app')!.append(canvas)
  resume()
}
