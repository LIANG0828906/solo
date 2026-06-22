import * as THREE from 'three';

export interface AtomData {
  element: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  hybridization: string;
}

export interface BondData {
  from: number;
  to: number;
  order: number;
}

export interface MoleculeData {
  name: string;
  atoms: AtomData[];
  bonds: BondData[];
}

export const PRESET_MOLECULES: { [key: string]: MoleculeData } = {
  water: {
    name: '水分子 H₂O',
    atoms: [
      { element: 'O', x: 0, y: 0, z: 0, radius: 0.7, color: '#ff4444', hybridization: 'sp³' },
      { element: 'H', x: -0.96, y: 0, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: 0.24, y: 0.93, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' }
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 }
    ]
  },
  co2: {
    name: '二氧化碳 CO₂',
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp' },
      { element: 'O', x: -1.16, y: 0, z: 0, radius: 0.7, color: '#ff4444', hybridization: 'sp²' },
      { element: 'O', x: 1.16, y: 0, z: 0, radius: 0.7, color: '#ff4444', hybridization: 'sp²' }
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 }
    ]
  },
  benzene: {
    name: '苯环 C₆H₆',
    atoms: [
      { element: 'C', x: 1.39, y: 0, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: 0.695, y: 1.202, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: -0.695, y: 1.202, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: -1.39, y: 0, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: -0.695, y: -1.202, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: 0.695, y: -1.202, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'H', x: 2.47, y: 0, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: 1.235, y: 2.136, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: -1.235, y: 2.136, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: -2.47, y: 0, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: -1.235, y: -2.136, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: 1.235, y: -2.136, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' }
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 },
      { from: 3, to: 4, order: 1 },
      { from: 4, to: 5, order: 2 },
      { from: 5, to: 0, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 2, to: 8, order: 1 },
      { from: 3, to: 9, order: 1 },
      { from: 4, to: 10, order: 1 },
      { from: 5, to: 11, order: 1 }
    ]
  }
};

export class MoleculeParser {
  private atomSphereCache: Map<string, THREE.SphereGeometry> = new Map();
  private bondCylinderCache: Map<string, THREE.CylinderGeometry> = new Map();

  public parse(data: MoleculeData): { group: THREE.Group; atomMap: Map<THREE.Mesh, AtomData & { index: number; connectedAtoms: number[] }> } {
    const group = new THREE.Group();
    const atomMap = new Map<THREE.Mesh, AtomData & { index: number; connectedAtoms: number[] }>();
    const atomMeshes: THREE.Mesh[] = [];
    const connectedAtomsMap: Map<number, number[]> = new Map();

    data.bonds.forEach(bond => {
      if (!connectedAtomsMap.has(bond.from)) {
        connectedAtomsMap.set(bond.from, []);
      }
      if (!connectedAtomsMap.has(bond.to)) {
        connectedAtomsMap.set(bond.to, []);
      }
      connectedAtomsMap.get(bond.from)!.push(bond.to);
      connectedAtomsMap.get(bond.to)!.push(bond.from);
    });

    const center = this.calculateCenter(data.atoms);

    data.atoms.forEach((atom, index) => {
      const sphere = this.createAtomSphere(atom);
      sphere.position.set(
        atom.x - center.x,
        atom.y - center.y,
        atom.z - center.z
      );
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      group.add(sphere);
      atomMeshes.push(sphere);

      const connectedAtoms = connectedAtomsMap.get(index) || [];
      atomMap.set(sphere, { ...atom, index, connectedAtoms });
    });

    data.bonds.forEach(bond => {
      const fromAtom = data.atoms[bond.from];
      const toAtom = data.atoms[bond.to];
      
      const fromPos = new THREE.Vector3(
        fromAtom.x - center.x,
        fromAtom.y - center.y,
        fromAtom.z - center.z
      );
      const toPos = new THREE.Vector3(
        toAtom.x - center.x,
        toAtom.y - center.y,
        toAtom.z - center.z
      );

      const bondGroup = this.createBond(fromPos, toPos, bond.order, fromAtom.radius, toAtom.radius);
      group.add(bondGroup);
    });

    return { group, atomMap };
  }

  private calculateCenter(atoms: AtomData[]): { x: number; y: number; z: number } {
    let sumX = 0, sumY = 0, sumZ = 0;
    atoms.forEach(atom => {
      sumX += atom.x;
      sumY += atom.y;
      sumZ += atom.z;
    });
    return {
      x: sumX / atoms.length,
      y: sumY / atoms.length,
      z: sumZ / atoms.length
    };
  }

