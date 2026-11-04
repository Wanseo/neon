import './room.css'
import * as THREE from 'three'
import { createRoomDaylight } from './room-daylight'
import { createRoomAvatarHead } from './room-avatar'
import type { RoomAction } from './room-presence'

// Room ownership is kept in this browser; invitees receive the room ID and cake setting.
const localParticipantId:string=crypto.randomUUID()
let presence:{sendAction:(action:RoomAction)=>Promise<void>;stop:()=>void}|undefined
let applyingRemote=false,remoteActorId:string|undefined
function broadcastRoomAction(action:RoomAction){if(!applyingRemote)void presence?.sendAction(action)}
const roomParams=new URLSearchParams(location.hash.slice(1))
const existingRoomId=roomParams.get('room'),roomId=existingRoomId||crypto.randomUUID()
let isHost=!existingRoomId,initialCandles=Number(roomParams.get('candles'))||1
try{if(existingRoomId)isHost=localStorage.getItem(`little-table-owner:${roomId}`)==='true';if(isHost){localStorage.setItem(`little-table-owner:${roomId}`,'true');const saved=Number(localStorage.getItem(`little-table-candles:${roomId}`));if(saved)initialCandles=saved}}catch{/* A newly created room still works without storage. */}
initialCandles=Number.isInteger(initialCandles)&&initialCandles>=1&&initialCandles<=30?initialCandles:1
function roomLink(count:number){const url=new URL(location.href);url.hash=new URLSearchParams({room:roomId,candles:String(count)}).toString();return url.href}
if(isHost)history.replaceState(null,'',roomLink(initialCandles))

const windIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 8h11c5 0 5-6 1-6-2 0-3 1-3 3M3 12h15c5 0 5 7 1 7-2 0-3-1-3-3M3 16h5c4 0 4 6 0 6"/></svg>'
document.querySelector('#app')!.innerHTML = `
<canvas id="room-canvas" aria-label="케이크와 촛불이 놓인 따뜻한 3D 식탁"></canvas>
<header class="room-header"><a class="room-brand" href="./" aria-label="작은 식탁 홈"><span class="brand-mark">✳</span><span>작은 식탁<small>A LITTLE MOMENT TOGETHER</small></span></a><div class="room-header-actions"><button id="copy-room-link" type="button" hidden>초대 링크 <span>↗</span></button><button id="edit-table" type="button" hidden>초 설정 <span>↗</span></button><div class="presence"><i></i><span id="connection-status" role="status">입장 전</span><b><span id="guest-count">1</span>명</b></div></div></header>
<button id="room-light-switch" class="room-light-switch" type="button" aria-label="방 불 끄기" aria-pressed="true"><span aria-hidden="true">☼</span><b>방 불 끄기</b></button><section class="room-copy"><span class="room-eyebrow">MAKE A LITTLE WISH</span><h1>오늘의 작은 순간을,<br>축하해요.</h1><p>거창한 이유가 없어도 괜찮아요.<br>당신을 위한 케이크 한 조각을 준비했어요.</p><div class="copy-rule"></div><span class="room-date">A SEAT, A CAKE, AND YOU.</span></section>
<div class="seat-label"><span>나</span> 오늘의 주인공</div>
<section class="wish-controls"><div class="wish-caption" id="wish-caption" role="status">잠깐 눈을 감고, 작은 소원을 떠올려봐요.</div><button id="blow-candle">${windIcon}<span>후― 불기</span><small>MAKE A WISH</small></button><button id="relight-candle" hidden>다시 촛불 켜기 <span>↺</span></button></section>
<footer class="room-footer"><span><i></i> 조금 느리게 머물러도 되는 곳</span><span>드래그로 둘러보기 <em>·</em> 휠로 가까이 보기</span></footer>
<button id="table-lamp-switch" class="lamp-switch" type="button" aria-label="테이블 조명 끄기" aria-pressed="true"><i></i><span>조명 켜짐</span></button><button id="reset-room-view" class="reset-room-view" type="button" aria-label="방 전체가 보이도록 시점 초기화">⊞ <span>화면 맞추기</span></button><div class="room-vignette"></div><div id="celebration" aria-hidden="true"></div>
<dialog id="table-setup" aria-labelledby="setup-title"><form id="table-setup-form"><span class="room-eyebrow">A SEAT JUST FOR YOU</span><h2 id="setup-title">누구인가요?</h2><p class="setup-intro">이 식탁에서 부를 이름을 알려주세요.<br>당신의 자리를 준비해둘게요.</p><label for="guest-names">내 이름</label><input id="guest-names" type="text" maxlength="20" autocomplete="off" required value="" aria-label="내 이름"><div id="host-candle-options"><label for="candle-count">케이크의 초<span>방을 만드는 사람만 설정 · 1–30개</span></label><div class="candle-input"><button type="button" id="fewer-candles" aria-label="초 하나 줄이기">−</button><input id="candle-count" type="number" inputmode="numeric" min="1" max="30" step="1" value="1" required aria-label="초 개수"><span>개</span><button type="button" id="more-candles" aria-label="초 하나 늘리기">+</button></div></div><button class="setup-submit" type="submit">입장하기 <span>↗</span></button></form></dialog>
<dialog id="candle-settings" aria-labelledby="candle-settings-title"><form id="candle-settings-form"><button class="setup-close" id="close-candle-settings" type="button" aria-label="닫기">×</button><span class="room-eyebrow">YOUR LITTLE CELEBRATION</span><h2 id="candle-settings-title">촛불을 준비해요.</h2><p class="setup-intro">초대 링크를 만든 사람만 바꿀 수 있어요.</p><label for="edit-candle-count">케이크의 초<span>1–30개</span></label><input id="edit-candle-count" type="number" inputmode="numeric" min="1" max="30" step="1" required aria-label="초 개수 변경"><button class="setup-submit" type="submit">적용하기 <span>↗</span></button></form></dialog>
<dialog id="invite-link-dialog" aria-labelledby="invite-link-title"><form method="dialog"><h2 id="invite-link-title">함께할 사람에게 보내주세요.</h2><input id="invite-link-value" readonly aria-label="초대 링크"><button class="setup-submit">닫기</button></form></dialog>`

