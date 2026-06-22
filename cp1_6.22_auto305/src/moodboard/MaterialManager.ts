import type { MaterialItem, CanvasBlock, TextStyle } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export class MaterialManager {
  private materials: MaterialItem[] = [];

  constructor() {
    this.loadDefaultMaterials();
  }

  private loadDefaultMaterials(): void {
    const images: MaterialItem[] = [
      { id: 'img-1', type: 'image', name: '抽象纹理 01', thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=300&q=80' },
      { id: 'img-2', type: 'image', name: '渐变色彩 02', thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&q=80' },
      { id: 'img-3', type: 'image', name: '自然光影 03', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80' },
      { id: 'img-4', type: 'image', name: '城市建筑 04', thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&q=80' },
      { id: 'img-5', type: 'image', name: '艺术展览 05', thumbnail: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=300&q=80' },
      { id: 'img-6', type: 'image', name: '几何图案 06', thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300&q=80' },
      { id: 'img-7', type: 'image', name: '设计草稿 07', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=80' },
      { id: 'img-8', type: 'image', name: '材质纹理 08', thumbnail: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=300&q=80' },
      { id: 'img-9', type: 'image', name: '色彩搭配 09', thumbnail: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=300&q=80' },
      { id: 'img-10', type: 'image', name: '极简风格 10', thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=300&q=80' },
    ];

    const texts: MaterialItem[] = [
      { id: 'txt-1', type: 'text', name: '标题文字', content: '创意灵感' },
      { id: 'txt-2', type: 'text', name: '说明文字', content: '探索设计的无限可能，用色彩与形状表达内心世界。' },
      { id: 'txt-3', type: 'text', name: '引用语句', content: '"设计是解决问题的艺术。" —— 无名设计师' },
      { id: 'txt-4', type: 'text', name: '关键词组', content: '极简 · 现代 · 优雅 · 创新' },
    ];

    this.materials = [...images, ...texts];
  }

  getMaterials(): MaterialItem[] {
    return this.materials;
  }

  handleDragStart(e: React.DragEvent, item: MaterialItem): void {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  }

  handleDrop(
    e: React.DragEvent,
    canvasX: number,
    canvasY: number,
    currentMaxZ: number
  ): CanvasBlock | null {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return null;

    try {
      const item = JSON.parse(data) as MaterialItem;
      return this.createCanvasBlock(item, canvasX, canvasY, currentMaxZ);
    } catch {
      return null;
    }
  }

  private createCanvasBlock(
    item: MaterialItem,
    x: number,
    y: number,
    maxZ: number
  ): CanvasBlock {
    const baseBlock: Omit<CanvasBlock, 'type' | 'content' | 'width' | 'height' | 'textStyle'> = {
      id: generateId(),
      x: x - 100,
      y: y - 75,
      rotation: 0,
      scale: 1,
      zIndex: maxZ + 1,
    };

    if (item.type === 'image') {
      return {
        ...baseBlock,
        type: 'image',
        content: item.thumbnail || '',
        width: 200,
        height: 150,
      };
    } else {
      const textStyle: TextStyle = { ...DEFAULT_TEXT_STYLE };
      const content = item.content || '双击编辑文字';
      const estimatedWidth = Math.max(120, Math.min(300, content.length * 14));
      const estimatedHeight = Math.max(60, Math.ceil(content.length / 20) * 30 + 20);

      return {
        ...baseBlock,
        type: 'text',
        content,
        width: estimatedWidth,
        height: estimatedHeight,
        textStyle,
      };
    }
  }

  createNewTextBlock(
    x: number,
    y: number,
    maxZ: number,
    content: string = '新文字'
  ): CanvasBlock {
    const textStyle: TextStyle = { ...DEFAULT_TEXT_STYLE };
    return {
      id: generateId(),
      type: 'text',
      x,
      y,
      width: 150,
      height: 60,
      rotation: 0,
      scale: 1,
      zIndex: maxZ + 1,
      content,
      textStyle,
    };
  }
}
