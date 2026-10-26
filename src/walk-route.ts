import street from './assets/yeonhui-photo-background.png'
import corner from './assets/yeonhui-corner.png'
import shop from './assets/yeonhui-shopfront.png'
import alley from './assets/yeonhui-alley-entrance.png'
import continuation from './assets/yeonhui-route-continuation.png'
import storefronts from './assets/yeonhui-storefronts.png'
import pixelAtlas from './assets/yeonhui-pixel-overhead.png'

// Reference order supplied by the user. Append the next photographed stretch here.
// Coordinates are normalized to each plate; they describe staging, not map surveying.
const originalRoute = [
  { image: street, name: '연희동 골목', description: '푸른 새벽, 골목 안쪽으로', view: 'back', focus: .5, start: [.5, .88], end: [.49, .59], scale: [1, .36], pan: 0 },
  { image: corner, name: '골목 모퉁이', description: '노란 게시판이 있는 코너를 지나', view: 'side', focus: .5, start: [.67, .88], end: [.44, .88], scale: [.92, .92], pan: .055 },
  { image: shop, name: '상가 앞 보도', description: '유리 진열창과 화분 옆을 따라', view: 'side', focus: .5, start: [.64, .9], end: [.39, .9], scale: [.96, .96], pan: .06 },
  { image: alley, name: '연희로27다길', description: '중앙부동산과 연희중앙교회 사이로', view: 'back', focus: .32, start: [.42, .89], end: [.29, .44], scale: [1, .22], pan: 0 },
] as const

const side = { view: 'side', focus: .5, start: [.58, .9], end: [.45, .9], scale: [.96, .96], pan: .055 } as const
const referenceRoute = [
  { ...originalRoute[0], rows: 1, row: 0 },
  { ...originalRoute[1], rows: 1, row: 0 },
  { ...side, image: storefronts, rows: 2, row: 0, name: '부동산 앞', description: '노란 유리문을 따라 계속' },
  { ...originalRoute[2], rows: 1, row: 0 },
  { ...side, image: storefronts, rows: 2, row: 1, name: '행복한나눔 앞', description: '나눔가게와 상점들이 이어지는 보도' },
  { ...side, image: continuation, rows: 3, row: 0, name: '교회 앞 보도', description: '벽돌 담장과 주차장 옆을 지나' },
  { ...originalRoute[3], rows: 1, row: 0 },
  { image: continuation, rows: 3, row: 1, name: 'GS25 앞 교차로', description: '편의점 불빛과 전선 너머의 골목', view: 'back', focus: .5, start: [.5, .88], end: [.51, .66], scale: [.9, .58], pan: 0 },
  { image: continuation, rows: 3, row: 2, name: '골목 안쪽', description: '주차된 차와 흰 건물 사이로 계속', view: 'back', focus: .5, start: [.53, .88], end: [.55, .64], scale: [.92, .45], pan: 0 },
] as const

export const walkRoute = referenceRoute.map((scene, index) => ({
  ...scene,
  image: pixelAtlas,
  rows: 3,
  row: Math.floor(index / 3),
  cols: 3,
  col: index % 3,
}))
