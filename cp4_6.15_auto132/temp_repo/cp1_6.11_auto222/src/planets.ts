import * as THREE from 'three';

export interface Planet {
  name: string;
  mesh: THREE.Mesh;
  glowMesh?: THREE.Mesh;
  orbitMesh?: THREE.Line;
  orbitRadius: number;
  orbitSpeed: number;
  orbitEccentricity: number;
  size: number;
  color: number;
  hasRing?: boolean;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  angle: number;
  type: 'sun' | 'moon' | 'planet';
}

const PLANET_DATA = [
  { name: '水星', type: 'planet' as const, orbitRadius: 3.2, orbitSpeed: 4.15, orbitEccentricity: 0.206, size: 0.08, color: 0xC0C0C0 },
  { name: '金星', type: 'planet' as const, orbitRadius: 3.8, orbitSpeed: 1.62, orbitEccentricity: 0.007, size: 0.14, color: 0xFFFACD },
  { name: '火星', type: 'planet' as const, orbitRadius: 4.8, orbitSpeed: 0.53, orbitEccentricity: 0.093, size: 0.11, color: 0xFF4500 },
  { name: '木星', type: 'planet' as const, orbitRadius: 5.6, orbitSpeed: 0.084, orbitEccentricity: 0.048, size: 0.28, color: 0xDAA520, hasStripes: true },
  { name: '土星', type: 'planet' as const, orbitRadius: 6.4, orbitSpeed: 0.034, orbitEccentricity: 0.054, size: 0.24, color: 0xF0E68C, hasRing: true, ringInnerRadius: 0.3, ringOuterRadius: 0.5 },
];

export class PlanetSystem {
  public group: THREE.Group;
  public sun!: Planet;
  public moon!: Planet;
  public planets: Planet[] = [];
  public allCelestials: Planet[] = [];
  
  private eclipticGroup: THREE.Group;
  private selectedPlanet: Planet | null = null;
  private timeOffset = 0;

  constructor(eclipticGroup: THREE.Group) {
    this.eclipticGroup = eclipticGroup;
    this.group = new THREE.Group();
    this.eclipticGroup.add(this.group);
    
    this.createSun();
    this.createMoon();
    this.createPlanets();
    
    this.allCelestials = [this.sun, this.moon, ...this.planets];
  }

  private createSun(): void {
    const sunGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FF8C00');
    gradient.addColorStop(1, '#FF4500');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 128);
    
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 128;
      const r = 2 + Math.random() * 8;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
      rg.addColorStop(1, 'rgba(255, 200, 0, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const sunTexture = new THREE.CanvasTexture(canvas);
    
    const sunMaterial = new THREE.MeshBasicMaterial({
      map: sunTexture,
      color: 0xFFD700
    });
    
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.set(0, 0, 0);
    sunMesh.userData = { type: 'celestial', celestialType: 'sun', name: '太阳' };
    
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.visible = false;
    
    this.sun = {
      name: '太阳',
      mesh: sunMesh,
      glowMesh,
      orbitRadius: 0,
      orbitSpeed: 0,
      orbitEccentricity: 0,
      size: 0.8,
      color: 0xFFD700,
      angle: 0,
      type: 'sun'
    };
    
    this.group.add(sunMesh);
    this.group.add(glowMesh);
  }

