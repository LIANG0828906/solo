import React, { useState, useEffect, useCallback } from 'react';
import EmotionRecorder from '../components/EmotionRecorder';
import { emotionAPI, EmotionRecord } from '../api/emotionAPI';

const CATEGORY_ICONS: Record<string, string> = {
  '快乐': 'far fa-smile',
  '平静': 'far fa-meh',
  '悲伤': 'far fa-sad-tear',
  '愤怒': 'far fa-angry',
  '焦虑': 'far fa-frown-open',
  '疲惫': 'far fa-tired',
};

const CATEGORY_COLORS: Record<string, string> = {
  '快乐': '#6bcf7f',
  '平静': '#4fc3f7',
  '悲伤': '#7986cb',
  '愤怒': '#ff6b6b',
  '焦虑': '#ffb74d',
  '疲惫': '#b0bec5',
};

const RecordPage: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [records, setRecords] = useState<EmotionRecord[]>([]);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await emotionAPI.getRecords(today);
      setRecords(res.data);
    } catch {
      setRecords([]);
    }
  }, [today]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const todayDate = new Date();
  const dateDisplay = `${todayDate.getFullYear()}年${todayDate.getMonth() + 1}月${todayDate.getDate()}日`;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <i className="far fa-edit" />
          情绪记录
        </div>
        <div style={{ fontSize: 13, color: '#9e8fb5', marginTop: 4 }}>
          {dateDisplay}
        </div>
      </div>

      <EmotionRecorder onSubmitted={fetchRecords} />

      <div className="card">
        <div className="card-title">
          <i className="far fa-clock" />
          今日记录
          {records.length > 0 && (
            <span style={{ fontSize: 12, color: '#9e8fb5', fontWeight: 400 }}>
              （{records.length}条）
            </span>
          )}
        </div>

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '24px 0' }}>
            <i className="far fa-meh" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
            今天还没有记录，快来添加吧
          </div>
        ) : (
          <ul className="record-list">
            {records.map(r => (
              <li key={r.id} className="record-item">
                <div className="record-emoji">
                  <i
                    className={CATEGORY_ICONS[r.category] || 'far fa-question-circle'}
                    style={{ color: CATEGORY_COLORS[r.category] || '#999' }}
                  />
                </div>
                <div className="record-info">
                  <div className="record-detail">
                    {r.category} · 强度 {r.intensity} · 精力 {r.energy}
                  </div>
                  <div className="record-time">
                    <i className="far fa-clock" style={{ marginRight: 4 }} />
                    {formatTime(r.timestamp)}
                  </div>
                  {r.tags && r.tags.trim() && (
                    <div className="record-tags">
                      {r.tags.split(',').map((tag, i) => (
                        <span key={i} className="record-tag-badge">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                  {r.note && <div className="record-note">{r.note}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecordPage;
