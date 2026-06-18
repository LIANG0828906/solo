import type { LibraryItem, CategoryType, ShapeType } from '../../types';
import { useCanvasStore } from '../../store/useCanvasStore';
import { CanvasManager } from '../canvas/CanvasManager';

const starSvg = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,38 97,38 68,60 79,93 50,73 21,93 32,60 3,38 39,38" fill="${color}"/></svg>`
  )}`;

const stickerData: { name: string; svg: string }[] = [
  {
    name: '爱心',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 88 L15 50 Q5 35 20 22 Q35 12 50 28 Q65 12 80 22 Q95 35 85 50 Z" fill="#E74C3C"/></svg>`,
  },
  {
    name: '星星',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,38 97,38 68,60 79,93 50,73 21,93 32,60 3,38 39,38" fill="#F1C40F"/></svg>`,
  },
  {
    name: '笑脸',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#F39C12"/><circle cx="35" cy="40" r="5" fill="#333"/><circle cx="65" cy="40" r="5" fill="#333"/><path d="M30 60 Q50 80 70 60" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    name: '花朵',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="20" r="15" fill="#E91E63"/><circle cx="80" cy="50" r="15" fill="#E91E63"/><circle cx="50" cy="80" r="15" fill="#E91E63"/><circle cx="20" cy="50" r="15" fill="#E91E63"/><circle cx="50" cy="50" r="15" fill="#FFC107"/></svg>`,
  },
  {
    name: '彩虹',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M5 55 Q50 -10 95 55" stroke="#E74C3C" stroke-width="6" fill="none"/><path d="M13 55 Q50 0 87 55" stroke="#F39C12" stroke-width="6" fill="none"/><path d="M21 55 Q50 10 79 55" stroke="#F1C40F" stroke-width="6" fill="none"/><path d="M29 55 Q50 20 71 55" stroke="#27AE60" stroke-width="6" fill="none"/><path d="M37 55 Q50 30 63 55" stroke="#3498DB" stroke-width="6" fill="none"/><path d="M45 55 Q50 40 55 55" stroke="#9B59B6" stroke-width="6" fill="none"/></svg>`,
  },
  {
    name: '太阳',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="#F39C12"/><g stroke="#F39C12" stroke-width="4" stroke-linecap="round"><line x1="50" y1="10" x2="50" y2="25"/><line x1="50" y1="75" x2="50" y2="90"/><line x1="10" y1="50" x2="25" y2="50"/><line x1="75" y1="50" x2="90" y2="50"/><line x1="22" y1="22" x2="32" y2="32"/><line x1="68" y1="68" x2="78" y2="78"/><line x1="78" y1="22" x2="68" y2="32"/><line x1="32" y1="68" x2="22" y2="78"/></g></svg>`,
  },
  {
    name: '音符',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M35 80 Q25 80 25 70 Q25 60 35 60 Q45 60 45 70 Q45 78 35 80 Z" fill="#333"/><rect x="45" y="20" width="5" height="60" fill="#333"/><path d="M45 20 L85 10 L85 40 L45 50 Z" fill="#333"/></svg>`,
  },
  {
    name: '闪电',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="55,5 25,50 45,50 35,95 75,40 55,40 65,5" fill="#F1C40F"/></svg>`,
  },
  {
    name: '云朵',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><ellipse cx="30" cy="40" rx="20" ry="18" fill="#ECF0F1"/><ellipse cx="55" cy="35" rx="25" ry="22" fill="#ECF0F1"/><ellipse cx="75" cy="42" rx="18" ry="16" fill="#ECF0F1"/></svg>`,
  },
  {
    name: '气球',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="35" rx="25" ry="30" fill="#E74C3C"/><polygon points="47,65 53,65 50,70" fill="#E74C3C"/><path d="M50 70 Q55 80 50 95" stroke="#333" stroke-width="1.5" fill="none"/></svg>`,
  },
  {
    name: '相机',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="25" width="80" height="60" rx="6" fill="#34495E"/><rect x="30" y="18" width="20" height="10" rx="2" fill="#34495E"/><circle cx="50" cy="55" r="18" fill="#2C3E50"/><circle cx="50" cy="55" r="12" fill="#7F8C8D"/><circle cx="50" cy="55" r="6" fill="#2C3E50"/><circle cx="78" cy="35" r="3" fill="#E74C3C"/></svg>`,
  },
  {
    name: '礼物',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="35" width="70" height="55" fill="#E74C3C"/><rect x="15" y="35" width="70" height="10" fill="#C0392B"/><rect x="45" y="35" width="10" height="55" fill="#F1C40F"/><path d="M35 35 Q50 15 50 35 Q50 15 65 35" fill="#F1C40F"/></svg>`,
  },
];

const buildStickers = (): LibraryItem[] =>
  stickerData.map((s, i) => ({
    id: `sticker-${i}`,
    type: 'sticker' as const,
    name: s.name,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(s.svg)}`,
    defaultWidth: 100,
    defaultHeight: 100,
    category: 'stickers',
  }));

