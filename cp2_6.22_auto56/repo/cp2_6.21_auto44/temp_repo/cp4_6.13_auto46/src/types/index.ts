export type TemplateType = 'full' | 'border' | 'spread';

export interface Photo {
  id: string;
  title: string;
  originalUrl: string;
  thumbnailUrl: string;
  originalWidth: number;
  originalHeight: number;
  captureDate: string;
  tags: string[];
  createdAt: number;
}

export interface LayoutConfig {
  templateType: TemplateType;
  subStyle: number;
  margin: number;
  borderColor: string;
  borderRadius: number;
  previewWidth: number;
}

export interface PortfolioItem {
  photoId: string;
  layout: LayoutConfig;
}

export interface Portfolio {
  id: string;
  title: string;
  coverImageId?: string;
  coverColor: string;
  coverTitle: string;
  backCoverColor: string;
  items: PortfolioItem[];
  layoutPerPage: 1 | 2;
  createdAt: number;
  shareToken?: string;
}

export interface TemplateOption {
  id: TemplateType;
  name: string;
  description: string;
  subStyles: string[];
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'full',
    name: '满版无框',
    description: '图片占满整版，强调视觉冲击力',
    subStyles: ['原图比例', '强制16:9', '强制3:2'],
  },
  {
    id: 'border',
    name: '白色留白边框',
    description: '经典画廊风格，留白突出主体',
    subStyles: ['均匀边框', '底部加宽', '上下加宽'],
  },
  {
    id: 'spread',
    name: '画册双页跨版',
    description: '杂志画册排版，增加叙事感',
    subStyles: ['中分线', '渐变过渡', '无缝拼接'],
  },
];

export const PRESET_TAGS = ['风光', '人像', '街拍', '建筑', '静物', '黑白', '纪实', '生态'];
