import * as THREE from 'three';

export interface BuildingData {
  id: string;
  name: string;
  year: number;
  style: string;
  description: string;
  position: { x: number; z: number };
  height: number;
}

interface BuildingMesh {
  group: THREE.Group;
  baseMaterial: THREE.MeshPhysicalMaterial;
  mainMaterial: THREE.MeshPhysicalMaterial;
  data: BuildingData;
  color: string;
  baseOpacity: number;
  pulseStartTime: number;
  isPulsing: boolean;
}

const COLORS = {
  pre1900: '#FFB300',
  era1900: '#FF5722',
  post2000: '#8E24AA'
};

const BUILDING_DATA: BuildingData[] = [
  {
    id: 'b01',
    name: '巴黎圣母院',
    year: 1345,
    style: '哥特式',
    description: '法国巴黎著名天主教堂，以其哥特式建筑艺术和雕刻彩绘闻名于世。',
    position: { x: -8, z: -6 },
    height: 5
  },
  {
    id: 'b02',
    name: '科隆大教堂',
    year: 1880,
    style: '哥特式',
    description: '德国科隆地标，世界第三高教堂，历时600余年建成的哥特式杰作。',
    position: { x: 5, z: -8 },
    height: 4.5
  },
  {
    id: 'b03',
    name: '国会大厦',
    year: 1894,
    style: '新古典主义',
    description: '德国柏林联邦议会所在地，玻璃穹顶是现代建筑与历史融合的典范。',
    position: { x: -4, z: 2 },
    height: 3.5
  },
  {
    id: 'b04',
    name: '埃菲尔铁塔',
    year: 1889,
    style: '工业风 / 现代主义',
    description: '巴黎战神广场的铁镂空铁塔，以设计师古斯塔夫·埃菲尔命名的世界地标。',
    position: { x: 0, z: 0 },
    height: 5
  },
  {
    id: 'b05',
    name: '克莱斯勒大厦',
    year: 1930,
    style: '装饰艺术',
    description: '纽约曼哈顿标志性摩天楼，不锈钢尖顶和鹰头饰件是装饰艺术风格代表。',
    position: { x: 7, z: 4 },
    height: 4
  },
  {
    id: 'b06',
    name: '帝国大厦',
    year: 1931,
    style: '装饰艺术 / 现代主义',
    description: '纽约地标摩天大楼，曾保持世界最高建筑纪录近40年。',
    position: { x: 9, z: -2 },
    height: 4.5
  },
  {
    id: 'b07',
    name: '金门大桥',
    year: 1937,
    style: '艺术装饰 / 工程建筑',
    description: '旧金山标志性悬索桥，国际橘红配色与宏伟结构享誉全球。',
    position: { x: -10, z: 5 },
    height: 3
  },
  {
    id: 'b08',
    name: '悉尼歌剧院',
    year: 1973,
    style: '表现主义 / 现代主义',
    description: '澳大利亚悉尼港的标志性建筑，壳状屋顶设计如迎风扬帆的船队。',
    position: { x: 3, z: 7 },
    height: 3.5
  },
  {
    id: 'b09',
    name: '世界贸易中心',
    year: 1973,
    style: '现代主义',
    description: '纽约原双子塔，曾是世界最高建筑之一，9·11事件后重建为自由塔。',
    position: { x: -6, z: -3 },
    height: 4
  },
  {
    id: 'b10',
    name: '蓬皮杜中心',
    year: 1977,
    style: '高技派',
    description: '巴黎现代艺术博物馆，外露的管线和结构骨架是高技派建筑的代表。',
    position: { x: -2, z: -5 },
    height: 3
  },
  {
    id: 'b11',
    name: '毕尔巴鄂古根海姆',
    year: 1997,
    style: '解构主义',
    description: '西班牙毕尔巴鄂的当代艺术馆，钛金属曲面造型如雕塑般流动。',
    position: { x: 6, z: -5 },
    height: 3.5
  },
  {
    id: 'b12',
    name: '鸟巢体育场',
    year: 2008,
    style: '解构主义 / 参数化',
    description: '北京2008奥运主体育场，编织状钢结构如巨大鸟巢，是当代建筑奇迹。',
    position: { x: -5, z: 8 },
    height: 4
  },
  {
    id: 'b13',
    name: '迪拜哈利法塔',
    year: 2010,
    style: '新未来主义',
    description: '世界最高建筑，高828米，Y型平面设计灵感源自伊斯兰建筑图案。',
    position: { x: 10, z: 0 },
    height: 5
  },
  {
    id: 'b14',
    name: '广州大剧院',
    year: 2010,
    style: '解构主义',
    description: '扎哈·哈迪德设计的广州地标，圆润双砾造型融入珠江河岸景观。',
    position: { x: 2, z: -8 },
    height: 3
  },
  {
    id: 'b15',
    name: '苹果飞船总部',
    year: 2017,
    style: '极简未来主义',
    description: '加州库比蒂诺的苹果公司总部，环形玻璃幕墙建筑如降落在绿地的飞船。',
    position: { x: -9, z: -1 },
    height: 2.5
  }
];

