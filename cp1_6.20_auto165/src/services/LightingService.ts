import { EventBus, Events, LightingParams } from '../utils/EventBus';

export class LightingService {
  private currentTime: number = 12;
  private minTime: number = 5;
  private maxTime: number = 20;

  private readonly sunDistance: number = 100;
  private readonly sceneRadius: number = 50;

  constructor() {
    EventBus.on(Events.TIME_CHANGED, (time: number) => {
      this.setTime(time);
    });
  }

  public setTime(time: number): void {
    this.currentTime = Math.max(this.minTime, Math.min(this.maxTime, time));
    this.updateLighting();
  }

  public getTime(): number {
    return this.currentTime;
  }

  private updateLighting(): void {
    const params = this.calculateLightingParams();
    EventBus.emit(Events.LIGHTING_UPDATED, params);
  }

  private calculateLightingParams(): LightingParams {
    const normalizedTime = (this.currentTime - this.minTime) / (this.maxTime - this.minTime);
    
    const elevation = this.calculateElevation(normalizedTime);
    const azimuth = this.calculateAzimuth(normalizedTime);
    const colorTemperature = this.calculateColorTemperature(normalizedTime);
    const intensity = this.calculateIntensity(elevation);
    const color = this.temperatureToColor(colorTemperature);
    const ambientIntensity = this.calculateAmbientIntensity(elevation);
    const sunPosition = this.calculateSunPosition(elevation, azimuth);
    const shadowMatrix = this.calculateShadowMatrix(sunPosition);

    return {
      time: this.currentTime,
      elevation,
      azimuth,
      colorTemperature,
      intensity,
      color,
      ambientIntensity,
      sunPosition,
      shadowMatrix,
    };
  }

  private calculateElevation(normalizedTime: number): number {
    const angle = normalizedTime * Math.PI;
    return Math.sin(angle) * 90;
  }

  private calculateAzimuth(normalizedTime: number): number {
    return -90 + normalizedTime * 180;
  }

  private calculateColorTemperature(normalizedTime: number): number {
    const warmTemp = 2000;
    const coolTemp = 10000;
    const midTemp = 5500;

    if (normalizedTime < 0.25) {
      const t = normalizedTime / 0.25;
      return this.easeInOutQuad(t) * (midTemp - warmTemp) + warmTemp;
    } else if (normalizedTime > 0.75) {
      const t = (normalizedTime - 0.75) / 0.25;
      return this.easeInOutQuad(1 - t) * (midTemp - warmTemp) + warmTemp;
    } else {
      const t = (normalizedTime - 0.25) / 0.5;
      const pulse = Math.sin(t * Math.PI);
      return midTemp + pulse * (coolTemp - midTemp) * 0.5;
    }
  }

  private calculateIntensity(elevation: number): number {
    const normalizedElevation = Math.max(0, elevation) / 90;
    return Math.pow(normalizedElevation, 0.5) * 2.5 + 0.1;
  }

  private calculateAmbientIntensity(elevation: number): number {
    const normalizedElevation = Math.max(0, elevation) / 90;
    return 0.15 + normalizedElevation * 0.35;
  }

  private calculateSunPosition(elevation: number, azimuth: number): { x: number; y: number; z: number } {
    const elevationRad = (elevation * Math.PI) / 180;
    const azimuthRad = (azimuth * Math.PI) / 180;

    const x = this.sunDistance * Math.cos(elevationRad) * Math.sin(azimuthRad);
    const y = this.sunDistance * Math.sin(elevationRad);
    const z = this.sunDistance * Math.cos(elevationRad) * Math.cos(azimuthRad);

    return { x, y, z };
  }

  private calculateShadowMatrix(sunPosition: { x: number; y: number; z: number }): number[] {
    const dx = -sunPosition.x;
    const dy = -sunPosition.y;
    const dz = -sunPosition.z;

    const shadowMatrix = [
      dy, 0, 0, 0,
      -dx, 0, -dz, -1,
      0, 0, dy, 0,
      0, 0, 0, dy,
    ];

    return shadowMatrix;
  }

  private temperatureToColor(temperature: number): number {
    let red: number, green: number, blue: number;
    const temp = temperature / 100;

    if (temp <= 66) {
      red = 255;
      green = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
      if (temp <= 19) {
        blue = 0;
      } else {
        blue = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
      }
    } else {
      red = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
      green = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
      blue = 255;
    }

    return (Math.floor(red) << 16) | (Math.floor(green) << 8) | Math.floor(blue);
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  public getTimePreset(preset: 'dawn' | 'noon' | 'dusk'): number {
    switch (preset) {
      case 'dawn':
        return 6.5;
      case 'noon':
        return 12;
      case 'dusk':
        return 18.5;
      default:
        return 12;
    }
  }

  public forceUpdate(): void {
    this.updateLighting();
  }
}
