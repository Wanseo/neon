import './style.css'
import backgroundUrl from './assets/grass-enhanced.png'
import { installGrassMotion } from './grass-motion'

const background = new Image()
background.src = backgroundUrl
await background.decode().catch(() => {})
if (background.naturalWidth) installGrassMotion(background)
document.documentElement.classList.add('is-ready')
