import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import type { EnemyState, Projectile, GameState } from '@/game/types';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  dodge: boolean;
  meleeAttack: boolean;
  rangedAttack: boolean;
  mouseWorldPos: THREE.Vector3;
}

interface EnemyStateWithDamage extends EnemyState {
  takeDamage?: (amount: number) => void;
}

type GameStoreState = ReturnType<typeof useGameStore>['getState'];

export class PlayerController {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private store: ReturnType<typeof useGameStore>;

  private group!: THREE.Group;
  private bodyGroup!: THREE.Group;
  private headGroup!: THREE.Group;
  private torsoMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private leftEye!: THREE.Mesh;
  private rightEye!: THREE.Mesh;
  private leftUpperArm!: THREE.Mesh;
  private rightUpperArm!: THREE.Mesh;
  private leftForearm!: THREE.Mesh;
  private rightForearm!: THREE.Mesh;
  private leftHand!: THREE.Mesh;
  private rightHand!: THREE.Mesh;
  private leftUpperLeg!: THREE.Mesh;
  private rightUpperLeg!: THREE.Mesh;
  private leftLowerLeg!: THREE.Mesh;
  private rightLowerLeg!: THREE.Mesh;
  private leftFoot!: THREE.Mesh;
  private rightFoot!: THREE.Mesh;
  private leftPauldron!: THREE.Mesh;
  private rightPauldron!: THREE.Mesh;
  private hood!: THREE.Mesh;
  private cloak!: THREE.Mesh;
  private sword!: THREE.Group;
  private swordBlade!: THREE.Mesh;

  private bodyParts: THREE.Mesh[] = [];

  private position!: THREE.Vector3;
  private facingAngle: number = 0;
  private moveSpeed: number = 5;

  private isDodging: boolean = false;
  private dodgeTimer: number = 0;
  private dodgeDuration: number = 0.3;
  private dodgeDirection!: THREE.Vector3;
  private dodgeSpeed: number = 18;
  private isInvincible: boolean = false;

  private meleeCooldown: number = 0;
  private meleeCooldownMax: number = 0.4;
  private meleeSwingTimer: number = 0;
  private meleeSwingDuration: number = 0.2;

  private rangedCooldown: number = 0;
  private rangedCooldownMax: number = 0.5;

  private isDead: boolean = false;
  private deathTimer: number = 0;

  private damageFlashOverlay: HTMLElement | null = null;
  private damageFlashTimer: number = 0;

  private walkCycleTimer: number = 0;
  private isWalking: boolean = false;

  private newProjectiles: Projectile[] = [];