  private createMoon(): void {
    const moonGeometry = new THREE.SphereGeometry(0.4, 24, 24);
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#FFFACD';
    ctx.fillRect(0, 0, 256, 128);
    
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 128;
      const r = 3 + Math.random() * 15;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(180, 180, 150, 0.5)');
      rg.addColorStop(1, 'rgba(255, 250, 205, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const moonTexture = new THREE.CanvasTexture(canvas);
    
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.userData = { type: 'celestial', celestialType: 'moon', name: '月亮' };
    
    const glowGeometry = new THREE.SphereGeometry(0.55, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFE0,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.visible = false;
    
    const orbitPoints: THREE.Vector3[] = [];
    const orbitRadius = 2.0;
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius * 0.9
      ));
    }
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ 
      color: 0x808080, 
      transparent: true, 
      opacity: 0.3 
    });
    const orbitMesh = new THREE.Line(orbitGeometry, orbitMaterial);
    
    this.moon = {
      name: '月亮',
      mesh: moonMesh,
      glowMesh,
      orbitMesh,
      orbitRadius: 2.0,
      orbitSpeed: 13.37,
      orbitEccentricity: 0.05,
      size: 0.4,
      color: 0xFFFACD,
      angle: 0,
      type: 'moon'
    };
    
    this.group.add(moonMesh);
    this.group.add(glowMesh);
    this.group.add(orbitMesh);
  }

  private createPlanets(): void {
    PLANET_DATA.forEach(data => {
      const geometry = new THREE.SphereGeometry(data.size, 16, 16);
      
      let material: THREE.Material;
      
      if (data.name === '木星') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(0, 0, 256, 128);
        
        for (let i = 0; i < 8; i++) {
          const y = (i / 8) * 128 + Math.random() * 10;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(205, 133, 63, 0.6)' : 'rgba(245, 222, 179, 0.4)';
          ctx.fillRect(0, y, 256, 8 + Math.random() * 6);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.6,
          metalness: 0.2
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: data.color,
          roughness: 0.7,
          metalness: 0.15
        });
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { 
        type: 'celestial', 
        celestialType: 'planet', 
        name: data.name,
        color: data.color
      };
      
      const glowGeometry = new THREE.SphereGeometry(data.size * 1.5, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.visible = false;
      
      const orbitPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        const r = data.orbitRadius * (1 - data.orbitEccentricity * data.orbitEccentricity) / 
                  (1 + data.orbitEccentricity * Math.cos(angle));
        orbitPoints.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
      }
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: data.color, 
        transparent: true, 
        opacity: 0.2 
      });
      const orbitMesh = new THREE.Line(orbitGeometry, orbitMaterial);
      
      const planet: Planet = {
        name: data.name,
        mesh,
        glowMesh,
        orbitMesh,
        orbitRadius: data.orbitRadius,
        orbitSpeed: data.orbitSpeed,
        orbitEccentricity: data.orbitEccentricity,
        size: data.size,
        color: data.color,
        hasRing: data.hasRing,
        ringInnerRadius: data.ringInnerRadius,
        ringOuterRadius: data.ringOuterRadius,
        angle: Math.random() * Math.PI * 2,
        type: 'planet'
      };
      
      if (data.hasRing && data.ringInnerRadius && data.ringOuterRadius) {
        const ringGeometry = new THREE.RingGeometry(data.ringInnerRadius, data.ringOuterRadius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: data.color,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2.5;
        mesh.add(ring);
      }
      
      this.planets.push(planet);
      this.group.add(mesh);
      this.group.add(glowMesh);
      this.group.add(orbitMesh);
    });
  }

  public selectPlanet(planet: Planet | null): void {
    if (this.selectedPlanet?.glowMesh) {
      this.selectedPlanet.glowMesh.visible = false;
    }
    this.selectedPlanet = planet;
    if (planet?.glowMesh) {
      planet.glowMesh.visible = true;
    }
  }

  public getSelectedPlanet(): Planet | null {
    return this.selectedPlanet;
  }

  public getPlanetInfo(planet: Planet): { lon: number; lat: number; mag: number } {
    const lon = THREE.MathUtils.radToDeg(planet.angle);
    const normalizedLon = ((lon % 360) + 360) % 360;
    
    let mag = 1.0;
    if (planet.type === 'sun') mag = 10.0;
    else if (planet.type === 'moon') mag = 5.0;
    else if (planet.name === '金星') mag = 3.5;
    else if (planet.name === '木星') mag = 2.5;
    else if (planet.name === '水星') mag = 1.5;
    else if (planet.name === '火星') mag = 1.8;
    else if (planet.name === '土星') mag = 1.2;
    
    return { lon: normalizedLon, lat: 0, mag };
  }

  public setDate(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    const startOfYear = new Date(year, 0, 0);
    const diff = date.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    this.timeOffset = (dayOfYear / 365) * Math.PI * 2;
  }

  public update(delta: number, timeSpeed: number, currentTime: number): void {
    this.sun.mesh.rotation.y += delta * timeSpeed * 0.1;
    
    if (this.sun.glowMesh) {
      this.sun.glowMesh.position.copy(this.sun.mesh.position);
      const glowMat = this.sun.glowMesh.material as THREE.MeshBasicMaterial;
      if (this.selectedPlanet === this.sun) {
        glowMat.opacity = 0.2 + Math.sin(currentTime * 3) * 0.1;
      }
    }
    
    const moonAngle = this.timeOffset + currentTime * this.moon.orbitSpeed * 0.1 * timeSpeed;
    this.moon.angle = moonAngle;
    const moonR = this.moon.orbitRadius * (1 - this.moon.orbitEccentricity * this.moon.orbitEccentricity) /
                (1 + this.moon.orbitEccentricity * Math.cos(moonAngle));
    this.moon.mesh.position.set(
      Math.cos(moonAngle) * moonR,
      Math.sin(moonAngle * 2) * 0.15,
      Math.sin(moonAngle) * moonR * 0.9
    );
    if (this.moon.glowMesh) {
      this.moon.glowMesh.position.copy(this.moon.mesh.position);
    }
    this.moon.mesh.rotation.y += delta * timeSpeed * 0.5;
    
    this.planets.forEach(planet => {
      const angle = this.timeOffset + currentTime * planet.orbitSpeed * 0.1 * timeSpeed;
      planet.angle = angle;
      
      const r = planet.orbitRadius * (1 - planet.orbitEccentricity * planet.orbitEccentricity) /
                (1 + planet.orbitEccentricity * Math.cos(angle));
      
      planet.mesh.position.set(
        Math.cos(angle) * r,
        0,
        Math.sin(angle) * r
      );
      
      if (planet.glowMesh) {
        planet.glowMesh.position.copy(planet.mesh.position);
        if (this.selectedPlanet === planet) {
          const glowMat = planet.glowMesh.material as THREE.MeshBasicMaterial;
          glowMat.opacity = 0.2 + Math.sin(currentTime * 3) * 0.1;
          planet.glowMesh.scale.setScalar(1 + Math.sin(currentTime * 2) * 0.1);
        }
      }
      
      planet.mesh.rotation.y += delta * timeSpeed * 0.3;
    });
  }

  public dispose(): void {
    this.allCelestials.forEach(celestial => {
      celestial.mesh.geometry.dispose();
      (celestial.mesh.material as THREE.Material).dispose();
      if (celestial.glowMesh) {
        celestial.glowMesh.geometry.dispose();
        (celestial.glowMesh.material as THREE.Material).dispose();
      }
      if (celestial.orbitMesh) {
        celestial.orbitMesh.geometry.dispose();
        (celestial.orbitMesh.material as THREE.Material).dispose();
      }
    });
  }
}
