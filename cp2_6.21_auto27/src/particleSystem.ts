import * as THREE from 'three';
import { ForceFieldManager } from './forceField';

export type ColorTheme = 'pinkPurple' | 'cyanBlue' | 'orangeRed' | 'silverWhite';

const COLOR_PALETTES: Record<ColorTheme, [number, number, number][]> = {
    pinkPurple: [
        [1.0, 0.2, 0.8],
        [0.8, 0.3, 1.0],
        [0.6, 0.2, 0.9],
        [1.0, 0.4, 0.7],
        [0.9, 0.1, 0.6]
    ],
    cyanBlue: [
        [0.2, 1.0, 1.0],
        [0.3, 0.7, 1.0],
        [0.1, 0.9, 0.95],
        [0.5, 0.9, 1.0],
        [0.0, 0.6, 1.0]
    ],
    orangeRed: [
        [1.0, 0.5, 0.2],
        [1.0, 0.3, 0.3],
        [1.0, 0.7, 0.1],
        [0.95, 0.4, 0.2],
        [1.0, 0.2, 0.5]
    ],
    silverWhite: [
        [0.9, 0.92, 1.0],
        [1.0, 1.0, 1.0],
        [0.8, 0.85, 1.0],
        [0.95, 0.9, 1.0],
        [0.85, 0.9, 0.95]
    ]
};

export const MAX_PARTICLES = 60000;
export const TRAIL_MAX_POINTS = 60;

interface ParticleState {
    active: boolean;
}

export interface ParticleSystemTargetConfig {
    emissionRate: number;
    lifeMin: number;
    lifeMax: number;
    speed: number;
    colorTheme: ColorTheme;
}

export interface ParticleSystemCurrentConfig {
    emissionRate: number;
    lifeMin: number;
    lifeMax: number;
    speed: number;
    colorTheme: ColorTheme;
}

const _acc = new THREE.Vector3();
const _posVec = new THREE.Vector3();
const _velVec = new THREE.Vector3();

export class ParticleSystem {
    public scene: THREE.Scene;
    public forceField: ForceFieldManager;
    public points: THREE.Points;
    public geometry: THREE.BufferGeometry;
    public trailLine: THREE.LineSegments;
    public trailGeometry: THREE.BufferGeometry;
    public material: THREE.PointsMaterial;
    public trailMaterial: THREE.LineBasicMaterial;

    private _maxParticles: number = MAX_PARTICLES;
    private _activeCount: number = 0;
    private _emissionAccumulator: number = 0;

    private _positions!: Float32Array;
    private _colors!: Float32Array;
    private _sizes!: Float32Array;

    private _particleAge!: Float32Array;
    private _particleLife!: Float32Array;
    private _particleVel!: Float32Array;
    private _particleInitialSize!: Float32Array;
    private _particleInitialColor!: Float32Array;
    private _particleState!: ParticleState[];

    private _trailPositions!: Float32Array;
    private _trailColors!: Float32Array;
    private _trailParticleIndex!: Int32Array;
    private _trailAge!: Float32Array;
    private _maxTrailSegments!: number;
    private _trailWriteIndex: number = 0;

    public targetConfig: ParticleSystemTargetConfig;
    public currentConfig: ParticleSystemCurrentConfig;

    private _spawnRadius: number = 10;

