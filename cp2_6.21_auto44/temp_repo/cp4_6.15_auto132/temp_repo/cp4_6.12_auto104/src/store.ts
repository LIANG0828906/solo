import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Movie } from './types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const initialMovies: Movie[] = [
  {
    id: generateId(),
    title: '流浪地球2',
    country: '中国',
    year: 2023,
    date: '2023-01-22',
    genre: ['科幻', '动作'],
    rating: 9,
    comment: '视觉震撼，国产科幻新高度。'
  },
  {
    id: generateId(),
    title: '奥本海默',
    country: '美国',
    year: 2023,
    date: '2023-08-30',
    genre: ['剧情', '其他'],
    rating: 10,
    comment: '诺兰的又一神作，三个小时毫无尿点。'
  },
  {
    id: generateId(),
    title: '蜘蛛侠：纵横宇宙',
    country: '美国',
    year: 2023,
    date: '2023-06-02',
    genre: ['动画', '动作'],
    rating: 9,
    comment: '画面艺术的极致，每一帧都是壁纸。'
  },
  {
    id: generateId(),
    title: '封神第一部',
    country: '中国',
    year: 2023,
    date: '2023-07-20',
    genre: ['剧情', '动作'],
    rating: 8,
    comment: '中国神话史诗的工业化尝试，值得鼓励。'
  },
  {
    id: generateId(),
    title: '芭比',
    country: '美国',
    year: 2023,
    date: '2023-07-21',
    genre: ['喜剧'],
    rating: 7,
    comment: '粉色外壳下的女性主义思考。'
  },
  {
    id: generateId(),
    title: '年会不能停！',
    country: '中国',
    year: 2023,
    date: '2023-12-29',
    genre: ['喜剧'],
    rating: 8,
    comment: '打工人共鸣拉满，讽刺到位。'
  },
  {
    id: generateId(),
    title: '热辣滚烫',
    country: '中国',
    year: 2024,
    date: '2024-02-10',
    genre: ['喜剧', '剧情'],
    rating: 7,
    comment: '贾玲的诚意之作，笑中带泪。'
  },
  {
    id: generateId(),
    title: '沙丘2',
    country: '美国',
    year: 2024,
    date: '2024-03-08',
    genre: ['科幻', '剧情'],
    rating: 9,
    comment: '维伦纽瓦的美学盛宴，沙漠史诗。'
  },
  {
    id: generateId(),
    title: '周处除三害',
    country: '中国台湾',
    year: 2024,
    date: '2024-03-01',
    genre: ['动作', '剧情'],
    rating: 8,
    comment: '生猛有力，台湾电影新突破。'
  },
  {
    id: generateId(),
    title: '你想活出怎样的人生',
    country: '日本',
    year: 2024,
    date: '2024-04-01',
    genre: ['动画', '剧情'],
    rating: 9,
    comment: '宫崎骏的告别之作，充满诗意与哲思。'
  },
  {
    id: generateId(),
    title: '飞驰人生2',
    country: '中国',
    year: 2024,
    date: '2024-02-10',
    genre: ['喜剧', '动作'],
    rating: 8,
    comment: '韩寒的赛车情怀，热血依旧。'
  },
  {
    id: generateId(),
    title: 'Inside Out 2',
    country: '美国',
    year: 2025,
    date: '2025-06-14',
    genre: ['动画', '喜剧'],
    rating: 9,
    comment: '皮克斯又一次关于成长的深刻解读。'
  }
];

interface MovieState {
  movies: Movie[];
  highlightedId: string | null;
  addMovie: (movie: Omit<Movie, 'id'>) => void;
  editMovie: (id: string, updates: Partial<Movie>) => void;
  deleteMovie: (id: string) => void;
  setHighlightedId: (id: string | null) => void;
}

export const useStore = create<MovieState>()(
  persist(
    (set) => ({
      movies: initialMovies,
      highlightedId: null,
      addMovie: (movie) =>
        set((state) => ({
          movies: [{ ...movie, id: generateId() }, ...state.movies],
        })),
      editMovie: (id, updates) =>
        set((state) => ({
          movies: state.movies.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      deleteMovie: (id) =>
        set((state) => ({
          movies: state.movies.filter((m) => m.id !== id),
          highlightedId: state.highlightedId === id ? null : state.highlightedId,
        })),
      setHighlightedId: (id) => set({ highlightedId: id }),
    }),
    {
      name: 'movie-timeline-storage',
    }
  )
);
