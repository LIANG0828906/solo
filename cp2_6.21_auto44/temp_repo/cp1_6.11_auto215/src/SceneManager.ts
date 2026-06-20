export type WeatherType = 'sunny' | 'rainy' | 'foggy';

interface SkyColorStop {
  top: string;
  bottom: string;
}

interface SunMoonState {
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  isSun: boolean;
}

interface LightParams {
  shadowLength: number;
  shadowAngle: number;
  ambientIntensity: number;
  colorTint: { r: number; g: number; b: number };
}

export class SceneManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private hour: number = 12;
  private weather: WeatherType = 'sunny';
  private targetWeather: WeatherType = 'sunny';
  private weatherTransitionProgress: number = 1;
  private readonly weatherTransitionDuration: number = 1000;

  private readonly skyKeyframes: Array<{ hour: number; top: string; bottom: string }> = [
    { hour: 0, top: '#1a1a2e', bottom: '#2d2d4a' },
    { hour: 5, top: '#2a2a4e', bottom: '#3d3d6a' },
    { hour: 6.5, top: '#ff9a56', bottom: '#ffd4a3' },
    { hour: 12, top: '#87ceeb', bottom: '#e0f6ff' },
    { hour: 17.5, top: '#ff7f50', bottom: '#ffb88c' },
    { hour: 19.5, top: '#4a3d5a', bottom: '#5a4d6a' },
    { hour: 22, top: '#1f1f3a', bottom: '#2d2d50' },
    { hour: 24, top: '#1a1a2e', bottom: '#2d2d4a' }
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;

    const maxWidth = 1200;
    const maxHeight = 800;
    const wrapperRect = wrapper.getBoundingClientRect();

    let targetWidth = wrapperRect.width;
    let targetHeight = wrapperRect.height;

    const aspectRatio = 3 / 2;

    if (targetWidth > maxWidth) targetWidth = maxWidth;
    if (targetHeight > maxHeight) targetHeight = maxHeight;

    if (targetWidth / targetHeight > aspectRatio) {
      targetWidth = targetHeight * aspectRatio;
    } else {
      targetHeight = targetWidth / aspectRatio;
    }

    const dpr = window.devicePixelRatio || 1;
    this.width = Math.floor(targetWidth);
    this.height = Math.floor(targetHeight);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(dpr, dpr);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  setHour(hour: number): void {
    this.hour = Math.max(0, Math.min(23, hour));
  }

  setWeather(weather: WeatherType): void {
    if (weather === this.targetWeather) return;
    this.targetWeather = weather;
    this.weatherTransitionProgress = 0;
  }

  startWeatherTransition(): void {
    this.weatherTransitionProgress = 0;
  }

  update(deltaTime: number): void {
    if (this.weatherTransitionProgress < 1) {
      this.weatherTransitionProgress = Math.min(
        1,
        this.weatherTransitionProgress + deltaTime / this.weatherTransitionDuration
      );
      if (this.weatherTransitionProgress >= 1) {
        this.weather = this.targetWeather;
      }
    }
  }

  draw(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    this.drawSky();
    this.drawSunMoon();
    this.drawMountains();
    this.drawHills();
    this.drawHouse();
    this.drawTrees();
    this.applyWeatherOverlay();
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private getSkyColors(hour: number): SkyColorStop {
    const keyframes = this.skyKeyframes;
    const h = hour < 0 ? hour + 24 : (hour >= 24 ? hour - 24 : hour);

    let prevIdx = 0;
    let nextIdx = keyframes.length - 1;

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (h >= keyframes[i].hour && h <= keyframes[i + 1].hour) {
        prevIdx = i;
        nextIdx = i + 1;
        break;
      }
    }

    const prev = keyframes[prevIdx];
    const next = keyframes[nextIdx];
    const t = (h - prev.hour) / (next.hour - prev.hour);

    return {
      top: this.interpolateColor(prev.top, next.top, t),
      bottom: this.interpolateColor(prev.bottom, next.bottom, t)
    };
  }

  private drawSky(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const sky = this.getSkyColors(this.hour);

    const gradient = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    gradient.addColorStop(0, sky.top);
    gradient.addColorStop(1, sky.bottom);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h * 0.65);

    if (this.hour < 6 || this.hour > 19) {
      this.drawStars();
    }
  }

  private drawStars(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height * 0.6;

    let starOpacity: number;
    const nightStart = 19.5;
    const nightEnd = 5.5;
    const fadeDuration = 1.5;

    if (this.hour >= nightStart) {
      starOpacity = Math.min(1, (this.hour - nightStart) / fadeDuration);
    } else if (this.hour <= nightEnd) {
      starOpacity = Math.min(1, (nightEnd - this.hour) / fadeDuration);
    } else {
      starOpacity = 0;
    }
    starOpacity = Math.max(0, Math.min(1, starOpacity));

    if (this.weather === 'foggy') {
      starOpacity *= 0.3;
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity * 0.8})`;

    const starPositions = [
      [0.1, 0.15, 2], [0.2, 0.08, 1.5], [0.35, 0.2, 2],
      [0.5, 0.05, 1.5], [0.6, 0.18, 2.5], [0.75, 0.12, 1.5],
      [0.85, 0.25, 2], [0.15, 0.35, 1.5], [0.45, 0.3, 2],
      [0.7, 0.35, 1.5], [0.9, 0.08, 2], [0.3, 0.4, 1.5],
      [0.55, 0.42, 1], [0.8, 0.45, 1.5]
    ];

    for (const [x, y, size] of starPositions) {
      ctx.fillRect(
        Math.floor(x * w),
        Math.floor(y * h),
        Math.floor(size),
        Math.floor(size)
      );
    }
  }

  private getSunMoonState(): SunMoonState {
    const w = this.width;
    const h = this.height;

    const isDaytime = this.hour >= 6 && this.hour <= 18;

    let angle: number;
    if (isDaytime) {
      angle = Math.PI * (1 - (this.hour - 6) / 12);
    } else {
      const nightHour = this.hour >= 18 ? this.hour - 18 : this.hour + 6;
      angle = Math.PI * (1 - nightHour / 12);
    }

    const arcWidth = w * 0.7;
    const arcHeight = h * 0.4;
    const centerX = w / 2;
    const baseY = h * 0.6;

    const x = centerX + Math.cos(angle) * arcWidth / 2;
    const y = baseY - Math.sin(angle) * arcHeight;

    let radius: number;
    let color: string;
    let glowColor: string;

    if (isDaytime) {
      radius = 28;
      const sunColor1 = '#fff5cc';
      const sunColor2 = '#ffd700';
      const sunColor3 = '#ff8c00';

      let t: number;
      if (this.hour < 9) {
        t = (this.hour - 6) / 3;
        color = this.interpolateColor(sunColor1, sunColor2, t);
        glowColor = 'rgba(255, 200, 100, 0.3)';
      } else if (this.hour > 15) {
        t = (this.hour - 15) / 3;
        color = this.interpolateColor(sunColor2, sunColor3, t);
        glowColor = 'rgba(255, 140, 0, 0.3)';
      } else {
        color = sunColor2;
        glowColor = 'rgba(255, 215, 0, 0.25)';
      }
    } else {
      radius = 22;
      color = '#e8e8e8';
      glowColor = 'rgba(200, 200, 255, 0.2)';
    }

    return { x, y, radius, color, glowColor, isSun: isDaytime };
  }

  private drawSunMoon(): void {
    const ctx = this.ctx;
    const state = this.getSunMoonState();

    if (this.weather === 'foggy') return;
    if (this.weather === 'rainy' && state.isSun) {
      return;
    }

    const glowGradient = ctx.createRadialGradient(
      state.x, state.y, state.radius * 0.5,
      state.x, state.y, state.radius * 3
    );
    glowGradient.addColorStop(0, state.glowColor);
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(state.x, state.y, state.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = state.color;
    ctx.beginPath();
    ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
    ctx.fill();

    if (!state.isSun) {
      ctx.fillStyle = '#c0c0c0';
      ctx.beginPath();
      ctx.arc(state.x - 6, state.y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(state.x + 5, state.y + 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private getLightParams(): LightParams {
    let shadowLength: number;
    let shadowAngle: number;
    let ambientIntensity: number;

    if (this.hour >= 6 && this.hour <= 18) {
      const dayProgress = (this.hour - 6) / 12;
      shadowLength = 30 + Math.abs(dayProgress - 0.5) * 2 * 50;
      shadowAngle = dayProgress < 0.5 ? 30 + dayProgress * 60 : 90 + (dayProgress - 0.5) * 60;
      ambientIntensity = 0.6 + Math.sin(dayProgress * Math.PI) * 0.4;
    } else {
      shadowLength = 80;
      shadowAngle = 180;
      ambientIntensity = 0.2;
    }

    const sky = this.getSkyColors(this.hour);
    const tint = this.parseColor(sky.bottom);

    return {
      shadowLength,
      shadowAngle,
      ambientIntensity,
      colorTint: tint
    };
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    if (color.startsWith('#')) {
      return {
        r: parseInt(color.slice(1, 3), 16),
        g: parseInt(color.slice(3, 5), 16),
        b: parseInt(color.slice(5, 7), 16)
      };
    }
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return { r: 255, g: 255, b: 255 };
  }

  private drawMountains(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const groundY = h * 0.65;

    const light = this.getLightParams();
    const baseColor = this.weather === 'foggy' ? '#6b7b6b' : '#4a6c5a';

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(0, groundY);

    const mountainPoints = [
      [0.1, 0.45], [0.2, 0.52], [0.3, 0.42], [0.45, 0.5],
      [0.6, 0.4], [0.75, 0.48], [0.9, 0.43], [1.0, 0.5]
    ];

    ctx.lineTo(0, groundY);
    for (const [x, y] of mountainPoints) {
      ctx.lineTo(x * w, y * h);
    }
    ctx.lineTo(w, groundY);
    ctx.closePath();
    ctx.fill();

    const highlightColor = this.interpolateColor(baseColor, '#ffffff', 0.15);
    ctx.fillStyle = highlightColor;

    ctx.beginPath();
    ctx.moveTo(0.6 * w, 0.4 * h);
    ctx.lineTo(0.65 * w, 0.44 * h);
    ctx.lineTo(0.55 * w, 0.44 * h);
    ctx.closePath();
    ctx.fill();
  }

  private drawHills(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const groundY = h * 0.72;

    const light = this.getLightParams();
    const weatherFactor = this.weather === 'rainy' ? 0.8 : this.weather === 'foggy' ? 0.7 : 1;

    const hillTopColor = this.interpolateColor('#4a7c3f', '#2d2d2d', (1 - light.ambientIntensity) * 0.5);
    const hillBottomColor = this.interpolateColor('#2d5a1e', '#1a1a1a', (1 - light.ambientIntensity) * 0.5);

    const gradient = ctx.createLinearGradient(0, groundY - 60, 0, h);
    gradient.addColorStop(0, hillTopColor);
    gradient.addColorStop(1, hillBottomColor);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, groundY);

    const hillPoints = [
      [0, 0.68], [0.15, 0.62], [0.3, 0.66], [0.5, 0.58],
      [0.7, 0.64], [0.85, 0.6], [1.0, 0.65]
    ];

    for (const [x, y] of hillPoints) {
      ctx.lineTo(x * w, y * h);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = hillBottomColor;
    ctx.fillRect(0, groundY, w, h - groundY);
  }

  private drawHouse(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const houseX = w * 0.25;
    const houseY = h * 0.62;
    const houseW = 60;
    const houseH = 45;

    const light = this.getLightParams();

    const shadowX = houseX + Math.cos(light.shadowAngle * Math.PI / 180) * light.shadowLength;
    const shadowY = houseY + houseH + 4;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(houseX, houseY + houseH + 4);
    ctx.lineTo(houseX + houseW, houseY + houseH + 4);
    ctx.lineTo(shadowX + houseW, shadowY);
    ctx.lineTo(shadowX, shadowY);
    ctx.closePath();
    ctx.fill();

    const wallBase = '#8b5e3c';
    const wallColor = this.interpolateColor(wallBase, '#000000', (1 - light.ambientIntensity) * 0.6);
    ctx.fillStyle = wallColor;
    ctx.fillRect(houseX, houseY, houseW, houseH);

    const roofBase = '#b22222';
    const roofColor = this.interpolateColor(roofBase, '#000000', (1 - light.ambientIntensity) * 0.6);
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(houseX - 5, houseY);
    ctx.lineTo(houseX + houseW / 2, houseY - 25);
    ctx.lineTo(houseX + houseW + 5, houseY);
    ctx.closePath();
    ctx.fill();

    const doorColor = this.interpolateColor('#5c3d2e', '#000000', (1 - light.ambientIntensity) * 0.7);
    ctx.fillStyle = doorColor;
    ctx.fillRect(houseX + 23, houseY + 20, 14, 25);

    const windowColor = this.hour >= 19 || this.hour < 6
      ? '#ffeb3b'
      : '#87ceeb';
    const windowAlpha = this.hour >= 19 || this.hour < 6 ? 0.9 : 0.7;
    ctx.fillStyle = windowColor;
    ctx.globalAlpha = windowAlpha;
    ctx.fillRect(houseX + 8, houseY + 12, 12, 12);
    ctx.fillRect(houseX + 40, houseY + 12, 12, 12);
    ctx.globalAlpha = 1;

    if (this.hour >= 19 || this.hour < 6) {
      const glowGradient = ctx.createRadialGradient(
        houseX + 14, houseY + 18, 2,
        houseX + 14, houseY + 18, 20
      );
      glowGradient.addColorStop(0, 'rgba(255, 235, 59, 0.4)');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(houseX - 10, houseY - 5, 30, 30);

      const glowGradient2 = ctx.createRadialGradient(
        houseX + 46, houseY + 18, 2,
        houseX + 46, houseY + 18, 20
      );
      glowGradient2.addColorStop(0, 'rgba(255, 235, 59, 0.4)');
      glowGradient2.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient2;
      ctx.fillRect(houseX + 28, houseY - 5, 30, 30);
    }
  }

  private drawTrees(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const trees = [
      { x: 0.1, y: 0.72, scale: 1.2 },
      { x: 0.18, y: 0.7, scale: 0.9 },
      { x: 0.55, y: 0.68, scale: 1.1 },
      { x: 0.7, y: 0.7, scale: 0.85 },
      { x: 0.82, y: 0.69, scale: 1.0 },
      { x: 0.92, y: 0.71, scale: 0.95 }
    ];

    const light = this.getLightParams();
    const trunkBase = '#5c3d2e';
    const leavesBase = '#1b3d0f';

    const trunkColor = this.interpolateColor(trunkBase, '#000000', (1 - light.ambientIntensity) * 0.6);
    const leavesColor = this.interpolateColor(leavesBase, '#000000', (1 - light.ambientIntensity) * 0.5);

    for (const tree of trees) {
      const tx = tree.x * w;
      const ty = tree.y * h;
      const scale = tree.scale;

      const trunkW = 8 * scale;
      const trunkH = 25 * scale;
      const leavesW = 35 * scale;
      const leavesH = 40 * scale;

      const shadowX = tx + Math.cos(light.shadowAngle * Math.PI / 180) * light.shadowLength * 0.6;
      const shadowY = ty + 4;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.moveTo(tx - leavesW / 2, ty);
      ctx.lineTo(tx + leavesW / 2, ty);
      ctx.lineTo(shadowX + leavesW / 2, shadowY);
      ctx.lineTo(shadowX - leavesW / 2, shadowY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = trunkColor;
      ctx.fillRect(tx - trunkW / 2, ty - trunkH, trunkW, trunkH);

      ctx.fillStyle = leavesColor;
      ctx.beginPath();
      ctx.moveTo(tx - leavesW / 2, ty - trunkH);
      ctx.lineTo(tx, ty - trunkH - leavesH);
      ctx.lineTo(tx + leavesW / 2, ty - trunkH);
      ctx.closePath();
      ctx.fill();

      const leaves2Y = ty - trunkH - leavesH * 0.4;
      const leaves2W = leavesW * 0.75;
      const leaves2H = leavesH * 0.6;
      ctx.beginPath();
      ctx.moveTo(tx - leaves2W / 2, leaves2Y + leaves2H * 0.3);
      ctx.lineTo(tx, leaves2Y - leaves2H * 0.7);
      ctx.lineTo(tx + leaves2W / 2, leaves2Y + leaves2H * 0.3);
      ctx.closePath();
      ctx.fill();
    }
  }

  private applyWeatherOverlay(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (this.weatherTransitionProgress >= 1) {
      this.drawWeatherOverlay(this.weather, 1);
      return;
    }

    const fromOpacity = 1 - this.weatherTransitionProgress;
    const toOpacity = this.weatherTransitionProgress;

    if (fromOpacity > 0) {
      this.drawWeatherOverlay(this.weather, fromOpacity);
    }
    if (toOpacity > 0) {
      this.drawWeatherOverlay(this.targetWeather, toOpacity);
    }
  }

  private drawWeatherOverlay(weather: WeatherType, opacity: number): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (weather === 'rainy') {
      ctx.fillStyle = 'rgba(50, 70, 100, 0.15)';
      ctx.fillRect(0, 0, w, h);
    } else if (weather === 'foggy') {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(200, 200, 210, 0.25)');
      gradient.addColorStop(0.5, 'rgba(200, 200, 210, 0.15)');
      gradient.addColorStop(1, 'rgba(200, 200, 210, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  getHour(): number {
    return this.hour;
  }

  getWeather(): WeatherType {
    return this.weather;
  }
}
