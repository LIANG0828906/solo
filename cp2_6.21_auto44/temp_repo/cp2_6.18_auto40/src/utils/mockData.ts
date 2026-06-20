import { v4 as uuidv4 } from 'uuid';
import type { User, Skill, Message, Invite, ExchangeRecord } from '@/types';

const avatars = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
const nicknames = ['代码达人', '设计喵', '音乐控', '英语老师', '健身教练', '摄影师', '吉他手', 'Python专家', '插画师', '篮球少年'];

export function generateMockData(currentUserId: string): {
  users: User[];
  skills: Skill[];
  messages: Message[];
  invites: Invite[];
  exchangeRecords: ExchangeRecord[];
} {
  const users: User[] = [];
  const skills: Skill[] = [];
  const messages: Message[] = [];
  const invites: Invite[] = [];
  const exchangeRecords: ExchangeRecord[] = [];

  for (let i = 0; i < 10; i++) {
    const userId = i === 0 ? currentUserId : uuidv4();
    users.push({
      id: userId,
      nickname: nicknames[i],
      avatar: avatars[i],
      bio: `热爱${['编程', '设计', '音乐', '阅读', '运动'][i % 5]}的爱好者，希望和大家互相学习，共同进步！`,
      radarScores: {
        frontend: Math.floor(Math.random() * 60) + 20,
        backend: Math.floor(Math.random() * 60) + 20,
        design: Math.floor(Math.random() * 60) + 20,
        dataAnalysis: Math.floor(Math.random() * 60) + 20,
        softSkills: Math.floor(Math.random() * 60) + 20,
      },
    });
  }

  const skillTemplates = [
    { title: 'Python 编程入门', tags: ['Python', '编程', '入门'], category: '编程开发' },
    { title: 'Web 前端开发', tags: ['React', 'Vue', 'JavaScript'], category: '编程开发' },
    { title: 'UI/UX 设计', tags: ['Figma', '设计', 'UI'], category: '设计创意' },
    { title: '吉他教学', tags: ['吉他', '音乐', '乐器'], category: '音乐艺术' },
    { title: '英语口语练习', tags: ['英语', '口语', '商务'], category: '语言学习' },
    { title: '健身指导', tags: ['健身', '增肌', '减脂'], category: '运动健身' },
    { title: '摄影技巧', tags: ['摄影', '构图', '后期'], category: '设计创意' },
    { title: '数据分析', tags: ['Excel', 'SQL', 'Python'], category: '职业技能' },
    { title: '日式料理', tags: ['料理', '寿司', '日料'], category: '生活技能' },
    { title: '书法教学', tags: ['书法', '软笔', '硬笔'], category: '艺术' },
    { title: '电子琴入门', tags: ['电子琴', '乐理', '入门'], category: '音乐艺术' },
    { title: '高数辅导', tags: ['数学', '高等数学', '考研'], category: '学术知识' },
    { title: 'Photoshop 修图', tags: ['PS', '修图', '设计'], category: '设计创意' },
    { title: '产品思维训练', tags: ['产品', '互联网', '思维'], category: '职业技能' },
    { title: '瑜伽教学', tags: ['瑜伽', '冥想', '拉伸'], category: '运动健身' },
    { title: '投资理财入门', tags: ['理财', '基金', '股票'], category: '职业技能' },
    { title: '咖啡拉花', tags: ['咖啡', '拉花', '饮品'], category: '生活技能' },
    { title: '自媒体运营', tags: ['运营', '新媒体', '文案'], category: '职业技能' },
    { title: '日语基础', tags: ['日语', 'N5', '入门'], category: '语言学习' },
    { title: '素描基础', tags: ['素描', '绘画', '美术'], category: '设计创意' },
  ];

  for (let i = 0; i < 40; i++) {
    const template = skillTemplates[i % skillTemplates.length];
    const user = users[Math.floor(Math.random() * users.length)];
    skills.push({
      id: uuidv4(),
      userId: user.id,
      title: template.title,
      tags: template.tags,
      description: `擅长${template.title}，有${Math.floor(Math.random() * 5) + 1}年经验，可以从零基础教起，注重实践和理解，欢迎感兴趣的朋友交换技能！`,
      category: template.category,
      createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  const now = Date.now();
  const messageTypes: Array<'invite' | 'accept' | 'reject' | 'system'> = ['invite', 'accept', 'reject', 'system'];

  for (let i = 0; i < 8; i++) {
    const type = messageTypes[Math.floor(Math.random() * messageTypes.length)];
    const fromUser = users[Math.floor(Math.random() * (users.length - 1)) + 1];
    
    let title = '';
    let content = '';
    
    switch (type) {
      case 'invite':
        title = `${fromUser.nickname} 发起了技能交换邀请`;
        content = `${fromUser.nickname} 希望和你交换 "${skills[Math.floor(Math.random() * skills.length)].title}"，点击查看详情。`;
        break;
      case 'accept':
        title = `${fromUser.nickname} 接受了你的邀请`;
        content = `太好了！${fromUser.nickname} 已经接受了你的技能交换邀请，快去准备吧。`;
        break;
      case 'reject':
        title = `${fromUser.nickname} 婉拒了你的邀请`;
        content = `${fromUser.nickname} 暂时无法接受你的邀请，可以尝试其他技能交换。`;
        break;
      case 'system':
        title = '系统通知';
        content = '欢迎使用 SkillSwap！完善你的技能信息，让更多人发现你吧。';
        break;
    }

    messages.push({
      id: uuidv4(),
      type,
      fromUserId: fromUser.id,
      toUserId: currentUserId,
      title,
      content,
      isRead: Math.random() > 0.5,
      createdAt: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  const pastInvites: Array<'accepted' | 'rejected'> = ['accepted', 'rejected'];
  for (let i = 0; i < 5; i++) {
    const fromUser = users[Math.floor(Math.random() * (users.length - 1)) + 1];
    const skill = skills[Math.floor(Math.random() * skills.length)];
    const status = pastInvites[Math.floor(Math.random() * pastInvites.length)];
    
    invites.push({
      id: uuidv4(),
      fromUserId: fromUser.id,
      toUserId: currentUserId,
      skillId: skill.id,
      skillTitle: skill.title,
      expectedTime: `每周${['一', '二', '三', '四', '五'][Math.floor(Math.random() * 5)]}晚上 8 点`,
      note: '希望我们能互相学习，共同进步！',
      status,
      createdAt: now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000),
    });
  }

  for (let i = 0; i < 6; i++) {
    const partner = users[Math.floor(Math.random() * (users.length - 1)) + 1];
    const skill = skills.filter(s => s.userId !== currentUserId)[Math.floor(Math.random() * 20)];
    
    exchangeRecords.push({
      id: uuidv4(),
      fromUserId: partner.id,
      toUserId: currentUserId,
      skillId: skill.id,
      skillTitle: skill.title,
      exchangeTime: `每周${['一', '二', '三', '四', '五'][Math.floor(Math.random() * 5)]}晚上 8 点`,
      note: '一次愉快的技能交换体验！',
      createdAt: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  return { users, skills, messages, invites, exchangeRecords };
}
