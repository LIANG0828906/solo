import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export type LightType = 'point' | 'spot' | 'directional';

export interface LightSourceData {
  id: string;
  type: LightType;
  color: string;
  intensity: number;
  position: [number, number, number];
  decay: number;
  spotAngle: number;
  spotPenumbra: number;
}

export class LightSource {
  data: LightSourceData;

  constructor(type: LightType, id?: string) {
    this.data = {
      id: id || uuidv4(),
      type,
      color: '#ffffff',
      intensity: 1.0,
      position: [0, 2, 0],
      decay: 5,
      spotAngle: Math.PI / 4,
      spotPenumbra: 0.3,
    };
  }

  static fromData(d: LightSourceData): LightSource {
    const ls = new LightSource(d.type, d.id);
    ls.data = { ...d, position: [...d.position] };
    return ls;
  }

  createThreeLight(): THREE.Light {
    let light: THREE.Light;
    switch (this.data.type) {
      case 'point': {
        const pl = new THREE.PointLight(this.data.color, this.data.intensity, this.data.decay);
        pl.castShadow = true;
        pl.shadow.mapSize.set(1024, 1024);
        light = pl;
        break;
      }
      case 'spot': {
        const sl = new THREE.SpotLight(
          this.data.color, this.data.intensity, this.data.decay,
          this.data.spotAngle, this.data.spotPenumbra
        );
        sl.castShadow = true;
        sl.shadow.mapSize.set(1024, 1024);
        light = sl;
        break;
      }
      case 'directional': {
        const dl = new THREE.DirectionalLight(this.data.color, this.data.intensity);
        dl.castShadow = true;
        dl.shadow.mapSize.set(1024, 1024);
        dl.shadow.camera.left = -8;
        dl.shadow.camera.right = 8;
        dl.shadow.camera.top = 6;
        dl.shadow.camera.bottom = -6;
        light = dl;
        break;
      }
    }
    light.position.set(...this.data.position);
    return light;
  }

  updateThreeLight(light: THREE.Light): void {
    light.color.set(this.data.color);
    light.intensity = this.data.intensity;
    light.position.set(...this.data.position);
    if (light instanceof THREE.PointLight) {
      light.distance = this.data.decay;
    }
    if (light instanceof THREE.SpotLight) {
      light.distance = this.data.decay;
      light.angle = this.data.spotAngle;
      light.penumbra = this.data.spotPenumbra;
      light.target.position.set(this.data.position[0], 0, this.data.position[2]);
    }
  }
}
