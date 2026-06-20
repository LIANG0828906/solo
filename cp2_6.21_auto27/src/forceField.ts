import * as THREE from 'three';

export interface GravityPointData {
    id: string;
    position: THREE.Vector3;
    mass: number;
    radius: number;
    color: number;
}

export interface VortexFieldData {
    id: string;
    position: THREE.Vector3;
    strength: number;
    radius: number;
    axis: THREE.Vector3;
}

const _tempVec3A = new THREE.Vector3();
const _tempVec3B = new THREE.Vector3();
const _tempVec3C = new THREE.Vector3();

export class GravityPoint {
    public id: string;
    public position: THREE.Vector3;
    public mass: number;
    public targetMass: number;
    public radius: number;
    public color: number;
    public mesh: THREE.Mesh;

    constructor(data: GravityPointData) {
        this.id = data.id;
        this.position = data.position.clone();
        this.mass = data.mass;
        this.targetMass = data.mass;
        this.radius = data.radius;
        this.color = data.color;
        this.mesh = this._createMesh();
    }

    private _createMesh(): THREE.Mesh {
        const geometry = new THREE.SphereGeometry(0.5, 24, 24);
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.7,
            metalness: 0.3,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        mesh.userData.isGravityPoint = true;
        mesh.userData.gravityPointRef = this;
        return mesh;
    }

    public setMass(mass: number): void {
        this.targetMass = mass;
    }

    public update(dt: number): void {
        this.mass += (this.targetMass - this.mass) * Math.min(dt / 0.3, 1);
        this.mesh.position.copy(this.position);
        const s = 0.5 + this.mass * 0.3;
        this.mesh.scale.setScalar(s);
        const mat = this.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.5 + this.mass * 0.2;
    }

    public calculateAcceleration(
        pos: THREE.Vector3,
        out: THREE.Vector3
    ): boolean {
        out.subVectors(this.position, pos);
        const distSq = out.lengthSq();
        const radiusSq = this.radius * this.radius;
        if (distSq > radiusSq || distSq < 0.01) {
            out.set(0, 0, 0);
            return false;
        }
        const dist = Math.sqrt(distSq);
        const falloff = 1 - dist / this.radius;
        const strength = this.mass * falloff * falloff * 8;
        out.normalize().multiplyScalar(strength);
        return true;
    }
}

export class VortexField {
    public id: string;
    public position: THREE.Vector3;
    public strength: number;
    public targetStrength: number;
    public radius: number;
    public axis: THREE.Vector3;
    public ring: THREE.LineSegments;

    constructor(data: VortexFieldData) {
        this.id = data.id;
        this.position = data.position.clone();
        this.strength = data.strength;
        this.targetStrength = data.strength;
        this.radius = data.radius;
        this.axis = data.axis.clone().normalize();
        this.ring = this._createRing();
    }

    private _createRing(): THREE.LineSegments {
        const points: THREE.Vector3[] = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * this.radius * 0.3,
                0,
                Math.sin(angle) * this.radius * 0.3
            ));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3
        });
        const ring = new THREE.LineSegments(new THREE.BufferGeometry(), material);
        const positions = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y;
            positions[i * 3 + 2] = points[i].z;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        ring.geometry = geometry;
        ring.position.copy(this.position);
        return ring;
    }

    public setStrength(strength: number): void {
        this.targetStrength = strength;
    }

    public update(dt: number, time: number): void {
        this.strength += (this.targetStrength - this.strength) * Math.min(dt / 0.3, 1);
        this.ring.rotation.y = time * (0.5 + this.strength * 0.3);
        const scale = 0.3 + this.strength * 0.25;
        this.ring.scale.setScalar(scale);
        const mat = this.ring.material as THREE.LineBasicMaterial;
        mat.opacity = 0.2 + this.strength * 0.1;
    }

    public calculateAcceleration(
        pos: THREE.Vector3,
        out: THREE.Vector3
    ): boolean {
        _tempVec3A.subVectors(pos, this.position);
        const distSq = _tempVec3A.lengthSq();
        const radiusSq = this.radius * this.radius;
        if (distSq > radiusSq || distSq < 0.01) {
            out.set(0, 0, 0);
            return false;
        }
        _tempVec3B.crossVectors(this.axis, _tempVec3A).normalize();
        const dist = Math.sqrt(distSq);
        const falloff = 1 - dist / this.radius;
        const strength = this.strength * falloff * 12;
        out.copy(_tempVec3B).multiplyScalar(strength);
        _tempVec3C.copy(_tempVec3A).normalize().multiplyScalar(-this.strength * falloff * 2);
        out.add(_tempVec3C);
        return true;
    }
}

export class ForceFieldManager {
    public gravityPoints: GravityPoint[] = [];
    public vortexFields: VortexField[] = [];
    public readonly group: THREE.Group;

    constructor() {
        this.group = new THREE.Group();
        this._initDefaultFields();
    }

    private _initDefaultFields(): void {
        const gravityColors = [0xff00aa, 0x00ffaa, 0xaaaaff];
        const gpPositions = [
            new THREE.Vector3(-6, 3, 2),
            new THREE.Vector3(5, -4, -3),
            new THREE.Vector3(2, 6, -4)
        ];
        for (let i = 0; i < 3; i++) {
            const gp = new GravityPoint({
                id: `gravity-${i}`,
                position: gpPositions[i],
                mass: 0.5,
                radius: 5,
                color: gravityColors[i]
            });
            this.gravityPoints.push(gp);
            this.group.add(gp.mesh);
        }

        const vPositions = [
            new THREE.Vector3(-4, -3, 4),
            new THREE.Vector3(4, 2, 3)
        ];
        for (let i = 0; i < 2; i++) {
            const vf = new VortexField({
                id: `vortex-${i}`,
                position: vPositions[i],
                strength: 1.0,
                radius: 6,
                axis: new THREE.Vector3(0, 1, 0)
            });
            this.vortexFields.push(vf);
            this.group.add(vf.ring);
        }
    }

    public setAllGravityMass(mass: number): void {
        for (const gp of this.gravityPoints) {
            gp.setMass(mass);
        }
    }

    public setAllVortexStrength(strength: number): void {
        for (const vf of this.vortexFields) {
            vf.setStrength(strength);
        }
    }

    public update(dt: number, time: number): void {
        for (const gp of this.gravityPoints) {
            gp.update(dt);
        }
        for (const vf of this.vortexFields) {
            vf.update(dt, time);
        }
    }

    public accumulateAcceleration(
        pos: THREE.Vector3,
        vel: THREE.Vector3,
        out: THREE.Vector3
    ): void {
        out.set(0, 0, 0);
        for (const gp of this.gravityPoints) {
            if (gp.calculateAcceleration(pos, _tempVec3A)) {
                out.add(_tempVec3A);
            }
        }
        for (const vf of this.vortexFields) {
            if (vf.calculateAcceleration(pos, _tempVec3A)) {
                out.add(_tempVec3A);
            }
        }
        void vel;
    }

    public getDraggableMeshes(): THREE.Mesh[] {
        return this.gravityPoints.map(gp => gp.mesh);
    }
}
