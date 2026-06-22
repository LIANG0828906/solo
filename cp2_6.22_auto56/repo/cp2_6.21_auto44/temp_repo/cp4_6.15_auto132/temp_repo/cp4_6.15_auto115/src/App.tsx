import React, { useState, useEffect } from 'react';
import { MoodRecord, MOOD_META } from './types';
import { getMoods, getCommunity } from './api';
import MoodInput from './components/MoodInput';
import EmotionCard from './components/EmotionCard';
import HistoryPage from './pages/HistoryPage';
import CommunityPage from './pages/CommunityPage';

type Page = 'home' | 'history' | 'community';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [todayMood, setTodayMood] = useState<MoodRecord | null>(null);
  const [allMoods, setAllMoods] = useState<MoodRecord[]>([]);

  useEffect(() => {
    getMoods('user1').then((data) => {
      setAllMoods(data);
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = data.find((m) => m.date === today);
      if (todayRecord) setTodayMood(todayRecord);
    });
  }, []);

  const handleMoodSubmit = (record: MoodRecord) => {
    setTodayMood(record);
    setAllMoods((prev) => [...prev, record]);
  };

  return (
    <div className="app-container">
      <nav className="app-nav">
        <button
          className={`nav-btn ${page === 'home' ? 'active' : ''}`}
          onClick={() => setPage('home')}
        >
          🌤️ 首页
        </button>
        <button
          className={`nav-btn ${page === 'history' ? 'active' : ''}`}
          onClick={() => setPage('history')}
        >
          📊 历史
        </button>
        <button
          className={`nav-btn ${page === 'community' ? 'active' : ''}`}
          onClick={() => setPage('community')}
        >
          🌸 社区
        </button>
      </nav>

      <main className="app-main">
        {page === 'home' && (
          <div className="home-page">
            <h1 className="app-title">情绪气象站</h1>
            {!todayMood ? (
              <MoodInput onSubmit={handleMoodSubmit} />
            ) : (
              <div className="today-card-wrapper">
                <EmotionCard record={todayMood} />
                <button
                  className="re-record-btn"
                  onClick={() => setTodayMood(null)}
                >
                  重新记录
                </button>
              </div>
            )}
          </div>
        )}
        {page === 'history' && <HistoryPage moods={allMoods} />}
        {page === 'community' && <CommunityPage />}
      </main>
    </div>
  );
}
