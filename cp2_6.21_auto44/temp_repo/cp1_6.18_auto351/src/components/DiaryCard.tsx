import { useNavigate } from 'react-router-dom';
import type { DiaryEntry } from '../types';
import ParticleRenderer from './ParticleRenderer';
import { emotionToBgGradient, emotionToColor } from '../store/diaryStore';

interface DiaryCardProps {
  diary: DiaryEntry;
}

export default function DiaryCard({ diary }: DiaryCardProps) {
  const navigate = useNavigate();
  const bgColor = emotionToBgGradient(diary.emotionType);
  const emotionColor = emotionToColor(diary.emotionType);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  };

  return (
    <div
      onClick={() => navigate(`/diary/${diary.id}`)}
      style={{
        width: '280px',
        height: '360px',
        background: bgColor,
        borderRadius: '12px',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }}
    >
      <div style={{ position: 'relative', height: '200px' }}>
        <ParticleRenderer
          emotionCoords={diary.emotionCoords}
          emotionType={diary.emotionType}
          width={280}
          height={200}
        />
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 12px',
            borderRadius: '12px',
            background: emotionColor,
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {diary.emotionKeyword}
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <p
          style={{
            color: '#333333',
            fontSize: '13px',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {diary.textContent || '暂无文字内容'}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#888888' }}>
            {formatDate(diary.createdAt)}
          </span>
          <span style={{ fontSize: '12px', color: '#888888' }}>
            💬 {diary.commentCount}
          </span>
        </div>
      </div>
    </div>
  );
}
