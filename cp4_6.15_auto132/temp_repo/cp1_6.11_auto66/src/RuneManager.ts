import * as THREE from 'three';
import { RuneData, RuneState, ElementType, ArraySlot, ELEMENT_COLORS } from './types';
import { ArrayBuilder } from './ArrayBuilder';

export class RuneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private arrayBuilder: ArrayBuilder;
  private runes: RuneData[] = [];
  private runeMeshes: Map<string, RuneData> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedRune: RuneData | null = null;
  private isDragging: boolean = false;
  private audioContext: AudioContext | null = null;
  private dragOffset: THREE.Vector3 = new THREE.Vector3();
  private groundPlane: THREE.Plane;
  private pulseWaves: THREE.Mesh[] = [];
  private onArrayActivated: (() => void) | null = null;
  private onProgressUpdate: ((placed: number, total: number) => void) | null = null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    arrayBuilder: ArrayBuilder
  ) {
    this.scene = scene;
    this.camera = camera;
    this.arrayBuilder = arrayBuilder;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.initAudio();
    this.createStarfield();
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private createStarfield(): void {
    const geometry = new THREE.BufferGeometry();
    const count = 500;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const radius = 15 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.6
    });
    
    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);
  }

  public createRune(element: ElementType, position: THREE.Vector3): RuneData {
    const id = `rune-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mesh = this.createRuneMesh(element);
    mesh.position.copy(position);
    mesh.userData.id = id;
    
    const rune: RuneData = {
      id,
      element,
      state: 'idle',
      position: position.clone(),
      targetPosition: null,
      mesh,
      flyProgress: 0,
      trailParticles: null
    };
    
    this.runes.push(rune);
    this.runeMeshes.set(id, rune);
    this.scene.add(mesh);
    
    return rune;
  }

  private createRuneMesh(element: ElementType): THREE.Group {
    const group = new THREE.Group();
    const color = ELEMENT_COLORS[element];
    
    let shape: THREE.Shape;
    
    switch (element) {
      case 'fire':
        shape = this.createDiamondShape();
        break;
      case 'water':
        shape = this.createDropShape();
        break;
      case 'wind':
        shape = this.createTriangleShape();
        break;
      case 'earth':
        shape = this.createSquareShape();
        break;
      case 'light':
        shape = this.createOctagonShape();
        break;
      case 'dark':
        shape = this.createCrescentShape();
        break;
      default:
        shape = this.createDiamondShape();
    }
    
    const extrudeSettings = {
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.3
    });
    
    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.rotation.x = -Math.PI / 2;
    mainMesh.castShadow = true;
    group.add(mainMesh);
    
    const glowGeometry = geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.rotation.x = -Math.PI / 2;
    glowMesh.scale.setScalar(1.2);
    group.add(glowMesh);
    
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.rotation.x = -Math.PI / 2;
    group.add(edges);
    
    group.userData = { element, mainMesh, glowMesh, edges, baseEmissive: 0.3 };
    
    return group;
  }

  private createDiamondShape(): THREE.Shape {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.4);
    shape.lineTo(0.3, 0);
    shape.lineTo(0, -0.4);
    shape.lineTo(-0.3, 0);
    shape.lineTo(0, 0.4);
    return shape;
  }

  private createDropShape(): THREE.Shape {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.4);
    shape.bezierCurveTo(0.35, 0.1, 0.35, -0.3, 0, -0.4);
    shape.bezierCurveTo(-0.35, -0.3, -0.35, 0.1, 0, 0.4);
    return shape;
  }

  private createTriangleShape(): THREE.Shape {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.4);
    shape.lineTo(0.35, -0.3);
    shape.lineTo(-0.35, -0.3);
    shape.lineTo(0, 0.4);
    return shape;
  }

  private createSquareShape(): THREE.Shape {
    const shape = new THREE.Shape();
    shape.moveTo(-0.3, 0.3);
    shape.lineTo(0.3, 0.3);
    shape.lineTo(0.3, -0.3);
    shape.lineTo(-0.3, -0.3);
    shape.lineTo(-0.3, 0.3);
    return shape;
  }

  private createOctagonShape(): THREE.Shape {
    const shape = new THREE.Shape();
    const sides = 8;
    const radius = 0.35;
    
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + Math.PI / 8;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    
    return shape;
  }

  private createCrescentShape(): THREE.Shape {
    const shape = new THREE.Shape();
    const outerRadius = 0.4;
    const innerRadius = 0.25;
    
    shape.moveTo(0, outerRadius);
    
    for (let i = 0; i <= 20; i++) {
      const angle = -Math.PI / 2 + (i / 20) * Math.PI;
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;
      shape.lineTo(x, y);
    }
    
    for (let i = 20; i >= 0; i--) {
      const angle = -Math.PI / 2 + (i / 20) * Math.PI;
      const x = Math.cos(angle) * innerRadius + 0.1;
      const y = Math.sin(angle) * innerRadius;
      shape.lineTo(x, y);
    }
    
    shape.lineTo(0, outerRadius);
    return shape;
  }

  public spawnRune(element: ElementType): void {
    const startPos = new THREE.Vector3(0, 5, 0);
    const rune = this.createRune(element, startPos);
    const targetPos = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0.5,
      (Math.random() - 0.5) * 2
    );
    
    rune.targetPosition = targetPos;
    rune.state = 'flying';
    rune.flyProgress = 0;
    
    this.playSound(440, 0.1, 'sine');
  }

  public handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (event.button !== 0) return;
    
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes = this.runes
      .filter(r => r.state !== 'placed')
      .map(r => r.mesh);
    
    const intersects = this.raycaster.intersectObjects(meshes, true);
    
    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && obj.parent) {
        if (obj.userData?.id && this.runeMeshes.has(obj.userData.id)) {
          break;
        }
        obj = obj.parent;
      }
      
      if (obj) {
        const rune = this.runeMeshes.get(obj.userData.id) || null;
        if (rune && rune.state !== 'placed') {
          this.selectedRune = rune;
          this.isDragging = true;
          rune.state = 'dragging';
          
          const intersectPoint = new THREE.Vector3();
          this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint);
          if (intersectPoint) {
            this.dragOffset.copy(intersectPoint).sub(rune.mesh.position);
          }
          
          this.createTrailParticles(rune);
          this.playSound(660, 0.05, 'sine');
        }
      }
    }
  }

  public handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isDragging || !this.selectedRune) return;
    
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint);
    
    if (intersectPoint) {
      this.selectedRune.mesh.position.copy(intersectPoint.sub(this.dragOffset));
      this.selectedRune.mesh.position.y = 0.5;
      this.selectedRune.position.copy(this.selectedRune.mesh.position);
      
      this.updateTrailParticles(this.selectedRune);
    }
  }

  public handleMouseUp(): void {
    if (!this.isDragging || !this.selectedRune) return;
    
    this.isDragging = false;
    
    const slot = this.arrayBuilder.getSlotAtPosition(this.selectedRune.position, 0.3);
    
    if (slot && !slot.occupied && slot.requiredElement === this.selectedRune.element) {
      this.snapRuneToSlot(this.selectedRune, slot);
    } else {
      this.selectedRune.state = 'idle';
      this.removeTrailParticles(this.selectedRune);
    }
    
    this.selectedRune = null;
  }

  private snapRuneToSlot(rune: RuneData, slot: ArraySlot): void {
    const startPos = rune.mesh.position.clone();
    const endPos = slot.position.clone();
    endPos.y = 0.2;
    
    const duration = 300;
    const startTime = Date.now();
    
    const animateSnap = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeT = 1 - Math.pow(1 - t, 3);
      
      rune.mesh.position.lerpVectors(startPos, endPos, easeT);
      rune.position.copy(rune.mesh.position);
      
      if (t < 1) {
        requestAnimationFrame(animateSnap);
      } else {
        rune.state = 'placed';
        slot.occupied = true;
        slot.runeId = rune.id;
        
        if (slot.outlineMesh) {
          const material = slot.outlineMesh.material as THREE.MeshBasicMaterial;
          material.opacity = 0.8;
        }
        
        this.removeTrailParticles(rune);
        this.triggerResonancePulse(rune, slot);
        this.playSnapSound();
        this.updateProgress();
        
        if (this.arrayBuilder.checkComplete()) {
          this.activateArray();
        }
      }
    };
    
    animateSnap();
  }

  private triggerResonancePulse(rune: RuneData, slot: ArraySlot): void {
    const color = ELEMENT_COLORS[rune.element];
    
    const waveGeometry = new THREE.RingGeometry(0.1, 0.15, 64);
    const waveMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.rotation.x = -Math.PI / 2;
    wave.position.copy(slot.position);
    wave.position.y = 0.1;
    
    this.scene.add(wave);
    this.pulseWaves.push(wave);
    
    const userData = rune.mesh.userData;
    if (userData.mainMesh) {
      const material = userData.mainMesh.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1.0;
      
      setTimeout(() => {
        material.emissiveIntensity = userData.baseEmissive;
      }, 500);
    }
    
    this.triggerScreenShake();
    
    const startTime = Date.now();
    const duration = 800;
    
    const animateWave = () => {
      const elapsed = Date.now() - startTime;
      const t = elapsed / duration;
      
      if (t < 1) {
        const scale = 1 + t * 4;
        wave.scale.setScalar(scale);
        waveMaterial.opacity = 0.8 * (1 - t);
        requestAnimationFrame(animateWave);
      } else {
        this.scene.remove(wave);
        waveGeometry.dispose();
        waveMaterial.dispose();
        const index = this.pulseWaves.indexOf(wave);
        if (index > -1) this.pulseWaves.splice(index, 1);
      }
    };
    
    animateWave();
  }

  private createTrailParticles(rune: RuneData): void {
    const geometry = new THREE.BufferGeometry();
    const count = 50;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    
    const color = new THREE.Color(ELEMENT_COLORS[rune.element]);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      alphas[i] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData = { trailIndex: 0 };
    rune.trailParticles = particles;
    this.scene.add(particles);
  }

  private updateTrailParticles(rune: RuneData): void {
    if (!rune.trailParticles) return;
    
    const positions = rune.trailParticles.geometry.attributes.position.array as Float32Array;
    const alphas = rune.trailParticles.geometry.attributes.alpha.array as Float32Array;
    const userData = rune.trailParticles.userData;
    
    const index = userData.trailIndex;
    const count = positions.length / 3;
    
    positions[index * 3] = rune.mesh.position.x;
    positions[index * 3 + 1] = rune.mesh.position.y;
    positions[index * 3 + 2] = rune.mesh.position.z;
    
    alphas[index] = 1;
    
    userData.trailIndex = (index + 1) % count;
    
    for (let i = 0; i < count; i++) {
      alphas[i] *= 0.92;
    }
    
    rune.trailParticles.geometry.attributes.position.needsUpdate = true;
    rune.trailParticles.geometry.attributes.alpha.needsUpdate = true;
  }

  private removeTrailParticles(rune: RuneData): void {
    if (rune.trailParticles) {
      this.scene.remove(rune.trailParticles);
      rune.trailParticles.geometry.dispose();
      (rune.trailParticles.material as THREE.Material).dispose();
      rune.trailParticles = null;
    }
  }

  private triggerScreenShake(): void {
    const container = document.getElementById('canvas-container');
    if (container) {
      container.classList.add('shake');
      setTimeout(() => {
        container.classList.remove('shake');
      }, 200);
    }
  }

  private updateProgress(): void {
    const slots = this.arrayBuilder.getSlots();
    const placed = slots.filter(s => s.occupied).length;
    const total = slots.length;
    
    if (this.onProgressUpdate) {
      this.onProgressUpdate(placed, total);
    }
  }

  private activateArray(): void {
    this.arrayBuilder.activate();
    
    if (this.onArrayActivated) {
      this.onArrayActivated();
    }
    
    this.playActivationSound();
    this.createActivationBurst();
  }

  private createActivationBurst(): void {
    const colorCount = 6;
    const colors = Object.values(ELEMENT_COLORS);
    
    for (let c = 0; c < colorCount; c++) {
      const geometry = new THREE.BufferGeometry();
      const count = 100;
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      
      for (let i = 0; i < count; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0.5;
        positions[i * 3 + 2] = 0;
        
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.05 + Math.random() * 0.1;
        
        velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities[i * 3 + 1] = Math.cos(phi) * speed + 0.05;
        velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
      
      const material = new THREE.PointsMaterial({
        color: colors[c],
        size: 0.08,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const particles = new THREE.Points(geometry, material);
      this.scene.add(particles);
      
      const startTime = Date.now();
      const duration = 2000;
      
      const animateBurst = () => {
        const elapsed = Date.now() - startTime;
        const t = elapsed / duration;
        
        const positions = particles.geometry.attributes.position.array as Float32Array;
        const velocities = particles.geometry.attributes.velocity.array as Float32Array;
        
        for (let i = 0; i < count; i++) {
          positions[i * 3] += velocities[i * 3];
          positions[i * 3 + 1] += velocities[i * 3 + 1];
          positions[i * 3 + 2] += velocities[i * 3 + 2];
          
          velocities[i * 3 + 1] -= 0.002;
        }
        
        material.opacity = 1 - t;
        particles.geometry.attributes.position.needsUpdate = true;
        
        if (t < 1) {
          requestAnimationFrame(animateBurst);
        } else {
          this.scene.remove(particles);
          geometry.dispose();
          material.dispose();
        }
      };
      
      setTimeout(() => {
        animateBurst();
      }, c * 100);
    }
    
    this.triggerScreenShake();
  }

  private playSound(frequency: number, duration: number, type: OscillatorType): void {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playSnapSound(): void {
    if (!this.audioContext) return;
    
    const frequencies = [523.25, 659.25, 783.99];
    
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playSound(freq, 0.2, 'sine');
      }, i * 50);
    });
  }

  private playActivationSound(): void {
    if (!this.audioContext) return;
    
    const chord = [261.63, 329.63, 392.00, 523.25];
    const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    
    chord.forEach(freq => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      
      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext!.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 2);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      oscillator.start();
      oscillator.stop(this.audioContext!.currentTime + 2);
    });
    
    arpeggio.forEach((freq, i) => {
      setTimeout(() => {
        this.playSound(freq, 0.3, 'triangle');
      }, i * 100);
    });
  }

  public update(deltaTime: number, time: number): void {
    this.runes.forEach(rune => {
      if (rune.state === 'flying' && rune.targetPosition) {
        rune.flyProgress += deltaTime * 2;
        
        if (rune.flyProgress >= 1) {
          rune.mesh.position.copy(rune.targetPosition);
          rune.position.copy(rune.targetPosition);
          rune.state = 'idle';
          rune.targetPosition = null;
        } else {
          const t = rune.flyProgress;
          const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          
          const startY = 5 - 5 * easeT;
          const sineOffset = Math.sin(t * Math.PI * 2) * 0.5;
          
          rune.mesh.position.x = rune.targetPosition.x * easeT;
          rune.mesh.position.y = startY + sineOffset;
          rune.mesh.position.z = rune.targetPosition.z * easeT;
          rune.position.copy(rune.mesh.position);
        }
      }
      
      rune.mesh.rotation.y += deltaTime * 0.5;
      
      if (rune.state === 'placed') {
        rune.mesh.position.y = 0.2 + Math.sin(time * 2 + rune.mesh.position.x * 2) * 0.05;
      }
    });
  }

  public setOnArrayActivated(callback: () => void): void {
    this.onArrayActivated = callback;
  }

  public setOnProgressUpdate(callback: (placed: number, total: number) => void): void {
    this.onProgressUpdate = callback;
  }

  public reset(): void {
    this.runes.forEach(rune => {
      this.scene.remove(rune.mesh);
      rune.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.removeTrailParticles(rune);
    });
    this.runes = [];
    this.runeMeshes.clear();
  }

  public resumeAudio(): void {
    if (this.audioContext) {
      this.audioContext.resume();
    }
  }

  public getRunes(): RuneData[] {
    return this.runes;
  }
}
