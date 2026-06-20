import * as THREE from 'three';
import { DesignParams } from '../store/useClothingStore';

export interface RenderState {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  modelGroup: THREE.Group | null;
  clothingMesh: THREE.Mesh | null;
  animationId: number | null;
  targetParams: DesignParams;
  currentParams: DesignParams;
  fabricColor: string;
}

export const renderState: RenderState = {
  scene: null,
  camera: null,
  renderer: null,
  modelGroup: null,
  clothingMesh: null,
  animationId: null,
  targetParams: {
    sleeveLength: 50,
    clothingLength: 50,
    waistFit: 50,
  },
  currentParams: {
    sleeveLength: 50,
    clothingLength: 50,
    waistFit: 50,
  },
  fabricColor: '#C0392B',
};

const SKIN_COLOR = 0xFDDCB5;
const ANIMATION_DURATION = 300;

function createLowPolyBody(): THREE.Group {
  const bodyGroup = new THREE.Group();
  
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: SKIN_COLOR,
    flatShading: true,
    roughness: 0.8,
    metalness: 0.1,
  });

  const torsoGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.5);
  const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
  torso.position.y = 1.2;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const headGeometry = new THREE.SphereGeometry(0.28, 8, 8);
  const head = new THREE.Mesh(headGeometry, skinMaterial);
  head.position.y = 2.15;
  head.castShadow = true;
  bodyGroup.add(head);

  const neckGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.15, 6);
  const neck = new THREE.Mesh(neckGeometry, skinMaterial);
  neck.position.y = 1.9;
  bodyGroup.add(neck);

  const hipGeometry = new THREE.BoxGeometry(0.7, 0.35, 0.45);
  const hip = new THREE.Mesh(hipGeometry, skinMaterial);
  hip.position.y = 0.45;
  hip.castShadow = true;
  bodyGroup.add(hip);

  const upperLegGeometry = new THREE.CylinderGeometry(0.18, 0.15, 0.7, 6);
  const leftUpperLeg = new THREE.Mesh(upperLegGeometry, skinMaterial);
  leftUpperLeg.position.set(-0.22, 0, 0);
  leftUpperLeg.castShadow = true;
  bodyGroup.add(leftUpperLeg);

  const rightUpperLeg = new THREE.Mesh(upperLegGeometry, skinMaterial);
  rightUpperLeg.position.set(0.22, 0, 0);
  rightUpperLeg.castShadow = true;
  bodyGroup.add(rightUpperLeg);

  const lowerLegGeometry = new THREE.CylinderGeometry(0.14, 0.12, 0.75, 6);
  const leftLowerLeg = new THREE.Mesh(lowerLegGeometry, skinMaterial);
  leftLowerLeg.position.set(-0.22, -0.72, 0);
  leftLowerLeg.castShadow = true;
  bodyGroup.add(leftLowerLeg);

  const rightLowerLeg = new THREE.Mesh(lowerLegGeometry, skinMaterial);
  rightLowerLeg.position.set(0.22, -0.72, 0);
  rightLowerLeg.castShadow = true;
  bodyGroup.add(rightLowerLeg);

  const footGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.35);
  const leftFoot = new THREE.Mesh(footGeometry, skinMaterial);
  leftFoot.position.set(-0.22, -1.12, 0.1);
  leftFoot.castShadow = true;
  bodyGroup.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeometry, skinMaterial);
  rightFoot.position.set(0.22, -1.12, 0.1);
  rightFoot.castShadow = true;
  bodyGroup.add(rightFoot);

  const upperArmGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.55, 6);
  const leftUpperArm = new THREE.Mesh(upperArmGeometry, skinMaterial);
  leftUpperArm.position.set(-0.58, 1.35, 0);
  leftUpperArm.rotation.z = 0.25;
  leftUpperArm.castShadow = true;
  bodyGroup.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeometry, skinMaterial);
  rightUpperArm.position.set(0.58, 1.35, 0);
  rightUpperArm.rotation.z = -0.25;
  rightUpperArm.castShadow = true;
  bodyGroup.add(rightUpperArm);

  const lowerArmGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 6);
  const leftLowerArm = new THREE.Mesh(lowerArmGeometry, skinMaterial);
  leftLowerArm.position.set(-0.72, 0.92, 0.08);
  leftLowerArm.rotation.z = 0.15;
  leftLowerArm.castShadow = true;
  bodyGroup.add(leftLowerArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeometry, skinMaterial);
  rightLowerArm.position.set(0.72, 0.92, 0.08);
  rightLowerArm.rotation.z = -0.15;
  rightLowerArm.castShadow = true;
  bodyGroup.add(rightLowerArm);

  const handGeometry = new THREE.BoxGeometry(0.12, 0.15, 0.08);
  const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
  leftHand.position.set(-0.78, 0.62, 0.1);
  leftHand.castShadow = true;
  bodyGroup.add(leftHand);

  const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
  rightHand.position.set(0.78, 0.62, 0.1);
  rightHand.castShadow = true;
  bodyGroup.add(rightHand);

  return bodyGroup;
}

