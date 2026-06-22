import * as THREE from 'three';

export let scene: THREE.Scene;
export let camera: THREE.PerspectiveCamera;
export let renderer: THREE.WebGLRenderer;

export function initScene(container: HTMLElement): void {
  scene = new THREE.Scene();
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, window.innerHeight);
    gradient.addColorStop(0, '#0B192C');
    gradient.addColorStop(1, '#1A3A5C');
    canvas.width = 2;
    canvas.height = window.innerHeight;
    context.fillStyle = gradient;
    context.fillRect(0, 0, 2, window.innerHeight);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    scene.background = texture;
  }
  
  scene.fog = new THREE.FogExp2(0x0B192C, 0.008);
  
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(0, 85, 0);
  camera.lookAt(0, 0, 0);
  
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  container.appendChild(renderer.domElement);
  
  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  const pointLight1 = new THREE.PointLight(0x00BCD4, 1.5, 200);
  pointLight1.position.set(-30, 20, 30);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0xFF9800, 1.0, 150);
  pointLight2.position.set(30, 15, -30);
  scene.add(pointLight2);
  
  const seaGeometry = new THREE.CircleGeometry(50, 64);
  const seaMaterial = new THREE.MeshPhongMaterial({
    color: 0x1A3A5C,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    shininess: 100,
  });
  const sea = new THREE.Mesh(seaGeometry, seaMaterial);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.5;
  scene.add(sea);
  
  const gridHelper = new THREE.GridHelper(100, 50, 0x00E5FF, 0x0B192C);
  gridHelper.position.y = -0.49;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.15;
  scene.add(gridHelper);
  
  const seaBorderGeometry = new THREE.RingGeometry(49.5, 50.5, 64);
  const seaBorderMaterial = new THREE.MeshBasicMaterial({
    color: 0x00E5FF,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const seaBorder = new THREE.Mesh(seaBorderGeometry, seaBorderMaterial);
  seaBorder.rotation.x = -Math.PI / 2;
  seaBorder.position.y = -0.48;
  scene.add(seaBorder);
  
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  if (scene.background instanceof THREE.CanvasTexture) {
    const canvas = scene.background.image as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    if (context) {
      canvas.height = window.innerHeight;
      const gradient = context.createLinearGradient(0, 0, 0, window.innerHeight);
      gradient.addColorStop(0, '#0B192C');
      gradient.addColorStop(1, '#1A3A5C');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, window.innerHeight);
      scene.background.needsUpdate = true;
    }
  }
}
