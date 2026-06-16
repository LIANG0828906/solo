import * as THREE from 'three';

export type SpinState = 'up' | 'down' | 'superposition';

interface ParticleData {
  mesh: THREE.Mesh;
  originalGeometry: THREE.SphereGeometry;
  baseColor: THREE.Color;
  spinState: SpinState;
  spinSpeed: number;
  pulsePhase: number;
  pulseScale: number;
  targetScale: number;
  currentScale: number;
  isPulsing: boolean;
  pulseTime: number;
  superpositionAlpha: number;
  superpositionTime: number;
}

interface ParticleSystemResult {
  particles: THREE.Mesh[];
  update: (delta: number, time: number) => void;
  setSpin: (index: number, state: SpinState) => void;
  triggerPulse: (index: number) => void;
  getSpinState: (index: number) => SpinState;
}

const PARTICLE_RADIUS = 0.8;
const PULSE_FREQUENCY = 2;
const PULSE_AMPLITUDE = 0.03;
const SPHERE_SEGMENTS = 64;
const SPHERE_RINGS = 64;
const PULSE_ANIM_DURATION = 0.3;
const PULSE_SCALE_MAX = 1.1;

function createParticleMaterial(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.9,
    metalness: 0.3,
    roughness: 0.2,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide
  });
}

function createSphereGeometry(): THREE.SphereGeometry {
  return new THREE.SphereGeometry(PARTICLE_RADIUS, SPHERE_SEGMENTS, SPHERE_RINGS);
}

function createHelixCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  turns: number,
  offset: number
): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const direction = new THREE.Vector3().subVectors(end, start);
  const normalizedDir = direction.clone().normalize();
  
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = normalizedDir.clone();
  if (Math.abs(tangent.dot(up)) > 0.9) {
    up.set(1, 0, 0);
  }
  const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
  const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
  
  const segments = 100;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2 + offset;
    const helixRadius = radius * Math.sin(t * Math.PI);
    
    const centerPoint = new THREE.Vector3().lerpVectors(start, end, t);
    const offsetX = normal.clone().multiplyScalar(Math.cos(angle) * helixRadius);
    const offsetY = binormal.clone().multiplyScalar(Math.sin(angle) * helixRadius);
    
    const point = centerPoint.clone().add(offsetX).add(offsetY);
    points.push(point);
  }
  
  return new THREE.CatmullRomCurve3(points);
}

