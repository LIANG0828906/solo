import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ParticleRenderer from '../components/ParticleRenderer';
import { useDiaryStore, emotionToColor, coordsToEmotion } from '../store/diaryStore';
import { mockDiaryApi } from '../api/diaryApi';
import type { Comment, DiaryEntry } from '../types';

export default function DiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const diaries = useDiaryStore((s) => s.diaries);
  const setCurrentDiary = useDiaryStore((s) => s.setCurrentDiary);
  const currentUser = useDiaryStore((s) => s.currentUser);
  const addComment = useDiaryStore((s) => s.addComment);

  const [diary, setDiary] = useState<DiaryEntry | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const found = diaries.find((d) => d.id === id);
    if (found) {
      setDiary(found);
      setCurrentDiary(found);
      const emotion = coordsToEmotion(found.emotionCoords);
      if (found.emotionType !== emotion.type || found.emotionKeyword !== emotion.keyword) {
        setDiary({ ...found, emotionType: emotion.type, emotionKeyword: emotion.keyword });
      }
    }

    mockDiaryApi.getComments(id || '').then((data) => {
      setComments(data.length > 0 ? data : []);
    });
  }, [id, diaries, setCurrentDiary]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !diary || !currentUser) return;

    setSubmitting(true);
    try {
      const newComment = await mockDiaryApi.createComment({
        diaryId: diary.id,
        userId: currentUser.id,
        userName: currentUser.name,
        content: commentText.trim(),
      });
      setComments((prev) => [newComment, ...prev]);
      addComment(newComment);
      setCommentText('');
    } catch (err) {
      console.error('评论失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}`;
  };

  if (!diary) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <p style={{ color: '#888', marginBottom: '20px' }}>日记不存在或已被删除</p>
        <button
          onClick={() => navigate('/browse')}
          style={{
            padding: '10px 24px',
            borderRadius: '20px',
            background: 'linear-gradient(90deg, #00E5FF, #00BFFF)',
            color: '#0D0D1A',
            fontWeight: 600,
          }}
        >
          返回广场
        </button>
      </div>
    );
  }

  const emotionColor = emotionToColor(diary.emotionType);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ position: 'relative', height: '60vh', minHeight: '400px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <ParticleRenderer
            emotionCoords={diary.emotionCoords}
            emotionType={diary.emotionType}
            particleCount={200}
            width={typeof window !== 'undefined' ? window.innerWidth : 1200}
            height={typeof window !== 'undefined' ? window.innerHeight * 0.6 : 500}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(13, 13, 26, 0.6) 60%, #0D0D1A 100%)',
          }}
        />

        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            padding: '10px 20px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          ← 返回
        </button>

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '20%',
            right: '20%',
            color: '#fff',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '16px',
              backgroundColor: emotionColor,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            {diary.emotionKeyword}
          </div>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>{formatDate(diary.createdAt)}</p>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: '0', marginTop: '-20px' }}>
        <div
          style={{
            background: '#1E1E2E',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
          }}
        >
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>
            {diary.textContent || '（无文字记录）'}
          </p>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #2a2a3e',
              display: 'flex',
              gap: '24px',
              fontSize: '13px',
              color: '#888',
            }}
          >
            <span>💬 {comments.length} 条留言</span>
            <span>{diary.isPublic ? '🌐 公开日记' : '🔒 私密日记'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '18px' }}>留言 ({comments.length})</h3>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: '#1E1E2E',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00E5FF, #00BFFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0D0D1A',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {currentUser?.name?.[0] || 'U'}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的留言..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a3e',
                  backgroundColor: '#0D0D1A',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  resize: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '20px',
                    background: commentText.trim()
                      ? 'linear-gradient(90deg, #00E5FF, #00BFFF)'
                      : '#2a2a3e',
                    color: commentText.trim() ? '#0D0D1A' : '#666',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {submitting ? '发送中...' : '发送留言'}
                </button>
              </div>
            </div>
          </div>

          {comments.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '32px 0', fontSize: '14px' }}>
              暂无留言，成为第一个留言的人吧
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    background: '#1E1E2E',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: emotionColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {comment.userName?.[0] || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>
                        {comment.userName}
                      </span>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#ccc' }}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
