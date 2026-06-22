import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Project, Bid, Message, Contract } from '../src/ApiProxy';

const router = Router();

const projects: Project[] = [
  {
    id: 'p1',
    name: '企业官网重构项目',
    budgetMin: 20,
    budgetMax: 35,
    description: '需要对现有企业官网进行全面重构，包括前端UI重新设计、后端接口优化、响应式适配等。要求采用现代化技术栈，支持SEO优化，页面加载速度提升50%以上。',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    publisher: '张经理',
  },
  {
    id: 'p2',
    name: '移动端App开发',
    budgetMin: 50,
    budgetMax: 80,
    description: '开发一款iOS和Android双平台的电商类应用，包含商品浏览、购物车、订单管理、支付集成、用户中心等核心功能模块。',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    publisher: '张经理',
  },
  {
    id: 'p3',
    name: '数据分析平台建设',
    budgetMin: 100,
    budgetMax: 150,
    description: '搭建企业级数据分析平台，实现多数据源接入、可视化报表、实时数据监控、数据挖掘等功能。',
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'expired',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    publisher: '张经理',
  },
  {
    id: 'p4',
    name: '内部OA系统升级',
    budgetMin: 15,
    budgetMax: 25,
    description: '对现有OA系统进行功能升级，新增审批流程、考勤管理、会议预约等模块。',
    deadline: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'closed',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    publisher: '张经理',
  },
];

const bids: Bid[] = [
  {
    id: 'b1',
    projectId: 'p1',
    contractorName: '华信科技有限公司',
    price: 25,
    duration: 45,
    planSummary: '采用React+Node.js技术栈，分UI设计、前端开发、后端开发、测试上线四个阶段，配备5人专业团队。',
    attachmentUrl: 'https://example.com/plan1.pdf',
    status: 'shortlisted',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'b2',
    projectId: 'p1',
    contractorName: '创新软件工作室',
    price: 28,
    duration: 40,
    planSummary: '使用Vue3+SpringBoot架构，注重性能优化和用户体验，提供3个月免费维护期。',
    attachmentUrl: '',
    status: 'pending',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'b3',
    projectId: 'p1',
    contractorName: '卓越数字科技',
    price: 32,
    duration: 50,
    planSummary: '全栈定制开发，包含完整的UI/UX设计、前后端开发、测试部署和运维支持。',
    attachmentUrl: 'https://example.com/plan3.pdf',
    status: 'rejected',
    submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'b4',
    projectId: 'p1',
    contractorName: '星辰互联网公司',
    price: 22,
    duration: 35,
    planSummary: '敏捷开发模式，快速迭代交付，2周内完成原型设计，4周完成核心功能。',
    attachmentUrl: 'https://example.com/plan4.pdf',
    status: 'shortlisted',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'b5',
    projectId: 'p2',
    contractorName: '移动开发专家团队',
    price: 65,
    duration: 90,
    planSummary: '使用Flutter跨平台框架，一次开发双端部署，支持离线功能和推送通知。',
    attachmentUrl: '',
    status: 'pending',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'b6',
    projectId: 'p2',
    contractorName: 'App工坊科技',
    price: 58,
    duration: 75,
    planSummary: '原生开发，Swift+Kotlin，性能最优，集成微信、支付宝、银联等多种支付方式。',
    attachmentUrl: 'https://example.com/plan6.pdf',
    status: 'shortlisted',
    submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

const messages: Message[] = [
  {
    id: 'm1',
    bidId: 'b1',
    senderId: 'contractor-1',
    senderName: '华信科技有限公司',
    senderRole: 'contractor',
    content: '您好，我们对贵公司的官网重构项目非常感兴趣，已提交详细方案，请查阅。',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'read',
  },
  {
    id: 'm2',
    bidId: 'b1',
    senderId: 'publisher-1',
    senderName: '张经理',
    senderRole: 'publisher',
    content: '已收到你们的方案，整体看下来还不错。请问报价25万是否有下浮空间？',
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    status: 'read',
  },
  {
    id: 'm3',
    bidId: 'b1',
    senderId: 'contractor-1',
    senderName: '华信科技有限公司',
    senderRole: 'contractor',
    content: '如果项目能快速签约的话，我们可以给到23.5万的合作价，同时赠送1年免费技术维护。',
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    status: 'read',
  },
  {
    id: 'm4',
    bidId: 'b1',
    senderId: 'publisher-1',
    senderName: '张经理',
    senderRole: 'publisher',
    content: '这个价格很有诚意！工期方面能否再缩短一些？我们希望能在40天内完成。',
    timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
  },
  {
    id: 'm5',
    bidId: 'b4',
    senderId: 'contractor-2',
    senderName: '星辰互联网公司',
    senderRole: 'contractor',
    content: '张经理您好，我们方案中的35天工期是极限了，但我们可以增加1名前端开发人员确保按时交付。',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
  },
  {
    id: 'm6',
    bidId: 'b6',
    senderId: 'contractor-3',
    senderName: 'App工坊科技',
    senderRole: 'contractor',
    content: '您好，我们已针对App开发项目提交了投标方案，请问有什么疑问可以随时沟通。',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'sent',
  },
];

const contracts: Contract[] = [];

function delay<T>(data: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// Projects
router.get('/projects', async (req: Request, res: Response) => {
  await delay(null, 200);
  res.json(projects);
});

router.get('/projects/:id', async (req: Request, res: Response) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  await delay(null, 100);
  res.json(project);
});

router.post('/projects', async (req: Request, res: Response) => {
  const { name, budgetMin, budgetMax, description, deadline, publisher } = req.body;
  const newProject: Project = {
    id: 'p' + uuidv4().slice(0, 8),
    name,
    budgetMin: Number(budgetMin),
    budgetMax: Number(budgetMax),
    description: description || '',
    deadline: new Date(deadline).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    publisher: publisher || '张经理',
  };
  projects.unshift(newProject);
  await delay(null, 200);
  res.json(newProject);
});

router.put('/projects/:id', async (req: Request, res: Response) => {
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '项目不存在' });
  projects[idx] = { ...projects[idx], ...req.body };
  if (req.body.deadline) {
    projects[idx].deadline = new Date(req.body.deadline).toISOString();
  }
  await delay(null, 150);
  res.json(projects[idx]);
});

