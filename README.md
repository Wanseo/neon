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

## 포스터 텍스트

도시 이름과 날짜는 이미지가 아닌 SVG 텍스트이며, `src/poster-layout.ts`의
행별 좌표에 배치합니다. 도시 이름은 `2xGraz`의 실제 글자 좌우 끝을 기준으로
기본 자간을 유지한 채 글자 크기를 조절해 양쪽을 정렬합니다.
확대된 행이 겹칠 때만 아래로 이동하며, 양옆 날짜도 해당 행을 따라 이동합니다.

Inter Tight Black(900)을 프로젝트에 포함해 기기마다 같은 서체를 사용합니다.
출처: Google Fonts. 라이선스는 `public/licenses/InterTight-OFL.txt`에 있습니다.


## 도시 지도

도시를 클릭하면 목록이 왼쪽으로 이동하고 국가 윤곽과 도시 위치가 표시됩니다.
다른 도시를 클릭해 전환하고, 같은 도시를 다시 누르거나 닫기/Esc로 돌아옵니다.
Enter와 Space로도 도시를 선택할 수 있습니다.

지도는 로컬 `src/data/maps.json`을 사용합니다. Natural Earth의 국가 경계와
GeoNames의 도시 좌표를 SVG용으로 변환했습니다. 미국은 본토, 프랑스는 유럽
지역을 표시합니다. 출처와 라이선스는 `public/licenses/map-data.txt`에 있습니다.
`python3 scripts/build-maps.py`로 데이터를 다시 생성할 수 있습니다.
