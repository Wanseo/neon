const trackUrl = 'https://music.apple.com/us/album/in-yeonhui-dong/6821867653?i=6821867655'
// Verified iTunes catalog preview; streamed from Apple, never copied into site assets.
const previewUrl = 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/bf/2f/32/bf2f328a-4da5-7498-7f3c-4fcd4997043e/mzaf_557669242849231190.plus.aac.p.m4a'

export function createMusicPlayer(host: HTMLElement) {
  const panel = document.createElement('aside')
  panel.className = 'music-panel'
  panel.setAttribute('aria-label', 'Zion.T 연희동에서 미리듣기')
  panel.innerHTML = `<div class="music-caption"><a href="${trackUrl}" target="_blank" rel="noopener noreferrer">Zion.T · 연희동에서 ↗</a><button type="button" aria-pressed="false">미리듣기 ▶</button></div><div class="preview-controls"></div><p class="music-credit">Preview provided courtesy of iTunes · <a href="${trackUrl}" target="_blank" rel="noopener noreferrer">Apple Music에서 듣기</a></p><p class="music-status" role="status"></p>`
  const audio = new Audio(previewUrl)
  audio.controls = true; audio.preload = 'none'; audio.volume = .4
  audio.setAttribute('aria-label', '연희동에서 미리듣기 재생 컨트롤')
  panel.querySelector('.preview-controls')!.append(audio)
  const button = panel.querySelector<HTMLButtonElement>('button')!
  const status = panel.querySelector<HTMLParagraphElement>('.music-status')!
  let previewRequested = false
  function update() {
    button.textContent = audio.paused ? audio.ended ? '다시 미리듣기 ▶' : '미리듣기 ▶' : '일시 정지 Ⅱ'
    button.setAttribute('aria-pressed', String(!audio.paused))
  }
  button.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return }
    previewRequested = true
    if (audio.ended) audio.currentTime = 0
    status.textContent = '불러오는 중…'
    try { await audio.play(); status.textContent = '' }
    catch { status.textContent = '재생하지 못했어요. 다시 누르거나 Apple Music에서 들어주세요.' }
    update()
  })
  for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, update)
  audio.addEventListener('playing', () => { status.textContent = '' })
  audio.addEventListener('error', () => { status.textContent = '미리듣기를 불러오지 못했어요. Apple Music 링크를 이용해주세요.' })
  // Refresh the preview URL from the official catalog without interrupting playback.
  fetch('https://itunes.apple.com/lookup?id=6821867655&entity=song&country=US', { signal: AbortSignal.timeout(8000) })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then((data: { results?: { trackId?: number; previewUrl?: string }[] }) => {
      const track = data.results?.find(item => item.trackId === 6821867655)
      if (track?.previewUrl && new URL(track.previewUrl).hostname.endsWith('.itunes.apple.com') && !previewRequested && audio.paused && audio.currentTime === 0) audio.src = track.previewUrl
    }).catch(() => { /* The last verified catalog preview remains available. */ })
  host.append(panel)
}
