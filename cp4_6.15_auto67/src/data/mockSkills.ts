export type SkillCategory = 'programming' | 'art' | 'life' | 'sports';

export interface Skill {
  id: string;
  title: string;
  category: SkillCategory;
  description: string;
  avatar: string;
  username: string;
  pointsCost: number;
  searchCount: number;
  userBio: string;
}

export interface ExchangeRequestItem {
  id: string;
  skillId: string;
  reason: string;
  expectedTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
}

export interface UserProfile {
  username: string;
  avatar: string;
  bio: string;
  points: number;
}

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  programming: '编程',
  art: '艺术',
  life: '生活',
  sports: '体育',
};

export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  programming: '#3B82F6',
  art: '#F87171',
  life: '#22C55E',
  sports: '#F97316',
};

export const mockSkills: Skill[] = [
  {
    id: '1',
    title: 'React 前端开发',
    category: 'programming',
    description: '从零到一学习React框架，掌握组件化开发、Hooks使用、状态管理和路由配置。适合有JavaScript基础的同学，课程包含实战项目演练，让你快速上手现代前端开发。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    username: 'Leo',
    pointsCost: 30,
    searchCount: 87,
    userBio: '5年前端开发经验，曾就职于大厂',
  },
  {
    id: '2',
    title: '水彩画入门',
    category: 'art',
    description: '学习水彩画的基本技法，包括调色、湿画法、干画法等。从简单的花卉和风景开始，逐步掌握水彩的表现力。无需绘画基础，带上你的好奇心即可。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    username: 'Mia',
    pointsCost: 20,
    searchCount: 54,
    userBio: '自由插画师，水彩爱好者',
  },
  {
    id: '3',
    title: '法式烘焙',
    category: 'life',
    description: '学习制作经典法式甜点：马卡龙、可颂、法式焦糖布丁。从面团发酵到出炉装饰，手把手教你掌握烘焙的每个关键步骤，在家也能做出地道法式风味。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    username: 'Sophie',
    pointsCost: 25,
    searchCount: 92,
    userBio: '巴黎蓝带毕业，家庭烘焙达人',
  },
  {
    id: '4',
    title: '吉他弹唱',
    category: 'sports',
    description: '零基础学吉他，从持琴姿势到和弦转换，掌握5个常用和弦后即可弹唱数十首流行歌曲。课程包含节奏训练和简单指弹入门，让你快速享受音乐的魅力。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    username: 'Jack',
    pointsCost: 15,
    searchCount: 73,
    userBio: '独立音乐人，吉他教学8年',
  },
  {
    id: '5',
    title: 'Python 数据分析',
    category: 'programming',
    description: '系统学习Python数据分析全流程：Pandas数据处理、Matplotlib可视化、基础统计分析。通过真实数据集实战演练，掌握数据清洗、分析和报告生成的完整技能。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    username: 'David',
    pointsCost: 35,
    searchCount: 66,
    userBio: '数据科学家，Kaggle竞赛获奖者',
  },
  {
    id: '6',
    title: '素描基础',
    category: 'art',
    description: '从线条练习到明暗关系，系统学习素描基础。课程涵盖石膏几何体、静物写生和人像入门，帮助你建立扎实的造型能力和观察方法。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
    username: 'Anna',
    pointsCost: 18,
    searchCount: 41,
    userBio: '美术学院讲师，专注素描教学',
  },
  {
    id: '7',
    title: '瑜伽入门',
    category: 'sports',
    description: '学习哈他瑜伽基础体式和呼吸法，改善体态、缓解压力。课程循序渐进，从简单的山式到战士系列，每个体式都会详细讲解要点和注意事项。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
    username: 'Yuki',
    pointsCost: 12,
    searchCount: 58,
    userBio: 'RYT200认证瑜伽导师',
  },
  {
    id: '8',
    title: '咖啡拉花',
    category: 'life',
    description: '从浓缩萃取到奶泡打发，学习制作完美拿铁拉花。掌握心形、树叶和郁金香三种经典图案，了解不同奶泡质感的控制技巧，让每杯咖啡都成为艺术品。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark',
    username: 'Mark',
    pointsCost: 20,
    searchCount: 49,
    userBio: '精品咖啡店主理人，SCA认证',
  },
  {
    id: '9',
    title: 'TypeScript 进阶',
    category: 'programming',
    description: '深入TypeScript类型系统，掌握泛型、条件类型、映射类型等高级特性。学会设计类型安全的API和组件，用类型编程提升代码质量和开发效率。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    username: 'Alex',
    pointsCost: 40,
    searchCount: 35,
    userBio: '开源项目维护者，TS布道师',
  },
  {
    id: '10',
    title: '书法入门',
    category: 'art',
    description: '学习硬笔书法基本笔画和结构规律，从楷书入门逐步过渡到行书。掌握正确的握笔姿势和运笔方法，提升日常书写的规范性和美感。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily',
    username: 'Lily',
    pointsCost: 15,
    searchCount: 38,
    userBio: '书法协会会员，教学10年',
  },
  {
    id: '11',
    title: '家庭园艺',
    category: 'life',
    description: '学习阳台和室内植物的养护技巧，包括多肉、绿植、香草和小番茄的种植方法。掌握浇水、施肥、修剪和病虫害防治的实用知识，打造自己的绿色空间。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Green',
    username: 'Green',
    pointsCost: 10,
    searchCount: 63,
    userBio: '园艺博主，拥有300+植物',
  },
  {
    id: '12',
    title: '游泳教学',
    category: 'sports',
    description: '从水中呼吸到自由泳完整动作，零基础学会游泳。课程包含蛙泳和自由泳两种泳姿，重点讲解换气技巧和水中安全知识，让你克服恐水心理。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom',
    username: 'Tom',
    pointsCost: 22,
    searchCount: 44,
    userBio: '国家二级游泳运动员，教练',
  },
  {
    id: '13',
    title: 'Vue.js 开发',
    category: 'programming',
    description: '学习Vue3组合式API和响应式系统，掌握Pinia状态管理和Vue Router路由配置。通过开发一个完整的项目管理系统来实践所学知识。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin',
    username: 'Kevin',
    pointsCost: 28,
    searchCount: 51,
    userBio: '全栈开发者，Vue社区贡献者',
  },
  {
    id: '14',
    title: '手工皮具制作',
    category: 'art',
    description: '学习手工皮具制作基础：裁皮、缝线、封边和染色。课程从制作一个卡包开始，逐步挑战钱包和手提包，体验手工匠人的乐趣和成就感。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Craft',
    username: 'Craft',
    pointsCost: 30,
    searchCount: 29,
    userBio: '皮具手艺人，原创品牌主理人',
  },
  {
    id: '15',
    title: '烹饪中餐',
    category: 'life',
    description: '学习经典中餐家常菜制作：红烧肉、宫保鸡丁、麻婆豆腐等。掌握刀工、火候和调味的核心技巧，了解不同菜系的特点，在家也能做出饭店级别的美味。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chef',
    username: 'Chef',
    pointsCost: 18,
    searchCount: 78,
    userBio: '特级厨师，美食博主',
  },
  {
    id: '16',
    title: '篮球训练',
    category: 'sports',
    description: '提升篮球基本功：运球、投篮、传球和防守。课程包含个人技术训练和简单战术配合，适合初学者和想要提高基础技术的爱好者。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    username: 'Mike',
    pointsCost: 16,
    searchCount: 56,
    userBio: '校篮球队队长，体育老师',
  },
  {
    id: '17',
    title: 'Docker 容器化',
    category: 'programming',
    description: '从Docker基础概念到实战部署，学习镜像构建、容器编排和Docker Compose。掌握前后端项目的容器化方案，轻松实现开发环境一致性和快速部署。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DevOps',
    username: 'DevOps',
    pointsCost: 32,
    searchCount: 42,
    userBio: '运维架构师，容器化专家',
  },
  {
    id: '18',
    title: '摄影入门',
    category: 'art',
    description: '学习手机和相机摄影基础：构图法则、光线运用、色彩搭配和后期修图。从人像到风景，掌握不同场景的拍摄技巧，用镜头记录生活中的美好瞬间。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Photo',
    username: 'Photo',
    pointsCost: 22,
    searchCount: 67,
    userBio: '旅行摄影师，作品见于国家地理',
  },
  {
    id: '19',
    title: '花艺设计',
    category: 'life',
    description: '学习花束包装、插花艺术和花篮制作。了解常见花材的特性和搭配原则，掌握欧式和日式插花的基本造型，为生活增添花的浪漫。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Flora',
    username: 'Flora',
    pointsCost: 24,
    searchCount: 37,
    userBio: '花艺设计师，工作室创始人',
  },
  {
    id: '20',
    title: '跑步训练',
    category: 'sports',
    description: '科学跑步从入门到进阶：跑姿纠正、配速控制、心率训练和赛前准备。制定个性化训练计划，避免运动损伤，帮助你从5K迈向半马。',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Runner',
    username: 'Runner',
    pointsCost: 10,
    searchCount: 48,
    userBio: '马拉松完赛者，跑步教练',
  },
];
