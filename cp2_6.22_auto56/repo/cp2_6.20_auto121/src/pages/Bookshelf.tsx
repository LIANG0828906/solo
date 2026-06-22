import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BookInfo } from '../api/bookApi';
import { drawProgressRing } from '../utils/progressRing';

interface BookshelfBook {
  id: string;
  title: string;
  cover: string;
  author: string;
  progress: number;
  notes: { date: string; content: string }[];
  reviews: { content: string; date: string }[];
}

const mockBooks: BookshelfBook[] = [
  {
    id: 'b1',
    title: '百年孤独',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%20One%20Hundred%20Years%20of%20Solitude%2C%20magical%20realism%20style&image_size=square_hd',
    author: '加西亚·马尔克斯',
    progress: 72,
    notes: [
      { date: '2026-06-18', content: '布恩迪亚家族的循环命运让人深思' },
      { date: '2026-06-10', content: '马孔多的建立与衰亡象征着整个拉丁美洲的历史' },
    ],
    reviews: [{ content: '魔幻现实主义的巅峰之作', date: '2026-06-01' }],
  },
  {
    id: 'b2',
    title: '人类简史',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%20Sapiens%20A%20Brief%20History%20of%20Humankind%2C%20modern%20design&image_size=square_hd',
    author: '尤瓦尔·赫拉利',
    progress: 45,
    notes: [{ date: '2026-06-15', content: '认知革命是人类区别于其他物种的关键' }],
    reviews: [],
  },
  {
    id: 'b3',
    title: '1984',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%201984%20by%20George%20Orwell%2C%20dystopian%20style&image_size=square_hd',
    author: '乔治·奥威尔',
    progress: 100,
    notes: [
      { date: '2026-06-12', content: '老大哥的监视无处不在' },
      { date: '2026-06-08', content: '新语的目的在于限制思想自由' },
    ],
    reviews: [{ content: '极权主义的警世预言', date: '2026-05-20' }],
  },
  {
    id: 'b4',
    title: '三体',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%20The%20Three-Body%20Problem%2C%20sci-fi%20cosmic%20style&image_size=square_hd',
    author: '刘慈欣',
    progress: 88,
    notes: [{ date: '2026-06-05', content: '黑暗森林法则令人不寒而栗' }],
    reviews: [{ content: '中国科幻的里程碑', date: '2026-05-10' }],
  },
  {
    id: 'b5',
    title: '小王子',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%20The%20Little%20Prince%2C%20watercolor%20illustration%20style&image_size=square_hd',
    author: '圣·埃克苏佩里',
    progress: 60,
    notes: [{ date: '2026-05-28', content: '重要的东西用眼睛是看不见的' }],
    reviews: [],
  },
  {
    id: 'b6',
    title: '追风筝的人',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%20The%20Kite%20Runner%2C%20warm%20literary%20style&image_size=square_hd',
    author: '卡勒德·胡赛尼',
    progress: 33,
    notes: [],
    reviews: [{ content: '关于友情与救赎的感人故事', date: '2026-04-15' }],
  },
];

const Bookshelf: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<BookshelfBook | null>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    mockBooks.forEach((book) => {
      const canvas = canvasRefs.current[book.id];
      if (canvas) drawProgressRing(canvas, book.progress);
    });
  }, [selectedBook]);

  if (selectedBook) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelectedBook(null)}>
          ← 返回书架
        </button>
        <div className="book-detail-header">
          <img className="book-detail-cover" src={selectedBook.cover} alt={selectedBook.title} />
          <div className="book-detail-info">
            <h2>{selectedBook.title}</h2>
            <p>作者: {selectedBook.author}</p>
            <p>阅读进度: {selectedBook.progress}%</p>
          </div>
        </div>
        {selectedBook.reviews.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 16 }}>📖 我的书评</h3>
            {selectedBook.reviews.map((r, i) => (
              <div key={i} className="note-item" style={{ marginLeft: 0 }}>
                <div className="note-date">{r.date}</div>
                <div className="note-content">{r.content}</div>
              </div>
            ))}
          </div>
        )}
        <h3 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 16 }}>📝 笔记与标注</h3>
        <div className="notes-timeline">
          {selectedBook.notes.length > 0 ? (
            selectedBook.notes.map((note, i) => (
              <div key={i} className="note-item">
                <div className="note-date">{note.date}</div>
                <div className="note-content">{note.content}</div>
              </div>
            ))
          ) : (
            <p style={{ color: '#95a5a6', fontSize: 14 }}>暂无笔记</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">我的书架</h1>
      </div>
      <div className="bookshelf-grid">
        {mockBooks.map((book) => (
          <div
            key={book.id}
            className="bookshelf-item"
            onClick={() => setSelectedBook(book)}
          >
            <div className="bookshelf-cover-wrapper">
              <img className="bookshelf-cover" src={book.cover} alt={book.title} />
              <div className="bookshelf-progress-overlay">
                <canvas
                  ref={(el) => {
                    canvasRefs.current[book.id] = el;
                  }}
                  width={60}
                  height={60}
                />
              </div>
            </div>
            <div className="bookshelf-title">{book.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bookshelf;
