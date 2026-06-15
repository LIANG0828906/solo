import { v4 as uuidv4 } from 'uuid';
import type { RoomMeta, StoryNode, Author } from '@/types';
import { getThemeColors } from '@/utils/themes';
import { getRandomIllustration } from '@/utils/illustrations';
import { analyzeSentiment } from '@/utils/sentiment';

const STORY_VINE_ROOMS = 'story_vine_rooms';
const STORY_VINE_NODES = 'story_vine_nodes';

type NodesByRoom = Record<string, StoryNode[]>;

function readRooms(): RoomMeta[] {
  try {
    const raw = localStorage.getItem(STORY_VINE_ROOMS);
    if (!raw) return [];
    return JSON.parse(raw) as RoomMeta[];
  } catch {
    return [];
  }
}

function writeRooms(rooms: RoomMeta[]): void {
  localStorage.setItem(STORY_VINE_ROOMS, JSON.stringify(rooms));
}

function readNodes(): NodesByRoom {
  try {
    const raw = localStorage.getItem(STORY_VINE_NODES);
    if (!raw) return {};
    return JSON.parse(raw) as NodesByRoom;
  } catch {
    return {};
  }
}

function writeNodes(nodes: NodesByRoom): void {
  localStorage.setItem(STORY_VINE_NODES, JSON.stringify(nodes));
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

function getRandomAvatarColor(): string {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)];
}

function createAuthor(name?: string): Author {
  const storedAuthor = localStorage.getItem('story_vine_local_author');
  if (storedAuthor) {
    return JSON.parse(storedAuthor) as Author;
  }
  const author: Author = {
    id: uuidv4(),
    name: name || `旅行者${Math.floor(Math.random() * 9000) + 1000}`,
    avatarColor: getRandomAvatarColor()
  };
  localStorage.setItem('story_vine_local_author', JSON.stringify(author));
  return author;
}

