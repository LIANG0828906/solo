import type { Poem, Annotation, InspirationCard, Collection, Comment, Collaborator, User, PoemLine } from '../types';
import { useStore } from '../store';

function createLine(id: string, text: string, order: number, rhymeMark: string = '不押'): PoemLine {
  return {
    id,
    text,
    rhymeMark,
    charCount: text.length,
    order,
  };
}

export const mockCurrentUser: User = {
  id: 'user-1',
  email: 'poet@shiyun.com',
  name: '墨客',
  avatar: '',
};

export const mockCollaborators: Collaborator[] = [
  {
    id: 'collab-1',
    poemId: 'poem-1',
    userId: 'user-2',
    userName: '青莲',
    avatar: '',
    role: 'editor',
  },
  {
    id: 'collab-2',
    poemId: 'poem-1',
    userId: 'user-3',
    userName: '子美',
    avatar: '',
    role: 'viewer',
  },
  {
    id: 'collab-3',
    poemId: 'poem-3',
    userId: 'user-4',
    userName: '摩诘',
    avatar: '',
    role: 'editor',
  },
];

export const mockPoems: Poem[] = [
  {
    id: 'poem-1',
    title: '静夜思',
    authorId: 'user-1',
    collectionId: 'coll-1',
    lines: [
      createLine('line-1-1', '床前明月光', 0, '押韵'),
      createLine('line-1-2', '疑是地上霜', 1, '押韵'),
      createLine('line-1-3', '举头望明月', 2, '不押'),
      createLine('line-1-4', '低头思故乡', 3, '押韵'),
    ],
    likeCount: 128,
    commentCount: 3,
    createdAt: '2025-09-15T08:30:00.000Z',
    updatedAt: '2025-09-15T10:00:00.000Z',
  },
  {
    id: 'poem-2',
    title: '登鹳雀楼',
    authorId: 'user-1',
    collectionId: 'coll-1',
    lines: [
      createLine('line-2-1', '白日依山尽', 0, '不押'),
      createLine('line-2-2', '黄河入海流', 1, '押韵'),
      createLine('line-2-3', '欲穷千里目', 2, '不押'),
      createLine('line-2-4', '更上一层楼', 3, '押韵'),
    ],
    likeCount: 96,
    commentCount: 2,
    createdAt: '2025-08-20T14:20:00.000Z',
    updatedAt: '2025-08-20T15:30:00.000Z',
  },
  {
    id: 'poem-3',
    title: '春望',
    authorId: 'user-1',
    collectionId: 'coll-1',
    lines: [
      createLine('line-3-1', '国破山河在', 0, '不押'),
      createLine('line-3-2', '城春草木深', 1, '押韵'),
      createLine('line-3-3', '感时花溅泪', 2, '不押'),
      createLine('line-3-4', '恨别鸟惊心', 3, '押韵'),
      createLine('line-3-5', '烽火连三月', 4, '不押'),
      createLine('line-3-6', '家书抵万金', 5, '押韵'),
      createLine('line-3-7', '白头搔更短', 6, '不押'),
      createLine('line-3-8', '浑欲不胜簪', 7, '押韵'),
    ],
    likeCount: 215,
    commentCount: 1,
    createdAt: '2025-07-10T09:00:00.000Z',
    updatedAt: '2025-07-10T12:00:00.000Z',
  },
  {
    id: 'poem-4',
    title: '山居秋暝',
    authorId: 'user-1',
    collectionId: 'coll-3',
    lines: [
      createLine('line-4-1', '空山新雨后', 0, '不押'),
      createLine('line-4-2', '天气晚来秋', 1, '押韵'),
      createLine('line-4-3', '明月松间照', 2, '不押'),
      createLine('line-4-4', '清泉石上流', 3, '押韵'),
      createLine('line-4-5', '竹喧归浣女', 4, '不押'),
      createLine('line-4-6', '莲动下渔舟', 5, '押韵'),
      createLine('line-4-7', '随意春芳歇', 6, '不押'),
      createLine('line-4-8', '王孙自可留', 7, '押韵'),
    ],
    likeCount: 178,
    commentCount: 0,
    createdAt: '2025-06-05T16:45:00.000Z',
    updatedAt: '2025-06-05T18:20:00.000Z',
  },
  {
    id: 'poem-5',
    title: '江南春',
    authorId: 'user-1',
    collectionId: 'coll-1',
    lines: [
      createLine('line-5-1', '千里莺啼绿映红', 0, '押韵'),
      createLine('line-5-2', '水村山郭酒旗风', 1, '押韵'),
      createLine('line-5-3', '南朝四百八十寺', 2, '不押'),
      createLine('line-5-4', '多少楼台烟雨中', 3, '押韵'),
    ],
    likeCount: 142,
    commentCount: 0,
    createdAt: '2025-05-18T11:10:00.000Z',
    updatedAt: '2025-05-18T13:00:00.000Z',
  },
  {
    id: 'poem-6',
    title: '雨夜听风',
    authorId: 'user-1',
    collectionId: 'coll-2',
    lines: [
      createLine('line-6-1', '雨点敲窗织夜曲，风过梧桐低语。', 0, '不押'),
      createLine('line-6-2', '一盏孤灯照影单，思绪如潮远去。', 1, '押韵'),
      createLine('line-6-3', '梦里花开又花落，醒来不知何处。', 2, '不押'),
      createLine('line-6-4', '唯有墨香绕指柔，写尽人间朝暮。', 3, '押韵'),
    ],
    likeCount: 54,
    commentCount: 0,
    createdAt: '2025-04-22T23:30:00.000Z',
    updatedAt: '2025-04-23T00:15:00.000Z',
  },
  {
    id: 'poem-7',
    title: '山行偶成',
    authorId: 'user-1',
    collectionId: 'coll-3',
    lines: [
      createLine('line-7-1', '远上寒山石径斜', 0, '押韵'),
      createLine('line-7-2', '白云生处有人家', 1, '押韵'),
      createLine('line-7-3', '停车坐爱枫林晚', 2, '不押'),
      createLine('line-7-4', '霜叶红于二月花', 3, '押韵'),
    ],
    likeCount: 203,
    commentCount: 0,
    createdAt: '2024-11-10T14:00:00.000Z',
    updatedAt: '2024-11-10T15:30:00.000Z',
  },
  {
    id: 'poem-8',
    title: '江城子·记梦',
    authorId: 'user-1',
    collectionId: 'coll-2',
    lines: [
      createLine('line-8-1', '十年生死两茫茫，不思量，自难忘。', 0, '押韵'),
      createLine('line-8-2', '千里孤坟，无处话凄凉。', 1, '押韵'),
      createLine('line-8-3', '纵使相逢应不识，尘满面，鬓如霜。', 2, '押韵'),
      createLine('line-8-4', '夜来幽梦忽还乡，小轩窗，正梳妆。', 3, '押韵'),
      createLine('line-8-5', '相顾无言，惟有泪千行。', 4, '押韵'),
      createLine('line-8-6', '料得年年肠断处，明月夜，短松冈。', 5, '押韵'),
    ],
    likeCount: 312,
    commentCount: 0,
    createdAt: '2024-09-28T20:00:00.000Z',
    updatedAt: '2024-09-28T21:45:00.000Z',
  },
];

