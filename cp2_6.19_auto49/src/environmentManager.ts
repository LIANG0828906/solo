import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { BuildingData, CityBuilder } from './cityBuilder';
import { PlayerState } from './playerController';

export type WeatherType = 'sunny' | 'rainy' | 'snowy';
export type TimeOfDay = 'day' | 'night';

interface ParticleData {
  velocity: THREE.Vector3;
  originalY: number;
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private cityBuilder: CityBuilder;

  public ambientLight: THREE.AmbientLight;
  public directionalLight: THREE.DirectionalLight;
  public hemisphereLight: THREE.HemisphereLight;

  private isNight = false;
  private currentWeather: WeatherType = 'sunny';

  private weatherParticleSystem: THREE.Points | null = null;
  private particleData: ParticleData[] = [];
  private particleOpacity = { value: 0 };

  private streetLights: { light: THREE.PointLight; pole: THREE.Group }[] = [];
  private snowAccumulation: THREE.Mesh | null = null;

  private ripples: { mesh: THREE.Mesh; startTime: number }[] = [];
  private maxRipples = 30;

  private playerPosition = new THREE.Vector3();

  private readonly dayAmbientIntensity = 1.0;
  private readonly nightAmbientIntensity = 0.3;
  private readonly dayDirectionalIntensity = 1.2;
  private readonly nightDirectionalIntensity = 0.2;

  private readonly daySkyColor = new THREE.Color(0x87ceeb);
  private readonly nightSkyColor = new THREE.Color(0x0a0a2a);
  private readonly dayFogColor = new THREE.Color(0xa8c8e8);
  private readonly nightFogColor = new THREE.Color(0x0a0a1a);

  private readonly dayTemp = 6500;
  private readonly nightTemp = 4500;

