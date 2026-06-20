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
export const TRAIL_SEGMENTS_PER_PARTICLE = 30;
export const TRAIL_LIFETIME = 1.0;
export const MAX_TRAIL_SEGMENTS = 2000;

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
    public trailGlowLine: THREE.LineSegments;
    public trailGeometry: THREE.BufferGeometry;
    public trailGlowGeometry: THREE.BufferGeometry;
    public material: THREE.PointsMaterial;
    public trailMaterial: THREE.LineBasicMaterial;
    public trailGlowMaterial: THREE.LineBasicMaterial;

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
    private _particleActive!: Uint8Array;

    private _freeIndices!: Int32Array;
    private _freeIndexTop: number = 0;

    private _trailPositions!: Float32Array;
    private _trailColors!: Float32Array;
    private _trailGlowColors!: Float32Array;
    private _trailBaseColors!: Float32Array;
    private _trailGlowBaseColors!: Float32Array;
    private _trailTimestamp!: Float32Array;
    private _maxTrailSegments: number;
    private _trailCount: number = 0;
    private _trailHead: number = 0;
    private _flowTime: number = 0;

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
            size: 0.35,
            vertexColors: true,
            map: texture,
            transparent: true,
            alphaTest: 0.001,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);

        this._maxTrailSegments = MAX_TRAIL_SEGMENTS;
        this._trailPositions = new Float32Array(this._maxTrailSegments * 6);
        this._trailColors = new Float32Array(this._maxTrailSegments * 8);
        this._trailGlowColors = new Float32Array(this._maxTrailSegments * 8);
        this._trailBaseColors = new Float32Array(this._maxTrailSegments * 8);
        this._trailGlowBaseColors = new Float32Array(this._maxTrailSegments * 8);
        this._trailTimestamp = new Float32Array(this._maxTrailSegments * 2);

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

        this.trailGlowGeometry = new THREE.BufferGeometry();
        this.trailGlowGeometry.setAttribute('position', new THREE.BufferAttribute(this._trailPositions, 3));
        this.trailGlowGeometry.setAttribute('color', new THREE.BufferAttribute(this._trailGlowColors, 4));
        this.trailGlowGeometry.setDrawRange(0, 0);

        this.trailGlowMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            linewidth: 1
        });

        this.trailGlowLine = new THREE.LineSegments(this.trailGlowGeometry, this.trailGlowMaterial);
        this.scene.add(this.trailGlowLine);

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
        this._particleActive = new Uint8Array(this._maxParticles);

        this._freeIndices = new Int32Array(this._maxParticles);
        this._freeIndexTop = this._maxParticles;
        for (let i = 0; i < this._maxParticles; i++) {
            this._freeIndices[i] = this._maxParticles - 1 - i;
            this._positions[i * 3 + 1] = -99999;
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

    private _acquireIndex(): number {
        if (this._freeIndexTop <= 0) return -1;
        this._freeIndexTop--;
        return this._freeIndices[this._freeIndexTop];
    }

    private _releaseIndex(idx: number): void {
        this._freeIndices[this._freeIndexTop] = idx;
        this._freeIndexTop++;
    }

    private _emitParticle(): boolean {
        const idx = this._acquireIndex();
        if (idx === -1) return false;

        this._particleActive[idx] = 1;
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
        if (this._particleActive[idx] === 0) return;
        this._particleActive[idx] = 0;
        this._activeCount--;
        this._releaseIndex(idx);
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

    private _writeTrailSegment(pIdx: number, nowTime: number): void {
        if (this._trailCount < this._maxTrailSegments) {
            this._trailCount++;
        }

        const head = this._trailHead;
        this._trailHead = (this._trailHead + 1) % this._maxTrailSegments;

        const posOffset = head * 6;
        const colorOffset = head * 8;
        const timeOffset = head * 2;

        const px = this._positions[pIdx * 3];
        const py = this._positions[pIdx * 3 + 1];
        const pz = this._positions[pIdx * 3 + 2];
        const pr = this._colors[pIdx * 3];
        const pg = this._colors[pIdx * 3 + 1];
        const pb = this._colors[pIdx * 3 + 2];

        const vx = this._particleVel[pIdx * 3];
        const vy = this._particleVel[pIdx * 3 + 1];
        const vz = this._particleVel[pIdx * 3 + 2];
        const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

        this._trailPositions[posOffset] = px;
        this._trailPositions[posOffset + 1] = py;
        this._trailPositions[posOffset + 2] = pz;
        this._trailPositions[posOffset + 3] = px;
        this._trailPositions[posOffset + 4] = py;
        this._trailPositions[posOffset + 5] = pz;

        const flowPhase = this._flowTime + head * 0.15;
        const brightness = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(flowPhase));
        const speedBoost = Math.min(1.0, speed * 0.15);
        const totalBoost = brightness + speedBoost;

        this._trailBaseColors[colorOffset] = pr * totalBoost;
        this._trailBaseColors[colorOffset + 1] = pg * totalBoost;
        this._trailBaseColors[colorOffset + 2] = pb * totalBoost;
        this._trailBaseColors[colorOffset + 4] = pr * totalBoost * 1.5;
        this._trailBaseColors[colorOffset + 5] = pg * totalBoost * 1.5;
        this._trailBaseColors[colorOffset + 6] = pb * totalBoost * 1.5;

        this._trailColors[colorOffset] = pr * totalBoost;
        this._trailColors[colorOffset + 1] = pg * totalBoost;
        this._trailColors[colorOffset + 2] = pb * totalBoost;
        this._trailColors[colorOffset + 3] = 0.8;
        this._trailColors[colorOffset + 4] = pr * totalBoost * 1.5;
        this._trailColors[colorOffset + 5] = pg * totalBoost * 1.5;
        this._trailColors[colorOffset + 6] = pb * totalBoost * 1.5;
        this._trailColors[colorOffset + 7] = 0.8;

        const glowBoost = totalBoost * 2.2;
        this._trailGlowBaseColors[colorOffset] = pr * glowBoost;
        this._trailGlowBaseColors[colorOffset + 1] = pg * glowBoost;
        this._trailGlowBaseColors[colorOffset + 2] = pb * glowBoost;
        this._trailGlowBaseColors[colorOffset + 4] = pr * glowBoost * 1.4;
        this._trailGlowBaseColors[colorOffset + 5] = pg * glowBoost * 1.4;
        this._trailGlowBaseColors[colorOffset + 6] = pb * glowBoost * 1.4;

        this._trailGlowColors[colorOffset] = pr * glowBoost;
        this._trailGlowColors[colorOffset + 1] = pg * glowBoost;
        this._trailGlowColors[colorOffset + 2] = pb * glowBoost;
        this._trailGlowColors[colorOffset + 3] = 0.25;
        this._trailGlowColors[colorOffset + 4] = pr * glowBoost * 1.4;
        this._trailGlowColors[colorOffset + 5] = pg * glowBoost * 1.4;
        this._trailGlowColors[colorOffset + 6] = pb * glowBoost * 1.4;
        this._trailGlowColors[colorOffset + 7] = 0.25;

        this._trailTimestamp[timeOffset] = nowTime;
        this._trailTimestamp[timeOffset + 1] = nowTime;
    }

    public update(dt: number): void {
        this._updateCurrentConfig(dt);

        this._emissionAccumulator += this.currentConfig.emissionRate * dt;
        while (this._emissionAccumulator >= 1) {
            if (!this._emitParticle()) break;
            this._emissionAccumulator -= 1;
        }

        const nowTime = performance.now() / 1000;
        this._flowTime += dt * 2.5;

        for (let idx = 0; idx < this._maxParticles; idx++) {
            if (this._particleActive[idx] === 0) continue;

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

            if (Math.random() < 0.35) {
                this._writeTrailSegment(idx, nowTime);
            }
        }

        (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;

        this._updateTrailFade(nowTime);
        (this.trailGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (this.trailGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        (this.trailGlowGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        this.trailGeometry.setDrawRange(0, this._trailCount * 2);
        this.trailGlowGeometry.setDrawRange(0, this._trailCount * 2);
    }

    private _updateTrailFade(nowTime: number): void {
        const count = this._trailCount;
        for (let i = 0; i < count; i++) {
            const segIdx = (this._trailHead + this._maxTrailSegments - count + i) % this._maxTrailSegments;
            const colorOffset = segIdx * 8;
            const timeOffset = segIdx * 2;

            const t0 = nowTime - this._trailTimestamp[timeOffset];
            const t1 = nowTime - this._trailTimestamp[timeOffset + 1];

            const ageRatio0 = Math.min(1.0, t0 / TRAIL_LIFETIME);
            const ageRatio1 = Math.min(1.0, t1 / TRAIL_LIFETIME);

            const alpha0 = 0.8 * Math.exp(-ageRatio0 * 3.5);
            const alpha1 = 0.8 * Math.exp(-ageRatio1 * 3.5);

            const flowPhase = this._flowTime + segIdx * 0.12;
            const wave = 0.5 + 0.5 * Math.sin(flowPhase);
            const flowMod = 0.7 + 0.6 * wave;
            const ageDim = 1.0 - ageRatio0 * 0.5;
            const totalMod = flowMod * ageDim;

            const br0 = this._trailBaseColors[colorOffset];
            const bg0 = this._trailBaseColors[colorOffset + 1];
            const bb0 = this._trailBaseColors[colorOffset + 2];
            const br1 = this._trailBaseColors[colorOffset + 4];
            const bg1 = this._trailBaseColors[colorOffset + 5];
            const bb1 = this._trailBaseColors[colorOffset + 6];

            this._trailColors[colorOffset] = br0 * totalMod;
            this._trailColors[colorOffset + 1] = bg0 * totalMod;
            this._trailColors[colorOffset + 2] = bb0 * totalMod;
            this._trailColors[colorOffset + 3] = Math.max(0, alpha0);
            this._trailColors[colorOffset + 4] = br1 * totalMod * 1.1;
            this._trailColors[colorOffset + 5] = bg1 * totalMod * 1.1;
            this._trailColors[colorOffset + 6] = bb1 * totalMod * 1.1;
            this._trailColors[colorOffset + 7] = Math.max(0, alpha1);

            const gbr0 = this._trailGlowBaseColors[colorOffset];
            const gbg0 = this._trailGlowBaseColors[colorOffset + 1];
            const gbb0 = this._trailGlowBaseColors[colorOffset + 2];
            const gbr1 = this._trailGlowBaseColors[colorOffset + 4];
            const gbg1 = this._trailGlowBaseColors[colorOffset + 5];
            const gbb1 = this._trailGlowBaseColors[colorOffset + 6];

            const glowMod = flowMod * 1.5 * ageDim;
            const glowAlpha0 = 0.25 * Math.exp(-ageRatio0 * 2.8);
            const glowAlpha1 = 0.25 * Math.exp(-ageRatio1 * 2.8);

            this._trailGlowColors[colorOffset] = gbr0 * glowMod;
            this._trailGlowColors[colorOffset + 1] = gbg0 * glowMod;
            this._trailGlowColors[colorOffset + 2] = gbb0 * glowMod;
            this._trailGlowColors[colorOffset + 3] = Math.max(0, glowAlpha0);
            this._trailGlowColors[colorOffset + 4] = gbr1 * glowMod * 1.1;
            this._trailGlowColors[colorOffset + 5] = gbg1 * glowMod * 1.1;
            this._trailGlowColors[colorOffset + 6] = gbb1 * glowMod * 1.1;
            this._trailGlowColors[colorOffset + 7] = Math.max(0, glowAlpha1);
        }
    }

    public reset(): void {
        for (let i = 0; i < this._maxParticles; i++) {
            if (this._particleActive[i] === 1) {
                this._killParticle(i);
            }
        }
        this._trailHead = 0;
        this._trailCount = 0;
        this._flowTime = 0;
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