export const mockAnnotations: Annotation[] = [
  {
    id: 'ann-1',
    poemId: 'poem-1',
    lineId: 'line-1-1',
    authorId: 'user-2',
    authorName: '青莲',
    startOffset: 2,
    endOffset: 5,
    highlightedText: '明月光',
    content: '此句写景如画，「明月光」三字点出秋夜之清冷，为下文思乡做铺垫。',
    replies: [
      {
        id: 'reply-1',
        authorId: 'user-1',
        authorName: '墨客',
        content: '兄台所言极是，月光如水，最易牵动愁绪。',
        createdAt: '2025-09-15T09:00:00.000Z',
      },
      {
        id: 'reply-2',
        authorId: 'user-3',
        authorName: '子美',
        content: '「床」字或谓井栏，众说纷纭，然意境则一也。',
        createdAt: '2025-09-15T09:30:00.000Z',
      },
    ],
    createdAt: '2025-09-15T08:45:00.000Z',
  },
  {
    id: 'ann-2',
    poemId: 'poem-1',
    lineId: 'line-1-2',
    authorId: 'user-3',
    authorName: '子美',
    startOffset: 0,
    endOffset: 5,
    highlightedText: '疑是地上霜',
    content: '以霜喻月光，新奇贴切，更显夜深露重，寒意袭人。',
    replies: [
      {
        id: 'reply-3',
        authorId: 'user-2',
        authorName: '青莲',
        content: '比喻精妙，太白之风骨可见一斑。',
        createdAt: '2025-09-15T10:00:00.000Z',
      },
    ],
    createdAt: '2025-09-15T09:15:00.000Z',
  },
  {
    id: 'ann-3',
    poemId: 'poem-1',
    lineId: 'line-1-4',
    authorId: 'user-4',
    authorName: '摩诘',
    startOffset: 0,
    endOffset: 5,
    highlightedText: '低头思故乡',
    content: '收束之笔，平淡中见深情。一「低」字，千愁万绪尽在其中。',
    replies: [],
    createdAt: '2025-09-15T10:30:00.000Z',
  },
  {
    id: 'ann-4',
    poemId: 'poem-1',
    lineId: 'line-1-3',
    authorId: 'user-2',
    authorName: '青莲',
    startOffset: 0,
    endOffset: 5,
    highlightedText: '举头望明月',
    content: '由景入情，「望」字承上启下，望的是月，想的是人。',
    replies: [],
    createdAt: '2025-09-15T11:00:00.000Z',
  },
];

