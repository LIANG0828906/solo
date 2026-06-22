import * as THREE from 'three';

export interface CityConfig {
  density: number;
  heightVariance: number;
  lightStyle: 'day' | 'night' | 'dusk';
}

export interface BuildingData {
  mesh: THREE.Mesh;
  antenna: THREE.Mesh | null;
  baseHeight: number;
  targetScale: THREE.Vector3;
  basePosition: THREE.Vector3;
  highlightMesh: THREE.LineSegments | null;
}

export interface GeneratedCity {
  group: THREE.Group;
  buildings: BuildingData[];
  isAnimating: boolean;
  animationStartTime: number;
}

const BUILDING_SPREAD = 80;
const ANIMATION_DURATION = 1000;

function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(color1, color2, t);
}

function warmToCoolGradient(t: number): THREE.Color {
  const warm = new THREE.Color('#C4A882');
  const cool = new THREE.Color('#4A6B8A');
  return lerpColor(warm, cool, t);
}

function randomAntennaColor(): THREE.Color {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];
  return new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
}

function createHighlightBorder(width: number, height: number, depth: number): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(
    width * 1.02, height * 1.02, depth * 1.02
  ));
  const material = new THREE.LineBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0,
    linewidth: 2
  });
  return new THREE.LineSegments(edges, material);
}

export function generateCity(config: CityConfig): GeneratedCity {
  const startTime = performance.now();

  const group = new THREE.Group();
  const buildings: BuildingData[] = [];

  const count = Math.floor(config.density);

  for (let i = 0; i < count; i++) {
    const baseSize = 10 + Math.random() * 10;
    const depth = 10 + Math.random() * 10;
    const meanHeight = 65;
    const variance = config.heightVariance;
    let height = meanHeight + (Math.random() - 0.5) * 110 * variance;
    height = Math.max(10, Math.min(120, height));

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * (BUILDING_SPREAD / 2);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const distFromCenter = Math.sqrt(x * x + z * z) / (BUILDING_SPREAD / 2);
    const color = warmToCoolGradient(distFromCenter);

    const geometry = new THREE.BoxGeometry(baseSize, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    const baseY = height / 2;
    mesh.position.set(x, baseY, z);

    mesh.userData = { type: 'building', index: i };

    group.add(mesh);

    let antenna: THREE.Mesh | null = null;
    if (Math.random() > 0.3) {
      const antSize = 2 + Math.random() * 2;
      const antHeight = antSize;
      const antGeometry = new THREE.BoxGeometry(antSize, antHeight, antSize);
      const antMaterial = new THREE.MeshStandardMaterial({
        color: randomAntennaColor(),
        emissive: randomAntennaColor(),
        emissiveIntensity: 0.3,
        roughness: 0.5,
        metalness: 0.4
      });
      antenna = new THREE.Mesh(antGeometry, antMaterial);
      antenna.position.set(x, baseY + height / 2 + antHeight / 2, z);
      antenna.userData = { type: 'antenna', buildingIndex: i };
      group.add(antenna);
    }

    const highlightMesh = createHighlightBorder(baseSize, height, depth);
    highlightMesh.position.set(x, baseY, z);
    group.add(highlightMesh);

    buildings.push({
      mesh,
      antenna,
      baseHeight: height,
      targetScale: new THREE.Vector3(1, 1, 1),
      basePosition: new THREE.Vector3(x, baseY, z),
      highlightMesh
    });
  }

  const elapsed = performance.now() - startTime;
  console.log(`City generated in ${elapsed.toFixed(1)}ms with ${count} buildings`);

  return {
    group,
    buildings,
    isAnimating: true,
    animationStartTime: performance.now()
  };
}

export function updateCityAnimation(city: GeneratedCity, currentTime: number): boolean {
  if (!city.isAnimating) return false;

  const elapsed = currentTime - city.animationStartTime;
  if (elapsed >= ANIMATION_DURATION) {
    city.isAnimating = false;
    for (const b of city.buildings) {
      b.mesh.scale.set(1, 1, 1);
      b.mesh.position.y = b.basePosition.y;
      if (b.antenna) {
        b.antenna.scale.set(1, 1, 1);
        b.antenna.visible = true;
      }
    }
    return false;
  }

  const t = elapsed / ANIMATION_DURATION;
  const easeOutCubic = 1 - Math.pow(1 - t, 3);

  for (let i = 0; i < city.buildings.length; i++) {
    const b = city.buildings[i];
    const staggeredT = Math.max(0, Math.min(1, (t - i * 0.002) / 0.8));
    const eased = easeOutCubic;
    const localEased = 1 - Math.pow(1 - Math.min(1, staggeredT * 1.2), 3);

    b.mesh.scale.set(1, localEased, 1);
    b.mesh.position.y = b.basePosition.y * localEased;

    if (b.antenna) {
      const antT = Math.max(0, Math.min(1, (staggeredT - 0.5) * 2));
      const antEased = 1 - Math.pow(1 - antT, 3);
      b.antenna.scale.set(1, antEased, 1);
      b.antenna.visible = antEased > 0.01;
      if (b.antenna.visible) {
        const baseAntY = b.basePosition.y + b.baseHeight / 2 + 1;
        b.antenna.position.y = baseAntY * localEased + (1 + Math.random() * 1) * antEased;
      }
    }
  }

  return true;
}

export function setupLightingStyle(
  scene: THREE.Scene,
  style: 'day' | 'night' | 'dusk'
): void {
  while (scene.children.length > 0) {
    const child = scene.children[0];
    if (
      child instanceof THREE.DirectionalLight ||
      child instanceof THREE.AmbientLight ||
      child instanceof THREE.PointLight ||
      child instanceof THREE.HemisphereLight
    ) {
      scene.remove(child);
    } else {
      break;
    }
  }

  const lights: THREE.Light[] = [];

  if (style === 'day') {
    const ambient = new THREE.AmbientLight(0xfff5e6, 0.5);
    lights.push(ambient);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.4);
    lights.push(hemi);

    const directional = new THREE.DirectionalLight(0xfffacd, 1.2);
    directional.position.set(50, 80, 50);
    directional.castShadow = false;
    lights.push(directional);
  } else if (style === 'night') {
    const ambient = new THREE.AmbientLight(0x1a1a3a, 0.3);
    lights.push(ambient);

    const moon = new THREE.DirectionalLight(0x6b8eae, 0.4);
    moon.position.set(-30, 60, -30);
    lights.push(moon);

    const neon1 = new THREE.PointLight(0xff00ff, 1.5, 150, 2);
    neon1.position.set(0, 40, 0);
    lights.push(neon1);

    const neon2 = new THREE.PointLight(0x00ffff, 1.2, 120, 2);
    neon2.position.set(30, 30, -20);
    lights.push(neon2);

    const neon3 = new THREE.PointLight(0xff6b6b, 1.0, 100, 2);
    neon3.position.set(-25, 25, 25);
    lights.push(neon3);
  } else {
    const ambient = new THREE.AmbientLight(0x4a2c5a, 0.4);
    lights.push(ambient);

    const sun = new THREE.DirectionalLight(0xff7b4a, 1.0);
    sun.position.set(-60, 20, 40);
    lights.push(sun);

    const rim = new THREE.DirectionalLight(0x6a4a8a, 0.6);
    rim.position.set(50, 40, -50);
    lights.push(rim);

    const fill = new THREE.HemisphereLight(0xff8866, 0x2a1a4a, 0.3);
    lights.push(fill);
  }

  for (const light of lights) {
    scene.add(light);
  }
}

