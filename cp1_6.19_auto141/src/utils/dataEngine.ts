import type { Artwork, InspirationFragment, GraphNode, GraphEdge, FragmentType } from './types';
import { FRAGMENT_COLORS, NODE_COLORS } from './types';

const ARTWORKS: Artwork[] = [
  {
    id: 'art-001',
    title: '晨雾中的港口',
    artist: '林墨',
    thumbnail: 'linear-gradient(135deg, #74B9FF 0%, #A29BFE 100%)',
    coverColor: '#74B9FF',
    sketchElements: {
      theme: ['孤独感', '城市记忆', '时间流逝'],
      colors: ['灰蓝', '米白', '赭石'],
      emotions: ['静谧', '沉思', '淡淡的忧伤'],
      inspiration: ['清晨的海雾', '旧码头的缆绳', '远处的汽笛声'],
    },
  },
  {
    id: 'art-002',
    title: '电子森林',
    artist: '张霓虹',
    thumbnail: 'linear-gradient(135deg, #00B894 0%, #55EFC4 100%)',
    coverColor: '#00B894',
    sketchElements: {
      theme: ['科技与自然', '未来主义', '赛博朋克'],
      colors: ['荧光绿', '深紫', '金属银'],
      emotions: ['兴奋', '神秘', '超现实'],
      inspiration: ['深夜的电路板', '热带雨林的藤蔓', 'AI生成的梦境'],
    },
  },
  {
    id: 'art-003',
    title: '母亲的厨房',
    artist: '王乡谣',
    thumbnail: 'linear-gradient(135deg, #FDCB6E 0%, #E17055 100%)',
    coverColor: '#FDCB6E',
    sketchElements: {
      theme: ['家庭温暖', '童年记忆', '女性力量'],
      colors: ['暖黄', '橘红', '棕褐'],
      emotions: ['温馨', '怀念', '踏实'],
      inspiration: ['傍晚的炊烟', '青花瓷碗', '揉面的手掌'],
    },
  },
  {
    id: 'art-004',
    title: '失重的诗',
    artist: '陈纸鸢',
    thumbnail: 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)',
    coverColor: '#6C5CE7',
    sketchElements: {
      theme: ['自由', '逃离现实', '诗意'],
      colors: ['薰衣草紫', '樱花粉', '月光白'],
      emotions: ['轻盈', '梦幻', '解脱'],
      inspiration: ['蒲公英的种子', '宇航员的自拍', '被风吹起的信纸'],
    },
  },
  {
    id: 'art-005',
    title: '地下铁的风',
    artist: '赵锈',
    thumbnail: 'linear-gradient(135deg, #2D3436 0%, #636E72 100%)',
    coverColor: '#636E72',
    sketchElements: {
      theme: ['都市疏离', '通勤日常', '陌生人'],
      colors: ['炭灰', '霓虹橙', '深靛蓝'],
      emotions: ['麻木', '期待', '孤独中的共鸣'],
      inspiration: ['隧道里的灯光', '耳机里的音乐', '擦肩而过的香水味'],
    },
  },
  {
    id: 'art-006',
    title: '山海经变奏',
    artist: '柳白泽',
    thumbnail: 'linear-gradient(135deg, #E17055 0%, #D63031 100%)',
    coverColor: '#E17055',
    sketchElements: {
      theme: ['神话重述', '东方奇幻', '万物有灵'],
      colors: ['朱砂红', '翡翠绿', '鎏金'],
      emotions: ['敬畏', '神秘', '远古的召唤'],
      inspiration: ['《山海经》插画', '青铜器纹饰', '巫师的面具'],
    },
  },
  {
    id: 'art-007',
    title: '便利店的凌晨三点',
    artist: '周宵夜',
    thumbnail: 'linear-gradient(135deg, #74B9FF 0%, #0984E3 100%)',
    coverColor: '#74B9FF',
    sketchElements: {
      theme: ['都市夜归人', '孤独的治愈', '现代生活'],
      colors: ['冷白光', '关东煮汤雾', '玻璃反光'],
      emotions: ['疲惫', '慰藉', '人间烟火'],
      inspiration: ['微波炉的叮声', '热咖啡的蒸汽', '货架上的饭团'],
    },
  },
  {
    id: 'art-008',
    title: '奶奶的剪纸',
    artist: '孙窗花',
    thumbnail: 'linear-gradient(135deg, #D63031 0%, #E84393 100%)',
    coverColor: '#D63031',
    sketchElements: {
      theme: ['非遗传承', '祖孙情', '民间艺术'],
      colors: ['中国红', '金色', '米纸白'],
      emotions: ['温暖', '传承', '时光的厚重'],
      inspiration: ['剪刀的咔嚓声', '红宣纸的触感', '窗棂上的光影'],
    },
  },
  {
    id: 'art-009',
    title: '赛博西湖',
    artist: '钱杭儿',
    thumbnail: 'linear-gradient(135deg, #00CEC9 0%, #81ECEC 100%)',
    coverColor: '#00CEC9',
    sketchElements: {
      theme: ['传统与未来', '地方记忆', '时空折叠'],
      colors: ['湖水青', '霓虹粉', '投影紫'],
      emotions: ['荒诞', '熟悉', '时空交错感'],
      inspiration: ['断桥的AR投影', '雷峰塔的二维码', '三潭印月的全息影像'],
    },
  },
  {
    id: 'art-010',
    title: '废品站的星空',
    artist: '李拾荒',
    thumbnail: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
    coverColor: '#34495E',
    sketchElements: {
      theme: ['废弃物美学', '环保意识', '平凡中的诗意'],
      colors: ['铁锈棕', '机油黑', '碎玻璃彩虹'],
      emotions: ['沉重', '希望', '荒诞的浪漫'],
      inspiration: ['易拉罐的反光', '旧电路板的焊点', '塑料瓶里的萤火虫'],
    },
  },
];