  private createAtomSphere(atom: AtomData): THREE.Mesh {
    const cacheKey = `${atom.radius.toFixed(2)}`;
    let geometry = this.atomSphereCache.get(cacheKey);
    
    if (!geometry) {
      geometry = new THREE.SphereGeometry(atom.radius, 32, 32);
      this.atomSphereCache.set(cacheKey, geometry);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    const baseColor = new THREE.Color(atom.color);
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    
    const highlightColor = baseColor.clone().offsetHSL(0, 0, 0.3);
    const shadowColor = baseColor.clone().offsetHSL(0, 0, -0.2);
    
    gradient.addColorStop(0, `rgb(${Math.floor(highlightColor.r * 255)}, ${Math.floor(highlightColor.g * 255)}, ${Math.floor(highlightColor.b * 255)})`);
    gradient.addColorStop(0.5, atom.color);
    gradient.addColorStop(1, `rgb(${Math.floor(shadowColor.r * 255)}, ${Math.floor(shadowColor.g * 255)}, ${Math.floor(shadowColor.b * 255)})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 100,
      specular: new THREE.Color(0x444444)
    });

    return new THREE.Mesh(geometry, material);
  }

  private createBond(
    from: THREE.Vector3,
    to: THREE.Vector3,
    order: number,
    fromRadius: number,
    toRadius: number
  ): THREE.Group {
    const group = new THREE.Group();
    
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    const normalizedDirection = direction.clone().normalize();
    
    const start = from.clone().add(normalizedDirection.clone().multiplyScalar(fromRadius * 0.9));
    const end = to.clone().sub(normalizedDirection.clone().multiplyScalar(toRadius * 0.9));
    const actualLength = end.distanceTo(start);

    const bondRadius = 0.08;
    const gap = 0.18;

    for (let i = 0; i < order; i++) {
      const cylinder = this.createSingleBond(bondRadius, actualLength);
      
      let offset = new THREE.Vector3(0, 0, 0);
      if (order > 1) {
        const perpendicular = new THREE.Vector3();
        if (Math.abs(normalizedDirection.y) < 0.9) {
          perpendicular.set(0, 1, 0);
        } else {
          perpendicular.set(1, 0, 0);
        }
        const tangent = new THREE.Vector3().crossVectors(normalizedDirection, perpendicular).normalize();
        
        if (order === 2) {
          offset = tangent.clone().multiplyScalar((i - 0.5) * gap);
        } else if (order === 3) {
          offset = tangent.clone().multiplyScalar((i - 1) * gap);
        }
      }

      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      midPoint.add(offset);

      cylinder.position.copy(midPoint);
      
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normalizedDirection);
      cylinder.setRotationFromQuaternion(quaternion);

      group.add(cylinder);
    }

    return group;
  }

  private createSingleBond(radius: number, length: number): THREE.Mesh {
    const cacheKey = `${radius.toFixed(3)}_${length.toFixed(3)}`;
    let geometry = this.bondCylinderCache.get(cacheKey);
    
    if (!geometry) {
      geometry = new THREE.CylinderGeometry(radius, radius, length, 16);
      this.bondCylinderCache.set(cacheKey, geometry);
    }

    const material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.7,
      shininess: 50
    });

    return new THREE.Mesh(geometry, material);
  }

  public async loadFromFile(file: File): Promise<MoleculeData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (this.validateMoleculeData(data)) {
            resolve(data);
          } else {
            reject(new Error('无效的分子数据格式'));
          }
        } catch (error) {
          reject(new Error('JSON解析失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  private validateMoleculeData(data: any): data is MoleculeData {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.atoms) || !Array.isArray(data.bonds)) return false;
    
    for (const atom of data.atoms) {
      if (typeof atom.element !== 'string') return false;
      if (typeof atom.x !== 'number' || typeof atom.y !== 'number' || typeof atom.z !== 'number') return false;
      if (typeof atom.radius !== 'number') return false;
      if (typeof atom.color !== 'string') return false;
      if (typeof atom.hybridization !== 'string') return false;
    }
    
    for (const bond of data.bonds) {
      if (typeof bond.from !== 'number' || typeof bond.to !== 'number') return false;
      if (typeof bond.order !== 'number' || ![1, 2, 3].includes(bond.order)) return false;
      if (bond.from < 0 || bond.from >= data.atoms.length) return false;
      if (bond.to < 0 || bond.to >= data.atoms.length) return false;
    }
    
    return true;
  }

  public getPresetMolecule(key: string): MoleculeData {
    return PRESET_MOLECULES[key] || PRESET_MOLECULES.water;
  }

  public getAvailablePresets(): string[] {
    return Object.keys(PRESET_MOLECULES);
  }

  public dispose(): void {
    this.atomSphereCache.forEach(geo => geo.dispose());
    this.bondCylinderCache.forEach(geo => geo.dispose());
    this.atomSphereCache.clear();
    this.bondCylinderCache.clear();
  }
}
