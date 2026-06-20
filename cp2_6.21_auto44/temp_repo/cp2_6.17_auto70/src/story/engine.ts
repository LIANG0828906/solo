import { v4 as uuidv4 } from 'uuid';
import type { StoryNode, StoryChoice } from './types';

const storyTemplates = [
  {
    titles: ['迷雾森林', '幽暗古堡', '星际港口', '古代遗迹', '未来都市', '魔法学院'],
    descriptions: [
      '你踏入一片被晨雾笼罩的古老森林，空气中弥漫着松木和腐叶的气息。远处隐约传来鸟鸣声，但脚下的小径却分岔成两条截然不同的方向。',
      '沉重的橡木大门在你身后缓缓闭合，烛火在墙壁上投下摇曳的影子。楼梯盘旋向上通往未知的黑暗，而右侧走廊尽头却闪烁着微弱的蓝光。',
      ' neon lights flicker above the spaceport, reflecting off the rain-slicked pavement. A hooded figure gestures toward a back alley, while the boarding call for Alpha Centauri echoes through the speakers.',
      '沙尘在你脚边盘旋，古老的石柱上刻满了失传已久的符文。左边的通道似乎通向地下墓穴，而右边的石阶则向上延伸至一座倒塌的祭坛。',
      '悬浮列车从你头顶呼啸而过，全息广告在空气中闪烁。一个陌生人递来一张黑色名片，而街角的咖啡店橱窗里，有人正向你招手。',
      '魔法学院的钟楼敲响了午夜的钟声，星空在穹顶缓缓转动。禁书区的门缝里透出诡异的绿光，而炼金实验室方向则传来了爆炸声。',
    ],
    leftChoices: [
      '走向左边幽暗的小径',
      '攀登盘旋的楼梯',
      '跟随神秘人进入小巷',
      '进入地下墓穴',
      '接过黑色名片',
      '前往禁书区',
    ],
    rightChoices: [
      '沿着右边明亮的道路前进',
      '探索蓝光闪烁的走廊',
      '赶往登船口',
      '登上倒塌的祭坛',
      '走向咖啡店',
      '调查炼金实验室',
    ],
  },
];

const endings = [
  {
    title: '旅程的终点',
    description: '你做出了最终的选择，故事在此画上句点。但每一个终点，都是新故事的起点...',
  },
  {
    title: '迷雾中的真相',
    description: '当一切尘埃落定，你终于明白，真正的冒险不在于选择哪条路，而在于行走本身。',
  },
  {
    title: '永恒的回响',
    description: '你的选择将在时间的长河中激起涟漪，影响着无数尚未发生的故事。这就是命运的奇妙之处。',
  },
];

let nodeCache: Map<string, StoryNode> = new Map();

function createChoice(text: string, nextNodeId: string | null = null): StoryChoice {
  return {
    id: uuidv4(),
    text,
    nextNodeId,
  };
}

function generateEndingNode(): StoryNode {
  const ending = endings[Math.floor(Math.random() * endings.length)];
  return {
    id: uuidv4(),
    title: `✦ ${ending.title}`,
    description: ending.description,
    choices: [
      createChoice('🔄 重新开始冒险', null),
      createChoice('📖 查看故事脉络', null),
    ],
  };
}

function getOrCreateNode(nodeId: string): StoryNode {
  if (nodeCache.has(nodeId)) {
    return nodeCache.get(nodeId)!;
  }

  const template = storyTemplates[0];
  const titleIdx = Math.floor(Math.random() * template.titles.length);
  const descIdx = Math.floor(Math.random() * template.descriptions.length);
  const leftIdx = Math.floor(Math.random() * template.leftChoices.length);
  const rightIdx = Math.floor(Math.random() * template.rightChoices.length);

  const nextLeftId = uuidv4();
  const nextRightId = uuidv4();

  const node: StoryNode = {
    id: nodeId,
    title: `${template.titles[titleIdx]} · 第${nodeCache.size + 1}幕`,
    description: template.descriptions[descIdx],
    choices: [
      createChoice(template.leftChoices[leftIdx], nextLeftId),
      createChoice(template.rightChoices[rightIdx], nextRightId),
    ],
  };

  nodeCache.set(nodeId, node);
  return node;
}

export function getInitialNode(): StoryNode {
  nodeCache.clear();
  
  const initialNode: StoryNode = {
    id: 'start-001',
    title: '🌌 故事的开端',
    description: '你站在一个无限可能的起点。四周星光流转，时间在这里仿佛失去了意义。两条截然不同的道路在你面前展开，每一条都通向未知的命运。你的选择，将书写属于你自己的传奇。',
    choices: [
      createChoice('🔥 踏上冒险之路', uuidv4()),
      createChoice('🌊 探索神秘之境', uuidv4()),
    ],
  };

  nodeCache.set(initialNode.id, initialNode);
  return initialNode;
}

export function getNextNode(currentNodeId: string, choiceIndex: 0 | 1): StoryNode {
  const currentNode = getOrCreateNode(currentNodeId);
  const choice = currentNode.choices[choiceIndex];
  
  if (!choice.nextNodeId) {
    return generateEndingNode();
  }

  if (nodeCache.size >= 15) {
    return generateEndingNode();
  }

  return getOrCreateNode(choice.nextNodeId);
}

export function getNodeById(nodeId: string): StoryNode | null {
  return nodeCache.get(nodeId) || null;
}

export function clearStoryCache(): void {
  nodeCache.clear();
}