export function updateHighlight(
  building: BuildingData,
  currentTime: number,
  highlightStartTime: number | null
): void {
  if (!building.highlightMesh) return;

  const material = building.highlightMesh.material as THREE.LineBasicMaterial;

  if (highlightStartTime === null) {
    material.opacity = Math.max(0, material.opacity - 0.05);
    return;
  }

  const highlightDuration = 2000;
  const elapsed = currentTime - highlightStartTime;

  if (elapsed >= highlightDuration) {
    material.opacity = 0;
    return;
  }

  const t = elapsed / highlightDuration;
  let opacity: number;

  if (t < 0.1) {
    opacity = (t / 0.1);
  } else if (t > 0.7) {
    opacity = Math.max(0, 1 - (t - 0.7) / 0.3);
  } else {
    opacity = 1;
  }

  opacity *= 0.9;
  material.opacity = opacity;
}

export function createGround(): THREE.Mesh {
  const size = 100;
  const divisions = 20;

  const geometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
  const material = new THREE.MeshBasicMaterial({
    color: 0x0a0a1a,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    wireframe: false
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = false;

  return ground;
}

export function createGrid(): THREE.GridHelper {
  const grid = new THREE.GridHelper(100, 20, 0x2A2A4A, 0x2A2A4A);
  const gridMaterial = grid.material as THREE.Material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.3;
  grid.position.y = 0.01;
  return grid;
}

export function createSkybox(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(500, 32, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTopColor: { value: new THREE.Color('#2D1B4E') },
      uBottomColor: { value: new THREE.Color('#0B0B1A') }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uTime;
      varying vec3 vWorldPosition;

      void main() {
        float h = normalize(vWorldPosition).y;
        float t = max(0.0, h + 0.3) * 1.2;

        float swirl = sin(vWorldPosition.x * 0.01 + uTime * 0.2) * 0.02
                    + cos(vWorldPosition.z * 0.01 + uTime * 0.15) * 0.02;
        t = clamp(t + swirl, 0.0, 1.0);

        vec3 color = mix(uBottomColor, uTopColor, t);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.BackSide
  });

  const skybox = new THREE.Mesh(geometry, material);
  return skybox;
}
