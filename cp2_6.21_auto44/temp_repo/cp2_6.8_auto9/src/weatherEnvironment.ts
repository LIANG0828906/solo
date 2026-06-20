import * as THREE from 'three';
import type { WeatherUpdate, WeatherType } from './types';

const WEATHER_COLORS: Record<WeatherType, { top: THREE.Color; bottom: THREE.Color }> = {
  sunny: {
    top: new THREE.Color(0x4fc3f7),
    bottom: new THREE.Color(0x90caf9)
  },
  cloudy: {
    top: new THREE.Color(0x546e7a),
    bottom: new THREE.Color(0x90a4ae)
  },
  rainy: {
    top: new THREE.Color(0x37474f),
    bottom: new THREE.Color(0x546e7a)
  }
};

interface Cloud {
  mesh: THREE.Mesh;
  baseY: number;
  speed: number;
  amplitude: number;
}

export class WeatherEnvironment {
  private scene: THREE.Scene;
  private skyMesh!: THREE.Mesh;
  private clouds: Cloud[] = [];
  private rainParticles!: THREE.Points;
  private splashParticles!: THREE.Points;
  private currentWeather: WeatherType = 'sunny';
  private targetWeather: WeatherType = 'sunny';
  private weatherTransition: number = 1;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initSky();
    this.initClouds();
    this.initRain();
    this.initSplash();
    this.initGround();
  }

  private initSky(): void {
    const geometry = new THREE.SphereGeometry(100, 32, 32);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: WEATHER_COLORS.sunny.top.clone() },
        bottomColor: { value: WEATHER_COLORS.sunny.bottom.clone() },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `
    });
    this.skyMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.skyMesh);
  }

  private initClouds(): void {
    const cloudGeometry = new THREE.SphereGeometry(1, 16, 16);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < 15; i++) {
      const group = new THREE.Group();
      const count = 3 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < count; j++) {
        const mesh = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
        const scale = 1.5 + Math.random() * 2.5;
        mesh.scale.set(scale, scale * 0.6, scale);
        mesh.position.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 2
        );
        group.add(mesh);
      }

      const baseY = 12 + Math.random() * 8;
      group.position.set(
        (Math.random() - 0.5) * 80,
        baseY,
        -20 - Math.random() * 30
      );

      this.scene.add(group);
      this.clouds.push({
        mesh: group as unknown as THREE.Mesh,
        baseY,
        speed: 0.3 + Math.random() * 0.5,
        amplitude: 0.5 + Math.random() * 0.5
      });
    }
  }

  private initRain(): void {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      velocities[i] = 0.3 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    const material = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.12,
      transparent: true,
      opacity: 0.6
    });

    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  private initSplash(): void {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      sizes[i] = 0.05 + Math.random() * 0.1;
      lifetimes[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.splashParticles = new THREE.Points(geometry, material);
    this.splashParticles.visible = false;
    this.scene.add(this.splashParticles);
  }

  private initGround(): void {
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshLambertMaterial({
      color: 0x1b3a5c
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    this.scene.add(ground);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);
  }

  public update(update: WeatherUpdate): void {
    this.targetWeather = update.currentData.weatherType;
    this.weatherTransition = Math.min(1, this.weatherTransition + 0.02);

    this.time += 0.016;

    this.updateSky(update);
    this.updateClouds(update);
    this.updateRain(update);
    this.updateSplash(update);

    if (this.currentWeather === this.targetWeather) {
      this.weatherTransition = 1;
    } else if (this.weatherTransition >= 1) {
      this.currentWeather = this.targetWeather;
      this.weatherTransition = 0;
    }
  }

  private updateSky(update: WeatherUpdate): void {
    const material = this.skyMesh.material as THREE.ShaderMaterial;
    const currentColors = WEATHER_COLORS[this.currentWeather];
    const targetColors = WEATHER_COLORS[this.targetWeather];
    const t = this.weatherTransition;

    material.uniforms.topColor.value.copy(currentColors.top).lerp(targetColors.top, t);
    material.uniforms.bottomColor.value.copy(currentColors.bottom).lerp(targetColors.bottom, t);
  }

  private updateClouds(update: WeatherUpdate): void {
    const density = update.currentData.weatherType === 'cloudy' ? 1 :
                    update.currentData.weatherType === 'rainy' ? 0.9 : 0.4;
    const windSpeed = update.currentData.windSpeed;

    this.clouds.forEach((cloud, index) => {
      const targetOpacity = density * (0.5 + Math.random() * 0.5);
      cloud.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
          child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.05);
          const gray = update.currentData.weatherType === 'sunny' ? 1.0 : 
                        update.currentData.weatherType === 'cloudy' ? 0.85 : 0.7;
          child.material.color.setRGB(gray, gray, gray);
        }
      });

      cloud.mesh.position.x += cloud.speed * (0.5 + windSpeed * 0.1);
      cloud.mesh.position.y = cloud.baseY + Math.sin(this.time * 0.5 + index) * cloud.amplitude;

      if (cloud.mesh.position.x > 50) {
        cloud.mesh.position.x = -50;
      }
    });
  }

  private updateRain(update: WeatherUpdate): void {
    const isRainy = update.currentData.weatherType === 'rainy';
    const intensity = isRainy ? Math.min(1, update.currentData.precipitation / 100) : 0;

    this.rainParticles.visible = intensity > 0.05;
    this.splashParticles.visible = intensity > 0.05;

    if (intensity <= 0.05) return;

    const positions = this.rainParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const velocities = this.rainParticles.geometry.getAttribute('velocity') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    const velArray = velocities.array as Float32Array;

    for (let i = 0; i < posArray.length / 3; i++) {
      if (Math.random() > intensity) continue;

      posArray[i * 3 + 1] -= velArray[i] * (1 + update.currentData.windSpeed * 0.1);
      posArray[i * 3] += update.currentData.windSpeed * 0.02;

      if (posArray[i * 3 + 1] < 0) {
        posArray[i * 3] = (Math.random() - 0.5) * 60;
        posArray[i * 3 + 1] = 35 + Math.random() * 10;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
    }
    positions.needsUpdate = true;
  }

  private updateSplash(update: WeatherUpdate): void {
    const intensity = update.currentData.weatherType === 'rainy' ? 
                      Math.min(1, update.currentData.precipitation / 100) : 0;

    if (intensity <= 0.05) return;

    const positions = this.splashParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const lifetimes = this.splashParticles.geometry.getAttribute('lifetime') as THREE.BufferAttribute;
    const sizes = this.splashParticles.geometry.getAttribute('size') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    const lifeArray = lifetimes.array as Float32Array;
    const sizeArray = sizes.array as Float32Array;

    for (let i = 0; i < posArray.length / 3; i++) {
      lifeArray[i] += 0.05;

      if (lifeArray[i] > 1) {
        if (Math.random() < intensity * 0.3) {
          posArray[i * 3] = (Math.random() - 0.5) * 60;
          posArray[i * 3 + 1] = 0;
          posArray[i * 3 + 2] = (Math.random() - 0.5) * 40;
          lifeArray[i] = 0;
          sizeArray[i] = 0.05 + Math.random() * 0.1;
        } else {
          posArray[i * 3 + 1] = -10;
        }
      } else {
        posArray[i * 3 + 1] = lifeArray[i] * 1.5;
      }
    }
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
  }
}
