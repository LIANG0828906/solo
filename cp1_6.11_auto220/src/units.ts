import * as THREE from 'three';

export type UnitType = 'ship' | 'infantry' | 'cavalry';
export type Faction = 'wu' | 'wei' | 'shu';
export type UnitState = 'idle' | 'march' | 'engage' | 'retreat' | 'dead';

export interface UnitData {
  id: number;
  name: string;
  type: UnitType;
  faction: Faction;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  mesh: THREE.Group;
}

export class Unit {
  id: number;
  name: string;
  type: UnitType;
  faction: Faction;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  state: UnitState;
  mesh: THREE.Group;
  target: THREE.Vector3 | null;
  enemy: Unit | null;
  rotationY: number;
  damageTimer: number;

  constructor(data: UnitData) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.faction = data.faction;
    this.position = data.position.clone();
    this.health = data.health;
    this.maxHealth = data.maxHealth;
    this.attack = data.attack;
    this.speed = data.speed;
    this.state = 'idle';
    this.mesh = data.mesh;
    this.target = null;
    this.enemy = null;
    this.rotationY = 0;
    this.damageTimer = 0;
  }

  update(delta: number, speedMultiplier: number, terrainHeightFn: (x: number, z: number) => number): void {
    if (this.state === 'dead') {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.Material && 'opacity' in mat) {
              mat.transparent = true;
              mat.opacity = Math.max(0, (mat.opacity as number) - delta * 0.5);
            }
          });
        }
      });
      return;
    }

    if (this.target) {
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > 0.1) {
        const moveSpeed = this.speed * speedMultiplier * delta;
        const ratio = Math.min(1, moveSpeed / distance);
        this.position.x += dx * ratio * 0.1;
        this.position.z += dz * ratio * 0.1;
      } else {
        this.target = null;
      }

      const targetRotation = Math.atan2(dx, dz);
      let rotationDiff = targetRotation - this.rotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      this.rotationY += rotationDiff * 0.1;
    }

    this.position.y = terrainHeightFn(this.position.x, this.position.z);

    if (this.damageTimer > 0) {
      this.damageTimer -= delta;
    }

    if (this.state === 'retreat') {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.Material && 'opacity' in mat) {
              mat.transparent = true;
              mat.opacity = Math.max(0.3, (mat.opacity as number) - delta * 0.2);
            }
          });
        }
      });
    }
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    this.damageTimer = 0.2;
    if (this.health <= 0) {
      this.health = 0;
      this.state = 'dead';
      return true;
    }
    return false;
  }

  faceTarget(targetPos: THREE.Vector3): void {
    const dx = targetPos.x - this.position.x;
    const dz = targetPos.z - this.position.z;
    this.rotationY = Math.atan2(dx, dz);
  }
}

export class UnitManager {
  private scene: THREE.Scene;
  private units: Unit[] = [];
  private initialCounts = { wu: 0, wei: 0, shu: 0 };
  private nextId = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private enableShadows(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  createWuShips(): void {
    for (let i = 0; i < 5; i++) {
      const z = -30 + i * 15;
      const group = new THREE.Group();

      const hullGeo = new THREE.BoxGeometry(10, 3, 3);
      const hullMat = new THREE.MeshStandardMaterial({ color: 0x5C4033 });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.position.y = 1.5;
      group.add(hull);

      const stripeGeo = new THREE.BoxGeometry(10, 0.3, 3.1);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = 1.5;
      group.add(stripe);

      const mastGeo = new THREE.CylinderGeometry(0.2, 0.2, 7, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x5C4033 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 6;
      group.add(mast);

      const sailGeo = new THREE.PlaneGeometry(4, 5);
      const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const sail = new THREE.Mesh(sailGeo, sailMat);
      sail.position.set(0, 6, 2);
      sail.rotation.y = Math.PI / 2;
      group.add(sail);

      const flagGeo = new THREE.PlaneGeometry(2, 1.2);
      const flagMat = new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        side: THREE.DoubleSide,
      });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(0, 9.5, 0);
      flag.userData.isFlag = true;
      flag.userData.time = 0;
      group.add(flag);

      this.enableShadows(group);

      const position = new THREE.Vector3(-80, 0, z);
      const unit = new Unit({
        id: this.nextId++,
        name: `吴国楼船-${i + 1}`,
        type: 'ship',
        faction: 'wu',
        position,
        health: 200,
        maxHealth: 200,
        attack: 15,
        speed: 0.8,
        mesh: group,
      });

      group.position.copy(position);
      this.scene.add(group);
      this.units.push(unit);
      this.initialCounts.wu++;
    }
  }

  createWeiInfantry(): void {
    const count = 10;
    const cols = 5;
    const rows = 2;
    const spacing = 4;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (col - (cols - 1) / 2) * spacing;
      const offsetZ = (row - (rows - 1) / 2) * spacing * 2;

      const group = new THREE.Group();

      const bodyGeo = new THREE.CylinderGeometry(0.35, 0.4, 1, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.5;
      group.add(body);

      const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xf4c2a1 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.2;
      group.add(head);

      const helmetGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.25, 8);
      const helmetMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      const helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.y = 1.45;
      group.add(helmet);

      const spearGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6);
      const spearMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const spear = new THREE.Mesh(spearGeo, spearMat);
      spear.position.set(0.5, 1.3, 0);
      spear.rotation.z = -0.2;
      group.add(spear);

