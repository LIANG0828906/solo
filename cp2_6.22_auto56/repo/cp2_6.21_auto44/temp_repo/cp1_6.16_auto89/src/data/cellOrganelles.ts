export type OrganelleType =
  | 'nucleus'
  | 'chloroplast'
  | 'mitochondrion'
  | 'golgi'
  | 'er'
  | 'ribosome'
  | 'centrosome';

export interface OrganelleData {
  id: string;
  type: OrganelleType;
  name: string;
  englishName: string;
  color: string;
  sizeRange: string;
  scale: number;
  position: [number, number, number];
  description: string;
  count?: number;
}

export interface ViewPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const organelles: OrganelleData[] = [
  {
    id: 'nucleus',
    type: 'nucleus',
    name: '细胞核',
    englishName: 'Nucleus',
    color: '#4a148c',
    sizeRange: '5-10μm',
    scale: 0.8,
    position: [-2.5, 0, 0],
    description:
      '细胞核是细胞的控制中心，包含遗传物质DNA，负责调控基因表达和介导DNA复制。细胞核被核膜包围，核膜上有核孔允许物质进出。',
    count: 1,
  },
  {
    id: 'chloroplast',
    type: 'chloroplast',
    name: '叶绿体',
    englishName: 'Chloroplast',
    color: '#1b5e20',
    sizeRange: '2-10μm',
    scale: 0.5,
    position: [1.5, 1.5, 1],
    description:
      '叶绿体是进行光合作用的细胞器，能将光能转化为化学能并储存于有机物中。其内部的类囊体堆叠结构含有叶绿素，是捕获光能的关键部位。',
    count: 4,
  },
  {
    id: 'mitochondrion',
    type: 'mitochondrion',
    name: '线粒体',
    englishName: 'Mitochondrion',
    color: '#e65100',
    sizeRange: '0.5-1μm',
    scale: 0.4,
    position: [2, -1, 1.5],
    description:
      '线粒体是细胞的能量工厂，通过有氧呼吸产生ATP，为细胞各项生命活动提供能量。其内膜向内折叠形成嵴，增大了呼吸作用的表面积。',
    count: 3,
  },
  {
    id: 'golgi',
    type: 'golgi',
    name: '高尔基体',
    englishName: 'Golgi Apparatus',
    color: '#8d6e63',
    sizeRange: '0.5-2μm',
    scale: 0.6,
    position: [-1, -1.5, 1],
    description:
      '高尔基体由一系列扁平膜囊堆叠而成，主要功能是修饰、分类和包装蛋白质，将其送往细胞的特定部位或分泌到细胞外。',
    count: 1,
  },
  {
    id: 'er',
    type: 'er',
    name: '内质网',
    englishName: 'Endoplasmic Reticulum',
    color: '#4fc3f7',
    sizeRange: '网状结构',
    scale: 1.2,
    position: [-2.5, 0, 0],
    description:
      '内质网是由膜连接而成的网状结构，分为粗面内质网和滑面内质网。粗面内质网附着核糖体，参与蛋白质合成；滑面内质网参与脂质合成。',
    count: 1,
  },
  {
    id: 'ribosome',
    type: 'ribosome',
    name: '核糖体',
    englishName: 'Ribosome',
    color: '#e53935',
    sizeRange: '20-30nm',
    scale: 0.08,
    position: [-2.5, 0, 0],
    description:
      '核糖体是合成蛋白质的微小颗粒，由RNA和蛋白质组成。它可以游离在细胞质中，也可以附着在内质网上，根据mRNA的指令合成多肽链。',
    count: 20,
  },
  {
    id: 'centrosome',
    type: 'centrosome',
    name: '中心体',
    englishName: 'Centrosome',
    color: '#757575',
    sizeRange: '0.1-0.5μm',
    scale: 0.3,
    position: [0, -2, -1],
    description:
      '中心体由两个相互垂直的中心粒组成，是细胞分裂时纺锤丝的发出点。在细胞分裂过程中，中心体复制并移向细胞两极，组织纺锤体形成。',
    count: 1,
  },
];

export const viewPresets: ViewPreset[] = [
  {
    name: '整体视图',
    position: [8, 6, 8],
    target: [0, 0, 0],
  },
  {
    name: '细胞核特写',
    position: [-3, 1, 3],
    target: [-2.5, 0, 0],
  },
  {
    name: '叶绿体特写',
    position: [3, 3, 3],
    target: [1.5, 1.5, 1],
  },
];

export const initialVisibleOrganelles: Record<OrganelleType, boolean> = {
  nucleus: true,
  chloroplast: true,
  mitochondrion: true,
  golgi: true,
  er: true,
  ribosome: true,
  centrosome: true,
};
