import { Review, User, Book } from '../types';
import { v4 as uuidv4 } from 'uuid';

const mockUsers: User[] = [
  { id: 'user-001', nickname: '文学爱好者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reader' },
  { id: 'user-002', nickname: '书虫小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming' },
  { id: 'user-003', nickname: '深夜读书人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nightreader' },
  { id: 'user-004', nickname: '诗与远方', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=poet' }
];

const mockBooks: Book[] = [
  { isbn: '9787020002207', title: '红楼梦', author: '曹雪芹', cover: 'https://picsum.photos/seed/book1/200/280' },
  { isbn: '9787020002214', title: '三国演义', author: '罗贯中', cover: 'https://picsum.photos/seed/book2/200/280' },
  { isbn: '9787544270878', title: '百年孤独', author: '加西亚·马尔克斯', cover: 'https://picsum.photos/seed/book5/200/280' },
  { isbn: '9787020070893', title: '活着', author: '余华', cover: 'https://picsum.photos/seed/book8/200/280' },
  { isbn: '9787544253994', title: '解忧杂货店', author: '东野圭吾', cover: 'https://picsum.photos/seed/book10/200/280' }
];

const generateMockReviews = (): Review[] => {
  const contents = [
    '这是一部伟大的作品，每次阅读都有新的感悟。作者用细腻的笔触描绘了人物的内心世界，让人感同身受。',
    '书中的情节跌宕起伏，让人欲罢不能。特别是中间那段描写，简直是神来之笔。',
    '初读时觉得平淡无奇，细细品味才发现其中深意。推荐给所有喜欢深度阅读的朋友。',
    '经典之所以为经典，就在于它能跨越时代，依然触动人心。强烈推荐！',
    '这本书改变了我对人生的看法，是我人生中最重要的读物之一。',
    '文笔优美，意境深远，读来如沐春风。是案头必备之书。',
    '故事情节引人入胜，人物塑造栩栩如生，读完久久不能平静。'
  ];

  const tagsList = [
    ['经典', '文学', '必读'],
    ['治愈', '温暖', '人生'],
    ['悬疑', '推理', '精彩'],
    ['历史', '史诗', '宏大'],
    ['哲学', '思考', '深度']
  ];

  const reviews: Review[] = [];
  for (let i = 0; i < 12; i++) {
    const user = mockUsers[i % mockUsers.length];
    const book = mockBooks[i % mockBooks.length];
    reviews.push({
      id: `review-${i + 1}`,
      userId: user.id,
      user,
      bookIsbn: book.isbn,
      book,
      content: contents[i % contents.length],
      tags: tagsList[i % tagsList.length],
      likes: Math.floor(Math.random() * 200),
      isLiked: false,
      comments: Math.floor(Math.random() * 50),
      createdAt: new Date(Date.now() - i * 3600000 * 5).toISOString()
    });
  }
  return reviews;
};

let mockReviewsData = generateMockReviews();

export const reviewApi = {
  async getReviews(page = 1, pageSize = 10): Promise<{ list: Review[]; total: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        resolve({
          list: mockReviewsData.slice(start, end),
          total: mockReviewsData.length
        });
      }, 300);
    });
  },

  async likeReview(reviewId: string): Promise<{ success: boolean; likes: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const review = mockReviewsData.find((r) => r.id === reviewId);
        if (review) {
          review.isLiked = !review.isLiked;
          review.likes += review.isLiked ? 1 : -1;
          resolve({ success: true, likes: review.likes });
        } else {
          resolve({ success: false, likes: 0 });
        }
      }, 200);
    });
  },

  async createReview(data: {
    bookIsbn: string;
    content: string;
    tags: string[];
  }): Promise<Review> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const book = mockBooks.find((b) => b.isbn === data.bookIsbn);
        const newReview: Review = {
          id: uuidv4(),
          userId: 'user-001',
          user: mockUsers[0],
          bookIsbn: data.bookIsbn,
          book: book,
          content: data.content,
          tags: data.tags,
          likes: 0,
          isLiked: false,
          comments: 0,
          createdAt: new Date().toISOString()
        };
        mockReviewsData.unshift(newReview);
        resolve(newReview);
      }, 500);
    });
  },

  async getReviewsByBook(bookIsbn: string): Promise<Review[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const reviews = mockReviewsData.filter((r) => r.bookIsbn === bookIsbn);
        resolve(reviews);
      }, 300);
    });
  }
};
