import * as THREE from 'three';
import SceneManager from './SceneManager';
import { kelvinToRGB } from '../../utils/colorUtils';
import type { LightType, LightConfig } from '../types';

type LightMap = Map<LightType, THREE.PointLight | THREE.SpotLight>;

const DEFAULT_LIGHT_CONFIGS: Record<LightType, LightConfig> = {
  main: {
    id: 'main-light',
    type: 'main',
    name: '主灯',
    position: { x: 2, y: 4, z: 2 },
    colorTemp: 5500,
    intensity: 1.0,
    enabled: true,
  },
  fill: {
    id: 'fill-light',
    type: 'fill',
    name: '辅助灯',
    position: { x: -2, y: 3, z: -2 },
    colorTemp: 4500,
    intensity: 0.6,
    enabled: true,
  },
  spot: {
    id: 'spot-light',
    type: 'spot',
    name: '射灯',
    position: { x: 0, y: 5, z: 0 },
    colorTemp: 5000,
    intensity: 1.5,
    angle: 30,
    penumbra: 0.3,
    enabled: true,
  },
};

export class LightController {
  private sceneManager: SceneManager;
  private lights: LightMap = new Map();

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.initLights();
  }

  private initLights(): void {
    this.createMainLight();
    this.createFillLight();
    this.createSpotLight();
  }

  private createMainLight(): void {
    const config = DEFAULT_LIGHT_CONFIGS.main;
    const existingLight = this.sceneManager.getLightById(config.id);
    if (existingLight) {
      this.sceneManager.getScene().remove(existingLight);
    }

    const light = new THREE.PointLight(0xffffff, config.intensity, 50);
    light.position.set(config.position.x, config.position.y, config.position.z);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;
    light.name = config.name;
    light.userData.id = config.id;

    this.setColorTemp('main', config.colorTemp);
    this.lights.set('main', light);
    this.sceneManager.getScene().add(light);
    this.updateShadows();
  }

  private createFillLight(): void {
    const config = DEFAULT_LIGHT_CONFIGS.fill;
    const existingLight = this.sceneManager.getLightById(config.id);
    if (existingLight) {
      this.sceneManager.getScene().remove(existingLight);
    }

    const light = new THREE.PointLight(0xffffff, config.intensity, 50);
    light.position.set(config.position.x, config.position.y, config.position.z);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;
    light.name = config.name;
    light.userData.id = config.id;

    this.setColorTemp('fill', config.colorTemp);
    this.lights.set('fill', light);
    this.sceneManager.getScene().add(light);
    this.updateShadows();
  }

  private createSpotLight(): void {
    const config = DEFAULT_LIGHT_CONFIGS.spot;
    const existingLight = this.sceneManager.getLightById(config.id);
    if (existingLight) {
      this.sceneManager.getScene().remove(existingLight);
    }

    const light = new THREE.SpotLight(
      0xffffff,
      config.intensity,
      50,
      THREE.MathUtils.degToRad(config.angle!),
      config.penumbra
    );
    light.position.set(config.position.x, config.position.y, config.position.z);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;
    light.name = config.name;
    light.userData.id = config.id;

    this.setColorTemp('spot', config.colorTemp);
    this.lights.set('spot', light);
    this.sceneManager.getScene().add(light);
    this.sceneManager.getScene().add(light.target);
    this.updateShadows();
  }

  private updateShadows(): void {
    this.sceneManager.getRenderer().shadowMap.needsUpdate = true;
  }

  public setPosition(lightId: LightType, x: number, y: number, z: number): void {
    const light = this.lights.get(lightId);
    if (!light) {
      console.warn(`Light ${lightId} not found`);
      return;
    }
    light.position.set(x, y, z);
    this.updateShadows();
    this.emitLightChange(lightId);
  }

  public setColorTemp(lightId: LightType, kelvin: number): void {
    const light = this.lights.get(lightId);
    if (!light) {
      console.warn(`Light ${lightId} not found`);
      return;
    }
    const { r, g, b } = kelvinToRGB(kelvin);
    light.color.setRGB(r, g, b);
    this.updateShadows();
    this.emitLightChange(lightId);
  }

  public setIntensity(lightId: LightType, value: number): void {
    const light = this.lights.get(lightId);
    if (!light) {
      console.warn(`Light ${lightId} not found`);
      return;
    }
    light.intensity = value;
    this.updateShadows();
    this.emitLightChange(lightId);
  }

  public setSpotAngle(lightId: LightType, degrees: number): void {
    const light = this.lights.get(lightId);
    if (!light || !(light instanceof THREE.SpotLight)) {
      console.warn(`Spot light ${lightId} not found or not a SpotLight`);
      return;
    }
    light.angle = THREE.MathUtils.degToRad(degrees);
    this.updateShadows();
    this.emitLightChange(lightId);
  }

  private emitLightChange(lightId: LightType): void {
    const light = this.lights.get(lightId);
    if (!light) return;

    const config: LightConfig = {
      id: DEFAULT_LIGHT_CONFIGS[lightId].id,
      type: lightId,
      name: DEFAULT_LIGHT_CONFIGS[lightId].name,
      position: {
        x: light.position.x,
        y: light.position.y,
        z: light.position.z,
      },
      colorTemp: this.getColorTempFromColor(light.color),
      intensity: light.intensity,
      enabled: true,
    };

    if (light instanceof THREE.SpotLight) {
      config.angle = THREE.MathUtils.radToDeg(light.angle);
      config.penumbra = light.penumbra;
    }

    this.sceneManager.emit('light:change', config);
  }

  private getColorTempFromColor(color: THREE.Color): number {
    const b = color.b * 255;

    let temp = 0;
    let minTemp = 1000;
    let maxTemp = 40000;

    while (maxTemp - minTemp > 1) {
      temp = (minTemp + maxTemp) / 2;
      const rgb = kelvinToRGB(temp);
      if (rgb.b * 255 <= b) {
        maxTemp = temp;
      } else {
        minTemp = temp;
      }
    }

    return Math.round(temp);
  }

  public getLight(lightId: LightType): THREE.PointLight | THREE.SpotLight | undefined {
    return this.lights.get(lightId);
  }

  public getLightConfig(lightId: LightType): LightConfig | undefined {
    const light = this.lights.get(lightId);
    if (!light) return undefined;

    const config: LightConfig = {
      id: DEFAULT_LIGHT_CONFIGS[lightId].id,
      type: lightId,
      name: DEFAULT_LIGHT_CONFIGS[lightId].name,
      position: {
        x: light.position.x,
        y: light.position.y,
        z: light.position.z,
      },
      colorTemp: this.getColorTempFromColor(light.color),
      intensity: light.intensity,
      enabled: true,
    };

    if (light instanceof THREE.SpotLight) {
      config.angle = THREE.MathUtils.radToDeg(light.angle);
      config.penumbra = light.penumbra;
    }

    return config;
  }

  public getAllLightConfigs(): Record<LightType, LightConfig | undefined> {
    return {
      main: this.getLightConfig('main'),
      fill: this.getLightConfig('fill'),
      spot: this.getLightConfig('spot'),
    };
  }
}
