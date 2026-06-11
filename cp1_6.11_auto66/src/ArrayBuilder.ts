import * as THREE from 'three';
import { ArrayType, ArrayConfig, ArraySlot, ElementType, ELEMENT_COLORS, ELEMENT_ORDER } from './types';

export class ArrayBuilder {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private lines: THREE.Line[] = [];
  private particleSystems: THREE.Points[] = [];
  private energyRing!: THREE.Mesh;
  private slots: ArraySlot[] = [];
  private currentConfig!: ArrayConfig;
  private isActivated: boolean = false;
  private activationProgress: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  public build(type: ArrayType): ArraySlot[] {
    this.clear();
    this.currentConfig = this.getArrayConfig(type);
    this.createGeometry();
    this.createParticles();
    this.createEnergyRing();
    this.createSlotOutlines();
    return this.slots;
  }

  private getArrayConfig(type: ArrayType): ArrayConfig {
    const elements: ElementType[] = [...ELEMENT_ORDER];
    
    const generateCircleSlots = (radius: number, count: number): ArraySlot[] => {
      const slots: ArraySlot[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const elementIndex = i % elements.length;
        slots.push({
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            0.1,
            Math.sin(angle) * radius
          ),
          requiredElement: elements[elementIndex] as ElementType,
          occupied: false,
          runeId: null
        });
      }
      return slots;
    };

    const configs: Record<ArrayType, Omit<ArrayConfig, 'slots'>> = {
      hexagram: {
        type: 'hexagram',
        name: '六芒星魔法阵',
        lineColor: 0xffffff,
        particleColor: 0x8a2be2,
        particleCount: 300,
        elementColors: ELEMENT_COLORS
      },
      spiral: {
        type: 'spiral',
        name: '螺旋元素阵',
        lineColor: 0xffffff,
        particleColor: 0x00ffff,
        particleCount: 400,
        element