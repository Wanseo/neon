import street from './assets/yeonhui-photo-background.png'
import corner from './assets/yeonhui-corner.png'
import shop from './assets/yeonhui-shopfront.png'
import alley from './assets/yeonhui-alley-entrance.png'

// Reference order supplied by the user. Append the next photographed stretch here.
// Coordinates are normalized to each plate; they describe staging, not map surveying.
export const walkRoute = [
  { image: street, name: '연희동 골목', description: '푸른 새벽, 골목 안쪽으로', view: 'back', focus: .5, start: [.5, .88], end: [.49, .59], scale: [1, .36], pan: 0 },
  { image: corner, name: '골목 모퉁이', description: '노란 게시판이 있는 코너를 지나', view: 'side', focus: .5, start: [.67, .88], end: [.44, .88], scale: [.92, .92], pan: .055 },
  { image: shop, name: '상가 앞 보도', description: '유리 진열창과 화분 옆을 따라', view: 'side', focus: .5, start: [.64, .9], end: [.39, .9], scale: [.96, .96], pan: .06 },
  { image: alley, name: '연희로27다길', description: '중앙부동산과 연희중앙교회 사이로', view: 'back', focus: .32, start: [.42, .89], end: [.29, .44], scale: [1, .22], pan: 0 },
] as const
