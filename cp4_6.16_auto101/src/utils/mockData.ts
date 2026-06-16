import { v4 as uuidv4 } from 'uuid';
import type { User, Skill, ExchangeRequest, Message, Review } from '../types';
import { getAvatarColor } from './avatar';
import {
  saveUsers,
  saveSkills,
  saveExchangeRequests,
  saveMessages,
  saveReviews,
  getAllUsers,
} from './storage';

export async function initMockData(): Promise<void> {
  const existingUsers = await getAllUsers();
  if (existingUsers.length > 0) {
    return;
  }

  const users: User[] = [
    {
      id: uuidv4(),
      username: '张小明',
      description: '前端开发工程师，热爱学习新技术，擅长React和Vue开发。',
      avatarColor: '',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      averageRating: 4.8,
      reviewCount: 12,
    },
    {
      id: uuidv4(),
      username: '李设计师',
      description: 'UI/UX设计师，专注用户体验设计和品牌视觉设计。',
      avatarColor: '',
      createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
      averageRating: 4.9,
      reviewCount: 8,
    },
    {
      id: uuidv4(),
      username: '王老师',
      description: '英语专业八级，有5年教学经验，擅长口语和商务英语。',
      avatarColor: '',
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      averageRating: 4.7,
      reviewCount: 15,
    },
    {
      id: uuidv4(),
      username: '陈编程',
      description: '全栈开发者，精通Python、Node.js和各种前端框架。',
      avatarColor: '',
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      averageRating: 4.6,
      reviewCount: 10,
    },
    {
      id: uuidv4(),
      username: '刘画师',
      description: '自由插画师，擅长日系风格和商业插画创作。',
      avatarColor: '',
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      averageRating: 4.5,
      reviewCount: 6,
    },
    {
      id: uuidv4(),
      username: '赵老师',
      description: '日语N1水平，在日留学5年，热爱日本文化。',
      avatarColor: '',
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      averageRating: 4.8,
      reviewCount: 9,
    },
  ];

  for (const user of users) {
    user.avatarColor = getAvatarColor(user.username);
  }

  const skills: Skill[] = [
    {
      id: uuidv4(),
      userId: users[0].id,
      name: 'React高级开发',
      category: 'programming',
      description: '精通React Hooks、状态管理、性能优化等高级技术，可带你从零到精通。',
      tags: ['React', '前端', 'JavaScript'],
      createdAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[0].id,
      name: 'Vue3入门到精通',
      category: 'programming',
      description: 'Vue3 Composition API、Pinia状态管理、Vue Router等核心技术教学。',
      tags: ['Vue', '前端', 'TypeScript'],
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[1].id,
      name: 'UI设计基础',
      category: 'design',
      description: 'Figma工具教学、设计规范、组件设计、原型制作等完整UI设计流程。',
      tags: ['Figma', 'UI设计', '原型'],
      createdAt: Date.now() - 22 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[1].id,
      name: '品牌视觉设计',
      category: 'design',
      description: 'Logo设计、VI系统、品牌调性把控，打造专业品牌形象。',
      tags: ['品牌', 'Logo', 'VI'],
      createdAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[2].id,
      name: '商务英语口语',
      category: 'language',
      description: '职场英语沟通技巧、商务邮件写作、会议英语等实用内容。',
      tags: ['英语', '商务', '口语'],
      createdAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[2].id,
      name: '雅思听力突破',
      category: 'language',
      description: '雅思听力技巧、真题解析、词汇积累，帮你突破听力瓶颈。',
      tags: ['英语', '雅思', '听力'],
      createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[3].id,
      name: 'Python数据分析',
      category: 'programming',
      description: 'Pandas、NumPy、Matplotlib数据分析三剑客，实战项目教学。',
      tags: ['Python', '数据分析', 'Pandas'],
      createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[3].id,
      name: 'Node.js后端开发',
      category: 'programming',
      description: 'Express/Koa框架、数据库设计、API开发，全栈开发必备技能。',
      tags: ['Node.js', '后端', 'API'],
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[4].id,
      name: '日系插画入门',
      category: 'design',
      description: '日系风格插画技法、人物绘制、色彩搭配，从基础到进阶。',
      tags: ['插画', '日系', '绘画'],
      createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[5].id,
      name: '日语N2考级辅导',
      category: 'language',
      description: '日语N2考试全方位辅导，语法、词汇、阅读、听力全覆盖。',
      tags: ['日语', 'N2', '考级'],
      createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[5].id,
      name: '日常日语口语',
      category: 'language',
      description: '日本生活常用口语、地道表达、文化背景，轻松应对日常交流。',
      tags: ['日语', '口语', '日常'],
      createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[0].id,
      name: 'TypeScript进阶',
      category: 'programming',
      description: 'TypeScript高级类型、泛型、装饰器等进阶特性，提升代码质量。',
      tags: ['TypeScript', '前端', '类型系统'],
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[1].id,
      name: '图标设计',
      category: 'design',
      description: '线性图标、填充图标设计技巧，打造统一风格的图标系统。',
      tags: ['图标', '设计', 'UI'],
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[2].id,
      name: '英语语法精讲',
      category: 'language',
      description: '系统梳理英语语法体系，攻克语法难点，夯实语言基础。',
      tags: ['英语', '语法', '基础'],
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[3].id,
      name: '算法与数据结构',
      category: 'programming',
      description: 'LeetCode刷题指导，常见算法题型解析，面试必备技能。',
      tags: ['算法', '数据结构', '面试'],
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      userId: users[4].id,
      name: '数码绘画基础',
      category: 'design',
      description: 'Photoshop绘画基础、笔刷运用、图层管理，数码绘画入门首选。',
      tags: ['数码绘画', 'PS', '基础'],
      createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000,
    },
  ];

  const now = Date.now();
  const exchangeRequests: ExchangeRequest[] = [
    {
      id: uuidv4(),
      requesterId: users[0].id,
      recipientId: users[2].id,
      targetSkillId: skills[4].id,
      offeredSkillId: skills[0].id,
      message: '我想学习商务英语，我可以教你React开发，我们可以交换技能吗？',
      status: 'completed',
      createdAt: now - 15 * 24 * 60 * 60 * 1000,
      updatedAt: now - 10 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      requesterId: users[1].id,
      recipientId: users[0].id,
      targetSkillId: skills[1].id,
      offeredSkillId: skills[2].id,
      message: '设计师想学习Vue3，我可以教你UI设计作为交换！',
      status: 'accepted',
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
      updatedAt: now - 4 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      requesterId: users[3].id,
      recipientId: users[4].id,
      targetSkillId: skills[8].id,
      offeredSkillId: skills[6].id,
      message: '想学插画，我可以教你Python数据分析！',
      status: 'pending',
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
      updatedAt: now - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      requesterId: users[5].id,
      recipientId: users[1].id,
      targetSkillId: skills[3].id,
      offeredSkillId: skills[9].id,
      message: '想学品牌设计，我可以教你日语N2课程。',
      status: 'pending',
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
      updatedAt: now - 1 * 24 * 60 * 60 * 1000,
    },
  ];

  const messages: Message[] = [
    {
      id: uuidv4(),
      exchangeRequestId: exchangeRequests[0].id,
      senderId: users[0].id,
      content: '你好，我想学习商务英语，我可以教你React开发，有兴趣交换吗？',
      timestamp: now - 15 * 24 * 60 * 60 * 1000 + 3600000,
      status: 'delivered',
    },
    {
      id: uuidv4(),
      exchangeRequestId: exchangeRequests[0].id,
      senderId: users[2].id,
      content: '好的呀！我一直想学React，我们可以试试。',
      timestamp: now - 15 * 24 * 60 * 60 * 1000 + 7200000,
      status: 'delivered',
    },
    {
      id: uuidv4(),
      exchangeRequestId: exchangeRequests[0].id,
      senderId: users[0].id,
      content: '太棒了！那我们什么时候开始？我周末有空。',
      timestamp: now - 15 * 24 * 60 * 60 * 1000 + 10800000,
      status: 'delivered',
    },
    {
      id: uuidv4(),
      exchangeRequestId: exchangeRequests[0].id,
      senderId: users[2].id,
      content: '周末可以的，周六下午2点怎么样？我们先视频沟通一下具体内容。',
      timestamp: now - 15 * 24 * 60 * 60 * 1000 + 14400000,
      status: 'delivered',
    },
    {
      id: uuidv4(),
      exchangeRequestId: exchangeRequests[1].id,
      senderId: users[1].id,
      content: '你好！我是设计师，想学习Vue3，我可以教你UI设计作为交换。',
      timestamp: now - 5 * 24 * 60 * 60 * 1000 + 3600000,
      status: 'delivered',
    },
    {
      id: uuidv4(),
      exchangeRequestId: exchangeRequests[1].id,
      senderId: users[0].id,
      content: '好呀！我正好想提升一下设计能力，我们可以交换。',
      timestamp: now - 4 * 24 * 60 * 60 * 1000 + 3600000,
      status: 'delivered',
    },
  ];

  const reviews: Review[] = [
    {
      id: uuidv4(),
      exchangeRequestId: exchangeRequests[0].id,
      reviewerId: users[0].id,
      revieweeId: users[2].id,
      rating: 5,
      content: '王老师的商务英语课程非常专业，讲解清晰易懂，学到了很多实用的职场英语表达。强烈推荐！',
      createdAt: now - 9 * 24 * 60 * 60 * 1000,
    },
    {
      id: uuidv4(),
      exchangeRequestId: exchangeRequests[0].id,
      reviewerId: users[2].id,
      revieweeId: users[0].id,
      rating: 5,
      content: '张老师的React课程非常棒，从基础到高级都讲得很透彻，课后问题也解答得很耐心。收获满满！',
      createdAt: now - 8 * 24 * 60 * 60 * 1000,
    },
  ];

  await saveUsers(users);
  await saveSkills(skills);
  await saveExchangeRequests(exchangeRequests);
  await saveMessages(messages);
  await saveReviews(reviews);
}
