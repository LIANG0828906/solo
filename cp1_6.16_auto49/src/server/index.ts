import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Pledge, PledgeRequest, PledgeResponse, RewardTier } from './types';
import { projects, pledges } from './data';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/api/projects', (req, res) => {
  const status = req.query.status as string;
  let result = [...projects];
  if (status) {
    result = result.filter(p => p.status === status);
  }
  result.sort((a, b) => {
    const progressA = a.currentAmount / a.targetAmount;
    const progressB = b.currentAmount / b.targetAmount;
    return progressB - progressA;
  });
  res.json(result);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const { name, coverImage, targetAmount, deadline, description, rewardTiers } = req.body;
  
  if (!name || !coverImage || !targetAmount || !deadline || !description || !rewardTiers) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  
  if (targetAmount < 1000 || targetAmount > 100000) {
    return res.status(400).json({ error: '目标金额必须在1000-100000元之间' });
  }
  
  if (rewardTiers.length < 3) {
    return res.status(400).json({ error: '至少需要3个回报档位' });
  }
  
  const tiers: RewardTier[] = rewardTiers.map((tier: Omit<RewardTier, 'id' | 'pledged'>) => ({
    ...tier,
    id: uuidv4(),
    pledged: 0,
  }));
  
  const newProject: Project = {
    id: uuidv4(),
    name,
    coverImage,
    targetAmount,
    currentAmount: 0,
    deadline,
    description,
    rewardTiers: tiers,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  projects.push(newProject);
  res.status(201).json(newProject);
});

app.post('/api/projects/:id/approve', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  project.status = 'approved';
  res.json(project);
});

app.post('/api/projects/pledge', (req, res) => {
  const { projectId, tierId, nickname, email, message }: PledgeRequest = req.body;
  
  if (!projectId || !tierId || !nickname || !email) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  
  if (project.status !== 'approved') {
    return res.status(400).json({ error: '项目未发布，无法认筹' });
  }
  
  const tier = project.rewardTiers.find(t => t.id === tierId);
  if (!tier) {
    return res.status(404).json({ error: '回报档位不存在' });
  }
  
  if (tier.pledged >= tier.limit) {
    return res.status(400).json({ error: '该档位已被认筹完毕' });
  }
  
  const pledgeId = uuidv4();
  const pledge: Pledge = {
    id: pledgeId,
    projectId,
    tierId,
    nickname,
    email,
    message: message || '',
    amount: tier.amount,
    createdAt: new Date().toISOString(),
  };
  
  pledges.push(pledge);
  project.currentAmount += tier.amount;
  tier.pledged += 1;
  
  const response: PledgeResponse = {
    pledgeId,
    project,
  };
  
  res.json(response);
});

app.get('/api/projects/:id/pledges', (req, res) => {
  const projectPledges = pledges
    .filter(p => p.projectId === req.params.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(projectPledges);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