const buildShapes = (): LibraryItem[] => {
  const shapes: { type: ShapeType; name: string; w: number; h: number }[] = [
    { type: 'circle', name: '圆形', w: 100, h: 100 },
    { type: 'rectangle', name: '矩形', w: 140, h: 100 },
    { type: 'triangle', name: '三角形', w: 100, h: 100 },
    { type: 'star', name: '星形', w: 100, h: 100 },
  ];
  const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#34495E'];
  const items: LibraryItem[] = [];
  shapes.forEach((s, si) => {
    colors.forEach((c, ci) => {
      items.push({
        id: `shape-${si}-${ci}`,
        type: 'shape',
        name: `${s.name}-${ci + 1}`,
        shape: s.type,
        fillColor: c,
        src:
          s.type === 'star'
            ? starSvg(c)
            : `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${
                  s.type === 'circle'
                    ? `<circle cx="50" cy="50" r="48" fill="${c}"/>`
                    : s.type === 'rectangle'
                    ? `<rect x="5" y="15" width="90" height="70" rx="6" fill="${c}"/>`
                    : `<polygon points="50,8 95,92 5,92" fill="${c}"/>`
                }</svg>`
              )}`,
        defaultWidth: s.w,
        defaultHeight: s.h,
        category: 'shapes',
      });
    });
  });
  return items;
};

const buildFills = (): LibraryItem[] => {
  const fills = [
    '#E74C3C', '#C0392B', '#E67E22', '#D35400',
    '#F1C40F', '#F39C12', '#2ECC71', '#27AE60',
    '#1ABC9C', '#16A085', '#3498DB', '#2980B9',
    '#9B59B6', '#8E44AD', '#E91E63', '#C2185B',
    '#34495E', '#2C3E50', '#7F8C8D', '#95A5A6',
    '#FFFFFF', '#BDC3C7', '#ECF0F1', '#000000',
  ];
  return fills.map((c, i) => ({
    id: `fill-${i}`,
    type: 'fill' as const,
    name: `色块-${i + 1}`,
    fillColor: c,
    defaultWidth: 120,
    defaultHeight: 120,
    category: 'fills',
  }));
};

let _cache: LibraryItem[] | null = null;

export class LibraryProvider {
  private static getAllItems(): LibraryItem[] {
    if (!_cache) {
      _cache = [...buildStickers(), ...buildShapes(), ...buildFills()];
    }
    return _cache;
  }

  static getItemsByCategory(category: CategoryType): LibraryItem[] {
    const all = LibraryProvider.getAllItems();
    const recent = useCanvasStore.getState().recentItems;
    const query = useCanvasStore.getState().searchQuery.trim().toLowerCase();

    let items: LibraryItem[];
    switch (category) {
      case 'stickers':
        items = all.filter((i) => i.type === 'sticker');
        break;
      case 'shapes':
        items = all.filter((i) => i.type === 'shape');
        break;
      case 'fills':
        items = all.filter((i) => i.type === 'fill');
        break;
      case 'recent':
        items = recent;
        break;
      case 'all':
      default:
        items = all;
        break;
    }

    if (query) {
      items = items.filter((i) => i.name.toLowerCase().includes(query));
    }

    return items;
  }

  static searchItems(query: string): LibraryItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return LibraryProvider.getAllItems();
    return LibraryProvider.getAllItems().filter((i) =>
      i.name.toLowerCase().includes(q)
    );
  }

  static addToCanvas(item: LibraryItem, x?: number, y?: number): void {
    CanvasManager.addElement(item, x, y);
  }
}
