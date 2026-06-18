import { useMemo } from 'react';
import type { RoomState, SongOption } from '../types';
import { getSocket } from '../socket';
import { useVoteStore, selectUserVotedSongId } from '../store/useVoteStore';

interface Props {
  song: SongOption;
  room: RoomState;
  index: number;
}

export default function VoteCard({ song, room, index }: Props) {
  const votedSongId = useVoteStore(selectUserVotedSongId);
  const currentUserId = useVoteStore((s) => s.currentUserId);
  const maxVotes = useMemo(() => {
    return Math.max(1, ...room.songs.map((s) => s.voteCount));
  }, [room.songs]);

  const isVoted = votedSongId === song.id;
  const isWinner = room.votingLocked && room.winnerSongId === song.id;
  const isLoser = room.votingLocked && !isWinner;
  const isDisabled = room.votingLocked;

  const barPercent = (song.voteCount / maxVotes) * 100;

  const handleVote = () => {
    if (isDisabled) return;
    const socket = getSocket();
    socket.emit('vote', {
      roomId: room.id,
      songId: song.id,
      userId: currentUserId,
    });
  };

  const cardClass = [
    'vote-card',
    isWinner ? 'card-winner' : '',
    isLoser ? 'card-loser' : '',
    isVoted && !room.votingLocked ? 'card-voted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClass}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="song-header">
        <div
          className="song-color-dot"
          style={{ background: song.color }}
        />
        <h3 className="song-title">{song.title}</h3>
      </div>

      <div className="vote-metric">
        <span className="vote-count">{song.voteCount}</span>
        <span className="vote-label">票</span>
      </div>

      <div className="bar-wrapper">
        <div className="bar-bg">
          <div
            className="bar-fill"
            style={{
              width: `${barPercent}%`,
              background: `linear-gradient(90deg, ${song.color}, ${song.color}dd)`,
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </div>

      <button
        className={`vote-btn ${isVoted ? 'is-voted' : ''}`}
        onClick={handleVote}
        disabled={isDisabled}
      >
        {isWinner
          ? '🏆 解锁成功'
          : isLoser
            ? '已落败'
            : isVoted
              ? '已投票（可改投）'
              : '为TA投票'}
      </button>

      {isWinner && (
        <div className="winner-shine" aria-hidden />
      )}

      <style>{`
        .vote-card {
          position: relative;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
          animation: fade-in-up 0.5s ease-out both;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
            background 0.5s ease,
            opacity 0.5s ease,
            box-shadow 0.5s ease,
            filter 0.5s ease;
        }
        .vote-card:hover:not(.card-winner):not(.card-loser) {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35),
            0 0 32px rgba(108, 99, 255, 0.18);
        }
        .card-voted {
          border-color: rgba(108, 99, 255, 0.45);
          box-shadow: 0 8px 32px rgba(108, 99, 255, 0.2);
        }
        .card-winner {
          transform: scale(1.2);
          z-index: 10;
          background: linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.25) 0%,
            rgba(255, 193, 7, 0.2) 100%
          );
          border-color: rgba(255, 215, 0, 0.6);
          box-shadow: 0 12px 48px rgba(255, 193, 7, 0.35),
            0 0 64px rgba(255, 215, 0, 0.25);
        }
        .card-loser {
          transform: scale(0.8);
          opacity: 0.55;
          filter: grayscale(100%);
        }
        .song-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .song-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 10px currentColor;
        }
        .song-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
          word-break: break-all;
        }
        .vote-metric {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .vote-count {
          font-family: 'Courier New', monospace;
          font-size: 2.4rem;
          font-weight: 900;
          color: var(--text-primary);
          line-height: 1;
        }
        .vote-label {
          font-size: 0.85rem;
          color: var(--text-tertiary);
        }
        .bar-wrapper {
          width: 100%;
        }
        .bar-bg {
          width: 100%;
          height: 14px;
          border-radius: 999px;
          background: var(--bar-bg);
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 999px;
        }
        .vote-btn {
          width: 100%;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          color: #fff;
          background: linear-gradient(
            135deg,
            var(--btn-gradient-start) 0%,
            var(--btn-gradient-end) 100%
          );
          box-shadow: 0 4px 14px rgba(108, 99, 255, 0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            filter 0.2s ease, opacity 0.2s ease;
          min-height: 44px;
        }
        .vote-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(108, 99, 255, 0.5);
        }
        .vote-btn:active:not(:disabled) {
          transform: translateY(-1px) scale(0.97);
        }
        .vote-btn.is-voted {
          background: linear-gradient(
            135deg,
            rgba(108, 99, 255, 0.2) 0%,
            rgba(72, 52, 212, 0.25) 100%
          );
          border: 1px solid rgba(108, 99, 255, 0.5);
          box-shadow: inset 0 0 0 1px rgba(108, 99, 255, 0.3);
        }
        .vote-btn:disabled {
          cursor: not-allowed;
          filter: brightness(0.7);
        }
        .card-winner .vote-btn {
          background: linear-gradient(
            135deg,
            #ffb700 0%,
            #ff8c00 100%
          );
          box-shadow: 0 6px 20px rgba(255, 179, 0, 0.5);
        }
        .winner-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 30%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: gold-shine 2.5s ease-in-out infinite;
          pointer-events: none;
          mix-blend-mode: overlay;
        }
        @media (max-width: 767px) {
          .vote-card {
            padding: 18px;
            gap: 12px;
          }
          .card-winner {
            transform: scale(1.05);
          }
          .card-loser {
            transform: scale(0.95);
          }
          .vote-count {
            font-size: 2rem;
          }
          .song-title {
            font-size: 1.05rem;
          }
        }
      `}</style>
    </div>
  );
}
