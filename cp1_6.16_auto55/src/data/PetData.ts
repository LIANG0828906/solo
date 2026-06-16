import { Pet, PetStatus } from '../types';

export const initialPets: Pet[] = [
  {
    id: '1',
    name: '小白',
    breed: '金毛寻回犬',
    age: 2,
    personality: ['温顺', '活泼', '粘人'],
    imageUrl: '',
    status: PetStatus.AVAILABLE,
    description: '小白是一只非常温顺的金毛，喜欢和人亲近，非常适合有小孩的家庭。它已经学会了基本的服从训练，会坐下、握手和趴下。',
    adoptionCount: 0,
  },
  {
    id: '2',
    name: '咪咪',
    breed: '英国短毛猫',
    age: 1,
    personality: ['安静', '独立', '爱干净'],
    imageUrl: '',
    status: PetStatus.AVAILABLE,
    description: '咪咪是一只优雅的英短蓝猫，性格独立但也会在你身边安静地陪伴。它非常爱干净，已经学会使用猫砂盆。',
    adoptionCount: 1,
  },
  {
    id: '3',
    name: '旺财',
    breed: '中华田园犬',
    age: 3,
    personality: ['忠诚', '勇敢', '活泼'],
    imageUrl: '',
    status: PetStatus.AVAILABLE,
    description: '旺财是一只聪明的土狗，非常忠诚，是很好的看家伙伴。它适应能力强，身体健康，已经完成疫苗接种。',
    adoptionCount: 0,
  },
  {
    id: '4',
    name: '雪球',
    breed: '萨摩耶',
    age: 1,
    personality: ['友善', '好动', '亲人'],
    imageUrl: '',
    status: PetStatus.PENDING,
    description: '雪球有着雪白的毛发和天使般的笑容，是一只非常友善的萨摩耶。它喜欢户外活动，需要较大的运动量。',
    adoptionCount: 2,
  },
  {
    id: '5',
    name: '橘子',
    breed: '橘猫',
    age: 2,
    personality: ['贪吃', '慵懒', '温和'],
    imageUrl: '',
    status: PetStatus.AVAILABLE,
    description: '橘子是一只胖乎乎的橘猫，性格温和，最喜欢的事情就是吃饭和睡觉。它很容易亲近，适合新手养猫。',
    adoptionCount: 0,
  },
  {
    id: '6',
    name: '豆豆',
    breed: '柴犬',
    age: 4,
    personality: ['聪明', '倔强', '可爱'],
    imageUrl: '',
    status: PetStatus.AVAILABLE,
    description: '豆豆是一只性格鲜明的柴犬，有着标志性的表情包。它聪明但有点小倔强，需要有耐心的主人。',
    adoptionCount: 1,
  },
];

export const housingTypeLabels: Record<string, string> = {
  own: '自有住房',
  rent: '租房',
  other: '其他',
};

export const applicationStatusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

export const petStatusLabels: Record<string, string> = {
  available: '可领养',
  pending: '申请中',
  adopted: '已领养',
};
