import { Book, Reader, BorrowRecord } from '@/types';

const categories = ['文学', '科幻', '历史', '经济', '哲学', '艺术', '科技', '传记', '小说', '教育'];
const authors = ['村上春树', '余华', '刘慈欣', '海明威', '马尔克斯', '王小波', '张爱玲', '鲁迅', '莫言', '陈忠实'];
const coverColors = ['#8B4513', '#2F4F4F', '#556B2F', '#4B0082', '#800000', '#191970', '#2E8B57', '#8B008B', '#B8860B', '#CD5C5C'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function generateBooks(count: number): Book[] {
  const books: Book[] = [];
  const titleTemplates = [
    '《{0}的故事》', '《{0}之旅》', '《{0}时代》', '《{0}的秘密》',
    '《看见{0}》', '《{0}之道》', '《{0}与我》', '《{0}的回响》',
    '《{0}编年史》', '《{0}的艺术》'
  ];

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)].replace('{0}', category);
    
    books.push({
      id: generateId(),
      title,
      author,
      isbn: `978-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 10)}`,
      category,
      stock: Math.floor(Math.random() * 20) + 1,
      borrowCount: Math.floor(Math.random() * 100),
      coverColor: coverColors[Math.floor(Math.random() * coverColors.length)],
      hotLevel: Math.floor(Math.random() * 5) + 1,
    });
  }
  return books;
}

function generateReaders(count: number): Reader[] {
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二', '陈十三', '楚十四'];
  const readers: Reader[] = [];

  for (let i = 0; i < count; i++) {
    readers.push({
      id: generateId(),
      name: names[i % names.length] + (Math.floor(i / names.length) || ''),
      borrowCount: Math.floor(Math.random() * 30),
      overdueCount: Math.floor(Math.random() * 5),
      preferredCategories: [
        categories[Math.floor(Math.random() * categories.length)],
        categories[Math.floor(Math.random() * categories.length)],
      ].filter((v, i, a) => a.indexOf(v) === i),
      preferredAuthors: [
        authors[Math.floor(Math.random() * authors.length)],
        authors[Math.floor(Math.random() * authors.length)],
      ].filter((v, i, a) => a.indexOf(v) === i),
    });
  }
  return readers;
}

function generateBorrowRecords(readers: Reader[], books: Book[], count: number): BorrowRecord[] {
  const records: BorrowRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const reader = readers[Math.floor(Math.random() * readers.length)];
    const book = books[Math.floor(Math.random() * books.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const borrowDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const isReturned = Math.random() > 0.4;
    const isOverdue = !isReturned && now > dueDate;

    records.push({
      id: generateId(),
      readerId: reader.id,
      bookId: book.id,
      borrowDate,
      dueDate,
      returnDate: isReturned ? new Date(borrowDate.getTime() + (Math.floor(Math.random() * 12) + 1) * 24 * 60 * 60 * 1000) : undefined,
      isOverdue,
    });
  }
  return records;
}

export const mockBooks: Book[] = generateBooks(1000);
export const mockReaders: Reader[] = generateReaders(50);
export const mockBorrowRecords: BorrowRecord[] = generateBorrowRecords(mockReaders, mockBooks, 200);
