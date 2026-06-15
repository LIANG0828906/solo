import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const poems = new Map();
const comments = new Map();
const versions = new Map();

const SOFT_COLORS = [
  '#a8d8b9',
  '#f7c5a0',
  '#c9b1e0',
  '#f5a8a8',
  '#a8c8f5',
  '#f5e6a8',
];

const getColorByAuthorId = (authorId) => {
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = authorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SOFT_COLORS[Math.abs(hash) % SOFT_COLORS.length];
};

const seedData = () => {
  const sampleUsers = [
    { id: 'user-1', nickname: '清風', avatar: '清' },
    { id: 'user-2', nickname: '墨白', avatar: '墨' },
    { id: 'user-3', nickname: '婉兒', avatar: '婉' },
  ];

  const samplePoems = [
    {
      id: uuidv4(),
      title: '春望',
      author: 'user-1',
      authorName: '清風',
      lines: [
        '國破山河在，城春草木深。',
        '感時花濺淚，恨別鳥驚心。',
        '烽火連三月，家書抵萬金。',
        '白頭搔更短，渾欲不勝簪。',
      ],
      lastEditor: '清風',
      lastEditTime: Date.now() - 86400000,
      createdAt: Date.now() - 604800000,
      participants: ['user-1', 'user-2'],
    },
    {
      id: uuidv4(),
      title: '靜夜思',
      author: 'user-2',
      authorName: '墨白',
      lines: [
        '床前明月光，疑是地上霜。',
        '舉頭望明月，低頭思故鄉。',
      ],
      lastEditor: '墨白',
      lastEditTime: Date.now() - 172800000,
      createdAt: Date.now() - 432000000,
      participants: ['user-2'],
    },
    {
      id: uuidv4(),
      title: '山居秋暝',
      author: 'user-3',
      authorName: '婉兒',
      lines: [
        '空山新雨後，天氣晚來秋。',
        '明月松間照，清泉石上流。',
        '竹喧歸浣女，蓮動下漁舟。',
        '隨意春芳歇，王孫自可留。',
      ],
      lastEditor: '婉兒',
      lastEditTime: Date.now() - 3600000,
      createdAt: Date.now() - 259200000,
      participants: ['user-3', 'user-1', 'user-2'],
    },
    {
      id: uuidv4(),
      title: '新詩草稿·晨曦',
      author: 'user-1',
      authorName: '清風',
      lines: [
        '東方漸白，雲海翻湧著金波，',
        '第一縷晨光穿過山巔的薄霧，',
        '落在沾滿露珠的草葉上，',
        '化作一顆顆閃爍的星。',
        '遠處的炊煙裊裊升起，',
        '混著野花的芬芳，',
        '這是新的一天，',
        '充滿希望與未知的旅程。',
      ],
      lastEditor: '清風',
      lastEditTime: Date.now(),
      createdAt: Date.now() - 7200000,
      participants: ['user-1', 'user-2', 'user-3'],
    },
  ];

  samplePoems.forEach((poem) => {
    poems.set(poem.id, poem);

    const initialVersion = {
      id: uuidv4(),
      poemId: poem.id,
      versionNumber: 1,
      lines: [...poem.lines],
      savedAt: poem.createdAt,
      editorId: poem.author,
      editorName: poem.authorName,
      charDelta: poem.lines.reduce((sum, l) => sum + l.length, 0),
    };
    const poemVersions = [initialVersion];

    if (poem.lines.length > 2) {
      const modifiedLines = [...poem.lines];
      modifiedLines[0] = modifiedLines[0] + '（初改）';
      const version2 = {
        id: uuidv4(),
        poemId: poem.id,
        versionNumber: 2,
        lines: modifiedLines,
        savedAt: poem.createdAt + 86400000,
        editorId: sampleUsers[1].id,
        editorName: sampleUsers[1].nickname,
        charDelta: 3,
      };
      poemVersions.push(version2);

      const modifiedLines2 = [...modifiedLines];
      modifiedLines2.push('（後記：未完待續）');
      const version3 = {
        id: uuidv4(),
        poemId: poem.id,
        versionNumber: 3,
        lines: modifiedLines2,
        savedAt: poem.lastEditTime,
        editorId: sampleUsers[2].id,
        editorName: sampleUsers[2].nickname,
        charDelta: 9,
      };
      poemVersions.push(version3);
    }

    versions.set(poem.id, poemVersions);

    const poemComments = [];
    const comment1 = {
      id: uuidv4(),
      poemId: poem.id,
      authorId: sampleUsers[1].id,
      authorName: sampleUsers[1].nickname,
      content: `這首${poem.title}意境深遠，開篇第一句就抓住了神韻！`,
      createdAt: poem.createdAt + 3600000,
      lineIndex: 0,
      parentId: null,
      replies: [],
    };
    poemComments.push(comment1);

    const comment1Reply = {
      id: uuidv4(),
      poemId: poem.id,
      authorId: sampleUsers[0].id,
      authorName: sampleUsers[0].nickname,
      content: '多謝墨白兄賞識，其實初稿還有很多不足之處。',
      createdAt: poem.createdAt + 7200000,
      lineIndex: 0,
      parentId: comment1.id,
      replies: [],
    };
    comment1.replies.push(comment1Reply);
    poemComments.push(comment1Reply);

    if (poem.lines.length > 3) {
      const comment2 = {
        id: uuidv4(),
        poemId: poem.id,
        authorId: sampleUsers[2].id,
        authorName: sampleUsers[2].nickname,
        content: '第三聯對仗工整，用詞考究，值得細細品味。',
        createdAt: poem.createdAt + 10800000,
        lineIndex: 2,
        parentId: null,
        replies: [],
      };
      poemComments.push(comment2);
    }

    comments.set(poem.id, poemComments);
  });

  return sampleUsers;
};

