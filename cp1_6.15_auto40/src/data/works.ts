export interface Work {
  id: string;
  title: string;
  image: string;
  thumbnail: string;
  description: string;
  date: string;
  tags: string[];
  heightRatio: number;
}

export const works: Work[] = [
  {
    id: '1',
    title: '晨雾山峦',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=75',
    description: '清晨的山谷被薄雾笼罩，阳光穿透云层洒落在连绵起伏的山峰上，呈现出一幅宁静而壮丽的自然画卷。这次拍摄历经三个小时的等待，只为捕捉这转瞬即逝的光影时刻。',
    date: '2024-03-15',
    tags: ['风景', '自然', '摄影'],
    heightRatio: 0.67,
  },
  {
    id: '2',
    title: '都市夜景',
    image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&q=75',
    description: '繁华都市的夜晚，霓虹闪烁，车水马龙。站在城市之巅，俯瞰这片灯火辉煌的土地，感受现代文明的脉搏与温度。',
    date: '2024-02-20',
    tags: ['城市', '夜景', '摄影'],
    heightRatio: 0.75,
  },
  {
    id: '3',
    title: '梦幻森林',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=75',
    description: '走进这片神秘的森林，仿佛踏入了童话世界。阳光透过层层叠叠的树叶，在地面上投下斑驳的光影，每一步都是新的发现。',
    date: '2024-01-10',
    tags: ['自然', '森林', '摄影'],
    heightRatio: 0.8,
  },
  {
    id: '4',
    title: '海边日落',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=75',
    description: '夕阳西下，金色的阳光洒在无垠的海面上，波光粼粼。海浪轻轻拍打着沙滩，带来远方的问候与宁静。',
    date: '2024-04-05',
    tags: ['海洋', '日落', '风景'],
    heightRatio: 0.56,
  },
  {
    id: '5',
    title: '花间蝴蝶',
    image: 'https://images.unsplash.com/photo-1518882605630-8eb15c00e331?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518882605630-8eb15c00e331?w=600&q=75',
    description: '花丛中翩翩起舞的蝴蝶，色彩斑斓，姿态优雅。微距镜头下的微观世界，展现着生命的美丽与脆弱。',
    date: '2024-05-12',
    tags: ['自然', '微距', '摄影'],
    heightRatio: 0.9,
  },
  {
    id: '6',
    title: '古镇风情',
    image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=600&q=75',
    description: '青石板路，白墙黛瓦，这座江南水乡的古镇保留着最淳朴的风貌。漫步其中，时光仿佛慢了下来。',
    date: '2024-03-28',
    tags: ['建筑', '人文', '风景'],
    heightRatio: 0.72,
  },
  {
    id: '7',
    title: '星空银河',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=75',
    description: '远离城市的喧嚣，在海拔四千米的高原上仰望星空。银河横跨天际，繁星点点，每一颗星都在诉说着宇宙的故事。',
    date: '2024-06-18',
    tags: ['星空', '夜景', '风景'],
    heightRatio: 0.6,
  },
  {
    id: '8',
    title: '秋日私语',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=75',
    description: '金色的秋天，树叶换上了盛装。阳光透过红叶，温暖而柔和。这是一年中最富有诗意的季节。',
    date: '2024-10-22',
    tags: ['秋天', '自然', '风景'],
    heightRatio: 0.85,
  },
  {
    id: '9',
    title: '水墨江南',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=75',
    description: '一幅写意的水墨画，远山如黛，近水含烟。江南的雨季，总是带着淡淡的诗意与忧愁。',
    date: '2024-07-14',
    tags: ['风景', '人文', '摄影'],
    heightRatio: 0.58,
  },
  {
    id: '10',
    title: '雪中秘境',
    image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=75',
    description: '白雪皑皑的世界，纯净而寂静。走进这片银色的秘境，聆听雪花飘落的声音，感受大自然的呼吸。',
    date: '2024-12-03',
    tags: ['冬天', '自然', '风景'],
    heightRatio: 0.78,
  },
  {
    id: '11',
    title: '花田春色',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&q=75',
    description: '漫山遍野的花海，姹紫嫣红，芬芳四溢。春天是最美的季节，万物复苏，生机盎然。',
    date: '2024-04-17',
    tags: ['春天', '自然', '花'],
    heightRatio: 0.65,
  },
  {
    id: '12',
    title: '咖啡时光',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=75',
    description: '一杯咖啡，一本书，一个慵懒的午后。生活中的小确幸，往往就藏在这些平凡的瞬间里。',
    date: '2024-08-09',
    tags: ['生活', '静物', '摄影'],
    heightRatio: 0.82,
  },
];

export const allTags = Array.from(new Set(works.flatMap((work) => work.tags))).sort();
