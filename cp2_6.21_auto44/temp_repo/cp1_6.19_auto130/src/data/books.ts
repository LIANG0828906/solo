export type ReadStatus = 'unread' | 'reading' | 'read';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  theme: string;
  status: ReadStatus;
  coverColor: string;
  coverColor2: string;
}

export const initialBooks: Book[] = [
  {
    id: '1',
    title: '三体',
    author: '刘慈欣',
    description: '地球文明与三体文明的宇宙史诗，讲述了人类在面对外星文明威胁时的挣扎与抉择。',
    theme: '科幻小说',
    status: 'read',
    coverColor: '#1A237E',
    coverColor2: '#4A148C'
  },
  {
    id: '2',
    title: '活着',
    author: '余华',
    description: '讲述了一个人的一生，在苦难中坚守生命的意义，展现了中国近百年的历史变迁。',
    theme: '文学经典',
    status: 'read',
    coverColor: '#B71C1C',
    coverColor2: '#E65100'
  },
  {
    id: '3',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    description: '从认知革命到科学革命，重新审视人类历史的发展脉络与未来走向。',
    theme: '历史人文',
    status: 'reading',
    coverColor: '#00695C',
    coverColor2: '#00897B'
  },
  {
    id: '4',
    title: '代码整洁之道',
    author: 'Robert C. Martin',
    description: '讲述编写高质量代码的原则与实践，帮助程序员写出更优雅、更可维护的代码。',
    theme: '技术编程',
    status: 'reading',
    coverColor: '#263238',
    coverColor2: '#455A64'
  },
  {
    id: '5',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    description: '布恩迪亚家族七代人的传奇故事，魔幻现实主义文学的巅峰之作。',
    theme: '文学经典',
    status: 'unread',
    coverColor: '#FF8F00',
    coverColor2: '#FFB300'
  },
  {
    id: '6',
    title: '沙丘',
    author: '弗兰克·赫伯特',
    description: '在遥远的未来，人类在沙漠星球厄拉科斯上展开的权力斗争与英雄传奇。',
    theme: '科幻小说',
    status: 'unread',
    coverColor: '#BF360C',
    coverColor2: '#E65100'
  },
  {
    id: '7',
    title: '深入理解计算机系统',
    author: 'Randal E. Bryant',
    description: '从程序员的视角深入讲解计算机系统的核心概念与底层原理。',
    theme: '技术编程',
    status: 'unread',
    coverColor: '#0D47A1',
    coverColor2: '#1565C0'
  },
  {
    id: '8',
    title: '万历十五年',
    author: '黄仁宇',
    description: '以1587年为切入点，剖析明朝中后期的社会结构与政治困境。',
    theme: '历史人文',
    status: 'read',
    coverColor: '#4E342E',
    coverColor2: '#6D4C41'
  },
  {
    id: '9',
    title: '设计模式',
    author: 'GoF',
    description: '经典的面向对象软件设计模式参考手册，23种设计模式详解。',
    theme: '技术编程',
    status: 'read',
    coverColor: '#311B92',
    coverColor2: '#512DA8'
  },
  {
    id: '10',
    title: '红楼梦',
    author: '曹雪芹',
    description: '中国古典文学巨著，描绘贾府兴衰与贾宝玉、林黛玉的爱情悲剧。',
    theme: '文学经典',
    status: 'reading',
    coverColor: '#880E4F',
    coverColor2: '#AD1457'
  },
  {
    id: '11',
    title: '银河系漫游指南',
    author: '道格拉斯·亚当斯',
    description: '地球被毁灭后，阿瑟·邓特在银河系中的荒诞冒险故事。',
    theme: '科幻小说',
    status: 'read',
    coverColor: '#004D40',
    coverColor2: '#00695C'
  },
  {
    id: '12',
    title: '明朝那些事儿',
    author: '当年明月',
    description: '以幽默风趣的笔法讲述明朝三百年历史，让历史变得生动有趣。',
    theme: '历史人文',
    status: 'unread',
    coverColor: '#1B5E20',
    coverColor2: '#2E7D32'
  },
  {
    id: '13',
    title: '平凡的世界',
    author: '路遥',
    description: '通过孙少安、孙少平兄弟的奋斗，展现中国70-80年代社会变迁。',
    theme: '文学经典',
    status: 'unread',
    coverColor: '#E65100',
    coverColor2: '#EF6C00'
  },
  {
    id: '14',
    title: 'JavaScript高级程序设计',
    author: 'Nicholas C. Zakas',
    description: '全面深入地讲解JavaScript语言特性与Web开发技术。',
    theme: '技术编程',
    status: 'reading',
    coverColor: '#F57F17',
    coverColor2: '#F9A825'
  },
  {
    id: '15',
    title: '基地',
    author: '阿西莫夫',
    description: '心理史学家谢顿预言银河帝国灭亡，在端点星建立基地保存文明。',
    theme: '科幻小说',
    status: 'unread',
    coverColor: '#3E2723',
    coverColor2: '#5D4037'
  }
];

export const statusColors: Record<ReadStatus, string> = {
  unread: '#F5F5F5',
  reading: '#E3F2FD',
  read: '#E8F5E9'
};

export const statusLabels: Record<ReadStatus, string> = {
  unread: '未读',
  reading: '正在阅读',
  read: '已读'
};