const users = seedData();

app.get('/api/users/current', (req, res) => {
  res.json(users[0]);
});

app.get('/api/poems', (req, res) => {
  const list = Array.from(poems.values()).map((p) => ({
    id: p.id,
    title: p.title,
    authorName: p.authorName,
    lastEditor: p.lastEditor,
    lastEditTime: p.lastEditTime,
    participantCount: p.participants.length,
    lineCount: p.lines.length,
  }));
  list.sort((a, b) => b.lastEditTime - a.lastEditTime);
  res.json(list);
});

app.get('/api/poems/user/:userId', (req, res) => {
  const { userId } = req.params;
  const list = Array.from(poems.values())
    .filter((p) => p.participants.includes(userId))
    .map((p) => ({
      id: p.id,
      title: p.title,
      authorName: p.authorName,
      lastEditTime: p.lastEditTime,
      participantCount: p.participants.length,
      lineCount: p.lines.length,
    }));
  list.sort((a, b) => b.lastEditTime - a.lastEditTime);
  res.json(list);
});

app.get('/api/poems/:id', (req, res) => {
  const poem = poems.get(req.params.id);
  if (!poem) {
    return res.status(404).json({ error: 'Poem not found' });
  }
  res.json(poem);
});

app.put('/api/poems/:id', (req, res) => {
  const { id } = req.params;
  const poem = poems.get(id);
  if (!poem) {
    return res.status(404).json({ error: 'Poem not found' });
  }
  const { lines, editorId, editorName, title } = req.body;

  const oldText = poem.lines.join('');
  const newText = lines.join('');
  const charDelta = newText.length - oldText.length;

  const currentVersions = versions.get(id) || [];
  const newVersion = {
    id: uuidv4(),
    poemId: id,
    versionNumber: currentVersions.length + 1,
    lines: [...lines],
    savedAt: Date.now(),
    editorId,
    editorName,
    charDelta,
  };
  currentVersions.push(newVersion);
  versions.set(id, currentVersions);

  poem.lines = lines;
  poem.lastEditTime = newVersion.savedAt;
  poem.lastEditor = editorName;
  if (title) poem.title = title;

  res.json({ poem, newVersion });
});

app.post('/api/poems', (req, res) => {
  const { title, lines, authorId, authorName } = req.body;
  const id = uuidv4();
  const now = Date.now();
  const poem = {
    id,
    title: title || '無題',
    author: authorId,
    authorName,
    lines: lines || [''],
    lastEditor: authorName,
    lastEditTime: now,
    createdAt: now,
    participants: [authorId],
  };
  poems.set(id, poem);

  const initialVersion = {
    id: uuidv4(),
    poemId: id,
    versionNumber: 1,
    lines: [...lines],
    savedAt: now,
    editorId: authorId,
    editorName: authorName,
    charDelta: lines.reduce((sum, l) => sum + l.length, 0),
  };
  versions.set(id, [initialVersion]);
  comments.set(id, []);

  res.status(201).json(poem);
});

app.get('/api/poems/:id/comments', (req, res) => {
  const poemComments = comments.get(req.params.id) || [];
  const sorted = [...poemComments].sort((a, b) => b.createdAt - a.createdAt);
  res.json(sorted);
});

app.post('/api/poems/:id/comments', (req, res) => {
  const { id } = req.params;
  if (!poems.has(id)) {
    return res.status(404).json({ error: 'Poem not found' });
  }
  const { authorId, authorName, content, lineIndex, parentId } = req.body;
  const comment = {
    id: uuidv4(),
    poemId: id,
    authorId,
    authorName,
    content: content.substring(0, 200),
    createdAt: Date.now(),
    lineIndex: lineIndex ?? null,
    parentId: parentId || null,
    replies: [],
  };

  const poemComments = comments.get(id) || [];
  if (parentId) {
    const parent = poemComments.find((c) => c.id === parentId);
    if (parent) {
      parent.replies.push(comment);
    }
  }
  poemComments.push(comment);
  comments.set(id, poemComments);

  if (!poems.get(id).participants.includes(authorId)) {
    poems.get(id).participants.push(authorId);
  }

  res.status(201).json(comment);
});

app.get('/api/comments/user/:userId', (req, res) => {
  const { userId } = req.params;
  const result = [];
  comments.forEach((poemComments, poemId) => {
    const poem = poems.get(poemId);
    poemComments.forEach((c) => {
      if (c.authorId === userId) {
        result.push({
          id: c.id,
          poemId,
          poemTitle: poem?.title || '未知詩歌',
          content: c.content,
          contentPreview: c.content.substring(0, 60) + (c.content.length > 60 ? '...' : ''),
          createdAt: c.createdAt,
          lineIndex: c.lineIndex,
        });
      }
    });
  });
  result.sort((a, b) => b.createdAt - a.createdAt);
  res.json(result);
});

app.get('/api/poems/:id/versions', (req, res) => {
  const poemVersions = versions.get(req.params.id) || [];
  const sorted = [...poemVersions].sort((a, b) => b.versionNumber - a.versionNumber);
  res.json(sorted);
});

app.get('/api/users/:id/color', (req, res) => {
  res.json({ color: getColorByAuthorId(req.params.id) });
});

app.listen(PORT, () => {
  console.log(`📜 詩箋服務器已啟動: http://localhost:${PORT}`);
  console.log(`  測試用戶: ${users.map((u) => u.nickname).join(', ')}`);
  console.log(`  當前詩歌數: ${poems.size}`);
});
