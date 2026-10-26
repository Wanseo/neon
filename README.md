# 연희동까지의 산책

Vite vanilla TypeScript side-scrolling pixel scene. Use Left/Right arrows or A/D to walk from Yanghwa Bridge north end through the Hapjeong/Mangwon area and Yeonhui-ro to Yeonhui-dong. Touch arrows are available on touch devices.

The four original backgrounds reinterpret the reference video's blue-hour mood. Distances and buildings are stylized and compressed; this is not a navigation map or an exact reconstruction of the video.

Run npm install, then npm run build for TypeScript checking and the production build. npm run dev is available when requested. GitHub Pages deploys main automatically; Vite base is /neon/.

Original reference: https://www.youtube.com/watch?v=0VsAzkowpfw

The default environment now uses real Three.js geometry for buildings, sidewalks, road surfaces, bridge, river, windows, trees, poles, and overhead wires. Static geometry is batched by material. The original pixel character and its side-view walking animation remain unchanged. The illustrated panoramas are retained as a fallback when WebGL is unavailable. The route is an artistic interpretation, not an exact survey of the neighborhood.

The walk begins in dim blue dawn. After roughly 38% of the route, the furthest reached position gradually brings in morning: the sky and fog brighten, sunlight rises above rooftops, architectural lighting warms, and shop/lamplight emissive intensity fades. Backtracking does not reverse the sunrise. A subtle grain/vignette layer and weathered masonry/storefront details reference the supplied video stills.