const canvas = document.querySelector<HTMLCanvasElement>('#room-canvas')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5, Math.sqrt(2400000 / (innerWidth * innerHeight)))); renderer.setSize(innerWidth, innerHeight)
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25
const scene = new THREE.Scene(); scene.background = new THREE.Color('#e8ddcc'); scene.fog = new THREE.Fog('#e8ddcc', 24, 52)
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100)
const ambient = new THREE.HemisphereLight(0xfff2db, 0x8d907c, 2.3); scene.add(ambient)
const sun = new THREE.DirectionalLight(0xffd0a0, 3.4); sun.position.set(-5, 8, -1); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .025; scene.add(sun)
const fill = new THREE.PointLight(0xffe2bc, 10, 14, 2); fill.position.set(2, 5, 1); scene.add(fill)
const cream = new THREE.MeshStandardMaterial({ color: '#eee6d6', roughness: .88 })
const oak = new THREE.MeshStandardMaterial({ color: '#b8895d', roughness: .7 })
const sage = new THREE.MeshStandardMaterial({ color: '#7c8b70', roughness: .84 })
const rose = new THREE.MeshStandardMaterial({ color: '#c48e7d', roughness: .9 })
const porcelain = new THREE.MeshStandardMaterial({ color: '#f8f0de', roughness: .28 })
const brass = new THREE.MeshStandardMaterial({ color: '#cba66c', metalness: .6, roughness: .35 })
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object
}
function box(parent: THREE.Object3D, width: number, height: number, depth: number, material: THREE.Material, x: number, y: number, z: number) { return mesh(parent, new THREE.BoxGeometry(width, height, depth), material, x, y, z) }
function sphere(parent: THREE.Object3D, radius: number, material: THREE.Material, x: number, y: number, z: number) { return mesh(parent, new THREE.SphereGeometry(radius, 24, 16), material, x, y, z) }

