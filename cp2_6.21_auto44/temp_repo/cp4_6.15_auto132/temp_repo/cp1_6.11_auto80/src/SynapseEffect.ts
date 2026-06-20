import * as THREE from 'three';
import { NeuronConnection, NeuronNetwork } from './NeuronNetwork';

interface Vesicle {
    mesh: THREE.Mesh;
    basePosition: THREE.Vector3;
    offset: THREE.Vector3;
    baseRadius: number;
    active: boolean;
}

interface SynapseCluster {
    connection: NeuronConnection;
    vesicles: Vesicle[];
    diffusionProgress: number;
    isDiffusing: boolean;
    diffusionDirection: 1 | -1;
}

interface SpontaneousGlow {
    mesh: THREE.Mesh;
    life: number;
    maxLife: number;
    startRadius: number;
    endRadius: number;
    active: boolean;
    position: THREE.Vector3;
}

export class SynapseEffect {
    private scene: THREE.Scene;
    private network: NeuronNetwork;
    private clusters: Map<number, SynapseCluster> = new Map();
    
    private vesicleCount: number = 15;
    private vesicleMinCount: number = 10;
    private vesicleMaxCount: number = 20;
    private clusterRadius: number = 0.6;
    private diffuseRadius: number = 1.2;
    private vesicleSize: number = 0.05;
    private diffuseVesicleSize: number = 0.08;
    private diffuseDuration: number = 0.4;
    
    private spontaneousGlows: SpontaneousGlow[] = [];
    private glowPool: SpontaneousGlow[] = [];
    private maxGlows: number = 30;
    private nextSpontaneousTime: number = 0;
    private spontaneousInterval: number = 2000;
    
    private baseColor: THREE.Color = new THREE.Color(0xFF6B6B);
    private diffuseColor: THREE.Color = new THREE.Color(0x00FFCC);
    private glowColor: THREE.Color = new THREE.Color(0xFF9F43);

    constructor(scene: THREE.Scene, network: NeuronNetwork) {
        this.scene = scene;
        this.network = network;
        this.initClusters();
        this.scheduleNextSpontaneous();
    }

    private initClusters(): void {
        for (const connection of this.network.connections) {
            this.createCluster(connection);
        }
    }

    private createCluster(connection: NeuronConnection): void {
        const count = Math.floor(Math.random() * (this.vesicleMaxCount - this.vesicleMinCount + 1)) + this.vesicleMinCount;
        const vesicles: Vesicle[] = [];
        const midPoint = connection.midPoint;

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = this.clusterRadius * Math.cbrt(Math.random());

            const offset = new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );

            const position = midPoint.clone().add(offset);

            const geometry = new THREE.SphereGeometry(this.vesicleSize, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: this.baseColor,
                transparent: true,
                opacity: 0.9
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            this.scene.add(mesh);

            vesicles.push({
                mesh,
                basePosition: midPoint.clone(),
                offset: offset.clone(),
                baseRadius: r,
                active: true
            });
        }

