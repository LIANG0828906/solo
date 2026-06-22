import { useDiaryStore } from '../store/diaryStore';
import DiaryCard from '../components/DiaryCard';
import type { EmotionType } from '../types';

const emotionFilters: { key: EmotionType | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '全部', color: '#00E5FF' },
  { key: 'happy', label: '开心', color: '#FFD54F' },
  { key: 'calm', label: '平静', color: '#81C784' },
  { key: 'sad', label: '忧伤', color: '#64B5F6' },
  { key: 'anxious', label: '焦虑', color: '#FF8A65' },
  { key: 'angry', label: '愤怒', color: '#E57373' },
];

export default function BrowsePage() {
  const emotionFilter = useDiaryStore((s) => s.emotionFilter);
  const setEmotionFilter = useDiaryStore((s) => s.setEmotionFilter);
  const getFilteredDiaries = useDiaryStore((s) => s.getFilteredDiaries);

  const diaries = getFilteredDiaries();

  return (
    <div className="page-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px' }}>心情广场</h2>
          <span style={{ fontSize: '13px', color: '#888' }}>
            共 {diaries.length} 条公开日记
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {emotionFilters.map((filter) => {
            const isActive =
              filter.key === 'all' ? emotionFilter === null : emotionFilter === filter.key;

            return (
              <button
                key={filter.key}
                onClick={() => setEmotionFilter(filter.key === 'all' ? null : filter.key as EmotionType)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  backgroundColor: isActive ? filter.color : 'transparent',
                  color: isActive ? '#ffffff' : '#888888',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s',
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {diaries.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#666',
            }}
          >
            <p>暂无符合条件的日记</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 280px)',
              gap: '24px',
              justifyContent: 'center',
            }}
          >
            {diaries.map((diary) => (
              <DiaryCard key={diary.id} diary={diary} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: repeat(2, 280px) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
            justify-items: center;
          }
        }
      `}</style>
    </div>
  );
}
