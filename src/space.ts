import './space.css'
import * as THREE from 'three'
import { createCompanions } from './companions'
import { createLunarOverview } from './lunar-overview'
import moonSurfaceUrl from './assets/moon-lroc.jpg'
import { createSparkles } from './sparkles'
import { createPlanetTravel } from './planet-travel'

const icons = {
 sound: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
 flag: '<path d="M5 21V3m0 1c5-5 9 5 14 0v10c-5 5-9-5-14 0"/>',
 jump: '<path d="m6 9 6-6 6 6M12 3v14M4 21h16"/>',
 view: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c-5 4-5 12 0 16 5-4 5-12 0-16"/>',
 home: '<path d="m3 11 9-8 9 8M6 10v11h12V10M10 21v-7h4v7"/>'
}
const icon = (name: keyof typeof icons) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<canvas id="universe" aria-label="직접 탐험할 수 있는 3D 달 표면"></canvas>
<header><div class="room glass"><span class="room-symbol">☾</span><span>고요의 바다 <small>01</small></span><span class="divider"></span><span class="live"><i></i> 로봇 친구들과 탐사 중</span></div><div class="tools glass"><span class="orbit-symbol">✧</span><button id="sound" aria-label="우주 사운드 켜기">${icon('sound')}</button><button id="settings" aria-label="설정">${icon('settings')}</button></div></header>
<aside class="lunar-map" aria-label="달 표면 미니맵: 내 위치와 지나온 경로, 달 기지">
  <div class="map-title"><span>달에서, 지금 여기</span><small>MOON OVERVIEW · 지구에서 보는 달</small></div>
  <canvas id="moon-overview" aria-label="달 전체 앞면 지도: 동쪽 고요의 바다에 현재 위치 표시"></canvas>
  <div class="global-location"><span><i class="you-dot"></i>고요의 바다 <small>탐사 지역</small></span><b id="global-coordinates">0.6741° N · 23.4730° E</b></div>
  <div class="local-map-title">주변 지형 <span>LOCAL EXPLORATION</span></div>
  <div class="map-terrain"><canvas id="minimap" aria-label="실시간 탐사 위치 지도"></canvas><span class="map-north">N ↑</span></div>
  <div class="map-legend"><span><i class="you-dot"></i>나의 위치</span><span><i class="base-dot"></i>달 기지</span></div>
  <div class="map-distance">지구에서 약 384,400 km</div>
