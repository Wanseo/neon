import './style.css'
import wingUrl from './assets/fairy-wing.png'
import type { PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<canvas class="camera-scene" aria-label="카메라에 비친 사람의 등 뒤에서 움직이는 분홍색 날개"></canvas>
  <video autoplay muted playsinline hidden></video>
  <div class="welcome"><p class="eyebrow">FAIRY WINGS</p><h1>당신의 날개를 펼쳐보세요</h1><p>카메라에 어깨와 상체가 보이도록 서주세요.</p><button class="camera-start" type="button">카메라 켜기</button><p class="privacy">영상은 기기 안에서만 처리되며 저장하거나 전송하지 않아요.</p></div>
  <div class="camera-controls" hidden><p class="status" role="status" aria-live="polite"></p><button class="camera-stop" type="button">카메라 끄기</button></div>`
const canvas = app.querySelector<HTMLCanvasElement>('canvas')!
const ctx = canvas.getContext('2d')!
const video = app.querySelector<HTMLVideoElement>('video')!
const welcome = app.querySelector<HTMLDivElement>('.welcome')!
const controls = app.querySelector<HTMLDivElement>('.camera-controls')!
const status = app.querySelector<HTMLParagraphElement>('.status')!
const startButton = app.querySelector<HTMLButtonElement>('.camera-start')!
const stopButton = app.querySelector<HTMLButtonElement>('.camera-stop')!
const wing = new Image()
wing.src = wingUrl
const mask = document.createElement('canvas')
const maskCtx = mask.getContext('2d')!
const foreground = document.createElement('canvas')
const foregroundCtx = foreground.getContext('2d')!
let landmarker: PoseLandmarker | undefined
let stream: MediaStream | undefined
let running = false, starting = false, frame = 0, requestId = 0
let lastVideoTime = -1, lastDetection = -Infinity, lastSeen = -Infinity
let hasMask = false
let target = { x: 0, y: 0, span: 0, angle: 0 }
let anchor = { ...target }
let opacity = 0, lastFrame = 0
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

function resize() {
  const ratio = Math.min(devicePixelRatio || 1, 2)
  canvas.width = Math.round(innerWidth * ratio)
  canvas.height = Math.round(innerHeight * ratio)
}
window.addEventListener('resize', resize)
resize()

async function loadTracking() {
  if (landmarker) return landmarker
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
  const files = await FilesetResolver.forVisionTasks(`${import.meta.env.BASE_URL}vision`)
  const options = {
    baseOptions: { modelAssetPath: `${import.meta.env.BASE_URL}models/pose_landmarker_lite.task` },
    runningMode: 'VIDEO' as const, numPoses: 1, outputSegmentationMasks: true,
    minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5,
  }
  try { landmarker = await PoseLandmarker.createFromOptions(files, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } }) }
  catch { landmarker = await PoseLandmarker.createFromOptions(files, options) }
  return landmarker
}

function updateTracking(result: PoseLandmarkerResult, time: number) {
  const person = result.landmarks[0]
  const segmentation = result.segmentationMasks?.[0]
  if (!person || !segmentation) { hasMask = false; return }
  const left = person[11]!, right = person[12]!
  if (Math.min(left.visibility ?? 0, right.visibility ?? 0) < .45) { hasMask = false; return }
  const width = video.videoWidth, height = video.videoHeight
  const span = Math.hypot((right.x - left.x) * width, (right.y - left.y) * height)
  const angle = Math.atan2((right.y - left.y) * height, (right.x - left.x) * width)
  target = { x: (left.x + right.x) * width / 2, y: (left.y + right.y) * height / 2 + span * .32, span, angle: angle > Math.PI / 2 ? angle - Math.PI : angle < -Math.PI / 2 ? angle + Math.PI : angle }
  if (time - lastSeen > 800) anchor = { ...target }
  lastSeen = time
  if (mask.width !== segmentation.width || mask.height !== segmentation.height) { mask.width = segmentation.width; mask.height = segmentation.height }
  const data = segmentation.getAsFloat32Array()
  const pixels = maskCtx.createImageData(mask.width, mask.height)
  for (let i = 0; i < data.length; i++) {
    // Keep the torso and its edges fully in front of the wing attachment.
    const confidence = Math.max(0, Math.min(1, (data[i]! - .12) / .22))
    pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = 255
    pixels.data[i * 4 + 3] = Math.round(confidence * 255)
  }
  maskCtx.putImageData(pixels, 0, 0)
  hasMask = true
}

function draw(time: number) {
  if (!running) return
  const dt = lastFrame ? Math.min(50, time - lastFrame) : 16
  lastFrame = time
  if (video.readyState >= 2 && video.videoWidth) {
    if (landmarker && video.currentTime !== lastVideoTime && time - lastDetection >= 65) {
      lastDetection = time; lastVideoTime = video.currentTime
      try { landmarker.detectForVideo(video, time, result => updateTracking(result, time)) }
      catch { hasMask = false; status.textContent = '인식 중 문제가 생겼어요. 카메라를 껐다 다시 켜주세요.' }
    }
    const width = video.videoWidth, height = video.videoHeight
    const scale = Math.max(canvas.width / width, canvas.height / height)
    ctx.setTransform(-scale, 0, 0, scale, (canvas.width + width * scale) / 2, (canvas.height - height * scale) / 2)
    ctx.drawImage(video, 0, 0, width, height)
    const visible = hasMask && time - lastSeen < 350
    opacity += ((visible ? 1 : 0) - opacity) * (1 - Math.exp(-dt / 170))
    const follow = 1 - Math.exp(-dt / 100)
    for (const key of ['x', 'y', 'span', 'angle'] as const) anchor[key] += (target[key] - anchor[key]) * follow
    if (visible && opacity > .01 && wing.complete && wing.naturalWidth) {
      const phase = reducedMotion.matches ? 0 : time / 1000 * 1.15
      const flap = Math.sin(phase)
      const wingWidth = anchor.span * .72
      const wingHeight = wingWidth * wing.naturalHeight / wing.naturalWidth
      ctx.save()
      ctx.translate(anchor.x, anchor.y)
      ctx.rotate(anchor.angle)
      ctx.globalAlpha = opacity * .94
      for (const side of [-1, 1]) {
        ctx.save()
        ctx.translate(side * anchor.span * .09, 0)
        // The hinge remains on the back; changing projected width gives a slow
        // forward/backward flap rather than a whole-wing sideways translation.
        ctx.scale(side * (.78 + flap * .16), 1 + flap * .025)
        // Mirroring already handles left/right; both wings fan out from the back.
        ctx.rotate(.22 + .025 * Math.sin(phase - .5))
        ctx.drawImage(wing, 0, -wingHeight * .59, wingWidth, wingHeight)
        ctx.restore()
      }
      ctx.restore()
      if (foreground.width !== width || foreground.height !== height) { foreground.width = width; foreground.height = height }
      foregroundCtx.globalCompositeOperation = 'source-over'
      foregroundCtx.clearRect(0, 0, width, height)
      foregroundCtx.drawImage(mask, 0, 0, width, height)
      foregroundCtx.globalCompositeOperation = 'source-in'
      foregroundCtx.drawImage(video, 0, 0, width, height)
      foregroundCtx.globalCompositeOperation = 'source-over'
      ctx.drawImage(foreground, 0, 0)
    }
    if (time - lastSeen < 350) status.textContent = ''
    else if (status.textContent !== '인식 중 문제가 생겼어요. 카메라를 껐다 다시 켜주세요.') status.textContent = '어깨와 상체가 화면에 보이도록 조금 뒤로 서주세요.'
  }
  frame = requestAnimationFrame(draw)
}

function stop() {
  requestId++; running = false; starting = false
  cancelAnimationFrame(frame)
  stream?.getTracks().forEach(track => track.stop())
  stream = undefined; video.srcObject = null
  hasMask = false; opacity = 0; lastFrame = 0; lastSeen = -Infinity; lastVideoTime = -1
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height)
  welcome.hidden = false; controls.hidden = true
  startButton.disabled = false; startButton.textContent = '카메라 켜기'
}
startButton.addEventListener('click', async () => {
  if (starting || running) return
  starting = true
  const id = ++requestId
  startButton.disabled = true; startButton.textContent = '카메라 준비 중…'
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('camera-unavailable')
    // Request access in the user's click; never open a camera automatically.
    const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false })
    if (id !== requestId) { camera.getTracks().forEach(track => track.stop()); return }
    stream = camera; video.srcObject = camera
    await Promise.all([video.play(), loadTracking(), wing.decode()])
    if (id !== requestId) return
    running = true; starting = false
    welcome.hidden = true; controls.hidden = false; status.textContent = '어깨와 상체를 찾고 있어요…'
    frame = requestAnimationFrame(draw)
  } catch (error) {
    if (id !== requestId) return
    stop()
    const name = error instanceof Error ? error.name : ''
    welcome.querySelector('h1')!.textContent = name === 'NotAllowedError' ? '카메라 접근을 허용해주세요' : name === 'NotFoundError' ? '연결된 카메라를 찾을 수 없어요' : '카메라를 준비하지 못했어요'
    welcome.querySelector('p:not(.eyebrow):not(.privacy)')!.textContent = name === 'NotAllowedError' ? '브라우저 주소창에서 카메라 권한을 허용한 뒤 다시 눌러주세요.' : '카메라 연결과 인터넷 상태를 확인한 뒤 다시 시도해주세요.'
  }
})
stopButton.addEventListener('click', stop)
window.addEventListener('pagehide', stop)
