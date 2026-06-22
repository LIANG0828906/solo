import * as THREE from 'three';

const COUNT = 6000;
const RADIUS = 5;
const C_LOW = new THREE.Color('#1a5276');
const C_HIGH = new THREE.Color('#e67e22');
const tmpColor = new THREE.Color();

export class ParticleSystem {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  points: THREE.Points;
  transitioning = false;

  private pos: Float32Array;
  private col: Float32Array;
  private siz: Float32Array;
  private basePos: Float32Array;

  constructor() {
    this.pos = new Float32Array(COUNT * 3);
    this.col = new Float32Array(COUNT * 3);
    this.siz = new Float32Array(COUNT);
    this.basePos = new Float32Array(COUNT * 3);
    this.initSphere();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.siz, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: { uBloom: { value: 0.0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uBloom;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float a = 1.0 - smoothstep(0.15, 0.5, d);
          a += uBloom * 0.6 * (1.0 - smoothstep(0.0, 0.5, d));
          gl_FragColor = vec4(vColor, a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  private initSphere() {
    const golden = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < COUNT; i++) {
      const theta = 2 * Math.PI * i / golden;
      const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
      const r = RADIUS * (0.9 + Math.random() * 0.1);
      const i3 = i * 3;
      this.pos[i3] = this.basePos[i3] = r * Math.sin(phi) * Math.cos(theta);
      this.pos[i3 + 1] = this.basePos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      this.pos[i3 + 2] = this.basePos[i3 + 2] = r * Math.cos(phi);
      const t = i / COUNT;
      tmpColor.lerpColors(C_LOW, C_HIGH, t);
      this.col[i3] = tmpColor.r;
      this.col[i3 + 1] = tmpColor.g;
      this.col[i3 + 2] = tmpColor.b;
      this.siz[i] = 2.0;
    }
  }

  updateFromFrequency(data: Uint8Array) {
    const bins = data.length;
    const third = bins / 3;
    const twoThirds = third * 2;
    const newPos = new Float32Array(COUNT * 3);
    const newCol = new Float32Array(COUNT * 3);
    const newSiz = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const fi = Math.floor((i / COUNT) * bins);
      const lo = data[Math.min(fi, third - 1)] / 255;
      const mid = data[Math.min(Math.floor(third + fi * 0.3), twoThirds - 1)] / 255;
      const hi = data[Math.min(fi + Math.floor(twoThirds), bins - 1)] / 255;
      const bx = this.basePos[i3], by = this.basePos[i3 + 1], bz = this.basePos[i3 + 2];
      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      const nx = bx / len, ny = by / len, nz = bz / len;
      const disp = lo * 2;
      newPos[i3] = bx + nx * disp;
      newPos[i3 + 1] = by + ny * disp;
      newPos[i3 + 2] = bz + nz * disp;
      const c = Math.cos(mid), s = Math.sin(mid);
      const rx = newPos[i3] * c - newPos[i3 + 2] * s;
      const rz = newPos[i3] * s + newPos[i3 + 2] * c;
      newPos[i3] = rx;
      newPos[i3 + 2] = rz;
      tmpColor.lerpColors(C_LOW, C_HIGH, hi);
      newCol[i3] = tmpColor.r;
      newCol[i3 + 1] = tmpColor.g;
      newCol[i3 + 2] = tmpColor.b;
      newSiz[i] = 0.5 + hi * 2.5;
    }
    this.pos.set(newPos);
    this.col.set(newCol);
    this.siz.set(newSiz);
    this.markDirty();
  }

  setBloom(v: number) { this.material.uniforms.uBloom.value = v; }

  getPositions(): Float32Array { return new Float32Array(this.pos); }
  getColors(): Float32Array { return new Float32Array(this.col); }
  getSizes(): Float32Array { return new Float32Array(this.siz); }

  applyPositions(p: Float32Array) {
    this.pos.set(p);
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  applyColors(c: Float32Array) {
    this.col.set(c);
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }
  applySizes(s: Float32Array) {
    this.siz.set(s);
    (this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
  }

  private markDirty() {
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
  }
}