router.post('/projects/:id/close', async (req: Request, res: Response) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  project.status = 'closed';
  await delay(null, 100);
  res.json(project);
});

// Bids
router.get('/bids', async (req: Request, res: Response) => {
  const { projectId } = req.query;
  let result = bids;
  if (projectId) {
    result = bids.filter((b) => b.projectId === projectId);
  }
  await delay(null, 150);
  res.json(result);
});

router.post('/bids', async (req: Request, res: Response) => {
  const { projectId, contractorName, price, duration, planSummary, attachmentUrl } = req.body;
  const newBid: Bid = {
    id: 'b' + uuidv4().slice(0, 8),
    projectId,
    contractorName,
    price: Number(price),
    duration: Number(duration),
    planSummary: planSummary || '',
    attachmentUrl: attachmentUrl || '',
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  bids.push(newBid);
  await delay(null, 200);
  res.json(newBid);
});

router.put('/bids/:id/status', async (req: Request, res: Response) => {
  const bid = bids.find((b) => b.id === req.params.id);
  if (!bid) return res.status(404).json({ error: '投标不存在' });
  bid.status = req.body.status;
  await delay(null, 100);
  res.json(bid);
});

// Messages
router.get('/messages', async (req: Request, res: Response) => {
  const { bidId } = req.query;
  let result = messages;
  if (bidId) {
    result = messages.filter((m) => m.bidId === bidId);
  }
  result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  await delay(null, 200);
  res.json(result);
});

router.post('/messages', async (req: Request, res: Response) => {
  const { bidId, senderId, senderName, senderRole, content } = req.body;
  const newMsg: Message = {
    id: 'm' + uuidv4().slice(0, 8),
    bidId,
    senderId,
    senderName,
    senderRole,
    content,
    timestamp: new Date().toISOString(),
    status: 'sent',
  };
  messages.push(newMsg);
  await delay(null, 250);
  res.json(newMsg);
});

// Contracts
router.get('/contracts', async (req: Request, res: Response) => {
  await delay(null, 200);
  res.json(contracts);
});

router.post('/contracts', async (req: Request, res: Response) => {
  const { projectId, projectName, bidId, publisherName, contractorName, finalPrice, finalDuration, description } = req.body;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqNo = String(contracts.length + 1).padStart(4, '0');
  const newContract: Contract = {
    id: 'c' + uuidv4().slice(0, 8),
    contractNo: `HT-${dateStr}-${seqNo}`,
    projectId,
    projectName,
    bidId,
    publisherName,
    contractorName,
    finalPrice: Number(finalPrice),
    finalDuration: Number(finalDuration),
    description,
    signedAt: null,
    status: 'pending',
    publisherSigned: false,
    contractorSigned: false,
  };
  contracts.unshift(newContract);
  await delay(null, 300);
  res.json(newContract);
});

router.post('/contracts/:id/sign', async (req: Request, res: Response) => {
  const contract = contracts.find((c) => c.id === req.params.id);
  if (!contract) return res.status(404).json({ error: '合同不存在' });
  const { role } = req.body;
  if (role === 'publisher') contract.publisherSigned = true;
  if (role === 'contractor') contract.contractorSigned = true;
  if (contract.publisherSigned && contract.contractorSigned) {
    contract.status = 'active';
    contract.signedAt = new Date().toISOString();
  }
  await delay(null, 200);
  res.json(contract);
});

export default router;
