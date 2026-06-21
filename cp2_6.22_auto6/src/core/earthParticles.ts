import * as THREE from 'three';
import { getCountries, CountryEmission, ScenarioResult } from '../data/carbonData';

interface CountryParticleGroup {
  countryCode: string;
  countryName: string;
  particles: THREE.Points;
  basePositions: Float32Array;
  baseSize: number;
  centerPosition: THREE.Vector3;
}

interface GlowEffect {
  position: THREE.Vector3;
  startTime: number;
  duration: number;
  intensity: number;
}

export class EarthParticles {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private countryGroups: CountryParticleGroup[] = [];
  private particleCountPerCountry = 6000;
  private currentYear = 2023;
  private targetYear = 2023;
  private yearTransitionProgress = 1;
  private glowEffects: GlowEffect[] = [];
  private glowMeshes: THREE.Mesh[] = [];
  private hoveredCountry: string | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private canvas: HTMLCanvasElement;
  private autoRotate = true;
  private earthRadius = 2.5;
  private onCountryHoverCallback: ((country: CountryEmission | null) => void) | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initParticles();
    this.initGlowMeshes();
    this.bindEvents();
  }

  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  private initParticles(): void {
    const countries = getCountries();
    
    countries.forEach((country, index) => {
      const particleCount = this.particleCountPerCountry + Math.floor(Math.random() * 2000) - 1000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const basePositions = new Float32Array(particleCount * 3);

      const center = this.latLngToVector3(country.lat, country.lng, this.earthRadius);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        const latSpread = 5 + Math.random() * 3;
        const lngSpread = 8 + Math.random() * 4;
        
        const latOffset = (Math.random() - 0.5) * latSpread;
        const lngOffset = (Math.random() - 0.5) * lngSpread;
        
        const lat = country.lat + latOffset;
        const lng = country.lng + lngOffset;
        
        const heightVariation = 0.02 + Math.random() * 0.12;
        const r = this.earthRadius + 0.05 + heightVariation;
        
        const pos = this.latLngToVector3(lat, lng, r);

        positions[i3] = pos.x;
        positions[i3 + 1] = pos.y;
        positions[i3 + 2] = pos.z;

        basePositions[i3] = pos.x;
        basePositions[i3 + 1] = pos.y;
        basePositions[i3 + 2] = pos.z;

        colors[i3] = 0.0;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 1.0;

        sizes[i] = 0.015 + Math.random() * 0.025;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pixelRatio: { value: window.devicePixelRatio }
        },
        vertexShader: `
          attribute float size;
          varying vec3 vColor;
          varying float vAlpha;
          uniform float time;
          uniform float pixelRatio;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            float pulse = 0.8 + 0.2 * sin(time * 1.5 + position.x * 10.0 + position.y * 10.0);
            vAlpha = 0.6 + 0.4 * pulse;
            
            gl_PointSize = size * 300.0 * pixelRatio * pulse / -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;
          
          void main() {
            float r = distance(gl_PointCoord, vec2(0.5));
            if (r > 0.5) discard;
            
            float alpha = smoothstep(0.5, 0.0, r) * vAlpha;
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const particles = new THREE.Points(geometry, material);
      particles.userData.countryCode = country.countryCode;
      particles.userData.countryIndex = index;
      
      this.scene.add(particles);
      this.countryGroups.push({
        countryCode: country.countryCode,
        countryName: country.countryName,
        particles,
        basePositions,
        baseSize: sizes[0],
        centerPosition: center
      });
    });

    this.updateParticlesByYear(this.currentYear, false);
  }

  private initGlowMeshes(): void {
    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(0x00FF88) },
          intensity: { value: 0.0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying float vIntensity;
          uniform float intensity;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vIntensity = intensity;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying float vIntensity;
          uniform vec3 glowColor;
          
          void main() {
            float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5) * vIntensity;
            gl_FragColor = vec4(glowColor, intensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.glowMeshes.push(mesh);
    }
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      this.autoRotate = false;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        this.autoRotate = true;
      }, 3000);
    };

    const onMouseMoveDrag = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      this.rotateEarth(deltaX * 0.005, deltaY * 0.005);
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    this.canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMoveDrag);
  }

  private rotateEarth(deltaX: number, deltaY: number): void {
    this.countryGroups.forEach(group => {
      group.particles.rotation.y += deltaX;
      group.particles.rotation.x += deltaY;
      group.particles.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, group.particles.rotation.x));
    });
    
    this.glowMeshes.forEach(mesh => {
      mesh.rotation.y += deltaX;
      mesh.rotation.x += deltaY;
    });
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.checkHover();
  }

  private onMouseLeave(): void {
    this.hoveredCountry = null;
    if (this.onCountryHoverCallback) {
      this.onCountryHoverCallback(null);
    }
  }

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const particleSystems = this.countryGroups.map(g => g.particles);
    const intersects = this.raycaster.intersectObjects(particleSystems, false);

    if (intersects.length > 0) {
      const object = intersects[0].object as THREE.Points;
      const countryCode = object.userData.countryCode;
      
      if (countryCode !== this.hoveredCountry) {
        this.hoveredCountry = countryCode;
        const country = getCountries().find(c => c.countryCode === countryCode);
        if (this.onCountryHoverCallback && country) {
          this.onCountryHoverCallback(country);
        }
      }
    } else {
      if (this.hoveredCountry) {
        this.hoveredCountry = null;
        if (this.onCountryHoverCallback) {
          this.onCountryHoverCallback(null);
        }
      }
    }
  }

  public onCountryHover(callback: (country: CountryEmission | null) => void): void {
    this.onCountryHoverCallback = callback;
  }

  public updateParticlesByYear(year: number, animate = true): void {
    this.targetYear = year;
    if (!animate) {
      this.currentYear = year;
      this.yearTransitionProgress = 1;
      this.applyYearColors(year);
    } else {
      this.yearTransitionProgress = 0;
    }
  }

  private applyYearColors(year: number): void {
    const countries = getCountries();
    const maxEmission = Math.max(...countries.map(c => c.emissions[year] || 0));

    this.countryGroups.forEach(group => {
      const country = countries.find(c => c.countryCode === group.countryCode);
      if (!country) return;

      const emission = country.emissions[year] || 0;
      const normalizedEmission = emission / maxEmission;

      const colors = group.particles.geometry.attributes.color as THREE.BufferAttribute;
      const colorArray = colors.array as Float32Array;
      
      const r = 0.0 + normalizedEmission * 0.5;
      const g = 0.9 - normalizedEmission * 0.4;
      const b = 1.0 - normalizedEmission * 0.8;

      for (let i = 0; i < colorArray.length; i += 3) {
        colorArray[i] = r + (Math.random() - 0.5) * 0.1;
        colorArray[i + 1] = g + (Math.random() - 0.5) * 0.1;
        colorArray[i + 2] = b + (Math.random() - 0.5) * 0.1;
      }

      colors.needsUpdate = true;

      const sizes = group.particles.geometry.attributes.size as THREE.BufferAttribute;
      const sizeArray = sizes.array as Float32Array;
      const scale = 0.5 + normalizedEmission * 1.5;
      
      for (let i = 0; i < sizeArray.length; i++) {
        sizeArray[i] = (0.02 + Math.random() * 0.03) * scale;
      }
      sizes.needsUpdate = true;
    });
  }

  public addGlowEffect(lat: number, lng: number, intensity: number, duration: number = 2000): void {
    const position = this.latLngToVector3(lat, lng, this.earthRadius * 1.05);
    
    let glowMesh = this.glowMeshes.find(m => !m.visible);
    if (!glowMesh) {
      glowMesh = this.glowMeshes[0];
    }

    glowMesh.position.copy(position);
    glowMesh.scale.setScalar(0.5);
    glowMesh.visible = true;
    
    const material = glowMesh.material as THREE.ShaderMaterial;
    material.uniforms.intensity.value = 0;

    this.glowEffects.push({
      position,
      startTime: performance.now(),
      duration,
      intensity
    });
  }

  public triggerScenarioGlow(result: ScenarioResult): void {
    const intensity = Math.min(1, result.totalCarbon / 20);
    const countries = getCountries();
    const randomCountries = countries.sort(() => Math.random() - 0.5).slice(0, 3);
    
    randomCountries.forEach((country, index) => {
      setTimeout(() => {
        this.addGlowEffect(country.lat, country.lng, intensity * 0.5, 3000);
      }, index * 200);
    });
  }

  public update(time: number): void {
    if (this.yearTransitionProgress < 1) {
      this.yearTransitionProgress = Math.min(1, this.yearTransitionProgress + 0.02);
      
      if (this.yearTransitionProgress >= 1) {
        this.currentYear = this.targetYear;
        this.applyYearColors(this.currentYear);
      }
    }

    this.countryGroups.forEach(group => {
      const material = group.particles.material as THREE.ShaderMaterial;
      material.uniforms.time.value = time * 0.001;
      material.uniforms.pixelRatio.value = window.devicePixelRatio;
    });

    const now = performance.now();
    this.glowEffects = this.glowEffects.filter(effect => {
      const elapsed = now - effect.startTime;
      const progress = elapsed / effect.duration;
      
      if (progress >= 1) return false;
      return true;
    });

    this.glowMeshes.forEach((mesh, index) => {
      if (!mesh.visible) return;
      
      const effect = this.glowEffects[index];
      if (!effect) {
        mesh.visible = false;
        return;
      }

      const elapsed = now - effect.startTime;
      const progress = elapsed / effect.duration;

      if (progress < 0.3) {
        (mesh.material as THREE.ShaderMaterial).uniforms.intensity.value = 
          (progress / 0.3) * effect.intensity;
      } else {
        (mesh.material as THREE.ShaderMaterial).uniforms.intensity.value = 
          effect.intensity * (1 - (progress - 0.3) / 0.7);
      }

      const scale = 0.5 + progress * 2.5;
      mesh.scale.setScalar(scale);
    });

    if (this.autoRotate) {
      this.countryGroups.forEach(group => {
        group.particles.rotation.y += 0.001;
      });
    }
  }

  public getCurrentYear(): number {
    return this.currentYear;
  }

  public dispose(): void {
    this.countryGroups.forEach(group => {
      group.particles.geometry.dispose();
      (group.particles.material as THREE.Material).dispose();
      this.scene.remove(group.particles);
    });

    this.glowMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.scene.remove(mesh);
    });

    this.countryGroups = [];
    this.glowEffects = [];
    this.glowMeshes = [];
  }
}
