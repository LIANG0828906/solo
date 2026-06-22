export interface ImageryItem {
  type: 'mountain' | 'water' | 'moon' | 'flower' | 'bird' | 'tree' | 'cloud';
  count: number;
}

export interface PoetryData {
  title: string;
  content: string;
  imagery: ImageryItem[];
}

interface ImageryKeyword {
  type: ImageryItem['type'];
  keywords: string[];
}

const IMAGERY_KEYWORDS: ImageryKeyword[] = [
  {
    type: 'mountain',
    keywords: ['山', '峰', '峦', '岭', '崖', '岩', '岳', '丘', '冈', '嶂', '青山', '远山', '高山', '群山', '山峰', '山峦', '山岭'],
  },
  {
    type: 'water',
    keywords: ['水', '江', '河', '湖', '海', '溪', '泉', '瀑', '潭', '浪', '波', '潮', '流水', '江水', '河水', '湖水', '溪水', '清泉'],
  },
  {
    type: 'moon',
    keywords: ['月', '明月', '月亮', '月光', '月色', '皓月', '残月', '新月', '圆月', '秋月', '明月', '月轮', '月华'],
  },
  {
    type: 'flower',
    keywords: ['花', '梅', '兰', '菊', '荷', '桃', '李', '杏', '牡丹', '海棠', '芙蓉', '茉莉', '丁香', '落花', '花开', '花香'],
  },
  {
    type: 'bird',
    keywords: ['鸟', '雁', '燕', '雀', '鹰', '鸥', '鹤', '鹃', '鸦', '莺', '飞鸟', '归鸟', '鸣鸟', '燕子', '大雁', '白鹤'],
  },
  {
    type: 'tree',
    keywords: ['树', '松', '柏', '杨', '柳', '梧桐', '枫', '竹', '林', '森', '古木', '树木', '松树', '柳树', '竹林', '森林'],
  },
  {
    type: 'cloud',
    keywords: ['云', '云', '雾', '烟', '霞', '霭', '白云', '乌云', '彩云', '浮云', '云烟', '云雾', '烟霞', '云霞'],
  },
];

export function parsePoetry(text: string): PoetryData {
  const trimmedText = text.trim();
  const lines = trimmedText.split(/[\n\r]+/).filter(line => line.trim());

  let title = '';
  let content = trimmedText;

  if (lines.length > 1) {
    const firstLine = lines[0].trim();
    if (firstLine.length <= 10 && !/[，。？！、；：]/.test(firstLine)) {
      title = firstLine;
      content = lines.slice(1).join('\n').trim();
    }
  }

  if (!title) {
    title = trimmedText.substring(0, Math.min(8, trimmedText.length)).replace(/[，。？！、；：\s]/g, '');
    if (title.length > 8) {
      title = title.substring(0, 8) + '...';
    }
    if (!title) {
      title = '无题';
    }
  }

  const imagery: ImageryItem[] = [];

  for (const item of IMAGERY_KEYWORDS) {
    let count = 0;
    for (const keyword of item.keywords) {
      const regex = new RegExp(keyword, 'g');
      const matches = trimmedText.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
    if (count > 0) {
      imagery.push({
        type: item.type,
        count: Math.min(count, 5),
      });
    }
  }

  if (imagery.length === 0) {
    imagery.push(
      { type: 'mountain', count: 2 },
      { type: 'tree', count: 1 },
    );
  }

  return {
    title,
    content: content || trimmedText,
    imagery,
  };
}

export function getImageryName(type: ImageryItem['type']): string {
  const names: Record<ImageryItem['type'], string> = {
    mountain: '山',
    water: '水',
    moon: '月',
    flower: '花',
    bird: '鸟',
    tree: '树',
    cloud: '云',
  };
  return names[type];
}
