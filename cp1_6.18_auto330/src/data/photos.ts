export interface Photo {
  id: string
  imageUrl: string
  title: string
  note: string
  date: string
}

const photos: Photo[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    title: '山间晨雾',
    note: '清晨六点，雾气笼罩山谷，第一缕阳光穿过云层。',
    date: '2024-11-15'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    title: '城市黄昏',
    note: '落日余晖洒在钢筋森林上，每个人都在归家的路上。',
    date: '2024-10-28'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
    title: '海浪拍岸',
    note: '咸涩的海风，永不停歇的潮汐，大自然最古老的节奏。',
    date: '2024-10-12'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    title: '秋日森林',
    note: '落叶铺满小径，踩上去是沙沙的声响，秋天真好。',
    date: '2024-09-30'
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&q=80',
    title: '星空之夜',
    note: '远离城市光污染，银河清晰可见，那是宇宙给人类的礼物。',
    date: '2024-09-18'
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    title: '宁静湖泊',
    note: '湖面如镜，倒映着天空和远山，时间仿佛在此刻静止。',
    date: '2024-08-25'
  },
  {
    id: '7',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    title: '雪山之巅',
    note: '站在顶峰，云层在脚下翻涌，世界从未如此辽阔。',
    date: '2024-08-05'
  },
  {
    id: '8',
    imageUrl: 'https://images.unsplash.com/photo-1473858960296-4e2984b621cc?w=800&q=80',
    title: '古镇小巷',
    note: '青石板路，白墙黛瓦，每一块砖都刻着时光的故事。',
    date: '2024-07-20'
  },
  {
    id: '9',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80',
    title: '花田春色',
    note: '漫山遍野的花海，蜜蜂嗡嗡作响，这是春天的声音。',
    date: '2024-04-10'
  },
  {
    id: '10',
    imageUrl: 'https://images.unsplash.com/photo-1502472584811-0a2f2feb8968?w=800&q=80',
    title: '沙漠落日',
    note: '金色沙丘被夕阳染成橙红，苍茫天地间只有风声。',
    date: '2024-03-05'
  }
]

export default photos
