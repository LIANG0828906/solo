import { v4 as uuidv4 } from 'uuid';
import { StoryNode, StoryChoice, ChoiceDirection } from './types';

const storyTemplates: { titles: string[]; descriptions: string[][]; choicesL: string[]; choicesR: string[] } = {
  titles: [
    '迷雾森林入口',
    '古老的石桥',
    '废弃的塔楼',
    '神秘的洞穴',
    '月光湖畔',
    '遗忘的神殿',
    '幽暗的地窖',
    '水晶矿脉',
    '时间裂隙',
    '梦境边界',
    '龙之巢穴',
    '精灵村落',
    '死亡沼泽',
    '天空废墟',
    '深渊之门',
  ],
  descriptions: [
    [
      '浓雾如同有生命般缠绕着你的脚踝，远处隐约传来低沉的号角声。',
      '脚下的落叶散发出潮湿的气息，每一步都似乎在惊醒沉睡的古老存在。',
      '光线在枝叶间斑驳摇曳，你感觉有无数双眼睛在暗处注视着你。',
    ],
    [
      '石桥上雕刻着早已失传的符文，桥面因岁月流逝而变得光滑如镜。',
      '桥下深不见底，偶尔有冷风从缝隙中钻出，带着地底的硫磺味。',
      '桥的另一端被浓雾笼罩，你只能听到自己心跳的回声。',
    ],
    [
      '塔楼的窗户如同空洞的眼窝，凝视着每一个敢于靠近的旅人。',
      '螺旋 staircase 在黑暗中向上延伸，似乎永远没有尽头。',
      '墙上的壁画描绘着一场被遗忘的战争，画中人物的眼睛仿佛会跟随你移动。',
    ],
    [
      '洞穴入口处挂满了晶莹的钟乳石，水滴落下的声音在空旷中回荡。',
      '越往深处走，空气就越温暖，隐约能看到远处有橙色的光芒闪烁。',
      '地面上散落着奇怪的骸骨，它们看起来不像是任何你认识的生物。',
    ],
    [
      '湖面如镜，倒映着满天繁星，尽管此刻天空中乌云密布。',
      '湖水清澈见底，但你总觉得水底有什么东西在缓缓游动。',
      '岸边有一艘破旧的小船，船桨上系着一根褪色的红丝带。',
    ],
  ],
  choicesL: [
    '深入探索',
    '向左绕行',
    '上楼查看',
    '进入洞穴',
    '乘船渡湖',
    '推开大门',
    '点燃火把',
    '采集水晶',
    '踏入裂隙',
    '穿越边界',
  ],
  choicesR: [
    '原路返回',
    '向右探索',
    '下楼寻找',
    '另寻入口',
    '沿湖而行',
    '绕道而行',
    '摸黑前进',
    '继续深入',
    '退离裂隙',
    '原地等待',
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNode(nodeId?: string): StoryNode {
  const title = pickRandom(storyTemplates.titles);
  const descGroup = pickRandom(storyTemplates.descriptions);
  const description = descGroup.join(' ');

  const leftChoiceId = uuidv4();
  const rightChoiceId = uuidv4();
  const leftNextId = uuidv4();
  const rightNextId = uuidv4();

  const leftChoice: StoryChoice = {
    id: leftChoiceId,
    text: pickRandom(storyTemplates.choicesL),
    nextNodeId: leftNextId,
  };

  const rightChoice: StoryChoice = {
    id: rightChoiceId,
    text: pickRandom(storyTemplates.choicesR),
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
    const startNode = generateNode();
    nodeCache.set(startNode.id, startNode);
    return startNode;
  }

  const currentNode = nodeCache.get(currentNodeId);
  if (!currentNode) {
    const newNode = generateNode(currentNodeId);
    nodeCache.set(currentNodeId, newNode);
    return newNode;
  }

  const choiceIndex = choiceDirection === 'left' ? 0 : 1;
  const choice = currentNode.choices[choiceIndex];
  const nextNodeId = choice.nextNodeId;

  if (nodeCache.has(nextNodeId)) {
    return nodeCache.get(nextNodeId)!;
  }

  const nextNode = generateNode(nextNodeId);
  nodeCache.set(nextNodeId, nextNode);
  return nextNode;
}

export function getNodeById(nodeId: string): StoryNode | null {
  return nodeCache.get(nodeId) ?? null;
}

export function resetStoryEngine(): void {
  nodeCache.clear();
}
