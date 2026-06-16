import type { User, Book, Chapter, Review } from './types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'BookNookDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export function initDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id' });
        usersStore.createIndex('username', 'username', { unique: true });
      }

      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('chapters')) {
        const chaptersStore = db.createObjectStore('chapters', { keyPath: 'id' });
        chaptersStore.createIndex('bookId_order', ['bookId', 'order'], { unique: false });
      }

      if (!db.objectStoreNames.contains('reviews')) {
        const reviewsStore = db.createObjectStore('reviews', { keyPath: 'id' });
        reviewsStore.createIndex('bookId_userId_createdAt', ['bookId', 'userId', 'createdAt'], { unique: false });
      }

      const tx = (event.target as IDBOpenDBRequest).transaction;
      if (tx) {
        tx.oncomplete = () => {
          seedData(db).then(() => resolve()).catch(reject);
        };
      }
    };
  });
}

function seedData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const users: User[] = [
      { id: uuidv4(), username: 'alice', password: '123456', avatarColor: '#6366f1', createdAt: new Date('2024-01-15').toISOString() },
      { id: uuidv4(), username: 'bob', password: '123456', avatarColor: '#ec4899', createdAt: new Date('2024-02-20').toISOString() },
      { id: uuidv4(), username: 'carol', password: '123456', avatarColor: '#10b981', createdAt: new Date('2024-03-10').toISOString() }
    ];

    const books: Book[] = [
      {
        id: uuidv4(), title: '活着', author: '余华', coverUrl: 'https://covers.openlibrary.org/b/id/123456-L.jpg',
        description: '讲述了农村人福贵悲惨的人生遭遇，讲述了人如何去承受巨大的苦难，讲述了绝望的不存在。',
        avgRating: 4.8, reviewCount: 2
      },
      {
        id: uuidv4(), title: '三体', author: '刘慈欣', coverUrl: 'https://covers.openlibrary.org/b/id/234567-L.jpg',
        description: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。',
        avgRating: 4.7, reviewCount: 2
      },
      {
        id: uuidv4(), title: '平凡的世界', author: '路遥', coverUrl: 'https://covers.openlibrary.org/b/id/345678-L.jpg',
        description: '以中国70年代中期到80年代中期十年间为背景，通过复杂的矛盾纠葛，刻画了当时社会各阶层众多普通人的形象。',
        avgRating: 4.6, reviewCount: 1
      },
      {
        id: uuidv4(), title: '百年孤独', author: '加西亚·马尔克斯', coverUrl: 'https://covers.openlibrary.org/b/id/456789-L.jpg',
        description: '描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰。',
        avgRating: 4.9, reviewCount: 0
      },
      {
        id: uuidv4(), title: '围城', author: '钱钟书', coverUrl: 'https://covers.openlibrary.org/b/id/567890-L.jpg',
        description: '以方鸿渐的生活道路为主线，反映了那个时代某些知识分子生活和心理的变迁沉浮。',
        avgRating: 4.5, reviewCount: 1
      },
      {
        id: uuidv4(), title: '红楼梦', author: '曹雪芹', coverUrl: 'https://covers.openlibrary.org/b/id/678901-L.jpg',
        description: '中国古代章回体长篇小说，中国古典四大名著之一，以贾、史、王、薛四大家族的兴衰为背景。',
        avgRating: 4.9, reviewCount: 0
      }
    ];

    const chapters: Chapter[] = [];
    books.forEach((book, bookIndex) => {
      const chapterCount = 3 + (bookIndex % 3);
      for (let i = 0; i < chapterCount; i++) {
        chapters.push({
          id: uuidv4(),
          bookId: book.id,
          title: `第${i + 1}章 ${['开端', '发展', '高潮', '结局', '尾声'][i]}`,
          pages: [
            `这是《${book.title}》第${i + 1}章的第一页内容。故事从这里开始展开，带领读者进入作者构建的世界。`,
            `这是第${i + 1}章的第二页。情节逐渐深入，人物形象更加丰满，读者被深深吸引。`,
            `这是第${i + 1}章的第三页。本章即将结束，为下一章留下了悬念，让人迫不及待想继续阅读。`
          ],
          order: i + 1
        });
      }
    });

    const reviews: Review[] = [
      {
        id: uuidv4(), bookId: books[0].id, userId: users[0].id, username: users[0].username,
        userAvatarColor: users[0].avatarColor, rating: 5, content: '余华的文字朴实无华，却有着直击人心的力量。福贵的一生让我泪流满面。',
        likedBy: [users[1].id], createdAt: new Date('2024-04-01').toISOString()
      },
      {
        id: uuidv4(), bookId: books[0].id, userId: users[1].id, username: users[1].username,
        userAvatarColor: users[1].avatarColor, rating: 5, content: '读了很多遍，每次都有不同的感受。活着本身就是一种力量。',
        likedBy: [users[0].id, users[2].id], createdAt: new Date('2024-04-15').toISOString()
      },
      {
        id: uuidv4(), bookId: books[1].id, userId: users[1].id, username: users[1].username,
        userAvatarColor: users[1].avatarColor, rating: 5, content: '中国科幻的巅峰之作！宏大的世界观，让人对宇宙和人类命运有了更深的思考。',
        likedBy: [users[0].id], createdAt: new Date('2024-05-01').toISOString()
      },
      {
        id: uuidv4(), bookId: books[1].id, userId: users[2].id, username: users[2].username,
        userAvatarColor: users[2].avatarColor, rating: 4, content: '想象力令人叹为观止，有些科学概念虽然不太懂，但不妨碍它是一部伟大的作品。',
        likedBy: [], createdAt: new Date('2024-05-10').toISOString()
      },
      {
        id: uuidv4(), bookId: books[2].id, userId: users[0].id, username: users[0].username,
        userAvatarColor: users[0].avatarColor, rating: 5, content: '路遥用生命写成的巨著，每次读都被孙少安孙少平兄弟的奋斗精神所感动。',
        likedBy: [users[1].id, users[2].id], createdAt: new Date('2024-05-20').toISOString()
      },
      {
        id: uuidv4(), bookId: books[4].id, userId: users[2].id, username: users[2].username,
        userAvatarColor: users[2].avatarColor, rating: 4, content: '钱钟书先生的讽刺幽默入木三分，"围城"这个比喻太精妙了，婚姻如此，人生亦如此。',
        likedBy: [users[0].id], createdAt: new Date('2024-06-01').toISOString()
      }
    ];

    const tx = db.transaction(['users', 'books', 'chapters', 'reviews'], 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const usersStore = tx.objectStore('users');
    users.forEach(user => usersStore.add(user));

    const booksStore = tx.objectStore('books');
    books.forEach(book => booksStore.add(book));

    const chaptersStore = tx.objectStore('chapters');
    chapters.forEach(chapter => chaptersStore.add(chapter));

    const reviewsStore = tx.objectStore('reviews');
    reviews.forEach(review => reviewsStore.add(review));
  });
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
  });
}

