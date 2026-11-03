import moonMapUrl from './assets/moon-lroc.jpg'

// Orthographic near-side view; NASA's map is centered on longitude 0°.
// Source: https://svs.gsfc.nasa.gov/4720/ (NASA/Goddard/SVS, LRO/LROC).
export function createLunarOverview() {
  const canvas = document.querySelector<HTMLCanvasElement>('#moon-overview')!
  canvas.width = 440; canvas.height = 380
  const ctx = canvas.getContext('2d')!
  const backdrop = document.createElement('canvas'); backdrop.width = 440; backdrop.height = 380
  const paint = backdrop.getContext('2d')!
  const centerX = 220, centerY = 183, radius = 163
  function project(latitude: number, longitude: number) {
    return { x: centerX + radius * Math.cos(latitude) * Math.sin(longitude), y: centerY - radius * Math.sin(latitude) }
  }
  function grid() {
    paint.strokeStyle = '#d1e4f52c'; paint.lineWidth = 1
    for (const lat of [-60, -30, 0, 30, 60]) {
      paint.beginPath()
      for (let lon = -90; lon <= 90; lon += 2) { const p = project(lat * Math.PI / 180, lon * Math.PI / 180); lon === -90 ? paint.moveTo(p.x, p.y) : paint.lineTo(p.x, p.y) }
      paint.stroke()
    }
    for (const lon of [-60, -30, 0, 30, 60]) {
      paint.beginPath()
      for (let lat = -90; lat <= 90; lat += 2) { const p = project(lat * Math.PI / 180, lon * Math.PI / 180); lat === -90 ? paint.moveTo(p.x, p.y) : paint.lineTo(p.x, p.y) }
      paint.stroke()
    }
    paint.beginPath(); paint.arc(centerX, centerY, radius, 0, Math.PI * 2); paint.strokeStyle = '#d5e2f252'; paint.stroke()
    paint.fillStyle = '#b7c9d7'; paint.font = '14px sans-serif'; paint.textAlign = 'center'; paint.fillText('N', centerX, 10)
    paint.fillText('E', centerX + radius + 19, centerY + 5)
  }
  paint.fillStyle = '#6d737d'; paint.beginPath(); paint.arc(centerX, centerY, radius, 0, Math.PI * 2); paint.fill(); grid()
  const image = new Image()
  image.onload = () => {
    const source = document.createElement('canvas'); source.width = image.width; source.height = image.height
    const sourceContext = source.getContext('2d')!; sourceContext.drawImage(image, 0, 0)
    const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data
    const result = paint.createImageData(440, 380)
    for (let y = 0; y < 380; y++) for (let x = 0; x < 440; x++) {
      const nx = (x - centerX) / radius, ny = (centerY - y) / radius, rr = nx * nx + ny * ny
      if (rr > 1) continue
      const nz = Math.sqrt(1 - rr), lat = Math.asin(ny), lon = Math.atan2(nx, nz)
      const sx = Math.min(image.width - 1, Math.floor((.5 + lon / (Math.PI * 2)) * image.width))
      const sy = Math.min(image.height - 1, Math.floor((.5 - lat / Math.PI) * image.height))
      const si = (sy * image.width + sx) * 4, di = (y * 440 + x) * 4
      const lighting = .5 + .5 * Math.max(0, -.25 * nx + .2 * ny + .95 * nz)
      result.data[di] = pixels[si] * lighting * .93; result.data[di + 1] = pixels[si + 1] * lighting; result.data[di + 2] = pixels[si + 2] * lighting * 1.09; result.data[di + 3] = 255
    }
    paint.clearRect(0, 0, 440, 380); paint.putImageData(result, 0, 0); grid()
  }
  image.src = moonMapUrl
  const coordinateLabel = document.querySelector('#global-coordinates')!
  return (x: number, z: number, altitude: number, time: number) => {
    // Local scene units are metres, so a short walk moves very little at lunar scale.
    const latitude = (0 + 40 / 60 + 26.7 / 3600) * Math.PI / 180 - (z - 5) / 1737400
    const longitude = (23 + 28 / 60 + 22.7 / 3600) * Math.PI / 180 + x / (1737400 * Math.cos(latitude))
    const p = project(latitude, longitude)
    ctx.clearRect(0, 0, 440, 380); ctx.drawImage(backdrop, 0, 0)
    ctx.fillStyle = '#efb47d20'; ctx.beginPath(); ctx.arc(p.x, p.y, 20 + Math.sin(time * 2) * 3, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#efbc89aa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#f2a16b'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff6df'; ctx.lineWidth = 3; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(p.x + 14, p.y - 8); ctx.lineTo(p.x + 33, p.y - 29); ctx.lineTo(p.x + 94, p.y - 29); ctx.strokeStyle = '#f2c38eb0'; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = '#f1d4ac'; ctx.font = '17px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(altitude > 5 ? '유영 중' : '지금 여기', p.x + 35, p.y - 37)
    coordinateLabel.textContent = `${Math.abs(latitude * 180 / Math.PI).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'} · ${Math.abs(longitude * 180 / Math.PI).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`
  }
}
