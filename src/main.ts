import './style.css'
import artwork from './assets/artwork.png'

const image = document.createElement('img')
image.src = artwork
image.alt = '도시 이름과 공연 날짜. 마지막 Paris 행은 형광 라임색.'
document.querySelector<HTMLDivElement>('#app')!.append(image)
