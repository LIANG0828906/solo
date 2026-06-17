import { v4 as uuidv4 } from 'uuid';
import { StoryNode, StoryChoice, ChoiceDirection } from './types';

const sceneThemes = [
  {
    keywords: ['森林', '树', '木'],
    titles: ['迷雾森林深处', '古老的橡树之心', '精灵树屋', '幽暗密林', '月光林地'],
    descTemplates: [
      ['参天巨树遮蔽了天空，只有零星的光斑透过茂密的树冠洒落。', '空气中弥漫着湿润泥土和松针的清香，脚下是厚厚的落叶。', '远处传来不知名生物的低吟，仿佛森林本身正在呼吸。'],
      ['藤蔓如同巨蛇缠绕着古树，树干上布满了发着微光的苔藓。', '你听到了潺潺的流水声，但看不到溪流的源头。', '有什么东西在树冠间快速移动，带起一阵风吹过你的后颈。'],
    ],
  },
  {
    keywords: ['洞穴', '矿', '山'],
    titles: ['水晶洞穴', '熔岩通道', '地下湖', '古代矿坑', '回音深渊'],
    descTemplates: [
      ['洞壁上的水晶折射出七彩光芒，将整个洞穴映照得如梦似幻。', '空气中弥漫着矿物的味道，脚下的地面温热而潮湿。', '水滴落下的声音在空旷中回荡，仿佛远古的低语。'],
      ['温度越来越高，远处的通道透出暗红色的光芒。', '岩壁上有古老的刻痕，似乎记载着某个失落文明的历史。', '你注意到地面上有新鲜的脚印，这说明有人——或者什么东西——刚刚经过这里。'],
    ],
  },
  {
    keywords: ['水', '湖', '海', '河'],
    titles: ['月光湖畔', '迷雾海港', '沉没神殿', '水晶瀑布', '潮汐洞窟'],
    descTemplates: [
      ['湖面如镜，倒映着不属于这个世界的星辰。', '水面上漂浮着古老的灯笼，发出柔和的蓝色光芒。', '你听到水下传来悠扬的歌声，似乎在邀请你靠近。'],
      ['浪花拍打着布满贝壳的沙滩，海风带着咸腥的气息。', '远处的雾中有一艘幽灵船若隐若现，船帆上绣着诡异的符文。', '脚下的沙子似乎在微微移动，有什么东西在沙下朝着你的方向蠕动。'],
    ],
  },
  {
    keywords: ['塔', '楼', '建筑', '殿'],
    titles: ['法师之塔', '遗忘的神殿', '废弃古堡', '螺旋塔楼', '悬空宫殿'],
    descTemplates: [
      ['石阶向上延伸，消失在旋转的魔法光芒中。', '墙上的壁画描绘着诸神之战，随着你的走近，画中的人物似乎在微微移动。', '空气中漂浮着尘埃和古老魔法的气息，每一步都让你感觉时间在变慢。'],
      ['巨大的穹顶描绘着星图，而星星的位置似乎与你记忆中的完全不同。', '大厅中央有一座熄灭的祭坛，祭坛周围刻满了警告的铭文。', '你感觉到有强大的存在正在沉睡，任何一点声响都可能将它惊醒。'],
    ],
  },
  {
    keywords: ['时间', '梦', '虚空', '裂隙'],
    titles: ['时间裂隙', '梦境边界', '虚空回廊', '永恒之境', '破碎维度'],
    descTemplates: [
      ['现实如同破碎的镜子般层层叠叠，你能同时看到过去、现在和未来的倒影。', '时间在这里失去了意义，上一秒和下一秒仿佛同时存在。', '你的影子开始自行移动，它似乎有了自己的意志。'],
      ['所有的色彩都在慢慢褪去，世界变成了黑白的素描。', '你听到自己的声音从远处传来，说着你从未说过的话。', '脚下的地面开始透明，你能看到无穷无尽的空间在下方延伸。'],
    ],
  },
];

const defaultTitles = [
  '未知之地', '神秘转角', '命运岔路', '遗忘之境', '古老遗迹',
  '寂静荒原', '迷雾深处', '星辰之下', '黄昏之岸', '黎明前夕',
];

const defaultDescs = [
  ['你来到了一个从未见过的地方，空气中充满了未知的气息。', '周围的一切都显得陌生而神秘，你的心跳不由得加速。', '直觉告诉你，这里将发生改变你命运的事情。'],
  ['脚下的土地散发出古老的气息，仿佛千年的岁月在此沉淀。', '你注意到远处有微弱的光芒在闪烁，似乎在指引着方向。', '一阵微风吹过，带来了远方的低语——你不确定那是不是幻觉。'],
];

const leftChoiceTemplates = [
  { prefix: ['探索', '深入', '前往', '走向', '踏入'], suffix: ['未知', '深处', '前方', '光亮', '遗迹'] },
  { prefix: ['相信', '接受', '回应', '倾听', '拥抱'], suffix: ['直觉', '召唤', '声音', '黑暗', '改变'] },
  { prefix: ['点燃', '举起', '拔出', '打开', '激活'], suffix: ['火把', '武器', '机关', '封印', '符文'] },
];

