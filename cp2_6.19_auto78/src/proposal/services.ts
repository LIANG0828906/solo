import type { Proposal, Comment, PaginationParams, PaginationResult, UserVote, VoteType } from './types';

const PROPOSALS_KEY = 'creative_proposals';
const COMMENTS_KEY = 'creative_comments';
const USER_VOTES_KEY = 'creative_user_votes';
const CURRENT_USER_KEY = 'creative_current_user';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateAvatar = (name: string): string => {
  const colors = [
    ['#1abc9c', '#16a085'],
    ['#3498db', '#2980b9'],
    ['#9b59b6', '#8e44ad'],
    ['#e74c3c', '#c0392b'],
    ['#f39c12', '#e67e22'],
    ['#1dd1a1', '#10ac84'],
    ['#54a0ff', '#2e86de'],
    ['#5f27cd', '#341f97'],
    ['#ff6b6b', '#ee5253'],
    ['#00d2d3', '#01a3a4'],
  ];
  const index = name.charCodeAt(0) % colors.length;
  const [c1, c2] = colors[index];
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
};

const sampleProposals: Proposal[] = [
  {
    id: 'p1',
    title: '引入AI代码审查助手提升开发效率',
    summary: '建议引入基于大语言模型的代码审查工具，自动检测代码缺陷、优化建议和安全漏洞，将代码审查效率提升50%以上。',
    content: `## 背景

当前团队代码审查主要依赖人工，随着项目规模扩大，审查周期越来越长，且容易遗漏一些潜在问题。

## 方案

引入AI代码审查助手，具备以下能力：

- **自动检测**：代码风格、潜在bug、安全漏洞
- **智能建议**：性能优化、重构建议
- **学习能力**：基于团队代码规范持续学习

## 预期收益

1. 代码审查效率提升 50%
2. 代码质量显著改善
3. 新人上手速度加快

## 实施计划

- 第一阶段：试点项目验证
- 第二阶段：全团队推广
- 第三阶段：深度集成`,
    category: '技术',
    status: '已通过',
    authorId: 'u1',
    authorName: '张明',
    authorAvatar: '',
    upVotes: 42,
    downVotes: 3,
    commentCount: 8,
    isPinned: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'p2',
    title: '内部知识库共建计划',
    summary: '建立公司内部知识库平台，鼓励员工分享技术文章、项目经验和最佳实践，打造学习型组织。',
    content: `## 目标

构建一个开放、活跃的内部知识分享平台，让每个人的经验都能被沉淀和复用。

## 核心功能

- Markdown 文档编辑
- 分类标签管理
- 搜索与推荐
- 点赞评论互动
- 积分激励体系

## 运营策略

- 每周精选推荐
- 月度优秀作者奖励
- 部门知识覆盖率考核`,
    category: '管理',
    status: '已通过',
    authorId: 'u2',
    authorName: '李华',
    authorAvatar: '',
    upVotes: 38,
    downVotes: 2,
    commentCount: 12,
    isPinned: false,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'p3',
    title: '弹性工作制试点方案',
    summary: '建议在技术部门试点弹性工作制，员工可自主选择上下班时间，提高工作生活平衡和幸福感。',
    content: `## 背景

现代工作更注重产出而非工时，固定上下班时间已不适配创意型工作。

## 方案详情

- 核心工作时间：10:00 - 16:00 必须在线
- 弹性时段：早7-10点 / 晚16-19点
- 每周可申请1天远程办公

## 配套措施

- 目标管理（OKR）
- 异步沟通机制
- 定期同步会议

## 评估指标

- 项目交付率
- 员工满意度
- 协作效率`,
    category: '管理',
    status: '审核中',
    authorId: 'u3',
    authorName: '王芳',
    authorAvatar: '',
    upVotes: 56,
    downVotes: 8,
    commentCount: 24,
    isPinned: false,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'p4',
    title: '品牌短视频营销计划',
    summary: '利用短视频平台进行品牌传播，计划每月产出4-6条高质量短视频内容，覆盖抖音、视频号等平台。',
    content: `## 市场分析

短视频用户规模持续增长，已成为品牌触达年轻用户的重要渠道。

## 内容策略

- 产品演示类：展示产品功能亮点
- 企业文化类：展现团队风貌
- 行业洞察类：建立专业形象
- 用户故事类：增强情感连接

## 投放计划

| 平台 | 频次 | 目标 |
|------|------|------|
| 抖音 | 2条/周 | 品牌曝光 |
| 视频号 | 2条/周 | 私域转化 |
| B站 | 1条/周 | 深度内容 |

## 预期效果

- 品牌曝光量提升 200%
- 官网引流增长 50%`,
    category: '市场',
    status: '已通过',
    authorId: 'u4',
    authorName: '陈静',
    authorAvatar: '',
    upVotes: 31,
    downVotes: 5,
    commentCount: 6,
    isPinned: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'p5',
    title: '微前端架构升级方案',
    summary: '将现有单体前端应用拆分为微前端架构，提升团队协作效率和系统可维护性。',
    content: `## 现状问题

- 代码库庞大，构建缓慢
- 多团队协作冲突频繁
- 技术栈升级困难
- 局部问题影响全局

## 技术选型

采用 qiankun 微前端框架：

- 基于 single-spa 封装
- 支持任意技术栈
- HTML Entry 接入方式
- 样式隔离机制

## 迁移路径

1. 搭建微前端基座
2. 按业务域逐步拆分
3. 新旧系统并行运行
4. 完成迁移下线旧系统`,
    category: '技术',
    status: '审核中',
    authorId: 'u5',
    authorName: '刘强',
    authorAvatar: '',
    upVotes: 27,
    downVotes: 4,
    commentCount: 15,
    isPinned: false,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'p6',
    title: '客户成功体系建设',
    summary: '建立完善的客户成功体系，从产品导向转向客户价值导向，提升客户留存和续约率。',
    content: `## 核心理念

客户成功 = 客户使用产品获得预期价值

## 组织架构

设立客户成功部，下设：

- 客户成功经理（CSM）
- 实施交付团队
- 培训赋能团队

## 工作流程

1. **上线期**：产品部署与培训
2. **成长期**：深度使用辅导
3. **成熟期**：价值挖掘与增购
4. **续约期**：价值回顾与续约

## 关键指标

- NPS 净推荐值
- 客户留存率
- 续约率
- 客单价增长`,
    category: '市场',
    status: '已关闭',
    authorId: 'u6',
    authorName: '赵磊',
    authorAvatar: '',
    upVotes: 19,
    downVotes: 12,
    commentCount: 9,
    isPinned: false,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'p7',
    title: '设计系统建设规划',
    summary: '建设统一的企业级设计系统，包含设计规范、组件库和设计令牌，提升产品一致性和开发效率。',
    content: `## 为什么需要设计系统

- 产品体验不一致
- 设计开发重复劳动
- 品牌形象不统一

## 组成部分

### 设计规范
- 色彩体系
- 字体规范
- 间距系统
- 图标规范

### 组件库
- 基础组件
- 业务组件
- 区块模板

### 设计令牌
- 颜色变量
- 字体变量
- 间距变量
- 动效变量

## 落地步骤

1. 现状调研与统一认知
2. 基础规范制定
3. 组件库开发
4. 业务线接入试点
5. 全面推广`,
    category: '技术',
    status: '已通过',
    authorId: 'u7',
    authorName: '孙悦',
    authorAvatar: '',
    upVotes: 45,
    downVotes: 1,
    commentCount: 11,
    isPinned: true,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'p8',
    title: '员工健康关怀计划',
    summary: '推出全方位员工健康关怀计划，包括体检升级、心理咨询、健身补贴等，关注员工身心健康。',
    content: `## 项目背景

员工是公司最宝贵的财富，身心健康是高效工作的基础。

## 关怀内容

### 身体健康
- 年度全面体检升级
- 健身房会员补贴
- 定期健康讲座
- 办公室瑜伽课

### 心理健康
- EAP 心理咨询服务
- 正念冥想课程
- 心理健康月活动

### 工作平衡
- 带薪年假增加
- 家庭关怀日
- 灵活办公选项

## 预期收益

- 员工满意度提升
- 病假率下降
- 团队凝聚力增强`,
    category: '管理',
    status: '已通过',
    authorId: 'u8',
    authorName: '周婷',
    authorAvatar: '',
    upVotes: 67,
    downVotes: 2,
    commentCount: 18,
    isPinned: false,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 0.5,
  },
];

