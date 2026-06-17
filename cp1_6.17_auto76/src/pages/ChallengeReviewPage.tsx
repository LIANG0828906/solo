import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useChallengeStore } from '@/store/challengeStore';
import { useReviewStore } from '@/store/reviewStore';
import { CodeEditor } from '@/components/CodeEditor';
import { StarRating } from '@/components/StarRating';
import type { Submission } from '@/types';

export const ChallengeReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialSubmissionId = searchParams.get('submission');

  const loadChallenges = useChallengeStore((s) => s.loadChallenges);
  const getChallengeById = useChallengeStore((s) => s.getChallengeById);
  const initMockData = useReviewStore((s) => s.initMockData);
  const getSubmissionsByChallenge = useReviewStore((s) => s.getSubmissionsByChallenge);
  const getReviewsBySubmission = useReviewStore((s) => s.getReviewsBySubmission);
  const getAverageRating = useReviewStore((s) => s.getAverageRating);
  const addReview = useReviewStore((s) => s.addReview);

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewKey, setReviewKey] = useState(0);

  const challenge = id ? getChallengeById(id) : undefined;
  const submissions = id ? getSubmissionsByChallenge(id) : [];

  useEffect(() => {
    loadChallenges();
    initMockData();
  }, [loadChallenges, initMockData]);

  useEffect(() => {
    if (submissions.length > 0) {
      const initial = initialSubmissionId
        ? submissions.find((s) => s.id === initialSubmissionId)
        : undefined;
      setSelectedSubmission(initial || submissions[0]);
    }
  }, [submissions, initialSubmissionId]);

  const reviews = selectedSubmission ? getReviewsBySubmission(selectedSubmission.id) : [];
  const averageRating = selectedSubmission ? getAverageRating(selectedSubmission.id) : 0;

  const handleSubmitReview = async () => {
    if (!selectedSubmission || rating === 0) return;

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    addReview(selectedSubmission.id, rating, comment);
    setRating(0);
    setComment('');
    setReviewKey((k) => k + 1);
    setSubmitting(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '96px 24px 48px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Link
            to="/challenges"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              color: 'var(--text-muted)',
              marginBottom: 8,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <span>←</span>
            返回列表
          </Link>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {challenge?.title || '评审区'}
          </h1>
        </div>
        <Link
          to={`/challenge/${id}/submit`}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--accent-primary)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
          }}
        >
          重新提交代码
        </Link>
      </div>

      {submissions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {submissions.map((sub) => {
            const isActive = selectedSubmission?.id === sub.id;
            const avg = getAverageRating(sub.id);
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                style={{
                  flexShrink: 0,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-color)',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{sub.userName}</span>
                {avg > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#FBBF24',
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    ⭐ {avg}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: 24,
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          className="fade-in"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {selectedSubmission?.userName?.[0] || '?'}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {selectedSubmission?.userName || '未知用户'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  {selectedSubmission ? formatDate(selectedSubmission.createdAt) : ''}
                </div>
              </div>
            </div>
            {averageRating > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <span style={{ fontSize: 14 }}>⭐</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#FBBF24',
                  }}
                >
                  {averageRating}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  ({reviews.length})
                </span>
              </div>
            )}
          </div>

          {selectedSubmission ? (
            <CodeEditor value={selectedSubmission.code} readOnly height="520px" />
          ) : (
            <div
              style={{
                padding: '80px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>💻</div>
              <p>暂无提交代码可供评审</p>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: 24,
            }}
            className="fade-in"
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 20,
              }}
            >
              提交评审
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 10,
                }}
              >
                评分
              </label>
              <StarRating value={rating} onChange={setRating} size={32} />
              {rating > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: '#FBBF24',
                  }}
                >
                  {rating === 1 && '很差'}
                  {rating === 2 && '较差'}
                  {rating === 3 && '一般'}
                  {rating === 4 && '不错'}
                  {rating === 5 && '非常棒！'}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 10,
                }}
              >
                评论
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="分享你对这段代码的看法..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 14,
                  backgroundColor: '#2D2A4A',
                  border: '1px solid #4A4470',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  lineHeight: 1.6,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#4A4470';
                }}
              />
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={rating === 0 || submitting}
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: rating === 0 || submitting ? '#4A4470' : 'var(--accent-primary)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s ease',
                cursor: rating === 0 ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (rating > 0 && !submitting) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (rating > 0 && !submitting) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                }
              }}
            >
              {submitting ? '提交中...' : '提交评审'}
            </button>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: 24,
              flex: 1,
            }}
            className="fade-in"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                评审记录
              </h2>
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                {reviews.length} 条
              </span>
            </div>

            {reviews.length > 0 ? (
              <div
                key={reviewKey}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  maxHeight: 400,
                  overflowY: 'auto',
                  paddingRight: 8,
                }}
              >
                {reviews.map((review, idx) => (
                  <div
                    key={review.id}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      animation: `fadeIn 0.25s ease forwards`,
                      animationDelay: `${idx * 0.05}s`,
                      opacity: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: '#8B5CF6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {review.reviewerName[0]}
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {review.reviewerName}
                        </span>
                      </div>
                      <StarRating value={review.rating} onChange={() => {}} readOnly size={16} />
                    </div>
                    {review.comment && (
                      <p
                        style={{
                          fontSize: 14,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          marginTop: 8,
                        }}
                      >
                        {review.comment}
                      </p>
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 10,
                      }}
                    >
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                <p style={{ fontSize: 14 }}>暂无评审，成为第一个评审者吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          [style*="grid-template-columns: minmax(0, 3fr) minmax(0, 2fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