export const mockCollections: Collection[] = [
  {
    id: 'coll-1',
    userId: 'user-1',
    name: '五言集',
    description: '收录五言绝句与律诗，古风新韵，兼收并蓄。',
    poemCount: 4,
    createdAt: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 'coll-2',
    userId: 'user-1',
    name: '现代诗卷',
    description: '不拘格律，直抒胸臆。新诗旧词，皆为心声。',
    poemCount: 2,
    createdAt: '2024-06-15T00:00:00.000Z',
  },
  {
    id: 'coll-3',
    userId: 'user-1',
    name: '山水行吟',
    description: '登山临水之作，写景抒情之篇。',
    poemCount: 2,
    createdAt: '2024-09-01T00:00:00.000Z',
  },
];

export const mockInspirationCards: InspirationCard[] = [
  {
    id: 'ins-1',
    userId: 'user-1',
    content: '月色如水，洒在青瓦上，滴答作响的不是雨，是时光。',
    starred: true,
    tags: ['意象', '开头句', '夜景'],
    createdAt: '2025-10-01T20:00:00.000Z',
  },
  {
    id: 'ins-2',
    userId: 'user-1',
    content: '风起的时候，芦苇弯腰，不是屈服，是在积蓄力量。',
    starred: false,
    tags: ['动词', '哲理'],
    createdAt: '2025-10-02T14:30:00.000Z',
  },
  {
    id: 'ins-3',
    userId: 'user-1',
    content: '老槐树的年轮里，藏着一个夏天的蝉鸣。',
    starred: true,
    tags: ['意象', '回忆'],
    createdAt: '2025-10-03T09:15:00.000Z',
  },
  {
    id: 'ins-4',
    userId: 'user-1',
    content: '她笑的时候，眼里有一条河，流着我从未见过的春天。',
    starred: false,
    tags: ['开头句', '情感'],
    createdAt: '2025-10-04T16:45:00.000Z',
  },
  {
    id: 'ins-5',
    userId: 'user-1',
    content: '檐角的风铃，替风说了许多不敢说的话。',
    starred: true,
    tags: ['意象', '动词', '思念'],
    createdAt: '2025-10-05T22:00:00.000Z',
  },
  {
    id: 'ins-6',
    userId: 'user-1',
    content: '把信折成纸船，放入溪流，不知寄往何处，但求顺水而去。',
    starred: false,
    tags: ['开头句', '动词', '思念'],
    createdAt: '2025-10-06T11:30:00.000Z',
  },
  {
    id: 'ins-7',
    userId: 'user-1',
    content: '雨后的小巷，青石板上的倒影，藏着另一个世界。',
    starred: false,
    tags: ['意象', '山水', '夜景'],
    createdAt: '2025-10-07T08:00:00.000Z',
  },
  {
    id: 'ins-8',
    userId: 'user-1',
    content: '一壶茶，一本书，一窗雨，便是人间好时节。',
    starred: true,
    tags: ['结尾句', '闲适'],
    createdAt: '2025-10-08T15:20:00.000Z',
  },
];

export const mockComments: Comment[] = [
  {
    id: 'cmt-1',
    poemId: 'poem-1',
    userId: 'user-2',
    userName: '青莲',
    content: '千古名篇，百读不厌。「举头」「低头」之间，道尽游子心声。',
    createdAt: '2025-09-15T12:00:00.000Z',
  },
  {
    id: 'cmt-2',
    poemId: 'poem-1',
    userId: 'user-3',
    userName: '子美',
    content: '浅语情深，非大才不能为之。',
    createdAt: '2025-09-15T13:00:00.000Z',
  },
  {
    id: 'cmt-3',
    poemId: 'poem-1',
    userId: 'user-4',
    userName: '摩诘',
    content: '诗中有画，画中有情。',
    createdAt: '2025-09-15T14:00:00.000Z',
  },
  {
    id: 'cmt-4',
    poemId: 'poem-2',
    userId: 'user-3',
    userName: '子美',
    content: '「更上一层楼」，哲理与诗情并胜，千古名句也。',
    createdAt: '2025-08-21T09:00:00.000Z',
  },
  {
    id: 'cmt-5',
    poemId: 'poem-2',
    userId: 'user-4',
    userName: '摩诘',
    content: '前两句写景壮阔，后两句议论高远，结构绝妙。',
    createdAt: '2025-08-21T10:00:00.000Z',
  },
  {
    id: 'cmt-6',
    poemId: 'poem-3',
    userId: 'user-2',
    userName: '青莲',
    content: '沉郁顿挫，字字血泪。少陵之诗，真乃诗史也。',
    createdAt: '2025-07-11T15:00:00.000Z',
  },
];

export const mockLikes: Record<string, boolean> = {
  'poem-1': true,
  'poem-3': true,
  'poem-7': false,
};

export function seedStore(storeApi: typeof useStore) {
  const state = storeApi.getState();
  state.setCurrentUser(mockCurrentUser);
  state.setPoems(mockPoems);
  state.setAnnotations(mockAnnotations);
  state.setInspirationCards(mockInspirationCards);
  state.setCollections(mockCollections);
  state.setCollaborators(mockCollaborators);
  state.setComments(mockComments);
  if (mockPoems.length > 0) {
    state.setCurrentPoem(mockPoems[0]);
  }
}
