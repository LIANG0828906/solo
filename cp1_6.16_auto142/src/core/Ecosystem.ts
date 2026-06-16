import * as THREE from 'three';

const EARTH_RADIUS = 5;
const PLANKTON_RADIUS = 0.08;
const PLANKTON_HEIGHT_MIN = 0.01;
const PLANKTON_HEIGHT_MAX = 0.02;
const PLANKTON_MAX_CHANGE_PER_SEC = 200;
const FISH_SCHOOL_MIN = 3;
const FISH_SCHOOL_MAX = 5;
const FISH_PER_SCHOOL = 100;
const FISH_TOTAL_MAX = 500;
const FISH_LENGTH = 0.12;
const FISH_HEIGHT = 0.08;

const COLOR_COLD = new THREE.Color(0x4682B4);
const COLOR_WARM = new THREE.Color(0x32CD32);
const COLOR_FISH = new THREE.Color(0xC0C0C0);

interface PlanktonData {
    lat: number;
    lon: number;
    height: number;
}

interface FishData {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    schoolIndex: number;
    localOffset: THREE.Vector3;
}

interface FishSchoolData {
    center: THREE.Vector3;
    targetCenter: THREE.Vector3;
    velocity: THREE.Vector3;
    lat: number;
    lon: number;
}

export class Ecosystem {
    private scene: THREE.Scene | null = null;

    private planktonGeometry: THREE.BufferGeometry | null = null;
    private planktonMaterial: THREE.PointsMaterial | null = null;
    private planktonPoints: THREE.Points | null = null;
    private planktonData: PlanktonData[] = [];
    private planktonTargetCount = 0;
    private planktonPositions: Float32Array | null = null;
    private planktonColors: Float32Array | null = null;

    private fishGeometry: THREE.BufferGeometry | null = null;
    private fishMaterial: THREE.MeshStandardMaterial | null = null;
    private fishMesh: THREE.InstancedMesh | null = null;
    private fishData: FishData[] = [];
    private fishSchools: FishSchoolData[] = [];
    private fishDummy: THREE.Object3D = new THREE.Object3D();

    private tempVec3: THREE.Vector3 = new THREE.Vector3();
    private tempVec3B: THREE.Vector3 = new THREE.Vector3();
    private tempColor: THREE.Color = new THREE.Color();
    private tempQuat: THREE.Quaternion = new THREE.Quaternion();
    private upAxis: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

    public init(scene: THREE.Scene): void {
        this.scene = scene;
        this.initPlankton();
        this.initFish();
    }

    private initPlankton(): void {
        this.planktonGeometry = new THREE.BufferGeometry();
        this.planktonMaterial = new THREE.PointsMaterial({
            size: PLANKTON_RADIUS,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true,
            depthWrite: false,
        });
        this.planktonPoints = new THREE.Points(this.planktonGeometry, this.planktonMaterial);
        this.scene?.add(this.planktonPoints);
    }

