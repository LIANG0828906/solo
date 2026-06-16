import type { Work } from '@/types';

function generateGradientImage(color1: string, color2: string, label: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)" />
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Inter, sans-serif" font-size="24" font-weight="600" opacity="0.9">${label}</text>
      <circle cx="80" cy="80" r="40" fill="white" opacity="0.1" />
      <circle cx="320" cy="300" r="60" fill="white" opacity="0.08" />
      <path d="M50 350 Q 100 300 150 350 T 250 350" stroke="white" stroke-width="2" fill="none" opacity="0.2" />
    </svg>
  `;
  const encoded = unescape(encodeURIComponent(svg));
  return `data:image/svg+xml;base64,${btoa(encoded)}`;
}

export function generateSampleWorks(): Work[] {
  const now = Date.now();
  
  const samples: Omit<Work, 'id' | 'createdAt'>[] = [
    {
      title: '晨曦微光',
      cover: generateGradientImage('#FF8C00', '#FF6B6B', '晨曦'),
      tags: ['宁静', '温馨', '梦幻'],
      story: '这幅作品创作于一个清晨，我站在山顶看着太阳缓缓升起。金色的阳光穿透薄雾，洒在连绵的山脉上。那一刻，世界是如此宁静而美好。',
    },
    {
      title: '深海幽蓝',
      cover: generateGradientImage('#4682B4', '#2D2D44', '深海'),
      tags: ['冷峻', '深邃', '神秘'],
      story: '灵感来自于一次深海潜水经历。在无尽的蓝色中，时间仿佛静止了。只有气泡的声音和自己的心跳，提醒着我生命的存在。',
    },
    {
      title: '紫色梦境',
      cover: generateGradientImage('#9370DB', '#FF6B6B', '梦境'),
      tags: ['神秘', '梦幻', '浪漫'],
      story: '这是一幅关于梦的作品。在梦中，所有的色彩都变得更加浓烈，所有的形状都更加柔软。紫色是梦的主色调，它连接着现实与幻想。',
    },
    {
      title: '秋日暖阳',
      cover: generateGradientImage('#FF8C00', '#FFD700', '秋日'),
      tags: ['温馨', '欢快', '热情'],
      story: '秋天的阳光有一种特殊的质感，它不像夏天那样炽热，却更加温柔。金黄的叶子在阳光下闪闪发光，像大自然的最后一场狂欢。',
    },
    {
      title: '孤独旅人',
      cover: generateGradientImage('#2D2D44', '#4682B4', '旅人'),
      tags: ['孤独', '忧郁', '冷峻'],
      story: '每个人都是生命中的旅人。有时候我们会感到孤独，但正是这种孤独让我们更加深刻地思考存在的意义。',
    },
    {
      title: '迷幻森林',
      cover: generateGradientImage('#9370DB', '#4682B4', '森林'),
      tags: ['神秘', '迷幻', '奇幻'],
      story: '传说中的森林，每一棵树都有灵魂。当月光洒下，森林会唱起古老的歌谣。只有最纯净的心灵才能听到它的旋律。',
    },
    {
      title: '炽热之心',
      cover: generateGradientImage('#FF6B6B', '#FF8C00', '炽热'),
      tags: ['炽热', '热情', '浪漫'],
      story: '爱情是一团火焰，它可以温暖你，也可以灼伤你。但无论如何，它都是生命中最炽烈的色彩，值得我们勇敢地去追寻。',
    },
    {
      title: '静谧湖面',
      cover: generateGradientImage('#4682B4', '#9370DB', '静谧'),
      tags: ['宁静', '沉静', '空灵'],
      story: '清晨的湖面像一面镜子，倒映着天空和山峦。时间在这里变得缓慢，每一次呼吸都像是与自然的对话。',
    },
  ];

  return samples.map((sample, index) => ({
    ...sample,
    id: `sample-${index}`,
    createdAt: now - (samples.length - index) * 86400000,
  }));
}
