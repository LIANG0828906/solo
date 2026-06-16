import * as THREE from 'three';
import { SpinState } from './particleSystem';

interface UIControllerParams {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  particles: THREE.Mesh[];
  onSpinChange: (particleIndex: number, spinState: SpinState) => void;
  onEntanglementChange: (delta: number) => void;
}

interface UIControllerResult {
  update: () => void;
  dispose: () => void;
}

export function createUIController(params: UIControllerParams): UIControllerResult {
  const { camera, renderer, particles, onSpinChange, onEntanglementChange } = params;
  
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  const controlPanel = document.getElementById('control-panel') as HTMLDivElement;
  const spinButtons = controlPanel.querySelectorAll('.spin-btn');
  
  let selectedParticleIndex: number | null = null;
  let isDragging = false;
  let mouseDownTime = 0;
  let mouseDownPos = { x: 0, y: 0 };
  
  function getParticleScreenPosition(index: number): { x: number; y: number } | null {
    const particle = particles[index];
    if (!particle) return null;
    
    const vector = particle.position.clone();
    vector.project(camera);
    
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;
    
    return { x, y };
  }
  
  function showControlPanel(particleIndex: number): void {
    selectedParticleIndex = particleIndex;
    
    const pos = getParticleScreenPosition(particleIndex);
    if (!pos) return;
    
    const panelWidth = controlPanel.offsetWidth || 200;
    const panelHeight = controlPanel.offsetHeight || 80;
    
    let left = pos.x - panelWidth / 2;
    let top = pos.y - panelHeight - 30;
    
    if (left < 10) left = 10;
    if (left + panelWidth > window.innerWidth - 10) {
      left = window.innerWidth - panelWidth - 10;
    }
    if (top < 10) top = pos.y + 30;
    
    controlPanel.style.left = `${left}px`;
    controlPanel.style.top = `${top}px`;
    controlPanel.classList.add('visible');
    
    highlightParticle(particleIndex, true);
  }
  
  function hideControlPanel(): void {
    controlPanel.classList.remove('visible');
    
    if (selectedParticleIndex !== null) {
      highlightParticle(selectedParticleIndex, false);
    }
    
    selectedParticleIndex = null;
  }
  
  function highlightParticle(index: number, highlight: boolean): void {
    const particle = particles[index];
    if (!particle) return;
    
    const material = particle.material as THREE.MeshStandardMaterial;
    if (highlight) {
      material.emissiveIntensity = 1.0;
      particle.scale.setScalar(1.05);
    } else {
      if (material.emissive.getHex() !== 0xff6b6b && material.emissive.getHex() !== 0x4ecdc4) {
        material.emissiveIntensity = 0.4;
      } else {
        material.emissiveIntensity = 0.6;
      }
      particle.scale.setScalar(1);
    }
  }
  
  function handleClick(event: MouseEvent): void {
    if (isDragging) return;
    
    const moveDistance = Math.sqrt(
      Math.pow(event.clientX - mouseDownPos.x, 2) +
      Math.pow(event.clientY - mouseDownPos.y, 2)
    );
    if (moveDistance > 5) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(particles, false);
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object as THREE.Mesh;
      const particleIndex = clickedObject.userData.particleIndex;
      
      if (typeof particleIndex === 'number') {
        showControlPanel(particleIndex);
      }
    } else {
      hideControlPanel();
    }
  }
  
  function handleMouseDown(event: MouseEvent): void {
    isDragging = false;
    mouseDownTime = performance.now();
    mouseDownPos = { x: event.clientX, y: event.clientY };
  }
  
  function handleMouseMove(): void {
    const timeDiff = performance.now() - mouseDownTime;
    if (timeDiff > 200) {
      isDragging = true;
    }
  }
  
  function handleSpinButtonClick(event: Event): void {
    const button = event.currentTarget as HTMLButtonElement;
    const spinState = button.dataset.spin as SpinState;
    
    if (selectedParticleIndex !== null && spinState) {
      handleSpinChange(selectedParticleIndex, spinState);
    }
  }
  
  function handleSpinChange(particleIndex: number, newState: SpinState): void {
    const otherIndex = particleIndex === 0 ? 1 : 0;
    
    onSpinChange(particleIndex, newState);
    
    setTimeout(() => {
      let entangledState: SpinState;
      let isConsistent = false;
      
      if (newState === 'superposition') {
        entangledState = 'superposition';
        isConsistent = true;
      } else if (newState === 'up') {
        entangledState = 'down';
        isConsistent = true;
      } else {
        entangledState = 'up';
        isConsistent = true;
      }
      
      onSpinChange(otherIndex, entangledState);
      
      if (isConsistent) {
        const increase = 5 + Math.random() * 5;
        onEntanglementChange(increase);
      } else {
        const decrease = -(8 + Math.random() * 7);
        onEntanglementChange(decrease);
      }
    }, 50);
    
    hideControlPanel();
  }
  
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      hideControlPanel();
    }
  }
  
  function handleResize(): void {
    if (selectedParticleIndex !== null) {
      showControlPanel(selectedParticleIndex);
    }
  }
  
  spinButtons.forEach((button) => {
    button.addEventListener('click', handleSpinButtonClick);
  });
  
  renderer.domElement.addEventListener('mousedown', handleMouseDown);
  renderer.domElement.addEventListener('mousemove', handleMouseMove);
  renderer.domElement.addEventListener('click', handleClick);
  
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleResize);
  
  function update(): void {
    if (selectedParticleIndex !== null) {
      const pos = getParticleScreenPosition(selectedParticleIndex);
      if (pos) {
        const panelWidth = controlPanel.offsetWidth;
        let left = pos.x - panelWidth / 2;
        
        if (left < 10) left = 10;
        if (left + panelWidth > window.innerWidth - 10) {
          left = window.innerWidth - panelWidth - 10;
        }
        
        controlPanel.style.left = `${left}px`;
      }
    }
  }
  
  function dispose(): void {
    spinButtons.forEach((button) => {
      button.removeEventListener('click', handleSpinButtonClick);
    });
    
    renderer.domElement.removeEventListener('mousedown', handleMouseDown);
    renderer.domElement.removeEventListener('mousemove', handleMouseMove);
    renderer.domElement.removeEventListener('click', handleClick);
    
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleResize);
  }
  
  return {
    update,
    dispose
  };
}
