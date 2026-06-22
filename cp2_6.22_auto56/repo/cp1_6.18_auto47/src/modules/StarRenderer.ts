import * as THREE from 'three';
import type { StarData, SpectralType } from '@/types/star';
import { SPECTRAL_COLORS } from '@/types/star';

export interface StarMesh extends THREE.Group {
  userData: {
    starId: string;
    originalPosition: THREE.Vector3;
    originalScale: THREE.Vector3;
    isSelected: boolean;
    spectralType: SpectralType;
  };
}

export interface RenderedStar {
  starId: string;
  group: StarMesh;
  coreMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  selectionRing?: THREE.Mesh;
}

function temperatureToColor(temperature: number): THREE.Color {
  const minTemp = 2500;
  const maxTemp = 50000;
  const t = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));

  const coldColor = new THREE.Color('#FF4C4C');
  const warmColor = new THREE.Color('#FF8C42');
  const midColor = new THREE.Color('#FFD93D');
  const hotColor = new THREE.Color('#D4E2FF');
  const veryHotColor = new THREE.Color('#9BB0FF');

  let color: THREE.Color;
  if (t < 0.25) {
    const f = t / 0.25;
    color = coldColor.clone().lerp(warmColor, f);
  } else if (t < 0.5) {
    const f = (t - 0.25) / 0.25;
    color = warmColor.clone().lerp(midColor, f);
  } else if (t < 0.75) {
    const f = (t - 0.5) / 0.25;
    color = midColor.clone().lerp(hotColor, f);
  } else {
    const f = (t - 0.75) / 0.25;
    color = hotColor.clone().lerp(veryHotColor, f);
  }

  return color;
}

function createNoiseTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let i = 0; i < size * size; i++) {
    const x = (i % size) / size;
    const y = Math.floor(i / size) / size;
    const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    const value = Math.abs(noise);
    const brightness = 0.6 + value * 0.4;
    data[i * 4] = Math.floor(255 * brightness);
    data[i * 4 + 1] = Math.floor(255 * brightness);
    data[i * 4 + 2] = Math.floor(255 * brightness);
    data[i * 4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createStarSurfaceMaterial(baseColor: THREE.Color, temperature: number): THREE.ShaderMaterial {
  const noiseTexture = createNoiseTexture();
  const tempColor = temperatureToColor(temperature);

  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: baseColor },
      uTempColor: { value: tempColor },
      uNoiseTexture: { value: noiseTexture },
      uTime: { value: 0 },
      uBrightness: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uTempColor;
      uniform sampler2D uNoiseTexture;
      uniform float uTime;
      uniform float uBrightness;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec2 animatedUv = vUv + vec2(uTime * 0.02, uTime * 0.01);
        float noise1 = texture2D(uNoiseTexture, animatedUv).r;
        float noise2 = texture2D(uNoiseTexture, animatedUv * 2.0).r;
        float combinedNoise = (noise1 + noise2 * 0.5) * 0.67;
        
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.0);
        
        vec3 baseColor = mix(uBaseColor, uTempColor, combinedNoise * 0.4);
        vec3 finalColor = baseColor * (0.8 + combinedNoise * 0.4) * uBrightness;
        finalColor += fresnel * uTempColor * 0.3;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
}

function createHaloMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uTime: { value: 0 },
      uOpacity: { value: 0.2 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float intensity = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 3.0);
        float pulse = 0.1 + 0.2 * (sin(uTime * 3.14159265359) * 0.5 + 0.5);
        float finalOpacity = intensity * pulse * uOpacity;
        gl_FragColor = vec4(uColor, finalOpacity);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function createSelectionRing(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(1.3, 1.32, 64);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#00E5FF'),
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.userData.isSelectionRing = true;
  return ring;
}

