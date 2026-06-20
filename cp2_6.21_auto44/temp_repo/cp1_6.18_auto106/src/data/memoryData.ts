import { EmotionTag, MemoryNode, Link } from '../types';

export const EMOTION_COLORS: Record<EmotionTag, string> = {
  '欣喜': '#4ECDC4',
  '忧伤': '#6C5CE7',
  '愤怒': '#FD79A8',
  '平静': '#00CEC9',
  '惊讶': '#FDCB6E',
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const CONTENTS: string[] = [
  '在公园散步时看到樱花盛开',
  '和朋友一起吃了火锅',
  '加班到深夜独自回家',
  '收到了意外的生日礼物',
  '在雨中奔跑感到自由',
  '读了一本让人沉思的书',
  '和家人视频通话聊了很久',
  '第一次尝试做蛋糕',
  '在咖啡馆里度过了安静的下午',
  '看了一部让人泪流满面的电影',
  '早上跑步时看到了日出',
  '被同事误解感到委屈',
  '在音乐会上听到了最爱的曲子',
  '独自旅行到了一个小镇',
  '收到了一封来自老朋友的信',
  '在超市偶遇了多年不见的同学',
  '学会了一道新的菜',
  '深夜听着雨声无法入睡',
  '完成了坚持很久的项目',
  '在海边看到了满天星星',
  '被突然的雷声吓了一跳',
  '在花园里种下了第一棵植物',
  '和伴侣吵了一架',
  '在图书馆找到了一本绝版书',
  '清晨被鸟鸣声唤醒',
  '参加了一场热闹的庙会',
  '在山顶看到了壮丽的云海',
  '听到一首歌想起了过去的时光',
  '在路边捡到一片漂亮的枫叶',
  '和孩子们一起堆了雪人',
];

const DESCRIPTIONS: string[] = [
  '春天的气息扑面而来，粉色花瓣随风飘落',
  '热气腾腾的锅底，欢声笑语不断',
  '空旷的街道只有自己的脚步声',
  '拆开包装的那一刻心跳加速',
  '雨水打在脸上，却感到前所未有的畅快',
  '每一页都像是在和另一个自己对话',
  '屏幕那头的笑脸让距离不再遥远',
  '虽然形状不太完美，但味道出乎意料的好',
  '咖啡的香气和书页的触感交织在一起',
  '故事里的每个人物都像是在诉说自己',
  '金色的阳光穿透薄雾，照亮了前方的路',
  '解释了很多遍却还是不被理解',
  '旋律响起的那一刻全身都在颤抖',
  '石板路上的青苔和老旧的木门别有韵味',
  '熟悉的字迹让时光仿佛倒流',
  '差点没认出来，但那笑容一点没变',
  '按照食谱一步一步来，结果还不错',
  '雨滴敲打窗棂，思绪飘向了远方',
  '看到成果的那一刻所有的辛苦都值得了',
  '浩瀚的星空让人感到自己的渺小与幸运',
  '窗外的闪电照亮了整个房间',
  '泥土的气息让人感到踏实和希望',
  '话到嘴边却越说越激动',
  '泛黄的书页散发着旧时光的味道',
  '窗外叽叽喳喳的声响却让人心安',
  '人山人海中感受着烟火气息',
  '云在脚下翻涌，仿佛置身仙境',
  '那些旋律里藏着再也回不去的时光',
  '秋天的颜色都浓缩在这一片叶子里',
  '红红的鼻子和歪歪的帽子让所有人都笑了',
];

const EMOTIONS: EmotionTag[] = ['欣喜', '忧伤', '愤怒', '平静', '惊讶'];

export function generateSimulatedData(): { nodes: MemoryNode[]; links: Link[] } {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const nodes: MemoryNode[] = [];

  for (let i = 0; i < 30; i++) {
    const emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 150;
    nodes.push({
      id: generateId(),
      content: CONTENTS[i],
      description: DESCRIPTIONS[i],
      timestamp: now - Math.floor(Math.random() * thirtyDays),
      emotion,
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      color: EMOTION_COLORS[emotion],
      intensity: 0.5 + Math.random() * 0.7,
    });
  }

  const links: Link[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const sameEmotion = a.emotion === b.emotion;
      let probability = sameEmotion ? 0.8 : 0.1;
      const timeDiff = Math.abs(a.timestamp - b.timestamp);
      if (timeDiff < 5 * 60 * 1000) {
        probability = Math.min(probability + 0.5, 1);
      }
      if (Math.random() < probability) {
        const linkColor = averageHexColor(a.color, b.color);
        const emotionalSimilarity = sameEmotion ? 1 : 0;
        const opacity = 0.3 + emotionalSimilarity * 0.3 + Math.random() * 0.1;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const maxDistance = 300;
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const width = 1 + (1 - normalizedDistance) * 2;
        links.push({
          id: generateId(),
          source: a.id,
          target: b.id,
          color: linkColor,
          opacity: Math.min(opacity, 0.6),
          width: Math.max(1, Math.min(3, width)),
        });
      }
    }
  }

  return { nodes, links };
}

function averageHexColor(hex1: string, hex2: string): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

const NODES_KEY = 'memory_graph_nodes';
const LINKS_KEY = 'memory_graph_links';

export function saveNodes(nodes: MemoryNode[]): void {
  localStorage.setItem(NODES_KEY, JSON.stringify(nodes));
}

export function loadNodes(): MemoryNode[] | null {
  const raw = localStorage.getItem(NODES_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveLinks(links: Link[]): void {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

export function loadLinks(): Link[] | null {
  const raw = localStorage.getItem(LINKS_KEY);
  return raw ? JSON.parse(raw) : null;
}
