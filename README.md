# Fairy Wings

Vite vanilla TypeScript camera experience. A pair of pink wings follows the shoulders and gently flaps behind the person. MediaPipe Pose Landmarker supplies shoulder landmarks and a person mask; frames are processed locally in the browser and are not uploaded or recorded.

- `npm install`
- `npm run dev` starts local development when needed.
- `npm run build` checks TypeScript and builds to `dist`.

GitHub Pages deploys automatically from `main` through `.github/workflows`. Vite base is `/neon/`. Camera access requires HTTPS or localhost and a user click on **카메라 켜기**. Allow the browser's camera permission and stand far enough back for both shoulders to appear. **카메라 끄기** stops all camera tracks. Audio is not requested.

`src/assets/fairy-wing.png` is the transparent cutout prepared from the supplied wing reference. `public/models` contains the Google MediaPipe pose lite model; `public/vision` contains the matching WASM runtime from the installed `@mediapipe/tasks-vision` package. If upgrading that dependency, update the copied runtime files at the same time.

Original assets and earlier modules remain in the repository but are not loaded by the camera screen.
