export interface Trip {
  id: string;
  name: string;
  coverImage: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isFavorited: boolean;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const mockTrips: Trip[] = [
  {
    id: '1',
    name: '云南大理五日游',
    coverImage: 'https://picsum.photos/seed/mountain/800/400',
    likes: 256,
    comments: 42,
    isLiked: false,
    isFavorited: false,
    author: {
      id: '1',
      username: '旅行者小王',
      avatar: 'https://picsum.photos/seed/user1/100/100',
    },
    startDate: '2024-03-01',
    endDate: '2024-03-05',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: '三亚海滨度假之旅',
    coverImage: 'https://picsum.photos/seed/beach/800/400',
    likes: 512,
    comments: 89,
    isLiked: true,
    isFavorited: true,
    author: {
      id: '2',
      username: '海边漫步者',
      avatar: 'https://picsum.photos/seed/user2/100/100',
    },
    startDate: '2024-02-10',
    endDate: '2024-02-14',
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: '上海都市文化探索',
    coverImage: 'https://picsum.photos/seed/city/800/400',
    likes: 189,
    comments: 31,
    isLiked: false,
    isFavorited: false,
    author: {
      id: '3',
      username: '城市猎人',
      avatar: 'https://picsum.photos/seed/user3/100/100',
    },
    startDate: '2024-04-05',
    endDate: '2024-04-07',
    createdAt: '2024-02-20',
  },
  {
    id: '4',
    name: '川西秘境徒步穿越',
    coverImage: 'https://picsum.photos/seed/forest/800/400',
    likes: 789,
    comments: 156,
    isLiked: true,
    isFavorited: false,
    author: {
      id: '4',
      username: '背包客阿明',
      avatar: 'https://picsum.photos/seed/user4/100/100',
    },
    startDate: '2024-05-01',
    endDate: '2024-05-08',
    createdAt: '2024-03-01',
  },
  {
    id: '5',
    name: '敦煌沙漠探险记',
    coverImage: 'https://picsum.photos/seed/desert/800/400',
    likes: 345,
    comments: 67,
    isLiked: false,
    isFavorited: true,
    author: {
      id: '5',
      username: '沙漠行者',
      avatar: 'https://picsum.photos/seed/user5/100/100',
    },
    startDate: '2024-06-15',
    endDate: '2024-06-20',
    createdAt: '2024-04-10',
  },
  {
    id: '6',
    name: '桂林山水甲天下',
    coverImage: 'https://picsum.photos/seed/landscape/800/400',
    likes: 623,
    comments: 98,
    isLiked: false,
    isFavorited: false,
    author: {
      id: '6',
      username: '山水之间',
      avatar: 'https://picsum.photos/seed/user6/100/100',
    },
    startDate: '2024-07-10',
    endDate: '2024-07-15',
    createdAt: '2024-05-05',
  },
];

export const coverImages = [
  { id: 'mountain', url: 'https://picsum.photos/seed/mountain/800/400', name: '山景' },
  { id: 'beach', url: 'https://picsum.photos/seed/beach/800/400', name: '海滩' },
  { id: 'city', url: 'https://picsum.photos/seed/city/800/400', name: '城市' },
  { id: 'forest', url: 'https://picsum.photos/seed/forest/800/400', name: '森林' },
  { id: 'desert', url: 'https://picsum.photos/seed/desert/800/400', name: '沙漠' },
];