// Warm plaster, oak floorboards, and a quiet late-afternoon window.
box(scene, 17, .15, 15, cream, 0, -.12, 0)
const floor = new THREE.Group(); scene.add(floor)
for (let i = 0; i < 25; i++) {
  const plank = new THREE.MeshStandardMaterial({ color: new THREE.Color('#bda17f').offsetHSL(0, -.03, (i % 4 - 1.5) * .018), roughness: .9 })
  box(floor, .56, .045, 13, plank, (i - 12) * .58, -.02, 0)
}
box(scene, 15, 7, .16, cream, 0, 3.4, -5)
box(scene, .16, 7, 13, cream, -7.4, 3.4, 1.4)
box(scene, 15, .19, .12, oak, 0, .13, -4.85)
box(scene, .12, .19, 13, oak, -7.25, .13, 1.4)
const skyCanvas = document.createElement('canvas'); skyCanvas.width = skyCanvas.height = 512
const daylight = createRoomDaylight(skyCanvas, ambient, sun, fill, scene)
let roomLightsOn=true
const roomLightSwitch=document.querySelector<HTMLButtonElement>('#room-light-switch')!
roomLightSwitch.addEventListener('click',()=>{roomLightsOn=!roomLightsOn;broadcastRoomAction({type:'lights',value:roomLightsOn});daylight.setRoomLights(roomLightsOn);document.body.classList.toggle('room-lights-off',!roomLightsOn);roomLightSwitch.setAttribute('aria-pressed',String(roomLightsOn));roomLightSwitch.setAttribute('aria-label',roomLightsOn?'방 불 끄기':'방 불 켜기');roomLightSwitch.querySelector('b')!.textContent=roomLightsOn?'방 불 끄기':'방 불 켜기'})
const arch = new THREE.Shape(); arch.moveTo(-1.7, -2); arch.lineTo(1.7, -2); arch.lineTo(1.7, .35); arch.absarc(0, .35, 1.7, 0, Math.PI, false); arch.lineTo(-1.7, -2)
const windowMaterial = new THREE.MeshBasicMaterial({ map: daylight.texture, toneMapped: false })
const windowMesh = mesh(scene, new THREE.ShapeGeometry(arch), windowMaterial, -3, 3.2, -4.88)
const windowPosition = windowMesh.geometry.attributes.position, windowUV = windowMesh.geometry.attributes.uv
for (let i = 0; i < windowPosition.count; i++) windowUV.setXY(i, (windowPosition.getX(i) + 1.7) / 3.4, (windowPosition.getY(i) + 2) / 4.05)
const frame = new THREE.TorusGeometry(1.75, .065, 8, 48, Math.PI); const archFrame = mesh(scene, frame, oak, -3, 3.55, -4.8); archFrame.rotation.z = 0
for (const x of [-4.75, -1.25]) box(scene, .11, 2.4, .13, oak, x, 2.37, -4.78)
box(scene, 3.7, .12, .3, oak, -3, 1.2, -4.71); box(scene, .07, 3.95, .1, cream, -3, 3.22, -4.68); box(scene, 3.4, .07, .1, cream, -3, 2.9, -4.68)
for (const x of [-5.1, -.9]) {
  for (let i = 0; i < 8; i++) { const fold = mesh(scene, new THREE.CylinderGeometry(.12, .17, 4.7, 8), rose, x + (i - 3.5) * .12, 3.1, -4.55 + Math.sin(i) * .06); fold.scale.z = .65 }
}
box(scene, 5.3, .07, .07, brass, -3, 5.53, -4.45)
// A framed little print and a low cabinet anchor the room.
box(scene, 1.45, 1.75, .08, oak, 2.5, 3.4, -4.78)
box(scene, 1.27, 1.57, .04, porcelain, 2.5, 3.4, -4.7)
const print = sphere(scene, .4, rose, 2.5, 3.4, -4.64); print.scale.set(1, 1, .06)
box(scene, 3.4, 1.1, 1, oak, 3.8, .57, -4.15)
for (const x of [2.95, 4.65]) { box(scene, 1.6, .9, .04, cream, x, .59, -3.62); sphere(scene, .04, brass, x + .4, .65, -3.56) }
function plant(x: number, z: number, size: number) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.scale.setScalar(size); scene.add(group)
  mesh(group, new THREE.CylinderGeometry(.35, .25, .55, 24), rose, 0, .28, 0)
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, y = .8 + i * .13
    const stem = mesh(group, new THREE.CylinderGeometry(.018, .018, y, 5), sage, Math.cos(a) * .1, y / 2 + .3, Math.sin(a) * .1)
    stem.rotation.z = Math.cos(a) * .18
    const leaf = sphere(group, .32, sage, Math.cos(a) * .3, y + .3, Math.sin(a) * .3); leaf.scale.set(.7, 1.6, .25); leaf.rotation.set(.3, a, Math.cos(a) * .65)
  }
}
plant(-5.6, -3.2, 1.35); plant(5.3, -2.9, 1.1)
// An oval woven rug under a single shared table.
const rug = mesh(scene, new THREE.CylinderGeometry(3.75, 3.75, .035, 80), new THREE.MeshStandardMaterial({ color: '#c7bea1', roughness: 1 }), .2, .025, .1); rug.scale.z = .76
const rugEdge = mesh(scene, new THREE.TorusGeometry(3.56, .018, 5, 80), cream, .2, .052, .1); rugEdge.rotation.x = Math.PI / 2; rugEdge.scale.y = .76
const table = new THREE.Group(); scene.add(table)
mesh(table, new THREE.CylinderGeometry(1.86, 1.86, .15, 72), oak, 0, 1.4, 0)
mesh(table, new THREE.CylinderGeometry(.22, .35, 1.3, 24), oak, 0, .7, 0)
mesh(table, new THREE.CylinderGeometry(.83, .83, .12, 40), oak, 0, .08, 0)
// Soft linen and a flower-shaped table lamp.
box(table, .62, .012, 3.55, new THREE.MeshStandardMaterial({ color: '#e2d3bd', roughness: 1 }), .3, 1.484, 0)
const vase = mesh(table, new THREE.CylinderGeometry(.12, .18, .4, 24), new THREE.MeshStandardMaterial({ color: '#aab7a2', roughness: .24, metalness: .05 }), 1.1, 1.69, -.4)
mesh(vase, new THREE.CylinderGeometry(.012, .012, .65, 6), sage, 0, .35, 0)
const lampPetals=new THREE.MeshStandardMaterial({color:'#f8f0de',roughness:.45,emissive:'#ffd698',emissiveIntensity:.6})
for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const petal = sphere(vase, .07, lampPetals, Math.cos(a) * .08, .69, Math.sin(a) * .08); petal.scale.y = .6 }
const lampBulbMaterial=new THREE.MeshStandardMaterial({color:'#f4d99d',roughness:.3,emissive:'#ffcb78',emissiveIntensity:1.6})
sphere(vase,.045,lampBulbMaterial,0,.71,0)
const tableLampLight=new THREE.PointLight(0xffce8c,8,4,2);tableLampLight.position.set(0,.62,0);vase.add(tableLampLight)
let lampOn=true
const lampSwitch=document.querySelector<HTMLButtonElement>('#table-lamp-switch')!
function toggleTableLamp(){lampOn=!lampOn;broadcastRoomAction({type:'lamp',value:lampOn});tableLampLight.intensity=lampOn?8:0;lampPetals.emissiveIntensity=lampOn?.6:0;lampBulbMaterial.emissiveIntensity=lampOn?1.6:0;lampSwitch.setAttribute('aria-pressed',String(lampOn));lampSwitch.setAttribute('aria-label',lampOn?'테이블 조명 끄기':'테이블 조명 켜기');lampSwitch.querySelector('span')!.textContent=lampOn?'조명 켜짐':'조명 꺼짐'}
lampSwitch.addEventListener('click',toggleTableLamp)
const lampRay=new THREE.Raycaster(),lampPointer=new THREE.Vector2(),lampScreenPosition=new THREE.Vector3()


