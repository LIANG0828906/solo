import * as THREE from 'three';
import type { SeismicRecord } from '../data/SeismicData';

export class SeismicPoint {
  private record: SeismicRecord;
  private earthRadius: number;
  private group: THREE.Group;
  private marker: THREE.Mesh;
  private rippleMeshes: THREE.Mesh[] = [];
  private rippleAnimating: boolean = false;
  private rippleStartTime: number = 0;
  private burstStartTime: number = 0;
  private burstAnimating: boolean = false;
  private baseScale: number = 1;
  private visible: boolean = true;

  constructor(record: SeismicRecord, earthRadius: number) {
    this.record = record;
    this.earthRadius = earthRadius;
    this.group = new THREE.Group();
    this.marker = this.createMarker();
    this.group.add(this.marker);
    this.positionOnSphere();
  }

  private createMarker(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: this.getDepthColor(),
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.updateScale(mesh);
    return mesh;
  }

  private getDepthColor(): THREE.Color {
    const depth = this.record.depth;
    const maxDepth = 700;
    const t = Math.min(depth / maxDepth, 1);
    
    const shallowColor = new THREE.Color(0xfff5e6);
    const deepColor = new THREE.Color(0x8b0000);
    
    return shallowColor.clone().lerp(deepColor, t);
  }

  private updateScale(mesh: THREE.Mesh): void {
    const magnitude = this.record.magnitude;
    const baseSize = 0.02;
    const scaleFactor = Math.pow(1.5, magnitude - 4);
    this.baseScale = baseSize * Math.max(scaleFactor, 0.8);
    mesh.scale.setScalar(this.baseScale * this.earthRadius);
  }

  private positionOnSphere(): void {
    const lat = this.record.latitude * Math.PI / 180;
    const lng = this.record.longitude * Math.PI / 180;
    
    const x = this.earthRadius * Math.cos(lat) * Math.cos(lng);
    const y = this.earthRadius * Math.sin(lat);
    const z = this.earthRadius * Math.cos(lat) * Math.sin(-lng);
    
    this.group.position.set(x, y, z);
    this.group.lookAt(0, 0, 0);
  }

  public showRipple(): void {
    this.clearRipples();
    this.rippleAnimating = true;
    this.rippleStartTime = performance.now();
    
    const rippleCount = 3;
    for (let i = 0; i < rippleCount; i++) {
      const geometry = new THREE.RingGeometry(1, 1.02, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const ripple = new THREE.Mesh(geometry, material);
      ripple.rotation.x = -Math.PI / 2;
      ripple.scale.setScalar(1);
      ripple.userData.delay = i * 0.2;
      this.rippleMeshes.push(ripple);
      this.group.add(ripple);
    }
  }

  public hideRipple(): void {
    this.rippleAnimating = false;
    this.clearRipples();
  }

  private clearRipples(): void {
    this.rippleMeshes.forEach(ripple => {
      this.group.remove(ripple);
      ripple.geometry.dispose();
      (ripple.material as THREE.Material).dispose();
    });
    this.rippleMeshes = [];
  }

  public startBurstAnimation(): void {
    this.burstAnimating = true;
    this.burstStartTime = performance.now();
  }

  public update(currentTime: number): void {
    if (!this.visible) return;

    if (this.rippleAnimating) {
      const elapsed = (currentTime - this.rippleStartTime) / 1000;
      
      this.rippleMeshes.forEach((ripple, index) => {
        const adjustedElapsed = elapsed - ripple.userData.delay;
        if (adjustedElapsed > 0) {
          const maxScale = 0.3;
          const duration = 2;
          const progress = Math.min(adjustedElapsed / duration, 1);
          const scale = 1 + progress * maxScale * this.earthRadius;
          ripple.scale.setScalar(scale);
          (ripple.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - progress);
        }
      });
    }

    if (this.burstAnimating) {
      const elapsed = (currentTime - this.burstStartTime) / 1000;
      const duration = 0.5;
      
      if (elapsed < duration) {
        const progress = elapsed / duration;
        const pulseScale = 1 + Math.sin(progress * Math.PI) * 1.5;
        this.marker.scale.setScalar(this.baseScale * this.earthRadius * pulseScale);
        (this.marker.material as THREE.MeshBasicMaterial).opacity = 0.9 + Math.sin(progress * Math.PI) * 0.1;
      } else {
        this.burstAnimating = false;
        this.marker.scale.setScalar(this.baseScale * this.earthRadius);
        (this.marker.material as THREE.MeshBasicMaterial).opacity = 0.9;
      }
    }
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.group.visible = visible;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getMarker(): THREE.Mesh {
    return this.marker;
  }

  public getRecord(): SeismicRecord {
    return this.record;
  }

  public dispose(): void {
    this.clearRipples();
    this.group.remove(this.marker);
    this.marker.geometry.dispose();
    (this.marker.material as THREE.Material).dispose();
  }
}
