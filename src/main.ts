import './style.css'
import backgroundUrl from './assets/grass-enhanced.png'

const background = new Image()
background.src = backgroundUrl
await background.decode().catch(() => {})
document.documentElement.classList.add('is-ready')
