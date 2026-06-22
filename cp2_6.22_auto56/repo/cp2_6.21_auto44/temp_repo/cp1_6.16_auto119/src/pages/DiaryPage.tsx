import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useDiaryStore } from '../store';
import { getEmotionColor } from '../utils/emotionAnalyzer';

export default function DiaryPage() {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [showRing, setShowRing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addEntry, currentEmotion, updateEmotion, isAnalyzing, entries } = useDiaryStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      updateEmotion(text);
    }, 300);
    return () => clearTimeout(timer);
  }, [text, updateEmotion]);

  const today = new Date();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 ${weekdays[today.getDay()]}`;

  const getPageClass = () => {
    if (!currentEmotion) return '';
    if (currentEmotion.sentiment === 'positive') return 'positive';
    if (currentEmotion.sentiment === 'negative') return 'negative';
    return '';
  };

  const handleRecord = useCallback(() => {
    if (!text.trim()) return;

    addEntry(text, location);
    setShowRing(true);

    if (currentEmotion && currentEmotion.sentiment === 'positive') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF8A65', '#FFE0B2', '#FFF9C4', '#4CAF50'],
      });
    }

    setTimeout(() => {
      setText('');
      setLocation('');
      setShowRing(false);
    }, 2500);
  }, [text, location, addEntry, currentEmotion]);

  const circumference = 2 * Math.PI * 34;
  const score = currentEmotion?.score ?? 0.5;
  const offset = circumference * (1 - score);
  const ringColor = getEmotionColor(score);

  return (
    <div className={`diary-page ${getPageClass()}`}>
      <div className="diary-date">{dateStr}</div>
      <div className="diary-divider" />

      <div className="diary-content">
        <textarea
          ref={textareaRef}
          className="diary-textarea"
          placeholder="今天发生了什么？记录下你的心情吧... ✨"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="diary-location">
          <label>📍 今日位置：</label>
          <input
            type="text"
            placeholder="例如：北京、上海、东京..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="diary-actions">
          <button
            className="record-btn"
            onClick={handleRecord}
            disabled={!text.trim() || isAnalyzing}
          >
            {isAnalyzing ? '分析中...' : '📝 记录心情'}
          </button>
        </div>

        {entries.length > 0 && (
          <div className="entries-list">
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className={`entry-card ${entry.emotion.sentiment}`}
              >
                <div className="entry-date">
                  {entry.date} · 📍 {entry.location}
                </div>
                <div className="entry-text">{entry.text}</div>
                <div className="entry-meta">
                  <span>情绪: {entry.emotion.dominantWord}</span>
                  <span>指数: {Math.round(entry.emotion.score * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showRing || currentEmotion) && (
        <>
          <div className="emotion-ring">
            <svg viewBox="0 0 80 80">
              <circle className="emotion-ring-bg" cx="40" cy="40" r="34" />
              <circle
                className="emotion-ring-fill"
                cx="40"
                cy="40"
                r="34"
                stroke={ringColor}
                strokeDasharray={circumference}
                strokeDashoffset={showRing ? offset : circumference}
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <div className="emotion-ring-label">
              {Math.round(score * 100)}
            </div>
          </div>

          {currentEmotion && (
            <div className="emotion-dominant">
              <span>当前情绪</span>
              <span className="word">{currentEmotion.dominantWord}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