        this.clusters.set(connection.id, {
            connection,
            vesicles,
            diffusionProgress: 0,
            isDiffusing: false,
            diffusionDirection: 1
        });
    }

    private scheduleNextSpontaneous(): void {
        this.nextSpontaneousTime = performance.now() + this.spontaneousInterval;
    }

    private createSpontaneousGlow(position: THREE.Vector3): SpontaneousGlow | null {
        if (this.spontaneousGlows.length >= this.maxGlows) {
            return null;
        }

        let glow: SpontaneousGlow;

        if (this.glowPool.length > 0) {
            glow = this.glowPool.pop()!;
            glow.position.copy(position);
            glow.mesh.position.copy(position);
            glow.life = 0;
            glow.active = true;
            glow.mesh.visible = true;
        } else {
            const geometry = new THREE.SphereGeometry(0.3, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: this.glowColor,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            this.scene.add(mesh);

            glow = {
                mesh,
                life: 0,
                maxLife: 0.3,
                startRadius: 0.3,
                endRadius: 0.8,
                active: true,
                position: position.clone()
            };
        }

        this.spontaneousGlows.push(glow);
        return glow;
    }

    private returnGlowToPool(glow: SpontaneousGlow): void {
        glow.active = false;
        glow.mesh.visible = false;
        this.glowPool.push(glow);
    }

    public triggerDiffusion(connection: NeuronConnection): void {
        const cluster = this.clusters.get(connection.id);
        if (!cluster || cluster.isDiffusing) return;

        cluster.isDiffusing = true;
        cluster.diffusionDirection = 1;
        cluster.diffusionProgress = 0;
    }

    private updateCluster(cluster: SynapseCluster, deltaTime: number): void {
        if (!cluster.isDiffusing) return;

        const speed = 1 / this.diffuseDuration;
        cluster.diffusionProgress += cluster.diffusionDirection * speed * deltaTime;

        if (cluster.diffusionDirection === 1 && cluster.diffusionProgress >= 1) {
            cluster.diffusionProgress = 1;
            cluster.diffusionDirection = -1;
        } else if (cluster.diffusionDirection === -1 && cluster.diffusionProgress <= 0) {
            cluster.diffusionProgress = 0;
            cluster.diffusionDirection = 1;
            cluster.isDiffusing = false;
        }

        const t = cluster.diffusionProgress;
        const currentRadius = this.clusterRadius + (this.diffuseRadius - this.clusterRadius) * t;
        const currentSize = this.vesicleSize + (this.diffuseVesicleSize - this.vesicleSize) * t;
        const currentColor = this.baseColor.clone().lerp(this.diffuseColor, t);

        for (const vesicle of cluster.vesicles) {
            const scale = currentRadius / vesicle.baseRadius;
            const newOffset = vesicle.offset.clone().multiplyScalar(scale);
            vesicle.mesh.position.copy(cluster.connection.midPoint.clone().add(newOffset));
            vesicle.mesh.scale.setScalar(currentSize / this.vesicleSize);
            (vesicle.mesh.material as THREE.MeshBasicMaterial).color.copy(currentColor);
        }
    }

    public update(deltaTime: number, paused: boolean): void {
        if (paused) return;

        const now = performance.now();

        if (now >= this.nextSpontaneousTime) {
            const connections = this.network.connections;
            if (connections.length > 0) {
                const randomConn = connections[Math.floor(Math.random() * connections.length)];
                this.createSpontaneousGlow(randomConn.midPoint);
            }
            this.scheduleNextSpontaneous();
        }

        for (const cluster of this.clusters.values()) {
            this.updateCluster(cluster, deltaTime);
        }

        for (let i = this.spontaneousGlows.length - 1; i >= 0; i--) {
            const glow = this.spontaneousGlows[i];
            if (!glow.active) continue;

            glow.life += deltaTime;
            const t = glow.life / glow.maxLife;

            if (t >= 1) {
                this.returnGlowToPool(glow);
                this.spontaneousGlows.splice(i, 1);
                continue;
            }

            const radius = glow.startRadius + (glow.endRadius - glow.startRadius) * t;
            glow.mesh.scale.setScalar(radius / glow.startRadius);

            let opacity: number;
            if (t < 0.3) {
                opacity = (t / 0.3) * 0.6;
            } else {
                opacity = 0.6 * (1 - (t - 0.3) / 0.7);
            }
            (glow.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, opacity);
        }
    }

    public setPerformanceMode(low: boolean): void {
        if (low) {
            this.vesicleCount = 6;
            this.vesicleMinCount = 4;
            this.vesicleMaxCount = 8;
            this.maxGlows = 15;
        } else {
            this.vesicleCount = 15;
            this.vesicleMinCount = 10;
            this.vesicleMaxCount = 20;
            this.maxGlows = 30;
        }
    }

    public getActiveVesicleCount(): number {
        let count = 0;
        for (const cluster of this.clusters.values()) {
            count += cluster.vesicles.filter(v => v.active).length;
        }
        return count;
    }

    public getActiveGlowCount(): number {
        return this.spontaneousGlows.filter(g => g.active).length;
    }
}
