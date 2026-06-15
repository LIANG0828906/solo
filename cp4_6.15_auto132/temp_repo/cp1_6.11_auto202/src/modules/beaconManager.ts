import * as THREE from 'three';
import { Terrain } from './terrain';
import { Beacon } from './beacon';
import { ParticleSystem } from './particleSystem';

export class BeaconManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private terrain: Terrain;
  private beacons: Beacon[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private previewRing: THREE.Mesh;
  private fireParticles: ParticleSystem;
  private smokeParticles: ParticleSystem;

  private beaconCountEl: HTMLElement | null;
  private litCountEl: HTMLElement | null;
  private signalTextEl: HTMLElement | null;

  private isDragging: boolean = false;
  private downX: number = 0;
  private downY: number = 0;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, terrain: Terrain, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.terrain = terrain;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.fireParticles = new ParticleSystem(scene, true);
    this.smokeParticles = new ParticleSystem(scene, true);

    const previewGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const previewMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    this.previewRing = new THREE.Mesh(previewGeometry, previewMaterial);
    this.previewRing.rotation.x = -Math.PI / 2;
    this.previewRing.visible = false;
    this.scene.add(this.previewRing);

    this.beaconCountEl = document.getElementById('beacon-count');
    this.litCountEl = document.getElementById('lit-count');
    this.signalTextEl = document.getElementById('signal-text');

    domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    domElement.addEventListener('mouseup', this.onClick.bind(this));
    domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    domElement.addEventListener('touchend', this.onTouchEnd.bind(this));

    const resetBtn = document.getElementById('btn-reset');
    const clearBtn = document.getElementById('btn-clear');
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetAll());
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAll());
    }

    this.updateUI();
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = false;
    this.downX = e.clientX;
    this.downY = e.clientY;
  }

  private onMouseMove(e: MouseEvent): void {
    if (Math.abs(e.clientX - this.downX) > 3 || Math.abs(e.clientY - this.downY) > 3) {
      this.isDragging = true;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.updatePreview();
  }

  private onClick(e: MouseEvent): void {
    if (this.isDragging) return;
    this.handleClick();
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    this.isDragging = false;
    this.downX = e.touches[0].clientX;
    this.downY = e.touches[0].clientY;
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    if (Math.abs(e.touches[0].clientX - this.downX) > 5 || Math.abs(e.touches[0].clientY - this.downY) > 5) {
      this.isDragging = true;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.mouse.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    this.updatePreview();
  }

  private onTouchEnd(e: TouchEvent): void {
    if (this.isDragging) return;
    if (e.changedTouches.length !== 1) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.mouse.x = ((e.changedTouches[0].clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.changedTouches[0].clientY - rect.top) / rect.height) * 2 + 1;
    this.handleClick();
  }

  private updatePreview(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.terrain.getMesh());

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const y = this.terrain.getHeightAt(point.x, point.z);
      this.previewRing.position.set(point.x, y + 0.01, point.z);
      this.previewRing.visible = true;
    } else {
      this.previewRing.visible = false;
    }
  }

  private handleClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const slotObjects: THREE.Object3D[] = [];
    for (const beacon of this.beacons) {
      slotObjects.push(...beacon.getClickableObjects());
    }

    const slotIntersects = this.raycaster.intersectObjects(slotObjects, false);
    if (slotIntersects.length > 0) {
      const obj = slotIntersects[0].object;
      if (obj.userData && obj.userData.isSlot) {
        const beacon = obj.userData.beacon as Beacon;
        const slotIndex = obj.userData.slotIndex as number;
        beacon.toggleSlot(slotIndex);
        this.updateUI();
        return;
      }
    }

    const terrainIntersects = this.raycaster.intersectObject(this.terrain.getMesh());
    if (terrainIntersects.length > 0) {
      const point = terrainIntersects[0].point;
      const y = this.terrain.getHeightAt(point.x, point.z);
      this.addBeacon(new THREE.Vector3(point.x, y, point.z));
    }
  }

  addBeacon(position: THREE.Vector3): void {
    const beacon = new Beacon(this.scene, position, this.fireParticles, this.smokeParticles);
    this.beacons.push(beacon);
    this.updateUI();
  }

  resetAll(): void {
    for (const beacon of this.beacons) {
      beacon.extinguishAll();
    }
    this.updateUI();
  }

  clearAll(): void {
    for (const beacon of this.beacons) {
      beacon.dispose();
    }
    this.beacons = [];
    this.fireParticles.clear();
    this.smokeParticles.clear();
    this.updateUI();
  }

  update(dt: number, wind: THREE.Vector3): void {
    for (const beacon of this.beacons) {
      beacon.update(dt, wind);
    }
    this.fireParticles.update(dt, new THREE.Vector3(0, 0.3, 0));
    this.smokeParticles.update(dt, wind);
  }

  private updateUI(): void {
    const beaconCount = this.beacons.length;
    let litCount = 0;
    for (const b of this.beacons) litCount += b.getLitCount();

    if (this.beaconCountEl) this.beaconCountEl.textContent = String(beaconCount);
    if (this.litCountEl) this.litCountEl.textContent = String(litCount);
    if (this.signalTextEl) {
      if (beaconCount === 0) {
        this.signalTextEl.textContent = '平安无事';
      } else if (litCount === 0) {
        this.signalTextEl.textContent = '驻守待命';
      } else if (litCount <= 2) {
        this.signalTextEl.textContent = '敌军小犯';
      } else if (litCount <= 5) {
        this.signalTextEl.textContent = '敌军来犯';
      } else {
        this.signalTextEl.textContent = '十万火急！';
      }
    }
  }

  getBeacons(): Beacon[] {
    return this.beacons;
  }
}
