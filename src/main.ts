import './style.css'

const images = import.meta.glob<string>('./assets/reference.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const source = Object.values(images)[0]
if (source) {
  const image = document.createElement('img')
  image.src = source
  image.alt = 'Reference artwork'
  document.querySelector<HTMLDivElement>('#app')!.append(image)
}
