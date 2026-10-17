// Nine independent compositions, in the same order and palette as the reference.
export const palettes = [
  ['#ff3307', '#00c7e4'], ['#cbd0ff', '#ff0036'], ['#009ec9', '#ff965e'],
  ['#ff8ec1', '#ff2793'], ['#b6d6f3', '#ff631e'], ['#ff3805', '#fae0ff'],
  ['#00aec2', '#ffa055'], ['#06280d', '#ffbccb'], ['#acd6f7', '#ff8057'],
] as const

export function createPattern(index: number, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.scale(size, size)
  ctx.fillStyle = palettes[index]![0]
  ctx.fillRect(0, 0, 1, 1)

  const shape = (points: number[][], color: string, halo: string, blur = .027) => {
    ctx.save()
    ctx.shadowColor = halo
    ctx.shadowBlur = size * blur * 2
    ctx.fillStyle = color
    ctx.beginPath()
    points.forEach(([x, y], i) => i ? ctx.lineTo(x!, y!) : ctx.moveTo(x!, y!))
    ctx.closePath()
    ctx.filter = `blur(${size * blur * .65}px)`
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.globalAlpha = .45
    ctx.filter = `blur(${size * blur * 1.4}px)`
    ctx.fill()
    ctx.restore()
  }
  const star = (cx: number, cy: number, arms: number, outer: number, inner: number, rotation: number, color: string, halo: string, blur = .015) => {
    const points = Array.from({ length: arms * 2 }, (_, i) => {
      const angle = rotation + i * Math.PI / arms
      const r = i % 2 ? inner : outer
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]
    })
    shape(points, color, halo, blur)
  }
  const band = (x1: number, y1: number, x2: number, y2: number, thickness: number, color: string, halo: string, blur = .025) => {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const dx = Math.sin(angle) * thickness / 2
    const dy = Math.cos(angle) * thickness / 2
    shape([[x1 + dx, y1 - dy], [x2 + dx, y2 - dy], [x2 - dx, y2 + dy], [x1 - dx, y1 + dy]], color, halo, blur)
  }
  switch (index) {
    case 0:
      star(.43, .28, 6, .91, .16, -.14, '#00c9e3', '#ffbaf6', .013)
      break
    case 1:
      star(.52, .52, 5, 1.02, .19, -.27, '#ff0037', '#ff5f9a', .035)
      band(-.2, .15, 1.15, .87, .12, '#ffc4e2', '#ff87ca', .033)
      break
    case 2:
      shape([[-.18, .65], [1.2, .31], [.21, .73], [-.1, .95]], '#ff9961', '#537632', .018)
      band(.57, .33, 1.12, .23, .035, '#de94b7', '#c39dcd', .023)
      shape([[0, -.1], [.15, -.1], [0, .26]], '#fca8c3', '#ffc4d2')
      break
    case 3:
      star(.62, .76, 4, .91, .16, .12, '#ff1893', '#ff54b0', .04)
      band(-.05, .03, 1.1, .55, .19, '#ffa6d1', '#ffc4dc', .04)
      shape([[.22, .94], [.29, .41], [.4, .88]], '#598fa9', '#ad82bb', .04)
      band(.1, 1.08, 1.1, .94, .17, '#ff5006', '#ff8d4a', .026)
      break
    case 4:
      star(.45, .38, 5, .97, .18, -.24, '#ff671e', '#ffb9ac', .033)
      band(-.15, .5, 1.12, .09, .15, '#ff3300', '#ff6c4b', .024)
      band(-.1, .65, .88, 1.18, .2, '#00634c', '#319da8', .026)
      band(.37, .45, .4, 1.12, .045, '#ff3800', '#ff8d43', .018)
      break
    case 5:
      band(-.22, .03, 1.08, 1.04, .3, '#ff84c4', '#ffbce9', .06)
      band(-.15, .91, 1.14, .4, .27, '#ffe8f9', '#ffd7f4', .055)
      band(-.18, .87, .58, .58, .16, '#00d1d6', '#c6ffff', .024)
      break
    case 6:
      star(.73, .53, 4, .99, .2, .13, '#ffa15a', '#618b28', .014)
      break
    case 7:
      band(-.12, .49, 1.17, -.03, .25, '#ffc9da', '#ff9c92', .037)
      band(-.1, .48, .84, 1.12, .065, '#ff8265', '#ec8b53', .024)
      break
    case 8:
      star(.7, .69, 6, .87, .11, -.08, '#ff815a', '#ffc3c1', .017)
      band(-.1, .27, 1.1, .05, .09, '#ffb3ca', '#ffe2ee', .043)
      break
  }
  // Soft photographic bloom rather than hard vector edges.
  const glow = ctx.createRadialGradient(.48, .46, .03, .48, .46, .8)
  glow.addColorStop(0, '#ffffff08')
  glow.addColorStop(1, '#0000000c')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1, 1)
  return canvas
}
