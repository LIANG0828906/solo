import * as THREE from 'three';
import { scene, camera, renderer } from './scene';

export interface PortData {
  portIndex: number;
  portName: string;
  tideHeight: number;
  color: string;
  baseColor: string;
}

export interface PortHoverEvent {
  portIndex: number;
  portName: string;
  tideHeight: number;
  color: string;
  screenPosition: { x: number; y: number };
}

type HoverCallback = (event: PortHoverEvent | null) => void;

export let portMeshes: THREE.Mesh[] = [];
export let portGlowMeshes: THREE.Mesh[] = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPortIndex: number | null = null;
let hoverCallback: HoverCallback | null = null;

const PORT_COLORS = [
  '#00BCD4',
  '#FF9800',
  '#4CAF50',
  '#E91E63',
  '#FFEB3B',
  '#9C27B0',
];

const PORT_NAMES = [
  '青岛港',
  '上海港',
  '深圳港',
  '宁波港',
  '广州港',
  '天津港',
];

export function createPorts(): void {
  const radius = 35;
  const numPorts = 6;

  for (let i = 0; i < numPorts; i++) {
    const angle = (i / numPorts) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const ringGeometry = new THREE.TorusGeometry(2, 0.3, 16, 64);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(PORT_COLORS[i]),
      emissive: new THREE.Color(PORT_COLORS[i]),
      emissiveIntensity: 0.4,
      shininess: 100,
      transparent: true,
      opacity: 0.95,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(x, 0, z);
    ring.rotation.x = Math.PI / 2;
    ring.userData = {
      portIndex: i,
      portName: PORT_NAMES[i],
      baseColor: PORT_COLORS[i],
      tideHeight: 0,
      isHovered: false,
      originalScale: 1,
    };

    const glowGeometry = new THREE.RingGeometry(2.5, 3.5, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(x, -0.1, z);
    glow.rotation.x = -Math.PI / 2;
    glow.userData = { portIndex: i };

    const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.4, 8, 16);
    const pillarMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(PORT_COLORS[i]),
      emissive: new THREE.Color(PORT_COLORS[i]),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.6,
    });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(x, -4, z);
    scene.add(pillar);

    scene.add(ring);
    scene.add(glow);
    portMeshes.push(ring);
    portGlowMeshes.push(glow);
  }

  setupInteraction();
}

function setupInteraction(): void {
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseleave', onMouseLeave);
}

function onMouseMove(event: MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(portMeshes);

  if (intersects.length > 0) {
    const intersectedMesh = intersects[0].object as THREE.Mesh;
    const portIndex = intersectedMesh.userData.portIndex;

    if (hoveredPortIndex !== portIndex) {
      if (hoveredPortIndex !== null) {
        setPortHoverState(hoveredPortIndex, false);
      }
      hoveredPortIndex = portIndex;
      setPortHoverState(portIndex, true);

      const worldPos = new THREE.Vector3();
      intersectedMesh.getWorldPosition(worldPos);
      const screenPos = worldPos.clone().project(camera);

      const screenX = (screenPos.x + 1) / 2 * window.innerWidth;
      const screenY = (-screenPos.y + 1) / 2 * window.innerHeight;

      if (hoverCallback) {
        hoverCallback({
          portIndex,
          portName: intersectedMesh.userData.portName,
          tideHeight: intersectedMesh.userData.tideHeight,
          color: intersectedMesh.userData.baseColor,
          screenPosition: { x: screenX, y: screenY },
        });
      }
    }
  } else if (hoveredPortIndex !== null) {
    setPortHoverState(hoveredPortIndex, false);
    hoveredPortIndex = null;
    if (hoverCallback) {
      hoverCallback(null);
    }
  }
}

function onMouseLeave(): void {
  if (hoveredPortIndex !== null) {
    setPortHoverState(hoveredPortIndex, false);
    hoveredPortIndex = null;
    if (hoverCallback) {
      hoverCallback(null);
    }
  }
}

function setPortHoverState(portIndex: number, isHovered: boolean): void {
  const portMesh = portMeshes[portIndex];
  const glowMesh = portGlowMeshes[portIndex];

  if (!portMesh || !glowMesh) return;

  portMesh.userData.isHovered = isHovered;

  const targetScale = isHovered ? 1.5 : 1;
  const targetGlowOpacity = isHovered ? 0.6 : 0;

  animatePortScale(portMesh, targetScale);
  animateGlowOpacity(glowMesh, targetGlowOpacity);

  const material = portMesh.material as THREE.MeshPhongMaterial;
  if (isHovered) {
    material.emissiveIntensity = 0.8;
  } else {
    material.emissiveIntensity = 0.4;
  }
}

function animatePortScale(mesh: THREE.Mesh, targetScale: number): void {
  const startScale = mesh.scale.x;
  const duration = 150;
  const startTime = performance.now();

  function animate(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const scale = startScale + (targetScale - startScale) * eased;

    mesh.scale.setScalar(scale);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function animateGlowOpacity(mesh: THREE.Mesh, targetOpacity: number): void {
  const material = mesh.material as THREE.MeshBasicMaterial;
  const startOpacity = material.opacity;
  const duration = 150;
  const startTime = performance.now();

  function animate(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    material.opacity = startOpacity + (targetOpacity - startOpacity) * eased;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

export function updatePort(data: PortData): void {
  const portMesh = portMeshes[data.portIndex];
  if (!portMesh) return;

  portMesh.userData.tideHeight = data.tideHeight;

  const targetY = data.tideHeight;
  const currentY = portMesh.position.y;
  const newY = currentY + (targetY - currentY) * 0.1;
  portMesh.position.y = newY;

  const glowMesh = portGlowMeshes[data.portIndex];
  if (glowMesh) {
    glowMesh.position.y = newY - 0.1;
  }

  const material = portMesh.material as THREE.MeshPhongMaterial;
  const targetColor = new THREE.Color(data.color);
  material.color.lerp(targetColor, 0.1);
  material.emissive.lerp(targetColor, 0.1);
}

export function onPortHover(callback: HoverCallback): void {
  hoverCallback = callback;
}

export function getPortName(index: number): string {
  return PORT_NAMES[index] || `港口${index + 1}`;
}

export function resetPorts(): void {
  for (let i = 0; i < portMeshes.length; i++) {
    const portMesh = portMeshes[i];
    const glowMesh = portGlowMeshes[i];

    if (portMesh) {
      portMesh.position.y = 0;
      portMesh.userData.tideHeight = 0;
      const material = portMesh.material as THREE.MeshPhongMaterial;
      material.color.set(PORT_COLORS[i]);
      material.emissive.set(PORT_COLORS[i]);
      material.emissiveIntensity = 0.4;
      portMesh.scale.setScalar(1);
      portMesh.userData.isHovered = false;
    }

    if (glowMesh) {
      const glowMaterial = glowMesh.material as THREE.MeshBasicMaterial;
      glowMaterial.opacity = 0;
    }
  }
  hoveredPortIndex = null;
}
