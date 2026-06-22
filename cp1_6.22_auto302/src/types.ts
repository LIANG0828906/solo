export enum WaveType {
  SINE = 'sine',
  SQUARE = 'square',
  TRIANGLE = 'triangle',
  SAWTOOTH = 'sawtooth',
}

export interface ParticleConfig {
  frequency: number;
  amplitude: number;
  waveType: WaveType;
}

export class Particle {
  x: number;
  y: number;
  z: number;
  color: string;
  size: number;

  constructor(x: number = 0, y: number = 0, z: number = 0, color: string = '#00e5ff', size: number = 3) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.color = color;
    this.size = size;
  }
}