</aside>
<div class="intro"><div class="eyebrow">A LITTLE FARTHER FROM EVERYDAY</div><h1>오늘은, 달에서.</h1><p>아무것도 하지 않아도 괜찮은 곳.</p></div>
<div class="coordinates"><span>TRANQUILITY BASE</span><b>00° 40′ 26.7″ N</b><b>23° 28′ 22.7″ E</b></div>
<div class="name-tag"><span>나</span> 작은 지구인</div>
<div class="hint">바닥을 클릭해 이동 <em>·</em> 드래그로 둘러보기 <em>·</em> 휠로 확대 / 축소</div>
<nav class="actions glass" aria-label="달 탐험 행동"><button id="jump">${icon('jump')}<span>달뜀하기</span></button><button id="flag">${icon('flag')}<span>깃발 꽂기</span></button><button id="earth">${icon('view')}<span>지구 바라보기</span></button><span class="action-divider"></span><button id="home">${icon('home')}<span>기지로</span></button></nav>
<footer><span><i></i> ALL IS QUIET UP HERE</span><span>지구로부터 <b>384,400</b> km</span></footer>
<section class="flight-hud glass" hidden aria-label="우주 유영 상태"><span class="flight-mode">✧ 우주 유영</span><strong><span id="altitude">0</span><small>m · 달 표면 위</small></strong><p>WASD / 방향키 · 이동<br>SPACE · 상승 &nbsp; SHIFT · 하강</p><button id="descend">↓ 내려오기</button><span class="flight-return">한 번 누르면 현재 위치로 자동 착륙</span></section>
<div id="toast" role="status"></div>
<dialog id="settings-panel"><form method="dialog"><button class="close" aria-label="닫기">×</button><span class="eyebrow">YOUR LITTLE UNIVERSE</span><h2>나만의 달</h2><label>별의 밝기 <input id="stars" type="range" min="0.2" max="1" step="0.1" value="0.7"></label><p>이곳은 혼자 쉬어가는 작은 우주예요.<br>방향키 또는 WASD로도 걸을 수 있어요.</p><button class="done">탐사 계속하기 ↗</button></form></dialog>`

const canvas = document.querySelector<HTMLCanvasElement>('#universe')!
const renderer = new THREE.WebGLRenderer({canvas, antialias:true})
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(2400000/(innerWidth*innerHeight)))); renderer.setSize(innerWidth,innerHeight)
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15
const scene=new THREE.Scene(); scene.background=new THREE.Color('#03060b'); scene.fog=new THREE.FogExp2('#080b12',0.003)
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,0.1,5000)
scene.add(new THREE.HemisphereLight(0xc9ddff,0x24242e,1.3))
const sun=new THREE.DirectionalLight(0xfff1da,3.2);sun.position.set(-30,35,-20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45});sun.shadow.bias=-0.0004;scene.add(sun)
let seed=42;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const craters=Array.from({length:65},()=>({x:(random()-.5)*190,z:(random()-.5)*190,r:1+random()*8}))
const moonRadius=650
function height(x:number,z:number){const radius=Math.hypot(x,z);const curve=Math.sqrt(Math.max(0,moonRadius*moonRadius-radius*radius))-moonRadius;let y=Math.sin(x*.06)*1.5+Math.cos(z*.085)*.9+Math.sin(x*.22+z*.14)*.22;for(const c of craters){const d=Math.hypot(x-c.x,z-c.z)/c.r;if(d<1.5)y+=-c.r*.19*Math.exp(-d*d*3)+c.r*.07*Math.exp(-Math.pow((d-1)*5,2))}return curve+y*(1-THREE.MathUtils.smoothstep(radius,240,300))+.04}
// A circular, curved patch follows the globe instead of exposing a square plane.
const groundGeo=new THREE.RingGeometry(0,300,192,96);groundGeo.rotateX(-Math.PI/2)
const pos=groundGeo.attributes.position;const colors=[]
for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,height(x,z));groundGeo.attributes.uv.setXY(i,x/600+.5,z/600+.5);const v=.22+random()*.09;colors.push(v*.94,v*.97,v*1.03)}
groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));groundGeo.computeVertexNormals()
const noiseCanvas=document.createElement('canvas');noiseCanvas.width=noiseCanvas.height=512;const ctx=noiseCanvas.getContext('2d')!;const pixels=ctx.createImageData(512,512);for(let i=0;i<pixels.data.length;i+=4){const v=130+random()*110;pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255}ctx.putImageData(pixels,0,0)
const noise=new THREE.CanvasTexture(noiseCanvas);noise.wrapS=noise.wrapT=THREE.RepeatWrapping;noise.repeat.set(75,75)
const terrainMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:noise,bumpMap:noise,bumpScale:.16,transparent:true})
terrainMaterial.onBeforeCompile=shader=>{
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 terrainXZ;').replace('#include <begin_vertex>','#include <begin_vertex>\nterrainXZ=position.xz;')
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 terrainXZ;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= 1.0-smoothstep(240.0,299.0,length(terrainXZ));')
}
const ground=new THREE.Mesh(groundGeo,terrainMaterial);ground.receiveShadow=true;scene.add(ground)
const moonTexture=new THREE.TextureLoader().load(moonSurfaceUrl);moonTexture.colorSpace=THREE.SRGBColorSpace
// Recess the globe beneath the detailed patch so crater valleys never intersect it.
const globeGeometry=new THREE.SphereGeometry(moonRadius,128,96)
const globePositions=globeGeometry.attributes.position
for(let i=0;i<globePositions.count;i++)if(globePositions.getY(i)>0){const r=Math.hypot(globePositions.getX(i),globePositions.getZ(i));globePositions.setY(i,globePositions.getY(i)-6*(1-THREE.MathUtils.smoothstep(r,240,300)))}
globeGeometry.computeVertexNormals()
const lunarGlobe=new THREE.Mesh(globeGeometry,new THREE.MeshStandardMaterial({color:0x929292,roughness:1,map:moonTexture,bumpMap:noise,bumpScale:.5,fog:false}));lunarGlobe.position.y=-moonRadius;scene.add(lunarGlobe)
const rockGeo=new THREE.IcosahedronGeometry(1,0);const rockMat=new THREE.MeshStandardMaterial({color:0x747780,roughness:1,flatShading:true})
// One instanced batch replaces hundreds of separate rock draw calls.
const rocks=new THREE.InstancedMesh(rockGeo,rockMat,420);const rockTransform=new THREE.Object3D();let rockCount=0
for(let i=0;i<420;i++){const x=(random()-.5)*220,z=(random()-.5)*220;if(Math.hypot(x,z)<3)continue;const s=.08+random()**3*1.8;rockTransform.position.set(x,height(x,z)+s*.25,z);rockTransform.scale.set(s,s*(.4+random()*.5),s);rockTransform.rotation.set(random()*2,random()*6,random());rockTransform.updateMatrix();rocks.setMatrixAt(rockCount++,rockTransform.matrix)}
rocks.count=rockCount;rocks.castShadow=true;rocks.receiveShadow=true;rocks.computeBoundingSphere();scene.add(rocks)
const starGeo=new THREE.BufferGeometry();const starPositions=[];for(let i=0;i<3600;i++){const v=new THREE.Vector3((random()-.5)*2,random()*.95+.03,(random()-.5)*2).normalize().multiplyScalar(450);starPositions.push(v.x,v.y,v.z)}starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));const starMat=new THREE.PointsMaterial({color:0xdce9ff,size:.65,transparent:true,opacity:.7,sizeAttenuation:true});const starfield=new THREE.Points(starGeo,starMat);scene.add(starfield)
// A painted globe with clouds, land masses, and an atmospheric rim.
const earthCanvas=document.createElement('canvas');earthCanvas.width=1024;earthCanvas.height=512;const ec=earthCanvas.getContext('2d')!;ec.fillStyle='#15578e';ec.fillRect(0,0,1024,512)
for(let i=0;i<90;i++){const x=random()*1024,y=random()*512;ec.fillStyle=['#688c85','#8f9e87','#466e77'][i%3];ec.beginPath();for(let j=0;j<16;j++){const a=j/16*Math.PI*2,r=10+random()*50;const px=x+Math.cos(a)*r*1.6,py=y+Math.sin(a)*r;j?ec.lineTo(px,py):ec.moveTo(px,py)}ec.fill()}
for(let i=0;i<270;i++){ec.fillStyle=`rgba(240,249,255,${.07+random()*.35})`;ec.beginPath();ec.ellipse(random()*1024,random()*512,15+random()*90,2+random()*9,-.25,0,Math.PI*2);ec.fill()}
const earth=new THREE.Mesh(new THREE.SphereGeometry(120,64,48),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(earthCanvas),roughness:1,emissive:0x15394c,emissiveIntensity:.35,fog:false}));earth.position.set(-380,200,-1450);earth.rotation.z=.22;scene.add(earth)
const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(123.5,64,48),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,uniforms:{},vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n; varying vec3 v; void main(){float a=pow(1.-abs(dot(n,v)),3.);gl_FragColor=vec4(.24,.58,1.,a*.65);}'}));atmosphere.position.copy(earth.position);scene.add(atmosphere)
const white=new THREE.MeshStandardMaterial({color:0xe9e9e3,roughness:.7});const dark=new THREE.MeshStandardMaterial({color:0x283440,roughness:.7});const gold=new THREE.MeshStandardMaterial({color:0xd8a963,metalness:.8,roughness:.25});const glass=new THREE.MeshStandardMaterial({color:0x172a37,metalness:.85,roughness:.13})
function mesh(geo:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Object3D,x:number,y:number,z:number){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function astronaut(x:number,z:number,scale=1){const g=new THREE.Group();g.position.set(x,height(x,z),z);g.scale.setScalar(scale);mesh(new THREE.CapsuleGeometry(.34,.48,6,12),white,g,0,1.05,0);mesh(new THREE.SphereGeometry(.43,24,20),white,g,0,1.8,0);const visor=mesh(new THREE.SphereGeometry(.345,24,16),glass,g,0,1.82,.19);visor.scale.set(1,.78,.7);mesh(new THREE.BoxGeometry(.52,.65,.28),white,g,0,1.1,-.36);const legs=[-.19,.19].map(x=>mesh(new THREE.CapsuleGeometry(.15,.39,4,8),white,g,x,.42,0));for(const x of [-.47,.47]){const arm=mesh(new THREE.CapsuleGeometry(.13,.43,4,8),white,g,x,1.12,0);arm.rotation.z=x>0?-.15:.15}mesh(new THREE.BoxGeometry(.24,.18,.06),gold,g,0,1.25,.34);scene.add(g);return {g,legs}}
const player=astronaut(0,5);player.g.rotation.y=Math.PI
astronaut(-12,-13,.85).g.rotation.y=1.2
const companions=createCompanions(scene,height)
const updateSparkles=createSparkles(scene)
// A compact lunar outpost with warm windows and solar arrays.
const base=new THREE.Group();base.position.set(17,height(17,-23),-23);scene.add(base)
const habitat=mesh(new THREE.CylinderGeometry(3.2,3.2,4,32),white,base,0,3.4,0);habitat.rotation.z=Math.PI/2
for(const x of [-1.5,1.5])mesh(new THREE.BoxGeometry(.8,1.2,.12),new THREE.MeshStandardMaterial({color:0xffd69b,emissive:0xffb653,emissiveIntensity:1.5}),base,x,3.7,3.05)
for(const x of [-2,2])for(const z of [-1.8,1.8])mesh(new THREE.CylinderGeometry(.13,.2,2,8),dark,base,x,1,z)
for(const x of [-7,7]){mesh(new THREE.CylinderGeometry(.08,.08,2,8),white,base,x,1,1);const panel=mesh(new THREE.BoxGeometry(5,.08,3),new THREE.MeshStandardMaterial({color:0x1c3457,metalness:.7,roughness:.3}),base,x,2,1);panel.rotation.z=.13;for(let j=0;j<6;j++)mesh(new THREE.BoxGeometry(.025,.02,3),white,panel,j*.8-2,.06,0)}
const dish=mesh(new THREE.SphereGeometry(1.2,20,12,0,Math.PI*2,0,Math.PI/2),white,base,0,7,0);dish.rotation.x=.6;mesh(new THREE.CylinderGeometry(.08,.08,2,8),dark,base,0,5.8,0)
function plantFlag(x:number,z:number){const flag=new THREE.Group();flag.position.set(x,height(x,z),z);mesh(new THREE.CylinderGeometry(.035,.035,3.3,8),white,flag,0,1.65,0);mesh(new THREE.BoxGeometry(1.15,.72,.025),new THREE.MeshStandardMaterial({color:0xd7aa64,roughness:.9}),flag,.58,2.85,0);mesh(new THREE.TorusGeometry(.18,.025,8,24),white,flag,.58,2.85,.025);scene.add(flag)}plantFlag(-5,-5)
const marker=new THREE.Mesh(new THREE.RingGeometry(.35,.43,40),new THREE.MeshBasicMaterial({color:0xe9c790,transparent:true,opacity:0}));marker.rotation.x=-Math.PI/2;scene.add(marker)
let yaw=0,pitch=.18,distance=15;const focus=new THREE.Vector3();const target=player.g.position.clone();let jumping=false;let verticalSpeed=0,jumpCount=0,lastJump=-10,spacewalk=false,returning=false;const flightVelocity=new THREE.Vector3();const landingTarget=new THREE.Vector3(12,height(12,-16),-16);let lookingEarth=false
const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();let downX=0,downY=0,lastX=0,lastY=0,dragging=false,moved=false
const touches=new Map<number,THREE.Vector2>();let pinchDistance=0
function changeZoom(amount:number){distance=THREE.MathUtils.clamp(distance+amount,.65,38);lookingEarth=false}
canvas.addEventListener('pointerdown',e=>{
 if(planetTravel.active)return
 touches.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY));canvas.setPointerCapture(e.pointerId)
 downX=lastX=e.clientX;downY=lastY=e.clientY;dragging=true;moved=touches.size>1
 if(touches.size===2){const points=[...touches.values()];pinchDistance=points[0].distanceTo(points[1])}
})
canvas.addEventListener('pointermove',e=>{
 if(planetTravel.active)return
 if(!touches.has(e.pointerId))return;touches.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY))
 if(touches.size>1){const points=[...touches.values()],next=points[0].distanceTo(points[1]);if(pinchDistance>0)changeZoom((pinchDistance-next)*.04);pinchDistance=next;moved=true;return}
 if(!dragging)return;if(Math.hypot(e.clientX-downX,e.clientY-downY)>5)moved=true
 if(moved){yaw-=(e.clientX-lastX)*.005;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.003,spacewalk||distance<3?-.95:.03,spacewalk?1.55:1.1);lookingEarth=false}
 lastX=e.clientX;lastY=e.clientY
})
canvas.addEventListener('pointerup',e=>{
 if(planetTravel.active)return
 const wasPinching=pinchDistance>0;touches.delete(e.pointerId);dragging=touches.size>0
 if(touches.size){const point=[...touches.values()][0];downX=lastX=point.x;downY=lastY=point.y;moved=true;return}
 pinchDistance=0;if(moved||wasPinching)return
 pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera)
 const friend=ray.intersectObjects(companions.objects,true)[0];if(friend){companions.greet(elapsed);toast('월-E와 이브가 반갑게 인사해요. 함께 달을 걸어볼까요?');return}
 if(spacewalk)return
 const hit=ray.intersectObject(ground)[0];if(hit&&hit.point.distanceTo(player.g.position)<100){target.copy(hit.point);marker.position.copy(hit.point);marker.position.y+=.06;(marker.material as THREE.MeshBasicMaterial).opacity=.9;lookingEarth=false}
})
canvas.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);dragging=false;moved=true;pinchDistance=0})
canvas.addEventListener('wheel',e=>{e.preventDefault();if(!planetTravel.active)changeZoom(e.deltaY*.015)},{passive:false})
const keys=new Set<string>();window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.code==='Space'&&!e.repeat&&!planetTravel.active)jump()});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear())
let toastTimer:ReturnType<typeof setTimeout>;function toast(message:string){const t=document.querySelector('#toast')!;t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000)}
const flightHud=document.querySelector<HTMLElement>('.flight-hud')!
const altitudeLabel=document.querySelector('#altitude')!
const jumpLabel=document.querySelector('#jump span')!
function setFlight(enabled:boolean){
 spacewalk=enabled;flightHud.hidden=!enabled;document.querySelector('.live')!.innerHTML=enabled?'<i></i> 자유 유영 중':'<i></i> 로봇 친구들과 탐사 중'
 jumpLabel.textContent=enabled?'상승 부스트':'달뜀하기';document.querySelector('#flag')!.toggleAttribute('disabled',enabled)
 hint.innerHTML=enabled?flightHint:firstPerson?eyeHint:orbitHint
}
function jump(){
 if(returning){toast('달 표면으로 착륙하는 중이에요.');return}
 if(spacewalk){flightVelocity.y=Math.min(flightVelocity.y+24,72);return}
 jumpCount=elapsed-lastJump<1.8?jumpCount+1:1;lastJump=elapsed
 if(jumpCount>=3){jumping=false;verticalSpeed=0;flightVelocity.set(0,24,0);target.copy(player.g.position);setFlight(true);toast('달을 떠났어요! WASD로 유영 · SPACE 상승 · SHIFT 하강');return}
 jumping=true;verticalSpeed=jumpCount===2?7:4.5
 toast(jumpCount===2?'한 번 더 점프하면 우주 유영을 시작해요!':'점프를 연속 3번 누르면 우주로 떠올라요.')
}
const descendButton=document.querySelector<HTMLButtonElement>('#descend')!
descendButton.addEventListener('click',()=>{
 if(!spacewalk||returning)return
 landingTarget.set(player.g.position.x,height(player.g.position.x,player.g.position.z),player.g.position.z)
 returning=true;lookingEarth=false;toast('지금 있는 자리로 천천히 내려갑니다.')
})
document.querySelector('#jump')!.addEventListener('click',jump)
let flags=0;document.querySelector('#flag')!.addEventListener('click',()=>{if(flags>=12){toast('오늘의 탐사 흔적을 충분히 남겼어요.');return}plantFlag(player.g.position.x+1.3,player.g.position.z);flags++;toast('작은 지구인이 다녀간 자리 ✧')})
document.querySelector('#home')!.addEventListener('click',()=>{target.set(12,0,-16);lookingEarth=false;if(spacewalk){landingTarget.set(12,height(12,-16),-16);returning=true;toast('달 기지로 자동 귀환해요. 천천히 착륙합니다.')}else toast('고요의 기지로 돌아가는 중')})
document.querySelector('#earth')!.addEventListener('click',()=>{lookingEarth=!lookingEarth;distance=Math.max(distance,8);yaw=.34;pitch=.12;toast(lookingEarth?'저 푸른 점에 우리의 모든 일상이 있어요.':'다시, 나의 작은 탐사')})
document.querySelector('#settings')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#settings-panel')!.showModal())
document.querySelector('#stars')!.addEventListener('input',e=>starMat.opacity=Number((e.target as HTMLInputElement).value))
let audioContext:AudioContext|undefined;let soundOn=false;document.querySelector('#sound')!.addEventListener('click',async()=>{if(!audioContext){audioContext=new AudioContext();const gain=audioContext.createGain();gain.gain.value=.025;gain.connect(audioContext.destination);for(const f of [110,164.81,220,277.18]){const osc=audioContext.createOscillator();osc.frequency.value=f;osc.type='sine';osc.connect(gain);osc.start()}}soundOn=!soundOn;await (soundOn?audioContext.resume():audioContext.suspend());document.querySelector('#sound')!.classList.toggle('active',soundOn);document.querySelector('#sound')!.setAttribute('aria-label',soundOn?'우주 사운드 끄기':'우주 사운드 켜기');toast(soundOn?'고요한 우주의 소리를 켰어요.':'소리를 껐어요.')})
// The map uses the same crater positions and height field as the walkable world.
const updateLunarOverview=createLunarOverview()
const mapCanvas=document.querySelector<HTMLCanvasElement>('#minimap')!
mapCanvas.width=mapCanvas.height=440
const mapContext=mapCanvas.getContext('2d')!
// Bake terrain once. Moving the map only crops this raster; it never recalculates craters.
const mapBackground=document.createElement('canvas');const mapResolution=256,worldSpan=600
mapBackground.width=mapBackground.height=mapResolution
const mapPaint=mapBackground.getContext('2d')!
let mapCenterX=0,mapCenterZ=-6,mapSpan=84,mapLastTime=-1
const trail:THREE.Vector2[]=[new THREE.Vector2(0,5)]
function mapPoint(x:number,z:number){return new THREE.Vector2(220+(x-mapCenterX)*440/mapSpan,220+(z-mapCenterZ)*440/mapSpan)}
const mapPixels=mapPaint.createImageData(mapResolution,mapResolution)
for(let y=0;y<mapResolution;y++)for(let x=0;x<mapResolution;x++){
 const wx=(x/mapResolution-.5)*worldSpan,wz=(y/mapResolution-.5)*worldSpan
 const curve=Math.sqrt(Math.max(0,moonRadius*moonRadius-wx*wx-wz*wz))-moonRadius
 const h=height(wx,wz)-curve,slope=height(wx-.5,wz-.6)-height(wx,wz)
 const grain=Math.sin(x*127.1+y*311.7)*43758.5453,v=THREE.MathUtils.clamp(42+h*3+slope*65+(grain-Math.floor(grain))*7,16,104)
 const i=(y*mapResolution+x)*4;mapPixels.data[i]=v*.83;mapPixels.data[i+1]=v*.98;mapPixels.data[i+2]=v*1.12;mapPixels.data[i+3]=255
}
mapPaint.putImageData(mapPixels,0,0)
function updateMap(time:number){
 if(time-mapLastTime<.12)return;mapLastTime=time
 const p=player.g.position,last=trail[trail.length-1]
 updateLunarOverview(p.x,p.z,Math.max(0,p.y-height(p.x,p.z)),time)
 if(Math.hypot(p.x-last.x,p.z-last.y)>.6){trail.push(new THREE.Vector2(p.x,p.z));if(trail.length>1400)trail.shift()}
 if(Math.abs(p.x-mapCenterX)>mapSpan*.38||Math.abs(p.z-mapCenterZ)>mapSpan*.38){mapCenterX=p.x;mapCenterZ=p.z;}
 mapContext.clearRect(0,0,440,440);mapContext.drawImage(mapBackground,(mapCenterX-mapSpan/2+worldSpan/2)/worldSpan*mapResolution,(mapCenterZ-mapSpan/2+worldSpan/2)/worldSpan*mapResolution,mapSpan/worldSpan*mapResolution,mapSpan/worldSpan*mapResolution,0,0,440,440)
 mapContext.strokeStyle='#b8c5d31a';mapContext.lineWidth=2
 for(const c of craters){const point=mapPoint(c.x,c.z),r=c.r*440/mapSpan;if(point.x+r<0||point.x-r>440||point.y+r<0||point.y-r>440)continue;mapContext.beginPath();mapContext.ellipse(point.x,point.y,r,r*.92,0,0,Math.PI*2);mapContext.stroke()}
 const basePoint=mapPoint(17,-23),start=mapPoint(0,5),current=mapPoint(p.x,p.z)
 // A quiet dotted guide connects the landing point and the outpost.
 mapContext.beginPath();mapContext.moveTo(start.x,start.y);mapContext.lineTo(basePoint.x,basePoint.y);mapContext.strokeStyle='#dfba794c';mapContext.lineWidth=2;mapContext.setLineDash([4,9]);mapContext.stroke();mapContext.setLineDash([])
 mapContext.beginPath();trail.forEach((point,i)=>{const m=mapPoint(point.x,point.y);i?mapContext.lineTo(m.x,m.y):mapContext.moveTo(m.x,m.y)});mapContext.lineTo(current.x,current.y);mapContext.strokeStyle='#f3b07d';mapContext.lineWidth=5;mapContext.lineCap='round';mapContext.lineJoin='round';mapContext.stroke()
 mapContext.fillStyle='#bcd0da';mapContext.fillRect(basePoint.x-6,basePoint.y-6,12,12);mapContext.font='18px sans-serif';mapContext.fillStyle='#c0ccd3';mapContext.fillText('BASE',basePoint.x+15,basePoint.y+6)
 mapContext.beginPath();mapContext.arc(start.x,start.y,4,0,Math.PI*2);mapContext.fillStyle='#c4a77a';mapContext.fill()
 const heading=player.g.rotation.y;mapContext.save();mapContext.translate(current.x,current.y);mapContext.rotate(-heading);mapContext.beginPath();mapContext.moveTo(0,0);mapContext.arc(0,0,37,Math.PI/2-.45,Math.PI/2+.45);mapContext.closePath();mapContext.fillStyle='#f2c08b24';mapContext.fill();mapContext.restore()
 mapContext.beginPath();mapContext.arc(current.x,current.y,17+Math.sin(time*2)*2,0,Math.PI*2);mapContext.strokeStyle='#ffbd7840';mapContext.lineWidth=2;mapContext.stroke()
 mapContext.beginPath();mapContext.arc(current.x,current.y,8,0,Math.PI*2);mapContext.fillStyle='#ef9b68';mapContext.fill();mapContext.strokeStyle='#fff8e9';mapContext.lineWidth=4;mapContext.stroke()
}
// Camera-mounted gloves enter with the eye-level view and sway gently while walking.
scene.add(camera)
const hands=new THREE.Group();camera.add(hands);hands.visible=false
for(const side of [-1,1]){
 const arm=new THREE.Group();arm.position.set(side*.36,-.43,-.57);arm.rotation.set(-.9,side*-.18,side*-.2);hands.add(arm)
 mesh(new THREE.CapsuleGeometry(.105,.43,6,12),white,arm,0,-.12,0)
 mesh(new THREE.CylinderGeometry(.115,.115,.065,16),dark,arm,0,.145,0)
 mesh(new THREE.SphereGeometry(.115,16,12),white,arm,0,.25,0)
 mesh(new THREE.SphereGeometry(.055,12,8),white,arm,-side*.10,.21,.02)
}
let zoomDistance=distance,firstPerson=false
const hint=document.querySelector<HTMLElement>('.hint')!
const flightHint='우주 유영 <em>·</em> WASD 이동 <em>·</em> SPACE 상승 <em>·</em> SHIFT 하강 <em>·</em> 기지로 자동 착륙'
const orbitHint='바닥을 클릭해 이동 <em>·</em> 드래그로 둘러보기 <em>·</em> 휠 / 두 손가락으로 확대'
const eyeHint='1인칭 탐사 <em>·</em> WASD / 방향키로 이동 <em>·</em> 드래그로 둘러보기 <em>·</em> 축소하면 3인칭'
hint.innerHTML=orbitHint
const planetTravel=createPlanetTravel(canvas,player.g,companions.objects,()=>{
 keys.clear();spacewalk=false;returning=false;jumping=false;verticalSpeed=0;jumpCount=0;flightVelocity.set(0,0,0)
 player.g.position.set(12,height(12,-16),-16);target.copy(player.g.position);focus.copy(player.g.position);distance=15;zoomDistance=15;yaw=0;pitch=.18;lookingEarth=false;setFlight(false)
 toast('달의 고요한 기지로 돌아왔어요.')
})
const moveInput=new THREE.Vector3(),moveDelta=new THREE.Vector3(),worldUp=new THREE.Vector3(0,1,0)
const eyePosition=new THREE.Vector3(),focusTarget=new THREE.Vector3(),cameraOffset=new THREE.Vector3(),cameraForward=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),projectedLabel=new THREE.Vector3(),forwardTarget=new THREE.Vector3()
const clock=new THREE.Clock();let elapsed=0;const label=document.querySelector<HTMLElement>('.name-tag')!
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt
if(planetTravel.active){planetTravel.update(dt,elapsed,keys,renderer);return}
let dx=0,dz=0
if(!returning){if(keys.has('w')||keys.has('arrowup'))dz--;if(keys.has('s')||keys.has('arrowdown'))dz++;if(keys.has('a')||keys.has('arrowleft'))dx--;if(keys.has('d')||keys.has('arrowright'))dx++}
const input=moveInput.set(dx,0,dz);if(input.lengthSq()>1)input.normalize();input.applyAxisAngle(worldUp,yaw)
let walking=false
if(spacewalk){
 if(returning){const destination=landingTarget;flightVelocity.x=THREE.MathUtils.clamp((destination.x-player.g.position.x)*1.8,-48,48);flightVelocity.z=THREE.MathUtils.clamp((destination.z-player.g.position.z)*1.8,-48,48);flightVelocity.y=-Math.min(48,Math.max(1,(player.g.position.y-destination.y)*.7))}
 else{
  const thrust=(keys.has(' ')?1:0)-(keys.has('shift')?1:0)
  flightVelocity.x=THREE.MathUtils.damp(flightVelocity.x,input.x*48,6,dt);flightVelocity.z=THREE.MathUtils.damp(flightVelocity.z,input.z*48,6,dt)
  flightVelocity.y=thrust?THREE.MathUtils.damp(flightVelocity.y,thrust*60,5,dt):flightVelocity.y*Math.exp(-.35*dt)
 }
 player.g.position.addScaledVector(flightVelocity,dt)
 player.g.position.x=THREE.MathUtils.clamp(player.g.position.x,-220,220);player.g.position.z=THREE.MathUtils.clamp(player.g.position.z,-220,220)
 player.g.position.y=Math.min(player.g.position.y,800)
 const surface=height(player.g.position.x,player.g.position.z),altitude=player.g.position.y-surface
 if(altitude<=.1&&flightVelocity.y<0){player.g.position.y=surface;flightVelocity.set(0,0,0);returning=false;jumpCount=0;target.copy(player.g.position);setFlight(false);toast('다시 달에 도착했어요. 잘 다녀왔어요!')}
 altitudeLabel.textContent=Math.max(0,Math.round(altitude)).toLocaleString();player.g.rotation.x=THREE.MathUtils.damp(player.g.rotation.x,returning?0:-.25,3,dt)
 const a=Math.atan2(input.x,input.z);if(input.lengthSq())player.g.rotation.y+=Math.atan2(Math.sin(a-player.g.rotation.y),Math.cos(a-player.g.rotation.y))*Math.min(dt*5,1)
 player.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(elapsed*1.5+i*Math.PI)*.15)
}else{
 player.g.rotation.x=THREE.MathUtils.damp(player.g.rotation.x,0,5,dt)
 if(input.lengthSq()){target.copy(player.g.position).addScaledVector(input,1.5);lookingEarth=false}
 target.x=THREE.MathUtils.clamp(target.x,-220,220);target.z=THREE.MathUtils.clamp(target.z,-220,220)
 const delta=moveDelta.set(target.x-player.g.position.x,0,target.z-player.g.position.z);walking=delta.length()>.12
 if(walking){delta.normalize();player.g.position.addScaledVector(delta,Math.min(dt*10.2,Math.hypot(target.x-player.g.position.x,target.z-player.g.position.z)));const a=Math.atan2(delta.x,delta.z);player.g.rotation.y+=Math.atan2(Math.sin(a-player.g.rotation.y),Math.cos(a-player.g.rotation.y))*Math.min(dt*9,1)}
 player.legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(elapsed*7+i*Math.PI)*.45:0)
 const surface=height(player.g.position.x,player.g.position.z)
 if(jumping){verticalSpeed-=1.62*dt;player.g.position.y+=verticalSpeed*dt;if(player.g.position.y<=surface&&verticalSpeed<0){jumping=false;verticalSpeed=0;jumpCount=0;player.g.position.y=surface}}
 else player.g.position.y=surface+(walking?Math.abs(Math.sin(elapsed*7))*.09:0)
}
const terrainDetail=1-THREE.MathUtils.smoothstep(player.g.position.y-height(player.g.position.x,player.g.position.z),50,150)
terrainMaterial.opacity=terrainDetail;ground.visible=terrainDetail>.001
const spaceView=THREE.MathUtils.smoothstep(player.g.position.y-height(player.g.position.x,player.g.position.z),120,400)
const nextFov=THREE.MathUtils.damp(camera.fov,48+spaceView*17,4,dt);if(Math.abs(nextFov-camera.fov)>.001){camera.fov=nextFov;camera.updateProjectionMatrix()}
zoomDistance=THREE.MathUtils.damp(zoomDistance,distance,10,dt)
const immersion=1-THREE.MathUtils.smoothstep(zoomDistance,.9,3.5)
const eye=eyePosition.set(player.g.position.x,player.g.position.y+1.8,player.g.position.z)
focus.lerp(focusTarget.set(player.g.position.x,player.g.position.y+1.5,player.g.position.z),1-Math.exp(-10*dt))
const offset=cameraOffset.set(Math.sin(yaw)*Math.cos(pitch)*zoomDistance,Math.sin(pitch)*zoomDistance,Math.cos(yaw)*Math.cos(pitch)*zoomDistance)
camera.position.copy(focus).add(offset).lerp(eye,immersion)
camera.position.y=Math.max(camera.position.y,height(camera.position.x,camera.position.z)+.5)
const forward=cameraForward.set(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))
const lookTarget=lookingEarth?cameraTarget.lerpVectors(focus,earth.position,.45):cameraTarget.copy(focus)
lookTarget.lerp(forwardTarget.copy(eye).addScaledVector(forward,20),immersion);camera.lookAt(lookTarget)
player.g.visible=immersion<.45;hands.visible=immersion>.85;hands.scale.setScalar(THREE.MathUtils.smoothstep(immersion,.85,1))
hands.position.y=walking?Math.sin(elapsed*7)*.012:Math.sin(elapsed*1.5)*.004;hands.rotation.z=walking?Math.sin(elapsed*3.5)*.015:0
if(firstPerson!==(immersion>.85)){firstPerson=immersion>.85;hint.innerHTML=spacewalk?flightHint:firstPerson?eyeHint:orbitHint}
starfield.position.copy(camera.position);earth.rotation.y+=dt*.008;(marker.material as THREE.MeshBasicMaterial).opacity*=.98
const screen=projectedLabel.copy(player.g.position).addScaledVector(worldUp,2.8).project(camera);label.style.left=`${(screen.x*.5+.5)*innerWidth}px`;label.style.top=`${(-screen.y*.5+.5)*innerHeight}px`;label.style.opacity=screen.z<1&&!lookingEarth&&immersion<.2?'1':'0';companions.update(elapsed,dt,player.g.position);updateSparkles(elapsed,dt,player.g.position,companions.objects[1].position);updateMap(elapsed);renderer.render(scene,camera)}
focus.copy(player.g.position);animate();window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)})
