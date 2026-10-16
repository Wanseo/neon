import './style.css'

const root = document.querySelector<HTMLDivElement>('#app')!
root.innerHTML = `
  <header><a class="wordmark" href="#">NEON<span> / LIVE STUDIO</span></a><span class="edition">LIGHT STUDY — 001</span></header>
  <main>
    <section class="stage" aria-label="실시간 네온 카메라">
      <div class="ambient"></div>
      <canvas aria-label="네온 효과가 적용된 카메라 영상"></canvas>
      <div class="stage-top"><span><i></i> <b id="state">CAMERA OFF</b></span><span>REALTIME / LIME</span></div>
      <div class="intro" id="intro"><span class="eyebrow">당신의 빛을 발견하세요</span><h1>MADE<br>OF LIGHT.</h1><p>익숙한 실루엣, 새로운 빛.<br>카메라를 켜고 네온 속으로 들어오세요.</p></div>
      <div class="signature">NEON<span>빛으로 남는 순간</span></div>
      <div class="stage-bottom"><span>01 / CHROMATIC PORTRAIT</span><span id="live-label">WAITING FOR YOUR LIGHT</span></div>
    </section>
    <section class="controls" aria-label="카메라 및 효과 설정">
      <div class="caption"><span class="eyebrow">LIVE PORTRAIT</span><h2>빛으로 그리는 나.</h2><p id="message" role="status" aria-live="polite">카메라를 켜면 실시간 네온 효과가 시작됩니다.</p></div>
      <div class="adjustments"><label for="glow">빛 번짐 <output id="glow-value">65%</output></label><input id="glow" type="range" min="0" max="100" value="65"><label for="shadow">그림자 깊이 <output id="shadow-value">55%</output></label><input id="shadow" type="range" min="0" max="100" value="55"></div>
      <button id="camera" type="button"><span class="camera-icon">◉</span><span id="button-label">카메라 켜기</span><span>↗</span></button>
    </section>
  </main><footer><span>NEON — AN EXPERIMENT IN LIGHT</span><span>영상은 기기 안에서만 처리됩니다.</span></footer>`

const canvas = document.querySelector('canvas')!
const context = canvas.getContext('2d')!
const buffer = document.createElement('canvas')
const source = buffer.getContext('2d', { willReadFrequently: true })!
const paint = document.createElement('canvas')
const paintContext = paint.getContext('2d')!
const video = document.createElement('video')
video.muted = true
video.autoplay = true
video.playsInline = true
const button = document.querySelector<HTMLButtonElement>('#camera')!
const message = document.querySelector<HTMLParagraphElement>('#message')!
const glow = document.querySelector<HTMLInputElement>('#glow')!
const shadow = document.querySelector<HTMLInputElement>('#shadow')!
let stream: MediaStream | null = null
let frame = 0
let pending = false
let generation = 0
for (const input of [glow, shadow]) input.addEventListener('input', () => {
  document.querySelector(`#${input.id}-value`)!.textContent = `${input.value}%`
})

function stopCamera() {
  generation++
  cancelAnimationFrame(frame)
  stream?.getTracks().forEach(track => track.stop())
  stream = null
  video.srcObject = null
  context.clearRect(0, 0, canvas.width, canvas.height)
  document.querySelector('#intro')!.classList.remove('hidden')
  document.querySelector('#state')!.textContent = 'CAMERA OFF'
  document.querySelector('#live-label')!.textContent = 'WAITING FOR YOUR LIGHT'
  document.querySelector('#button-label')!.textContent = '카메라 켜기'
  root.classList.remove('is-live')
  message.textContent = '카메라가 꺼졌습니다. 다시 켜서 빛을 담아보세요.'
}

