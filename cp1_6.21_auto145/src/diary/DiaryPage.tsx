import { useState } from 'react';
import axios from 'axios';
import { MOOD_CONFIG } from '../types';

interface DiaryPageProps {
  onDiaryCreated: () => void;
}

function DiaryPage({ onDiaryCreated }: DiaryPageProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = () => {
    const today = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 ${weekDays[today.getDay()]}`;
  };

  const handleSubmit = async () => {
    if (!selectedMood || !content.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/diaries', {
        date: getTodayDate(),
        mood: selectedMood,
        content: content.trim(),
      });

      setSelectedMood(null);
      setContent('');
      onDiaryCreated();
    } catch (error) {
      console.error('Failed to save diary:', error);
      alert('保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const moodOptions = Object.values(MOOD_CONFIG);

  return (
    <section className="editor-section">
      <h2 className="section-title">📝 今日心情 · {formatDateDisplay()}</h2>
      
      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '12px' }}>
            选择今天的心情：
          </div>
          <div className="mood-selector">
            {moodOptions.map((mood) => (
              <button
                key={mood.type}
                type="button"
                className={`mood-btn ${selectedMood === mood.type ? 'selected' : ''}`}
                onClick={() => setSelectedMood(mood.type)}
                style={{
                  borderColor: selectedMood === mood.type ? mood.color : undefined,
                }}
              >
                <span className="mood-emoji">{mood.emoji}</span>
                <span className="mood-label" style={{ color: selectedMood === mood.type ? mood.color : undefined }}>
                  {mood.label}
                </span>
              </button>
              ))}
          </div>
        </div>

        <textarea
          className="diary-input"
          placeholder="今天发生了什么？记录下你的心情和想法吧..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting}
        />

        <button
          type="button"
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!selectedMood || !content.trim() || submitting}
        >
          {submitting ? '保存中...' : '💾 保存日记'}
        </button>

        {!selectedMood && (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            今天还没有记录，点击上方的表情开始吧
          </div>
        )}
      </div>
    </section>
  );
}

export default DiaryPage;
