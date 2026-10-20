import './style.css'
import backgroundUrl from './assets/grass.jpg'

const background = new Image()
background.src = backgroundUrl
await background.decode().catch(() => {})
document.documentElement.classList.add('is-ready')
