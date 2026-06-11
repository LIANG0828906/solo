import { useState, useEffect, useCallback } from 'react';
import { Announcement, Vote } from './types';
import AnnouncementCard from './components/AnnouncementCard';
import VoteModal from './components/VoteModal';

function App() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [showCreateVote, setShowCreateVote] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    author: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/announcements');
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('获取公告失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim() || !newAnnouncement.author.trim()) {
      return;
    }
    if (newAnnouncement.content.length > 500) {
      alert('内容不能超过500字');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAnnouncement)
      });
      const data = await response.json();
      if (data.announcement) {
        setAnnouncements(prev => [data.announcement, ...prev]);
        setNewAnnouncement({ title: '', content: '', author: '' });
      }
    } catch (error) {
      console.error('发布公告失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitiateVote = (announcementId: string) => {
    setSelectedAnnouncementId(announcementId);
    setShowCreateVote(true);
    setShowVoteModal(true);
  };

  const handleViewVote = (announcementId: string) => {
    setSelectedAnnouncementId(announcementId);
    setShowCreateVote(false);
    setShowVoteModal(true);
  };

  const handleVoteCreated = (vote: Vote) => {
    setAnnouncements(prev =>
      prev.map(ann =>
        ann.id === vote.announcementId
          ? { ...ann, votes: [...(ann.votes || []), vote] }
          : ann
      )
    );
    setShowVoteModal(false);
  };

  const handleVoteSubmitted = (updatedVote: Vote) => {
    setAnnouncements(prev =>
      prev.map(ann =>
        ann.id === updatedVote.announcementId
          ? {
              ...ann,
              votes: (ann.votes || []).map(v =>
                v.id === updatedVote.id ? updatedVote : v
              )
            }
          : ann
      )
    );
  };

  const selectedAnnouncement = announcements.find(a => a.id === selectedAnnouncementId);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>团队公告与投票</h1>
        <button className="refresh-btn" onClick={fetchAnnouncements}>
          刷新
        </button>
      </header>

      <form className="create-form" onSubmit={handleSubmitAnnouncement}>
        <h2>发布公告</h2>
        <div className="form-group">
          <label>标题 *</label>
          <input
            type="text"
            value={newAnnouncement.title}
            onChange={e => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
            placeholder="请输入公告标题"
            maxLength={30}
            required
          />
        </div>
        <div className="form-group">
          <label>内容 * (最多500字)</label>
          <textarea
            value={newAnnouncement.content}
            onChange={e => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
            placeholder="请输入公告内容"
            maxLength={500}
            required
          />
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            {newAnnouncement.content.length}/500
          </div>
        </div>
        <div className="form-group">
          <label>作者 *</label>
          <input
            type="text"
            value={newAnnouncement.author}
            onChange={e => setNewAnnouncement(prev => ({ ...prev, author: e.target.value }))}
            placeholder="请输入作者名称"
            required
          />
        </div>
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? '发布中...' : '发布公告'}
        </button>
      </form>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : announcements.length === 0 ? (
        <div className="empty-state">
          <h3>暂无公告</h3>
          <p>发布第一条公告开始吧！</p>
        </div>
      ) : (
        <div className="announcements-list">
          {announcements.map(announcement => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onInitiateVote={handleInitiateVote}
              onViewVote={handleViewVote}
            />
          ))}
        </div>
      )}

      {showVoteModal && selectedAnnouncement && (
        <VoteModal
          announcement={selectedAnnouncement}
          showCreate={showCreateVote}
          onClose={() => setShowVoteModal(false)}
          onVoteCreated={handleVoteCreated}
          onVoteSubmitted={handleVoteSubmitted}
        />
      )}
    </div>
  );
}

export default App;
