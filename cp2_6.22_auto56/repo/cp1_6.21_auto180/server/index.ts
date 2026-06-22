import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Paragraph {
  id: string;
  content: string;
  author: string;
  createdAt: number;
  branchId: string;
  parentParagraphId: string | null;
}

interface Branch {
  id: string;
  name: string;
  storyId: string;
  parentBranchId: string | null;
  parentParagraphId: string | null;
  createdAt: number;
}

interface Story {
  id: string;
  title: string;
  createdAt: number;
  branches: Branch[];
  paragraphs: Paragraph[];
  activeBranchId: string;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let stories: Story[] = [];

function generateBranchName(storyBranches: Branch[]): string {
  const count = storyBranches.length;
  return `分支-${count + 1}`;
}

function initializeSampleData(): void {
  const storyId = uuidv4();
  const mainBranchId = uuidv4();
  const branch2Id = uuidv4();
  const branch3Id = uuidv4();

  const now = Date.now();
  const hour = 60 * 60 * 1000;

  const mainBranch: Branch = {
    id: mainBranchId,
    name: '主线',
    storyId,
    parentBranchId: null,
    parentParagraphId: null,
    createdAt: now - 5 * hour,
  };

  const branch2: Branch = {
    id: branch2Id,
    name: '分支-2',
    storyId,
    parentBranchId: mainBranchId,
    parentParagraphId: 'p2',
    createdAt: now - 3 * hour,
  };

  const branch3: Branch = {
    id: branch3Id,
    name: '分支-3',
    storyId,
    parentBranchId: branch2Id,
    parentParagraphId: 'p5',
    createdAt: now - 1 * hour,
  };

  const paragraphs: Paragraph[] = [
    {
      id: 'p1',
      content: '在一个遥远的王国里，有一位勇敢的王子，他从小就梦想着能探索世界的每一个角落。',
      author: '爱丽丝',
      createdAt: now - 5 * hour,
      branchId: mainBranchId,
      parentParagraphId: null,
    },
    {
      id: 'p2',
      content: '有一天，王子收到了一封来自神秘巫师的信，信中提到了一个被遗忘的宝藏。',
      author: '鲍勃',
      createdAt: now - 4 * hour,
      branchId: mainBranchId,
      parentParagraphId: 'p1',
    },
    {
      id: 'p3',
      content: '王子决定踏上寻宝之旅，他穿过了茂密的森林，跨过了湍急的河流。',
      author: '查理',
      createdAt: now - 3 * hour,
      branchId: mainBranchId,
      parentParagraphId: 'p2',
    },
    {
      id: 'p4',
      content: '经过漫长的旅途，王子终于来到了宝藏所在的山洞前。',
      author: '爱丽丝',
      createdAt: now - 2 * hour,
      branchId: mainBranchId,
      parentParagraphId: 'p3',
    },
    {
      id: 'p5',
      content: '然而，王子并没有直接前往山洞，而是决定先回到王国，召集更多的伙伴一起探险。',
      author: '戴安娜',
      createdAt: now - 3 * hour,
      branchId: branch2Id,
      parentParagraphId: 'p2',
    },
    {
      id: 'p6',
      content: '王子在王国里发布了公告，许多勇敢的冒险者纷纷响应，加入了他的队伍。',
      author: '鲍勃',
      createdAt: now - 2 * hour,
      branchId: branch2Id,
      parentParagraphId: 'p5',
    },
    {
      id: 'p7',
      content: '在出发前，一位神秘的老人找到了王子，送给了他一张古老的地图，上面标记着通往宝藏的另一条路。',
      author: '查理',
      createdAt: now - 1 * hour,
      branchId: branch2Id,
      parentParagraphId: 'p6',
    },
    {
      id: 'p8',
      content: '王子决定按照老人的地图前行，这条路虽然更加危险，但据说能避开守护宝藏的恶龙。',
      author: '戴安娜',
      createdAt: now - 30 * 60 * 1000,
      branchId: branch3Id,
      parentParagraphId: 'p5',
    },
    {
      id: 'p9',
      content: '他们穿过了一片被诅咒的沼泽，那里有许多诡异的生物在暗处潜伏。',
      author: '爱丽丝',
      createdAt: now - 15 * 60 * 1000,
      branchId: branch3Id,
      parentParagraphId: 'p8',
    },
  ];

  stories.push({
    id: storyId,
    title: '神秘的宝藏之旅',
    createdAt: now - 5 * hour,
    branches: [mainBranch, branch2, branch3],
    paragraphs,
    activeBranchId: mainBranchId,
  });
}

initializeSampleData();

app.get('/api/stories', (_req, res) => {
  res.json(stories);
});

app.get('/api/stories/:id', (req, res) => {
  const story = stories.find(s => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  res.json(story);
});

app.post('/api/stories', (req, res) => {
  const { title, firstParagraph, author } = req.body as {
    title: string;
    firstParagraph: string;
    author: string;
  };

  if (!title || !firstParagraph || !author) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const storyId = uuidv4();
  const branchId = uuidv4();
  const paragraphId = uuidv4();

  const branch: Branch = {
    id: branchId,
    name: '主线',
    storyId,
    parentBranchId: null,
    parentParagraphId: null,
    createdAt: Date.now(),
  };

  const paragraph: Paragraph = {
    id: paragraphId,
    content: firstParagraph,
    author,
    createdAt: Date.now(),
    branchId,
    parentParagraphId: null,
  };

  const story: Story = {
    id: storyId,
    title,
    createdAt: Date.now(),
    branches: [branch],
    paragraphs: [paragraph],
    activeBranchId: branchId,
  };

  stories.push(story);
  res.status(201).json(story);
});

app.post('/api/stories/:id/paragraphs', (req, res) => {
  const story = stories.find(s => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  const { content, author, branchId } = req.body as {
    content: string;
    author: string;
    branchId: string;
  };

  if (!content || !author || !branchId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const branch = story.branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  const branchParagraphs = story.paragraphs.filter(p => p.branchId === branchId);
  let lastParagraphId: string | null = null;
  let currentId: string | null = null;

  while (true) {
    const next = branchParagraphs.find(p => p.parentParagraphId === currentId);
    if (!next) break;
    lastParagraphId = next.id;
    currentId = next.id;
  }

  const paragraph: Paragraph = {
    id: uuidv4(),
    content,
    author,
    createdAt: Date.now(),
    branchId,
    parentParagraphId: lastParagraphId,
  };

  story.paragraphs.push(paragraph);
  res.json(story);
});

app.get('/api/branches', (req, res) => {
  const { storyId } = req.query;
  if (!storyId) {
    return res.status(400).json({ error: 'storyId query parameter is required' });
  }

  const story = stories.find(s => s.id === storyId);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  res.json(story.branches);
});

app.post('/api/branches', (req, res) => {
  const { storyId, parentBranchId, parentParagraphId, author } = req.body as {
    storyId: string;
    parentBranchId: string;
    parentParagraphId: string;
    author: string;
  };

  if (!storyId || !parentBranchId || !parentParagraphId || !author) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const story = stories.find(s => s.id === storyId);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  const parentBranch = story.branches.find(b => b.id === parentBranchId);
  if (!parentBranch) {
    return res.status(404).json({ error: 'Parent branch not found' });
  }

  const parentParagraph = story.paragraphs.find(p => p.id === parentParagraphId);
  if (!parentParagraph) {
    return res.status(404).json({ error: 'Parent paragraph not found' });
  }

  const branch: Branch = {
    id: uuidv4(),
    name: generateBranchName(story.branches),
    storyId,
    parentBranchId,
    parentParagraphId,
    createdAt: Date.now(),
  };

  story.branches.push(branch);
  res.status(201).json(branch);
});

app.put('/api/branches/:id/activate', (req, res) => {
  const { storyId } = req.body as { storyId: string };
  if (!storyId) {
    return res.status(400).json({ error: 'storyId is required' });
  }

  const story = stories.find(s => s.id === storyId);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  const branch = story.branches.find(b => b.id === req.params.id);
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  story.activeBranchId = branch.id;
  res.json(story);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
