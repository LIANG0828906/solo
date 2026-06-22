import { useState, useEffect } from 'react';

interface VoteButtonProps {
  voted: boolean;
  voteCount: number;
  onVote: () => void;
}

const VoteButton = ({ voted, voteCount, onVote }: VoteButtonProps) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (voted) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [voted]);

  const handleClick = () => {
    if (!voted) {
      onVote();
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        border: 'none',
        background: 'transparent',
        cursor: voted ? 'default' : 'pointer',
        padding: '4px 8px',
        borderRadius: '6px',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!voted) {
          e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={voted ? '#e91e63' : 'none'}
        stroke={voted ? '#e91e63' : '#9e9e9e'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          color: voted ? '#e91e63' : '#9e9e9e',
          animation: animating ? 'heartbeat 0.2s ease-in-out' : 'none',
          transformOrigin: 'center',
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: voted ? '#e91e63' : '#666',
        }}
      >
        {voteCount}
      </span>
      <style>{`
        @keyframes heartbeat {
          0% {
            transform: scale(1);
          }
          25% {
            transform: scale(0.9);
          }
          50% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </button>
  );
};

export default VoteButton;
