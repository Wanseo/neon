// A spring field bends the photograph locally, retaining a soft trail after the brush.
export function installGrassMotion(image: HTMLImageElement) {
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
      precision mediump float;
      uniform sampler2D photograph;
      uniform sampler2D field;
      uniform vec2 resolution;
      uniform vec2 viewport;
      uniform vec2 crop;
      void main() {
        vec2 screen = vec2(gl_FragCoord.x / resolution.x, 1.0 - gl_FragCoord.y / resolution.y);
        vec2 bend = (texture2D(field, screen).rg * 255.0 - 128.0) / 127.0;
        vec2 displaced = screen - bend * 52.0 / viewport;
        vec2 uv = (displaced - 0.5) * crop + 0.5;
        gl_FragColor = vec4(texture2D(photograph, clamp(uv, 0.001, 0.999)).rgb, 1.0);
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
  const columns = 96
  let rows = 64
  let width = 1, height = 1
  let offsets = new Float32Array(0), velocities = new Float32Array(0), pixels = new Uint8Array(0)
  let frame = 0, previousTime = 0
  let previousPointer: { x: number; y: number } | null = null
  let pending: { x: number; y: number }[] = []
  function draw() { gl!.drawArrays(gl!.TRIANGLES, 0, 6) }
  function upload() {
    for (let i = 0; i < columns * rows; i++) {
      pixels[i * 4] = Math.round(128 + offsets[i * 2]! / 52 * 127)
      pixels[i * 4 + 1] = Math.round(128 + offsets[i * 2 + 1]! / 52 * 127)
      pixels[i * 4 + 2] = 0
      pixels[i * 4 + 3] = 255
    }
    gl!.activeTexture(gl!.TEXTURE1)
    gl!.bindTexture(gl!.TEXTURE_2D, fieldTexture)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, columns, rows, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, pixels)
    draw()
  }
  function brush(x: number, y: number, dx: number, dy: number) {
    const radius = Math.min(145, Math.max(85, width * .11))
    for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) {
      const rx = (i + .5) / columns * width - x
      const ry = (j + .5) / rows * height - y
      const distance = Math.hypot(rx, ry)
      if (distance >= radius) continue
      const weight = (1 - distance / radius) ** 2
      const index = (j * columns + i) * 2
      // Push blades outwards and carry them in the direction of the hand.
      velocities[index]! += (rx / Math.max(distance, 12) * 58 + dx * 8) * weight
      velocities[index + 1]! += (ry / Math.max(distance, 12) * 58 + dy * 8) * weight
    }
  }
  function animate(time: number) {
    const dt = previousTime ? Math.min((time - previousTime) / 1000, .032) : 1 / 60
    previousTime = time
    for (const point of pending) {
      const start = previousPointer ?? point
      const dx = point.x - start.x, dy = point.y - start.y
      const steps = Math.max(1, Math.min(24, Math.ceil(Math.hypot(dx, dy) / 12)))
      for (let i = 1; i <= steps; i++) brush(start.x + dx * i / steps, start.y + dy * i / steps, dx / steps, dy / steps)
      previousPointer = point
    }
    pending = []
    let moving = false
    for (let i = 0; i < offsets.length; i++) {
      velocities[i]! += (-offsets[i]! * 38 - velocities[i]! * 10) * dt
      offsets[i] = Math.max(-48, Math.min(48, offsets[i]! + velocities[i]! * dt))
      if (Math.abs(offsets[i]!) > .12 || Math.abs(velocities[i]!) > .12) moving = true
      else offsets[i] = velocities[i] = 0
    }
    upload()
    if (moving) frame = requestAnimationFrame(animate)
    else { frame = 0; previousTime = 0 }
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
    rows = Math.max(32, Math.min(160, Math.round(columns * height / width)))
    offsets = new Float32Array(columns * rows * 2)
    velocities = new Float32Array(offsets.length)
    pixels = new Uint8Array(columns * rows * 4)
    previousPointer = null; pending = []
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
  resize()
  document.querySelector('#app')!.append(canvas)
}
