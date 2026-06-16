import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Send, BookOpen, Eye, MessageSquare } from 'lucide-react';
import { useStore } from '@/store';
import type { Work } from '@/types';

export default function WorkSubmitReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const themes = useStore(s => s.themes);
  const works = useStore(s => s.works);
  const reviews = useStore(s => s.reviews);
  const currentUserId = useStore(s => s.currentUserId);
  const submitWork = useStore(s => s.submitWork);
  const addReview = useStore(s => s.addReview);

  const theme = themes.find(t => t.id === id);
  const themeWorks = works.filter(w => w.themeId === id);

  const [reviewingWork, setReviewingWork] = useState<Work | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [animatingStar, setAnimatingStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitContent, setSubmitContent] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [workSubmitted, setWorkSubmitted] = useState(false);

  const hasReviewed = useCallback((workId: string) => {
    return reviews.some(r => r.workId === workId && r.reviewerId === currentUserId);
  }, [reviews, currentUserId]);

  const isOwnWork = useCallback((work: Work) => {
    return work.authorId === currentUserId;
  }, [currentUserId]);

  const handleStarClick = (starNum: number) => {
    setRating(starNum);
    setAnimatingStar(starNum);
    setTimeout(() => setAnimatingStar(0), 200);
  };

  const handleSubmitReview = () => {
    if (!reviewingWork || rating === 0) return;
    addReview(reviewingWork.id, rating, comment.trim());
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewingWork(null);
      setRating(0);
      setComment('');
      setReviewSubmitted(false);
    }, 1200);
  };

  const handleSubmitWork = () => {
    if (!id || !submitTitle.trim() || !submitContent.trim()) return;
    submitWork(id, submitTitle.trim(), submitContent.trim());
    setSubmitTitle('');
    setSubmitContent('');
    setWorkSubmitted(true);
    setTimeout(() => setWorkSubmitted(false), 2000);
  };

  const closeReview = () => {
    setReviewingWork(null);
    setRating(0);
    setComment('');
    setReviewSubmitted(false);
  };

  if (!theme) {
    return (
      <div className="text-center py-20">
        <p className="text-bark-muted font-sans">主题不存在</p>
        <button className="btn-secondary mt-4" onClick={() => navigate('/')}>返回列表</button>
      </div>
    );
  }

  const isOpen = theme.status === 'open';

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-secondary py-2 px-3" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-sans text-bark">{theme.title}</h1>
          <p className="text-sm text-bark-muted font-sans">
            {theme.description || '暂无描述'}
            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${isOpen ? 'bg-ink/10 text-ink' : 'bg-bark-muted/10 text-bark-muted'}`}>
              {isOpen ? '进行中' : '已截止'}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-bark flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-ink" />
              匿名作品
              <span className="text-sm font-normal text-bark-muted">({themeWorks.length}篇)</span>
            </h2>
          </div>

          {themeWorks.length === 0 ? (
            <div className="text-center py-12 bg-parchment-light/50 rounded-lg border border-parchment-dark/20">
              <BookOpen className="w-8 h-8 text-bark-muted/40 mx-auto mb-2" />
              <p className="text-bark-muted text-sm font-sans">暂无作品，成为第一个提交者吧</p>
            </div>
          ) : (
            <div className="space-y-3">
              {themeWorks.map(work => {
                const own = isOwnWork(work);
                const reviewed = hasReviewed(work.id);
                return (
                  <div
                    key={work.id}
                    className={`work-card ${own ? 'border-ink/20 bg-parchment-light/70' : ''}`}
                    onClick={() => !own && !reviewed && setReviewingWork(work)}
                    role={own || reviewed ? undefined : 'button'}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-sans font-bold text-bark text-sm">
                            {own ? '我的作品' : `作品#${work.anonymousIndex}`}
                          </span>
                          {own && (
                            <span className="text-xs bg-ink/10 text-ink px-1.5 py-0.5 rounded font-sans">本人</span>
                          )}
                          {reviewed && !own && (
                            <span className="text-xs bg-gold/10 text-gold-dark px-1.5 py-0.5 rounded font-sans">已评</span>
                          )}
                        </div>
                        <p className="text-sm text-bark-muted font-serif line-clamp-2" style={{ textIndent: 0 }}>
                          {work.content.slice(0, 100)}{work.content.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      {!own && !reviewed && (
                        <Eye className="w-4 h-4 text-ink/50 shrink-0 ml-2 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <h2 className="font-sans font-bold text-bark flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-ink" />
            提交作品
          </h2>

          {workSubmitted ? (
            <div className="bg-ink/5 border border-ink/20 rounded-lg p-5 text-center animate-fade-in">
              <div className="text-ink text-2xl mb-2">✓</div>
              <p className="font-sans text-ink font-medium">作品已提交</p>
              <p className="text-sm text-bark-muted font-sans mt-1">你的作品将以匿名编号展示</p>
            </div>
          ) : !isOpen ? (
            <div className="bg-bark-muted/5 border border-bark-muted/20 rounded-lg p-5 text-center">
              <p className="font-sans text-bark-muted">主题已截止，无法提交新作品</p>
            </div>
          ) : (
            <div className="bg-parchment-light rounded-lg p-5 border border-parchment-dark/20 space-y-4">
              <div>
                <label className="block text-sm font-sans text-bark-light mb-1">作品标题</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="给你的作品起个标题"
                  value={submitTitle}
                  onChange={e => setSubmitTitle(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-sans text-bark-light mb-1">
                  作品正文
                  <span className="text-bark-muted ml-2">{submitContent.length}/2000</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={8}
                  placeholder="在此书写你的原创作品..."
                  value={submitContent}
                  onChange={e => setSubmitContent(e.target.value.slice(0, 2000))}
                />
              </div>
              <button
                className="btn-primary w-full"
                onClick={handleSubmitWork}
                disabled={!submitTitle.trim() || !submitContent.trim()}
              >
                提交作品
              </button>
            </div>
          )}
        </div>
      </div>

      {reviewingWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/30 backdrop-blur-sm" onClick={closeReview}>
          <div className="bg-parchment-light rounded-xl p-6 w-full max-w-2xl shadow-xl border border-parchment-dark/30 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {reviewSubmitted ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="text-ink text-3xl mb-3">✓</div>
                <p className="font-sans text-ink font-bold text-lg">评分已提交</p>
                <p className="text-sm text-bark-muted font-sans mt-1">感谢你的匿名点评</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sans font-bold text-bark">
                    盲评 · 作品#{reviewingWork.anonymousIndex}
                  </h3>
                  <button className="text-bark-muted hover:text-bark font-sans text-sm" onClick={closeReview}>
                    关闭
                  </button>
                </div>

                <div className="bg-parchment/60 rounded-lg p-6 mb-6 border border-parchment-dark/20">
                  <div className="prose-content text-bark text-base">
                    {reviewingWork.content}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-sans text-bark-light mb-2">评分</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          className={`star-btn ${(star <= (hoverRating || rating)) ? 'active' : ''} ${animatingStar === star ? 'filling' : ''}`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleStarClick(star)}
                        >
                          <Star
                            className={`w-5 h-5 transition-colors duration-150 ${
                              star <= (hoverRating || rating) ? 'text-gold fill-gold' : 'text-bark-muted/40'
                            }`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="text-sm text-bark-muted font-sans ml-2">{rating} 分</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-sans text-bark-light mb-1">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      评语
                      <span className="text-bark-muted ml-2">{comment.length}/200</span>
                    </label>
                    <textarea
                      className="input-field resize-none"
                      rows={3}
                      placeholder="写下你对这篇作品的评价..."
                      value={comment}
                      onChange={e => setComment(e.target.value.slice(0, 200))}
                    />
                  </div>

                  <button
                    className="btn-primary w-full"
                    onClick={handleSubmitReview}
                    disabled={rating === 0}
                  >
                    提交评分
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
