import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Book, Review } from '../types';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';

interface ReviewListResult {
  data: Review[];
  total: number;
  page: number;
  pageSize: number;
}

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    userName: '',
    rating: 0,
    content: '',
    images: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookRes, reviewsRes] = await Promise.all([
          fetch(`/api/books/${id}`),
          fetch(`/api/books/${id}/reviews?pageSize=20`),
        ]);

        const bookData: Book = await bookRes.json();
        const reviewsData: ReviewListResult = await reviewsRes.json();

        setBook(bookData);
        setReviews(reviewsData.data);
      } catch (e) {
        console.error('Failed to fetch book detail:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          uploadedUrls.push(result.url);
        }
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (e) {
      console.error('Failed to upload images:', e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || submitting) return;
    if (!form.userName || !form.rating || !form.content) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/books/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: form.userName,
          rating: form.rating,
          content: form.content,
          images: form.images,
        }),
      });

      if (res.ok) {
        const newReview: Review = await res.json();
        setReviews((prev) => [newReview, ...prev]);
        setForm({
          userName: '',
          rating: 0,
          content: '',
          images: [],
        });
      }
    } catch (e) {
      console.error('Failed to submit review:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF0E6', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', color: '#A1887F' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF0E6', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', color: '#A1887F' }}>
          书籍不存在
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF0E6' }}>
      <div
        onClick={() => navigate('/')}
        style={{
          color: '#8D6E63',
          padding: '16px 24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.textDecoration = 'underline'; }}
        onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.textDecoration = 'none'; }}
      >
        ← 返回首页
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '32px',
            flexWrap: 'wrap',
          }}
          className="book-info-section"
        >
          <div style={{ width: '320px', flexShrink: 0 }} className="book-cover-wrapper">
            <div
              style={{
                height: '440px',
                background: book.coverGradient,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  color: 'white',
                  fontSize: '26px',
                  fontWeight: 700,
                  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {book.title}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '15px',
                  marginTop: '8px',
                  textAlign: 'center',
                }}
              >
                {book.author}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '24px 0', minWidth: '300px' }}>
            <h1
              style={{
                fontFamily: 'var(--font-serif, "Noto Serif SC", serif)',
                fontSize: '30px',
                fontWeight: 700,
                color: '#3E2723',
                lineHeight: 1.3,
              }}
            >
              {book.title}
            </h1>
            <div style={{ fontSize: '16px', color: '#6D4C41', marginTop: '6px' }}>
              {book.author}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div
                style={{
                  background: '#F5E6D3',
                  color: '#6D4C41',
                  fontSize: '13px',
                  padding: '4px 12px',
                  borderRadius: '12px',
                }}
              >
                {book.category}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StarRating rating={book.condition} size={20} />
                <span style={{ color: '#6D4C41', fontSize: '14px' }}>品相 {book.condition}星</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', fontSize: '36px', fontWeight: 700, color: '#FF7043' }}>
              ¥{book.price.toFixed(2)}
            </div>

            <div
              style={{
                marginTop: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px 24px',
                fontSize: '14px',
              }}
              className="meta-grid"
            >
              <div>
                <span style={{ color: '#A1887F' }}>出版社：</span>
                <span style={{ color: '#3E2723' }}>{book.publisher}</span>
              </div>
              <div>
                <span style={{ color: '#A1887F' }}>ISBN：</span>
                <span style={{ color: '#3E2723' }}>{book.isbn}</span>
              </div>
              <div>
                <span style={{ color: '#A1887F' }}>出版年份：</span>
                <span style={{ color: '#3E2723' }}>{book.publishYear}</span>
              </div>
              <div>
                <span style={{ color: '#A1887F' }}>流通次数：</span>
                <span style={{ color: '#3E2723' }}>{book.circulationCount}</span>
              </div>
              <div>
                <span style={{ color: '#A1887F' }}>库存：</span>
                <span style={{ color: '#3E2723' }}>{book.stock}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#3E2723' }}>品相描述</div>
              <div style={{ color: '#6D4C41', lineHeight: 1.7 }}>{book.conditionDesc}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif, "Noto Serif SC", serif)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#3E2723',
              }}
            >
              读者评价 ({reviews.length})
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#A1887F', fontSize: '15px' }}>
              暂无评价，来写第一条评价吧~
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              marginTop: '32px',
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{ fontWeight: 600, fontSize: '18px', marginBottom: '20px', color: '#3E2723' }}>
              发表评价
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                placeholder="请输入昵称"
                value={form.userName}
                onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
                style={{
                  width: '240px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #D7CCC8',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StarRating
                  rating={form.rating}
                  interactive={true}
                  size={28}
                  onChange={(r) => setForm((f) => ({ ...f, rating: r }))}
                />
                <span style={{ color: '#6D4C41', fontSize: '14px' }}>给个评分</span>
              </div>
            </div>

            <textarea
              placeholder="分享你的阅读感受和书籍状态..."
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid #D7CCC8',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '16px',
              }}
            />

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    background: '#F5E6D3',
                    color: '#6D4C41',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {uploading ? '上传中...' : '+ 添加图片'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
              {form.images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 80px)', gap: '8px' }}>
                  {form.images.map((img, index) => (
                    <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img
                        src={img}
                        alt={`图片 ${index + 1}`}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid #D7CCC8',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                disabled={submitting || !form.userName || !form.rating || !form.content}
                style={{
                  background: '#FF7043',
                  color: 'white',
                  padding: '10px 32px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: submitting || !form.userName || !form.rating || !form.content ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  if (!btn.disabled) btn.style.background = '#F4511E';
                }}
                onMouseOut={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  if (!btn.disabled) btn.style.background = '#FF7043';
                }}
              >
                {submitting ? '提交中...' : '提交评价'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .book-info-section {
            flex-direction: column !important;
            align-items: center;
          }
          .book-cover-wrapper {
            width: 100% !important;
            max-width: 320px;
          }
          .meta-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
