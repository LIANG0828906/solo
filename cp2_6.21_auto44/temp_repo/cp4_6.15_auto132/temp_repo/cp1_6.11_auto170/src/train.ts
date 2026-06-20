import * as THREE from 'three';
import { TrainPart } from './types';

export class Train {
  public group: THREE.Group;
  private parts: Map<string, TrainPart> = new Map();
  private wheels: THREE.Group[] = [];
  private crankshafts: THREE.Group[] = [];
  private pistonRods: THREE.Mesh[] = [];
  private speed: number = 0;
  private crankAngle: number = 0;
  private startButton: THREE.Mesh | null = null;
  private isRunning: boolean = false;
  private chimney: THREE.Mesh | null = null;
  private boiler: THREE.Mesh | null = null;
  private cabin: THREE.Mesh | null = null;
  private chassis: THREE.Mesh | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.createTrain();
    this.group.position.y = 0;
  }

  private createTrain(): void {
    this.createChassis();
    this.createBoiler();
    this.createCabin();
    this.createChimney();
    this.createWheels();
    this.createPistonMechanism();
    this.createStartButton();
    this.addDetails();
  }

  private createChassis(): void {
    const chassisGeometry = new THREE.BoxGeometry(6, 0.4, 1.2);
    const chassisMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.7,
      metalness: 0.2
    });
    const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassis.position.y = 0.2;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    chassis.name = 'chassis';
    this.setPartId(chassis, 'chassis');
    this.group.add(chassis);
    this.chassis = chassis;
    this.parts.set('chassis', {
      id: 'chassis',
      name: '底盘',
      description: '底盘：支撑整个火车车体的基础结构，连接车轮和车身',
      mesh: chassis
    });
  }

  private createBoiler(): void {
    const boilerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 4, 24);
    const boilerMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.6,
      metalness: 0.3
    });
    const boiler = new THREE.Mesh(boilerGeometry, boilerMaterial);
    boiler.rotation.z = Math.PI / 2;
    boiler.position.set(-0.5, 1, 0);
    boiler.castShadow = true;
    boiler.receiveShadow = true;
    boiler.name = 'boiler';
    this.setPartId(boiler, 'boiler');
    this.group.add(boiler);
    this.boiler = boiler;
    this.parts.set('boiler', {
      id: 'boiler',
      name: '锅炉',
      description: '锅炉：燃烧煤炭加热水产生蒸汽，是火车的动力来源',
      mesh: boiler
    });

    const bandGeometry = new THREE.TorusGeometry(0.82, 0.05, 8, 32);
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3728,
      roughness: 0.5,
      metalness: 0.4
    });
    for (let i = -1; i <= 1; i++) {
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.rotation.y = Math.PI / 2;
      band.position.set(-0.5 + i * 1.2, 1, 0);
      band.castShadow = true;
      band.userData.partId = 'boiler';
      this.group.add(band);
    }
  }

  private createCabin(): void {
    const cabinGeometry = new THREE.CylinderGeometry(0.7, 0.9, 1.8, 8);
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.7,
      metalness: 0.2
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(2.2, 1.3, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    cabin.name = 'cabin';
    this.setPartId(cabin, 'cabin');
    this.group.add(cabin);
    this.cabin = cabin;
    this.parts.set('cabin', {
      id: 'cabin',
      name: '驾驶室',
      description: '驾驶室：火车司机操控火车的地方，装有各种控制装置',
      mesh: cabin
    });

    const roofGeometry = new THREE.ConeGeometry(1, 0.5, 8);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3728,
      roughness: 0.6,
      metalness: 0.3
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(2.2, 2.45, 0);
    roof.castShadow = true;
    roof.userData.partId = 'cabin';
    this.group.add(roof);

    const windowGeometry = new THREE.PlaneGeometry(0.4, 0.5);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.6
    });
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(2.2, 1.5, 0.91);
    window1.userData.partId = 'cabin';
    this.group.add(window1);
    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(2.2, 1.5, -0.91);
    window2.rotation.y = Math.PI;
    window2.userData.partId = 'cabin';
    this.group.add(window2);
  }

  private createChimney(): void {
    const chimneyGeometry = new THREE.CylinderGeometry(0.18, 0.25, 0.3, 16);
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3728,
      roughness: 0.5,
      metalness: 0.5
    });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(-2.5, 2.3, 0);
    chimney.castShadow = true;
    chimney.name = 'chimney';
    this.setPartId(chimney, 'chimney');
    this.group.add(chimney);
    this.chimney = chimney;
    this.parts.set('chimney', {
      id: 'chimney',
      name: '烟囱',
      description: '烟囱：排出锅炉燃烧产生的烟气和蒸汽',
      mesh: chimney
    });
  }

  private createWheels(): void {
    const wheelRadius = 0.4;
    const wheelPositions = [
      { x: -2, y: 0.4, z: 0.6 },
      { x: -2, y: 0.4, z: -0.6 },
      { x: -0.7, y: 0.4, z: 0.6 },
      { x: -0.7, y: 0.4, z: -0.6 },
      { x: 0.7, y: 0.4, z: 0.6 },
      { x: 0.7, y: 0.4, z: -0.6 },
      { x: 2, y: 0.4, z: 0.6 },
      { x: 2, y: 0.4, z: -0.6 }
    ];

    wheelPositions.forEach((pos, index) => {
      const wheelGroup = new THREE.Group();

      const rimGeometry = new THREE.TorusGeometry(wheelRadius, 0.06, 12, 32);
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x3A3A3A,
        roughness: 0.4,
        metalness: 0.7
      });
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.y = Math.PI / 2;
      rim.castShadow = true;
      wheelGroup.add(rim);

      const hubGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16);
      const hubMaterial = new THREE.MeshStandardMaterial({
        color: 0x5A5A5A,
        roughness: 0.3,
        metalness: 0.8
      });
      const hub = new THREE.Mesh(hubGeometry, hubMaterial);
      hub.rotation.x = Math.PI / 2;
      hub.castShadow = true;
      wheelGroup.add(hub);

      const spokeGeometry = new THREE.BoxGeometry(0.04, wheelRadius * 2 - 0.1, 0.03);
      const spokeMaterial = new THREE.MeshStandardMaterial({
        color: 0x6B6B6B,
        roughness: 0.5,
        metalness: 0.6
      });
      const spokeCount = 6;
      for (let i = 0; i < spokeCount; i++) {
        const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
        spoke.rotation.z = (i / spokeCount) * Math.PI;
        spoke.castShadow = true;
        wheelGroup.add(spoke);
      }

      wheelGroup.position.set(pos.x, pos.y, pos.z);
      wheelGroup.name = `wheel_${index}`;
      this.setPartId(wheelGroup, 'wheels');
      this.group.add(wheelGroup);
      this.wheels.push(wheelGroup);

      if (index === 0) {
        this.parts.set('wheels', {
          id: 'wheels',
          name: '车轮',
          description: '车轮：支撑车体并沿轨道滚动，传递动力使火车前进',
          mesh: wheelGroup
        });
      }
    });
  }

  private createPistonMechanism(): void {
    const crankRadius = 0.15;
    const rodLength = 1.2;
    const rodDiameter = 0.05;

    const crankPositions = [
      { x: -1.3, y: 0.4, z: 0.45 },
      { x: -1.3, y: 0.4, z: -0.45 }
    ];

    crankPositions.forEach((pos, index) => {
      const crankGroup = new THREE.Group();

      const crankPinGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12);
      const crankPinMaterial = new THREE.MeshStandardMaterial({
        color: 0x8A8A8A,
        roughness: 0.3,
        metalness: 0.8
      });
      const crankPin = new THREE.Mesh(crankPinGeometry, crankPinMaterial);
      crankPin.rotation.x = Math.PI / 2;
      crankPin.position.x = crankRadius;
      crankPin.castShadow = true;
      crankGroup.add(crankPin);

      const crankArmGeometry = new THREE.BoxGeometry(crankRadius, 0.06, 0.06);
      const crankArmMaterial = new THREE.MeshStandardMaterial({
        color: 0x6A6A6A,
        roughness: 0.4,
        metalness: 0.7
      });
      const crankArm = new THREE.Mesh(crankArmGeometry, crankArmMaterial);
      crankArm.position.x = crankRadius / 2;
      crankArm.castShadow = true;
      crankGroup.add(crankArm);

      crankGroup.position.set(pos.x, pos.y, pos.z);
      this.setPartId(crankGroup, 'piston');
      this.group.add(crankGroup);
      this.crankshafts.push(crankGroup);

      const rodGeometry = new THREE.CylinderGeometry(rodDiameter / 2, rodDiameter / 2, rodLength, 8);
      const rodMaterial = new THREE.MeshStandardMaterial({
        color: 0xA0A0A0,
        roughness: 0.3,
        metalness: 0.7
      });
      const rod = new THREE.Mesh(rodGeometry, rodMaterial);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(pos.x - rodLength / 2 + crankRadius, pos.y, pos.z);
      rod.castShadow = true;
      rod.name = `piston_rod_${index}`;
      rod.userData.partId = 'piston';
      this.group.add(rod);
      this.pistonRods.push(rod);

      if (index === 0) {
        this.parts.set('piston', {
          id: 'piston',
          name: '连杆活塞机构',
          description: '连杆活塞机构：将蒸汽的压力转化为曲轴的旋转运动',
          mesh: rod
        });
      }
    });
  }

  private createStartButton(): void {
    const buttonGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 24);
    const buttonMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFB347,
      emissive: 0xFF8C00,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.8
    });
    const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
    button.position.set(2.2, 2.8, 0);
    button.rotation.x = Math.PI / 2;
    button.castShadow = true;
    button.name = 'start_button';
    this.setPartId(button, 'start_button');
    this.group.add(button);
    this.startButton = button;
    this.parts.set('start_button', {
      id: 'start_button',
      name: '启动按钮',
      description: '启动按钮：点击启动或停止火车机械运转',
      mesh: button
    });
  }

  private setPartId(object: THREE.Object3D, partId: string): void {
    object.userData.partId = partId;
    object.traverse((child) => {
      child.userData.partId = partId;
    });
  }

  private addDetails(): void {
    const pipeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2, 8);
    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x6A6A6A,
      roughness: 0.4,
      metalness: 0.7
    });
    const pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(0, 1.6, 0.5);
    pipe1.castShadow = true;
    this.group.add(pipe1);

    const pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe2.rotation.z = Math.PI / 2;
    pipe2.position.set(0, 1.6, -0.5);
    pipe2.castShadow = true;
    this.group.add(pipe2);

    const bufferGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.5);
    const bufferMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3728,
      roughness: 0.6,
      metalness: 0.3
    });
    const buffer1 = new THREE.Mesh(bufferGeometry, bufferMaterial);
    buffer1.position.set(-3, 0.4, 0);
    buffer1.castShadow = true;
    this.group.add(buffer1);

    const buffer2 = new THREE.Mesh(bufferGeometry, bufferMaterial);
    buffer2.position.set(3, 0.4, 0);
    buffer2.castShadow = true;
    this.group.add(buffer2);
  }

  public update(deltaTime: number): void {
    if (!this.isRunning || this.speed === 0) return;

    const angularSpeed = this.speed * 2 * Math.PI;
    this.crankAngle += angularSpeed * deltaTime;

    const crankRadius = 0.15;
    const rodLength = 1.2;

    this.crankshafts.forEach((crank, index) => {
      crank.rotation.y = this.crankAngle;

      const pistonPos = crankRadius * Math.cos(this.crankAngle);
      const rod = this.pistonRods[index];
      if (rod) {
        const baseX = crank.position.x - rodLength / 2 + crankRadius;
        rod.position.x = baseX + pistonPos;
      }
    });

    const wheelRotationSpeed = (this.speed * 2 * Math.PI * crankRadius) / 0.4;
    this.wheels.forEach(wheel => {
      wheel.rotation.y += wheelRotationSpeed * deltaTime;
    });
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0, Math.min(5, speed));
  }

  public getSpeed(): number {
    return this.speed;
  }

  public toggleRunning(): boolean {
    this.isRunning = !this.isRunning;
    this.updateButtonGlow();
    return this.isRunning;
  }

  public setRunning(running: boolean): void {
    this.isRunning = running;
    this.updateButtonGlow();
  }

  public isRunningState(): boolean {
    return this.isRunning;
  }

  private updateButtonGlow(): void {
    if (this.startButton) {
      const material = this.startButton.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = this.isRunning ? 0.8 : 0.3;
    }
  }

  public getPartById(id: string): TrainPart | undefined {
    return this.parts.get(id);
  }

  public getAllParts(): TrainPart[] {
    return Array.from(this.parts.values());
  }

  public getStartButton(): THREE.Mesh | null {
    return this.startButton;
  }

  public getChimneyPosition(): THREE.Vector3 {
    if (!this.chimney) return new THREE.Vector3(0, 2.3, 0);
    const pos = new THREE.Vector3();
    this.chimney.getWorldPosition(pos);
    pos.y += 0.15;
    return pos;
  }

  public highlightPart(partId: string): void {
    const part = this.parts.get(partId);
    if (!part) return;
    
    const mesh = part.mesh;
    if (mesh instanceof THREE.Mesh) {
      const material = mesh.material as THREE.MeshStandardMaterial;
      const originalEmissive = material.emissive.clone();
      material.emissive.setHex(0xFFD700);
      material.emissiveIntensity = 0.5;
      
      setTimeout(() => {
        material.emissive.copy(originalEmissive);
        material.emissiveIntensity = this.isStartButton(partId) ? 0.8 : 0;
      }, 500);
    }
  }

  private isStartButton(partId: string): boolean {
    return partId === 'start_button' && this.isRunning;
  }

  public getPartName(mesh: THREE.Object3D): string | null {
    for (const [id, part] of this.parts) {
      if (part.mesh === mesh || mesh.name === id || mesh.name.startsWith(id)) {
        return id;
      }
    }
    return null;
  }

  public getPartPosition(partId: string): THREE.Vector3 | null {
    const part = this.parts.get(partId);
    if (!part) return null;
    const pos = new THREE.Vector3();
    part.mesh.getWorldPosition(pos);
    return pos;
  }
}