  constructor(scene: THREE.Scene, cityBuilder: CityBuilder) {
    this.scene = scene;
    this.cityBuilder = cityBuilder;

    this.ambientLight = new THREE.AmbientLight(0xffffff, this.dayAmbientIntensity);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, this.dayDirectionalIntensity);
    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a3a2a, 0.6);

    this.setupLighting();
    this.setupSkyAndFog();
    this.setupStreetLights();
    this.setupSnowAccumulation();
  }

  private setupLighting(): void {
    this.directionalLight.position.set(30, 50, 30);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    this.directionalLight.shadow.camera.left = -60;
    this.directionalLight.shadow.camera.right = 60;
    this.directionalLight.shadow.camera.top = 60;
    this.directionalLight.shadow.camera.bottom = -60;
    this.directionalLight.shadow.bias = -0.001;

    this.applyColorTemperature(this.dayTemp);

    this.scene.add(this.ambientLight);
    this.scene.add(this.directionalLight);
    this.scene.add(this.hemisphereLight);
  }

  private setupSkyAndFog(): void {
    this.scene.background = this.daySkyColor.clone();
    this.scene.fog = new THREE.Fog(this.dayFogColor.getHex(), 50, 120);
  }

  private setupStreetLights(): void {
    const streetPositions = this.cityBuilder.getStreetPositions();
    const filteredPositions: THREE.Vector3[] = [];
    const minDistance = 12;

    for (const pos of streetPositions) {
      let tooClose = false;
      for (const existing of filteredPositions) {
        if (pos.distanceTo(existing) < minDistance) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose && (Math.abs(pos.x) > 5 || Math.abs(pos.z) > 8)) {
        filteredPositions.push(pos);
      }
      if (filteredPositions.length >= 8) break;
    }

    for (const pos of filteredPositions) {
      const lightGroup = this.createStreetLight(pos);
      this.streetLights.push(lightGroup);
      this.scene.add(lightGroup.pole);
    }
  }

  private createStreetLight(position: THREE.Vector3): { light: THREE.PointLight; pole: THREE.Group } {
    const poleGroup = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 5, 8);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.5
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 2.5, 0);
    pole.castShadow = true;
    poleGroup.add(pole);

    const armGeo = new THREE.BoxGeometry(1.5, 0.1, 0.1);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.5
    });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0.75, 4.8, 0);
    poleGroup.add(arm);

    const lampGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const lampMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0
    });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(1.5, 4.8, 0);
    lamp.userData.lampMesh = true;
    poleGroup.add(lamp);

    const glowGeo = new THREE.SphereGeometry(3, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(1.5, 4.8, 0);
    glow.userData.glowMesh = true;
    poleGroup.add(glow);

    const lightHaloGeo = new THREE.SpriteMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const lightHalo = new THREE.Sprite(lightHaloGeo);
    lightHalo.scale.set(6, 6, 1);
    lightHalo.position.set(1.5, 4.8, 0);
    lightHalo.userData.haloSprite = true;
    poleGroup.add(lightHalo);

    const fakeLight: any = {
      intensity: 0,
      position: new THREE.Vector3(1.5, 4.8, 0)
    };

    poleGroup.position.copy(position);
    const angle = Math.random() * Math.PI * 2;
    poleGroup.rotation.y = angle;
    fakeLight.position.add(position);

    return { light: fakeLight as THREE.PointLight, pole: poleGroup };
  }

  private setupSnowAccumulation(): void {
    const snowGeo = new THREE.PlaneGeometry(240, 240, 1, 1);
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      roughness: 0.9,
      metalness: 0.0,
      depthWrite: false
    });
    this.snowAccumulation = new THREE.Mesh(snowGeo, snowMat);
    this.snowAccumulation.rotation.x = -Math.PI / 2;
    this.snowAccumulation.position.y = 0.03;
    this.scene.add(this.snowAccumulation);
  }

  public toggleDayNight(): void {
    this.isNight = !this.isNight;
    this.animateDayNightTransition();
  }

  private animateDayNightTransition(): void {
    const targetAmbient = this.isNight ? this.nightAmbientIntensity : this.dayAmbientIntensity;
    const targetDirectional = this.isNight ? this.nightDirectionalIntensity : this.dayDirectionalIntensity;
    const targetTemp = this.isNight ? this.nightTemp : this.dayTemp;
    const targetSky = this.isNight ? this.nightSkyColor : this.daySkyColor;
    const targetFog = this.isNight ? this.nightFogColor : this.dayFogColor;

    const current = {
      ambient: this.ambientLight.intensity,
      directional: this.directionalLight.intensity,
      temp: this.getColorTemperature(),
      skyR: (this.scene.background as THREE.Color).r,
      skyG: (this.scene.background as THREE.Color).g,
      skyB: (this.scene.background as THREE.Color).b,
      hemi: this.hemisphereLight.intensity
    };

    new TWEEN.Tween(current)
      .to({
        ambient: targetAmbient,
        directional: targetDirectional,
        temp: targetTemp,
        skyR: targetSky.r,
        skyG: targetSky.g,
        skyB: targetSky.b,
        hemi: this.isNight ? 0.2 : 0.6
      }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.ambientLight.intensity = current.ambient;
        this.directionalLight.intensity = current.directional;
        this.applyColorTemperature(current.temp);
        (this.scene.background as THREE.Color).setRGB(current.skyR, current.skyG, current.skyB);
        if (this.scene.fog instanceof THREE.Fog) {
          const fogColor = new THREE.Color().setRGB(
            THREE.MathUtils.lerp(this.dayFogColor.r, this.nightFogColor.r, current.hemi < 0.4 ? 1 : 0),
            THREE.MathUtils.lerp(this.dayFogColor.g, this.nightFogColor.g, current.hemi < 0.4 ? 1 : 0),
            THREE.MathUtils.lerp(this.dayFogColor.b, this.nightFogColor.b, current.hemi < 0.4 ? 1 : 0)
          );
          this.scene.fog.color.copy(fogColor);
        }
        this.hemisphereLight.intensity = current.hemi;
      })
      .start();

    this.animateBuildingWindows();
    this.animateStreetLights();
    this.animateBeacon();
  }

  private getColorTemperature(): number {
    return this.isNight ? this.nightTemp : this.dayTemp;
  }

  private applyColorTemperature(kelvin: number): void {
    const temp = kelvin / 100;
    let red, green, blue: number;

    if (temp <= 66) {
      red = 255;
      green = Math.max(0, Math.min(255, 99.4708025861 * Math.log(temp) - 161.1195681661));
    } else {
      red = Math.max(0, Math.min(255, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
      green = Math.max(0, Math.min(255, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    }

    if (temp >= 66) {
      blue = 255;
    } else if (temp <= 19) {
      blue = 0;
    } else {
      blue = Math.max(0, Math.min(255, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
    }

    const color = new THREE.Color(red / 255, green / 255, blue / 255);
    this.directionalLight.color.copy(color);
  }

  private animateBuildingWindows(): void {
    this.cityBuilder.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData.emissive) {
        const mat = obj.material as THREE.MeshBasicMaterial;
        const shouldLight = this.isNight && Math.random() < 0.85;
        const targetOpacity = shouldLight ? (0.7 + Math.random() * 0.3) : 0;

        const opacityObj = { opacity: mat.opacity };
        new TWEEN.Tween(opacityObj)
          .to({ opacity: targetOpacity }, 1800 + Math.random() * 400)
          .easing(TWEEN.Easing.Cubic.InOut)
          .delay(Math.random() * 500)
          .onUpdate(() => {
            mat.opacity = opacityObj.opacity;
          })
          .start();
      }
    });
  }

  private animateStreetLights(): void {
    for (const { light, pole } of this.streetLights) {
      const targetIntensity = this.isNight ? (1.5 + Math.random() * 1.0) : 0;

      const lightObj = { intensity: light.intensity };
      new TWEEN.Tween(lightObj)
        .to({ intensity: targetIntensity }, 1500 + Math.random() * 500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .delay(Math.random() * 300)
        .onUpdate(() => {
          light.intensity = lightObj.intensity;
        })
        .start();

      pole.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.userData.lampMesh) {
          const mat = obj.material as THREE.MeshBasicMaterial;
          const opacityObj = { opacity: mat.opacity };
          new TWEEN.Tween(opacityObj)
            .to({ opacity: targetIntensity > 0 ? 1 : 0 }, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
              mat.opacity = opacityObj.opacity;
            })
            .start();
        }
        if (obj instanceof THREE.Mesh && obj.userData.glowMesh) {
          const mat = obj.material as THREE.MeshBasicMaterial;
          const targetOpacity = targetIntensity > 0 ? 0.12 : 0;
          const opacityObj = { opacity: mat.opacity };
          new TWEEN.Tween(opacityObj)
            .to({ opacity: targetOpacity }, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
              mat.opacity = opacityObj.opacity;
            })
            .start();
        }
        if (obj instanceof THREE.Sprite && obj.userData.haloSprite) {
          const mat = obj.material as THREE.SpriteMaterial;
          const targetOpacity = targetIntensity > 0 ? 0.3 : 0;
          const opacityObj = { opacity: mat.opacity };
          new TWEEN.Tween(opacityObj)
            .to({ opacity: targetOpacity }, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
              mat.opacity = opacityObj.opacity;
            })
            .start();
        }
      });
    }
  }

  private animateBeacon(): void {
    this.cityBuilder.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && (obj.userData.beaconMesh || obj.userData.beaconGlow)) {
        const mat = obj.material as THREE.MeshBasicMaterial;
        const targetOpacity = obj.userData.beaconGlow
          ? (this.isNight ? 0.35 : 0)
          : (this.isNight ? 1 : 0);

        const opacityObj = { opacity: mat.opacity };
        new TWEEN.Tween(opacityObj)
          .to({ opacity: targetOpacity }, 2000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(() => {
            mat.opacity = opacityObj.opacity;
          })
          .start();
      }
    });
  }

  public setWeather(weather: WeatherType): void {
    if (weather === this.currentWeather) return;

    this.fadeOutWeather(() => {
      this.currentWeather = weather;
      this.setupWeatherParticles();
      this.fadeInWeather();

      if (weather === 'snowy') {
        this.animateSnowAccumulation();
      } else if (this.snowAccumulation) {
        const mat = this.snowAccumulation.material as THREE.MeshStandardMaterial;
        const objO = { opacity: mat.opacity };
        new TWEEN.Tween(objO)
          .to({ opacity: 0 }, 3000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onUpdate(() => {
            mat.opacity = objO.opacity;
          })
          .start();
      }
    });
  }

  private fadeOutWeather(callback: () => void): void {
    if (!this.weatherParticleSystem) {
      callback();
      return;
    }

    const obj = { opacity: this.particleOpacity.value };
    new TWEEN.Tween(obj)
      .to({ opacity: 0 }, 1500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.particleOpacity.value = obj.opacity;
        this.updateParticleOpacity();
      })
      .onComplete(() => {
        this.clearWeatherParticles();
        callback();
      })
      .start();
  }

  private fadeInWeather(): void {
    if (!this.weatherParticleSystem) return;

    const obj = { opacity: 0 };
    new TWEEN.Tween(obj)
      .to({ opacity: 1 }, 1500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.particleOpacity.value = obj.opacity;
        this.updateParticleOpacity();
      })
      .start();
  }

  private setupWeatherParticles(): void {
    this.clearWeatherParticles();

    if (this.currentWeather === 'sunny') return;

    let particleCount: number;
    let color: number;
    let size: number;

    if (this.currentWeather === 'rainy') {
      particleCount = 700;
      color = 0x6699cc;
      size = 0.12;
    } else {
      particleCount = 450;
      color = 0xffffff;
      size = 0.18;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: ParticleData[] = [];

    const bounds = this.cityBuilder.getBounds();
    const rangeX = bounds.maxX - bounds.minX;
    const rangeZ = bounds.maxZ - bounds.minZ;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = bounds.minX + Math.random() * rangeX;
      positions[i3 + 1] = 5 + Math.random() * 30;
      positions[i3 + 2] = bounds.minZ + Math.random() * rangeZ;

      const vy = this.currentWeather === 'rainy'
        ? -(6 + Math.random() * 2)
        : -(2 + Math.random() * 1);
      const vx = this.currentWeather === 'snowy'
        ? (Math.random() - 0.5) * 0.8
        : 0;
      const vz = this.currentWeather === 'snowy'
        ? (Math.random() - 0.5) * 0.5
        : -1.5;

      velocities.push({
        velocity: new THREE.Vector3(vx, vy, vz),
        originalY: positions[i3 + 1]
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.weatherParticleSystem = new THREE.Points(geometry, material);
    this.particleData = velocities;
    this.scene.add(this.weatherParticleSystem);
  }

  private clearWeatherParticles(): void {
    if (this.weatherParticleSystem) {
      this.scene.remove(this.weatherParticleSystem);
      this.weatherParticleSystem.geometry.dispose();
      (this.weatherParticleSystem.material as THREE.Material).dispose();
      this.weatherParticleSystem = null;
    }
    this.particleData = [];
    this.particleOpacity.value = 0;
  }

  private updateParticleOpacity(): void {
    if (this.weatherParticleSystem) {
      const mat = this.weatherParticleSystem.material as THREE.PointsMaterial;
      mat.opacity = this.particleOpacity.value * (this.currentWeather === 'rainy' ? 0.75 : 0.9);
    }
  }

  private animateSnowAccumulation(): void {
    if (!this.snowAccumulation) return;

    const mat = this.snowAccumulation.material as THREE.MeshStandardMaterial;
    const obj = { opacity: mat.opacity };
    new TWEEN.Tween(obj)
      .to({ opacity: 0.3 }, 8000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        mat.opacity = obj.opacity;
      })
      .start();
  }

  public update(deltaTime: number): void {
    TWEEN.update();
    this.updateWeatherParticles(deltaTime);
    this.updateRipples(deltaTime);
    this.updateWeatherFog(deltaTime);
  }

  private updateWeatherParticles(deltaTime: number): void {
    if (!this.weatherParticleSystem || this.particleData.length === 0) return;

    const positions = this.weatherParticleSystem.geometry.attributes.position.array as Float32Array;
    const bounds = this.cityBuilder.getBounds();
    const rangeX = bounds.maxX - bounds.minX;
    const rangeZ = bounds.maxZ - bounds.minZ;
    const time = performance.now() * 0.001;

    for (let i = 0; i < this.particleData.length; i++) {
      const i3 = i * 3;
      const data = this.particleData[i];

      if (this.currentWeather === 'snowy') {
        const sway = Math.sin(time * 1.5 + i * 0.1) * 0.4;
        positions[i3] += (data.velocity.x + sway * 0.3) * deltaTime;
      } else {
        positions[i3] += data.velocity.x * deltaTime;
      }
      positions[i3 + 1] += data.velocity.y * deltaTime;
      positions[i3 + 2] += data.velocity.z * deltaTime;

      if (positions[i3 + 1] < 0) {
        if (this.currentWeather === 'rainy' && Math.random() < 0.08) {
          this.spawnRipple(positions[i3], positions[i3 + 2]);
        }
        positions[i3 + 1] = 30 + Math.random() * 10;
        positions[i3] = bounds.minX + Math.random() * rangeX;
        positions[i3 + 2] = bounds.minZ + Math.random() * rangeZ;
      }
    }

    this.weatherParticleSystem.geometry.attributes.position.needsUpdate = true;
  }

  private spawnRipple(x: number, z: number): void {
    if (this.ripples.length >= this.maxRipples) return;

    const rippleGeo = new THREE.RingGeometry(0.05, 0.15, 16);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xaaccff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(x, 0.04, z);
    this.scene.add(ripple);
    this.ripples.push({ mesh: ripple, startTime: performance.now() });
  }

  private updateRipples(deltaTime: number): void {
    const now = performance.now();
    this.ripples = this.ripples.filter((ripple) => {
      const elapsed = (now - ripple.startTime) / 1000;
      const lifetime = 0.6;

      if (elapsed >= lifetime) {
        this.scene.remove(ripple.mesh);
        ripple.mesh.geometry.dispose();
        (ripple.mesh.material as THREE.Material).dispose();
        return false;
      }

      const progress = elapsed / lifetime;
      const scale = 1 + progress * 8;
      ripple.mesh.scale.set(scale, scale, 1);
      const mat = ripple.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.6 * (1 - progress);
      return true;
    });
  }

  private updateWeatherFog(deltaTime: number): void {
    if (!this.scene.fog || !(this.scene.fog instanceof THREE.Fog)) return;

    let targetFar = this.isNight ? 90 : 120;
    if (this.currentWeather === 'rainy') {
      targetFar = this.isNight ? 50 : 70;
    } else if (this.currentWeather === 'snowy') {
      targetFar = this.isNight ? 45 : 60;
    }

    this.scene.fog.far = THREE.MathUtils.lerp(this.scene.fog.far, targetFar, deltaTime * 0.5);
  }

  public updatePlayerPosition(state: PlayerState): void {
    this.playerPosition.copy(state.position);

    for (const { light, pole } of this.streetLights) {
      const distance = this.playerPosition.distanceTo(pole.position);
      if (distance < 20) {
        const boost = THREE.MathUtils.smoothstep(20 - distance, 0, 20) * 0.5;
        if (this.isNight) {
          light.intensity = Math.min(2.5, light.intensity + boost * 0.02);
        }
      }
    }
  }

  public getIsNight(): boolean {
    return this.isNight;
  }

  public getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }
}