function render() {
  if (!stream || !video.videoWidth) return
  const width = 480
  const height = Math.round(width * video.videoHeight / video.videoWidth)
  if (buffer.width !== width || buffer.height !== height) {
    buffer.width = paint.width = canvas.width = width
    buffer.height = paint.height = canvas.height = height
  }
  source.save()
  source.translate(width, 0)
  source.scale(-1, 1)
  source.drawImage(video, 0, 0, width, height)
  source.restore()
  const pixels = source.getImageData(0, 0, width, height)
  const data = pixels.data
  const luminance = new Float32Array(width * height)
  for (let i = 0; i < luminance.length; i++) {
    const j = i * 4
    luminance[i] = (data[j]! * .2126 + data[j + 1]! * .7152 + data[j + 2]! * .0722) / 255
  }
  const depth = Number(shadow.value) / 100
  const bloom = Number(glow.value) / 100
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x
    const light = luminance[i]!
    const edge = Math.min(1, (Math.abs(light - luminance[y * width + Math.min(width - 1, x + 2)]!) + Math.abs(light - luminance[Math.min(height - 1, y + 2) * width + x]!)) * 3)
    const tone = Math.min(1, Math.max(0, (light - .08) / .77))
    const dark = Math.pow(1 - tone, 1.05 + depth * .7)
    const rim = edge * (.3 + bloom * .6)
    const j = i * 4
    data[j] = Math.min(255, 252 - dark * (135 + depth * 55) + rim * 120)
    data[j + 1] = Math.min(255, 254 - dark * (56 + depth * 75) + rim * 100)
    data[j + 2] = Math.min(255, 245 - dark * (210 + depth * 25) + rim * 165)
    data[j + 3] = 255
  }
  paintContext.putImageData(pixels, 0, 0)
  context.filter = 'none'
  context.globalCompositeOperation = 'source-over'
  context.drawImage(paint, 0, 0)
  context.globalCompositeOperation = 'screen'
  context.globalAlpha = .12 + bloom * .4
  context.filter = `blur(${4 + bloom * 15}px)`
  context.drawImage(paint, 0, 0)
  context.filter = 'none'
  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  frame = requestAnimationFrame(render)
}

button.addEventListener('click', async () => {
  if (pending) return
  if (stream) { stopCamera(); return }
  if (!navigator.mediaDevices?.getUserMedia) {
    message.textContent = '카메라는 HTTPS 또는 localhost에서 지원되는 브라우저로 열어주세요.'
    return
  }
  pending = true
  button.disabled = true
  const current = ++generation
  message.textContent = '브라우저의 카메라 접근을 허용해주세요.'
  try {
    const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false })
    if (current !== generation) { acquired.getTracks().forEach(track => track.stop()); return }
    stream = acquired
    video.srcObject = stream
    await video.play()
    if (current !== generation) return
    stream.getVideoTracks()[0]?.addEventListener('ended', stopCamera, { once: true })
    document.querySelector('#intro')!.classList.add('hidden')
    document.querySelector('#state')!.textContent = 'CAMERA LIVE'
    document.querySelector('#live-label')!.textContent = 'YOU ARE MADE OF LIGHT'
    document.querySelector('#button-label')!.textContent = '카메라 끄기'
    root.classList.add('is-live')
    message.textContent = '밝은 벽을 배경으로 서면 실루엣과 네온빛이 더 선명해집니다.'
    render()
  } catch (error) {
    stopCamera()
    const name = error instanceof DOMException ? error.name : ''
    message.textContent = name === 'NotAllowedError' ? '카메라 권한이 차단되었습니다. 주소창의 사이트 설정에서 허용한 뒤 다시 눌러주세요.' : name === 'NotFoundError' ? '연결된 카메라가 없습니다. 카메라를 연결한 뒤 다시 시도해주세요.' : '카메라를 시작할 수 없습니다. 다른 앱에서 사용 중인지 확인한 뒤 다시 시도해주세요.'
  } finally {
    pending = false
    button.disabled = false
  }
})
window.addEventListener('pagehide', stopCamera)
