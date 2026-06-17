export type CourseType = '陶艺' | '皮具' | '木工';

export interface Course {
  id: string;
  name: string;
  type: CourseType;
  teacher: string;
  duration: string;
  price: number;
  description: string;
  thumbnail: string;
  coverImage: string;
  works: string[];
  availableTimes: string[];
}

export const catalog: Course[] = [
  {
    id: 'pottery-1',
    name: '手捏陶艺入门课',
    type: '陶艺',
    teacher: '林清雅',
    duration: '2.5小时',
    price: 288,
    description: '零基础友好的手捏陶艺课程，学习揉泥、捏塑、修坯等基础技法，亲手制作专属茶盏或小花器，感受泥土的温度与可塑性。',
    thumbnail: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 10:00-12:00', '周六 14:00-16:00', '周日 10:00-12:00', '周日 15:00-17:00'],
  },
  {
    id: 'pottery-2',
    name: '拉坯进阶课程',
    type: '陶艺',
    teacher: '陈砚秋',
    duration: '3小时',
    price: 428,
    description: '适合有一定基础的陶艺爱好者，深入学习拉坯机操作技巧，掌握碗、瓶、罐等不同器型的成型方法，完成一件可烧制的作品。',
    thumbnail: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1610701596069-88b02001c9e4?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1594869402344-620d239d56e6?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 09:00-12:00', '周日 09:00-12:00', '周三 19:00-22:00'],
  },
  {
    id: 'pottery-3',
    name: '釉下彩绘装饰课',
    type: '陶艺',
    teacher: '苏墨白',
    duration: '2小时',
    price: 358,
    description: '学习釉下彩绘的基本技法，使用青花、五彩等传统颜料在素坯上进行创作，体验中国传统陶瓷装饰艺术的魅力。',
    thumbnail: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 14:00-16:00', '周日 14:00-16:00', '周五 19:00-21:00'],
  },
  {
    id: 'leather-1',
    name: '手工皮具入门·短夹制作',
    type: '皮具',
    teacher: '何念安',
    duration: '3小时',
    price: 398,
    description: '从零开始学习手工皮具制作，掌握裁皮、打孔、缝制、封边等核心技法，亲手制作一个意大利植鞣皮短款钱包。',
    thumbnail: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1606504812189-e3582a0b9374?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 10:00-13:00', '周六 14:00-17:00', '周日 10:00-13:00', '周二 19:00-22:00'],
  },
  {
    id: 'leather-2',
    name: '手工单肩包制作课',
    type: '皮具',
    teacher: '江逸舟',
    duration: '6小时',
    price: 888,
    description: '分两次完成的进阶皮具课程，学习版型设计、复杂缝合、五金安装等工艺，打造一个完全属于你的简约风单肩包。',
    thumbnail: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1606504812189-e3582a0b9374?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 09:00-12:00', '周六 14:00-17:00', '周日 09:00-12:00', '周日 14:00-17:00'],
  },
  {
    id: 'leather-3',
    name: '皮雕艺术体验课',
    type: '皮具',
    teacher: '唐牧之',
    duration: '4小时',
    price: 568,
    description: '学习传统皮雕技艺，使用专业雕刻工具在皮革上创作花卉、纹样等图案，完成一件独特的皮雕笔记本或小挂件。',
    thumbnail: 'https://images.unsplash.com/photo-1606504812189-e3582a0b9374?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1606504812189-e3582a0b9374?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 13:00-17:00', '周日 13:00-17:00', '周四 18:00-22:00'],
  },
  {
    id: 'wood-1',
    name: '木艺入门·勺子雕刻',
    type: '木工',
    teacher: '陆知秋',
    duration: '2.5小时',
    price: 268,
    description: '使用优质樱桃木或黑胡桃木，学习传统木工雕刻技法，亲手雕刻一把造型优美的木勺，体验木头变成艺术品的过程。',
    thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566963737140-24134e5b7b60?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 10:00-12:30', '周六 14:30-17:00', '周日 10:00-12:30', '周日 14:30-17:00'],
  },
  {
    id: 'wood-2',
    name: '榫卯小凳制作课',
    type: '木工',
    teacher: '周慎之',
    duration: '5小时',
    price: 758,
    description: '深入了解中国传统榫卯结构，学习画线、开榫、拼合等工艺，不使用一钉一胶，独立完成一张精巧的榫卯小板凳。',
    thumbnail: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566963737140-24134e5b7b60?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 09:00-14:00', '周日 09:00-14:00', '周一 10:00-15:00'],
  },
  {
    id: 'wood-3',
    name: '原木首饰盒制作',
    type: '木工',
    teacher: '沈砚之',
    duration: '4小时',
    price: 528,
    description: '挑选心仪的实木材料，学习木工精细打磨和木蜡油涂装工艺，制作一个带磁力开合的原木首饰盒，收纳你的珍爱之物。',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
    works: [
      'https://images.unsplash.com/photo-1566963737140-24134e5b7b60?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=300&h=300&fit=crop',
    ],
    availableTimes: ['周六 10:00-14:00', '周日 10:00-14:00', '周三 14:00-18:00', '周五 19:00-23:00'],
  },
];

export function getCourseById(id: string): Course | undefined {
  return catalog.find((course) => course.id === id);
}