function createEntanglementBand(start: THREE.Vector3, end: THREE.Vector3): THREE.Group {
  const group = new THREE.Group();
  
  const helixRadius = 0.25;
  const turns = 3;
  
  for (let i = 0; i < 2; i++) {
    const offset = i * Math.PI;
    const curve = createHelixCurve(start, end, helixRadius, turns, offset);
    
    const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.06, 12, false);
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    if (i === 0) {
      gradient.addColorStop(0, `rgba(155, 89, 182, 0.8)`);
      gradient.addColorStop(0.5, `rgba(123, 150, 180, 0.6)`);
      gradient.addColorStop(1, `rgba(26, 188, 156, 0.8)`);
    } else {
      gradient.addColorStop(0, `rgba(26, 188, 156, 0.8)`);
      gradient.addColorStop(0.5, `rgba(123, 150, 180, 0.6)`);
      gradient.addColorStop(1, `rgba(155, 89, 182, 0.8)`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const tube = new THREE.Mesh(tubeGeometry, material);
    tube.userData.isHelix = true;
    tube.userData.helixIndex = i;
    group.add(tube);
  }
  
  return group;
}

function createStarParticles(scene: THREE.Scene): THREE.Points {
  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  const color1 = new THREE.Color('#9B59B6');
  const color2 = new THREE.Color('#1ABC9C');
  const color3 = new THREE.Color('#ffffff');
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = 15 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    const colorChoice = Math.random();
    let color: THREE.Color;
    if (colorChoice < 0.4) {
      color = color1;
    } else if (colorChoice < 0.8) {
      color = color2;
    } else {
      color = color3;
    }
    
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
    
    sizes[i] = 1 + Math.random() * 2;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  
  const material = new THREE.PointsMaterial({
    size: 0.15,
    map: texture,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  
  const particles = new THREE.Points(geometry, material);
  particles.userData.sizes = sizes;
  particles.userData.baseOpacity = 0.2 + Math.random() * 0.4;
  scene.add(particles);
  
  return particles;
}

export function createParticleSystem(scene: THREE.Scene): ParticleSystemResult {
  const particlesData: ParticleData[] = [];
  const particleMeshes: THREE.Mesh[] = [];
  
  const positions = [
    new THREE.Vector3(-1.8, 0, 0),
    new THREE.Vector3(1.8, 0, 0)
  ];
  
  const colors = ['#9B59B6', '#1ABC9C'];
  
  positions.forEach((pos, index) => {
    const geometry = createSphereGeometry();
    const material = createParticleMaterial(colors[index]);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    mesh.userData.particleIndex = index;
    
    scene.add(mesh);
    
    const glowGeometry = new THREE.SphereGeometry(PARTICLE_RADIUS * 1.3, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors[index]),
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glowMesh);
    
    particleMeshes.push(mesh);
    particlesData.push({
      mesh,
      originalGeometry: geometry.clone(),
      baseColor: new THREE.Color(colors[index]),
      spinState: 'superposition',
      spinSpeed: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseScale: 1,
      targetScale: 1,
      currentScale: 1,
      isPulsing: false,
      pulseTime: 0,
      superpositionAlpha: 0.85,
      superpositionTime: Math.random() * Math.PI * 2
    });
  });
  
  const bandGroup = createEntanglementBand(positions[0], positions[1]);
  scene.add(bandGroup);
  
  const starParticles = createStarParticles(scene);
  
  let bandRotation = 0;
  
  function updatePulseGeometry(data: ParticleData, time: number): void {
    const geometry = data.mesh.geometry as THREE.SphereGeometry;
    const originalPositions = data.originalGeometry.attributes.position;
    const positions = geometry.attributes.position;
    const originalNormals = data.originalGeometry.attributes.normal;
    
    for (let i = 0; i < positions.count; i++) {
      const ox = originalPositions.getX(i);
      const oy = originalPositions.getY(i);
      const oz = originalPositions.getZ(i);
      
      const nx = originalNormals.getX(i);
      const ny = originalNormals.getY(i);
      const nz = originalNormals.getZ(i);
      
      const noise = Math.sin(time * PULSE_FREQUENCY * Math.PI * 2 + data.pulsePhase + 
        (nx * 3 + ny * 2 + nz * 1.5)) * PULSE_AMPLITUDE;
      
      positions.setX(i, ox + nx * noise);
      positions.setY(i, oy + ny * noise);
      positions.setZ(i, oz + nz * noise);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  function updateSpin(data: ParticleData, delta: number): void {
    if (data.spinState === 'up') {
      data.mesh.rotation.y += data.spinSpeed * delta;
    } else if (data.spinState === 'down') {
      data.mesh.rotation.y -= data.spinSpeed * delta;
    } else if (data.spinState === 'superposition') {
      data.superpositionTime += delta * 3;
      const flicker = (Math.sin(data.superpositionTime) + 1) * 0.5;
      const material = data.mesh.material as THREE.MeshStandardMaterial;
      material.opacity = 0.5 + flicker * 0.35;
      
      const speed = 1 + flicker * 2;
      if (Math.sin(data.superpositionTime * 0.7) > 0) {
        data.mesh.rotation.y += speed * delta;
      } else {
        data.mesh.rotation.y -= speed * delta;
      }
    }
  }
  
  function updatePulseAnimation(data: ParticleData, delta: number): void {
    if (data.isPulsing) {
      data.pulseTime += delta;
      const t = data.pulseTime / PULSE_ANIM_DURATION;
      
      if (t >= 1) {
        data.isPulsing = false;
        data.currentScale = 1;
        data.targetScale = 1;
      } else {
        const pulseProgress = Math.sin(t * Math.PI);
        data.currentScale = 1 + pulseProgress * (PULSE_SCALE_MAX - 1);
      }
      
      data.mesh.scale.setScalar(data.currentScale);
    }
  }
  
  function update(delta: number, time: number): void {
    particlesData.forEach((data) => {
      updatePulseGeometry(data, time);
      updateSpin(data, delta);
      updatePulseAnimation(data, delta);
    });
    
    bandRotation += delta * 0.5 * Math.PI * 2;
    bandGroup.rotation.z = bandRotation;
    
    const positions = starParticles.geometry.attributes.position as THREE.BufferAttribute;
    const material = starParticles.material as THREE.PointsMaterial;
    
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      
      positions.setY(i, y + Math.sin(time * 0.5 + i * 0.1) * 0.002);
      
      const opacity = 0.3 + Math.sin(time * 2 + i * 0.5) * 0.2;
      material.opacity = Math.max(0.2, Math.min(0.6, opacity));
    }
    positions.needsUpdate = true;
  }
  
  function setSpin(index: number, state: SpinState): void {
    const data = particlesData[index];
    if (!data) return;
    
    data.spinState = state;
    
    if (state === 'up') {
      data.spinSpeed = 2;
      const material = data.mesh.material as THREE.MeshStandardMaterial;
      material.opacity = 0.9;
      material.emissive.setHex(0xff6b6b);
      material.emissiveIntensity = 0.6;
    } else if (state === 'down') {
      data.spinSpeed = 2;
      const material = data.mesh.material as THREE.MeshStandardMaterial;
      material.opacity = 0.9;
      material.emissive.setHex(0x4ecdc4);
      material.emissiveIntensity = 0.6;
    } else if (state === 'superposition') {
      data.spinSpeed = 1.5;
      const material = data.mesh.material as THREE.MeshStandardMaterial;
      material.emissive.copy(data.baseColor);
      material.emissiveIntensity = 0.4;
    }
  }
  
  function triggerPulse(index: number): void {
    const data = particlesData[index];
    if (!data) return;
    
    data.isPulsing = true;
    data.pulseTime = 0;
  }
  
  function getSpinState(index: number): SpinState {
    return particlesData[index]?.spinState || 'superposition';
  }
  
  return {
    particles: particleMeshes,
    update,
    setSpin,
    triggerPulse,
    getSpinState
  };
}