export function createStarMesh(starData: StarData): RenderedStar {
  const spectralColor = new THREE.Color(SPECTRAL_COLORS[starData.spectralType]);
  const scaleFactor = Math.max(0.3, starData.radius * 0.15);

  const group = new THREE.Group() as StarMesh;
  group.userData = {
    starId: starData.id,
    originalPosition: new THREE.Vector3(
      starData.position.x,
      starData.position.y,
      starData.position.z
    ),
    originalScale: new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor),
    isSelected: false,
    spectralType: starData.spectralType,
  };
  group.position.copy(group.userData.originalPosition);
  group.scale.copy(group.userData.originalScale);

  const coreGeometry = new THREE.SphereGeometry(1, 64, 64);
  const coreMaterial = createStarSurfaceMaterial(spectralColor, starData.temperature);
  const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
  coreMesh.userData.starId = starData.id;
  coreMesh.userData.isCore = true;
  group.add(coreMesh);

  const haloGeometry = new THREE.SphereGeometry(1.5, 32, 32);
  const haloMaterial = createHaloMaterial(spectralColor);
  const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
  haloMesh.userData.starId = starData.id;
  haloMesh.userData.isHalo = true;
  group.add(haloMesh);

  return {
    starId: starData.id,
    group,
    coreMesh,
    haloMesh,
  };
}

export function updateStarShaders(
  renderedStars: RenderedStar[],
  time: number,
  cameraPosition: THREE.Vector3
): void {
  renderedStars.forEach(({ coreMesh, haloMesh }) => {
    if (coreMesh.material instanceof THREE.ShaderMaterial) {
      coreMesh.material.uniforms.uTime.value = time;
    }
    if (haloMesh.material instanceof THREE.ShaderMaterial) {
      haloMesh.material.uniforms.uTime.value = time;
    }
  });
}

export function setStarHighlight(star: RenderedStar, highlighted: boolean): void {
  const { coreMesh, haloMesh, group } = star;
  if (coreMesh.material instanceof THREE.ShaderMaterial) {
    coreMesh.material.uniforms.uBrightness.value = highlighted ? 1.3 : 1.0;
  }
  if (haloMesh.material instanceof THREE.ShaderMaterial) {
    haloMesh.material.uniforms.uOpacity.value = highlighted ? 0.35 : 0.2;
  }
  if (highlighted) {
    coreMesh.layers.enable(1);
  } else {
    coreMesh.layers.disable(1);
  }
}

export function setStarOpacity(star: RenderedStar, opacity: number): void {
  const { coreMesh, haloMesh, group } = star;

  if (opacity < 1) {
    if (coreMesh.material instanceof THREE.ShaderMaterial) {
      if (!coreMesh.material.transparent) {
        coreMesh.material.transparent = true;
      }
    }
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.Material & { opacity?: number };
        mat.transparent = true;
        if (child.userData.isHalo && haloMesh.material instanceof THREE.ShaderMaterial) {
          haloMesh.material.uniforms.uOpacity.value = 0.08;
        }
      }
    });
    coreMesh.visible = opacity > 0;
  } else {
    if (coreMesh.material instanceof THREE.ShaderMaterial) {
      coreMesh.material.transparent = false;
    }
    coreMesh.visible = true;
  }
}

export function selectStar(
  star: RenderedStar,
  allStars: RenderedStar[]
): void {
  allStars.forEach((s) => {
    if (s.selectionRing) {
      s.group.remove(s.selectionRing);
      s.selectionRing = undefined;
    }
    s.group.userData.isSelected = false;
    s.group.scale.copy(s.group.userData.originalScale);
  });

  const selectionRing = createSelectionRing();
  const ringScale = 1 / star.group.scale.x;
  selectionRing.scale.set(ringScale, ringScale, ringScale);
  star.group.add(selectionRing);
  star.selectionRing = selectionRing;
  star.group.userData.isSelected = true;

  const originalScale = star.group.userData.originalScale;
  star.group.scale.set(
    originalScale.x * 1.2,
    originalScale.y * 1.2,
    originalScale.z * 1.2
  );
}

export function deselectStar(star: RenderedStar): void {
  if (star.selectionRing) {
    star.group.remove(star.selectionRing);
    star.selectionRing = undefined;
  }
  star.group.userData.isSelected = false;
  star.group.scale.copy(star.group.userData.originalScale);
}

export function updateAtmosphericScattering(
  renderedStars: RenderedStar[],
  cameraDirection: THREE.Vector3
): void {
  renderedStars.forEach(({ group, coreMesh }) => {
    if (coreMesh.material instanceof THREE.ShaderMaterial) {
      const starDir = group.position.clone().normalize();
      const angleFactor = 1 - Math.abs(starDir.dot(cameraDirection)) * 0.3;
      coreMesh.material.uniforms.uBrightness.value = 
        (coreMesh.material.uniforms.uBrightness.value > 1.1 ? 1.3 : 1.0) * angleFactor;
    }
  });
}
