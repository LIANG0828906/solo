import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DiaryPage from './diary/DiaryPage';
import StatsPage from './stats/StatsPage';
import { Diary, MOOD_CONFIG } from './types';

function App() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiaries = useCallback(async () => {
    try {
      const response = await axios.get('/api/diaries');
      if (response.data && response.data.data) {
        setDiaries(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch diaries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiaries();
  }, [fetchDiaries]);

  const handleDiaryCreated = () => {
    fetchDiaries();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const truncateContent = (content: string, maxLength: number = 40) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2 className="section-title">✨ 灵感星图</h2>
        {loading ? (
          <div className="empty-state-sidebar">加载中...</div>
        ) : diaries.length === 0 ? (
          <div className="empty-state-sidebar">还没有日记记录</div>
        ) : (
          diaries.slice(0, 100).map((diary) => (
            <div key={diary.id} className="card diary-card">
              <div className="diary-card-header">
                <span className="diary-date">{formatDate(diary.date)}</span>
                <span className="diary-mood">{MOOD_CONFIG[diary.mood]?.emoji}</span>
              </div>
              <p className="diary-preview">{truncateContent(diary.content)}</p>
            </div>
          ))
        )}
      </aside>

      <main className="main-content">
        <DiaryPage onDiaryCreated={handleDiaryCreated} />
        <StatsPage diaries={diaries} />
      </main>
    </div>
  );
}

export default App;
