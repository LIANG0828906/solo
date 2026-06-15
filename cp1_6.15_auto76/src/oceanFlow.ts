import * as THREE from 'three';
import type { OceanCurrent } from './types';

interface CurrentInstance {
  data: OceanCurrent;
  curve: THREE.CatmullRomCurve3;
  line: THREE.Line;
  particles: THREE.Points;
  particlePositions: Float32Array;
  particleProgress: Float32Array;
  particleAlphas: Float32Array;
}

export class OceanFlowRenderer {
  private scene: THREE.Scene;
  private earthRadius: number;
  private currents: CurrentInstance[] = [];
  private group: THREE.Group;
  private particleCountPerCurrent = 50;
  visible: boolean = true;

  constructor(scene: THREE.Scene, earthRadius: number) {
    this.scene = scene;
    this.earthRadius = earthRadius;
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  private getSpeedColor(speed: number, isWarm: boolean): THREE.Color {
    const normalizedSpeed = Math.min(speed / 3, 1);
    if (isWarm) {
      const color = new THREE.Color();
      color.setRGB(1.0, 0.4 + normalizedSpeed * 0.4, 0.0 + normalizedSpeed * 0.2);
      return color;
    } else {
      const color = new THREE.Color();
      color.setRGB(0.0 + normalizedSpeed * 0.3, 0.4 + normalizedSpeed * 0.2, 1.0);
      return color;
    }
  }

  private createBezierCurve(current: OceanCurrent): THREE.CatmullRomCurve3 {
    const points: THREE.Vector3[] = [];
    const r = this.earthRadius * 1.002;
    
    points.push(this.latLngToVector3(current.start.lat, current.start.lng, r));
    
    if (current.waypoints && current.waypoints.length > 0) {
      for (const wp of current.waypoints) {
        points.push(this.latLngToVector3(wp.lat, wp.lng, r));
      }
    }
    
    const midLat = (current.start.lat + current.end.lat) / 2;
    const midLng = (current.start.lng + current.end.lng) / 2;
    const offset = this.latLngToVector3(midLat, midLng, this.earthRadius * 1.02);
    
    if (points.length < 3) {
      points.splice(1, 0, offset);
    }
    
    points.push(this.latLngToVector3(current.end.lat, current.end.lng, r));
    
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }

  updateCurrents(currentData: OceanCurrent[]): void {
    this.clear();
    
    for (const data of currentData) {
      const curve = this.createBezierCurve(data);
      
      const curvePoints = curve.getPoints(200);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      
      const colors = new Float32Array(curvePoints.length * 3);
      const baseColor = this.getSpeedColor(data.speed, data.isWarm);
      for (let i = 0; i < curvePoints.length; i++) {
        colors[i * 3] = baseColor.r;
        colors[i * 3 + 1] = baseColor.g;
        colors[i * 3 + 2] = baseColor.b;
      }
      lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: Math.max(1, data.speed * 0.8),
        transparent: true,
        opacity: 0.7
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      
      const particleCount = this.particleCountPerCurrent;
      const positions = new Float32Array(particleCount * 3);
      const progress = new Float32Array(particleCount);
      const alphas = new Float32Array(particleCount);
      const particleColors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        progress[i] = i / particleCount;
        alphas[i] = 1 - Math.abs(i / particleCount - 0.5) * 2;
        const pos = curve.getPoint(progress[i]);
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;
        
        const pColor = this.getSpeedColor(data.speed, data.isWarm);
        particleColors[i * 3] = pColor.r;
        particleColors[i * 3 + 1] = pColor.g;
        particleColors[i * 3 + 2] = pColor.b;
      }
      
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
      
      const particleMaterial = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: false
      });
      
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      
      this.group.add(line);
      this.group.add(particles);
      
      this.currents.push({
        data,
        curve,
        line,
        particles,
        particlePositions: positions,
        particleProgress: progress,
        particleAlphas: alphas
      });
    }
  }

  update(delta: number): void {
    if (!this.visible) return;
    
    for (const current of this.currents) {
      const speedFactor = current.data.speed * 0.003;
      
      for (let i = 0; i < this.particleCountPerCurrent; i++) {
        current.particleProgress[i] += delta * speedFactor;
        if (current.particleProgress[i] > 1) {
          current.particleProgress[i] -= 1;
        }
        
        const pos = current.curve.getPoint(current.particleProgress[i]);
        current.particlePositions[i * 3] = pos.x;
        current.particlePositions[i * 3 + 1] = pos.y;
        current.particlePositions[i * 3 + 2] = pos.z;
      }
      
      const posAttr = current.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
    }
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.group.visible = visible;
  }

  clear(): void {
    for (const current of this.currents) {
      this.group.remove(current.line);
      this.group.remove(current.particles);
      current.line.geometry.dispose();
      (current.line.material as THREE.Material).dispose();
      current.particles.geometry.dispose();
      (current.particles.material as THREE.Material).dispose();
    }
    this.currents = [];
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }

  getNearbyCurrents(lat: number, lng: number, maxDist: number = 15): { name: string; direction: string; distance: number }[] {
    const results: { name: string; direction: string; distance: number }[] = [];
    
    for (const current of this.currents) {
      const midPoint = current.curve.getPoint(0.5);
      const phi = Math.acos(midPoint.y / this.earthRadius);
      const theta = Math.atan2(midPoint.z, -midPoint.x);
      const midLat = 90 - phi * (180 / Math.PI);
      const midLng = theta * (180 / Math.PI) - 180;
      
      const dLat = lat - midLat;
      const dLng = lng - midLng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      
      if (dist < maxDist) {
        const dx = current.end.lng - current.start.lng;
        const dy = current.end.lat - current.start.lat;
        let direction = '';
        if (Math.abs(dy) > Math.abs(dx)) {
          direction = dy > 0 ? '向北' : '向南';
        } else {
          direction = dx > 0 ? '向东' : '向西';
        }
        
        results.push({
          name: current.data.name,
          direction,
          distance: Math.round(dist * 10) / 10
        });
      }
    }
    
    return results.sort((a, b) => a.distance - b.distance).slice(0, 3);
  }
}