// The cake is modelled in layers, with piped cream, berries, and one striped candle.
const cake = new THREE.Group(); cake.position.set(-.15, 1.49, .25); table.add(cake)
mesh(cake, new THREE.CylinderGeometry(.77, .77, .055, 56), porcelain, 0, .03, 0)
mesh(cake, new THREE.CylinderGeometry(.61, .62, .33, 56), new THREE.MeshStandardMaterial({ color: '#e6bf98', roughness: .95 }), 0, .22, 0)
const icing = new THREE.MeshStandardMaterial({ color: '#fff0dc', roughness: .7 })
mesh(cake, new THREE.CylinderGeometry(.625, .625, .14, 56), icing, 0, .4, 0)
mesh(cake, new THREE.CylinderGeometry(.623, .623, .055, 56), rose, 0, .245, 0)
for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const drip = sphere(cake, .085, icing, Math.cos(a) * .56, .36, Math.sin(a) * .56); drip.scale.y = 1 + (i % 3) * .3 }
const strawberry = new THREE.MeshStandardMaterial({ color: '#c15a4d', roughness: .72 })
for (let i = 0; i < 8; i++) {
  const a = i / 8 * Math.PI * 2
  const creamPuff = sphere(cake, .105, icing, Math.cos(a) * .45, .5, Math.sin(a) * .45); creamPuff.scale.set(.8, 1.1, .8)
  const berry = sphere(cake, .09, strawberry, Math.cos(a + .35) * .45, .54, Math.sin(a + .35) * .45); berry.scale.set(.8, 1.25, .8)
}
const candle = new THREE.Group(); cake.add(candle); candle.position.y = .47
const stripeCanvas=document.createElement('canvas');stripeCanvas.width=64;stripeCanvas.height=256
const stripeContext=stripeCanvas.getContext('2d')!;stripeContext.fillStyle='#b1bd9b';stripeContext.fillRect(0,0,64,256);stripeContext.strokeStyle='#f8f0de';stripeContext.lineWidth=11
for(let y=-40;y<300;y+=54){stripeContext.beginPath();stripeContext.moveTo(0,y);stripeContext.lineTo(64,y+32);stripeContext.stroke()}
const candleTexture=new THREE.CanvasTexture(stripeCanvas);candleTexture.colorSpace=THREE.SRGBColorSpace
mesh(candle, new THREE.CylinderGeometry(.045,.045,.48,12),new THREE.MeshStandardMaterial({map:candleTexture,roughness:.7}),0,.24,0)
mesh(candle, new THREE.CylinderGeometry(.007, .007, .045, 6), new THREE.MeshStandardMaterial({ color: '#514339' }), 0, .5, 0)
const flame = new THREE.Group(); flame.name='candle-flame'; flame.position.y = .61; candle.add(flame)
const outerFlame = sphere(flame, .072, new THREE.MeshBasicMaterial({ color: '#ffbe63' }), 0, 0, 0); outerFlame.scale.set(.7, 1.65, .7);outerFlame.castShadow=false
const innerFlame = sphere(flame, .047, new THREE.MeshBasicMaterial({ color: '#fff6d6' }), 0, -.01, .015); innerFlame.scale.set(.65, 1.6, .65);innerFlame.castShadow=false
const candleLight = new THREE.PointLight(0xffb85d, 1.4, 3); candleLight.position.y = 1.08; cake.add(candleLight)
const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 64
const glowContext = glowCanvas.getContext('2d')!, glowGradient = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32)
glowGradient.addColorStop(0, '#ffe9b780'); glowGradient.addColorStop(.3, '#ffc26730'); glowGradient.addColorStop(1, '#ffc26700'); glowContext.fillStyle = glowGradient; glowContext.fillRect(0, 0, 64, 64)
const candleGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); candleGlow.name='candle-glow'; candleGlow.scale.set(.6, .6, .6); candleGlow.position.y = .61; candle.add(candleGlow)

