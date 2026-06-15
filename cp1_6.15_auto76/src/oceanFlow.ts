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
  particleBaseAlphas: Float32Array;
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
      color.setHSL(0.05 + normalizedSpeed * 0.03, 1.0, 0.55 + normalizedSpeed * 0.1);
      return color;
    } else {
      const color = new THREE.Color();
      color.setHSL(0.65 - normalizedSpeed * 0.1, 0.9, 0.5 + normalizedSpeed * 0.15);
      return color;
    }
  }

  private createBezierCurve(current: OceanCurrent): THREE.CatmullRomCurve3 {
    const points: THREE.Vector3[] = [];
    const r = this.earthRadius * 1.003;
    
    points.push(this.latLngToVector3(current.start.lat, current.start.lng, r));
    
    if (current.waypoints && current.waypoints.length > 0) {
      for (const wp of current.waypoints) {
        points.push(this.latLngToVector3(wp.lat, wp.lng, r));
      }
    }
    
    points.push(this.latLngToVector3(current.end.lat, current.end.lng, r));
    
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3);
  }

  private createParticleShaderMaterial(baseColor: THREE.Color): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio },
        uBaseColor: { value: baseColor }
      },
      vertexShader: `
        attribute float aAlpha;
        attribute vec3 aColor;
        varying float vAlpha;
        varying vec3 vColor;
        uniform float uPixelRatio;
        
        void main() {
          vAlpha = aAlpha;
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 3.0 * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.15, dist) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  updateCurrents(currentData: OceanCurrent[]): void {
    this.clear();
    
    for (const data of currentData) {
      const curve = this.createBezierCurve(data);
      
      const curvePoints = curve.getPoints(300);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      
      const colors = new Float32Array(curvePoints.length * 3);
      const alphas = new Float32Array(curvePoints.length);
      const baseColor = this.getSpeedColor(data.speed, data.isWarm);
      
      for (let i = 0; i < curvePoints.length; i++) {
        const t = i / curvePoints.length;
        const lineAlpha = 0.15 + 0.55 * Math.sin(Math.PI * t);
        
        colors[i * 3] = baseColor.r;
        colors[i * 3 + 1] = baseColor.g;
        colors[i * 3 + 2] = baseColor.b;
        alphas[i] = lineAlpha;
      }
      lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: Math.max(1, data.speed * 0.7),
        transparent: true,
        opacity: 0.65
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      
      const particleCount = this.particleCountPerCurrent;
      const positions = new Float32Array(particleCount * 3);
      const progress = new Float32Array(particleCount);
      const particleAlphas = new Float32Array(particleCount);
      const particleBaseAlphas = new Float32Array(particleCount);
      const particleColors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        progress[i] = i / particleCount;
        
        const t = progress[i];
        let fadeAlpha = 1.0;
        if (t < 0.15) {
          fadeAlpha = t / 0.15;
        } else if (t > 0.75) {
          fadeAlpha = Math.max(0, 1 - (t - 0.75) / 0.25);
        }
        particleBaseAlphas[i] = fadeAlpha;
        particleAlphas[i] = fadeAlpha;
        
        const pos = curve.getPoint(progress[i]);
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;
        
        const speedBoost = Math.random() * 0.25;
        const pColor = this.getSpeedColor(
          Math.min(3.5, data.speed * (1 + speedBoost)),
          data.isWarm
        );
        const brightness = 0.85 + Math.random() * 0.3;
        particleColors[i * 3] = Math.min(1, pColor.r * brightness);
        particleColors[i * 3 + 1] = Math.min(1, pColor.g * brightness);
        particleColors[i * 3 + 2] = Math.min(1, pColor.b * brightness);
      }
      
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('aColor', new THREE.BufferAttribute(particleColors, 3));
      particleGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(particleAlphas, 1));
      
      const particleMaterial = this.createParticleShaderMaterial(baseColor);
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
        particleAlphas,
        particleBaseAlphas
      });
    }
  }

  update(delta: number): void {
    if (!this.visible) return;
    
    for (const current of this.currents) {
      const speedFactor = current.data.speed * 0.00025;
      
      for (let i = 0; i < this.particleCountPerCurrent; i++) {
        current.particleProgress[i] += delta * speedFactor;
        
        while (current.particleProgress[i] >= 1.0) {
          current.particleProgress[i] -= 1.0;
        }
        while (current.particleProgress[i] < 0) {
          current.particleProgress[i] += 1.0;
        }
        
        const t = current.particleProgress[i];
        let fadeAlpha = 1.0;
        if (t < 0.12) {
          fadeAlpha = t / 0.12;
        } else if (t > 0.78) {
          fadeAlpha = Math.max(0, 1 - (t - 0.78) / 0.22);
        }
        current.particleAlphas[i] = current.particleBaseAlphas[i] * fadeAlpha;
        
        const pos = current.curve.getPointAt(current.particleProgress[i]);
        current.particlePositions[i * 3] = pos.x;
        current.particlePositions[i * 3 + 1] = pos.y;
        current.particlePositions[i * 3 + 2] = pos.z;
      }
      
      const posAttr = current.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
      
      const alphaAttr = current.particles.geometry.getAttribute('aAlpha') as THREE.BufferAttribute;
      alphaAttr.needsUpdate = true;
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
      const phi = Math.acos(Math.max(-1, Math.min(1, midPoint.y / this.earthRadius)));
      const theta = Math.atan2(midPoint.z, -midPoint.x);
      const midLat = 90 - phi * (180 / Math.PI);
      const midLng = theta * (180 / Math.PI) - 180;
      
      const dLat = lat - midLat;
      const dLng = lng - midLng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      
      if (dist < maxDist) {
        const dx = current.data.end.lng - current.data.start.lng;
        const dy = current.data.end.lat - current.data.start.lat;
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
