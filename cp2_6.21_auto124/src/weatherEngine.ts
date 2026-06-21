import { TimeController, ColorTone } from './timeController';

export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'thunderstorm' | 'snow' | 'fog';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  opacity: number;
  fadeDirection: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  phase: number;
  layer: number;
  baseOpacity: number;
}

interface SplashParticle {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  active: boolean;
}

interface GrassBlade {
  x: number;
  baseY: number;
  height: number;
  frequency: number;
  amplitude: number;
  phase: number;
  thickness: number;
  colorR: number;
  colorG: number;
  colorB: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  baseOpacity: number;
  speed: number;
  active: boolean;
  fadeDirection: number;
  opacity: number;
}

interface WeatherParams {
  sunIntensity: number;
  grassHue: number;
  cloudSpeed: number;
  cloudLayers: number;
  rainCount: number;
  rainWind: number;
  lightningFreq: number;
  lightningBright: number;
  snowCount: number;
  snowWind: number;
  fogDensity: number;
  fogColor: string;
}

export class WeatherEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private timeController: TimeController;
  private width: number;
  private height: number;

  private currentWeather: WeatherType = 'sunny';
  private targetWeather: WeatherType = 'sunny';
  private transitionProgress: number = 1;
  private transitionDuration: number = 500;
  private isTransitioning: boolean = false;

  private rainTransitionOpacity: number = 0;
  private snowTransitionOpacity: number = 0;
  private cloudTransitionOpacity: number = 0;

  private params: WeatherParams = {
    sunIntensity: 1.0,
    grassHue: 0,
    cloudSpeed: 1.0,
    cloudLayers: 5,
    rainCount: 200,
    rainWind: 2,
    lightningFreq: 5,
    lightningBright: 0.8,
    snowCount: 150,
    snowWind: 2,
    fogDensity: 0.5,
    fogColor: '#b0bec5'
  };

  private rainPool: Particle[] = [];
  private snowPool: Particle[] = [];
  private cloudPool: Cloud[] = [];
  private splashPool: SplashParticle[] = [];
  private grassBlades: GrassBlade[] = [];

  private maxRain: number = 500;
  private maxSnow: number = 300;
  private maxClouds: number = 20;
  private maxSplashes: number = 100;

  private lightningActive: boolean = false;
  private lightningTimer: number = 0;
  private nextLightningTime: number = 5000;
  private lightningFlashTimer: number = 0;
  private lightningFlashDuration: number = 100;

  private thunderTextTimer: number = 0;
  private thunderTextDuration: number = 1000;
  private thunderTextActive: boolean = false;

  private grassPhase: number = 0;
  private fogOpacity: number = 0;

  private onThunder: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, timeController: TimeController) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.timeController = timeController;
    this.width = canvas.width;
    this.height = canvas.height;

    this.initPools();
  }

  setOnThunder(callback: () => void): void {
    this.onThunder = callback;
  }

  private initPools(): void {
    for (let i = 0; i < this.maxRain; i++) {
      this.rainPool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        active: false, opacity: 0, fadeDirection: 0,
        size: 0, rotation: 0, rotationSpeed: 0,
        phase: 0, layer: 0, baseOpacity: 0
      });
    }

    for (let i = 0; i < this.maxSnow; i++) {
      this.snowPool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        active: false, opacity: 0, fadeDirection: 0,
        size: 0, rotation: 0, rotationSpeed: 0,
        phase: 0, layer: 0, baseOpacity: 0
      });
    }

    for (let i = 0; i < this.maxClouds; i++) {
      this.cloudPool.push({
        x: 0, y: 0, width: 0, height: 0,
        baseOpacity: 0, speed: 0,
        active: false, fadeDirection: 0, opacity: 0
      });
    }

    for (let i = 0; i < this.maxSplashes; i++) {
      this.splashPool.push({
        x: 0, y: 0, radius: 2, life: 0, maxLife: 200, active: false
      });
    }

    this.initGrassBlades();
  }

  private initGrassBlades(): void {
    const grassTop = this.height * 0.65;
    const count = 120;

    for (let i = 0; i < count; i++) {
      this.grassBlades.push({
        x: (i / count) * this.width + (Math.random() - 0.5) * 12,
        baseY: grassTop + 3 + Math.random() * 10,
        height: 8 + Math.random() * 7,
        frequency: 0.8 + Math.random() * 1.8,
        amplitude: 2 + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
        thickness: 1 + Math.random() * 1.5,
        colorR: 70 + Math.floor(Math.random() * 15),
        colorG: 150 + Math.floor(Math.random() * 35),
        colorB: 65 + Math.floor(Math.random() * 20)
      });
    }
  }

  init(): void {
    this.setWeather('sunny');
  }

  setWeather(weather: WeatherType): void {
    if (weather === this.targetWeather && !this.isTransitioning) return;

    this.targetWeather = weather;
    this.isTransitioning = true;
    this.transitionProgress = 0;

    if (this.weatherHasRain(weather) || this.weatherHasRain(this.currentWeather)) {
      this.prepareRainForTransition(weather);
    }
    if (this.weatherHasSnow(weather) || this.weatherHasSnow(this.currentWeather)) {
      this.prepareSnowForTransition(weather);
    }
    if (this.weatherHasCloud(weather) || this.weatherHasCloud(this.currentWeather)) {
      this.prepareCloudForTransition(weather);
    }

    if (weather === 'thunderstorm' || this.currentWeather === 'thunderstorm') {
      this.resetLightning();
    }
  }

  private weatherHasRain(weather: WeatherType): boolean {
    return weather === 'rain' || weather === 'thunderstorm';
  }

  private weatherHasSnow(weather: WeatherType): boolean {
    return weather === 'snow';
  }

  private weatherHasCloud(weather: WeatherType): boolean {
    return weather === 'cloudy' || weather === 'rain' ||
           weather === 'thunderstorm' || weather === 'snow';
  }

  private prepareRainForTransition(target: WeatherType): void {
    const targetHasRain = this.weatherHasRain(target);
    const currentHasRain = this.weatherHasRain(this.currentWeather);

    if (targetHasRain && !currentHasRain) {
      this.activateRainParticles(this.params.rainCount);
    }
  }

  private prepareSnowForTransition(target: WeatherType): void {
    const targetHasSnow = this.weatherHasSnow(target);
    const currentHasSnow = this.weatherHasSnow(this.currentWeather);

    if (targetHasSnow && !currentHasSnow) {
      this.activateSnowParticles(this.params.snowCount);
    }
  }

  private prepareCloudForTransition(target: WeatherType): void {
    const targetHasCloud = this.weatherHasCloud(target);
    const currentHasCloud = this.weatherHasCloud(this.currentWeather);

    if (targetHasCloud && !currentHasCloud) {
      this.activateCloudParticles(this.params.cloudLayers);
    }
  }

  private activateRainParticles(count: number): void {
    let activated = 0;
    for (const p of this.rainPool) {
      if (activated >= count) break;
      if (!p.active) {
        this.resetRainParticle(p);
        p.active = true;
        p.opacity = p.baseOpacity;
        p.fadeDirection = 0;
        activated++;
      }
    }
  }

  private activateSnowParticles(count: number): void {
    let activated = 0;
    for (const p of this.snowPool) {
      if (activated >= count) break;
      if (!p.active) {
        this.resetSnowParticle(p);
        p.active = true;
        p.opacity = p.baseOpacity;
        p.fadeDirection = 0;
        activated++;
      }
    }
  }

  private activateCloudParticles(count: number): void {
    let activated = 0;
    for (const c of this.cloudPool) {
      if (activated >= count) break;
      if (!c.active) {
        this.resetCloudParticle(c);
        c.active = true;
        c.opacity = c.baseOpacity;
        c.fadeDirection = 0;
        activated++;
      }
    }
  }

  private deactivateRainParticles(): void {
    for (const p of this.rainPool) {
      p.active = false;
      p.fadeDirection = 0;
    }
  }

  private deactivateSnowParticles(): void {
    for (const p of this.snowPool) {
      p.active = false;
      p.fadeDirection = 0;
    }
  }

  private deactivateCloudParticles(): void {
    for (const c of this.cloudPool) {
      c.active = false;
      c.fadeDirection = 0;
    }
  }

  private resetRainParticle(p: Particle): void {
    p.x = Math.random() * this.width;
    p.y = Math.random() * this.height;
    p.size = 8 + Math.random() * 4;

    const windFactor = this.params.rainWind / 5;
    const angle = (10 + windFactor * 35) * Math.PI / 180;
    const speed = 8 + Math.random() * 4;

    p.vx = Math.sin(angle) * speed;
    p.vy = Math.cos(angle) * speed;
    p.baseOpacity = 0.3 + Math.random() * 0.3;
    p.layer = 0;
  }

  private resetSnowParticle(p: Particle): void {
    p.x = Math.random() * this.width;
    p.y = Math.random() * this.height;
    p.size = 3 + Math.random() * 3;
    p.vy = 0.5 + Math.random() * 1.5;
    p.vx = 0;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotationSpeed = (Math.random() - 0.5) * 0.05;
    p.phase = Math.random() * Math.PI * 2;
    p.baseOpacity = 0.7 + Math.random() * 0.3;
    p.layer = Math.floor(Math.random() * 3);
  }

  private resetCloudParticle(c: Cloud): void {
    c.x = Math.random() * this.width;
    c.y = 30 + Math.random() * 120;
    c.width = 80 + Math.random() * 120;
    c.height = 30 + Math.random() * 40;
    c.speed = 0.3 + Math.random() * 0.7;
    c.baseOpacity = this.getCloudBaseOpacity();
  }

  private getCloudBaseOpacity(): number {
    switch (this.targetWeather) {
      case 'sunny': return 0;
      case 'cloudy': return 0.7;
      case 'rain':
      case 'thunderstorm': return 0.85;
      case 'snow': return 0.6;
      default: return 0;
    }
  }

  getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  getTargetWeather(): WeatherType {
    return this.targetWeather;
  }

  setParam<K extends keyof WeatherParams>(key: K, value: WeatherParams[K]): void {
    this.params[key] = value;

    if (key === 'rainCount') {
      this.adjustRainCount();
    } else if (key === 'snowCount') {
      this.adjustSnowCount();
    } else if (key === 'cloudLayers') {
      this.adjustCloudLayers();
    } else if (key === 'rainWind') {
      this.updateRainWind();
    } else if (key === 'snowWind') {
      this.updateSnowWind();
    }
  }

  getParam<K extends keyof WeatherParams>(key: K): WeatherParams[K] {
    return this.params[key];
  }

  private adjustRainCount(): void {
    if (!this.weatherHasRain(this.targetWeather) && !this.isTransitioning) return;

    const target = this.params.rainCount;
    const activeCount = this.rainPool.filter(p => p.active).length;

    if (activeCount < target) {
      let toAdd = target - activeCount;
      for (const p of this.rainPool) {
        if (toAdd <= 0) break;
        if (!p.active) {
          this.resetRainParticle(p);
          p.active = true;
          p.opacity = 0;
          p.fadeDirection = 1;
          toAdd--;
        }
      }
    } else if (activeCount > target) {
      let toRemove = activeCount - target;
      for (const p of this.rainPool) {
        if (toRemove <= 0) break;
        if (p.active && p.fadeDirection === 0) {
          p.fadeDirection = -1;
          toRemove--;
        }
      }
    }
  }

  private adjustSnowCount(): void {
    if (!this.weatherHasSnow(this.targetWeather) && !this.isTransitioning) return;

    const target = this.params.snowCount;
    const activeCount = this.snowPool.filter(p => p.active).length;

    if (activeCount < target) {
      let toAdd = target - activeCount;
      for (const p of this.snowPool) {
        if (toAdd <= 0) break;
        if (!p.active) {
          this.resetSnowParticle(p);
          p.active = true;
          p.opacity = 0;
          p.fadeDirection = 1;
          toAdd--;
        }
      }
    } else if (activeCount > target) {
      let toRemove = activeCount - target;
      for (const p of this.snowPool) {
        if (toRemove <= 0) break;
        if (p.active && p.fadeDirection === 0) {
          p.fadeDirection = -1;
          toRemove--;
        }
      }
    }
  }

  private adjustCloudLayers(): void {
    if (!this.weatherHasCloud(this.targetWeather) && !this.isTransitioning) return;

    const target = this.params.cloudLayers;
    const activeCount = this.cloudPool.filter(c => c.active).length;

    if (activeCount < target) {
      let toAdd = target - activeCount;
      for (const c of this.cloudPool) {
        if (toAdd <= 0) break;
        if (!c.active) {
          this.resetCloudParticle(c);
          c.active = true;
          c.opacity = 0;
          c.fadeDirection = 1;
          toAdd--;
        }
      }
    } else if (activeCount > target) {
      let toRemove = activeCount - target;
      for (const c of this.cloudPool) {
        if (toRemove <= 0) break;
        if (c.active && c.fadeDirection === 0) {
          c.fadeDirection = -1;
          toRemove--;
        }
      }
    }
  }

  private updateRainWind(): void {
    const windFactor = this.params.rainWind / 5;
    const angle = (10 + windFactor * 35) * Math.PI / 180;

    for (const p of this.rainPool) {
      if (!p.active) continue;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      p.vx = Math.sin(angle) * speed;
      p.vy = Math.cos(angle) * speed;
    }
  }

  private updateSnowWind(): void {
  }

  update(deltaTime: number): void {
    this.grassPhase += deltaTime * 0.002;

    if (this.isTransitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.isTransitioning = false;
        this.finishTransition();
      }
      this.updateTransitionOpacities();
    }

    this.updateRain(deltaTime);
    this.updateSnow(deltaTime);
    this.updateClouds(deltaTime);
    this.updateSplashes(deltaTime);

    if (this.targetWeather === 'thunderstorm') {
      this.updateLightning(deltaTime);
    }

    this.updateThunderText(deltaTime);
  }

  private updateTransitionOpacities(): void {
    const progress = this.easeInOutCubic(this.transitionProgress);

    const currentHasRain = this.weatherHasRain(this.currentWeather);
    const targetHasRain = this.weatherHasRain(this.targetWeather);
    const currentHasSnow = this.weatherHasSnow(this.currentWeather);
    const targetHasSnow = this.weatherHasSnow(this.targetWeather);
    const currentHasCloud = this.weatherHasCloud(this.currentWeather);
    const targetHasCloud = this.weatherHasCloud(this.targetWeather);

    if (currentHasRain && targetHasRain) {
      this.rainTransitionOpacity = 1;
    } else if (currentHasRain) {
      this.rainTransitionOpacity = 1 - progress;
    } else if (targetHasRain) {
      this.rainTransitionOpacity = progress;
    } else {
      this.rainTransitionOpacity = 0;
    }

    if (currentHasSnow && targetHasSnow) {
      this.snowTransitionOpacity = 1;
    } else if (currentHasSnow) {
      this.snowTransitionOpacity = 1 - progress;
    } else if (targetHasSnow) {
      this.snowTransitionOpacity = progress;
    } else {
      this.snowTransitionOpacity = 0;
    }

    if (currentHasCloud && targetHasCloud) {
      this.cloudTransitionOpacity = 1;
    } else if (currentHasCloud) {
      this.cloudTransitionOpacity = 1 - progress;
    } else if (targetHasCloud) {
      this.cloudTransitionOpacity = progress;
    } else {
      this.cloudTransitionOpacity = 0;
    }

    const currentHasFog = this.currentWeather === 'fog';
    const targetHasFog = this.targetWeather === 'fog';
    if (currentHasFog && targetHasFog) {
      this.fogOpacity = this.params.fogDensity;
    } else if (currentHasFog) {
      this.fogOpacity = this.params.fogDensity * (1 - progress);
    } else if (targetHasFog) {
      this.fogOpacity = this.params.fogDensity * progress;
    } else {
      this.fogOpacity = 0;
    }
  }

  private finishTransition(): void {
    this.currentWeather = this.targetWeather;

    if (!this.weatherHasRain(this.targetWeather)) {
      this.deactivateRainParticles();
    }
    if (!this.weatherHasSnow(this.targetWeather)) {
      this.deactivateSnowParticles();
    }
    if (!this.weatherHasCloud(this.targetWeather)) {
      this.deactivateCloudParticles();
    }

    this.rainTransitionOpacity = this.weatherHasRain(this.targetWeather) ? 1 : 0;
    this.snowTransitionOpacity = this.weatherHasSnow(this.targetWeather) ? 1 : 0;
    this.cloudTransitionOpacity = this.weatherHasCloud(this.targetWeather) ? 1 : 0;

    if (this.targetWeather === 'fog') {
      this.fogOpacity = this.params.fogDensity;
    }

    if (this.weatherHasRain(this.targetWeather)) {
      this.adjustRainCount();
    }
    if (this.weatherHasSnow(this.targetWeather)) {
      this.adjustSnowCount();
    }
    if (this.weatherHasCloud(this.targetWeather)) {
      this.adjustCloudLayers();
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private updateRain(deltaTime: number): void {
    const dt = deltaTime / 16.67;

    for (const p of this.rainPool) {
      if (!p.active) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.y > this.height - 80) {
        this.spawnSplash(p.x, this.height - 80);
        p.x = Math.random() * this.width;
        p.y = -10;
      }

      if (p.x < -50) {
        p.x = this.width + 10;
      } else if (p.x > this.width + 50) {
        p.x = -10;
      }

      if (p.fadeDirection > 0) {
        p.opacity = Math.min(p.baseOpacity, p.opacity + deltaTime * 0.003);
        if (p.opacity >= p.baseOpacity) p.fadeDirection = 0;
      } else if (p.fadeDirection < 0) {
        p.opacity = Math.max(0, p.opacity - deltaTime * 0.003);
        if (p.opacity <= 0) {
          p.active = false;
          p.fadeDirection = 0;
        }
      }
    }
  }

  private updateSnow(deltaTime: number): void {
    const dt = deltaTime / 16.67;
    const windFactor = this.params.snowWind / 5;
    const windOffset = windFactor * 2;

    for (const p of this.snowPool) {
      if (!p.active) continue;

      p.phase += deltaTime * 0.003 * (1 + p.layer * 0.5);
      const sway = Math.sin(p.phase) * (10 + p.layer * 10);

      p.x += (windOffset + sway * 0.1) * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotationSpeed * dt;

      if (p.y > this.height - 60) {
        p.x = Math.random() * this.width;
        p.y = -10;
      }

      if (p.x < -50) {
        p.x = this.width + 10;
      } else if (p.x > this.width + 50) {
        p.x = -10;
      }

      if (p.fadeDirection > 0) {
        p.opacity = Math.min(p.baseOpacity, p.opacity + deltaTime * 0.002);
        if (p.opacity >= p.baseOpacity) p.fadeDirection = 0;
      } else if (p.fadeDirection < 0) {
        p.opacity = Math.max(0, p.opacity - deltaTime * 0.002);
        if (p.opacity <= 0) {
          p.active = false;
          p.fadeDirection = 0;
        }
      }
    }
  }

  private updateClouds(deltaTime: number): void {
    const dt = deltaTime / 16.67;
    const speedMult = this.params.cloudSpeed;

    for (const c of this.cloudPool) {
      if (!c.active) continue;

      c.x += c.speed * speedMult * dt;

      if (c.x > this.width + c.width) {
        c.x = -c.width;
        c.y = 30 + Math.random() * 120;
      }

      if (c.fadeDirection > 0) {
        c.opacity = Math.min(c.baseOpacity, c.opacity + deltaTime * 0.001);
        if (c.opacity >= c.baseOpacity) c.fadeDirection = 0;
      } else if (c.fadeDirection < 0) {
        c.opacity = Math.max(0, c.opacity - deltaTime * 0.002);
        if (c.opacity <= 0) {
          c.active = false;
          c.fadeDirection = 0;
        }
      }
    }
  }

  private spawnSplash(x: number, y: number): void {
    for (const s of this.splashPool) {
      if (!s.active) {
        s.active = true;
        s.x = x;
        s.y = y;
        s.radius = 2;
        s.life = 0;
        s.maxLife = 200;
        break;
      }
    }
  }

  private updateSplashes(deltaTime: number): void {
    for (const s of this.splashPool) {
      if (!s.active) continue;

      s.life += deltaTime;
      s.radius = 2 + (s.life / s.maxLife) * 3;

      if (s.life >= s.maxLife) {
        s.active = false;
      }
    }
  }

  private updateLightning(deltaTime: number): void {
    if (this.isTransitioning) return;

    this.lightningTimer += deltaTime;

    if (!this.lightningActive && this.lightningTimer >= this.nextLightningTime * 1000) {
      this.triggerLightning();
    }

    if (this.lightningActive) {
      this.lightningFlashTimer += deltaTime;
      if (this.lightningFlashTimer >= this.lightningFlashDuration) {
        this.lightningActive = false;
        this.lightningFlashTimer = 0;
      }
    }
  }

  private triggerLightning(): void {
    this.lightningActive = true;
    this.lightningFlashTimer = 0;
    this.lightningTimer = 0;

    const minFreq = this.params.lightningFreq * 0.6;
    const maxFreq = this.params.lightningFreq * 1.6;
    this.nextLightningTime = minFreq + Math.random() * (maxFreq - minFreq);

    const thunderDelay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      this.showThunderText();
      if (this.onThunder) {
        this.onThunder();
      }
    }, thunderDelay);
  }

  private showThunderText(): void {
    this.thunderTextActive = true;
    this.thunderTextTimer = 0;
  }

  private updateThunderText(deltaTime: number): void {
    if (this.thunderTextActive) {
      this.thunderTextTimer += deltaTime;
      if (this.thunderTextTimer >= this.thunderTextDuration) {
        this.thunderTextActive = false;
      }
    }
  }

  isThunderTextActive(): boolean {
    return this.thunderTextActive;
  }

  private resetLightning(): void {
    this.lightningActive = false;
    this.lightningTimer = 0;
    this.nextLightningTime = 3000 + Math.random() * 5000;
    this.thunderTextActive = false;
    this.thunderTextTimer = 0;
  }

  render(): void {
    const tone = this.timeController.getCurrentColorTone();

    this.drawSky(tone);
    this.drawMountains(tone);
    this.drawSun(tone);
    this.drawClouds(tone);
    this.drawGrass(tone);
    this.drawRain(tone);
    this.drawSnow(tone);
    this.drawSplashes(tone);
    this.drawFog(tone);
    this.drawLightning(tone);
  }

  private drawSky(tone: ColorTone): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.7);
    gradient.addColorStop(0, tone.skyTop);
    gradient.addColorStop(1, tone.skyBottom);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawMountains(tone: ColorTone): void {
    const mountainY = this.height * 0.55;

    this.ctx.fillStyle = tone.mountainColor;
    this.ctx.beginPath();
    this.ctx.moveTo(0, mountainY + 80);

    this.ctx.lineTo(100, mountainY - 20);
    this.ctx.lineTo(180, mountainY + 30);
    this.ctx.lineTo(280, mountainY - 50);
    this.ctx.lineTo(380, mountainY + 10);
    this.ctx.lineTo(500, mountainY - 40);
    this.ctx.lineTo(600, mountainY + 20);
    this.ctx.lineTo(700, mountainY - 30);
    this.ctx.lineTo(this.width, mountainY + 50);

    this.ctx.lineTo(this.width, this.height);
    this.ctx.lineTo(0, this.height);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawSun(tone: ColorTone): void {
    if (tone.isNight) return;
    if (this.cloudTransitionOpacity > 0.5 && this.weatherHasCloud(this.targetWeather) && this.targetWeather !== 'sunny') return;

    const isSunny = this.targetWeather === 'sunny' ||
                    (this.isTransitioning && this.currentWeather === 'sunny');

    const sunX = this.width * 0.78;
    const sunY = this.height * 0.18;
    const sunRadius = 40 * this.params.sunIntensity;

    const glowRadius = isSunny ? 100 * this.params.sunIntensity : sunRadius * 3;
    const glowIntensity = isSunny
      ? 0.65 * this.params.sunIntensity * (1 - this.cloudTransitionOpacity * 0.3)
      : 0.4 * this.params.sunIntensity * (1 - this.cloudTransitionOpacity * 0.5);

    const glowGradient = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowRadius);
    if (isSunny) {
      glowGradient.addColorStop(0, `rgba(255, 248, 220, ${glowIntensity})`);
      glowGradient.addColorStop(0.2, `rgba(255, 230, 140, ${glowIntensity * 0.85})`);
      glowGradient.addColorStop(0.5, `rgba(255, 200, 80, ${glowIntensity * 0.5})`);
      glowGradient.addColorStop(1, 'rgba(255, 180, 50, 0)');
    } else {
      glowGradient.addColorStop(0, `rgba(255, 236, 179, ${glowIntensity})`);
      glowGradient.addColorStop(0.5, `rgba(255, 193, 7, ${glowIntensity * 0.5})`);
      glowGradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
    }

    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();

    if (isSunny) {
      this.drawSunRays(sunX, sunY, glowRadius * 0.9, glowIntensity * 0.7);
    }

    const sunGradient = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    sunGradient.addColorStop(0, '#ffffff');
    sunGradient.addColorStop(0.4, '#fff9c4');
    sunGradient.addColorStop(1, '#ffeb3b');

    this.ctx.fillStyle = sunGradient;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawSunRays(sunX: number, sunY: number, maxRadius: number, intensity: number): void {
    const rayCount = 16;
    const innerRadius = 50;

    this.ctx.save();
    this.ctx.translate(sunX, sunY);

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + this.grassPhase * 0.05;
      const rayWidth = 0.06 + (i % 3) * 0.04;
      const rayLength = maxRadius * (0.6 + (i % 4) * 0.12);
      const tipAlpha = intensity * (0.25 + (i % 5) * 0.08);

      const x1 = Math.cos(angle - rayWidth) * innerRadius;
      const y1 = Math.sin(angle - rayWidth) * innerRadius;
      const x2 = Math.cos(angle + rayWidth) * innerRadius;
      const y2 = Math.sin(angle + rayWidth) * innerRadius;
      const xt = Math.cos(angle) * rayLength;
      const yt = Math.sin(angle) * rayLength;

      const rayGradient = this.ctx.createLinearGradient(
        (x1 + x2) / 2, (y1 + y2) / 2, xt, yt
      );
      rayGradient.addColorStop(0, `rgba(255, 240, 180, ${tipAlpha})`);
      rayGradient.addColorStop(1, 'rgba(255, 220, 120, 0)');

      this.ctx.fillStyle = rayGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(xt, yt);
      this.ctx.lineTo(x2, y2);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawClouds(tone: ColorTone): void {
    if (this.cloudTransitionOpacity <= 0) return;

    for (const c of this.cloudPool) {
      if (!c.active || c.opacity <= 0) continue;

      const opacity = c.opacity * this.cloudTransitionOpacity;
      const cloudColor = tone.isNight
        ? `rgba(60, 70, 90, ${opacity * 0.6})`
        : `rgba(255, 255, 255, ${opacity})`;

      this.drawCloudShape(c.x, c.y, c.width, c.height, cloudColor);
    }
  }

  private drawCloudShape(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();

    this.ctx.ellipse(x, y, w * 0.4, h * 0.6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(x - w * 0.3, y + h * 0.2, w * 0.3, h * 0.45, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(x + w * 0.35, y + h * 0.15, w * 0.35, h * 0.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(x + w * 0.1, y - h * 0.3, w * 0.25, h * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawGrass(tone: ColorTone): void {
    const grassTop = this.height * 0.65;
    const grassBottom = this.height;

    let grassTopColor = tone.grassTop;
    let grassBottomColor = tone.grassBottom;

    if (this.params.grassHue !== 0) {
      grassTopColor = this.shiftHue(tone.grassTop, this.params.grassHue);
      grassBottomColor = this.shiftHue(tone.grassBottom, this.params.grassHue);
    }

    const gradient = this.ctx.createLinearGradient(0, grassTop, 0, grassBottom);
    gradient.addColorStop(0, grassTopColor);
    gradient.addColorStop(1, grassBottomColor);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, grassTop, this.width, grassBottom - grassTop);

    if (this.targetWeather === 'sunny' && !tone.isNight) {
      const highlightGradient = this.ctx.createLinearGradient(0, grassTop, 0, grassTop + 40);
      highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.15 * this.params.sunIntensity})`);
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = highlightGradient;
      this.ctx.fillRect(0, grassTop, this.width, 40);
    }

    this.drawGrassBlades(grassTop, tone);
  }

  private drawGrassBlades(grassTop: number, tone: ColorTone): void {
    const isSunnyDay = (this.targetWeather === 'sunny' ||
                        (this.isTransitioning && this.currentWeather === 'sunny')) && !tone.isNight;

    if (isSunnyDay) {
      for (const blade of this.grassBlades) {
        const sway = Math.sin(this.grassPhase * blade.frequency + blade.phase) * blade.amplitude;
        const midY = blade.baseY - blade.height * 0.5;
        const tipX = blade.x + sway * 1.5;
        const tipY = blade.baseY - blade.height;
        const ctrlX = blade.x + sway * 0.7;

        const bladeColor = tone.isNight
          ? 'rgba(27, 94, 32, 0.85)'
          : `rgba(${blade.colorR}, ${blade.colorG}, ${blade.colorB}, 0.9)`;

        this.ctx.strokeStyle = bladeColor;
        this.ctx.lineWidth = blade.thickness;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(blade.x, blade.baseY);
        this.ctx.quadraticCurveTo(ctrlX, midY, tipX, tipY);
        this.ctx.stroke();
      }
    } else {
      const bladeCount = 80;
      const bladeHeight = 15;

      for (let i = 0; i < bladeCount; i++) {
        const x = (i / bladeCount) * this.width + Math.sin(i * 1.5) * 5;
        const baseY = grassTop + 5 + Math.sin(i * 0.7) * 3;
        const sway = Math.sin(this.grassPhase + i * 0.3) * 3;

        const bladeColor = tone.isNight
          ? 'rgba(27, 94, 32, 0.7)'
          : 'rgba(76, 175, 80, 0.6)';

        this.ctx.strokeStyle = bladeColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, baseY);
        this.ctx.quadraticCurveTo(x + sway, baseY - bladeHeight / 2, x + sway * 1.5, baseY - bladeHeight);
        this.ctx.stroke();
      }
    }
  }

  private shiftHue(rgbStr: string, degrees: number): string {
    const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return rgbStr;

    let r = parseInt(match[1]);
    let g = parseInt(match[2]);
    let b = parseInt(match[3]);

    const hsl = this.rgbToHsl(r, g, b);
    hsl[0] = (hsl[0] + degrees / 360) % 1;

    const rgb = this.hslToRgb(hsl[0], hsl[1], hsl[2]);
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  private rgbToHsl(r: number, g: number, b: number): number[] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h, s, l];
  }

  private hslToRgb(h: number, s: number, l: number): number[] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  private drawRain(tone: ColorTone): void {
    if (this.rainTransitionOpacity <= 0) return;

    const brightness = tone.brightness;

    for (const p of this.rainPool) {
      if (!p.active || p.opacity <= 0) continue;

      const alpha = p.opacity * this.rainTransitionOpacity * (0.5 + brightness * 0.5);
      const rainColor = tone.isNight
        ? `rgba(150, 180, 200, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;

      this.ctx.strokeStyle = rainColor;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x + p.vx * 0.8, p.y + p.size);
      this.ctx.stroke();
    }
  }

  private drawSnow(tone: ColorTone): void {
    if (this.snowTransitionOpacity <= 0) return;

    const brightness = tone.brightness;

    for (const p of this.snowPool) {
      if (!p.active || p.opacity <= 0) continue;

      const alpha = p.opacity * this.snowTransitionOpacity * (0.5 + brightness * 0.5);
      const snowColor = tone.isNight
        ? `rgba(200, 210, 230, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;

      this.ctx.fillStyle = snowColor;
      this.drawHexagon(p.x, p.y, p.size, p.rotation);
    }
  }

  private drawHexagon(x: number, y: number, size: number, rotation: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = rotation + (i * Math.PI) / 3;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawSplashes(tone: ColorTone): void {
    if (this.rainTransitionOpacity <= 0) return;

    const brightness = tone.brightness;

    for (const s of this.splashPool) {
      if (!s.active) continue;

      const alpha = (1 - s.life / s.maxLife) * 0.5 * this.rainTransitionOpacity * (0.5 + brightness * 0.5);
      const splashColor = tone.isNight
        ? `rgba(150, 180, 200, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;

      this.ctx.strokeStyle = splashColor;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private drawFog(tone: ColorTone): void {
    if (this.fogOpacity <= 0) return;

    const fogColor = this.hexToRgb(this.params.fogColor);
    const fogGradient = this.ctx.createLinearGradient(0, this.height * 0.4, 0, this.height);
    fogGradient.addColorStop(0, `rgba(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]}, 0)`);
    fogGradient.addColorStop(0.5, `rgba(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]}, ${this.fogOpacity * 0.7})`);
    fogGradient.addColorStop(1, `rgba(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]}, ${this.fogOpacity})`);

    this.ctx.fillStyle = fogGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalCompositeOperation = 'saturation';
    this.ctx.fillStyle = `rgba(128, 128, 128, ${this.fogOpacity * 0.3})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalCompositeOperation = 'source-over';
  }

  private drawLightning(tone: ColorTone): void {
    if (!this.lightningActive) return;

    const flashProgress = 1 - this.lightningFlashTimer / this.lightningFlashDuration;
    const brightness = this.params.lightningBright * flashProgress;

    this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [128, 128, 128];
  }

  destroy(): void {
  }
}