const frozenArtworks = Object.freeze(ARTWORKS.map(aw => Object.freeze({
  ...aw,
  sketchElements: Object.freeze({
    theme: Object.freeze([...aw.sketchElements.theme]),
    colors: Object.freeze([...aw.sketchElements.colors]),
    emotions: Object.freeze([...aw.sketchElements.emotions]),
    inspiration: Object.freeze([...aw.sketchElements.inspiration]),
  }),
})));

export function randomPick(): Artwork {
  const index = Math.floor(Math.random() * frozenArtworks.length);
  return frozenArtworks[index];
}

function sample<T>(arr: readonly T[], count: number): T[] {
  const result: T[] = [];
  const used = new Set<number>();
  while (result.length < count && used.size < arr.length) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(arr[idx]);
    }
  }
  return result;
}

export function parseFragments(artwork: Artwork): InspirationFragment[] {
  const fragments: InspirationFragment[] = [];

  const inspirationItem = sample(artwork.sketchElements.inspiration, 1)[0];
  fragments.push({
    id: `frag-${Date.now()}-1`,
    type: 'inspiration',
    content: `灵感源：${inspirationItem}`,
    color: FRAGMENT_COLORS.inspiration,
  });

  const emotionItem = sample(artwork.sketchElements.emotions, 1)[0];
  fragments.push({
    id: `frag-${Date.now()}-2`,
    type: 'emotion',
    content: `情绪标签：${emotionItem}`,
    color: FRAGMENT_COLORS.emotion,
  });

  const themeItem = sample(artwork.sketchElements.theme, 1)[0];
  fragments.push({
    id: `frag-${Date.now()}-3`,
    type: 'theme',
    content: `关联主题：${themeItem}`,
    color: FRAGMENT_COLORS.theme,
  });

  return fragments;
}

export function extractNodes(
  fragments: InspirationFragment[],
  canvasWidth: number,
  canvasHeight: number
): Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy' | 'isDragging'>[] {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  return fragments.map((frag, idx) => {
    const angle = (idx / fragments.length) * Math.PI * 2;
    const radius = 60 + Math.random() * 40;

    return {
      id: `node-${Date.now()}-${idx}`,
      name: frag.content.replace(/^[^：]+：/, ''),
      type: frag.type,
      relevance: 50 + Math.random() * 50,
      color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
      isNew: true,
      createdAt: Date.now(),
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      isDragging: false,
    };
  });
}

export function calculateSimilarity(node1: GraphNode, node2: GraphNode): number {
  const name1 = node1.name.toLowerCase();
  const name2 = node2.name.toLowerCase();

  let matches = 0;
  for (const char of name1) {
    if (name2.includes(char)) matches++;
  }

  const baseSimilarity = matches / Math.max(name1.length, name2.length);
  const typeBonus = node1.type === node2.type ? 0.2 : 0;

  return Math.min(100, Math.round((baseSimilarity + typeBonus) * 100));
}

export function generateEdges(
  newNodes: GraphNode[],
  existingNodes: GraphNode[]
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const allNodes = [...existingNodes, ...newNodes];

  for (let i = 0; i < newNodes.length; i++) {
    const connections = 1 + Math.floor(Math.random() * 2);
    const connected = new Set<string>();

    for (let c = 0; c < connections; c++) {
      const candidates = allNodes.filter(
        n => n.id !== newNodes[i].id && !connected.has(n.id)
      );
      if (candidates.length === 0) break;

      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const similarity = calculateSimilarity(newNodes[i], target);

      if (similarity >= 15) {
        edges.push({
          id: `edge-${Date.now()}-${i}-${c}`,
          source: newNodes[i].id,
          target: target.id,
          similarity,
        });
        connected.add(target.id);
      }
    }
  }

  return edges;
}

export function getArtworkById(id: string): Artwork | undefined {
  return frozenArtworks.find(aw => aw.id === id);
}

export function getAllArtworks(): readonly Artwork[] {
  return frozenArtworks;
}
