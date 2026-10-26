interface YouTubePlayer {
  playVideo(): void
  pauseVideo(): void
  setVolume(value: number): void
}
interface PlayerEvent { target: YouTubePlayer; data?: number }
interface YouTubeAPI {
  Player: new (element: HTMLElement, options: {
    videoId: string
    width: number
    height: number
    playerVars: Record<string, string | number>
    events: Record<string, (event: PlayerEvent) => void>
  }) => YouTubePlayer
}
declare global {
  interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void }
}

export function createMusicPlayer(host: HTMLElement) {
  const panel = document.createElement('aside')
  panel.className = 'music-panel'
  panel.setAttribute('aria-label', 'Zion.T 연희동에서 음악 플레이어')
  panel.innerHTML = '<div class="music-video" hidden><div class="music-embed"></div></div><div class="music-caption"><a href="https://www.youtube.com/watch?v=0VsAzkowpfw" target="_blank" rel="noopener noreferrer">Zion.T · 연희동에서 ↗</a><button type="button" aria-pressed="false">음악 켜기</button></div><p class="music-status" role="status"></p>'
  host.append(panel)
  const video = panel.querySelector<HTMLDivElement>('.music-video')!
  const button = panel.querySelector<HTMLButtonElement>('button')!
  const status = panel.querySelector<HTMLParagraphElement>('.music-status')!
  let player: YouTubePlayer | undefined
  let wanted = false, ready = false, loading = false
  let loadTimeout = 0
  function update() {
    button.textContent = wanted ? '음악 끄기' : '음악 켜기'
    button.setAttribute('aria-pressed', String(wanted))
    video.hidden = !wanted
  }
  function initialize() {
    if (!window.YT || player) return
    clearTimeout(loadTimeout)
    player = new window.YT.Player(panel.querySelector<HTMLElement>('.music-embed')!, {
      videoId: '0VsAzkowpfw', width: 320, height: 200,
      playerVars: { autoplay: 0, controls: 1, loop: 1, playlist: '0VsAzkowpfw', playsinline: 1, disablekb: 1, origin: location.origin },
      events: {
        onReady: event => {
          ready = true
          event.target.setVolume(35)
          if (wanted) event.target.playVideo()
          status.textContent = ''
        },
        onStateChange: event => {
          if (event.data === 0 && wanted) event.target.playVideo()
          if (event.data === 1) status.textContent = '반복 재생 중'
          if (event.data === 2) status.textContent = wanted ? '플레이어에서 재생을 눌러주세요' : ''
        },
        onAutoplayBlocked: () => { status.textContent = '플레이어의 ▶ 버튼을 눌러주세요' },
        onError: () => { status.textContent = '재생할 수 없습니다. 곡 제목을 눌러 YouTube에서 들어주세요.' },
      },
    })
  }
  function start() {
    if (wanted) return
    wanted = true; update()
    if (ready) { player!.playVideo(); return }
    status.textContent = '음악을 불러오는 중…'
    if (window.YT?.Player) { initialize(); return }
    if (loading) return
    loading = true
    window.onYouTubeIframeAPIReady = initialize
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => { loading = false; status.textContent = '음악을 불러오지 못했습니다. 다시 시도해주세요.'; wanted = false; update() }
    document.head.append(script)
    loadTimeout = window.setTimeout(() => { if (!ready) status.textContent = '연결이 지연되고 있어요. 곡 제목을 눌러 YouTube에서 들을 수 있습니다.' }, 12000)
  }
  button.addEventListener('click', () => {
    if (!wanted) start()
    else { wanted = false; if (ready) player!.pauseVideo(); status.textContent = ''; update() }
  })
  return { start }
}
