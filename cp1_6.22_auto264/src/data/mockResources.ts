export interface Resource {
  id: string;
  title: string;
  summary: string;
  type: 'exercise' | 'article';
  tags: string[];
  label: string;
  labelBg: string;
  labelColor: string;
}

export const mockResources: Resource[] = [
  {
    id: '1',
    title: '深呼吸放松练习',
    summary:
      '跟随4-7-8呼吸法，缓慢吸气4秒、屏息7秒、呼气8秒，重复3-5次，帮助缓解紧张情绪，让身心逐步恢复平静。',
    type: 'exercise',
    tags: ['焦虑', '紧张'],
    label: '缓解焦虑',
    labelBg: '#FF6B6B',
    labelColor: '#FFFFFF',
  },
  {
    id: '2',
    title: '校园心理咨询指南',
    summary:
      '了解学校心理咨询中心的预约方式、咨询流程和保密原则，专业咨询师随时为你提供温暖支持与帮助。',
    type: 'article',
    tags: ['焦虑', '疲惫'],
    label: '温馨提示',
    labelBg: '#FF6B6B',
    labelColor: '#FFFFFF',
  },
  {
    id: '3',
    title: '正念冥想入门',
    summary:
      '每天5分钟正念练习，关注当下的呼吸与身体感受，不评判任何思绪，让心灵回归宁静与平和。',
    type: 'exercise',
    tags: ['焦虑', '平静'],
    label: '放松身心',
    labelBg: '#48C9B0',
    labelColor: '#FFFFFF',
  },
  {
    id: '4',
    title: '感恩日记练习',
    summary:
      '每天写下三件让你感恩的小事，培养积极心态，增强幸福感，学会发现生活中那些微小而确定的美好。',
    type: 'exercise',
    tags: ['开心'],
    label: '保持好心情',
    labelBg: '#F7DC6F',
    labelColor: '#333333',
  },
  {
    id: '5',
    title: '如何与朋友分享快乐',
    summary:
      '研究表明，与他人分享积极体验能让快乐加倍。学会用真诚的方式传递你的幸福，让喜悦在彼此间流动。',
    type: 'article',
    tags: ['开心'],
    label: '分享快乐',
    labelBg: '#F7DC6F',
    labelColor: '#333333',
  },
  {
    id: '6',
    title: '自然散步放松法',
    summary:
      '在校园绿地中慢步行走15分钟，感受微风拂面和阳光洒落的温暖，让大自然帮你恢复内心深处的平和。',
    type: 'exercise',
    tags: ['平静'],
    label: '温馨提示',
    labelBg: '#48C9B0',
    labelColor: '#FFFFFF',
  },
  {
    id: '7',
    title: '科学休息与精力管理',
    summary:
      '了解番茄工作法和精力曲线，学会在高效与休息之间找到平衡点，告别过度疲劳，重新焕发活力。',
    type: 'article',
    tags: ['疲惫', '累'],
    label: '恢复活力',
    labelBg: '#FF6B6B',
    labelColor: '#FFFFFF',
  },
  {
    id: '8',
    title: '情绪调节五步法',
    summary:
      '觉察情绪→接纳感受→命名情绪→寻找原因→选择行动，五个步骤帮你走出愤怒的漩涡，重获内心平静。',
    type: 'exercise',
    tags: ['愤怒', '生气'],
    label: '平复情绪',
    labelBg: '#FF6B6B',
    labelColor: '#FFFFFF',
  },
  {
    id: '9',
    title: '运动减压指南',
    summary:
      '适度的有氧运动能释放内啡肽，跑步、瑜伽或球类运动都是不错的减压选择，让身体带动心灵轻松起来。',
    type: 'article',
    tags: ['焦虑', '疲惫', '愤怒'],
    label: '运动减压',
    labelBg: '#48C9B0',
    labelColor: '#FFFFFF',
  },
  {
    id: '10',
    title: '睡眠改善小贴士',
    summary:
      '建立规律的作息时间，睡前远离屏幕，营造安静舒适的睡眠环境，优质睡眠是情绪稳定的坚实基石。',
    type: 'article',
    tags: ['疲惫', '焦虑'],
    label: '温馨提示',
    labelBg: '#48C9B0',
    labelColor: '#FFFFFF',
  },
];
