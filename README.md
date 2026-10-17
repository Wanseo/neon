# neon

Vite의 vanilla-ts 템플릿으로 만든 TypeScript 프로젝트입니다.

## 개발 및 빌드

Node.js 24를 사용합니다.

```sh
npm ci
npm run dev
npm run build
```

빌드 결과는 `dist/`에 생성됩니다.

## GitHub Pages 배포

1. GitHub의 `Wanseo/neon` 저장소에서 **Settings → Pages**로 이동합니다.
2. **Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
3. 이 변경 사항을 커밋하고 `main` 브랜치에 push합니다.
4. **Actions → Deploy to GitHub Pages**에서 배포 결과를 확인합니다.

배포 주소: https://wanseo.github.io/neon/

`main`에 push할 때마다 자동으로 의존성 설치, 빌드, 배포가 실행됩니다.
Actions 화면의 **Run workflow**로 수동 실행할 수도 있습니다.
별도 배포 토큰이나 secret은 필요하지 않습니다.

`vite.config.ts`의 `base`는 `/neon/`입니다. 저장소 이름을 변경하면
이 값도 수정하세요. 사용자 사이트(`wanseo.github.io`)나 커스텀 도메인으로
배포할 경우에는 `/`로 변경하세요.

`src`의 이미지는 import해서 사용하고, `public` 파일을 TypeScript에서
참조할 때는 `${import.meta.env.BASE_URL}파일명` 형식을 사용하세요.
HTML에서는 `%BASE_URL%파일명` 형식을 사용할 수 있습니다.

## Nine Lights 카메라

한 명의 카메라 영상이 3×3 화면 전체에 이어집니다. 각 칸은 레퍼런스에서
색 조합과 부드러운 테두리 번짐만 가져와, 그 위치에 있는 인물의 픽셀을
변환합니다. 고정된 별, 선, 문양이나 이미지 텍스처는 그리지 않습니다.
인물의 넓은 명암을 흐리게 처리한 후 칸마다 다른 색으로 변환하고,
실제 인물 윤곽을 따라 안쪽으로 반사광을 적용합니다. 카메라를 끄면
각 칸의 배경색만 표시됩니다. 윤곽 거리는 전체 화면에서 계산하므로
분할선에는 가짜 윤곽이 생기지 않습니다. 영상은 업로드하지 않습니다.

HTTPS 또는 localhost에서 카메라 접근을 허용하세요. 빛 번짐 슬라이더로
인물 안쪽까지 빛이 스며드는 깊이를 조절합니다. 카메라를 끄거나 페이지를
떠나면 카메라 트랙을 종료합니다.

`predev`와 `prebuild`가 설치된 MediaPipe 패키지의 모델 및 WASM 파일을
`public/mediapipe/`에 복사합니다. 이 폴더는 자동 생성되며 빌드 결과에 포함됩니다.