      const spearTipGeo = new THREE.ConeGeometry(0.08, 0.25, 6);
      const spearTipMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const spearTip = new THREE.Mesh(spearTipGeo, spearTipMat);
      spearTip.position.set(0.57, 2.55, 0);
      spearTip.rotation.z = -0.2;
      group.add(spearTip);

      const shieldGeo = new THREE.BoxGeometry(0.6, 0.9, 0.08);
      const shieldMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.set(-0.45, 0.8, 0);
      group.add(shield);

      this.enableShadows(group);

      const position = new THREE.Vector3(offsetX, 0, offsetZ);
      const unit = new Unit({
        id: this.nextId++,
        name: `魏国步兵-${i + 1}`,
        type: 'infantry',
        faction: 'wei',
        position,
        health: 100,
        maxHealth: 100,
        attack: 10,
        speed: 1.5,
        mesh: group,
      });

      group.position.copy(position);
      this.scene.add(group);
      this.units.push(unit);
      this.initialCounts.wei++;
    }
  }

  createShuCavalry(): void {
    const count = 6;
    const wedgePositions = [
      { x: 0, z: 0 },
      { x: -5, z: -6 },
      { x: 5, z: -6 },
      { x: -10, z: -12 },
      { x: 0, z: -12 },
      { x: 10, z: -12 },
    ];

    for (let i = 0; i < count; i++) {
      const pos = wedgePositions[i];
      const group = new THREE.Group();

      const horseBodyGeo = new THREE.BoxGeometry(0.9, 0.8, 1.8);
      const horseMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const horseBody = new THREE.Mesh(horseBodyGeo, horseMat);
      horseBody.position.y = 0.9;
      group.add(horseBody);

      const horseNeckGeo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
      const horseNeck = new THREE.Mesh(horseNeckGeo, horseMat);
      horseNeck.position.set(0, 1.4, 0.85);
      horseNeck.rotation.x = -0.4;
      group.add(horseNeck);

      const horseHeadGeo = new THREE.BoxGeometry(0.4, 0.45, 0.6);
      const horseHead = new THREE.Mesh(horseHeadGeo, horseMat);
      horseHead.position.set(0, 1.65, 1.2);
      group.add(horseHead);

      const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.9, 6);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
      const legPositions = [
        { x: -0.3, z: 0.6 },
        { x: 0.3, z: 0.6 },
        { x: -0.3, z: -0.6 },
        { x: 0.3, z: -0.6 },
      ];
      legPositions.forEach((lp) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lp.x, 0.45, lp.z);
        group.add(leg);
      });

      const riderBodyGeo = new THREE.BoxGeometry(0.4, 0.7, 0.3);
      const riderMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
      const riderBody = new THREE.Mesh(riderBodyGeo, riderMat);
      riderBody.position.y = 1.75;
      group.add(riderBody);

      const riderHeadGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const riderHeadMat = new THREE.MeshStandardMaterial({ color: 0xf4c2a1 });
      const riderHead = new THREE.Mesh(riderHeadGeo, riderHeadMat);
      riderHead.position.y = 2.3;
      group.add(riderHead);

      const capeGeo = new THREE.PlaneGeometry(0.9, 1.1);
      const capeMat = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
      });
      const cape = new THREE.Mesh(capeGeo, capeMat);
      cape.position.set(0, 1.75, -0.25);
      cape.rotation.x = 0.2;
      group.add(cape);

      this.enableShadows(group);

      const position = new THREE.Vector3(70 + pos.x, 0, pos.z);
      const unit = new Unit({
        id: this.nextId++,
        name: `蜀国骑兵-${i + 1}`,
        type: 'cavalry',
        faction: 'shu',
        position,
        health: 150,
        maxHealth: 150,
        attack: 12,
        speed: 2.5,
        mesh: group,
      });

      group.position.copy(position);
      this.scene.add(group);
      this.units.push(unit);
      this.initialCounts.shu++;
    }
  }

  updateUnitMeshes(): void {
    this.units.forEach((unit) => {
      unit.mesh.position.copy(unit.position);
      unit.mesh.rotation.y = unit.rotationY;
    });
  }

  updateFlags(time: number): void {
    this.units.forEach((unit) => {
      unit.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isFlag) {
          const geometry = child.geometry as THREE.PlaneGeometry;
          const positions = geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const originalZ = (geometry.userData.originalZ as Float32Array)?.[i] ?? positions.getZ(i);
            if (!geometry.userData.originalZ) {
              geometry.userData.originalZ = new Float32Array(positions.count);
              for (let j = 0; j < positions.count; j++) {
                (geometry.userData.originalZ as Float32Array)[j] = positions.getZ(j);
              }
            }
            const wave = Math.sin(x * 3 + time * 4) * 0.15;
            positions.setZ(i, (geometry.userData.originalZ as Float32Array)[i] + wave);
          }
          positions.needsUpdate = true;
          geometry.computeVertexNormals();
        }
      });
    });
  }

  getAllUnits(): Unit[] {
    return this.units;
  }

  getUnitsByFaction(faction: Faction): Unit[] {
    return this.units.filter((u) => u.faction === faction);
  }

  getAliveUnits(): Unit[] {
    return this.units.filter((u) => u.state !== 'dead');
  }

  getInitialCounts(): { wu: number; wei: number; shu: number } {
    return { ...this.initialCounts };
  }
}