  private originalMaterials: Map<THREE.Mesh, THREE.MeshStandardMaterial> = new Map();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, store: ReturnType<typeof useGameStore>) {
    this.scene = scene;
    this.camera = camera;
    this.store = store;

    this.position = new THREE.Vector3(0, 0, 0);
    this.dodgeDirection = new THREE.Vector3();

    this.group = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.y = 0.9;
    this.group.add(this.bodyGroup);

    this.createCharacterModel();
    this.createSword();

    this.group.position.copy(this.position);
    scene.add(this.group);

    this.createDamageFlashOverlay();
  }

  private createCharacterModel(): void {
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.1,
      roughness: 0.8,
    });

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x2d2d3d,
      metalness: 0.15,
      roughness: 0.75,
    });

    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a3a,
      metalness: 0.05,
      roughness: 0.9,
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      metalness: 0.8,
      roughness: 0.3,
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x151525,
      metalness: 0.85,
      roughness: 0.25,
    });

    const eyeSocketMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a15,
      metalness: 0.1,
      roughness: 0.9,
    });

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.55;
    this.bodyGroup.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.28, 16, 12);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.scale.set(1, 1.1, 1);
    this.headGroup.add(this.headMesh);
    this.bodyParts.push(this.headMesh);
    this.originalMaterials.set(this.headMesh, skinMat.clone());

    const leftEyeGeo = new THREE.SphereGeometry(0.06, 8, 6);
    this.leftEye = new THREE.Mesh(leftEyeGeo, eyeSocketMat);
    this.leftEye.position.set(-0.1, 0.05, -0.22);
    this.leftEye.scale.set(1, 0.6, 0.4);
    this.headGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(leftEyeGeo.clone(), eyeSocketMat);
    this.rightEye.position.set(0.1, 0.05, -0.22);
    this.rightEye.scale.set(1, 0.6, 0.4);
    this.headGroup.add(this.rightEye);

    const hoodGeo = new THREE.SphereGeometry(0.32, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    this.hood = new THREE.Mesh(hoodGeo, clothMat);
    this.hood.position.y = 0.02;
    this.hood.scale.set(1, 1.15, 1.1);
    this.headGroup.add(this.hood);
    this.bodyParts.push(this.hood);
    this.originalMaterials.set(this.hood, clothMat.clone());

    const hoodBrimGeo = new THREE.TorusGeometry(0.32, 0.04, 6, 16, Math.PI);
    const hoodBrim = new THREE.Mesh(hoodBrimGeo, clothMat);
    hoodBrim.rotation.x = Math.PI / 2;
    hoodBrim.rotation.z = Math.PI;
    hoodBrim.position.y = -0.08;
    hoodBrim.position.z = -0.02;
    this.headGroup.add(hoodBrim);

    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.7, 12);
    this.torsoMesh = new THREE.Mesh(torsoGeo, leatherMat);
    this.torsoMesh.position.y = 1.05;
    this.bodyGroup.add(this.torsoMesh);
    this.bodyParts.push(this.torsoMesh);
    this.originalMaterials.set(this.torsoMesh, leatherMat.clone());

    const beltGeo = new THREE.TorusGeometry(0.34, 0.04, 8, 16);
    const belt = new THREE.Mesh(beltGeo, darkMetalMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.72;
    this.bodyGroup.add(belt);
    this.bodyParts.push(belt);
    this.originalMaterials.set(belt, darkMetalMat.clone());

    const buckleGeo = new THREE.BoxGeometry(0.08, 0.06, 0.05);
    const buckle = new THREE.Mesh(buckleGeo, metalMat);
    buckle.position.set(0, 0.72, -0.35);
    this.bodyGroup.add(buckle);

    const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.35, 8);

    const leftUpperArmGroup = new THREE.Group();
    leftUpperArmGroup.position.set(-0.38, 1.3, 0);
    this.bodyGroup.add(leftUpperArmGroup);

    this.leftUpperArm = new THREE.Mesh(upperArmGeo, leatherMat);
    this.leftUpperArm.position.y = -0.17;
    leftUpperArmGroup.add(this.leftUpperArm);
    this.bodyParts.push(this.leftUpperArm);
    this.originalMaterials.set(this.leftUpperArm, leatherMat.clone());

    const rightUpperArmGroup = new THREE.Group();
    rightUpperArmGroup.position.set(0.38, 1.3, 0);
    this.bodyGroup.add(rightUpperArmGroup);

    this.rightUpperArm = new THREE.Mesh(upperArmGeo, leatherMat);
    this.rightUpperArm.position.y = -0.17;
    rightUpperArmGroup.add(this.rightUpperArm);
    this.bodyParts.push(this.rightUpperArm);
    this.originalMaterials.set(this.rightUpperArm, leatherMat.clone());

    const forearmGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.32, 8);

    const leftForearmGroup = new THREE.Group();
    leftForearmGroup.position.set(0, -0.35, 0);
    leftUpperArmGroup.add(leftForearmGroup);

    this.leftForearm = new THREE.Mesh(forearmGeo, leatherMat);
    this.leftForearm.position.y = -0.15;
    leftForearmGroup.add(this.leftForearm);
    this.bodyParts.push(this.leftForearm);
    this.originalMaterials.set(this.leftForearm, leatherMat.clone());

    const rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0, -0.35, 0);
    rightUpperArmGroup.add(rightForearmGroup);

    this.rightForearm = new THREE.Mesh(forearmGeo, leatherMat);
    this.rightForearm.position.y = -0.15;
    rightForearmGroup.add(this.rightForearm);
    this.bodyParts.push(this.rightForearm);
    this.originalMaterials.set(this.rightForearm, leatherMat.clone());

    const handGeo = new THREE.SphereGeometry(0.06, 8, 6);
    const handMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.1,
      roughness: 0.8,
    });

    this.leftHand = new THREE.Mesh(handGeo, handMat);
    this.leftHand.position.set(0, -0.32, 0);
    this.leftHand.scale.set(0.9, 1.1, 0.8);
    leftForearmGroup.add(this.leftHand);
    this.bodyParts.push(this.leftHand);
    this.originalMaterials.set(this.leftHand, handMat.clone());

    this.rightHand = new THREE.Mesh(handGeo, handMat);
    this.rightHand.position.set(0, -0.32, 0);
    this.rightHand.scale.set(0.9, 1.1, 0.8);
    rightForearmGroup.add(this.rightHand);
    this.bodyParts.push(this.rightHand);
    this.originalMaterials.set(this.rightHand, handMat.clone());

    const pauldronGeo = new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);

    this.leftPauldron = new THREE.Mesh(pauldronGeo, darkMetalMat);
    this.leftPauldron.position.set(-0.38, 1.4, 0);
    this.leftPauldron.scale.set(1.1, 0.6, 1);
    this.bodyGroup.add(this.leftPauldron);
    this.bodyParts.push(this.leftPauldron);
    this.originalMaterials.set(this.leftPauldron, darkMetalMat.clone());

    this.rightPauldron = new THREE.Mesh(pauldronGeo, darkMetalMat);
    this.rightPauldron.position.set(0.38, 1.4, 0);
    this.rightPauldron.scale.set(1.1, 0.6, 1);
    this.bodyGroup.add(this.rightPauldron);
    this.bodyParts.push(this.rightPauldron);
    this.originalMaterials.set(this.rightPauldron, darkMetalMat.clone());

    const upperLegGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.4, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      metalness: 0.1,
      roughness: 0.85,
    });

    const leftUpperLegGroup = new THREE.Group();
    leftUpperLegGroup.position.set(-0.15, 0.65, 0);
    this.bodyGroup.add(leftUpperLegGroup);

    this.leftUpperLeg = new THREE.Mesh(upperLegGeo, legMat);
    this.leftUpperLeg.position.y = -0.2;
    leftUpperLegGroup.add(this.leftUpperLeg);
    this.bodyParts.push(this.leftUpperLeg);
    this.originalMaterials.set(this.leftUpperLeg, legMat.clone());

    const rightUpperLegGroup = new THREE.Group();
    rightUpperLegGroup.position.set(0.15, 0.65, 0);
    this.bodyGroup.add(rightUpperLegGroup);

    this.rightUpperLeg = new THREE.Mesh(upperLegGeo, legMat);
    this.rightUpperLeg.position.y = -0.2;
    rightUpperLegGroup.add(this.rightUpperLeg);
    this.bodyParts.push(this.rightUpperLeg);
    this.originalMaterials.set(this.rightUpperLeg, legMat.clone());

    const lowerLegGeo = new THREE.CylinderGeometry(0.085, 0.09, 0.38, 8);

    const leftLowerLegGroup = new THREE.Group();
    leftLowerLegGroup.position.set(0, -0.4, 0);
    leftUpperLegGroup.add(leftLowerLegGroup);

    this.leftLowerLeg = new THREE.Mesh(lowerLegGeo, legMat);
    this.leftLowerLeg.position.y = -0.18;
    leftLowerLegGroup.add(this.leftLowerLeg);
    this.bodyParts.push(this.leftLowerLeg);
    this.originalMaterials.set(this.leftLowerLeg, legMat.clone());

    const rightLowerLegGroup = new THREE.Group();
    rightLowerLegGroup.position.set(0, -0.4, 0);
    rightUpperLegGroup.add(rightLowerLegGroup);

    this.rightLowerLeg = new THREE.Mesh(lowerLegGeo, legMat);
    this.rightLowerLeg.position.y = -0.18;
    rightLowerLegGroup.add(this.rightLowerLeg);
    this.bodyParts.push(this.rightLowerLeg);
    this.originalMaterials.set(this.rightLowerLeg, legMat.clone());

    const footGeo = new THREE.BoxGeometry(0.14, 0.08, 0.22);
    const footMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      metalness: 0.2,
      roughness: 0.7,
    });

    this.leftFoot = new THREE.Mesh(footGeo, footMat);
    this.leftFoot.position.set(0, -0.37, 0.05);
    leftLowerLegGroup.add(this.leftFoot);
    this.bodyParts.push(this.leftFoot);
    this.originalMaterials.set(this.leftFoot, footMat.clone());

    this.rightFoot = new THREE.Mesh(footGeo, footMat);
    this.rightFoot.position.set(0, -0.37, 0.05);
    rightLowerLegGroup.add(this.rightFoot);
    this.bodyParts.push(this.rightFoot);
    this.originalMaterials.set(this.rightFoot, footMat.clone());

    const cloakGeo = new THREE.ConeGeometry(0.65, 1.4, 12, 1, true);
    this.cloak = new THREE.Mesh(cloakGeo, clothMat);
    this.cloak.position.y = 1.1;
    this.cloak.position.z = 0.15;
    this.cloak.rotation.x = 0.15;
    this.bodyGroup.add(this.cloak);
    this.bodyParts.push(this.cloak);
    this.originalMaterials.set(this.cloak, clothMat.clone());

    const cloakCollarGeo = new THREE.TorusGeometry(0.4, 0.05, 8, 16);
    const cloakCollar = new THREE.Mesh(cloakCollarGeo, clothMat);
    cloakCollar.rotation.x = Math.PI / 2;
    cloakCollar.position.y = 1.4;
    cloakCollar.position.z = 0.1;
    this.bodyGroup.add(cloakCollar);

    leftUpperArmGroup.rotation.z = 0.15;
    rightUpperArmGroup.rotation.z = -0.15;
  }

  private createSword(): void {
    this.sword = new THREE.Group();

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xb0b0c0,
      metalness: 0.9,
      roughness: 0.15,
    });

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(-0.03, 0);
    bladeShape.lineTo(-0.025, 1.1);
    bladeShape.lineTo(0, 1.25);
    bladeShape.lineTo(0.025, 1.1);
    bladeShape.lineTo(0.03, 0);
    bladeShape.lineTo(-0.03, 0);

    const extrudeSettings = {
      depth: 0.04,
      bevelEnabled: false,
    };

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    this.swordBlade = new THREE.Mesh(bladeGeo, bladeMat);
    this.swordBlade.rotation.x = Math.PI / 2;
    this.swordBlade.position.z = -0.02;
    this.sword.add(this.swordBlade);
    this.bodyParts.push(this.swordBlade);
    this.originalMaterials.set(this.swordBlade, bladeMat.clone());

    const fullerGeo = new THREE.BoxGeometry(0.008, 0.8, 0.01);
    const fullerMat = new THREE.MeshStandardMaterial({
      color: 0x808090,
      metalness: 0.7,
      roughness: 0.3,
    });
    const fuller = new THREE.Mesh(fullerGeo, fullerMat);
    fuller.position.set(0, 0.55, 0.025);
    this.sword.add(fuller);

    const crossguardMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      metalness: 0.85,
      roughness: 0.25,
    });

    const crossguardGeo = new THREE.BoxGeometry(0.45, 0.06, 0.12);
    const crossguard = new THREE.Mesh(crossguardGeo, crossguardMat);
    crossguard.position.y = -0.02;
    this.sword.add(crossguard);
    this.bodyParts.push(crossguard);
    this.originalMaterials.set(crossguard, crossguardMat.clone());

    const crossguardDecoGeo = new THREE.SphereGeometry(0.04, 8, 6);
    const leftDeco = new THREE.Mesh(crossguardDecoGeo, crossguardMat);
    leftDeco.position.set(-0.22, -0.02, 0);
    this.sword.add(leftDeco);

    const rightDeco = new THREE.Mesh(crossguardDecoGeo, crossguardMat);
    rightDeco.position.set(0.22, -0.02, 0);
    this.sword.add(right