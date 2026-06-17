import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Idea, Comment } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Data {
  ideas: Idea[];
  comments: Comment[];
}

const defaultData: Data = {
  ideas: [
    {
      id: uuidv4(),
      title: '智能会议助手',
      description: '开发一个AI驱动的会议助手，可以自动记录会议内容、生成会议纪要、识别行动项并分配给相关人员，同时支持语音转文字和多语言翻译功能。让每场会议都变得高效且有成果。',
      author: '张明',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
      likes: 42,
      likedBy: ['user1', 'user2'],
      commentCount: 8,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: uuidv4(),
      title: '团队健康度仪表板',
      description: '创建一个团队健康度实时监控面板，追踪项目进度、代码质量、团队士气等关键指标，通过可视化图表帮助管理者快速发现问题并做出决策。',
      author: '李华',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua',
      likes: 38,
      likedBy: ['user3'],
      commentCount: 5,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: uuidv4(),
      title: '创意灵感墙AR版',
      description: '利用增强现实技术，将团队的创意点子投射到真实物理空间中，成员可以通过手势交互进行分类、连接和投票，让头脑风暴变得更加沉浸和有趣。',
      author: '王芳',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang',
      likes: 56,
      likedBy: ['user1', 'user4', 'user5'],
      commentCount: 12,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: uuidv4(),
      title: '代码评审游戏化系统',
      description: '将代码评审变成游戏，开发者完成PR评审获得经验值和徽章，高质量评审获得额外奖励，设立月度排行榜激励团队提升代码质量。',
      author: '陈伟',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenwei',
      likes: 31,
      likedBy: [],
      commentCount: 6,
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date(Date.now() - 345600000).toISOString()
    },
    {
      id: uuidv4(),
      title: '远程团队虚拟办公室',
      description: '打造一个2D虚拟办公室，每个团队成员有自己的工位，可以自由走动拜访同事，支持即时语音通话、屏幕共享，营造远程办公的社交氛围。',
      author: '刘洋',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang',
      likes: 47,
      likedBy: ['user2', 'user6'],
      commentCount: 9,
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      updatedAt: new Date(Date.now() - 432000000).toISOString()
    },
    {
      id: uuidv4(),
      title: '自动化周报生成器',
      description: '自动收集Git提交、Jira任务、会议记录等数据，AI分析后生成个性化周报，节省团队成员写周报的时间，让汇报更高效。',
      author: '赵雪',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoxue',
      likes: 29,
      likedBy: [],
      commentCount: 4,
      createdAt: new Date(Date.now() - 518400000).toISOString(),
      updatedAt: new Date(Date.now() - 518400000).toISOString()
    },
    {
      id: uuidv4(),
      title: '技能树可视化平台',
      description: '为每个团队成员建立技能树，展示技术栈掌握程度、项目经验和学习路径，方便管理者了解团队能力分布，也帮助成员规划职业发展。',
      author: '孙磊',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunlei',
      likes: 35,
      likedBy: ['user7'],
      commentCount: 7,
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      updatedAt: new Date(Date.now() - 604800000).toISOString()
    },
    {
      id: uuidv4(),
      title: '情绪感知工作环境',
      description: '通过匿名情绪打卡和AI情感分析，实时感知团队整体情绪状态，当压力过高时自动推送放松活动建议，帮助维护团队心理健康。',
      author: '周婷',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouting',
      likes: 25,
      likedBy: [],
      commentCount: 3,
      createdAt: new Date(Date.now() - 691200000).toISOString(),
      updatedAt: new Date(Date.now() - 691200000).toISOString()
    },
    {
      id: uuidv4(),
      title: '知识库智能推荐引擎',
      description: '基于团队文档和项目历史，构建智能知识库，当开发者遇到问题时，自动推荐相关的解决方案和文档，减少重复踩坑。',
      author: '吴强',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wuqiang',
      likes: 52,
      likedBy: ['user1', 'user8', 'user9'],
      commentCount: 11,
      createdAt: new Date(Date.now() - 777600000).toISOString(),
      updatedAt: new Date(Date.now() - 777600000).toISOString()
    },
    {
      id: uuidv4(),
      title: '跨时区协作时间管家',
      description: '智能协调跨时区团队的工作时间，自动找出最佳会议窗口，异步任务优先级排序，确保全球团队高效协作无阻碍。',
      author: '郑丽',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengli',
      likes: 33,
      likedBy: ['user10'],
      commentCount: 5,
      createdAt: new Date(Date.now() - 864000000).toISOString(),
      updatedAt: new Date(Date.now() - 864000000).toISOString()
    },
    {
      id: uuidv4(),
      title: '配对编程智能匹配',
      description: '根据技能互补性和协作风格，智能推荐配对编程伙伴，自动安排结对日程，并记录协作效果持续优化匹配算法。',
      author: '黄杰',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huangjie',
      likes: 22,
      likedBy: [],
      commentCount: 2,
      createdAt: new Date(Date.now() - 950400000).toISOString(),
      updatedAt: new Date(Date.now() - 950400000).toISOString()
    },
    {
      id: uuidv4(),
      title: '项目风险雷达',
      description: '通过分析代码提交频率、Bug增长趋势、任务延期情况等数据，构建项目风险雷达图，提前预警潜在风险帮助项目经理及时介入。',
      author: '林娜',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina',
      likes: 44,
      likedBy: ['user4', 'user11'],
      commentCount: 8,
      createdAt: new Date(Date.now() - 1036800000).toISOString(),
      updatedAt: new Date(Date.now() - 1036800000).toISOString()
    }
  ],
  comments: []
};

