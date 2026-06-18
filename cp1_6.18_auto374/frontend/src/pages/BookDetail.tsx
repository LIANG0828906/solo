import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import EmptyState from '@/components/EmptyState';
import { booksAPI, reviewsAPI } from '@/services/api';
import type { Book, Review } from '@/types';

const mockBook: Book = {
  id: '1',
  title: '活着',
  author: '余华',
  cover: 'https://picsum.photos/seed/book1/300/420',
  description: '《活着》是作家余华的代表作之一，讲述了在大时代背景下，随着内战、三反五反、大跃进、文化大革命等社会变革，徐福贵的人生和家庭不断经受着苦难，到了最后所有亲人都先后离他而去，仅剩下年老的他和一头老牛相依为命。',
  progress: 65,
  currentPage: 195,
  totalPages: 300,
  addedAt: '2024-01-15',
  userId: '1',
};

const mockReviews: Review[] = [
  {
    id: '1',
    bookId: '1',
    userId: '2',
    username: '读书人',
    userAvatar: '',
    content: '非常感人的一本书，余华的文字总是能直击人心。福贵的一生让我看到了生命的韧性。',
    rating: 5,
    createdAt: '2024-03-15T10:30:00Z',
  },
  {
    id: '2',
    bookId: '1',
    userId: '3',
    username: '书虫小明',
    userAvatar: '',
    content: '第二次读了，每次都有不同的感受。推荐给所有喜欢文学的朋友。',
    rating: 4,
    createdAt: '2024-03-10T14:20:00Z',
  },
];

function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [progress, setProgress] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBookDetail();
  }, [id]);

  const loadBookDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await booksAPI.getBookDetail(id);
      setBook(response.book);
      setReviews(response.reviews);
      setProgress(response.book.progress);
    } catch (error) {
      console.error('Failed to load book detail:', error);
      setBook(mockBook);
      setReviews(mockReviews);
      setProgress(mockBook.progress);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    setProgress(newProgress);

    try {
      if (book) {
        await booksAPI.updateProgress({
          bookId: book.id,
          progress: newProgress,
        });
        setBook({ ...book, progress: newProgress });
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      if (book) {
        setBook({ ...book, progress: newProgress });
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim() || !book) return;

    setSubmitting(true);
    try {
      const response = await reviewsAPI.addReview({
        bookId: book.id,
        content: reviewContent,
      });
      setReviews([response.review, ...reviews]);
      setReviewContent('');
    } catch (error) {
      const newReview: Review = {
        id: uuidv4(),
        bookId: book.id,
        userId: '1',
        username: '我',
        content: reviewContent,
        createdAt: new Date().toISOString(),
      };
      setReviews([newReview, ...reviews]);
      setReviewContent('');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">加载中...</div>;
  }

  if (!book) {
    return <EmptyState message="书籍不存在" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-nord-accent mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回书架
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <img
              src={book.cover}
              alt={book.title}
              className="w-[300px] h-auto rounded-xl shadow-lg mx-auto"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-nord-textDark mb-2">{book.title}</h1>
            <p className="text-lg text-gray-500 mb-6">作者：{book.author}</p>

            <div className="mb-6">
              <h3 className="font-semibold text-nord-textDark mb-2">书籍简介</h3>
              <p className="text-gray-600 leading-relaxed">{book.description || '暂无简介'}</p>
            </div>

            <div className="bg-nord-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-nord-textDark">阅读进度</span>
                <span className="text-nord-accent font-bold text-xl">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-nord-progress rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={handleProgressChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-nord-accent"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-nord-textDark mb-6">书评</h2>

        <form onSubmit={handleSubmitReview} className="mb-8">
          <textarea
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            rows={4}
            placeholder="写下你的读后感..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none transition-all duration-200 focus:border-nord-accent"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={submitting || !reviewContent.trim()}
              className="px-6 py-2.5 bg-nord-accent hover:bg-[#5E81AC] text-white rounded-lg font-medium
                transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '发表书评'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <EmptyState message="暂无书评，来写第一条吧" />
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-nord-accent flex items-center justify-center text-white font-semibold">
                    {review.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-nord-textDark">{review.username}</p>
                    <p className="text-sm text-gray-400">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed pl-[52px]">{review.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BookDetail;