function createClothingMesh(): THREE.Mesh {
  const clothingGeometry = new THREE.BoxGeometry(0.85, 1.25, 0.55);
  const positions = clothingGeometry.attributes.position;
  const originalPositions = new Float32Array(positions.array as Float32Array);
  (clothingGeometry.userData as { originalPositions: Float32Array }).originalPositions = originalPositions;

  const clothingMaterial = new THREE.MeshStandardMaterial({
    color: renderState.fabricColor,
    flatShading: true,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const clothing = new THREE.Mesh(clothingGeometry, clothingMaterial);
  clothing.position.y = 1.2;
  clothing.castShadow = true;
  clothing.receiveShadow = true;

  return clothing;
}

function updateClothingShape(mesh: THREE.Mesh, params: DesignParams): void {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const positions = geometry.attributes.position;
  const userData = geometry.userData as { originalPositions?: Float32Array };
  
  if (!userData.originalPositions) return;
  
  const original = userData.originalPositions;
  const posArray = positions.array as Float32Array;

  const sleeveFactor = params.sleeveLength / 100;
  const lengthFactor = params.clothingLength / 100;
  const waistFactor = params.waistFit / 100;

  const baseLength = 1.25;
  const baseWidth = 0.85;
  const baseDepth = 0.55;

  const lengthMultiplier = 0.6 + lengthFactor * 0.8;
  const waistTaper = 1 - waistFactor * 0.35;
  const sleeveLength = 0.1 + sleeveFactor * 1.2;

  for (let i = 0; i < positions.count; i++) {
    const ix = i * 3;
    let x = original[ix];
    let y = original[ix + 1];
    let z = original[ix + 2];

    if (y < 0) {
      y *= lengthMultiplier;
    }

    const heightRatio = (y + baseLength / 2) / baseLength;
    const waistInfluence = Math.sin(heightRatio * Math.PI);
    const widthTaper = 1 - waistTaper * waistInfluence * 0.4;
    
    x *= widthTaper;
    z *= widthTaper;

    if (Math.abs(x) > baseWidth * 0.4 && y > 0.2 && y < 0.6) {
      const armExtend = (Math.abs(x) / (baseWidth * 0.5)) * sleeveLength;
      if (x > 0) {
        x += armExtend * 0.6;
      } else {
        x -= armExtend * 0.6;
      }
      const sleeveThickness = 0.9 + sleeveFactor * 0.2;
      z *= sleeveThickness;
    }

    posArray[ix] = x;
    posArray[ix + 1] = y;
    posArray[ix + 2] = z;
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

export function initScene(container: HTMLDivElement): void {
  const width = container.clientWidth;
  const height = container.clientHeight;

  renderState.scene = new THREE.Scene();
  renderState.scene.background = new THREE.Color(0xF5E6CA);

  renderState.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  renderState.camera.position.set(0, 0.8, 4.5);
  renderState.camera.lookAt(0, 0.6, 0);

  renderState.renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderState.renderer.setSize(width, height);
  renderState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderState.renderer.shadowMap.enabled = true;
  renderState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderState.renderer.toneMappingExposure = 1.1;

  container.appendChild(renderState.renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xFFF5E6, 0.6);
  renderState.scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xFFFAF0, 0.9);
  mainLight.position.set(3, 5, 3);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 20;
  mainLight.shadow.camera.left = -3;
  mainLight.shadow.camera.right = 3;
  mainLight.shadow.camera.top = 3;
  mainLight.shadow.camera.bottom = -3;
  renderState.scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xFFE4C4, 0.4);
  fillLight.position.set(-3, 2, -2);
  renderState.scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xFFDAB9, 0.3);
  rimLight.position.set(0, 2, -4);
  renderState.scene.add(rimLight);

  renderState.modelGroup = new THREE.Group();
  renderState.modelGroup.position.y = 0.1;

  const body = createLowPolyBody();
  renderState.modelGroup.add(body);

  renderState.clothingMesh = createClothingMesh();
  renderState.modelGroup.add(renderState.clothingMesh);

  renderState.scene.add(renderState.modelGroup);

  const groundGeometry = new THREE.CircleGeometry(3, 32);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xE8D4A5,
    roughness: 0.9,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.2;
  ground.receiveShadow = true;
  renderState.scene.add(ground);

  let autoRotate = true;
  let userInteracting = false;
  let rotationY = 0;
  let lastMouseX = 0;

  const canvas = renderState.renderer.domElement;

  canvas.addEventListener('mousedown', (e) => {
    userInteracting = true;
    autoRotate = false;
    lastMouseX = e.clientX;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!userInteracting || !renderState.modelGroup) return;
    const deltaX = e.clientX - lastMouseX;
    rotationY += deltaX * 0.01;
    lastMouseX = e.clientX;
  });

  canvas.addEventListener('mouseup', () => {
    userInteracting = false;
  });

  canvas.addEventListener('mouseleave', () => {
    userInteracting = false;
  });

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      userInteracting = true;
      autoRotate = false;
      lastMouseX = e.touches[0].clientX;
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!userInteracting || !renderState.modelGroup || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - lastMouseX;
    rotationY += deltaX * 0.01;
    lastMouseX = e.touches[0].clientX;
    e.preventDefault();
  });

  canvas.addEventListener('touchend', () => {
    userInteracting = false;
  });

  let lastTime = performance.now();

  const animate = () => {
    renderState.animationId = requestAnimationFrame(animate);
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (renderState.modelGroup) {
      if (autoRotate && !userInteracting) {
        rotationY += 0.003;
      }
      renderState.modelGroup.rotation.y += (rotationY - renderState.modelGroup.rotation.y) * 0.1;
    }

    const lerpFactor = Math.min(deltaTime / ANIMATION_DURATION, 1);
    
    renderState.currentParams.sleeveLength += 
      (renderState.targetParams.sleeveLength - renderState.currentParams.sleeveLength) * lerpFactor;
    renderState.currentParams.clothingLength += 
      (renderState.targetParams.clothingLength - renderState.currentParams.clothingLength) * lerpFactor;
    renderState.currentParams.waistFit += 
      (renderState.targetParams.waistFit - renderState.currentParams.waistFit) * lerpFactor;

    if (renderState.clothingMesh) {
      updateClothingShape(renderState.clothingMesh, renderState.currentParams);
    }

    if (renderState.renderer && renderState.scene && renderState.camera) {
      renderState.renderer.render(renderState.scene, renderState.camera);
    }
  };

  animate();

  const handleResize = () => {
    if (!container || !renderState.camera || !renderState.renderer) return;
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    renderState.camera.aspect = newWidth / newHeight;
    renderState.camera.updateProjectionMatrix();
    renderState.renderer.setSize(newWidth, newHeight);
  };

  window.addEventListener('resize', handleResize);
}

