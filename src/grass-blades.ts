// Curved blade geometry: roots stay fixed while individual tips follow the breeze.
export function createGrassBlades(gl: WebGLRenderingContext) {
  const empty = { resize(_width: number, _height: number, _cropX: number, _cropY: number) {}, draw(_time: number) {} }
  if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 2) return empty
  const program = gl.createProgram()!
  const sources = [
    [gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 root;
      attribute vec2 blade;
      attribute vec4 traits;
      uniform vec2 viewport;
      uniform vec2 crop;
      uniform float time;
      uniform sampler2D field;
      uniform sampler2D opening;
      varying vec2 rootUV;
      varying float heightAlong;
      varying float across;
      varying float coverage;
      void main() {
        float t = blade.y;
        vec2 world = root * viewport;
        float wave = sin(world.x * .007 - world.y * .004 - time * 1.05);
        float flutter = sin(time * 1.7 + traits.w) * .32;
        float gust = .7 + .3 * sin(time * .38 + world.y * .003);
        float tipBend = (wave + flutter) * gust * (3.0 + traits.x * .13);
        vec4 encoded = texture2D(field, root) * 255.0;
        vec2 push = (vec2(encoded.r * 256.0 + encoded.g, encoded.b * 256.0 + encoded.a) - 32768.0) / 32767.0 * 64.0;
        // Quadratic curvature leaves the roots anchored and flexes the tips.
        vec2 center = world + vec2(traits.z * t + tipBend * t * t, -traits.x * t);
        center += push * t * t * 1.8;
        center.x += blade.x * traits.y * (1.0 - t) * .5;
        gl_Position = vec4(center / viewport * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
        rootUV = (root - .5) * crop + .5;
        heightAlong = t;
        across = blade.x;
        coverage = 1.0 - smoothstep(.2, .6, texture2D(opening, root).r);
      }
    `],
    [gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D photograph;
      varying vec2 rootUV;
      varying float heightAlong;
      varying float across;
      varying float coverage;
      void main() {
        vec3 color = texture2D(photograph, rootUV).rgb;
        color *= .85 + .3 * heightAlong;
        float edge = 1.0 - smoothstep(.5, 1.0, abs(across));
        float alpha = edge * smoothstep(0.0, .2, heightAlong) * coverage * .72;
        gl_FragColor = vec4(color, alpha);
      }
    `],
  ] as const
  for (const [type, source] of sources) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return empty
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return empty
  const buffer = gl.createBuffer()!
  const root = gl.getAttribLocation(program, 'root')
  const blade = gl.getAttribLocation(program, 'blade')
  const traits = gl.getAttribLocation(program, 'traits')
  let count = 0
  let width = 1, height = 1, cropX = 1, cropY = 1
  return {
    resize(nextWidth: number, nextHeight: number, nextCropX: number, nextCropY: number) {
      width = nextWidth; height = nextHeight; cropX = nextCropX; cropY = nextCropY
      const values: number[] = []
      let seed = 12345
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
      const spacing = Math.max(9, Math.sqrt(width * height / 18000))
      for (let y = 0; y < height + 32; y += spacing) for (let x = 0; x < width; x += spacing) {
        const rx = (x + random() * spacing) / width, ry = (y + random() * spacing) / height
        const length = 12 + random() * 22, breadth = .65 + random() * .7
        const lean = (random() - .35) * 19, phase = random() * Math.PI * 2
        const vertex = (side: number, t: number) => values.push(rx, ry, side, t, length, breadth, lean, phase)
        for (let segment = 0; segment < 4; segment++) {
          const a = segment / 4, b = (segment + 1) / 4
          vertex(-1, a); vertex(1, a); vertex(-1, b)
          vertex(-1, b); vertex(1, a); vertex(1, b)
        }
      }
      count = values.length / 8
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW)
    },
    draw(time: number) {
      gl.useProgram(program)
      gl.uniform2f(gl.getUniformLocation(program, 'viewport'), width, height)
      gl.uniform2f(gl.getUniformLocation(program, 'crop'), cropX, cropY)
      gl.uniform1f(gl.getUniformLocation(program, 'time'), time)
      gl.uniform1i(gl.getUniformLocation(program, 'photograph'), 0)
      gl.uniform1i(gl.getUniformLocation(program, 'field'), 1)
      gl.uniform1i(gl.getUniformLocation(program, 'opening'), 3)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      for (const [attribute, size, offset] of [[root, 2, 0], [blade, 2, 8], [traits, 4, 16]]) {
        gl.enableVertexAttribArray(attribute!)
        gl.vertexAttribPointer(attribute!, size!, gl.FLOAT, false, 32, offset!)
      }
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArrays(gl.TRIANGLES, 0, count)
      gl.disable(gl.BLEND)
      for (const attribute of [root, blade, traits]) gl.disableVertexAttribArray(attribute)
    },
  }
}