    constructor(scene: THREE.Scene, forceField: ForceFieldManager) {
        this.scene = scene;
        this.forceField = forceField;

        this.targetConfig = {
            emissionRate: 200,
            lifeMin: 5,
            lifeMax: 15,
            speed: 1.25,
            colorTheme: 'pinkPurple'
        };
        this.currentConfig = { ...this.targetConfig };

        this._initBuffers();
        const texture = this._createParticleTexture();

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this._colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this._sizes, 1));
        this.geometry.setDrawRange(0, this._maxParticles);

        this.material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            map: texture,
            transparent: true,
            alphaTest: 0.01,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        this.material.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader
                .replace('attribute float size;', 'attribute float size;\nvarying float vSize;')
                .replace(
                    'gl_PointSize = size;',
                    'vSize = size;\ngl_PointSize = size * (300.0 / -mvPosition.z);'
                );
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', '#include <common>\nvarying float vSize;');
        };

        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);

        this._maxTrailSegments = MAX_PARTICLES * 2;
        this._trailPositions = new Float32Array(this._maxTrailSegments * 3 * 2);
        this._trailColors = new Float32Array(this._maxTrailSegments * 4 * 2);
        this._trailParticleIndex = new Int32Array(this._maxTrailSegments * 2);
        this._trailAge = new Float32Array(this._maxTrailSegments * 2);

        this.trailGeometry = new THREE.BufferGeometry();
        this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(this._trailPositions, 3));
        this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(this._trailColors, 4));
        this.trailGeometry.setDrawRange(0, 0);

        this.trailMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            linewidth: 1
        });

        this.trailLine = new THREE.LineSegments(this.trailGeometry, this.trailMaterial);
        this.scene.add(this.trailLine);

        this._initInitialParticles(1000);
    }

    private _initBuffers(): void {
        this._positions = new Float32Array(this._maxParticles * 3);
        this._colors = new Float32Array(this._maxParticles * 3);
        this._sizes = new Float32Array(this._maxParticles);
        this._particleAge = new Float32Array(this._maxParticles);
        this._particleLife = new Float32Array(this._maxParticles);
        this._particleVel = new Float32Array(this._maxParticles * 3);
        this._particleInitialSize = new Float32Array(this._maxParticles);
        this._particleInitialColor = new Float32Array(this._maxParticles * 3);
        this._particleState = new Array(this._maxParticles);
        for (let i = 0; i < this._maxParticles; i++) {
            this._particleState[i] = { active: false };
        }
    }

    private _createParticleTexture(): THREE.Texture {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.85)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(0.7, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(1.0, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    private _initInitialParticles(count: number): void {
        for (let i = 0; i < count; i++) {
            this._emitParticle();
        }
    }

    private _getRandomColorFromTheme(theme: ColorTheme, out: Float32Array, offset: number): void {
        const palette = COLOR_PALETTES[theme];
        const idx = Math.floor(Math.random() * palette.length);
        const color = palette[idx];
        out[offset] = color[0];
        out[offset + 1] = color[1];
        out[offset + 2] = color[2];
    }

    private _randomInSphere(out: Float32Array, offset: number, radius: number): void {
        const u = Math.random() * 2 - 1;
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        const s = radius * Math.pow(Math.random(), 1 / 3);
        out[offset] = r * Math.cos(t) * s;
        out[offset + 1] = u * s;
        out[offset + 2] = r * Math.sin(t) * s;
    }

    private _randomDirection(out: Float32Array, offset: number): void {
        const u = Math.random() * 2 - 1;
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        out[offset] = r * Math.cos(t);
        out[offset + 1] = u;
        out[offset + 2] = r * Math.sin(t);
    }

    private _findInactiveIndex(): number {
        for (let i = 0; i < this._maxParticles; i++) {
            if (!this._particleState[i].active) {
                return i;
            }
        }
        return -1;
    }

    private _emitParticle(): boolean {
        const idx = this._findInactiveIndex();
        if (idx === -1) return false;

        const state = this._particleState[idx];
        state.active = true;
        this._activeCount++;

        this._randomInSphere(this._positions, idx * 3, this._spawnRadius);

        const speed = (0.5 + Math.random() * 1.5) * this.currentConfig.speed;
        this._randomDirection(this._particleVel, idx * 3);
        this._particleVel[idx * 3] *= speed;
        this._particleVel[idx * 3 + 1] *= speed;
        this._particleVel[idx * 3 + 2] *= speed;

        const lifeMin = this.currentConfig.lifeMin;
        const lifeMax = this.currentConfig.lifeMax;
        const life = lifeMin + Math.random() * (lifeMax - lifeMin);
        this._particleAge[idx] = 0;
        this._particleLife[idx] = life;

        const size = 0.02 + Math.random() * 0.28;
        this._particleInitialSize[idx] = size;
        this._sizes[idx] = size;

        this._getRandomColorFromTheme(this.currentConfig.colorTheme, this._particleInitialColor, idx * 3);
        this._colors[idx * 3] = this._particleInitialColor[idx * 3];
        this._colors[idx * 3 + 1] = this._particleInitialColor[idx * 3 + 1];
        this._colors[idx * 3 + 2] = this._particleInitialColor[idx * 3 + 2];

        return true;
    }

    private _killParticle(idx: number): void {
        this._particleState[idx].active = false;
        this._activeCount--;
        this._sizes[idx] = 0;
        this._positions[idx * 3] = 0;
        this._positions[idx * 3 + 1] = -99999;
        this._positions[idx * 3 + 2] = 0;
    }

    private _updateCurrentConfig(dt: number): void {
        const t = Math.min(dt / 0.3, 1);
        this.currentConfig.emissionRate += (this.targetConfig.emissionRate - this.currentConfig.emissionRate) * t;
        this.currentConfig.lifeMin += (this.targetConfig.lifeMin - this.currentConfig.lifeMin) * t;
        this.currentConfig.lifeMax += (this.targetConfig.lifeMax - this.currentConfig.lifeMax) * t;
        this.currentConfig.speed += (this.targetConfig.speed - this.currentConfig.speed) * t;
    }

    private _writeTrailPoint(idx: number): void {
        if (this._trailWriteIndex >= this._maxTrailSegments) {
            this._trailWriteIndex = 0;
        }
        const base = this._trailWriteIndex * 6;
        const prevBase = base;
        const age = this._particleAge[idx];
        const life = this._particleLife[idx];
        const lifeRatio = age / life;
        const alpha = Math.max(0, 1 - lifeRatio);

        this._trailPositions[prevBase] = this._positions[idx * 3];
        this._trailPositions[prevBase + 1] = this._positions[idx * 3 + 1];
        this._trailPositions[prevBase + 2] = this._positions[idx * 3 + 2];
        this._trailPositions[prevBase + 3] = this._positions[idx * 3];
        this._trailPositions[prevBase + 4] = this._positions[idx * 3 + 1];
        this._trailPositions[prevBase + 5] = this._positions[idx * 3 + 2];

        const r = this._colors[idx * 3];
        const g = this._colors[idx * 3 + 1];
        const b = this._colors[idx * 3 + 2];
        this._trailColors[prevBase * 4 / 3] = r;
        this._trailColors[prevBase * 4 / 3 + 1] = g;
        this._trailColors[prevBase * 4 / 3 + 2] = b;
        this._trailColors[prevBase * 4 / 3 + 3] = alpha * 0.8;
        this._trailColors[prevBase * 4 / 3 + 4] = r;
        this._trailColors[prevBase * 4 / 3 + 5] = g;
        this._trailColors[prevBase * 4 / 3 + 6] = b;
        this._trailColors[prevBase * 4 / 3 + 7] = alpha * 0.6;

        this._trailParticleIndex[this._trailWriteIndex * 2] = idx;
        this._trailParticleIndex[this._trailWriteIndex * 2 + 1] = idx;
        this._trailAge[this._trailWriteIndex * 2] = age;
        this._trailAge[this._trailWriteIndex * 2 + 1] = age;

        this._trailWriteIndex++;
    }

    public update(dt: number): void {
        this._updateCurrentConfig(dt);

        this._emissionAccumulator += this.currentConfig.emissionRate * dt;
        while (this._emissionAccumulator >= 1) {
            if (!this._emitParticle()) break;
            this._emissionAccumulator -= 1;
        }

        for (let idx = 0; idx < this._maxParticles; idx++) {
            if (!this._particleState[idx].active) continue;

            this._particleAge[idx] += dt;
            const age = this._particleAge[idx];
            const life = this._particleLife[idx];

            if (age >= life) {
                this._killParticle(idx);
                continue;
            }

            _posVec.set(
                this._positions[idx * 3],
                this._positions[idx * 3 + 1],
                this._positions[idx * 3 + 2]
            );
            _velVec.set(
                this._particleVel[idx * 3],
                this._particleVel[idx * 3 + 1],
                this._particleVel[idx * 3 + 2]
            );

            this.forceField.accumulateAcceleration(_posVec, _velVec, _acc);

            _velVec.addScaledVector(_acc, dt);
            _velVec.multiplyScalar(0.998);
            _posVec.addScaledVector(_velVec, dt);

            this._particleVel[idx * 3] = _velVec.x;
            this._particleVel[idx * 3 + 1] = _velVec.y;
            this._particleVel[idx * 3 + 2] = _velVec.z;
            this._positions[idx * 3] = _posVec.x;
            this._positions[idx * 3 + 1] = _posVec.y;
            this._positions[idx * 3 + 2] = _posVec.z;

            const lifeRatio = age / life;
            const fadeFactor = 1 - lifeRatio;
            this._sizes[idx] = this._particleInitialSize[idx] * Math.max(0.067, fadeFactor);

            const colorFade = 0.3 + fadeFactor * 0.7;
            this._colors[idx * 3] = this._particleInitialColor[idx * 3] * colorFade;
            this._colors[idx * 3 + 1] = this._particleInitialColor[idx * 3 + 1] * colorFade;
            this._colors[idx * 3 + 2] = this._particleInitialColor[idx * 3 + 2] * colorFade;

            if (Math.random() < 0.3) {
                this._writeTrailPoint(idx);
            }
        }

        (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;

        this._updateTrailFade(dt);
        (this.trailGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (this.trailGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        this.trailGeometry.setDrawRange(0, Math.min(this._trailWriteIndex * 2, this._maxTrailSegments * 2));
    }

    private _updateTrailFade(dt: number): void {
        const count = Math.min(this._trailWriteIndex * 2, this._maxTrailSegments * 2);
        for (let i = 0; i < count; i++) {
            this._trailAge[i] += dt;
            const alphaIdx = (i * 4) + 3;
            this._trailColors[alphaIdx] = Math.max(0, this._trailColors[alphaIdx] - dt * 0.8);
        }
    }

    public reset(): void {
        for (let i = 0; i < this._maxParticles; i++) {
            if (this._particleState[i].active) {
                this._killParticle(i);
            }
        }
        this._trailWriteIndex = 0;
        this._emissionAccumulator = 0;
        this._initInitialParticles(1000);
    }

    public setEmissionRate(rate: number): void {
        this.targetConfig.emissionRate = rate;
    }

    public setLifeRange(min: number, max: number): void {
        this.targetConfig.lifeMin = min;
        this.targetConfig.lifeMax = max;
    }

    public setSpeed(speed: number): void {
        this.targetConfig.speed = speed;
    }

    public setColorTheme(theme: ColorTheme): void {
        this.targetConfig.colorTheme = theme;
        this.currentConfig.colorTheme = theme;
    }

    public getActiveCount(): number {
        return this._activeCount;
    }
}