export function updateDesignParams(params: Partial<DesignParams>): void {
  renderState.targetParams = {
    ...renderState.targetParams,
    ...params,
  };
}

export function updateFabricColor(color: string): void {
  renderState.fabricColor = color;
  if (renderState.clothingMesh) {
    const material = renderState.clothingMesh.material as THREE.MeshStandardMaterial;
    material.color.set(color);
  }
}

export function applyFabricTexture(imageUrl: string): void {
  if (!renderState.clothingMesh) return;

  const loader = new THREE.TextureLoader();
  loader.load(
    imageUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      const material = renderState.clothingMesh!.material as THREE.MeshStandardMaterial;
      material.map = texture;
      material.color.set(0xFFFFFF);
      material.needsUpdate = true;
    },
    undefined,
    (error) => {
      console.warn('Failed to load texture:', error);
    }
  );
}

export function cleanupScene(): void {
  if (renderState.animationId) {
    cancelAnimationFrame(renderState.animationId);
    renderState.animationId = null;
  }

  if (renderState.renderer) {
    renderState.renderer.dispose();
    if (renderState.renderer.domElement.parentNode) {
      renderState.renderer.domElement.parentNode.removeChild(renderState.renderer.domElement);
    }
  }

  if (renderState.clothingMesh) {
    renderState.clothingMesh.geometry.dispose();
    const material = renderState.clothingMesh.material as THREE.MeshStandardMaterial;
    if (material.map) material.map.dispose();
    material.dispose();
  }

  renderState.scene = null;
  renderState.camera = null;
  renderState.renderer = null;
  renderState.modelGroup = null;
  renderState.clothingMesh = null;
}
