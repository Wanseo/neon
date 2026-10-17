import './style.css'
import { createMosaic, createSegmenter } from './mosaic'
import type { SelfieSegmentation } from '@mediapipe/selfie_segmentation'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main>
    <div class="mosaic" aria-label="9가지 색과 도형으로 표현하는 네온 카메라">
      ${Array.from({ length: 9 }, (_, i) => `<div class="tile"><canvas aria-label="네온 조합 ${i + 1}"></canvas></div>`).join('')}
    </div>
    <div class="toolbar">
      <button id="camera" type="button" aria-pressed="false"><span class="dot" aria-hidden="true"></span><span id="camera-label">카메라 켜기</span></button>
      <label class="spread" for="spread"><span>빛 번짐</span><input id="spread" type="range" min="0" max="100" value="70"><output for="spread" id="spread-value">70</output></label>
    </div>
    <p id="message" role="status" aria-live="polite">하나의 모습, 아홉 가지 빛. 카메라를 켜보세요.</p>
    <p class="privacy">영상은 기기 안에서만 처리됩니다.</p>
  </main>`

const button = document.querySelector<HTMLButtonElement>('#camera')!
const label = document.querySelector<HTMLSpanElement>('#camera-label')!
const message = document.querySelector<HTMLParagraphElement>('#message')!
const spread = document.querySelector<HTMLInputElement>('#spread')!
const mosaic = createMosaic([...document.querySelectorAll<HTMLCanvasElement>('canvas')])
const video = document.createElement('video')
video.muted = true
video.playsInline = true
let stream: MediaStream | null = null
let model: SelfieSegmentation | null = null
let frame = 0
let generation = 0
let pending = false
let processing: Promise<void> | null = null
let cleanup: Promise<void> = Promise.resolve()

spread.addEventListener('input', () => {
  document.querySelector('#spread-value')!.textContent = spread.value
})

function stopCamera() {
  generation++
  cancelAnimationFrame(frame)
  stream?.getTracks().forEach(track => track.stop())
  stream = null
  video.pause()
  video.srcObject = null
  const oldModel = model
  const inFlight = processing
  model = null
  // Wait for an inference to finish before releasing its WebAssembly resources.
  cleanup = (async () => {
    try { await inFlight } catch { /* Already handled in the inference loop. */ }
    try { await oldModel?.close() } catch { /* Camera is already stopped. */ }
  })()
  button.setAttribute('aria-pressed', 'false')
  label.textContent = '카메라 켜기'
  mosaic.preview()
}

async function tick(token: number) {
  if (token !== generation || !stream || !model) return
  try {
    processing = model.send({ image: video })
    await processing
    if (token === generation) frame = requestAnimationFrame(() => { void tick(token) })
  } catch {
    if (token !== generation) return
    stopCamera()
    message.textContent = '효과를 실행하지 못했습니다. 최신 Chrome 또는 Safari에서 다시 시도해주세요.'
  }
}

button.addEventListener('click', async () => {
  if (pending) return
  if (stream) {
    stopCamera()
    message.textContent = '카메라가 꺼졌습니다. 아홉 가지 빛을 다시 만나보세요.'
    return
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    message.textContent = '카메라는 HTTPS 또는 localhost에서 지원되는 브라우저로 열어주세요.'
    return
  }
  pending = true
  button.disabled = true
  label.textContent = '연결 중…'
  const token = ++generation
  message.textContent = '브라우저에서 카메라 접근을 허용해주세요.'
  try {
    await cleanup
    if (token !== generation) return
    const acquired = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
    })
    if (token !== generation) { acquired.getTracks().forEach(track => track.stop()); return }
    stream = acquired
    acquired.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (token !== generation) return
      stopCamera()
      message.textContent = '카메라 연결이 종료되었습니다. 다시 켜주세요.'
    }, { once: true })
    video.srcObject = acquired
    await video.play()
    if (token !== generation) return
    message.textContent = '아홉 가지 빛을 준비하고 있습니다…'
    const segmenter = await createSegmenter()
    if (token !== generation) { await segmenter.close(); return }
    model = segmenter
    segmenter.onResults(results => {
      if (token === generation && stream) mosaic.render(results, Number(spread.value) / 100)
    })
    await segmenter.initialize()
    if (token !== generation) return
    button.setAttribute('aria-pressed', 'true')
    label.textContent = '카메라 끄기'
    message.textContent = '하나의 모습이 9칸에 이어집니다. 위치마다 다른 도형의 빛이 스며듭니다.'
    void tick(token)
  } catch (error) {
    if (token !== generation) return
    stopCamera()
    const name = error instanceof DOMException ? error.name : ''
    message.textContent = name === 'NotAllowedError' ? '카메라 권한이 차단되었습니다. 주소창의 사이트 설정에서 허용한 뒤 다시 눌러주세요.'
      : name === 'NotFoundError' ? '연결된 카메라를 찾을 수 없습니다. 카메라를 연결한 뒤 다시 시도해주세요.'
      : '카메라 또는 효과를 불러오지 못했습니다. 연결 상태와 다른 앱의 카메라 사용 여부를 확인해주세요.'
  } finally {
    pending = false
    button.disabled = false
    if (!stream) label.textContent = '카메라 켜기'
  }
})
window.addEventListener('pagehide', stopCamera)
