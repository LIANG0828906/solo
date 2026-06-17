import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
export class ParticleSystem {
    constructor(scene) {
        this.particles = new Map();
        this.maxParticlesPerTrack = 200;
        this.maxTotalParticles = 500;
        this.particleSize = 4;
        this.particleLife = 3;
        this.normalEmitRate = 10;
        this.reducedEmitRate = 5;
        this.minVelocity = 2;
        this.maxVelocity = 8;
        this.lastEmitTime = 0;
        this.trackParticleCounts = new Map();
        this.scene = scene;
        this.particleGeometry = new THREE.PlaneGeometry(this.particleSize, this.particleSize);
    }
    get totalParticles() {
        return this.particles.size;
    }
    getCurrentEmitRate() {
        return this.totalParticles > this.maxTotalParticles ? this.reducedEmitRate : this.normalEmitRate;
    }
    emit(track, count) {
        if (!track)
            return;
        const trackCount = this.trackParticleCounts.get(track.id) || 0;
        if (trackCount >= this.maxParticlesPerTrack)
            return;
        if (this.totalParticles >= this.maxTotalParticles)
            return;
        const densityMultiplier = track.getParticleDensityMultiplier();
        const volumeFactor = track.volume / 100;
        const actualCount = Math.min(count, this.maxParticlesPerTrack - trackCount, this.maxTotalParticles - this.totalParticles);
        for (let i = 0; i < actualCount; i++) {
            if (Math.random() < volumeFactor * densityMultiplier * 0.1) {
                this.createParticle(track);
            }
        }
    }
    createParticle(track) {
        const color = new THREE.Color(track.color);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(this.particleGeometry, material);
        const direction = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize();
        const nodeRadius = 50 * (track.volume / 100 * 0.6 + 0.8);
        mesh.position.copy(track.position).add(direction.clone().multiplyScalar(nodeRadius));
        const speed = this.minVelocity + Math.random() * (this.maxVelocity - this.minVelocity);
        const velocity = direction.clone().multiplyScalar(speed);
        const particle = {
            id: uuidv4(),
            mesh,
            velocity,
            life: this.particleLife,
            maxLife: this.particleLife,
            trackId: track.id,
            initialOpacity: 0.8
        };
        this.particles.set(particle.id, particle);
        this.scene.add(mesh);
        const currentCount = this.trackParticleCounts.get(track.id) || 0;
        this.trackParticleCounts.set(track.id, currentCount + 1);
    }
    update(deltaTime, tracks) {
        const now = performance.now();
        const emitInterval = 1000 / this.getCurrentEmitRate();
        if (now - this.lastEmitTime > emitInterval) {
            tracks.forEach(track => {
                const particlesToEmit = Math.ceil(track.volume / 10);
                this.emit(track, particlesToEmit);
            });
            this.lastEmitTime = now;
        }
        const particlesToRemove = [];
        this.particles.forEach((particle) => {
            particle.life -= deltaTime;
            if (particle.life <= 0) {
                particlesToRemove.push(particle.id);
                return;
            }
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 60));
            const lifeRatio = particle.life / particle.maxLife;
            const material = particle.mesh.material;
            material.opacity = particle.initialOpacity * lifeRatio;
            particle.velocity.multiplyScalar(0.98);
        });
        particlesToRemove.forEach(id => {
            this.removeParticle(id);
        });
    }
    removeParticle(id) {
        const particle = this.particles.get(id);
        if (particle) {
            this.scene.remove(particle.mesh);
            const material = particle.mesh.material;
            material.dispose();
            const trackCount = this.trackParticleCounts.get(particle.trackId) || 0;
            this.trackParticleCounts.set(particle.trackId, Math.max(0, trackCount - 1));
            this.particles.delete(id);
        }
    }
    clearTrackParticles(trackId) {
        const particlesToRemove = [];
        this.particles.forEach((particle, id) => {
            if (particle.trackId === trackId) {
                particlesToRemove.push(id);
            }
        });
        particlesToRemove.forEach(id => this.removeParticle(id));
    }
    dispose() {
        this.particles.forEach((_, id) => {
            this.removeParticle(id);
        });
        this.particleGeometry.dispose();
        this.particles.clear();
        this.trackParticleCounts.clear();
    }
}