const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'db.json');

const adapter = new JSONFile<Data>(dbFile);
const db = new Low(adapter, defaultData);

await db.read();
await db.write();

const app = express();
app.use(cors());
app.use(express.json());

const calculateHotScore = (idea: Idea): number => {
  const now = Date.now();
  const createdAt = new Date(idea.createdAt).getTime();
  const ageInHours = Math.max(1, (now - createdAt) / (1000 * 60 * 60));
  return (idea.likes * 2 + idea.commentCount * 3) / Math.pow(ageInHours, 0.5);
};

app.get('/api/ideas', async (req, res) => {
  await db.read();
  const search = (req.query.search as string)?.toLowerCase() || '';
  
  let ideas = db.data.ideas;
  if (search) {
    ideas = ideas.filter(
      idea => 
        idea.title.toLowerCase().includes(search) || 
        idea.description.toLowerCase().includes(search)
    );
  }
  
  res.json(ideas);
});

app.get('/api/ideas/:id', async (req, res) => {
  await db.read();
  const idea = db.data.ideas.find(i => i.id === req.params.id);
  if (!idea) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }
  res.json(idea);
});

app.post('/api/ideas', async (req, res) => {
  await db.read();
  const { title, description, author, avatar } = req.body;
  
  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required' });
    return;
  }
  
  const newIdea: Idea = {
    id: uuidv4(),
    title,
    description,
    author: author || '匿名用户',
    avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous',
    likes: 0,
    likedBy: [],
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.data.ideas.unshift(newIdea);
  await db.write();
  res.status(201).json(newIdea);
});

app.put('/api/ideas/:id', async (req, res) => {
  await db.read();
  const index = db.data.ideas.findIndex(i => i.id === req.params.id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }
  
  const { title, description } = req.body;
  db.data.ideas[index] = {
    ...db.data.ideas[index],
    title: title || db.data.ideas[index].title,
    description: description || db.data.ideas[index].description,
    updatedAt: new Date().toISOString()
  };
  
  await db.write();
  res.json(db.data.ideas[index]);
});

app.delete('/api/ideas/:id', async (req, res) => {
  await db.read();
  const index = db.data.ideas.findIndex(i => i.id === req.params.id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }
  
  db.data.ideas.splice(index, 1);
  db.data.comments = db.data.comments.filter(c => c.ideaId !== req.params.id);
  await db.write();
  res.status(204).send();
});

app.post('/api/ideas/:id/like', async (req, res) => {
  await db.read();
  const idea = db.data.ideas.find(i => i.id === req.params.id);
  const { userId } = req.body;
  
  if (!idea) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }
  
  const userIdentifier = userId || 'anonymous';
  
  if (idea.likedBy.includes(userIdentifier)) {
    idea.likedBy = idea.likedBy.filter(u => u !== userIdentifier);
    idea.likes = Math.max(0, idea.likes - 1);
  } else {
    idea.likedBy.push(userIdentifier);
    idea.likes += 1;
  }
  
  idea.updatedAt = new Date().toISOString();
  await db.write();
  res.json({ likes: idea.likes, liked: idea.likedBy.includes(userIdentifier) });
});

app.get('/api/ideas/:id/comments', async (req, res) => {
  await db.read();
  const comments = db.data.comments.filter(c => c.ideaId === req.params.id);
  res.json(comments);
});

app.post('/api/ideas/:id/comments', async (req, res) => {
  await db.read();
  const idea = db.data.ideas.find(i => i.id === req.params.id);
  
  if (!idea) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }
  
  const { author, avatar, content } = req.body;
  
  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }
  
  const newComment: Comment = {
    id: uuidv4(),
    ideaId: req.params.id,
    author: author || '匿名用户',
    avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous',
    content,
    createdAt: new Date().toISOString()
  };
  
  db.data.comments.push(newComment);
  idea.commentCount += 1;
  idea.updatedAt = new Date().toISOString();
  await db.write();
  res.status(201).json(newComment);
});

app.get('/api/ranking', async (req, res) => {
  await db.read();
  
  const ranked = db.data.ideas
    .map(idea => ({
      id: idea.id,
      title: idea.title,
      likes: idea.likes,
      commentCount: idea.commentCount,
      hotScore: calculateHotScore(idea)
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, 10);
  
  res.json(ranked);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
