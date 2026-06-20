import type { Proposal, Feedback, DesignStage } from '../types';
import { v4 as uuidv4 } from 'uuid';

const imageApi = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

const randomDate = (days: number = 30): string => {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
  return past.toISOString();
};

const randomStage = (): DesignStage => {
  const stages: DesignStage[] = ['draft', 'review', 'final'];
  return stages[Math.floor(Math.random() * stages.length)];
};

const randomFloat = (min: number, max: number, decimals: number = 1): number => {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const encodePrompt = (prompt: string): string => {
  return encodeURIComponent(prompt);
};

const proposalNames = [
  { name: '品牌视觉识别系统设计', desc: '为新锐科技公司打造完整的品牌视觉体系，包括Logo设计、色彩规范、字体系统及应用场景设计。' },
  { name: '电商平台UI重设计', desc: '针对用户反馈进行电商平台界面优化，提升购物体验和转化率，优化商品展示和购物流程。' },
  { name: '移动银行App界面设计', desc: '为城市商业银行设计移动端银行应用，注重安全性与易用性的平衡，提供流畅的金融服务体验。' },
  { name: '智能家居控制中心', desc: '设计统一的智能家居设备控制面板，支持多设备联动和场景化控制，简化用户操作流程。' },
  { name: '在线教育平台界面', desc: '为K12在线教育机构设计互动式学习平台，融合游戏化元素提升学生学习兴趣和参与度。' },
  { name: '健康管理App界面', desc: '设计个人健康数据追踪应用，整合运动、饮食、睡眠等多维度数据，提供个性化健康建议。' },
  { name: '企业官网改版设计', desc: '为传统制造企业进行官网现代化改造，突出品牌形象和产品展示，优化客户获取路径。' },
  { name: '社交媒体仪表盘', desc: '为营销团队设计多平台社交媒体数据分析仪表盘，实时监控数据趋势和用户互动情况。' },
  { name: '旅行预订平台设计', desc: '设计一站式旅行预订平台，整合机票、酒店、景点预订功能，提供个性化行程推荐。' },
  { name: '餐饮点餐系统界面', desc: '为连锁餐厅设计智能点餐系统，支持扫码点餐、自助下单和会员管理，提升运营效率。' },
];

const mockProposals: Proposal[] = proposalNames.map((item, index) => {
  const designImageCount = randomInt(3, 5);
  const designImages = Array.from({ length: designImageCount }, (_, i) =>
    `${imageApi}?prompt=${encodePrompt(`${item.name} 设计稿${i + 1} 专业UI设计展示`)}&image_size=square`
  );

  return {
    id: uuidv4(),
    name: item.name,
    description: `${item.desc}项目注重用户体验与视觉美感的结合，通过深入的用户调研和迭代设计，确保最终产品能够满足目标用户的核心需求。`,
    coverImage: `${imageApi}?prompt=${encodePrompt(`${item.name} 封面图 现代设计风格`)}&image_size=square`,
    stage: randomStage(),
    designImages,
    averageRating: randomFloat(3.0, 5.0),
    ratingCount: randomInt(1, 10),
    createdAt: randomDate(30),
  };
});

const userNames = ['张先生', '李女士', '王经理', '赵设计', '陈总监', '刘产品', '孙客户', '周用户'];
const feedbackContents = [
  '整体设计风格很符合我们的品牌调性，色彩搭配专业且和谐。',
  '界面布局清晰合理，用户学习成本低，操作流畅。',
  '非常欣赏设计细节的处理，尤其是交互动效部分。',
  '建议在导航部分做一些优化，目前的层级稍显复杂。',
  '设计稿呈现的视觉效果很棒，期待最终成品。',
  '功能架构很完整，用户旅程设计得很顺畅。',
  '色彩选择很大胆但很协调，给人耳目一新的感觉。',
  '希望能增加更多的自定义选项，满足不同用户的个性化需求。',
  '图标设计统一且识别度高，整体视觉语言一致。',
  '字体选择很合适，阅读体验很好，层级分明。',
  '响应式设计考虑得很周全，各端体验都很流畅。',
  '建议增加一些微交互，提升用户操作反馈感。',
];

const mockFeedbacks: Feedback[] = mockProposals.flatMap((proposal) => {
  const feedbackCount = randomInt(2, 4);
  return Array.from({ length: feedbackCount }, () => ({
    id: uuidv4(),
    proposalId: proposal.id,
    userName: userNames[randomInt(0, userNames.length - 1)],
    content: feedbackContents[randomInt(0, feedbackContents.length - 1)],
    createdAt: randomDate(15),
    likes: randomInt(0, 8),
  }));
});

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchProposals = async (): Promise<Proposal[]> => {
  await delay(200);
  return [...mockProposals];
};

export const fetchProposalDetail = async (id: string): Promise<Proposal | null> => {
  await delay(150);
  const proposal = mockProposals.find((p) => p.id === id);
  return proposal || null;
};

export const fetchFeedback = async (proposalId: string): Promise<Feedback[]> => {
  await delay(150);
  return mockFeedbacks.filter((f) => f.proposalId === proposalId);
};

export const submitFeedback = async (data: {
  proposalId: string;
  userName: string;
  content: string;
}): Promise<Feedback> => {
  await delay(300);
  const newFeedback: Feedback = {
    id: uuidv4(),
    proposalId: data.proposalId,
    userName: data.userName,
    content: data.content,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  mockFeedbacks.unshift(newFeedback);
  return newFeedback;
};

export const submitRating = async (
  proposalId: string,
  rating: number
): Promise<{ averageRating: number; ratingCount: number }> => {
  await delay(200);
  const proposal = mockProposals.find((p) => p.id === proposalId);
  if (!proposal) {
    throw new Error('Proposal not found');
  }
  const newCount = proposal.ratingCount + 1;
  const newAverage = (proposal.averageRating * proposal.ratingCount + rating) / newCount;
  proposal.averageRating = Number(newAverage.toFixed(1));
  proposal.ratingCount = newCount;
  return {
    averageRating: proposal.averageRating,
    ratingCount: proposal.ratingCount,
  };
};
