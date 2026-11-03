import { ACTIVE_SCENE } from './scene-choice'

if (ACTIVE_SCENE === 'space') {
  document.title = '고요의 바다 · 오늘은, 달에서.'
  void import('./space')
} else {
  document.title = '한 조각의 시간 · 작은 식탁'
  void import('./room')
}
