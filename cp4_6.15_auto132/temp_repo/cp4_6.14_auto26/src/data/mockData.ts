export interface Exhibition {
  id: string;
  name: string;
  theme: string;
  coverUrl: string;
  createdAt: number;
  artworkIds: string[];
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  imageUrl: string;
  exhibitionId: string;
}

export interface Comment {
  id: string;
  artworkId: string;
  username: string;
  content: string;
  createdAt: number;
}

export type SortKey = 'createdAt' | 'name';

export interface FilterOptions {
  themeKeyword: string;
  sortBy: SortKey;
}

export const initialExhibitions: Exhibition[] = [
  {
    id: 'exh-001',
    name: '当代抽象艺术展',
    theme: '探索21世纪抽象艺术的边界与可能性，呈现色彩、线条与空间的对话',
    coverUrl: 'https://picsum.photos/seed/abstract-gallery/800/500',
    createdAt: Date.now() - 86400000 * 30,
    artworkIds: ['art-001', 'art-002', 'art-003', 'art-004', 'art-005', 'art-006', 'art-007', 'art-008'],
  },
  {
    id: 'exh-002',
    name: '数字水墨之境',
    theme: '传统水墨技法与数字媒介的融合，东方美学的当代表达',
    coverUrl: 'https://picsum.photos/seed/ink-gallery/800/500',
    createdAt: Date.now() - 86400000 * 15,
    artworkIds: ['art-009', 'art-010', 'art-011', 'art-012', 'art-013', 'art-014', 'art-015', 'art-016', 'art-017'],
  },
  {
    id: 'exh-003',
    name: '赛博朋克纪元',
    theme: '未来都市、霓虹光影与人类存在的哲思，赛博文化的视觉盛宴',
    coverUrl: 'https://picsum.photos/seed/cyber-gallery/800/500',
    createdAt: Date.now() - 86400000 * 5,
    artworkIds: ['art-018', 'art-019', 'art-020', 'art-021', 'art-022', 'art-023', 'art-024', 'art-025', 'art-026', 'art-027'],
  },
];

export const initialArtworks: Artwork[] = [
  { id: 'art-001', title: '色彩的呼吸', artist: '林远', description: '以流动的色块表现自然的韵律，冷暖色调在画面中形成对话，如同大地与天空的呼吸。', imageUrl: 'https://picsum.photos/seed/art001/600/800', exhibitionId: 'exh-001' },
  { id: 'art-002', title: '几何冥想', artist: 'Sarah Chen', description: '纯粹的几何形体构成的空间，引导观者进入内心的宁静之地。', imageUrl: 'https://picsum.photos/seed/art002/600/800', exhibitionId: 'exh-001' },
  { id: 'art-003', title: '无题#7', artist: '张明辉', description: '不定义即是最好的定义，让观者在抽象中找到自己的故事。', imageUrl: 'https://picsum.photos/seed/art003/600/800', exhibitionId: 'exh-001' },
  { id: 'art-004', title: '色彩狂想', artist: 'Elena Rossi', description: '释放色彩的原始力量，打破构图的枷锁，让情感自由流淌。', imageUrl: 'https://picsum.photos/seed/art004/600/800', exhibitionId: 'exh-001' },
  { id: 'art-005', title: '静谧的律动', artist: '王思远', description: '在看似静止的画面中，隐藏着微妙的节奏与张力。', imageUrl: 'https://picsum.photos/seed/art005/600/800', exhibitionId: 'exh-001' },
  { id: 'art-006', title: '宇宙碎片', artist: 'Marcus Lee', description: '将宇宙爆炸的瞬间凝固，碎片中蕴含着无限的可能。', imageUrl: 'https://picsum.photos/seed/art006/600/800', exhibitionId: 'exh-001' },
  { id: 'art-007', title: '蓝调', artist: '李云', description: '蓝色的千变万化，从深邃到透明，诉说着无尽的思绪。', imageUrl: 'https://picsum.photos/seed/art007/600/800', exhibitionId: 'exh-001' },
  { id: 'art-008', title: '线的冒险', artist: 'Yuki Tanaka', description: '一根线的旅程，穿越空间与时间，最终回归起点。', imageUrl: 'https://picsum.photos/seed/art008/600/800', exhibitionId: 'exh-001' },

  { id: 'art-009', title: '烟雨江南', artist: '苏慕白', description: '以数字笔触再现江南水乡的朦胧诗意，烟雨迷蒙中的粉墙黛瓦。', imageUrl: 'https://picsum.photos/seed/art009/600/800', exhibitionId: 'exh-002' },
  { id: 'art-010', title: '墨梅', artist: '陈墨轩', description: '数点梅花天地心，以极简的墨色呈现梅花的傲骨与清雅。', imageUrl: 'https://picsum.photos/seed/art010/600/800', exhibitionId: 'exh-002' },
  { id: 'art-011', title: '山水印象', artist: '王清远', description: '千山万水浓缩于方寸之间，虚实相生，意境深远。', imageUrl: 'https://picsum.photos/seed/art011/600/800', exhibitionId: 'exh-002' },
  { id: 'art-012', title: '竹林清风', artist: '林清韵', description: '翠竹摇曳，清风徐来，竹林深处有人家。', imageUrl: 'https://picsum.photos/seed/art012/600/800', exhibitionId: 'exh-002' },
  { id: 'art-013', title: '留白', artist: 'Zhao Yi', description: '画到生时是熟时，留白处自有万千气象。', imageUrl: 'https://picsum.photos/seed/art013/600/800', exhibitionId: 'exh-002' },
  { id: 'art-014', title: '秋山夕照', artist: '吴道子之影', description: '夕阳西下，山峦披上金色的霞光，一片宁静祥和。', imageUrl: 'https://picsum.photos/seed/art014/600/800', exhibitionId: 'exh-002' },
  { id: 'art-015', title: '孤舟蓑笠', artist: '郑板桥笔意', description: '孤舟蓑笠翁，独钓寒江雪。以极简笔墨描绘悠远意境。', imageUrl: 'https://picsum.photos/seed/art015/600/800', exhibitionId: 'exh-002' },
  { id: 'art-016', title: '荷韵', artist: '周莲心', description: '出淤泥而不染，濯清涟而不妖，荷花的高洁之姿。', imageUrl: 'https://picsum.photos/seed/art016/600/800', exhibitionId: 'exh-002' },
  { id: 'art-017', title: '云山雾绕', artist: '黄山客', description: '云海翻腾，群山若隐若现，如同仙境一般。', imageUrl: 'https://picsum.photos/seed/art017/600/800', exhibitionId: 'exh-002' },

  { id: 'art-018', title: '霓虹夜市', artist: 'Neon Wang', description: '繁华都市的深夜景象，霓虹闪烁，人潮涌动。', imageUrl: 'https://picsum.photos/seed/art018/600/800', exhibitionId: 'exh-003' },
  { id: 'art-019', title: '机械心脏', artist: 'Cyborg Zero', description: '当人类拥有机械之心，生命的定义是否改变？', imageUrl: 'https://picsum.photos/seed/art019/600/800', exhibitionId: 'exh-003' },
  { id: 'art-020', title: '赛博唐人街', artist: '未来记忆', description: '东方传统与未来科技的碰撞，赛博世界里的中华文化。', imageUrl: 'https://picsum.photos/seed/art020/600/800', exhibitionId: 'exh-003' },
  { id: 'art-021', title: '全息广告', artist: 'Hologram X', description: '未来城市的信息洪流，全息投影充斥每一寸空间。', imageUrl: 'https://picsum.photos/seed/art021/600/800', exhibitionId: 'exh-003' },
  { id: 'art-022', title: '雨夜飞车', artist: 'Rain Runner', description: '暴雨中的极速狂飙，赛博朋克世界的生存法则。', imageUrl: 'https://picsum.photos/seed/art022/600/800', exhibitionId: 'exh-003' },
  { id: 'art-023', title: '地下数据中心', artist: 'Data Miner', description: '信息时代的黑暗角落，数据就是新的黄金。', imageUrl: 'https://picsum.photos/seed/art023/600/800', exhibitionId: 'exh-003' },
  { id: 'art-024', title: '义体改造', artist: 'Chrome Soul', description: '人类与机器的界限逐渐模糊，灵魂是否还属于自己？', imageUrl: 'https://picsum.photos/seed/art024/600/800', exhibitionId: 'exh-003' },
  { id: 'art-025', title: '龙之城', artist: 'Neon Dragon', description: '东方巨龙在赛博都市中苏醒，古老传说焕发新生。', imageUrl: 'https://picsum.photos/seed/art025/600/800', exhibitionId: 'exh-003' },
  { id: 'art-026', title: '虚拟偶像', artist: 'V-Idol', description: 'AI生成的完美偶像，虚拟与现实的边界何在？', imageUrl: 'https://picsum.photos/seed/art026/600/800', exhibitionId: 'exh-003' },
  { id: 'art-027', title: '末日余晖', artist: 'Last Light', description: '文明崩塌后的世界，最后的人类在废墟中寻找希望。', imageUrl: 'https://picsum.photos/seed/art027/600/800', exhibitionId: 'exh-003' },
];