    private initFish(): void {
        this.fishGeometry = this.createFishGeometry();
        this.fishMaterial = new THREE.MeshStandardMaterial({
            color: COLOR_FISH,
            metalness: 0.8,
            roughness: 0.2,
            side: THREE.DoubleSide,
        });

        const schoolCount = FISH_SCHOOL_MIN + Math.floor(Math.random() * (FISH_SCHOOL_MAX - FISH_SCHOOL_MIN + 1));
        const fishPerSchool = Math.min(FISH_PER_SCHOOL, Math.floor(FISH_TOTAL_MAX / schoolCount));
        const totalFish = schoolCount * fishPerSchool;

        this.fishMesh = new THREE.InstancedMesh(this.fishGeometry, this.fishMaterial, totalFish);
        this.fishMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene?.add(this.fishMesh);

        this.fishSchools = [];
        for (let i = 0; i < schoolCount; i++) {
            const { lat, lon } = this.randomOceanPosition();
            const center = this.latLonToVec3(lat, lon, EARTH_RADIUS + 0.05);
            this.fishSchools.push({
                center: center.clone(),
                targetCenter: center.clone(),
                velocity: new THREE.Vector3(),
                lat,
                lon,
            });
        }

        this.fishData = [];
        let instanceIndex = 0;
        for (let s = 0; s < schoolCount; s++) {
            const school = this.fishSchools[s];
            for (let f = 0; f < fishPerSchool; f++) {
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.8,
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.8
                );
                const pos = school.center.clone().add(offset);
                this.projectToSphere(pos, EARTH_RADIUS + 0.05);

                this.fishData.push({
                    position: pos,
                    velocity: new THREE.Vector3(),
                    schoolIndex: s,
                    localOffset: offset,
                });

                this.updateFishInstance(instanceIndex, pos, school.velocity);
                instanceIndex++;
            }
        }
        this.fishMesh.count = totalFish;
        this.fishMesh.instanceMatrix.needsUpdate = true;
    }

    private createFishGeometry(): THREE.BufferGeometry {
        const geometry = new THREE.BufferGeometry();
        const hl = FISH_LENGTH / 2;
        const hh = FISH_HEIGHT / 2;

        const vertices = new Float32Array([
            -hl, 0, 0,
            hl, 0, 0,
            0, hh, 0,

            -hl, 0, 0,
            0, -hh, 0,
            hl, 0, 0,
        ]);

        const normals = new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
        ]);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        return geometry;
    }

    private randomOceanPosition(): { lat: number; lon: number } {
        for (let i = 0; i < 100; i++) {
            const lat = (Math.random() - 0.5) * Math.PI;
            const lon = (Math.random() - 0.5) * Math.PI * 2;
            if (this.isOcean(lat, lon)) {
                return { lat, lon };
            }
        }
        return { lat: (Math.random() - 0.5) * 0.5, lon: (Math.random() - 0.5) * Math.PI * 2 };
    }

    private isOcean(lat: number, lon: number): boolean {
        const absLat = Math.abs(lat);
        const absLon = Math.abs(lon);

        if (absLat > 1.2) return true;

        if (absLat < 0.8 && absLon > 0.5 && absLon < 1.8) return false;
        if (absLat < 0.6 && absLon > 2.2 && absLon < 2.9) return false;
        if (lat > 0.3 && lat < 0.9 && absLon < 0.4) return false;

        return true;
    }

    private latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
        const cosLat = Math.cos(lat);
        return new THREE.Vector3(
            radius * cosLat * Math.cos(lon),
            radius * Math.sin(lat),
            radius * cosLat * Math.sin(lon)
        );
    }

    private vec3ToLatLon(vec: THREE.Vector3): { lat: number; lon: number } {
        const r = vec.length();
        const lat = Math.asin(Math.max(-1, Math.min(1, vec.y / r)));
        const cosLat = Math.cos(lat);
        let lon = 0;
        if (Math.abs(cosLat) > 0.001) {
            const xzLen = Math.sqrt(vec.x * vec.x + vec.z * vec.z);
            const cosLon = Math.max(-1, Math.min(1, vec.x / (r * cosLat)));
            lon = Math.acos(cosLon);
            if (vec.z < 0) lon = -lon;
            void xzLen;
        }
        return { lat, lon };
    }

    private projectToSphere(vec: THREE.Vector3, radius: number): void {
        const len = vec.length();
        if (len > 0) {
            vec.multiplyScalar(radius / len);
        }
    }

    private getLatColorFactor(lat: number): number {
        const absLatNorm = Math.abs(lat) / (Math.PI / 2);
        return absLatNorm;
    }

    private updatePlanktonGeometry(): void {
        if (!this.planktonGeometry) return;

        const count = this.planktonData.length;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const p = this.planktonData[i];
            const radius = EARTH_RADIUS + p.height;
            const pos = this.latLonToVec3(p.lat, p.lon, radius);

            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;

            const factor = this.getLatColorFactor(p.lat);
            this.tempColor.copy(COLOR_WARM).lerp(COLOR_COLD, factor);
            colors[i * 3] = this.tempColor.r;
            colors[i * 3 + 1] = this.tempColor.g;
            colors[i * 3 + 2] = this.tempColor.b;
        }

        this.planktonPositions = positions;
        this.planktonColors = colors;
        this.planktonGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.planktonGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.planktonGeometry.attributes.position.needsUpdate = true;
        this.planktonGeometry.attributes.color.needsUpdate = true;
    }

    private addPlankton(count: number): void {
        for (let i = 0; i < count; i++) {
            const { lat, lon } = this.randomOceanPosition();
            this.planktonData.push({
                lat,
                lon,
                height: PLANKTON_HEIGHT_MIN + Math.random() * (PLANKTON_HEIGHT_MAX - PLANKTON_HEIGHT_MIN),
            });
        }
    }

    private removePlankton(count: number): void {
        const removeCount = Math.min(count, this.planktonData.length);
        for (let i = 0; i < removeCount; i++) {
            const idx = Math.floor(Math.random() * this.planktonData.length);
            this.planktonData.splice(idx, 1);
        }
    }

    private updatePlanktonCount(dt: number): void {
        const currentCount = this.planktonData.length;
        const diff = this.planktonTargetCount - currentCount;

        if (diff === 0) return;

        const maxChange = PLANKTON_MAX_CHANGE_PER_SEC * dt;
        let change = Math.sign(diff) * Math.min(Math.abs(diff), maxChange);
        change = Math.floor(change);

        if (change > 0) {
            this.addPlankton(change);
            this.updatePlanktonGeometry();
        } else if (change < 0) {
            this.removePlankton(-change);
            this.updatePlanktonGeometry();
        }
    }

    private driftPlankton(dt: number, velocityFieldFn: (lat: number, lon: number) => THREE.Vector3): void {
        if (this.planktonData.length === 0) return;
        if (!this.planktonPositions || !this.planktonColors || !this.planktonGeometry) return;

        const positions = this.planktonPositions;
        const colors = this.planktonColors;
        let needsGeoUpdate = false;

        for (let i = 0; i < this.planktonData.length; i++) {
            const p = this.planktonData[i];
            const velocity = velocityFieldFn(p.lat, p.lon);

            const latDelta = velocity.y * dt * 0.05;
            const lonDelta = velocity.x * dt * 0.05;

            let newLat = p.lat + latDelta;
            let newLon = p.lon + lonDelta;

            if (newLat > Math.PI / 2) {
                newLat = Math.PI - newLat;
                newLon += Math.PI;
            } else if (newLat < -Math.PI / 2) {
                newLat = -Math.PI - newLat;
                newLon += Math.PI;
            }
            if (newLon > Math.PI) newLon -= Math.PI * 2;
            if (newLon < -Math.PI) newLon += Math.PI * 2;

            if (!this.isOcean(newLat, newLon)) {
                newLon += (Math.random() - 0.5) * 0.2;
                newLat += (Math.random() - 0.5) * 0.1;
                if (newLat > Math.PI / 2) newLat = Math.PI / 2;
                if (newLat < -Math.PI / 2) newLat = -Math.PI / 2;
            }

            if (Math.abs(latDelta) + Math.abs(lonDelta) > 0.00001) {
                needsGeoUpdate = true;
                p.lat = newLat;
                p.lon = newLon;

                const radius = EARTH_RADIUS + p.height;
                const cosLat = Math.cos(p.lat);
                positions[i * 3] = radius * cosLat * Math.cos(p.lon);
                positions[i * 3 + 1] = radius * Math.sin(p.lat);
                positions[i * 3 + 2] = radius * cosLat * Math.sin(p.lon);

                const factor = this.getLatColorFactor(p.lat);
                this.tempColor.copy(COLOR_WARM).lerp(COLOR_COLD, factor);
                colors[i * 3] = this.tempColor.r;
                colors[i * 3 + 1] = this.tempColor.g;
                colors[i * 3 + 2] = this.tempColor.b;
            }
        }

        if (needsGeoUpdate) {
            (this.planktonGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            (this.planktonGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        }
    }

    private updateFishSchools(
        dt: number,
        fishActivity: number,
        timeSpeed: number,
        velocityFieldFn: (lat: number, lon: number) => THREE.Vector3
    ): void {
        const scaledDt = dt * timeSpeed;

        for (let s = 0; s < this.fishSchools.length; s++) {
            const school = this.fishSchools[s];
            const velocity = velocityFieldFn(school.lat, school.lon);

            const { lat, lon } = this.vec3ToLatLon(school.center);
            school.lat = lat;
            school.lon = lon;

            const up = school.center.clone().normalize();
            const east = this.tempVec3.set(0, 0, 1).cross(up).normalize();
            if (east.lengthSq() < 0.01) {
                east.set(1, 0, 0);
            }
            const north = this.tempVec3B.copy(up).cross(east).normalize();

            const moveDir = new THREE.Vector3();
            moveDir.addScaledVector(east, velocity.x);
            moveDir.addScaledVector(north, velocity.y);

            const speed = 0.3 * fishActivity;
            if (moveDir.lengthSq() > 0) {
                moveDir.normalize().multiplyScalar(speed);
            }

            school.velocity.lerp(moveDir, Math.min(1, scaledDt * 2));

            for (let other = 0; other < this.fishSchools.length; other++) {
                if (other === s) continue;
                const otherSchool = this.fishSchools[other];
                const diff = this.tempVec3.copy(school.center).sub(otherSchool.center);
                const dist = diff.length();
                const minDist = 1.5;
                if (dist < minDist && dist > 0.01) {
                    diff.normalize().multiplyScalar((minDist - dist) * 2);
                    school.velocity.add(diff);
                }
            }

            school.targetCenter.copy(school.center).addScaledVector(school.velocity, scaledDt);
            this.projectToSphere(school.targetCenter, EARTH_RADIUS + 0.05);
            school.center.lerp(school.targetCenter, Math.min(1, scaledDt * 3));
        }
    }

    private updateFishInstances(
        dt: number,
        fishActivity: number,
        timeSpeed: number
    ): void {
        if (!this.fishMesh) return;

        const scaledDt = dt * timeSpeed;

        for (let i = 0; i < this.fishData.length; i++) {
            const fish = this.fishData[i];
            const school = this.fishSchools[fish.schoolIndex];

            const up = school.center.clone().normalize();

            const east = this.tempVec3.set(0, 0, 1).cross(up).normalize();
            if (east.lengthSq() < 0.01) {
                east.set(1, 0, 0);
            }
            const north = this.tempVec3B.copy(up).cross(east).normalize();

            const separation = new THREE.Vector3();
            let sepCount = 0;
            for (let j = Math.max(0, i - 8); j < Math.min(this.fishData.length, i + 9); j++) {
                if (j === i) continue;
                const other = this.fishData[j];
                if (other.schoolIndex !== fish.schoolIndex) continue;
                const diff = this.tempVec3.copy(fish.position).sub(other.position);
                const dist = diff.length();
                if (dist < 0.15 && dist > 0.001) {
                    diff.normalize().divideScalar(dist);
                    separation.add(diff);
                    sepCount++;
                }
            }
            if (sepCount > 0) {
                separation.divideScalar(sepCount).multiplyScalar(0.5);
            }

            const targetPos = school.center.clone();
            targetPos.addScaledVector(east, fish.localOffset.x);
            targetPos.addScaledVector(up, fish.localOffset.y * 0.5);
            targetPos.addScaledVector(north, fish.localOffset.z);
            this.projectToSphere(targetPos, EARTH_RADIUS + 0.05);

            const toTarget = this.tempVec3.copy(targetPos).sub(fish.position);
            toTarget.add(separation);

            fish.velocity.lerp(toTarget, Math.min(1, scaledDt * 4));
            fish.position.addScaledVector(fish.velocity, Math.min(1, scaledDt * 2));
            this.projectToSphere(fish.position, EARTH_RADIUS + 0.05);

            const forward = new THREE.Vector3();
            if (school.velocity.lengthSq() > 0.0001) {
                const tangent = school.velocity.clone();
                const fishUp = fish.position.clone().normalize();
                tangent.sub(fishUp.clone().multiplyScalar(tangent.dot(fishUp)));
                if (tangent.lengthSq() > 0.0001) {
                    forward.copy(tangent.normalize());
                } else {
                    forward.copy(north);
                }
            } else {
                forward.copy(north);
            }

            this.updateFishInstance(i, fish.position, forward);
        }

        this.fishMesh.instanceMatrix.needsUpdate = true;
    }

    private updateFishInstance(index: number, position: THREE.Vector3, direction: THREE.Vector3): void {
        this.fishDummy.position.copy(position);

        const fishUp = position.clone().normalize();
        let forward = direction.clone();
        if (forward.lengthSq() < 0.0001) {
            forward.set(0, 0, 1);
        }
        forward.sub(fishUp.clone().multiplyScalar(forward.dot(fishUp)));
        if (forward.lengthSq() < 0.0001) {
            forward.set(1, 0, 0);
        }
        forward.normalize();

        const right = this.tempVec3.copy(fishUp).cross(forward).normalize();
        const correctedUp = this.tempVec3B.copy(forward).cross(right).normalize();

        const rotMat = new THREE.Matrix4();
        rotMat.makeBasis(right, correctedUp, forward);
        this.tempQuat.setFromRotationMatrix(rotMat);
        this.fishDummy.quaternion.copy(this.tempQuat);

        this.fishDummy.scale.setScalar(1);
        this.fishDummy.updateMatrix();
        this.fishMesh?.setMatrixAt(index, this.fishDummy.matrix);
    }

    public update(
        dt: number,
        planktonConcentration: number,
        fishActivity: number,
        timeSpeed: number,
        velocityFieldFn: (lat: number, lon: number) => THREE.Vector3
    ): void {
        this.planktonTargetCount = Math.floor(planktonConcentration * 2000);

        this.updatePlanktonCount(dt);
        this.driftPlankton(dt * timeSpeed, velocityFieldFn);

        this.updateFishSchools(dt, fishActivity, timeSpeed, velocityFieldFn);
        this.updateFishInstances(dt, fishActivity, timeSpeed);
    }

    public getPlanktonCount(): number {
        return this.planktonData.length;
    }

    public getFishCount(): number {
        return this.fishData.length;
    }

    public dispose(): void {
        if (this.planktonPoints && this.scene) {
            this.scene.remove(this.planktonPoints);
        }
        this.planktonGeometry?.dispose();
        this.planktonMaterial?.dispose();
        this.planktonPoints = null;
        this.planktonGeometry = null;
        this.planktonMaterial = null;
        this.planktonData = [];
        this.planktonPositions = null;
        this.planktonColors = null;

        if (this.fishMesh && this.scene) {
            this.scene.remove(this.fishMesh);
        }
        this.fishGeometry?.dispose();
        this.fishMaterial?.dispose();
        this.fishMesh = null;
        this.fishGeometry = null;
        this.fishMaterial = null;
        this.fishData = [];
        this.fishSchools = [];

        this.scene = null;
    }
}