type CakeCandle={group:THREE.Group;flame:THREE.Group;glow:THREE.Sprite}
const cakeCandles:CakeCandle[]=[{group:candle,flame,glow:candleGlow}]
let candleCount=1
function setCandleCount(count:number){
 for(const item of cakeCandles.slice(1))cake.remove(item.group)
 cakeCandles.length=1;candle.position.set(0,.47,0);candle.scale.setScalar(1);flame.visible=true;flame.scale.setScalar(1);candleGlow.visible=true
 candleCount=count
 for(let i=0;i<count;i++){
  const group=i===0?candle:candle.clone(true)
  const item=i===0?cakeCandles[0]:{group,flame:group.getObjectByName('candle-flame') as THREE.Group,glow:group.getObjectByName('candle-glow') as THREE.Sprite}
  if(i>0){cake.add(group);cakeCandles.push(item)}
  const angle=i*2.3999632297,r=count===1?0:.33*Math.sqrt((i+.5)/count)
  group.position.set(Math.cos(angle)*r,.47,Math.sin(angle)*r);group.scale.setScalar(count>12?.72:count>5?.85:1)
 }
 cake.userData.candleCount=count
}

// A participant owns exactly one seat, place setting, and character; no filler guests.
type Participant={id:string;name:string}
const guests = new Map<string, THREE.Group>()
const guestLabels=new Map<string,HTMLElement>()
document.querySelector('.seat-label')!.remove()
function namePalette(){return{outfit:'#e4a0bb',hair:'#693e2e'}}
const skin = new THREE.MeshStandardMaterial({ color: '#f7c58d', roughness: .83 })
const pinkShoes = new THREE.MeshStandardMaterial({color:'#d789a6',roughness:.8})
function setGuests(people: Participant[]) {
  const ids=people.map(person=>person.id)
  people.forEach(({id,name}, index) => {
    let guest = guests.get(id)
    if (!guest) {
      guest = new THREE.Group(); guests.set(id, guest); scene.add(guest)
      const colors=namePalette(),outfit=new THREE.MeshStandardMaterial({color:colors.outfit,roughness:.84}),guestHair=new THREE.MeshStandardMaterial({color:colors.hair,roughness:.48})
      guest.userData.outfit=outfit;guest.userData.hair=guestHair
      const label=document.createElement('div');label.className='seat-label';const badge=document.createElement('span'),text=document.createElement('b');label.append(badge,text);document.querySelector('#app')!.append(label);guestLabels.set(id,label)
      mesh(guest, new THREE.CylinderGeometry(.46, .46, .12, 32), oak, 0, .75, 0)
      box(guest, .87, .65, .12, oak, 0, 1.15, -.38)
      box(guest, .73, .42, .045, sage, 0, 1.17, -.3)
      for (const x of [-.3, .3]) for (const z of [-.28, .28]) box(guest, .065, .75, .065, oak, x, .36, z)
      mesh(guest,new THREE.CylinderGeometry(.22,.34,.62,32),outfit,0,1.2,0)
      mesh(guest,new THREE.CylinderGeometry(.33,.37,.10,32),porcelain,0,.86,0)
      for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const scallop=sphere(guest,.047,porcelain,Math.cos(a)*.331,.842,Math.sin(a)*.331);scallop.scale.y=.65}
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2;sphere(guest,.035,porcelain,Math.cos(a)*.14,1.525,Math.sin(a)*.14)}
      guest.userData.updateFace=createRoomAvatarHead(guest,guestHair)
      for(const x of [-.33,.33]){const arm=mesh(guest,new THREE.CapsuleGeometry(.095,.30,4,10),outfit,x,1.3,.19);arm.rotation.x=-.8;const cuff=mesh(guest,new THREE.CylinderGeometry(.103,.103,.07,12),porcelain,x,1.18,.36);cuff.rotation.x=-.8;sphere(guest,.105,skin,x,1.13,.41)}
      mesh(guest,new THREE.CylinderGeometry(.24,.24,.025,32),porcelain,0,1.5,.88)
      mesh(guest,new THREE.CylinderGeometry(.085,.075,.18,20),porcelain,.37,1.59,.82)
      for (const x of [-.16, .16]) { const stocking=mesh(guest,new THREE.CapsuleGeometry(.073,.29,4,10),porcelain,x,.66,.22);stocking.scale.z=.9;const shoe=sphere(guest,.12,pinkShoes,x,.43,.3);shoe.scale.set(.8,.6,1.35) }
    }
    const colors=namePalette();(guest.userData.outfit as THREE.MeshStandardMaterial).color.set(colors.outfit);(guest.userData.hair as THREE.MeshStandardMaterial).color.set(colors.hair);guest.userData.name=name
    const label=guestLabels.get(id)!;label.querySelector('span')!.textContent=id===localParticipantId?'나':name.slice(0,1);label.querySelector('b')!.textContent=name
    const angle = index / Math.max(ids.length, 1) * Math.PI * 2
    guest.position.set(Math.sin(angle) * 2.25, 0, -Math.cos(angle) * 2.25); guest.rotation.y = -angle
  })
  for (const [id, guest] of guests) if (!ids.includes(id)) { scene.remove(guest); guest.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose() }); for(const material of guest.userData.avatarMaterials||[])material.dispose();(guest.userData.outfit as THREE.Material).dispose();(guest.userData.hair as THREE.Material).dispose();guestLabels.get(id)?.remove();guestLabels.delete(id);guests.delete(id) }
  document.querySelector('#guest-count')!.textContent = String(ids.length)
}
setGuests([])
// Live room membership drives the seats; each device has a distinct participant ID.

