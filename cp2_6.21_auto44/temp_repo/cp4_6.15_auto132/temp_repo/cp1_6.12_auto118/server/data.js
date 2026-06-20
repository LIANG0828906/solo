const { v4: uuidv4 } = require('uuid');

const COLORS = [
  '#FFB8B8',
  '#FFDBA4',
  '#FFF5BA',
  '#B5EAD7',
  '#C7CEEA',
  '#E2C2FF',
  '#AEC8FC',
  '#F1C0E8'
];

const USERS = [
  { id: 'user-1', nickname: '小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming' },
  { id: 'user-2', nickname: '小红', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong' },
  { id: 'user-3', nickname: '阿强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aqiang' },
  { id: 'user-4', nickname: '小美', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaomei' },
  { id: 'user-5', nickname: '大壮', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dazhuang' },
  { id: 'user-6', nickname: '文文', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wenwen' },
  { id: 'user-7', nickname: '静静', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jingjing' },
  { id: 'user-8', nickname: '牛牛', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=niuniu' },
];

const CURRENT_USER = USERS[0];

function createInitialStories() {
  const stories = [];

  const titles = [
    '神秘森林的冒险',
    '时间旅行者',
    '海底王国奇遇',
    '太空漫游日记',
    '魔法学院的秘密',
    '失落的宝藏地图',
    '会说话的猫咪',
    '梦境中的城市',
    '平行世界之旅',
    '彩虹桥的另一端'
  ];

  const summaries = [
    '一群勇敢的冒险者踏入神秘的森林，寻找传说中的古老宝藏...',
    '意外获得时光机的年轻人开始了奇妙的时空穿梭之旅...',
    '一次潜水意外发现了隐藏在深海中的神秘王国...',
    '宇航员在外太空的冒险经历和发现的未知生命...',
    '新生入学魔法学院，发现了学院背后不为人知的秘密...',
    '一张泛黄的宝藏地图，开启了充满未知的冒险旅程...',
    '某天家里的猫咪突然开口说话了，它说它来自另一个星球...',
    '每晚入睡后都会进入一座神奇的城市，那里的一切都如梦似幻...',
    '意外打开通往平行世界的大门，遇见了另一个自己...',
    '传说中彩虹桥连接着神秘的世界，有人终于走到了彩虹的尽头...'
  ];

  for (let i = 0; i < 10; i++) {
    const storyId = uuidv4();
    const color = COLORS[i % COLORS.length];
    const paragraphCount = Math.floor(Math.random() * 5) + 3;
    const participantsCount = paragraphCount;
    const participants = [];
    const paragraphs = [];
    let lastUpdateTime = Date.now() - Math.random() * 86400000 * 7;

    for (let j = 0; j < paragraphCount; j++) {
      const user = USERS[j % USERS.length];
      if (!participants.find(p => p.id === user.id)) {
        participants.push(user);
      }

      const paraContents = [
        '他们沿着蜿蜒的小径继续前行，阳光透过树叶在地面上投下斑驳的光影。',
        '就在这时，一阵奇怪的声音从远处传来，所有人都停下了脚步。',
        '眼前的景象让所有人都惊呆了，他们从未见过如此神奇的场景。',
        '其中一人鼓起勇气走上前去，小心翼翼地伸出了手。',
        '时间仿佛在这一刻静止了，大家都屏住呼吸等待着接下来会发生什么。',
        '突然，天空中出现了一道耀眼的光芒，照亮了整个山谷。',
        '大家面面相觑，不知道该继续前进还是原路返回。',
        '一位老者从迷雾中缓缓走来，他的眼神中透露着智慧与神秘。',
        '风声越来越大，周围的树木开始剧烈地摇晃起来。',
        '在这片土地的深处，隐藏着一个古老的秘密，等待着勇敢的人来揭开。'
      ];

      paragraphs.push({
        id: uuidv4(),
        storyId: storyId,
        authorId: user.id,
        authorNickname: user.nickname,
        authorAvatar: user.avatar,
        content: paraContents[(i + j) % paraContents.length],
        index: j + 1,
        likes: Math.floor(Math.random() * 20),
        likedBy: [],
        comments: j % 3 === 0 ? [
          {
            id: uuidv4(),
            paragraphId: uuidv4(),
            userId: USERS[(j + 2) % USERS.length].id,
            userNickname: USERS[(j + 2) % USERS.length].nickname,
            userAvatar: USERS[(j + 2) % USERS.length].avatar,
            content: '写得太棒了！这个情节太精彩了 🎉',
            createdAt: Date.now() - Math.random() * 86400000 * 3
          },
          {
            id: uuidv4(),
            paragraphId: uuidv4(),
            userId: USERS[(j + 3) % USERS.length].id,
            userNickname: USERS[(j + 3) % USERS.length].nickname,
            userAvatar: USERS[(j + 3) % USERS.length].avatar,
            content: '期待后续！😊',
            createdAt: Date.now() - Math.random() * 86400000 * 2
          }
        ] : [],
        createdAt: lastUpdateTime + j * 3600000
      });
      lastUpdateTime = paragraphs[paragraphs.length - 1].createdAt;
    }

    stories.push({
      id: storyId,
      title: titles[i],
      summary: summaries[i],
      coverColor: color,
      paragraphs: paragraphs,
      participants: participants,
      contributorIds: participants.map(p => p.id),
      createdAt: Date.now() - Math.random() * 86400000 * 14,
      updatedAt: lastUpdateTime
    });
  }

  return stories;
}

let stories = createInitialStories();

module.exports = {
  COLORS,
  USERS,
  CURRENT_USER,
  getStories: () => stories,
  getStoryById: (id) => stories.find(s => s.id === id),
  addStory: (story) => { stories.unshift(story); return story; },
  updateStory: (id, updates) => {
    const idx = stories.findIndex(s => s.id === id);
    if (idx !== -1) {
      stories[idx] = { ...stories[idx], ...updates, updatedAt: Date.now() };
      return stories[idx];
    }
    return null;
  }
};
