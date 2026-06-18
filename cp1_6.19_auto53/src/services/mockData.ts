import type { Game, Reservation, User } from '@/types';

let games: Game[] = [
  {
    id: 'game-1',
    name: '经典围棋套装',
    category: '围棋',
    description: '高档榧木棋盘配云子，适合专业对弈与休闲娱乐。标准19路棋盘，棋子手感温润细腻。',
    players: '2人',
    popularity: 95,
    image: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=600&h=400&fit=crop',
    avgRating: 4.8,
    totalRatings: 126,
    available: true,
  },
  {
    id: 'game-2',
    name: '红木中国象棋',
    category: '象棋',
    description: '精选红木棋子，雕刻精美，配皮革棋盘。字体苍劲有力，手感厚重沉稳。',
    players: '2人',
    popularity: 88,
    image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=600&h=400&fit=crop',
    avgRating: 4.6,
    totalRatings: 89,
    available: true,
  },
  {
    id: 'game-3',
    name: '斯汤顿国际象棋',
    category: '国际象棋',
    description: '经典斯汤顿造型棋子，胡桃木与枫木双色，绒布棋盘手感一流，比赛级别品质。',
    players: '2人',
    popularity: 92,
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop',
    avgRating: 4.9,
    totalRatings: 156,
    available: true,
  },
  {
    id: 'game-4',
    name: '卡坦岛桌游',
    category: '桌游',
    description: '经典策略类桌游，建设与贸易的完美结合。适合家庭聚会与朋友联谊。',
    players: '3-4人',
    popularity: 98,
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&h=400&fit=crop',
    avgRating: 4.7,
    totalRatings: 203,
    available: true,
  },
  {
    id: 'game-5',
    name: '五子棋套装',
    category: '围棋',
    description: '入门级五子棋，黑白分明的亚克力棋子，适合新手与家庭娱乐。',
    players: '2人',
    popularity: 72,
    image: 'https://images.unsplash.com/photo-1596936089012-66f52adb4f61?w=600&h=400&fit=crop',
    avgRating: 4.3,
    totalRatings: 67,
    available: true,
  },
  {
    id: 'game-6',
    name: '璀璨宝石桌游',
    category: '桌游',
    description: '宝石主题卡牌策略游戏，精美的宝石筹码，简单易学却策略深厚。',
    players: '2-4人',
    popularity: 90,
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&h=400&fit=crop',
    avgRating: 4.8,
    totalRatings: 178,
    available: true,
  },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};

