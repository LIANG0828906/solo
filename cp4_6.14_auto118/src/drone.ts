import * as THREE from 'three';

export interface RotorAngles {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
}

export interface DroneAttitude {
  pitch: number;
  yaw: number;
  roll: number;
}

interface RotorData {
  mesh: THREE.Group;
  blade: THREE.Mesh;
  targetAngle: number;
  currentAngle: number;
  label: THREE.Sprite;
  rotationSpeed: number;
}

export class Drone {
  public group: THREE.Group;
  private body: THREE.Mesh;
  private rotors: Map<string, RotorData>;
  private rotorPositions: Record<string, [number, number, number]>;
  private animationDuration: number = 0.3;
  private initialAngles: RotorAngles = {
    frontLeft: 15,
    frontRight: 15,
    rearLeft: 15,
    rearRight: 15
  };

  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 3, 0);
    
    this.rotorPositions = {
      frontLeft: [0.8, 0.2, 0.8],
      frontRight: [0.8, 0.2, -0.8],
      rearLeft: [-0.8, 0.2, 0.8],
      rearRight: [-0.8, 0.2, -0.8]
    };
    
    this.rotors = new Map();
    
    this.createBody();
    this.createRotors();
    this.createArms();
  }

  private createBody(): void {
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.3,
      roughness: 0.7
    });
    
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);
    
    const topGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.15, 8);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.5,
      roughness: 0.5
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 0.2;
    top.castShadow = true;
    this.group.add(top);
  }

  private createArms(): void {
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x4b5563,
      metalness: 0.4,
      roughness: 0.6
    });
    
    const positions = [
      [0.4, 0, 0.4],
      [0.4, 0, -0.4],
      [-0.4, 0, 0.4],
      [-0.4, 0, -0.4]
    ];
    
    const rotations = [
      Math.PI / 4,
      -Math.PI / 4,
      -Math.PI / 4,
      Math.PI / 4
    ];
    
    for (let i = 0; i < 4; i++) {
      const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(positions[i][0], positions[i][1], positions[i][2]);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = rotations[i];
      arm.castShadow = true;
      this.group.add(arm);
    }
  }

  private createRotors(): void {
    const rotorKeys = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'];
    
    for (const key of rotorKeys) {
      const pos = this.rotorPositions[key];
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(pos[0], pos[1], pos[2]);
      
      const baseGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.08, 16);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.6,
        roughness: 0.4
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.castShadow = true;
      rotorGroup.add(base);
      
      const blade = this.createBlade();
      blade.position.y = 0.06;
      rotorGroup.add(blade);
      
      const label = this.createAngleLabel(this.initialAngles[key as keyof RotorAngles]);
      label.position.y = 2;
      rotorGroup.add(label);
      
      this.rotors.set(key, {
        mesh: rotorGroup,
        blade,
        targetAngle: this.initialAngles[key as keyof RotorAngles],
        currentAngle: this.initialAngles[key as keyof RotorAngles],
        label,
        rotationSpeed: 0
      });
      
      rotorGroup.rotation.x = THREE.MathUtils.degToRad(this.initialAngles[key as keyof RotorAngles]);
      
      this.group.add(rotorGroup);
    }
  }

  private createBlade(): THREE.Mesh {
    const bladeShape = new THREE.Shape();
    const bladeWidth = 0.12;
    const bladeLength = 0.6;
    const segments = 30;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -bladeLength / 2 + t * bladeLength;
      const profile = Math.sin(t * Math.PI);
      const y = profile * bladeWidth / 2;
      
      if (i === 0) {
        bladeShape.moveTo(x, y);
      } else {
        bladeShape.lineTo(x, y);
      }
    }
    
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const x = -bladeLength / 2 + t * bladeLength;
      const profile = Math.sin(t * Math.PI);
      const y = -profile * bladeWidth / 2;
      bladeShape.lineTo(x, y);
    }
    
    const extrudeSettings = {
      depth: 0.015,
      bevelEnabled: false,
      steps: 1
    };
    
    const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    const triangles = bladeGeometry.attributes.position.count / 3;
    if (triangles < 120) {
      bladeGeometry.subdivide(2);
    }
    
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.2,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.castShadow = true;
    blade.rotation.x = Math.PI / 2;
    
    return blade;
  }

  private createAngleLabel(angle: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.roundRect(0, 0, 128, 64, 8);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${angle}°`, 64, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.6, 0.3, 1);
    
    return sprite;
  }

  private updateAngleLabel(rotor: RotorData, angle: number): void {
    const sprite = rotor.label;
    const material = sprite.material as THREE.SpriteMaterial;
    const texture = material.map as THREE.CanvasTexture;
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.roundRect(0, 0, 128, 64, 8);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(angle)}°`, 64, 32);
    
    texture.needsUpdate = true;
  }

  public setRotorAngle(key: keyof RotorAngles, angle: number): void {
    const rotor = this.rotors.get(key);
    if (rotor) {
      rotor.targetAngle = Math.max(0, Math.min(60, angle));
      this.updateAngleLabel(rotor, rotor.targetAngle);
    }
  }

  public setAllRotorAngles(angles: RotorAngles): void {
    this.setRotorAngle('frontLeft', angles.frontLeft);
    this.setRotorAngle('frontRight', angles.frontRight);
    this.setRotorAngle('rearLeft', angles.rearLeft);
    this.setRotorAngle('rearRight', angles.rearRight);
  }

  public getRotorAngles(): RotorAngles {
    return {
      frontLeft: this.rotors.get('frontLeft')!.targetAngle,
      frontRight: this.rotors.get('frontRight')!.targetAngle,
      rearLeft: this.rotors.get('rearLeft')!.targetAngle,
      rearRight: this.rotors.get('rearRight')!.targetAngle
    };
  }

  public setRotorSpeeds(speeds: [number, number, number, number]): void {
    const keys: Array<keyof RotorAngles> = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'];
    speeds.forEach((speed, i) => {
      const rotor = this.rotors.get(keys[i]);
      if (rotor) {
        rotor.rotationSpeed = speed;
      }
    });
  }

  public getAttitude(): DroneAttitude {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.group.quaternion);
    
    return {
      pitch: THREE.MathUtils.radToDeg(euler.x),
      yaw: THREE.MathUtils.radToDeg(euler.y),
      roll: THREE.MathUtils.radToDeg(euler.z)
    };
  }

  public update(deltaTime: number, isFlying: boolean): void {
    this.rotors.forEach((rotor) => {
      const angleDiff = rotor.targetAngle - rotor.currentAngle;
      if (Math.abs(angleDiff) > 0.1) {
        const step = angleDiff * (deltaTime / this.animationDuration);
        rotor.currentAngle += step;
        rotor.mesh.rotation.x = THREE.MathUtils.degToRad(rotor.currentAngle);
      } else {
        rotor.currentAngle = rotor.targetAngle;
        rotor.mesh.rotation.x = THREE.MathUtils.degToRad(rotor.currentAngle);
      }
      
      if (isFlying) {
        rotor.blade.rotation.z += rotor.rotationSpeed * deltaTime;
      }
    });
  }

  public setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }

  public setRotation(x: number, y: number, z: number): void {
    this.group.rotation.set(x, y, z);
  }

  public reset(): void {
    this.group.position.set(0, 3, 0);
    this.group.rotation.set(0, 0, 0);
    
    this.setAllRotorAngles({
      frontLeft: 15,
      frontRight: 15,
      rearLeft: 15,
      rearRight: 15
    });
    
    this.rotors.forEach((rotor) => {
      rotor.currentAngle = 15;
      rotor.targetAngle = 15;
      rotor.rotationSpeed = 0;
      rotor.blade.rotation.z = 0;
      rotor.mesh.rotation.x = THREE.MathUtils.degToRad(15);
      this.updateAngleLabel(rotor, 15);
    });
  }
}