const sampleComments: Comment[] = [
  {
    id: 'c1',
    proposalId: 'p1',
    userId: 'u2',
    userName: '李华',
    content: '非常好的想法！我们团队一直在做人工代码审查，确实效率不高。',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'c2',
    proposalId: 'p1',
    userId: 'u3',
    userName: '王芳',
    content: '会不会出现AI误判的情况？需要人工复核吗？',
    createdAt: Date.now() - 86400000 * 3,
  },
];

const initProposals = (): Proposal[] => {
  const stored = localStorage.getItem(PROPOSALS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const proposals = sampleProposals.map(p => ({
    ...p,
    authorAvatar: generateAvatar(p.authorName),
  }));
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
  return proposals;
};

const initComments = (): Comment[] => {
  const stored = localStorage.getItem(COMMENTS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(sampleComments));
  return sampleComments;
};

const initUserVotes = (): UserVote[] => {
  const stored = localStorage.getItem(USER_VOTES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

export const proposalService = {
  getProposals(params: PaginationParams): PaginationResult<Proposal> {
    const allProposals = initProposals();
    
    let filtered = [...allProposals];
    
    if (params.category) {
      filtered = filtered.filter(p => p.category === params.category);
    }
    
    if (params.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }
    
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      filtered = filtered.filter(
        p => p.title.toLowerCase().includes(kw) || p.summary.toLowerCase().includes(kw)
      );
    }
    
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
    
    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    const data = filtered.slice(start, end);
    
    return {
      data,
      total,
      hasMore: end < total,
    };
  },

  getProposalById(id: string): Proposal | undefined {
    const proposals = initProposals();
    return proposals.find(p => p.id === id);
  },

  createProposal(data: Omit<Proposal, 'id' | 'upVotes' | 'downVotes' | 'commentCount' | 'createdAt' | 'updatedAt' | 'authorAvatar'>): Proposal {
    const proposals = initProposals();
    const newProposal: Proposal = {
      ...data,
      id: generateId(),
      upVotes: 0,
      downVotes: 0,
      commentCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      authorAvatar: generateAvatar(data.authorName),
    };
    proposals.unshift(newProposal);
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
    return newProposal;
  },

  updateProposal(id: string, updates: Partial<Proposal>): Proposal | undefined {
    const proposals = initProposals();
    const index = proposals.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    proposals[index] = {
      ...proposals[index],
      ...updates,
      updatedAt: Date.now(),
    };
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
    return proposals[index];
  },

  deleteProposal(id: string): boolean {
    const proposals = initProposals();
    const index = proposals.findIndex(p => p.id === id);
    if (index === -1) return false;
    proposals.splice(index, 1);
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
    return true;
  },

  togglePin(id: string): Proposal | undefined {
    const proposals = initProposals();
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return undefined;
    proposal.isPinned = !proposal.isPinned;
    proposal.updatedAt = Date.now();
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
    return proposal;
  },

  updateStatus(id: string, status: Proposal['status']): Proposal | undefined {
    return this.updateProposal(id, { status });
  },

  getComments(proposalId: string): Comment[] {
    const allComments = initComments();
    return allComments
      .filter(c => c.proposalId === proposalId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  addComment(proposalId: string, userId: string, userName: string, content: string): Comment {
    const allComments = initComments();
    const newComment: Comment = {
      id: generateId(),
      proposalId,
      userId,
      userName,
      content,
      createdAt: Date.now(),
    };
    allComments.unshift(newComment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    
    const proposals = initProposals();
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
      proposal.commentCount += 1;
      localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
    }
    
    return newComment;
  },

  getUserVote(proposalId: string): VoteType {
    const userId = localStorage.getItem(CURRENT_USER_KEY) || 'anonymous';
    const votes = initUserVotes();
    const vote = votes.find(v => v.proposalId === proposalId && v.userId === userId);
    return vote?.voteType || null;
  },

  vote(proposalId: string, voteType: VoteType): { proposal: Proposal | undefined; previousVote: VoteType } {
    const userId = localStorage.getItem(CURRENT_USER_KEY) || 'anonymous';
    const votes = initUserVotes();
    const proposals = initProposals();
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      return { proposal: undefined, previousVote: null };
    }
    
    const existingVoteIndex = votes.findIndex(
      v => v.proposalId === proposalId && v.userId === userId
    );
    
    const previousVote: VoteType = existingVoteIndex > -1 ? votes[existingVoteIndex].voteType : null;
    
    if (previousVote === voteType) {
      if (voteType === 'up') proposal.upVotes -= 1;
      if (voteType === 'down') proposal.downVotes -= 1;
      votes.splice(existingVoteIndex, 1);
    } else {
      if (previousVote === 'up') proposal.upVotes -= 1;
      if (previousVote === 'down') proposal.downVotes -= 1;
      
      if (voteType === 'up') proposal.upVotes += 1;
      if (voteType === 'down') proposal.downVotes += 1;
      
      if (existingVoteIndex > -1) {
        votes[existingVoteIndex].voteType = voteType;
      } else {
        votes.push({ proposalId, voteType, userId } as UserVote & { userId: string });
      }
    }
    
    proposal.updatedAt = Date.now();
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
    localStorage.setItem(USER_VOTES_KEY, JSON.stringify(votes));
    
    return { proposal, previousVote };
  },

  getVoteCount(proposalId: string): { upVotes: number; downVotes: number } {
    const proposals = initProposals();
    const proposal = proposals.find(p => p.id === proposalId);
    return {
      upVotes: proposal?.upVotes || 0,
      downVotes: proposal?.downVotes || 0,
    };
  },
};

export { generateAvatar, generateId };
