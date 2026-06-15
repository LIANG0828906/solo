import { useState } from 'react';
import { ThumbsUp, Volume2, VolumeX, Sparkles } from 'lucide-react';
import type { BlendWithVotes } from '@/shared/types';
import './BlendCard.css';

interface BlendCardProps {
  blend: BlendWithVotes;
  isLoggedIn: boolean;
  onVote: (blendId: string) => void;
  onViewNotes?: (blendId: string) => void;
}

export function BlendCard({ blend, isLoggedIn, onVote, onViewNotes }: BlendCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => blend.audioBase64 ? new Audio(blend.audioBase64) : null);

  const handleVoteClick = () => {
    if (!isLoggedIn || blend.hasVoted) return;
    onVote(blend.id);
  };

  const toggleAudio = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  return (
    <div className={`blend-card card ${blend.hasVoted ? 'blend-card-voted' : ''}`}>
      <div className="blend-card-header">
        <div className="blend-card-title-row">
          <h3 className="blend-card-title">{blend.name}</h3>
          {blend.audioBase64 && (
            <button
              className={`audio-btn ${isPlaying ? 'audio-btn-playing' : ''}`}
              onClick={toggleAudio}
              title={isPlaying ? '暂停' : '播放介绍'}
            >
              {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          )}
        </div>

        <div className="blend-card-tags">
          {blend.flavorTags.map((tag, index) => (
            <span key={index} className="tag">
              <Sparkles size={12} className="tag-icon" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="blend-card-body">
        <p className="blend-card-description">{blend.flavorDescription}</p>

        <div className="blend-card-ratio">
          <span className="ratio-label">拼配比例</span>
          <span className="ratio-value">{blend.beanRatio}</span>
        </div>
      </div>

      <div className="blend-card-footer">
        <div className="vote-count">
          <ThumbsUp size={18} className="vote-count-icon" />
          <span className="vote-count-number">{blend.voteCount}</span>
          <span className="vote-count-label">票</span>
        </div>

        <div className="blend-card-actions">
          {onViewNotes && (
            <button
              className="btn btn-secondary notes-btn"
              onClick={() => onViewNotes(blend.id)}
            >
              查看笔记
            </button>
          )}
          <button
            className={`btn vote-btn ${blend.hasVoted ? 'vote-btn-voted' : 'btn-primary'}`}
            onClick={handleVoteClick}
            disabled={!isLoggedIn || blend.hasVoted}
          >
            {!isLoggedIn ? '登录投票' : blend.hasVoted ? '已投票' : '投票'}
          </button>
        </div>
      </div>
    </div>
  );
}