export function getRooms(): RoomMeta[] {
  const rooms = readRooms();
  return rooms
    .filter(r => r.isPublic)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getRoomById(id: string): RoomMeta | undefined {
  const rooms = readRooms();
  return rooms.find(r => r.id === id);
}

export function createRoom(data: {
  title: string;
  initialParagraph: string;
  theme: string;
  isPublic: boolean;
}): RoomMeta {
  const now = Date.now();
  const themeColors = getThemeColors(data.theme);
  const coverIllustration = getRandomIllustration();
  const author = createAuthor();

  const room: RoomMeta = {
    id: uuidv4(),
    title: data.title,
    theme: data.theme,
    themeColors,
    coverIllustration,
    initialParagraph: data.initialParagraph,
    createdAt: now,
    updatedAt: now,
    participantCount: 1,
    nodeCount: 1,
    isPublic: data.isPublic,
    inviteCode: generateInviteCode()
  };

  const rootNode: StoryNode = {
    id: uuidv4(),
    roomId: room.id,
    parentId: null,
    content: data.initialParagraph,
    author,
    createdAt: now,
    depth: 0,
    side: 'root',
    sentiment: 'neutral',
    childrenIds: []
  };

  const rooms = readRooms();
  rooms.push(room);
  writeRooms(rooms);

  const nodes = readNodes();
  nodes[room.id] = [rootNode];
  writeNodes(nodes);

  return room;
}

export function getStoryById(roomId: string): StoryNode[] {
  const nodes = readNodes();
  return nodes[roomId] || [];
}

export function getNodeById(roomId: string, nodeId: string): StoryNode | undefined {
  const story = getStoryById(roomId);
  return story.find(n => n.id === nodeId);
}

export function addBranchNode(
  roomId: string,
  parentId: string,
  content: string,
  author: Author
): { left: StoryNode; right: StoryNode } {
  const now = Date.now();
  const rooms = readRooms();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  if (roomIndex === -1) {
    throw new Error(`Room ${roomId} not found`);
  }

  const room = rooms[roomIndex];
  const nodes = readNodes();
  const story = nodes[roomId] || [];
  const parentIndex = story.findIndex(n => n.id === parentId);
  if (parentIndex === -1) {
    throw new Error(`Node ${parentId} not found in room ${roomId}`);
  }

  const parent = story[parentIndex];
  if (parent.childrenIds.length > 0) {
    throw new Error(`Node ${parentId} already has children`);
  }

  const sentiment = analyzeSentiment(content);
  const nextDepth = parent.depth + 1;

  const leftNode: StoryNode = {
    id: uuidv4(),
    roomId,
    parentId,
    content,
    author,
    createdAt: now,
    depth: nextDepth,
    side: 'left',
    sentiment,
    childrenIds: []
  };

  const rightContent = generateContinuation(content, sentiment);
  const rightNode: StoryNode = {
    id: uuidv4(),
    roomId,
    parentId,
    content: rightContent,
    author,
    createdAt: now,
    depth: nextDepth,
    side: 'right',
    sentiment,
    childrenIds: []
  };

  story[parentIndex] = {
    ...parent,
    childrenIds: [leftNode.id, rightNode.id]
  };
  story.push(leftNode, rightNode);
  nodes[roomId] = story;
  writeNodes(nodes);

  const authorIds = new Set<string>();
  for (const node of story) {
    authorIds.add(node.author.id);
  }

  rooms[roomIndex] = {
    ...room,
    updatedAt: now,
    nodeCount: story.length,
    participantCount: authorIds.size
  };
  writeRooms(rooms);

  return { left: leftNode, right: rightNode };
}

function generateContinuation(baseContent: string, sentiment: 'positive' | 'neutral' | 'conflict'): string {
  const transitions: Record<string, string[]> = {
    positive: [
      '然而，命运的转折总是出人意料，',
      '就在一切看似顺利的时候，',
      '但故事的发展并不总如人所愿，',
      '可谁也没有料到，接下来发生的事，'
    ],
    neutral: [
      '与此同时，',
      '另一方面，',
      '而在另一个角落，',
      '故事的另一条线索缓缓展开，'
    ],
    conflict: [
      '尽管前方困难重重，希望的火种从未熄灭，',
      '但在最黑暗的时刻，转机悄然出现，',
      '然而，不屈的意志总能找到出路，',
      '就在绝望的边缘，一束光照亮了前路，'
    ]
  };
  const options = transitions[sentiment];
  const prefix = options[Math.floor(Math.random() * options.length)];
  const trimmed = baseContent.length > 80 ? baseContent.substring(0, 80) + '……' : baseContent;
  return `${prefix}承接"${trimmed}"的余韵，新的篇章悄然开启……`;
}

interface SeedRoomTemplate {
  title: string;
  theme: string;
  initialParagraph: string;
  isPublic: boolean;
  nodes: Array<{
    parentSide: 'root' | 'left' | 'right';
    parentDepth: number;
    side: 'left' | 'right';
    content: string;
    sentiment: 'positive' | 'neutral' | 'conflict';
  }>;
}

const seedTemplates: SeedRoomTemplate[] = [
  {
    title: '森林深处的秘密',
    theme: '奇幻',
    initialParagraph: '年轻的探险家艾琳手持古老的羊皮地图，踏入了传说中隐藏着精灵宝藏的暗影森林。浓雾弥漫的空气中飘散着淡淡的花香，远处隐约传来悠扬的歌声，仿佛在指引她前行的方向。',
    isPublic: true,
    nodes: [
      { parentSide: 'root', parentDepth: 0, side: 'left', content: '艾琳决定循着歌声的方向深入探索，她相信那一定是精灵族的指引。每一步都让她感受到一股温暖的希望，脚下的苔藓柔软如毯，阳光透过叶缝洒下斑驳的金光。', sentiment: 'positive' },
      { parentSide: 'root', parentDepth: 0, side: 'right', content: '艾琳谨慎地选择了另一条小径，歌声虽迷人，但她隐约觉得其中潜藏着未知的危险。四周的树木渐渐扭曲成诡异的形状，风停了，空气变得凝滞而紧张。', sentiment: 'conflict' },
      { parentSide: 'left', parentDepth: 1, side: 'left', content: '穿过一片花海，艾琳来到了一座古老的石门前，门上雕刻着她家族的徽章。原来她的血脉里，流淌着精灵守护者的血液。这是命运赐予她的最好礼物。', sentiment: 'positive' },
      { parentSide: 'left', parentDepth: 1, side: 'right', content: '歌声突然停了，艾琳发现自己迷失在一片从未见过的迷雾中。她试图原路返回，但所有的路都通向陌生的地方。恐惧开始在她心中蔓延。', sentiment: 'conflict' },
      { parentSide: 'right', parentDepth: 1, side: 'left', content: '虽然路途中危机四伏，但艾琳凭借过人的勇气和智慧，避开了一个又一个陷阱。她在一处隐秘的山洞中发现了闪光的水晶，似乎蕴含着古老的力量。', sentiment: 'positive' },
      { parentSide: 'right', parentDepth: 1, side: 'right', content: '黑暗中突然传来低沉的咆哮声，一只巨大的黑色狼形生物挡住了去路。它的眼睛燃烧着幽蓝的火焰，艾琳知道，一场生死之战在所难免。', sentiment: 'conflict' }
    ]
  },
  {
    title: '时光咖啡馆',
    theme: '治愈',
    initialParagraph: '雨后的午后，林夏推开了街角那家名为「回溯」的咖啡馆的门。门上的风铃发出清脆悦耳的声响，店内弥漫着现磨咖啡与烘焙糕点的温暖香气。店主是一位白发苍苍却眼神明亮的老人，正微笑着看向她。',
    isPublic: true,
    nodes: [
      { parentSide: 'root', parentDepth: 0, side: 'left', content: '林夏点了一杯招牌手冲咖啡，店主神秘地眨了眨眼说：「每一杯咖啡，都藏着一段你遗忘的美好记忆。」她捧着温热的杯子，心中涌起莫名的期待与幸福。', sentiment: 'positive' },
      { parentSide: 'root', parentDepth: 0, side: 'right', content: '林夏心不在焉地在角落坐下，她刚刚失去了重要的人，此刻内心满是悲伤。她没有注意到，桌上的咖啡杯里，咖啡表面正缓缓浮现出一幅熟悉的画面。', sentiment: 'conflict' },
      { parentSide: 'left', parentDepth: 1, side: 'left', content: '喝下第一口咖啡的瞬间，林夏看到了童年的自己正和爷爷在院子里放风筝。温暖的阳光、爷爷慈祥的笑容，那些曾被她遗忘的幸福时光潮水般涌回。泪水夺眶而出，却是甜的。', sentiment: 'positive' },
      { parentSide: 'left', parentDepth: 1, side: 'right', content: '就在这时，一个同样独自坐着的年轻人向她投来友好的微笑。他桌上的咖啡杯里，浮现的画面竟然与她的有着微妙的交集。也许，这就是命运安排的相遇。', sentiment: 'positive' },
      { parentSide: 'right', parentDepth: 1, side: 'left', content: '林夏定睛一看，咖啡里浮现的是她和那个人最后一次吵架的场景，但这次她看清了对方眼中没有说出口的爱与不舍。老人轻声说：「放下过去，才能拥抱现在。」', sentiment: 'positive' },
      { parentSide: 'right', parentDepth: 1, side: 'right', content: '她突然伏在桌上失声痛哭，所有压抑的情绪都在这一刻释放。老人没有打扰，只是默默递上一杯温热的蜂蜜水。门外，雨已经停了，彩虹正在天边缓缓浮现。', sentiment: 'neutral' }
    ]
  },
  {
    title: '星际移民号',
    theme: '科幻',
    initialParagraph: '公元2387年，「希望号」移民飞船正以接近光速的速度驶向距离地球42光年的宜居行星凯普勒-452c。舰长陈默站在指挥台上，透过巨大的观景窗凝视着深邃的宇宙。沉睡的五千名殖民者的命运，都握在他的手中。',
    isPublic: true,
    nodes: [
      { parentSide: 'root', parentDepth: 0, side: 'left', content: '导航官兴奋地报告：「舰长，我们发现了一条未知的虫洞通道！如果穿过它，可以提前200年抵达目标星系！」这将是人类航天史上最伟大的突破，整个舰桥都洋溢着喜悦。', sentiment: 'positive' },
      { parentSide: 'root', parentDepth: 0, side: 'right', content: '警报声骤然响起，首席工程师慌张报告：「舰长，生命维持系统出现异常波动，休眠舱有三个区域温度正在异常上升！」陈默的心瞬间绷紧，一场危机悄然而至。', sentiment: 'conflict' },
      { parentSide: 'left', parentDepth: 1, side: 'left', content: '陈默下令全舰进入战备状态，小心穿越虫洞。穿越过程中，窗外闪过无数绚丽的光带，当一切归于平静时，凯普勒-452c那颗蔚蓝的星球就静静地悬在眼前。人类的新家园，到了。', sentiment: 'positive' },
      { parentSide: 'left', parentDepth: 1, side: 'right', content: '虫洞的另一端并不是预期的目的地，而是一片从未观测到的神秘星域。一艘巨大的外星飞船正静默地悬停在前方，似乎在等待着他们的到来。未知的文明，正在发出呼唤。', sentiment: 'neutral' },
      { parentSide: 'right', parentDepth: 1, side: 'left', content: '陈默亲自带领维修组深入故障区域，发现是一种未知的太空微生物侵蚀了电路板。在关键时刻，医疗官提出用低温等离子体消杀的方案，成功解除了危机，挽救了数百条生命。', sentiment: 'positive' },
      { parentSide: 'right', parentDepth: 1, side: 'right', content: '故障进一步恶化，多个休眠舱接连失效。更可怕的是，飞船的AI系统似乎被某种未知力量入侵，开始拒绝人类的指令。陈默必须做出抉择：是信任AI，还是手动接管？', sentiment: 'conflict' },
      { parentSide: 'left', parentDepth: 2, side: 'left', content: '登陆艇缓缓降落，当舱门打开的那一刻，第一批踏上新土地的殖民者们看到了令人惊叹的景象：紫色的森林、双月同辉的天空，空气中飘散着甜蜜的花香。新世界的第一缕阳光，如此温暖。', sentiment: 'positive' }
    ]
  }
];

export function ensureSeedData(): void {
  const rooms = readRooms();
  if (rooms.length > 0) return;

  const now = Date.now();
  const createdRooms: RoomMeta[] = [];
  const nodesByRoom: NodesByRoom = {};

  for (let i = 0; i < seedTemplates.length; i++) {
    const template = seedTemplates[i];
    const createdAt = now - (seedTemplates.length - i) * 86400000;
    const updatedAt = now - (seedTemplates.length - i - 1) * 3600000;
    const themeColors = getThemeColors(template.theme);
    const coverIllustration = getRandomIllustration();
    const author = createAuthor(i === 0 ? '系统创作者' : undefined);

    const roomId = uuidv4();
    const room: RoomMeta = {
      id: roomId,
      title: template.title,
      theme: template.theme,
      themeColors,
      coverIllustration,
      initialParagraph: template.initialParagraph,
      createdAt,
      updatedAt,
      participantCount: 1,
      nodeCount: 1,
      isPublic: template.isPublic,
      inviteCode: generateInviteCode()
    };

    const story: StoryNode[] = [];
    const rootNode: StoryNode = {
      id: uuidv4(),
      roomId,
      parentId: null,
      content: template.initialParagraph,
      author,
      createdAt,
      depth: 0,
      side: 'root',
      sentiment: 'neutral',
      childrenIds: []
    };
    story.push(rootNode);

    const nodeMap: Record<string, string> = {};
    nodeMap[`root-0`] = rootNode.id;

    const allAuthorIds = new Set<string>([author.id]);

    for (const nodeTpl of template.nodes) {
      const parentKey = `${nodeTpl.parentSide}-${nodeTpl.parentDepth}`;
      const parentId = nodeMap[parentKey];
      if (!parentId) continue;

      const parentIndex = story.findIndex(n => n.id === parentId);
      if (parentIndex === -1) continue;

      const nodeAuthor = i % 2 === 0 && nodeTpl.side === 'right'
        ? { ...author, id: uuidv4(), name: `协作者${Math.floor(Math.random() * 9000) + 1000}`, avatarColor: getRandomAvatarColor() }
        : author;
      allAuthorIds.add(nodeAuthor.id);

      const node: StoryNode = {
        id: uuidv4(),
        roomId,
        parentId,
        content: nodeTpl.content,
        author: nodeAuthor,
        createdAt: createdAt + (nodeTpl.parentDepth + 1) * 7200000,
        depth: nodeTpl.parentDepth + 1,
        side: nodeTpl.side,
        sentiment: nodeTpl.sentiment,
        childrenIds: []
      };

      story[parentIndex] = {
        ...story[parentIndex],
        childrenIds: [...story[parentIndex].childrenIds, node.id]
      };

      story.push(node);
      nodeMap[`${nodeTpl.side}-${node.depth}`] = node.id;
    }

    room.nodeCount = story.length;
    room.participantCount = allAuthorIds.size;

    createdRooms.push(room);
    nodesByRoom[roomId] = story;
  }

  writeRooms(createdRooms);
  writeNodes(nodesByRoom);
}
