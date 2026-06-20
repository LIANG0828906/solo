import { useState, useCallback, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { relativeTime } from '@/utils/format';
import type { Announcement } from '@/types';

export default function Board() {
  const announcements = useStore(s => s.announcements);
  const addAnnouncement = useStore(s => s.addAnnouncement);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const canPublish = title.trim().length > 0 && content.trim().length > 0;

  const sorted = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return [...announcements].sort((a, b) => {
      const aRecent = (now - a.createdAt) < sevenDays;
      const bRecent = (now - b.createdAt) < sevenDays;
      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [announcements]);

  const handlePublish = useCallback(() => {
    if (!canPublish) return;
    addAnnouncement({ title: title.trim(), content: content.trim(), isUrgent });
    setTitle('');
    setContent('');
    setIsUrgent(false);
  }, [canPublish, title, content, isUrgent, addAnnouncement]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">公告板</h1>
      </div>

      <div className="board-form">
        <div className="board-form-title">发布公告</div>
        <div className="form-group">
          <label className="form-label">公告标题 <span className="required">*</span></label>
          <input
            type="text"
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="请输入公告标题"
          />
        </div>
        <div className="form-group">
          <label className="form-label">公告正文 <span className="required">*</span></label>
          <textarea
            className="form-input"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            placeholder="请输入公告内容"
          />
        </div>
        <div className="board-form-row">
          <label className="board-urgent-check">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={e => setIsUrgent(e.target.checked)}
            />
            标记为紧急公告
          </label>
          <button
            className="btn-publish"
            onClick={handlePublish}
            disabled={!canPublish}
          >
            发布
          </button>
        </div>
      </div>

      <div className="announcement-list">
        {sorted.map(a => (
          <div key={a.id} className="announcement-card">
            <div className="announcement-card-body">
              <div className="announcement-title">{a.title}</div>
              <div className="announcement-content">{a.content}</div>
              <div className="announcement-time">{relativeTime(a.createdAt)}</div>
            </div>
            {a.isUrgent && (
              <div className="announcement-urgent-icon">
                <AlertTriangle size={22} color="#f97316" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
