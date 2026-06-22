import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const generateHourlyData = (hours = 24) => {
  const data = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      hour: `${hour.getHours().toString().padStart(2, '0')}:00`,
      reads: Math.floor(Math.random() * 500) + 50,
      likes: Math.floor(Math.random() * 100) + 5,
      comments: Math.floor(Math.random() * 30) + 1,
    });
  }
  return data;
};

const mockPosts = [
  {
    id: '1',
    title: '2024年内容创作趋势分析',
    summary: '探讨AI时代下内容创作者的机遇与挑战，分析最新的平台算法变化。',
    content: `# 2024年内容创作趋势分析

## 引言

在AI技术飞速发展的今天，内容创作领域正在经历前所未有的变革。本文将深入探讨2024年内容创作者需要关注的核心趋势。

## 一、AI辅助创作成为常态

越来越多的创作者开始使用AI工具辅助写作、剪辑视频和生成图片。**关键在于**：如何在AI的辅助下保持个人独特的创作风格。

### 1.1 写作助手的演进

- 智能大纲生成
- 多语言翻译优化
- 风格一致性检查

## 二、短视频与长内容的平衡

\`\`\`
优质内容 = 短视频引流 + 长内容沉淀
\`\`\`

短视频平台依然是获取新用户的重要渠道，但深度内容才能建立真正的用户粘性。

## 三、社区运营的重要性

> "内容是起点，社区是终点。"

建立自己的用户社区，培养忠实粉丝，是应对平台算法变化的最佳策略。

## 结语

拥抱变化，保持学习，专注创作——这是内容创作者永恒的成功之道。`,
    status: 'published',
    lastModified: new Date(Date.now() - 86400000).toISOString(),
    platforms: ['blog', 'newsletter', 'social'],
  },
  {
    id: '2',
    title: '如何从零开始运营个人博客',
    summary: '从域名选择到内容规划，手把手教你搭建一个有影响力的个人博客。',
    content: `# 如何从零开始运营个人博客

## 为什么要建个人博客

在算法推荐时代，拥有一个自己掌控的内容阵地变得越来越重要。

## 核心步骤

1. **域名选择**：简洁易记，最好包含关键词
2. **平台选型**：WordPress vs Hugo vs Ghost
3. **内容规划**：建立稳定的发布节奏
4. **SEO优化**：让更多人发现你的内容

## 内容策略

- 每周至少发布1篇深度文章
- 建立内容主题矩阵
- 与读者互动，回复每一条评论

## 变现路径

- 付费会员
- 广告收入
- 知识付费产品`,
    status: 'draft',
    lastModified: new Date(Date.now() - 3600000 * 2).toISOString(),
    platforms: ['blog'],
  },
  {
    id: '3',
    title: '播客制作全流程指南',
    summary: '从录音设备选择到后期剪辑，分享专业播客制作的完整工作流。',
    content: `# 播客制作全流程指南

## 设备清单

- 麦克风：Blue Yeti 或 Shure SM7B
- 耳机：监听级封闭耳机
- 录音软件：Audacity 或 Adobe Audition

## 节目结构

1. 开场（30秒）：介绍本期主题
2. 主体（15-25分钟）：深度讨论
3. 结尾（2分钟）：总结+下期预告

## 发布策略

- 固定发布时间
- 多平台分发
- 逐字稿优化SEO`,
    status: 'draft',
    lastModified: new Date(Date.now() - 3600000 * 5).toISOString(),
    platforms: ['newsletter', 'social'],
  },
];

let posts = [...mockPosts];

app.get('/api/posts', (_req, res) => {
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const newPost = req.body;
  posts.push(newPost);
  res.json(newPost);
});

app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const updatedPost = req.body;
  posts = posts.map((p) => (p.id === id ? updatedPost : p));
  res.json(updatedPost);
});

app.get('/api/analytics', (_req, res) => {
  const blogData = generateHourlyData(24);
  const newsletterData = generateHourlyData(24);
  const socialData = generateHourlyData(24);

  const sumReads = (data) =>
    data.reduce((sum, item) => sum + item.reads, 0);
  const sumLikes = (data) =>
    data.reduce((sum, item) => sum + item.likes, 0);
  const sumComments = (data) =>
    data.reduce((sum, item) => sum + item.comments, 0);

  res.json([
    {
      platform: 'blog',
      totalReads: sumReads(blogData),
      totalLikes: sumLikes(blogData),
      totalComments: sumComments(blogData),
      hourlyData: blogData,
    },
    {
      platform: 'newsletter',
      totalReads: sumReads(newsletterData),
      totalLikes: sumLikes(newsletterData),
      totalComments: sumComments(newsletterData),
      hourlyData: newsletterData,
    },
    {
      platform: 'social',
      totalReads: sumReads(socialData),
      totalLikes: sumLikes(socialData),
      totalComments: sumComments(socialData),
      hourlyData: socialData,
    },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
