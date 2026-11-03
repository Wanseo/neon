import * as THREE from 'three'

// Soft additive particles provide a glow without blurring the scene or interface.
export function createSparkles(scene: THREE.Scene) {
  let seed = 1729
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  function particles(count: number) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count), phases = new Float32Array(count), alphas = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const color = new THREE.Color([0xffcd78, 0xffe9bb, 0xb4daff, 0xf8dba0][Math.floor(random() * 4)])
      color.toArray(colors, i * 3); sizes[i] = .07 + random() ** 2 * .35; phases[i] = random() * Math.PI * 2; alphas[i] = 1
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('particleSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { time: { value: 0 }, viewport: { value: 1000 } },
      vertexShader: `
        attribute vec3 color; attribute float particleSize; attribute float phase; attribute float alpha;
        uniform float time; uniform float viewport;
        varying vec3 tint; varying float brightness; varying float flare;
        void main(){
          vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
          gl_Position=projectionMatrix*viewPosition;
          gl_PointSize=clamp(particleSize*viewport/max(0.1,-viewPosition.z),1.0,90.0);
          float pulse=0.5+0.5*sin(time*(0.75+mod(phase,1.0))+phase);
          brightness=alpha*(0.35+0.65*pow(pulse,3.0))*smoothstep(0.2,1.4,-viewPosition.z);
          flare=pow(pulse,12.0);tint=color;
        }`,
      fragmentShader: `
        varying vec3 tint; varying float brightness; varying float flare;
        void main(){
          vec2 p=(gl_PointCoord-0.5)*2.0;float r=length(p);
          float halo=exp(-r*r*5.5)*0.38;
          float core=exp(-r*r*70.0)*0.9;
          float cross=(exp(-abs(p.x)*55.0)*exp(-abs(p.y)*4.5)+exp(-abs(p.y)*55.0)*exp(-abs(p.x)*4.5))*flare*0.35;
          float light=(halo+core+cross)*smoothstep(1.0,0.65,r)*brightness;
          if(light<0.003)discard;
          gl_FragColor=vec4(tint,light);
        }`
    })
    const points = new THREE.Points(geometry, material); points.frustumCulled = false; scene.add(points)
    return { points, geometry, material, positions, sizes, alphas }
  }
  const dust = particles(360), trail = particles(130)
  const anchors = new Float32Array(360 * 3)
  for (let i = 0; i < 360; i++) {
    anchors[i * 3] = (random() - .5) * 55; anchors[i * 3 + 1] = .4 + random() * 24; anchors[i * 3 + 2] = (random() - .5) * 55
  }
  const life = new Float32Array(130), lifetimes = new Float32Array(130), drift = new Float32Array(130 * 3)
  trail.alphas.fill(0); let cursor = 0, spawn = 0
  const center = new THREE.Vector3(), previousEmitter = new THREE.Vector3(); let initialized = false
  return (time: number, dt: number, player: THREE.Vector3, eve: THREE.Vector3) => {
    if (!initialized) { center.copy(player); previousEmitter.copy(eve); initialized = true }
    center.lerp(player, 1 - Math.exp(-3 * dt))
    dust.points.position.copy(center)
    for (let i = 0; i < 360; i++) {
      dust.positions[i * 3] = anchors[i * 3] + Math.sin(time * .13 + i) * .5
      dust.positions[i * 3 + 1] = anchors[i * 3 + 1] + Math.sin(time * .24 + i * .7) * .5
      dust.positions[i * 3 + 2] = anchors[i * 3 + 2] + Math.cos(time * .17 + i) * .5
    }
    spawn += dt * 48
    while (spawn >= 1) {
      spawn--; const i = cursor++ % life.length, spread = .22
      life[i] = lifetimes[i] = 1 + random() * 1.1
      for (let axis = 0; axis < 3; axis++) {
        trail.positions[i * 3 + axis] = previousEmitter.getComponent(axis) + (eve.getComponent(axis) - previousEmitter.getComponent(axis)) * random() + (random() - .5) * spread
        drift[i * 3 + axis] = (random() - .5) * .22
      }
      trail.positions[i * 3 + 1] -= .5; drift[i * 3 + 1] = -.25 - random() * .5
      trail.sizes[i] = .065 + random() * .15
    }
    previousEmitter.copy(eve)
    for (let i = 0; i < life.length; i++) {
      life[i] = Math.max(0, life[i] - dt); trail.alphas[i] = Math.sin(life[i] / (lifetimes[i] || 1) * Math.PI) * .9
      for (let axis = 0; axis < 3; axis++) trail.positions[i * 3 + axis] += drift[i * 3 + axis] * dt
    }
    for (const set of [dust, trail]) {
      set.geometry.attributes.position.needsUpdate = true
      set.geometry.attributes.alpha.needsUpdate = true
      set.geometry.attributes.particleSize.needsUpdate = true
      set.material.uniforms.time.value = time
      set.material.uniforms.viewport.value = innerHeight * Math.min(devicePixelRatio, 2)
    }
  }
}
