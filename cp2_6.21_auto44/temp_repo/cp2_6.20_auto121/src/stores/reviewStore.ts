import { create } from 'zustand';

interface Review {
  id: string;
  bookTitle: string;
  bookCover: string;
  author: string;
  content: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  commentCount: number;
  userId: string;
  createdAt: string;
}

const coverImages = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20book%20cover%20landscape%20painting%20style&image_size=landscape_4_3',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20book%20cover%20abstract%20art&image_size=landscape_4_3',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20book%20cover%20watercolor%20flowers&image_size=landscape_4_3',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20book%20cover%20geometric%20design&image_size=landscape_4_3',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20moody%20book%20cover%20night%20sky&image_size=landscape_4_3',
];

const bookTitles = [
  '挪威的森林', '红楼梦', '围城', '月亮与六便士', '局外人',
  '霍乱时期的爱情', '了不起的盖茨比', '活着', '白夜行', '瓦尔登湖',
  '边城', '呼兰河传', '呐喊', '倾城之恋', '半生缘',
  '平凡的世界', '尘埃落定', '黄金时代', '苏菲的世界', '存在与时间',
];

const reviewContents = [
  '这本书让我重新思考了人与人之间的关系。作者用细腻的笔触描绘了生活中的点滴，让人不禁沉浸其中，久久不能自拔。',
  '阅读体验非常独特，叙事手法新颖大胆。虽然部分章节略显晦涩，但整体而言是一部不可多得的佳作。',
  '书中对人性黑暗面的探索令人震撼。每一章都像一面镜子，映照出读者内心深处的恐惧与渴望。',
  '这是一部值得反复品味的作品。第一次读时被情节吸引，重读时才发现字里行间隐藏的深意。',
  '语言优美如诗，意境深远。读完后仿佛经历了一场心灵的洗礼，推荐给所有热爱文学的朋友。',
  '作者构建的世界观宏大而精密，每一个细节都经得起推敲。这不仅仅是一本书，更是一个完整的精神宇宙。',
  '结局令人唏嘘不已。命运的齿轮一旦转动，谁都无力回天。但正是这种无力感，赋予了故事最深刻的悲剧美。',
  '轻松幽默的笔调下是对社会现实的犀利批判。笑着笑着就笑不出来了，这大概就是文学的力量。',
];

const tagPool = [
  '经典', '文学', '哲学', '魔幻现实', '社会批判',
  '人性', '成长', '爱情', '历史', '心理',
  '科幻', '悬疑', '诗意', '存在主义', '后现代',
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTags(): string[] {
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...tagPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

let reviewIdCounter = 100;

function generateReview(): Review {
  reviewIdCounter++;
  return {
    id: `r${reviewIdCounter}`,
    bookTitle: randomPick(bookTitles),
    bookCover: randomPick(coverImages),
    author: `书评人${Math.floor(Math.random() * 500)}`,
    content: randomPick(reviewContents),
    tags: randomTags(),
    likes: Math.floor(Math.random() * 200),
    likedBy: [],
    commentCount: Math.floor(Math.random() * 50),
    userId: `u${Math.floor(Math.random() * 100)}`,
    createdAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
  };
}

const initialReviews: Review[] = Array.from({ length: 12 }, generateReview);

interface ReviewState {
  reviews: Review[];
  hasMore: boolean;
  fetchMore: () => void;
  toggleLike: (reviewId: string, userId: string) => void;
  addReview: (data: {
    bookTitle: string;
    bookCover: string;
    author: string;
    content: string;
    tags: string[];
    userId: string;
  }) => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: initialReviews,
  hasMore: true,
  fetchMore: () => {
    const { reviews, hasMore } = get();
    if (!hasMore || reviews.length > 60) {
      set({ hasMore: false });
      return;
    }
    const newReviews = Array.from({ length: 6 }, generateReview);
    set({ reviews: [...reviews, ...newReviews] });
  },
  toggleLike: (reviewId, userId) => {
    set((state) => ({
      reviews: state.reviews.map((r) => {
        if (r.id !== reviewId) return r;
        const alreadyLiked = r.likedBy.includes(userId);
        return {
          ...r,
          likes: alreadyLiked ? r.likes - 1 : r.likes + 1,
          likedBy: alreadyLiked
            ? r.likedBy.filter((id) => id !== userId)
            : [...r.likedBy, userId],
        };
      }),
    }));
  },
  addReview: (data) => {
    const newReview: Review = {
      id: `r${Date.now()}`,
      bookTitle: data.bookTitle,
      bookCover: data.bookCover,
      author: data.author,
      content: data.content,
      tags: data.tags,
      likes: 0,
      likedBy: [],
      commentCount: 0,
      userId: data.userId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ reviews: [newReview, ...state.reviews] }));
  },
}));
