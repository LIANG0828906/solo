import * as THREE from 'three';
import { SeatData, updateSeatColor, THEATER_CONFIG } from './theaterBuilder';

export interface SpeakerObject {
  group: THREE.Group;
  sphere: THREE.Mesh;
  waveShells: THREE.Mesh[];
  beamLine: THREE.Line;
  initialPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  direction: THREE.Vector3;
}

export type SimulationMode = 'simulation' | 'measurement';

export interface SpeakerSystemCallbacks {
  onSoundFieldUpdate: (seats: SeatData[]) => void;
}

export class SpeakerSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.Renderer;
  private seats: SeatData[];
  private speakers: SpeakerObject[] = [];
  private callbacks: SpeakerSystemCallbacks;
  
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedSpeaker: SpeakerObject | null = null;
  private isDragging: boolean = false;
  private dragPlane: THREE.Plane;
  
  private mode: SimulationMode = 'simulation';
  private reverbTime: number = 1.5;
  private baseShellRadius: number = 3;
  
  private time: number = 0;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.Renderer,
    seats: SeatData[],
    callbacks: SpeakerSystemCallbacks
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.seats = seats;
    this.callbacks = callbacks;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    
    this.createSpeakers();
    this.setupEventListeners();
    this.calculateSoundField();
  }

  private createSpeakers(): void {
    const stageRadius = THEATER_CONFIG.stageRadius - 1.5;
    const stageY = THEATER_CONFIG.stageHeight + 1.5;
    const halfAngle = Math.PI * 0.7;
    
    for (let i = 0; i < 6; i++) {
      const angle = -halfAngle / 2 + (halfAngle * i) / 5;
      const x = Math.sin(angle) * stageRadius;
      const z = Math.cos(angle) * stageRadius;
      
      const speakerGroup = new THREE.Group();
      speakerGroup.position.set(x, stageY, z);
      
      const sphereGeo = new THREE.SphereGeometry(0.4, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x2266ff,
        emissive: 0x1144aa,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.8,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.userData = { type: 'speaker', index: i };
      speakerGroup.add(sphere);
      
      const waveShells: THREE.Mesh[] = [];
      for (let j = 0; j < 4; j++) {
        const shellGeo = new THREE.SphereGeometry(this.baseShellRadius * (j + 1) * 0.5, 32, 32);
        const shellMat = new THREE.MeshBasicMaterial({
          color: 0x4488ff,
          transparent: true,
          opacity: 0.18 - j * 0.035,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        waveShells.push(shell);
        speakerGroup.add(shell);
      }
      
      const dir = new THREE.Vector3(0, -0.2, 1).normalize();
      const beamPoints = [
        new THREE.Vector3(0, 0, 0),
        dir.clone().multiplyScalar(18),
      ];
      const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
      const beamMat = new THREE.LineBasicMaterial({
        color: 0x88ffaa,
        transparent: true,
        opacity: 0.5,
      });
      const beamLine = new THREE.Line(beamGeo, beamMat);
      speakerGroup.add(beamLine);
      
      this.scene.add(speakerGroup);
      
      const speaker: SpeakerObject = {
        group: speakerGroup,
        sphere,
        waveShells,
        beamLine,
        initialPosition: new THREE.Vector3(x, stageY, z),
        currentPosition: new THREE.Vector3(x, stageY, z),
        direction: dir,
      };
      this.speakers.push(speaker);
    }
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const speakerMeshes = this.speakers.map(s => s.sphere);
    const intersects = this.raycaster.intersectObjects(speakerMeshes);
    
    if (intersects.length > 0) {
      const hitIndex = intersects[0].object.userData.index;
      this.selectedSpeaker = this.speakers[hitIndex];
      this.isDragging = true;
      
      const normal = new THREE.Vector3(0, 1, 0);
      const point = intersects[0].point;
      this.dragPlane.setFromNormalAndCoplanarPoint(normal, point);
      
      document.body.style.cursor = 'grabbing';
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.selectedSpeaker) {
      this.updateMouse(event);
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const speakerMeshes = this.speakers.map(s => s.sphere);
      const intersects = this.raycaster.intersectObjects(speakerMeshes);
      document.body.style.cursor = intersects.length > 0 ? 'grab' : 'default';
      return;
    }
    
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersection = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
      const stageRadius = THEATER_CONFIG.stageRadius + 2;
      const distFromCenter = Math.sqrt(intersection.x ** 2 + intersection.z ** 2);
      
      if (distFromCenter <= stageRadius) {
        this.selectedSpeaker.group.position.copy(intersection);
        this.selectedSpeaker.currentPosition.copy(intersection);
      } else {
        const scale = stageRadius / distFromCenter;
        intersection.x *= scale;
        intersection.z *= scale;
        this.selectedSpeaker.group.position.copy(intersection);
        this.selectedSpeaker.currentPosition.copy(intersection);
      }
    }
  }

  private onMouseUp(): void {
    if (this.isDragging && this.selectedSpeaker) {
      this.isDragging = false;
      this.selectedSpeaker = null;
      this.calculateSoundField();
      document.body.style.cursor = 'default';
    }
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  public calculateSoundField(): void {
    if (this.mode === 'simulation') {
      this.calculateSimulatedField();
    } else {
      this.calculateMeasuredField();
    }
    
    this.seats.forEach(seat => updateSeatColor(seat));
    this.callbacks.onSoundFieldUpdate(this.seats);
  }

  private calculateSimulatedField(): void {
    for (const seat of this.seats) {
      let totalSPL = 0;
      let weightedCount = 0;
      
      for (const speaker of this.speakers) {
        const distance = seat.position.distanceTo(speaker.currentPosition);
        const minDistance = 3;
        const effectiveDistance = Math.max(distance, minDistance);
        
        const referenceSPL = 108;
        const distanceLoss = 20 * Math.log10(effectiveDistance / minDistance);
        const baseSPL = referenceSPL - distanceLoss;
        
        const toSeat = new THREE.Vector3().subVectors(seat.position, speaker.currentPosition).normalize();
        const direction = speaker.direction.clone().normalize();
        const dot = Math.max(0, toSeat.dot(direction));
        const directionality = Math.pow(dot, 1.2) * 6;
        
        const rowFactor = 1 - seat.row * 0.03;
        
        const speakerSPL = (baseSPL + directionality) * rowFactor;
        const weight = 1 / (effectiveDistance + 1);
        
        totalSPL += speakerSPL * weight;
        weightedCount += weight;
      }
      
      const avgSPL = totalSPL / weightedCount;
      const reverbBoost = this.reverbTime * 1.5;
      seat.soundPressureLevel = Math.max(60, Math.min(110, avgSPL + reverbBoost));
    }
  }

  private calculateMeasuredField(): void {
    for (const seat of this.seats) {
      let totalIntensity = 0;
      
      for (const speaker of this.speakers) {
        const distance = seat.position.distanceTo(speaker.currentPosition);
        const minDistance = 2;
        const effectiveDistance = Math.max(distance, minDistance);
        
        const toSeat = new THREE.Vector3().subVectors(seat.position, speaker.currentPosition).normalize();
        const direction = speaker.direction.clone().normalize();
        const angleFactor = Math.max(0.2, toSeat.dot(direction));
        
        const intensity = (angleFactor / (effectiveDistance * effectiveDistance)) * 1000;
        totalIntensity += intensity;
      }
      
      const referenceIntensity = 0.00002;
      const baseSPL = 20 * Math.log10(totalIntensity / referenceIntensity);
      
      const reverbFactor = 1 + (this.reverbTime - 0.5) * 0.08;
      const finalSPL = baseSPL * reverbFactor;
      
      seat.soundPressureLevel = Math.max(60, Math.min(110, finalSPL));
    }
  }

  public updateReverbTime(time: number): void {
    this.reverbTime = Math.max(0.5, Math.min(3.0, time));
    
    const scaleFactor = 1 + (this.reverbTime - 0.5) * 0.4;
    const opacityBoost = (this.reverbTime - 0.5) / 5;
    
    this.speakers.forEach(speaker => {
      speaker.waveShells.forEach((shell, index) => {
        const baseScale = (index + 1) * 0.5;
        shell.scale.setScalar(scaleFactor * baseScale);
        const material = shell.material as THREE.MeshBasicMaterial;
        material.opacity = Math.min(0.35, (0.18 - index * 0.03) + opacityBoost);
      });
    });
    
    this.calculateSoundField();
  }

  public setMode(mode: SimulationMode): void {
    this.mode = mode;
    this.calculateSoundField();
  }

  public resetSpeakers(): void {
    this.speakers.forEach(speaker => {
      speaker.group.position.copy(speaker.initialPosition);
      speaker.currentPosition.copy(speaker.initialPosition);
    });
    this.reverbTime = 1.5;
    this.updateReverbTime(1.5);
    this.calculateSoundField();
  }

  public animate(deltaTime: number): void {
    this.time += deltaTime;
    
    this.speakers.forEach((speaker, speakerIndex) => {
      speaker.waveShells.forEach((shell, index) => {
        const phase = this.time * 1.5 + index * 0.6 + speakerIndex * 0.2;
        const pulse = 1 + Math.sin(phase) * 0.12;
        const baseScale = (1 + (this.reverbTime - 0.5) * 0.4) * (index + 1) * 0.5;
        shell.scale.setScalar(baseScale * pulse);
        
        const material = shell.material as THREE.MeshBasicMaterial;
        const baseOpacity = 0.18 - index * 0.03 + (this.reverbTime - 0.5) / 5;
        material.opacity = Math.max(0.03, baseOpacity + Math.sin(phase) * 0.04);
      });
    });
  }

  public getSpeakers(): SpeakerObject[] {
    return this.speakers;
  }

  public getMode(): SimulationMode {
    return this.mode;
  }

  public getReverbTime(): number {
    return this.reverbTime;
  }

  public dispose(): void {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.removeEventListener('mouseleave', this.onMouseUp.bind(this));
  }
}
