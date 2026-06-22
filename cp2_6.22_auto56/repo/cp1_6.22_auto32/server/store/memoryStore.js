import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const users = new Map();
const poems = new Map();
const tokens = new Map();

function initMockData() {
  const mockUsers = [
    { username: 'poet1', password: 'password123', nickname: '清风墨客', bio: '热爱自然，以诗为友' },
    { username: 'poet2', password: 'password123', nickname: '月下独酌', bio: '夜色如水，诗意流淌' },
    { username: 'poet3', password: 'password123', nickname: '山野闲人', bio: '居深山，听鸟鸣' },
  ];

  mockUsers.forEach(user => {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    users.set(id, {
      id,
      username: user.username,
      password: hashedPassword,
      nickname: user.nickname,
      bio: user.bio,
      createdAt: Date.now(),
    });
  });

  const userArray = Array.from(users.values());
  
  const mockPoems = [
    {
      title: '春晨',
      content: '晨露沾衣袂，\n春风抚面来。\n山花烂漫处，\n鸟语入心怀。',
      tags: ['自然', '喜悦'],
      authorIndex: 0,
      likes: 24,
    },
    {
      title: '夜雨思',
      content: '夜雨敲窗棂，\n孤灯照影清。\n故人千里外，\n何日共听琴？',
      tags: ['忧伤', '哲思'],
      authorIndex: 1,
      likes: 18,
    },
    {
      title: '山居',
      content: '结庐在人境，\n而无车马喧。\n问君何能尔？\n心远地自偏。',
      tags: ['自然', '哲思'],
      authorIndex: 2,
      likes: 32,
    },
    {
      title: '励志篇',
      content: '男儿何不带吴钩，\n收取关山五十州。\n请君暂上凌烟阁，\n若个书生万户侯？',
      tags: ['励志'],
      authorIndex: 0,
      likes: 45,
    },
    {
      title: '自嘲',
      content: '本是后山人，\n偶做前堂客。\n醉舞经阁半卷书，\n坐井说天阔。',
      tags: ['幽默', '哲思'],
      authorIndex: 1,
      likes: 29,
    },
    {
      title: '秋思',
      content: '枯藤老树昏鸦，\n小桥流水人家，\n古道西风瘦马。\n夕阳西下，\n断肠人在天涯。',
      tags: ['忧伤', '自然'],
      authorIndex: 2,
      likes: 38,
    },
  ];

  mockPoems.forEach(poem => {
    const author = userArray[poem.authorIndex];
    const id = uuidv4();
    const likedBy = [];
    for (let i = 0; i < poem.likes; i++) {
      likedBy.push(uuidv4());
    }
    
    poems.set(id, {
      id,
      title: poem.title,
      content: poem.content,
      authorId: author.id,
      authorName: author.nickname,
      tags: poem.tags,
      likes: poem.likes,
      likedBy,
      comments: [
        {
          id: uuidv4(),
          userId: userArray[(poem.authorIndex + 1) % 3].id,
          userName: userArray[(poem.authorIndex + 1) % 3].nickname,
          content: '好诗！意境深远，令人回味。',
          createdAt: Date.now() - 86400000,
        },
      ],
      createdAt: Date.now() - Math.random() * 86400000 * 7,
    });
  });
}

initMockData();

export const store = {
  users,
  poems,
  tokens,

  findUserByUsername(username) {
    return Array.from(users.values()).find(u => u.username === username);
  },

  findUserById(id) {
    return users.get(id);
  },

  createUser(userData) {
    const id = uuidv4();
    const user = {
      id,
      ...userData,
      bio: '',
      createdAt: Date.now(),
    };
    users.set(id, user);
    return user;
  },

  updateUser(id, updates) {
    const user = users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates };
    users.set(id, updated);
    return updated;
  },

  createToken(userId) {
    const token = uuidv4();
    tokens.set(token, userId);
    return token;
  },

  getUserIdByToken(token) {
    return tokens.get(token);
  },

  removeToken(token) {
    tokens.delete(token);
  },

  createPoem(poemData) {
    const id = uuidv4();
    const poem = {
      id,
      ...poemData,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: Date.now(),
    };
    poems.set(id, poem);
    return poem;
  },

  getPoemById(id) {
    return poems.get(id);
  },

  getPoems({ sort = 'hot', tag, userId, likedBy } = {}) {
    let poemList = Array.from(poems.values());

    if (tag && tag !== 'all') {
      poemList = poemList.filter(p => p.tags.includes(tag));
    }

    if (userId) {
      poemList = poemList.filter(p => p.authorId === userId);
    }

    if (likedBy) {
      poemList = poemList.filter(p => p.likedBy.includes(likedBy));
    }

    if (sort === 'hot') {
      poemList.sort((a, b) => b.likes - a.likes);
    } else {
      poemList.sort((a, b) => b.createdAt - a.createdAt);
    }

    return poemList;
  },

  toggleLike(poemId, userId) {
    const poem = poems.get(poemId);
    if (!poem) return null;

    const index = poem.likedBy.indexOf(userId);
    if (index > -1) {
      poem.likedBy.splice(index, 1);
      poem.likes--;
      return { poem, liked: false };
    } else {
      poem.likedBy.push(userId);
      poem.likes++;
      return { poem, liked: true };
    }
  },

  addComment(poemId, commentData) {
    const poem = poems.get(poemId);
    if (!poem) return null;

    const comment = {
      id: uuidv4(),
      ...commentData,
      createdAt: Date.now(),
    };
    poem.comments.unshift(comment);
    return comment;
  },

  getUserByToken(token) {
    const userId = tokens.get(token);
    if (!userId) return null;
    return users.get(userId);
  },
};
