import React, { useEffect, useState, useRef } from 'react';
import { Empty, Spin } from 'antd';
import { Book } from '../types';
import { bookApi } from '../api/bookApi';
import dayjs from 'dayjs';
import './Bookshelf.css';

interface BookshelfItemData {
  id: string;
  book: Book;
  progress: number;
  addedAt: string;
}

const Bookshelf: React.FC = () => {
  const [books, setBooks] = useState<BookshelfItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    loadBookshelf();
  }, []);

  const loadBookshelf = async () => {
    setLoading(true);
    try {
      const data = await bookApi.getBookshelfBooks();
      const items = data.map((item, index) => ({
        id: `shelf-${index}`,
        ...item
      }));
      setBooks(items);
    } catch (error) {
      console.error('加载书架失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    books.forEach((item) => {
      const canvas = canvasRefs.current.get(item.id);
      if (canvas) {
        drawProgressRing(canvas, item.progress);
      }
    });
  }, [books]);

  const drawProgressRing = (canvas: HTMLCanvasElement, progress: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 60;
    const lineWidth = 5;
    const center = size / 2;
    const radius = center - lineWidth;

    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, '#2ecc71');

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (progress / 100) * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${progress}%`, center, center);
  };

  const setCanvasRef = (id: string) => (el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(id, el);
    }
  };

  if (loading) {
    return (
      <div className="bookshelf-page">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="bookshelf-page">
      <div className="bookshelf-header">
        <h1 className="bookshelf-title">我的书架</h1>
        <span className="bookshelf-count">共 {books.length} 本书</span>
      </div>

      {books.length === 0 ? (
        <Empty description="书架空空如也，去添加一些书吧" />
      ) : (
        <div className="books-grid">
          {books.map((item) => (
            <div key={item.id} className="book-card-wrapper">
              <div className="book-card">
                <div className="book-cover-container">
                  <img
                    src={item.book.cover}
                    alt={item.book.title}
                    className="book-cover"
                  />
                  <div className="progress-overlay">
                    <canvas
                      ref={setCanvasRef(item.id)}
                      className="progress-ring"
                    />
                  </div>
                </div>
                <div className="book-info">
                  <h3 className="book-title" title={item.book.title}>
                    {item.book.title}
                  </h3>
                  <p className="book-author">{item.book.author}</p>
                  <p className="book-added">
                    收藏于 {dayjs(item.addedAt).format('YYYY-MM-DD')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