let reservations: Reservation[] = [
  {
    id: 'res-1',
    userId: 'user-1',
    gameId: 'game-1',
    gameName: '经典围棋套装',
    userName: '张伟',
    date: formatDate(today),
    startTime: '14:00',
    endTime: '16:00',
    status: 'pending',
    createdAt: formatDate(addDays(today, -1)),
  },
  {
    id: 'res-2',
    userId: 'user-1',
    gameId: 'game-4',
    gameName: '卡坦岛桌游',
    userName: '张伟',
    date: formatDate(addDays(today, -3)),
    startTime: '19:00',
    endTime: '21:00',
    status: 'completed',
    createdAt: formatDate(addDays(today, -4)),
    rating: 5,
  },
  {
    id: 'res-3',
    userId: 'user-2',
    gameId: 'game-3',
    gameName: '斯汤顿国际象棋',
    userName: '李娜',
    date: formatDate(addDays(today, -2)),
    startTime: '10:00',
    endTime: '12:00',
    status: 'overdue',
    createdAt: formatDate(addDays(today, -3)),
  },
  {
    id: 'res-4',
    userId: 'user-1',
    gameId: 'game-2',
    gameName: '红木中国象棋',
    userName: '张伟',
    date: formatDate(addDays(today, 1)),
    startTime: '15:00',
    endTime: '17:00',
    status: 'pending',
    createdAt: formatDate(today),
  },
  {
    id: 'res-5',
    userId: 'user-2',
    gameId: 'game-6',
    gameName: '璀璨宝石桌游',
    userName: '李娜',
    date: formatDate(today),
    startTime: '18:00',
    endTime: '20:00',
    status: 'pending',
    createdAt: formatDate(addDays(today, -1)),
  },
  {
    id: 'res-6',
    userId: 'user-1',
    gameId: 'game-5',
    gameName: '五子棋套装',
    userName: '张伟',
    date: formatDate(addDays(today, -5)),
    startTime: '09:00',
    endTime: '11:00',
    status: 'completed',
    createdAt: formatDate(addDays(today, -6)),
    rating: 4,
  },
  {
    id: 'res-7',
    userId: 'user-1',
    gameId: 'game-6',
    gameName: '璀璨宝石桌游',
    userName: '张伟',
    date: formatDate(addDays(today, -10)),
    startTime: '20:00',
    endTime: '22:00',
    status: 'completed',
    createdAt: formatDate(addDays(today, -11)),
    rating: 5,
  },
  {
    id: 'res-8',
    userId: 'user-1',
    gameId: 'game-3',
    gameName: '斯汤顿国际象棋',
    userName: '张伟',
    date: formatDate(addDays(today, -15)),
    startTime: '14:00',
    endTime: '16:00',
    status: 'completed',
    createdAt: formatDate(addDays(today, -16)),
    rating: 4,
  },
  {
    id: 'res-9',
    userId: 'user-2',
    gameId: 'game-4',
    gameName: '卡坦岛桌游',
    userName: '李娜',
    date: formatDate(addDays(today, -8)),
    startTime: '15:00',
    endTime: '18:00',
    status: 'completed',
    createdAt: formatDate(addDays(today, -9)),
    rating: 5,
  },
];

const users: User[] = [
  {
    id: 'user-1',
    name: '张伟',
    email: 'zhangwei@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei',
    role: 'user',
  },
  {
    id: 'user-2',
    name: '李娜',
    email: 'lina@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina',
    role: 'user',
  },
  {
    id: 'admin-1',
    name: '管理员',
    email: 'admin@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'admin',
  },
];

export const mockDataService = {
  getGames: (): Game[] => {
    return [...games].sort((a, b) => b.popularity - a.popularity);
  },

  getGameById: (id: string): Game | undefined => {
    return games.find((g) => g.id === id);
  },

  getReservations: (): Reservation[] => {
    return [...reservations].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  getReservationsByUserId: (userId: string): Reservation[] => {
    return reservations
      .filter((r) => r.userId === userId)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  },

  createReservation: (
    data: Omit<Reservation, 'id' | 'createdAt' | 'status'>
  ): Reservation => {
    const newReservation: Reservation = {
      ...data,
      id: `res-${Date.now()}`,
      status: 'pending',
      createdAt: formatDate(new Date()),
    };
    reservations.push(newReservation);
    return newReservation;
  },

  updateReservationStatus: (
    id: string,
    status: 'completed' | 'overdue'
  ): Reservation | undefined => {
    const reservation = reservations.find((r) => r.id === id);
    if (reservation) {
      reservation.status = status;
    }
    return reservation;
  },

  addRating: (reservationId: string, rating: number): void => {
    const reservation = reservations.find((r) => r.id === reservationId);
    if (reservation) {
      reservation.rating = rating;
      const game = games.find((g) => g.id === reservation.gameId);
      if (game) {
        const oldTotal = game.avgRating * game.totalRatings;
        game.totalRatings += 1;
        game.avgRating = Number(
          ((oldTotal + rating) / game.totalRatings).toFixed(1)
        );
        game.popularity = Math.min(
          100,
          game.popularity + rating * 0.5
        );
      }
    }
  },

  getUsers: (): User[] => {
    return [...users];
  },

  getUserById: (id: string): User | undefined => {
    return users.find((u) => u.id === id);
  },
};
