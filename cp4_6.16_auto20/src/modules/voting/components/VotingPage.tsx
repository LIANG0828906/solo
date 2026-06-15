import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { useVoteStore } from '../store/voteStore';
import { VoteChart } from './VoteChart';
import { BlendCard } from './BlendCard';
import { NoteModal } from './NoteModal';
import type { FlavorNote } from '@/shared/types';
import './VotingPage.css';

export function VotingPage() {
  const { user } = useAuthStore();
  const {
    blends,
    voteCounts,
    userVotes,
    uniqueVoterCount,
    isLoading,
    loadBlends,
    vote,
    submitNote,
    getNotesForBlend,
  } = useVoteStore();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'submit' | 'view'>('submit');
  const [selectedBlendId, setSelectedBlendId] = useState<string | null>(null);
  const [selectedBlendName, setSelectedBlendName] = useState('');
  const [viewNotes, setViewNotes] = useState<FlavorNote[]>([]);

  useEffect(() => {
    loadBlends(user?.id || null);
  }, [loadBlends, user?.id]);

  const handleVote = useCallback(
    async (blendId: string) => {
      if (!user) {
        navigate('/login', { state: { from: '/' } });
        return;
      }

      const blend = blends.find((b) => b.id === blendId);
      if (!blend) return;

      try {
        const success = await vote(user.id, blendId);
        if (success) {
          setSelectedBlendId(blendId);
          setSelectedBlendName(blend.name);
          setModalMode('submit');
          setModalOpen(true);
        }
      } catch (error) {
        console.error('投票失败', error);
      }
    },
    [user, blends, vote, navigate]
  );

  const handleViewNotes = useCallback(async (blendId: string) => {
    const blend = blends.find((b) => b.id === blendId);
    if (!blend) return;

    try {
      const notes = await getNotesForBlend(blendId);
      setViewNotes(notes);
      setSelectedBlendId(blendId);
      setSelectedBlendName(blend.name);
      setModalMode('view');
      setModalOpen(true);
    } catch (error) {
      console.error('获取笔记失败', error);
    }
  }, [blends, getNotesForBlend]);

  const handleSubmitNote = useCallback(
    async (content: string) => {
      if (!user || !selectedBlendId) return;
      await submitNote(user.id, selectedBlendId, content);
    },
    [user, selectedBlendId, submitNote]
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedBlendId(null);
    setSelectedBlendName('');
    setViewNotes([]);
  }, []);

  const blendsWithVotes = blends.map((blend) => ({
    ...blend,
    voteCount: voteCounts[blend.id] || 0,
    hasVoted: !!userVotes[blend.id],
  }));

  return (
    <div className="voting-page">
      <div className="voting-container">
        <div className="voting-header">
          <div className="voting-title-section">
            <Coffee className="voting-title-icon" size={32} />
            <div>
              <h1 className="voting-title">咖啡拼配共创</h1>
              <p className="voting-subtitle">参与投票，一起打造你最爱的风味</p>
            </div>
          </div>
        </div>

        <div className="voting-content">
          <div className="voting-list-section">
            <div className="section-header">
              <h2 className="section-title">拼配方案</h2>
              <span className="section-count">{blends.length} 款方案</span>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner-large" />
                <p>加载中...</p>
              </div>
            ) : blends.length === 0 ? (
              <div className="empty-state card">
                <Coffee size={48} className="empty-state-icon" />
                <h3>暂无拼配方案</h3>
                <p>店主正在准备中，敬请期待～</p>
              </div>
            ) : (
              <div className="blend-list">
                {blendsWithVotes.map((blend) => (
                  <BlendCard
                    key={blend.id}
                    blend={blend}
                    isLoggedIn={!!user}
                    onVote={handleVote}
                    onViewNotes={handleViewNotes}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="voting-chart-section">
            <VoteChart blends={blendsWithVotes} totalVoters={uniqueVoterCount} />
          </div>
        </div>
      </div>

      <NoteModal
        isOpen={modalOpen}
        blendName={selectedBlendName}
        blendId={selectedBlendId || ''}
        mode={modalMode}
        notes={viewNotes}
        onClose={handleCloseModal}
        onSubmit={handleSubmitNote}
      />
    </div>
  );
}
