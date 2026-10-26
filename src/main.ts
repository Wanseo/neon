import './style.css'
import characterUrl from './assets/mint-hoodie-character.png'

const character = document.createElement('img')
character.className = 'pixel-character'
character.src = characterUrl
character.alt = '파란 후드를 뒤집어쓰고 민트색 앞머리와 안경, 검정 바지를 착용한 픽셀 캐릭터'
character.draggable = false
character.decoding = 'sync'
document.querySelector<HTMLDivElement>('#app')!.append(character)
