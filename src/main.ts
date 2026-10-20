import './style.css'
import backgroundUrl from './assets/grass-enhanced.png'
import { installGrassMotion } from './grass-motion'

const background = new Image()
background.src = backgroundUrl
const soilAssets = import.meta.glob<string>('./assets/soil.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const soilUrl = Object.values(soilAssets)[0]
const soil = soilUrl ? new Image() : undefined
if (soil && soilUrl) soil.src = soilUrl
await Promise.all([background.decode().catch(() => {}), soil?.decode().catch(() => {})])
if (background.naturalWidth) installGrassMotion(background, soil?.naturalWidth ? soil : undefined)
document.documentElement.classList.add('is-ready')