const rightChoiceTemplates = [
  { prefix: ['绕行', '后退', '躲避', '隐藏', '离开'], suffix: ['危险', '原地', '阴影', '声响', '此处'] },
  { prefix: ['观察', '等待', '思考', '戒备', '分析'], suffix: ['片刻', '形势', '环境', '动静', '细节'] },
  { prefix: ['寻找', '检查', '摸索', '追踪', '回忆'], suffix: ['线索', '退路', '出路', '痕迹', '路径'] },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function matchTheme(prevTitle: string, prevChoice: string): typeof sceneThemes[0] | null {
  const combined = (prevTitle + prevChoice).toLowerCase();
  for (const theme of sceneThemes) {
    for (const kw of theme.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        return theme;
      }
    }
  }
  return null;
}

function generateChoiceText(templates: typeof leftChoiceTemplates): string {
  const t = pickRandom(templates);
  const p = pickRandom(t.prefix);
  const s = pickRandom(t.suffix);
  return `${p}${s}`;
}

function generateDescriptionFromContext(
  prevTitle: string | null,
  prevChoiceText: string | null,
  direction: ChoiceDirection | null
): string {
  let theme: typeof sceneThemes[0] | null = null;
  let descGroup: string[];

  if (prevTitle && prevChoiceText) {
    theme = matchTheme(prevTitle, prevChoiceText);
  }

  if (theme) {
    descGroup = pickRandom(theme.descTemplates);
  } else {
    descGroup = pickRandom(defaultDescs);
  }

  if (prevChoiceText && direction) {
    const directionIntro = direction === 'left'
      ? `你选择了「${prevChoiceText}」，脚步坚定地向前迈去。`
      : `你决定「${prevChoiceText}」，谨慎地观察着周围的环境。`;
    return directionIntro + ' ' + descGroup.join(' ');
  }

  return descGroup.join(' ');
}

function generateTitleFromContext(
  prevTitle: string | null,
  prevChoiceText: string | null
): string {
  if (prevTitle && prevChoiceText) {
    const theme = matchTheme(prevTitle, prevChoiceText);
    if (theme) {
      return pickRandom(theme.titles);
    }
  }
  return pickRandom(defaultTitles);
}

export interface GenerationContext {
  prevNode: StoryNode | null;
  choiceDirection: ChoiceDirection | null;
  choiceText: string | null;
}

export function generateStoryNode(context: GenerationContext, nodeId?: string): StoryNode {
  const { prevNode, choiceDirection, choiceText } = context;
  const prevTitle = prevNode?.title ?? null;

  const title = generateTitleFromContext(prevTitle, choiceText);
  const description = generateDescriptionFromContext(prevTitle, choiceText, choiceDirection);

  const leftChoiceId = uuidv4();
  const rightChoiceId = uuidv4();
  const leftNextId = uuidv4();
  const rightNextId = uuidv4();

  const leftChoice: StoryChoice = {
    id: leftChoiceId,
    text: generateChoiceText(leftChoiceTemplates),
    nextNodeId: leftNextId,
  };

  const rightChoice: StoryChoice = {
    id: rightChoiceId,
    text: generateChoiceText(rightChoiceTemplates),
    nextNodeId: rightNextId,
  };

  return {
    id: nodeId ?? uuidv4(),
    title,
    description,
    choices: [leftChoice, rightChoice],
  };
}

const nodeCache = new Map<string, StoryNode>();

export function getNextNode(
  currentNodeId: string | null,
  choiceDirection: ChoiceDirection | null
): StoryNode {
  if (!currentNodeId || choiceDirection === null) {
    const startNode = generateStoryNode({ prevNode: null, choiceDirection: null, choiceText: null });
    nodeCache.set(startNode.id, startNode);
    return startNode;
  }

  const currentNode = nodeCache.get(currentNodeId);
  if (!currentNode) {
    const newNode = generateStoryNode({ prevNode: null, choiceDirection: null, choiceText: null }, currentNodeId);
    nodeCache.set(currentNodeId, newNode);
    return newNode;
  }

  const choiceIndex = choiceDirection === 'left' ? 0 : 1;
  const choice = currentNode.choices[choiceIndex];
  const nextNodeId = choice.nextNodeId;

  if (nodeCache.has(nextNodeId)) {
    return nodeCache.get(nextNodeId)!;
  }

  const nextNode = generateStoryNode(
    {
      prevNode: currentNode,
      choiceDirection,
      choiceText: choice.text,
    },
    nextNodeId
  );
  nodeCache.set(nextNodeId, nextNode);
  return nextNode;
}

export function getNodeById(nodeId: string): StoryNode | null {
  return nodeCache.get(nodeId) ?? null;
}

export function resetStoryEngine(): void {
  nodeCache.clear();
}