const smoke: THREE.Mesh[] = []
const smokeMaterial = new THREE.MeshBasicMaterial({ color: '#c4b8aa', transparent: true, opacity: 0, depthWrite: false })
for (let i = 0; i < 12; i++) smoke.push(sphere(cake, .032 + i * .006, smokeMaterial.clone(), 0, .57, 0))
let blowingParticipantId=localParticipantId
let lit = true, blowing = false, blowStarted = 0, smokeStarted = -10
const blowButton = document.querySelector<HTMLButtonElement>('#blow-candle')!, relightButton = document.querySelector<HTMLButtonElement>('#relight-candle')!, caption = document.querySelector('#wish-caption')!
let blowTimer:ReturnType<typeof setTimeout>|undefined
function finishBlow(){
 if(!blowing)return
 if(blowTimer)clearTimeout(blowTimer)
      lit = false; blowing = false; for(const item of cakeCandles){item.flame.visible=false;item.glow.visible=false} smokeStarted = performance.now()/1000; blowButton.hidden = true; relightButton.hidden = false
      caption.textContent = '소원을 담아, 후. 오늘도 당신의 날이에요.'
      const guest = guests.get(blowingParticipantId); if (guest) guest.rotation.x = 0
      const celebration = document.querySelector('#celebration')!; celebration.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--delay:${(i % 7) * .08}s;--color:${['#b6bb95', '#e4bbaa', '#d5b67a', '#f4e5c4'][i % 4]}"></i>`).join(''); setTimeout(() => celebration.replaceChildren(), 4000)
}
blowButton.addEventListener('click', () => {
  if (!lit || blowing) return
  blowingParticipantId=remoteActorId||localParticipantId;broadcastRoomAction({type:'blow'});blowing = true; blowStarted = performance.now(); blowButton.disabled = true; blowButton.querySelector('span')!.textContent = '후우―'; caption.textContent = '당신의 작은 소원이 이루어지기를.'
  const guest = guests.get(blowingParticipantId); if (guest) guest.rotation.x = .08
  if(blowTimer)clearTimeout(blowTimer);blowTimer=setTimeout(finishBlow,1000)
})
relightButton.addEventListener('click', () => {
  broadcastRoomAction({type:'relight'});if(blowTimer)clearTimeout(blowTimer)
  lit = true; blowing = false; for(const item of cakeCandles){item.flame.scale.setScalar(1);item.flame.rotation.z=0;item.flame.visible=true;item.glow.visible=true} candleLight.intensity = 1.4; blowButton.hidden = false; blowButton.disabled = false; relightButton.hidden = true; blowButton.querySelector('span')!.textContent = '후― 불기'; caption.textContent = '새로운 소원을 하나 더 떠올려도 좋아요.'
})
const setupDialog=document.querySelector<HTMLDialogElement>('#table-setup')!,setupForm=document.querySelector<HTMLFormElement>('#table-setup-form')!
const namesInput=document.querySelector<HTMLInputElement>('#guest-names')!,countInput=document.querySelector<HTMLInputElement>('#candle-count')!
const candleSettings=document.querySelector<HTMLDialogElement>('#candle-settings')!,editCandleInput=document.querySelector<HTMLInputElement>('#edit-candle-count')!
const editButton=document.querySelector<HTMLButtonElement>('#edit-table')!,inviteButton=document.querySelector<HTMLButtonElement>('#copy-room-link')!
let entered=false
namesInput.value='';countInput.value=String(initialCandles);setCandleCount(initialCandles)
document.querySelector<HTMLElement>('#host-candle-options')!.hidden=!isHost;countInput.disabled=!isHost
blowButton.disabled=true
function applyCandles(count:number){
 setCandleCount(count);relightButton.click();countInput.value=String(count);editCandleInput.value=String(count)
 caption.textContent=`소원을 담을 촛불 ${count}개를 준비했어요.`
 if(isHost&&!applyingRemote){broadcastRoomAction({type:'candles',value:count});history.replaceState(null,'',roomLink(count));try{localStorage.setItem(`little-table-candles:${roomId}`,String(count))}catch{/* Saving is optional. */}}
}
function validateName(){const name=namesInput.value.trim();namesInput.setCustomValidity(!name?'내 이름을 입력해주세요.':/[,，\n]/.test(name)?'자기 이름 하나만 입력해주세요.':[...name].length>20?'이름은 20자 이내로 입력해주세요.':'');return name}
namesInput.addEventListener('input',validateName)
setupForm.addEventListener('submit',event=>{
 event.preventDefault();const name=validateName();if(!setupForm.reportValidity())return
 const count=isHost?Number(countInput.value):initialCandles;if(!Number.isInteger(count)||count<1||count>30)return
 setGuests([{id:localParticipantId,name}]);entered=true;document.body.classList.add('room-entered');applyCandles(count);connectPresence(name);caption.textContent=`${name}님, 작은 소원을 하나 떠올려봐요.`
 editButton.hidden=!isHost;inviteButton.hidden=!isHost;setupDialog.close()
})
setupDialog.addEventListener('cancel',event=>{if(!entered)event.preventDefault()})
editButton.addEventListener('click',()=>{if(!isHost||!entered)return;editCandleInput.value=String(candleCount);candleSettings.showModal()})
document.querySelector('#close-candle-settings')!.addEventListener('click',()=>candleSettings.close())
document.querySelector<HTMLFormElement>('#candle-settings-form')!.addEventListener('submit',event=>{event.preventDefault();if(!isHost)return;const count=Number(editCandleInput.value);if(!Number.isInteger(count)||count<1||count>30)return;applyCandles(count);candleSettings.close()})
for(const [selector,step]of [['#fewer-candles',-1],['#more-candles',1]] as const)document.querySelector(selector)!.addEventListener('click',()=>{countInput.value=String(Math.max(1,Math.min(30,(Number(countInput.value)||1)+step)))})
inviteButton.addEventListener('click',async()=>{
 if(!isHost||!entered)return
 const link=roomLink(candleCount)
 try{await navigator.clipboard.writeText(link);caption.textContent='초대 링크를 복사했어요. 함께할 사람에게 보내주세요.'}catch{const input=document.querySelector<HTMLInputElement>('#invite-link-value')!;input.value=link;document.querySelector<HTMLDialogElement>('#invite-link-dialog')!.showModal();input.select()}
})
function sendRoomSnapshot(){
 if(!isHost||!presence)return
 void presence.sendAction({type:'state',state:{candles:candleCount,lit:lit&&!blowing,lamp:lampOn,lights:roomLightsOn}})
}
async function connectPresence(name:string){
 const status=document.querySelector<HTMLElement>('#connection-status')!;status.textContent='같은 방 연결 중…'
 try{
  const {createRoomPresence}=await import('./room-presence')
  presence=await createRoomPresence({roomId,self:{id:localParticipantId,name,joinedAt:Date.now(),isHost},onParticipants:setGuests,onStatus:connected=>{status.textContent=connected?'실시간 연결됨':'연결 재시도 중…';document.querySelector<HTMLElement>('.presence')!.dataset.connection=connected?'online':'connecting'},onStateRequest:sendRoomSnapshot,onAction:(action,actor)=>{
   applyingRemote=true;remoteActorId=actor.id
   try{
    if(action.type==='state'&&action.state){const state=action.state;if(state.candles!==candleCount)applyCandles(state.candles);if(state.lit&&!lit)relightButton.click();if(!state.lit&&lit&&!blowing)blowButton.click();if(state.lamp!==lampOn)toggleTableLamp();if(state.lights!==roomLightsOn)roomLightSwitch.click()}
    else if(action.type==='blow')blowButton.click()
    else if(action.type==='relight')relightButton.click()
    else if(action.type==='candles'&&Number(action.value)!==candleCount)applyCandles(Number(action.value))
    else if(action.type==='lamp'&&Boolean(action.value)!==lampOn)toggleTableLamp()
    else if(action.type==='lights'&&Boolean(action.value)!==roomLightsOn)roomLightSwitch.click()
   }finally{applyingRemote=false;remoteActorId=undefined}
  }})
  sendRoomSnapshot()
 }catch{status.textContent='연결하지 못했어요 · 새로고침해 주세요'}
}
setupDialog.showModal()

