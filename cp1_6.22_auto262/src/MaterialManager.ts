import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export type MaterialDataType = 'numeric' | 'categorical';

export interface DataPoint {
  label: string;
  value: number;
  category?: string;
  x?: number;
  y?: number;
  [key: string]: any;
}

export interface Material {
  id: string;
  name: string;
  dataType: MaterialDataType;
  description: string;
  data: DataPoint[];
  createdAt: number;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export const useMaterialStore = defineStore('material', {
  state: () => ({
    materials: [] as Material[]
  }),
  getters: {
    getAllMaterials: (state) => state.materials,
    getMaterialById: (state) => (id: string) => state.materials.find((m) => m.id === id)
  },
  actions: {
    initDefaultMaterials() {
      const surveyData: DataPoint[] = [
        { label: '非常满意', value: 42, category: '满意度' },
        { label: '满意', value: 28, category: '满意度' },
        { label: '一般', value: 18, category: '满意度' },
        { label: '不满意', value: 8, category: '满意度' },
        { label: '非常不满意', value: 4, category: '满意度' }
      ];

      const salesData: DataPoint[] = [
        { label: 'Q1', value: 1200, x: 1, y: 85, category: '电子产品' },
        { label: 'Q2', value: 1800, x: 2, y: 92, category: '电子产品' },
        { label: 'Q3', value: 2100, x: 3, y: 78, category: '服装' },
        { label: 'Q4', value: 2800, x: 4, y: 95, category: '食品' },
        { label: 'Q5', value: 3200, x: 5, y: 88, category: '家居' }
      ];

      const trafficData: DataPoint[] = [
        { label: '北京', value: 2154, x: 1, y: 92, category: '一线城市' },
        { label: '上海', value: 2423, x: 2, y: 95, category: '一线城市' },
        { label: '广州', value: 1876, x: 3, y: 88, category: '一线城市' },
        { label: '深圳', value: 1756, x: 4, y: 90, category: '一线城市' },
        { label: '杭州', value: 1234, x: 5, y: 82, category: '新一线城市' },
        { label: '成都', value: 1687, x: 6, y: 86, category: '新一线城市' },
        { label: '武汉', value: 1123, x: 7, y: 79, category: '新一线城市' }
      ];

      const categoryData: DataPoint[] = [
        { label: '科技', value: 35 },
        { label: '生活', value: 28 },
        { label: '财经', value: 22 },
        { label: '体育', value: 15 },
        { label: '娱乐', value: 18 },
        { label: '教育', value: 12 }
      ];

      this.addMaterial('用户满意度调查', 'categorical', '来自Q4季度用户反馈的满意度分布数据', surveyData);
      this.addMaterial('季度销售数据', 'numeric', '2024年各产品线季度销售额及增长率', salesData);
      this.addMaterial('城市流量分布', 'numeric', '主要城市用户访问量与活跃度数据', trafficData);
      this.addMaterial('内容分类占比', 'categorical', '杂志各栏目内容分布比例统计', categoryData);
    },
    addMaterial(name: string, dataType: MaterialDataType, description: string, data: DataPoint[]): Material {
      const material: Material = {
        id: uuidv4(),
        name,
        dataType,
        description,
        data,
        createdAt: Date.now()
      };
      this.materials.push(material);
      return material;
    },
    updateMaterial(id: string, updates: Partial<Omit<Material, 'id' | 'createdAt'>>) {
      const index = this.materials.findIndex((m) => m.id === id);
      if (index !== -1) {
        this.materials[index] = { ...this.materials[index], ...updates };
      }
    },
    removeMaterial(id: string) {
      const index = this.materials.findIndex((m) => m.id === id);
      if (index !== -1) {
        this.materials.splice(index, 1);
      }
    }
  }
});

export class MaterialManager {
  private initialized = false;

  private get store() {
    return useMaterialStore();
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      if (this.store.materials.length === 0) {
        this.store.initDefaultMaterials();
      }
      this.initialized = true;
    }
  }

  getAllMaterials(): Material[] {
    this.ensureInitialized();
    return this.store.getAllMaterials;
  }

  getMaterialById(id: string): Material | undefined {
    this.ensureInitialized();
    return this.store.getMaterialById(id);
  }

  addMaterial(name: string, dataType: MaterialDataType, description: string, data: DataPoint[]): Material {
    this.ensureInitialized();
    return this.store.addMaterial(name, dataType, description, data);
  }

  updateMaterial(id: string, updates: Partial<Omit<Material, 'id' | 'createdAt'>>): void {
    this.ensureInitialized();
    this.store.updateMaterial(id, updates);
  }

  removeMaterial(id: string): void {
    this.ensureInitialized();
    this.store.removeMaterial(id);
  }
}

export const materialManager = new MaterialManager();
export default materialManager;
