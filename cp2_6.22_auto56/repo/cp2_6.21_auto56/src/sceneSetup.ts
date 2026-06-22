import * as THREE from 'three';

export const STAR_POSITION = new THREE.Vector3(0, 0, 0);
export const STAR_MASS = 1000;
export const STAR_RADIUS = 2;
export const MAX_ORBIT_POINTS = 300;
export const FADE_DURATION = 1000;

export function setupScene(container: HTMLElement): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  star: THREE.Mesh;
  starLight: THREE.PointLight;
  gridHelper: THREE.GridHelper;
} {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(25, 18, 25);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x334466, 0.4);
  scene.add(ambientLight);

  const starGeometry = new THREE.SphereGeometry(STAR_RADIUS, 48, 48);
  const starMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd44,
  });
  const star = new THREE.Mesh(starGeometry, starMaterial);
  star.position.copy(STAR_POSITION);
  scene.add(star);

  const glowGeometry = new THREE.SphereGeometry(STAR_RADIUS * 1.6, 48, 48);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    transparent: true,
    opacity: 0.25,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  star.add(glow);

  const starLight = new THREE.PointLight(0xffdd66, 2.5, 100, 2);
  starLight.position.copy(STAR_POSITION);
  scene.add(starLight);

  const gridHelper = new THREE.GridHelper(60, 30, 0x224466, 0x112233);
  gridHelper.position.y = -8;
  scene.add(gridHelper);

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  return { scene, camera, renderer, star, starLight, gridHelper };
}

interface OrbitLineData {
  id: string;
  points: THREE.Vector3[];
  color: string;
}

export function updateOrbitLines(
  scene: THREE.Scene,
  orbitLines: Map<string, THREE.Line>,
  asteroidData: OrbitLineData[]
): void {
  for (const data of asteroidData) {
    let line = orbitLines.get(data.id);

    if (!line) {
      const geometry = new THREE.BufferGeometry();
      const color = new THREE.Color(data.color);
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
      });
      line = new THREE.Line(geometry, material);
      scene.add(line);
      orbitLines.set(data.id, line);
    }

    const positions = new Float32Array(data.points.length * 3);
    for (let i = 0; i < data.points.length; i++) {
      positions[i * 3] = data.points[i].x;
      positions[i * 3 + 1] = data.points[i].y;
      positions[i * 3 + 2] = data.points[i].z;
    }
    line.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    line.geometry.computeBoundingSphere();
  }
}

export function removeOrbitLine(
  scene: THREE.Scene,
  orbitLines: Map<string, THREE.Line>,
  id: string
): void {
  const line = orbitLines.get(id);
  if (line) {
    scene.remove(line);
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
    orbitLines.delete(id);
  }
}

export function lerpColor(
  color1: string,
  color2: string,
  t: number
): THREE.Color {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, Math.max(0, Math.min(1, t)));
}

export function adjustCameraForOrbit(
  camera: THREE.PerspectiveCamera,
  targetPosition: THREE.Vector3
): void {
  const tiltAngle = (30 * Math.PI) / 180;

  const direction = targetPosition.clone().normalize();
  const distance = 35;

  const cameraTarget = new THREE.Vector3(0, 0, 0);

  const horizontalDir = new THREE.Vector3(direction.x, 0, direction.z)
    .normalize()
    .multiplyScalar(distance * Math.cos(tiltAngle));
  const verticalOffset = distance * Math.sin(tiltAngle);

  const startPos = camera.position.clone();
  const endPos = new THREE.Vector3(
    horizontalDir.x,
    verticalOffset,
    horizontalDir.z
  );

  let progress = 0;
  const animate = () => {
    progress = Math.min(progress + 0.02, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    camera.position.lerpVectors(startPos, endPos, eased);
    camera.lookAt(cameraTarget);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  animate();
}