export const initialComments: Comment[] = [
  { id: 'c001', artworkId: 'art-001', username: '艺术爱好者', content: '色彩的运用令人印象深刻，仿佛能感受到画面的呼吸感。', createdAt: Date.now() - 3600000 * 48 },
  { id: 'c002', artworkId: 'art-001', username: 'Curator Lin', content: '林远老师的作品总是能引发深思，期待更多佳作！', createdAt: Date.now() - 3600000 * 24 },
  { id: 'c003', artworkId: 'art-002', username: '抽象派粉丝', content: '几何的秩序感给人一种安定的力量。', createdAt: Date.now() - 3600000 * 12 },
  { id: 'c004', artworkId: 'art-003', username: '无名评论者', content: '留白的处理恰到好处，让我想到了很多往事。', createdAt: Date.now() - 3600000 * 6 },
  { id: 'c005', artworkId: 'art-009', username: '东方美学', content: '烟雨朦胧的意境太美了，仿佛置身于江南水乡。', createdAt: Date.now() - 3600000 * 36 },
  { id: 'c006', artworkId: 'art-010', username: '墨香', content: '几笔勾勒，神韵尽显，这才是真正的水墨大师！', createdAt: Date.now() - 3600000 * 20 },
  { id: 'c007', artworkId: 'art-018', username: '赛博迷', content: '霓虹灯光的渲染太赞了，赛博朋克味儿十足！', createdAt: Date.now() - 3600000 * 10 },
  { id: 'c008', artworkId: 'art-019', username: '科技控', content: '机械心脏的细节处理非常震撼，发人深省。', createdAt: Date.now() - 3600000 * 8 },
  { id: 'c009', artworkId: 'art-020', username: '未来旅人', content: '赛博唐人街的设定太有想象力了，东西方完美融合！', createdAt: Date.now() - 3600000 * 3 },
];

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const MAX_EXHIBITION_NAME = 20;
export const MAX_THEME_LENGTH = 200;
export const MAX_ARTWORK_TITLE = 30;
export const MAX_COMMENT_LENGTH = 100;
export const MAX_ARTWORKS_PER_EXHIBITION = 12;