export class CityModel {
  public group: THREE.Group;
  private buildings: Map<string, BuildingMesh> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.PerspectiveCamera;
  private buildingMeshes: THREE.Mesh[] = [];
  private onBuildingClick: ((data: BuildingData | null) => void) | null = null;
  private baseGeometry: THREE.BoxGeometry;
  private tempVector: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.group = new THREE.Group();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.baseGeometry = new THREE.BoxGeometry(1.2, 0.5, 1.2);
    this.tempVector = new THREE.Vector3();

    this.createGround();
    this.createBuildings();
    this.setupInteraction(domElement);
  }

  private createGround(): void {
    const groundGeometry = new THREE.CircleGeometry(16, 64);
    const groundMaterial = new THREE.MeshPhysicalMaterial({
      color: '#0f1424',
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    this.group.add(ground);

    const gridHelper = new THREE.GridHelper(32, 32, '#FFD70022', '#FFFFFF08');
    gridHelper.position.y = -0.24;
    this.group.add(gridHelper);
  }

  private getColorByYear(year: number): string {
    if (year <= 1900) return COLORS.pre1900;
    if (year <= 2000) return COLORS.era1900;
    return COLORS.post2000;
  }

  private createBuildings(): void {
    for (const data of BUILDING_DATA) {
      const color = this.getColorByYear(data.year);
      const buildingGroup = new THREE.Group();

      const baseMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color).multiplyScalar(0.7),
        transparent: true,
        opacity: 0.75,
        roughness: 0.3,
        metalness: 0.6,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2
      });
      const base = new THREE.Mesh(this.baseGeometry, baseMaterial);
      base.position.y = 0;
      base.castShadow = true;
      base.receiveShadow = true;
      buildingGroup.add(base);

      const mainGeometry = new THREE.BoxGeometry(0.9, data.height, 0.9);
      const mainMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        transparent: true,
        opacity: 0.75,
        roughness: 0.2,
        metalness: 0.7,
        clearcoat: 0.8,
        clearcoatRoughness: 0.15,
        emissive: new THREE.Color(color).multiplyScalar(0.15)
      });
      const main = new THREE.Mesh(mainGeometry, mainMaterial);
      main.position.y = 0.25 + data.height / 2;
      main.castShadow = true;
      main.receiveShadow = true;
      buildingGroup.add(main);

      buildingGroup.position.set(data.position.x, 0, data.position.z);
      this.group.add(buildingGroup);

      const buildingMesh: BuildingMesh = {
        group: buildingGroup,
        baseMaterial,
        mainMaterial,
        data,
        color,
        baseOpacity: 0.75,
        pulseStartTime: 0,
        isPulsing: false
      };

      this.buildings.set(data.id, buildingMesh);
      this.buildingMeshes.push(base, main);
      (base as any).buildingId = data.id;
      (main as any).buildingId = data.id;
    }
  }

  private setupInteraction(domElement: HTMLElement): void {
    domElement.addEventListener('click', (event) => {
      const rect = domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.buildingMeshes, false);

      if (intersects.length > 0) {
        const buildingId = (intersects[0].object as any).buildingId as string;
        if (buildingId) {
          const building = this.buildings.get(buildingId);
          if (building) {
            this.highlightBuilding(buildingId);
            if (this.onBuildingClick) {
              this.onBuildingClick(building.data);
            }
          }
        }
      } else {
        if (this.onBuildingClick) {
          this.onBuildingClick(null);
        }
      }
    });
  }

  public setOnBuildingClick(callback: (data: BuildingData | null) => void): void {
    this.onBuildingClick = callback;
  }

  public highlightBuilding(id: string): void {
    const building = this.buildings.get(id);
    if (building) {
      building.isPulsing = true;
      building.pulseStartTime = performance.now();
      building.mainMaterial.emissive.set(building.color).multiplyScalar(0.6);
      building.baseMaterial.emissive.set(building.color).multiplyScalar(0.4);
    }
  }

  public filterByYearRange(startYear: number, endYear: number): void {
    for (const building of this.buildings.values()) {
      const inRange = building.data.year >= startYear && building.data.year <= endYear;
      const targetOpacity = inRange ? building.baseOpacity : 0.3;
      this.animateOpacity(building.mainMaterial, targetOpacity, 400);
      this.animateOpacity(building.baseMaterial, targetOpacity, 400);
    }
  }

  private animateOpacity(material: THREE.MeshPhysicalMaterial, targetOpacity: number, duration: number): void {
    const startOpacity = material.opacity;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      material.opacity = startOpacity + (targetOpacity - startOpacity) * eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  public getBuildingsData(): BuildingData[] {
    return BUILDING_DATA;
  }

  public getBuildingById(id: string): BuildingData | undefined {
    return this.buildings.get(id)?.data;
  }

  public getBuildingScreenPosition(id: string, camera: THREE.PerspectiveCamera, width: number, height: number): { x: number; y: number } | null {
    const building = this.buildings.get(id);
    if (!building) return null;

    this.tempVector.copy(building.group.position);
    this.tempVector.y += 2;
    this.tempVector.project(camera);

    return {
      x: (this.tempVector.x * 0.5 + 0.5) * width,
      y: (-this.tempVector.y * 0.5 + 0.5) * height
    };
  }

  public update(): void {
    const now = performance.now();
    for (const building of this.buildings.values()) {
      if (building.isPulsing) {
        const elapsed = now - building.pulseStartTime;
        const duration = 600;

        if (elapsed >= duration) {
          building.isPulsing = false;
          building.group.scale.set(1, 1, 1);
          building.mainMaterial.emissive.set(building.color).multiplyScalar(0.15);
          building.baseMaterial.emissive.set(0x000000);
        } else {
          const progress = elapsed / duration;
          let scale: number;
          if (progress < 0.5) {
            scale = 1 + (progress / 0.5) * 0.3;
          } else {
            scale = 1.3 - ((progress - 0.5) / 0.5) * 0.3;
          }
          building.group.scale.set(scale, scale, scale);

          const emissiveIntensity = 0.6 * (1 - progress);
          building.mainMaterial.emissive.set(building.color).multiplyScalar(0.15 + emissiveIntensity);
          building.baseMaterial.emissive.set(building.color).multiplyScalar(emissiveIntensity * 0.6);
        }
      }
    }
  }

  public dispose(): void {
    for (const building of this.buildings.values()) {
      building.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry !== this.baseGeometry) {
            obj.geometry.dispose();
          }
          if (obj.material instanceof THREE.Material) {
            obj.material.dispose();
          }
        }
      });
    }
    this.baseGeometry.dispose();
  }
}