export function getAllBooks(): Promise<Book[]> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getBookById(id: string): Promise<Book | undefined> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getChaptersByBookId(bookId: string): Promise<Chapter[]> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const index = store.index('bookId_order');
    const request = index.getAll(IDBKeyRange.bound([bookId], [bookId, []]));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getReviewsByBookId(bookId: string): Promise<Review[]> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('reviews', 'readonly');
    const store = tx.objectStore('reviews');
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as Review[];
      resolve(all.filter(r => r.bookId === bookId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    request.onerror = () => reject(request.error);
  });
}

export function addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const newReview: Review = {
      ...review,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    const tx = db.transaction(['reviews', 'books'], 'readwrite');
    const reviewsStore = tx.objectStore('reviews');
    reviewsStore.add(newReview);
    
    const booksStore = tx.objectStore('books');
    const bookRequest = booksStore.get(review.bookId);
    bookRequest.onsuccess = () => {
      const book = bookRequest.result as Book;
      if (book) {
        const newCount = book.reviewCount + 1;
        const newAvg = (book.avgRating * book.reviewCount + review.rating) / newCount;
        book.reviewCount = newCount;
        book.avgRating = Math.round(newAvg * 10) / 10;
        booksStore.put(book);
      }
    };
    
    tx.oncomplete = () => resolve(newReview);
    tx.onerror = () => reject(tx.error);
  });
}

export function createReview(review: Omit<Review, 'id' | 'createdAt' | 'likedBy'>): Promise<Review> {
  return addReview({ ...review, likedBy: [] });
}

export function updateReview(review: Review): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('reviews', 'readwrite');
    const store = tx.objectStore('reviews');
    store.put(review);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function getReviewsByUserId(userId: string): Promise<Review[]> {
  return getUserReviews(userId);
}

export function updateReviewLikes(reviewId: string, userId: string): Promise<Review> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('reviews', 'readwrite');
    const store = tx.objectStore('reviews');
    const request = store.get(reviewId);
    request.onsuccess = () => {
      const review = request.result as Review;
      if (review) {
        const likedIndex = review.likedBy.indexOf(userId);
        if (likedIndex > -1) {
          review.likedBy.splice(likedIndex, 1);
        } else {
          review.likedBy.push(userId);
        }
        store.put(review);
        tx.oncomplete = () => resolve(review);
      } else {
        reject(new Error('Review not found'));
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export function getUserByUsername(username: string): Promise<User | null> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('users', 'readonly');
    const store = tx.objectStore('users');
    const index = store.index('username');
    const request = index.get(username);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    store.add(newUser);
    tx.oncomplete = () => resolve(newUser);
    tx.onerror = () => reject(tx.error);
  });
}

export function updateUser(user: User): Promise<User> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    store.put(user);
    tx.oncomplete = () => resolve(user);
    tx.onerror = () => reject(tx.error);
  });
}

export function getUserReviews(userId: string): Promise<Review[]> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('reviews', 'readonly');
    const store = tx.objectStore('reviews');
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as Review[];
      resolve(all.filter(r => r.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    request.onerror = () => reject(request.error);
  });
}

export function getAllUsers(): Promise<User[]> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const tx = db.transaction('users', 'readonly');
    const store = tx.objectStore('users');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export default initDB;
