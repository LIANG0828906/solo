import * as THREE from 'three';

export interface GateInfo {
    id: number;
    position: THREE.Vector3;
    openness: number;
    handlePosition: THREE.Vector3;
}

export class AqueductSystem {
    public group: THREE.Group;
    public mainAqueduct: THREE.Mesh;
    public gates: { mesh: THREE.Mesh; handle: THREE.Mesh; openness: number; id: number; position: THREE.Vector3 }[] = [];
    public branchAqueducts: THREE.Mesh[] = [];
    public waterParticles: THREE.Points;
    public splashParticles: THREE.Points;
    public river: THREE.Mesh;

    private particleCount: number = 300;
    private particleData: { position: THREE.Vector3; velocity: THREE.Vector3; life: number; active: boolean }[] = [];
    private splashData: { position: THREE.Vector3; velocity: THREE.Vector3; life: number; active: boolean }[] = [];
    private gateCount: number = 7;
    private mainAqueductLength: number = 15;

    constructor() {
        this.group = new THREE.Group();
        this.createRiver();
        this.createMainAqueduct();
        this.createGates();
        this.createBranchAqueducts();
        this.createWaterParticles();
        this.createSplashParticles();
    }

    private createRiver(): void {
        const riverShape = new THREE.Shape();
        const riverWidth = 3;
        const riverLength = 25;

        riverShape.moveTo(-15, -riverWidth / 2);
        riverShape.quadraticCurveTo(-10, -riverWidth / 2 - 0.5, -5, -riverWidth / 2);
        riverShape.lineTo(5, -riverWidth / 2);
        riverShape.quadraticCurveTo(10, -riverWidth / 2 + 0.5, 15, -riverWidth / 2);
        riverShape.lineTo(15, riverWidth / 2);
        riverShape.quadraticCurveTo(10, riverWidth / 2 + 0.5, 5, riverWidth / 2);
        riverShape.lineTo(-5, riverWidth / 2);
        riverShape.quadraticCurveTo(-10, riverWidth / 2 - 0.5, -15, riverWidth / 2);
        riverShape.lineTo(-15, -riverWidth / 2);

        const extrudeSettings = {
            depth: 1,
            bevelEnabled: false
        };

        const riverGeometry = new THREE.ExtrudeGeometry(riverShape, extrudeSettings);
        const riverMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A90D9,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.1
        });

        this.river = new THREE.Mesh(riverGeometry, riverMaterial);
        this.river.rotation.x = -Math.PI / 2;
        this.river.position.y = 0.5;
        this.river.position.z = 3;
        this.river.receiveShadow = true;
        this.group.add(this.river);

        const riverBedMaterial = new THREE.MeshStandardMaterial({
            color: 0x5C4033,
            roughness: 0.9
        });
        const riverBed = new THREE.Mesh(riverGeometry, riverBedMaterial);
        riverBed.rotation.x = -Math.PI / 2;
        riverBed.position.y = 0.3;
        riverBed.position.z = 3;
        riverBed.receiveShadow = true;
        this.group.add(riverBed);
    }

    private createMainAqueduct(): void {
        const points: THREE.Vector2[] = [];
        const radius = 1;
        const segments = 32;

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI;
            points.push(new THREE.Vector2(Math.cos(theta) * radius, Math.sin(theta) * radius));
        }

        const aqueductGeometry = new THREE.LatheGeometry(points, 8);
        aqueductGeometry.rotateZ(Math.PI / 2);
        aqueductGeometry.scale(1, 1, this.mainAqueductLength);

        const aqueductMaterial = new THREE.MeshStandardMaterial({
            color: 0xA0522D,
            roughness: 0.8,
            side: THREE.DoubleSide
        });

        this.mainAqueduct = new THREE.Mesh(aqueductGeometry, aqueductMaterial);
        this.mainAqueduct.position.set(1.5, 5, 0);
        this.mainAqueduct.castShadow = true;
        this.mainAqueduct.receiveShadow = true;
        this.group.add(this.mainAqueduct);

        const supportMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.8
        });

        for (let i = 0; i <= 5; i++) {
            const zPos = -this.mainAqueductLength / 2 + (i / 5) * this.mainAqueductLength;
            const pillarGeometry = new THREE.BoxGeometry(0.8, 5, 0.8);
            const pillar = new THREE.Mesh(pillarGeometry, supportMaterial);
            pillar.position.set(1.5, 2.5, zPos);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.group.add(pillar);
        }
    }

    private createGates(): void {
        const gateMaterial = new THREE.MeshStandardMaterial({
            color: 0x5C4033,
            roughness: 0.7,
            metalness: 0.2
        });

        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x32CD32,
            transparent: true,
            opacity: 0.7,
            roughness: 0.3,
            metalness: 0.5
        });

        for (let i = 0; i < this.gateCount; i++) {
            const zPos = -this.mainAqueductLength / 2 + 2 + i * 2;

            const gateGeometry = new THREE.BoxGeometry(2, 1, 0.15);
            const gate = new THREE.Mesh(gateGeometry, gateMaterial);
            gate.position.set(1.5, 5.5, zPos);
            gate.castShadow = true;
            gate.receiveShadow = true;
            this.group.add(gate);

            const handleGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.position.set(2.5, 6, zPos);
            handle.castShadow = true;
            this.group.add(handle);

            this.gates.push({
                mesh: gate,
                handle: handle,
                openness: 0,
                id: i,
                position: new THREE.Vector3(1.5, 5.5, zPos)
            });
        }
    }

    private createBranchAqueducts(): void {
        const branchMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.8
        });

        for (let i = 0; i < this.gateCount; i++) {
            const zPos = -this.mainAqueductLength / 2 + 2 + i * 2;

            const branchPoints: THREE.Vector2[] = [];
            const segments = 8;

            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const width = 1 - t * 0.5;
                const height = 0.3 - t * 0.1;
                branchPoints.push(new THREE.Vector2(-width / 2, 0));
                branchPoints.push(new THREE.Vector2(-width / 2, height));
                branchPoints.push(new THREE.Vector2(width / 2, height));
                branchPoints.push(new THREE.Vector2(width / 2, 0));
            }

            const branchShape = new THREE.Shape(branchPoints);
            const extrudeSettings = { depth: 0.1, bevelEnabled: false };
            const branchGeometry = new THREE.ExtrudeGeometry(branchShape, extrudeSettings);
            branchGeometry.rotateX(-Math.PI / 2);
            branchGeometry.scale(1, 1, 4);

            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            branch.position.set(5, 5, zPos);
            branch.rotation.y = Math.PI / 2;
            branch.castShadow = true;
            branch.receiveShadow = true;
            this.group.add(branch);
            this.branchAqueducts.push(branch);
        }
    }

    private createWaterParticles(): void {
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            this.particleData.push({
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                life: 0,
                active: false
            });
            this.resetParticle(i);

            positions[i * 3] = this.particleData[i].position.x;
            positions[i * 3 + 1] = this.particleData[i].position.y;
            positions[i * 3 + 2] = this.particleData[i].position.z;

            colors[i * 3] = 126 / 255;
            colors[i * 3 + 1] = 200 / 255;
            colors[i * 3 + 2] = 227 / 255;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        this.waterParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.group.add(this.waterParticles);
    }

    private createSplashParticles(): void {
        const splashCount = 100;
        const positions = new Float32Array(splashCount * 3);
        const colors = new Float32Array(splashCount * 3);

        for (let i = 0; i < splashCount; i++) {
            this.splashData.push({
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                life: 0,
                active: false
            });

            positions[i * 3] = 0;
            positions[i * 3 + 1] = -100;
            positions[i * 3 + 2] = 0;

            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        }

        const splashGeometry = new THREE.BufferGeometry();
        splashGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        splashGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const splashMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        this.splashParticles = new THREE.Points(splashGeometry, splashMaterial);
        this.group.add(this.splashParticles);
    }

    private resetParticle(index: number): void {
        const particle = this.particleData[index];
        particle.position.set(
            -12 + Math.random() * 4,
            0.6 + Math.random() * 0.4,
            2 + Math.random() * 2
        );
        particle.velocity.set(0.3 + Math.random() * 0.2, 0, Math.random() * 0.1 - 0.05);
        particle.life = 1;
        particle.active = true;
    }

    public update(deltaTime: number, wheelPosition: THREE.Vector3, wheelRadius: number): void {
        this.updateGates();
        this.updateWaterParticles(deltaTime, wheelPosition, wheelRadius);
        this.updateSplashParticles(deltaTime);
    }

    private updateGates(): void {
        this.gates.forEach(gate => {
            const targetY = 5.5 - gate.openness * 0.9;
            gate.mesh.position.y += (targetY - gate.mesh.position.y) * 0.1;
        });
    }

    private updateWaterParticles(deltaTime: number, wheelPosition: THREE.Vector3, wheelRadius: number): void {
        const positions = this.waterParticles.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particleData[i];

            if (!particle.active) {
                this.resetParticle(i);
                continue;
            }

            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 60));

            const dx = particle.position.x - wheelPosition.x;
            const dy = particle.position.y - wheelPosition.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < wheelRadius + 0.5 && dist > wheelRadius - 1) {
                this.createSplash(particle.position.clone());
                this.resetParticle(i);
                continue;
            }

            if (particle.position.x > 12) {
                this.resetParticle(i);
                continue;
            }

            positions[i * 3] = particle.position.x;
            positions[i * 3 + 1] = particle.position.y;
            positions[i * 3 + 2] = particle.position.z;
        }

        this.waterParticles.geometry.attributes.position.needsUpdate = true;
    }

    private createSplash(position: THREE.Vector3): void {
        for (let i = 0; i < 6; i++) {
            const inactiveIndex = this.splashData.findIndex(s => !s.active);
            if (inactiveIndex === -1) break;

            const splash = this.splashData[inactiveIndex];
            splash.position.copy(position);
            splash.velocity.set(
                (Math.random() - 0.5) * 0.3,
                0.3 + Math.random() * 0.2,
                (Math.random() - 0.5) * 0.3
            );
            splash.life = 0.2;
            splash.active = true;
        }
    }

    private updateSplashParticles(deltaTime: number): void {
        const positions = this.splashParticles.geometry.attributes.position.array as Float32Array;
        const gravity = -0.01;

        for (let i = 0; i < this.splashData.length; i++) {
            const splash = this.splashData[i];

            if (!splash.active) {
                positions[i * 3 + 1] = -100;
                continue;
            }

            splash.velocity.y += gravity;
            splash.position.add(splash.velocity.clone().multiplyScalar(deltaTime * 60));
            splash.life -= deltaTime;

            if (splash.life <= 0 || splash.position.y < 0) {
                splash.active = false;
                positions[i * 3 + 1] = -100;
                continue;
            }

            positions[i * 3] = splash.position.x;
            positions[i * 3 + 1] = splash.position.y;
            positions[i * 3 + 2] = splash.position.z;
        }

        this.splashParticles.geometry.attributes.position.needsUpdate = true;
    }

    public setGateOpenness(gateId: number, openness: number): void {
        const gate = this.gates.find(g => g.id === gateId);
        if (gate) {
            gate.openness = Math.max(0, Math.min(1, openness));
        }
    }

    public getGateOpenness(gateId: number): number {
        const gate = this.gates.find(g => g.id === gateId);
        return gate ? gate.openness : 0;
    }

    public getTotalFlow(): number {
        return this.gates.reduce((sum, gate) => sum + gate.openness * 0.5, 0);
    }

    public getGateFlow(gateId: number): number {
        return this.getGateOpenness(gateId) * 0.5;
    }

    public getGatesInfo(): GateInfo[] {
        return this.gates.map(gate => ({
            id: gate.id,
            position: gate.position.clone(),
            openness: gate.openness,
            handlePosition: gate.handle.position.clone()
        }));
    }

    public getBranchAqueductEndPosition(gateId: number): THREE.Vector3 {
        const zPos = -this.mainAqueductLength / 2 + 2 + gateId * 2;
        return new THREE.Vector3(9, 5, zPos);
    }

    public reset(): void {
        this.gates.forEach(gate => {
            gate.openness = 0;
            gate.mesh.position.y = 5.5;
        });
    }
}
