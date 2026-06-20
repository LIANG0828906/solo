import { Book } from '../types';

const mockBooks: Book[] = [
  {
    isbn: '9787020002207',
    title: '红楼梦',
    author: '曹雪芹',
    cover: 'https://picsum.photos/seed/book1/200/280'
  },
  {
    isbn: '9787020002214',
    title: '三国演义',
    author: '罗贯中',
    cover: 'https://picsum.photos/seed/book2/200/280'
  },
  {
    isbn: '9787020002221',
    title: '水浒传',
    author: '施耐庵',
    cover: 'https://picsum.photos/seed/book3/200/280'
  },
  {
    isbn: '9787020002238',
    title: '西游记',
    author: '吴承恩',
    cover: 'https://picsum.photos/seed/book4/200/280'
  },
  {
    isbn: '9787544270878',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    cover: 'https://picsum.photos/seed/book5/200/280'
  },
  {
    isbn: '9787544270885',
    title: '霍乱时期的爱情',
    author: '加西亚·马尔克斯',
    cover: 'https://picsum.photos/seed/book6/200/280'
  },
  {
    isbn: '9787020070886',
    title: '围城',
    author: '钱钟书',
    cover: 'https://picsum.photos/seed/book7/200/280'
  },
  {
    isbn: '9787020070893',
    title: '活着',
    author: '余华',
    cover: 'https://picsum.photos/seed/book8/200/280'
  },
  {
    isbn: '9787532736917',
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    cover: 'https://picsum.photos/seed/book9/200/280'
  },
  {
    isbn: '9787544253994',
    title: '解忧杂货店',
    author: '东野圭吾',
    cover: 'https://picsum.photos/seed/book10/200/280'
  }
];

export const bookApi = {
  async searchBooks(query: string): Promise<Book[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (query.length < 3) {
          resolve([]);
          return;
        }
        const results = mockBooks.filter(
          (book) =>
            book.title.toLowerCase().includes(query.toLowerCase()) ||
            book.author.toLowerCase().includes(query.toLowerCase())
        );
        resolve(results);
      }, 300);
    });
  },

  async getBookByIsbn(isbn: string): Promise<Book | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const book = mockBooks.find((b) => b.isbn === isbn);
        resolve(book || null);
      }, 200);
    });
  },

  async getBookshelfBooks(): Promise<{ book: Book; progress: number; addedAt: string }[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = mockBooks.slice(0, 6).map((book, index) => ({
          book,
          progress: Math.floor(Math.random() * 100),
          addedAt: new Date(Date.now() - index * 86400000).toISOString()
        }));
        resolve(items);
      }, 400);
    });
  }
};
