import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export function seedData() {
  const users = [
    { id: 'u1', name: '李明轩', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', role: 'admin' as const },
    { id: 'u2', name: '王思琪', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', role: 'user' as const },
    { id: 'u3', name: '张伟豪', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo', role: 'user' as const },
    { id: 'u4', name: '陈雨萱', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', role: 'user' as const },
    { id: 'u5', name: '赵子龙', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zuko', role: 'user' as const },
  ];

  const tagColors: Record<string, string> = {
    '产品创新': '#f97316',
    '技术优化': '#6366f1',
    '用户体验': '#ec4899',
    '运营增长': '#10b981',
    '设计创意': '#8b5cf6',
    '流程改进': '#14b8a6',
    'AI应用': '#f59e0b',
    '团队建设': '#06b6d4',
  };

  const now = new Date();

  const ideas = [
    {
      id: 'i1',
      title: '基于大模型的智能代码审查助手',
      description: '利用大语言模型自动审查代码，发现潜在bug和性能问题，提供优化建议。',
      content: `# 智能代码审查助手

## 项目背景
随着团队规模扩大，代码审查工作量急剧增加，资深工程师的时间被大量占用。

## 核心功能
- **自动审查**: 提交PR后自动触发AI审查
- **Bug检测**: 识别常见逻辑错误、边界条件遗漏
- **性能优化建议**: 发现时间/空间复杂度可优化的代码
- **代码风格统一**: 自动检查团队编码规范
- **安全漏洞扫描**: 识别SQL注入、XSS等常见安全问题

## 技术方案
使用 GPT-4 或 Claude 作为基础模型，结合ESLint等静态分析工具，构建多层审查流水线。

## 预期收益
- 代码审查效率提升 60%
- 线上Bug数量减少 40%
- 新人代码质量快速达标`,
      authorId: 'u2',
      authorName: '王思琪',
      authorAvatar: users[1].avatar,
      tags: [
        { name: 'AI应用', color: tagColors['AI应用'] },
        { name: '技术优化', color: tagColors['技术优化'] },
      ],
      likes: 24,
      votes: 18,
      totalVoters: 25,
      images: [],
      links: ['https://example.com/ai-code-review'],
      commentCount: 5,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
      taskId: null,
    },
    {
      id: 'i2',
      title: '沉浸式虚拟现实团建活动',
      description: '在VR世界中进行团队协作游戏，打破远程办公的隔阂，增强团队凝聚力。',
      content: `# VR团建新体验

## 为什么需要VR团建
远程办公常态化导致团队成员之间缺乏面对面交流，团队凝聚力下降。

## 活动方案
1. **密室逃脱**: 3-5人组队，在虚拟密室中解谜
2. **沙滩派对**: 轻松的社交场景，自由交流
3. **运动会**: 射箭、保龄球、乒乓球等轻竞技项目
4. **创意工坊**: 一起搭建虚拟建筑或绘画

## 实施计划
- 采购 10 套 Meta Quest 3
- 每周五下午固定 "VR时光"
- 每季度举办一次大型VR团建活动

## 预期效果
- 团队满意度提升
- 跨部门协作更顺畅
- 新员工融入更快`,
      authorId: 'u4',
      authorName: '陈雨萱',
      authorAvatar: users[3].avatar,
      tags: [
        { name: '团队建设', color: tagColors['团队建设'] },
        { name: '设计创意', color: tagColors['设计创意'] },
      ],
      likes: 31,
      votes: 22,
      totalVoters: 30,
      images: [],
      links: [],
      commentCount: 8,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'converted' as const,
      taskId: 't1',
    },
    {
      id: 'i3',
      title: '游戏化任务管理系统',
      description: '将日常工作任务转化为游戏任务，完成任务获得经验值和成就徽章，让工作更有动力。',
      content: `# 游戏化任务管理

## 核心机制
- **经验值系统**: 完成任务获得EXP，升级解锁新功能
- **成就徽章**: 完成特定目标获得稀有徽章
- **排行榜**: 每周/每月之星
- **组队副本**: 多人协作完成大型项目
- **每日签到**: 连续登录奖励

## 任务类型
- 🐛 小怪任务: 小型Bug修复，10 EXP
- ⚔️ 普通任务: 常规功能开发，50 EXP
- 👹 Boss任务: 大型项目攻坚，500 EXP
- 🎁 每日任务: 随机小目标，额外奖励

## 与现有系统集成
对接 Jira / Teambition / 飞书 等现有工具，无感融入工作流。`,
      authorId: 'u3',
      authorName: '张伟豪',
      authorAvatar: users[2].avatar,
      tags: [
        { name: '产品创新', color: tagColors['产品创新'] },
        { name: '运营增长', color: tagColors['运营增长'] },
      ],
      likes: 45,
      votes: 38,
      totalVoters: 42,
      images: [],
      links: ['https://example.com/gamification'],
      commentCount: 12,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
      taskId: null,
    },
    {
      id: 'i4',
      title: '知识库智能问答机器人',
      description: '基于公司内部文档训练的问答机器人，员工有问题直接问，不用翻文档找老员工。',
      content: `# 智能知识助手

## 痛点
- 新人入职问问题多，老员工被频繁打断
- 文档散落在各处，查找困难
- 相同问题被反复提问

## 解决方案
构建基于 RAG（检索增强生成）的企业知识库问答系统。

## 技术架构
1. 文档爬虫: 飞书/Confluence/GitHub Wiki 全量同步
2. 向量化: 使用 text-embedding-3-large 模型
3. 向量数据库: Pinecone 或 Milvus
4. 问答接口: 集成到飞书/Slack 机器人

## 效果预期
- 80% 的常见问题可自动回答
- 新人入职周期缩短 30%
- 老员工被打扰次数减少 50%`,
      authorId: 'u1',
      authorName: '李明轩',
      authorAvatar: users[0].avatar,
      tags: [
        { name: 'AI应用', color: tagColors['AI应用'] },
        { name: '效率工具', color: tagColors['流程改进'] },
      ],
      likes: 52,
      votes: 45,
      totalVoters: 50,
      images: [],
      links: [],
      commentCount: 15,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
      taskId: null,
    },
    {
      id: 'i5',
      title: '深色模式+霓虹风格UI改版',
      description: '将内部系统改为深色霓虹赛博朋克风格，减轻护眼疲劳，提升B格。',
      content: `# 赛博朋克风格UI升级

## 设计理念
- 深色背景 + 霓虹高光
- 渐变边框 + 发光效果
- 像素风格图标
- 矩阵代码雨装饰

## 配色方案
- 主背景: #0a0a1a
- 主色: #00f5ff (青色霓虹)
- 辅色: #ff00ff (品红霓虹)
- 警告: #ffff00 (黄色霓虹)
- 成功: #00ff88 (绿色霓虹)

## 实施计划
- 先在 1-2 个内部系统试点
- 收集反馈后推广到全部系统
- 提供浅色/深色一键切换

## 预期收益
- 程序员护眼
- 公司形象更酷
- 提升工作幸福感`,
      authorId: 'u4',
      authorName: '陈雨萱',
      authorAvatar: users[3].avatar,
      tags: [
        { name: '设计创意', color: tagColors['设计创意'] },
        { name: '用户体验', color: tagColors['用户体验'] },
      ],
      likes: 28,
      votes: 15,
      totalVoters: 28,
      images: [],
      links: [],
      commentCount: 7,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
      taskId: null,
    },
    {
      id: 'i6',
      title: '每周"无会议日"制度',
      description: '设定每周三为无会议日，全天不安排任何会议，让大家有完整的时间深度工作。',
      content: `# 无会议日倡议

## 背景
- 平均每人每天有 4-6 个会议
- 碎片化时间导致效率低下
- 深度工作需要连续 2 小时以上

## 方案
- 每周三为 "深度工作日"
- 全天禁止安排例会/评审会等常规会议
- 紧急情况可以临时开 15 分钟短会
- 鼓励大家使用异步沟通

## 配套措施
- 会议审批机制
- 会议时长限制
- 异步沟通指南
- 文档文化建设

## 预期效果
- 代码产出提升 30%
- 员工满意度提升
- 会议质量反而提高（因为更珍惜会议时间）`,
      authorId: 'u5',
      authorName: '赵子龙',
      authorAvatar: users[4].avatar,
      tags: [
        { name: '流程改进', color: tagColors['流程改进'] },
        { name: '团队建设', color: tagColors['团队建设'] },
      ],
      likes: 67,
      votes: 58,
      totalVoters: 60,
      images: [],
      links: [],
      commentCount: 20,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'converted' as const,
      taskId: 't2',
    },
    {
      id: 'i7',
      title: '内部创意市集：把点子变成产品的孵化机制',
      description: '每季度举办一次内部创业路演，优秀创意可以获得公司资源支持立项。',
      content: `# 创意市集计划

## 核心理念
人人都是产品经理，好点子不应该被埋没。

## 运作机制
### 创意收集
- 员工随时可以在内部平台提交创意
- 其他人可以点赞、评论、投票
- 高票创意自动入围季度路演

### 季度路演
- 每季度最后一周举办
- 每个创意 5 分钟展示 + 3 分钟问答
- 评委由高管 + 员工代表组成

### 孵化支持
- 入选项目获得 1-3 个月的 "20% 时间"
- 配备产品/设计/技术导师
- 提供必要的云资源和预算
- 成功后可正式立项

## 成功案例
- Google 20% time
- 字节跳动 "创意集市"
- 3M "15% 规则"`,
      authorId: 'u1',
      authorName: '李明轩',
      authorAvatar: users[0].avatar,
      tags: [
        { name: '产品创新', color: tagColors['产品创新'] },
        { name: '运营增长', color: tagColors['运营增长'] },
      ],
      likes: 38,
      votes: 30,
      totalVoters: 35,
      images: [],
      links: [],
      commentCount: 9,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
      taskId: null,
    },
    {
      id: 'i8',
      title: '程序员健康计划：站立办公+工间操',
      description: '为程序员配备升降桌，每天上下午各安排10分钟工间操，预防职业病。',
      content: `# 程序员健康计划

## 为什么需要
- 程序员普遍有颈椎/腰椎问题
- 长期久坐危害健康
- 健康的员工效率更高

## 具体措施
### 硬件升级
- 全体配备电动升降桌
- 人体工学椅
- 防蓝光显示器支架
- 机械键盘 + 垂直鼠标

### 活动安排
- 每天 10:00 和 15:30 工间操时间
- 每周三下午羽毛球活动
- 每月一次户外徒步
- 每年体检 + 颈椎专项检查

### 健康数据追踪
- 站立时间统计
- 运动打卡
- 健康积分兑换小礼品

## 投入产出
虽然前期投入不小，但长期来看：
- 员工病假减少
- 工作效率提升
- 雇主品牌增强`,
      authorId: 'u2',
      authorName: '王思琪',
      authorAvatar: users[1].avatar,
      tags: [
        { name: '团队建设', color: tagColors['团队建设'] },
        { name: '流程改进', color: tagColors['流程改进'] },
      ],
      likes: 55,
      votes: 42,
      totalVoters: 48,
      images: [],
      links: [],
      commentCount: 11,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
      taskId: null,
    },
  ];

  const comments = [
    {
      id: 'c1',
      ideaId: 'i1',
      userId: 'u3',
      userName: '张伟豪',
      userAvatar: users[2].avatar,
      content: '这个想法很棒！我们团队的代码审查确实很花时间。',
      createdAt: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 3,
      parentId: null,
      replyTo: null,
    },
    {
      id: 'c2',
      ideaId: 'i1',
      userId: 'u5',
      userName: '赵子龙',
      userAvatar: users[4].avatar,
      content: '建议先从 Python 和 TypeScript 两个语言开始，这两个我们用得最多。',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 5,
      parentId: null,
      replyTo: null,
    },
    {
      id: 'c3',
      ideaId: 'i1',
      userId: 'u2',
      userName: '王思琪',
      userAvatar: users[1].avatar,
      content: '同意，可以先做个 MVP 验证一下效果。',
      createdAt: new Date(now.getTime() - 0.8 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 2,
      parentId: 'c2',
      replyTo: '赵子龙',
    },
    {
      id: 'c4',
      ideaId: 'i3',
      userId: 'u4',
      userName: '陈雨萱',
      userAvatar: users[3].avatar,
      content: '游戏化会不会导致大家只挑简单任务做？',
      createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 4,
      parentId: null,
      replyTo: null,
    },
    {
      id: 'c5',
      ideaId: 'i3',
      userId: 'u3',
      userName: '张伟豪',
      userAvatar: users[2].avatar,
      content: '好问题！可以加个难度系数加权，困难任务经验值更高。',
      createdAt: new Date(now.getTime() - 0.4 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 6,
      parentId: 'c4',
      replyTo: '陈雨萱',
    },
    {
      id: 'c6',
      ideaId: 'i6',
      userId: 'u1',
      userName: '李明轩',
      userAvatar: users[0].avatar,
      content: '全力支持！我周三就不安排会议了，大家监督。',
      createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 15,
      parentId: null,
      replyTo: null,
    },
    {
      id: 'c7',
      ideaId: 'i4',
      userId: 'u2',
      userName: '王思琪',
      userAvatar: users[1].avatar,
      content: '这个必须做！我已经记不清问过多少重复问题了 😅',
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 8,
      parentId: null,
      replyTo: null,
    },
  ];

  ideas.forEach(idea => {
    (idea as any).comments = comments
      .filter(c => c.ideaId === idea.id && !c.parentId)
      .map(c => ({
        ...c,
        replies: comments.filter(r => r.parentId === c.id),
      }));
  });

  ideas.forEach(idea => {
    const daysOld = (now.getTime() - new Date(idea.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const commentCount = comments.filter(c => c.ideaId === idea.id).length;
    (idea as any).hotScore = idea.votes * 2 + idea.likes + commentCount * 2 - daysOld * 3;
  });

  const tasks = [
    {
      id: 't1',
      ideaId: 'i2',
      title: 'VR团建活动首期落地',
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      assigneeId: 'u4',
      assigneeName: '陈雨萱',
      priority: 'medium' as const,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress' as const,
    },
    {
      id: 't2',
      ideaId: 'i6',
      title: '无会议日制度推行',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assigneeId: 'u1',
      assigneeName: '李明轩',
      priority: 'high' as const,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress' as const,
    },
  ];

  db.data = {
    users,
    ideas: ideas as any[],
    tasks,
    currentUserId: 'u1',
  };

  db.write();
  console.log('✅ 数据初始化完成');
}