function defaultDistance(){return innerWidth<650?15:13.3}
let yaw=.35,elevation=.47,distance=defaultDistance(),dragging=false,lastX=0,lastY=0,startX=0,startY=0,wasDragged=false,panX=0,panZ=0
const touchPoints=new Map<number,THREE.Vector2>();let pinchDistance=0,pinchX=0,pinchY=0
function resetRoomView(){yaw=.35;elevation=.47;distance=defaultDistance();panX=panZ=0}
document.querySelector('#reset-room-view')!.addEventListener('click',resetRoomView)
canvas.addEventListener('pointerdown',e=>{
 touchPoints.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY));canvas.setPointerCapture(e.pointerId);dragging=true;wasDragged=touchPoints.size>1;startX=lastX=e.clientX;startY=lastY=e.clientY
 if(touchPoints.size===2){const [a,b]=[...touchPoints.values()];pinchDistance=a.distanceTo(b);pinchX=(a.x+b.x)/2;pinchY=(a.y+b.y)/2}
})
canvas.addEventListener('pointermove',e=>{
 if(!touchPoints.has(e.pointerId))return;touchPoints.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY))
 if(touchPoints.size>=2){
  const [a,b]=[...touchPoints.values()],next=a.distanceTo(b),centerX=(a.x+b.x)/2,centerY=(a.y+b.y)/2
  if(pinchDistance>0){distance=THREE.MathUtils.clamp(distance+(pinchDistance-next)*.035,7,23);const dx=(centerX-pinchX)*.008,dy=(centerY-pinchY)*.008;panX=THREE.MathUtils.clamp(panX-dx*Math.cos(yaw)-dy*Math.sin(yaw),-2.2,2.2);panZ=THREE.MathUtils.clamp(panZ+dx*Math.sin(yaw)-dy*Math.cos(yaw),-2.2,2.2)}
  pinchDistance=next;pinchX=centerX;pinchY=centerY;wasDragged=true;return
 }
 if(!dragging)return;if(Math.hypot(e.clientX-startX,e.clientY-startY)>5)wasDragged=true
 yaw=THREE.MathUtils.clamp(yaw-(e.clientX-lastX)*.004,-1.25,1.25);elevation=THREE.MathUtils.clamp(elevation+(e.clientY-lastY)*.003,.2,1.05);lastX=e.clientX;lastY=e.clientY
})
canvas.addEventListener('pointerup',e=>{
 if(!touchPoints.has(e.pointerId))return;const wasPinching=pinchDistance>0;touchPoints.delete(e.pointerId)
 if(touchPoints.size){const point=[...touchPoints.values()][0];startX=lastX=point.x;startY=lastY=point.y;wasDragged=true;return}
 dragging=false;pinchDistance=0;if(wasDragged||wasPinching)return
 const rect=canvas.getBoundingClientRect();lampPointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);lampRay.setFromCamera(lampPointer,camera);if(lampRay.intersectObject(vase,true).length)toggleTableLamp()
})
canvas.addEventListener('pointercancel',e=>{touchPoints.delete(e.pointerId);dragging=false;wasDragged=true;pinchDistance=0})
canvas.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance+e.deltaY*.008,7,23)},{passive:false})
let viewportWidth=0,viewportHeight=0,portraitLayout=innerWidth<650
function resizeRoom(){
 const portrait=innerWidth<650;if(portrait!==portraitLayout){portraitLayout=portrait;resetRoomView()}
 viewportWidth=innerWidth;viewportHeight=innerHeight;camera.aspect=viewportWidth/viewportHeight;camera.fov=portrait||viewportHeight<500?46:38;camera.updateProjectionMatrix()
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(2400000/(viewportWidth*viewportHeight))));renderer.setSize(viewportWidth,viewportHeight)
 const hint=document.querySelector('.room-footer>span:last-child')!;hint.textContent=portrait?'한 손가락으로 둘러보기 · 두 손가락으로 확대 / 이동':'드래그로 둘러보기 · 휠로 가까이 보기'
}
resizeRoom()
const focus = new THREE.Vector3(), projected = new THREE.Vector3(),labelOffset=new THREE.Vector3(0,3.0,0)
function animate(now: number) {
  requestAnimationFrame(animate);if(viewportWidth!==innerWidth||viewportHeight!==innerHeight)resizeRoom(); daylight.update(now); const time = now / 1000
  const mobile = innerWidth < 650, screenOffset = mobile ? 0 : -1.25
  focus.set(screenOffset+panX,1.45,panZ)
  camera.position.set(focus.x + Math.sin(yaw) * Math.cos(elevation) * distance, focus.y + Math.sin(elevation) * distance, Math.cos(yaw) * Math.cos(elevation) * distance)
  camera.lookAt(focus)
  cakeCandles.forEach((item,i)=>{item.flame.rotation.z=Math.sin(time*7+i)*.08;item.flame.scale.y=1+Math.sin(time*11+i)*.08});candleLight.intensity=lit?Math.min(3,1.4*Math.sqrt(candleCount))+Math.sin(time*9)*.15:0
  if (blowing) {
    const progress = Math.min(1, (now - blowStarted) / 1000); for(const item of cakeCandles){item.flame.rotation.z=-.8*progress;item.flame.scale.setScalar(1-progress*.9)}
    if(progress>=1)finishBlow()
  }

  const smokeAge = time - smokeStarted
  smoke.forEach((puff, i) => { const t = smokeAge - i * .065; puff.visible = t > 0 && t < 2.3; if (puff.visible) { const source=cakeCandles[i%cakeCandles.length].group;puff.position.set(source.position.x+Math.sin(time*2+i)*t*.06,source.position.y+source.scale.y*.57+t*.27,source.position.z); puff.scale.setScalar(1 + t * 1.7); (puff.material as THREE.MeshBasicMaterial).opacity = .18 * (1 - t / 2.3) } })
  for(const [id,guest] of guests){guest.userData.updateFace?.(time,blowing&&id===blowingParticipantId);guest.position.y=Math.sin(time*1.4)*.012;projected.copy(guest.position).add(labelOffset).project(camera);const label=guestLabels.get(id)!;label.style.left=`${(projected.x*.5+.5)*innerWidth}px`;label.style.top=`${(-projected.y*.5+.5)*innerHeight}px`;label.style.visibility=projected.z<1?'visible':'hidden'}
  vase.getWorldPosition(lampScreenPosition);lampScreenPosition.y+=1.03;lampScreenPosition.project(camera);lampSwitch.style.left=`${(lampScreenPosition.x*.5+.5)*innerWidth}px`;lampSwitch.style.top=`${(-lampScreenPosition.y*.5+.5)*innerHeight}px`;lampSwitch.style.visibility=lampScreenPosition.z<1?'visible':'hidden'
  renderer.render(scene, camera)
}
requestAnimationFrame(animate)
window.addEventListener('resize',resizeRoom)
