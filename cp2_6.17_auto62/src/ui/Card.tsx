import { useState, useEffect, useRef } from 'react';
import { StoryNode, ChoiceDirection } from '../story/types';

interface CardProps {
  node: StoryNode | null;
  onChoice: (direction: ChoiceDirection) => void;
  onExit: () => void;
  isLoading: boolean;
}

type ExitDirection = ChoiceDirection | null;

export function Card({ node, onChoice, onExit, isLoading }: CardProps) {
  const [show, setShow] = useState(false);
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null);
  const [contentKey, setContentKey] = useState(0);
  const prevNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (node && node.id !== prevNodeIdRef.current) {
      setExitDirection(null);
      setShow(false);
      const timer = requestAnimationFrame(() => {
        setShow(true);
        setContentKey((k) => k + 1);
      });
      prevNodeIdRef.current = node.id;
      return () => cancelAnimationFrame(timer);
    }
  }, [node]);

  const handleChoice = (direction: ChoiceDirection) => {
    setExitDirection(direction);
    setTimeout(() => {
      onChoice(direction);
    }, 500);
  };

  const cardStyle: React.CSSProperties = {
    width: '600px',
    height: '400px',
    backgroundColor: '#1A1A2E',
    borderRadius: '16px',
    boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    transform: show
      ? exitDirection === 'left'
        ? 'translateX(-120%)'
        : exitDirection === 'right'
        ? 'translateX(120%)'
        : 'translateY(0)'
      : 'translateY(40px)',
    opacity: show && !exitDirection ? 1 : exitDirection ? 0 : 0,
    transition: exitDirection
      ? 'transform 0.5s ease-in, opacity 0.5s ease-in'
      : 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 40px 24px',
    animation: `fadeIn 0.4s ease-out`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: '20px',
    letterSpacing: '1px',
    textShadow: '0 0 2px #16213E, 0 0 4px #16213E, 0 0 8px rgba(233, 69, 96, 0.5)',
    position: 'relative',
  };

  const descStyle: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: 1.6,
    color: 'white',
    flex: 1,
    textShadow: '1px 1px 2px #16213E',
    overflowY: 'auto',
  };

  const choicesContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1px',
    height: '48px',
  };

  const choiceButtonStyle = (bgColor: string): React.CSSProperties => ({
    flex: 1,
    height: '48px',
    backgroundColor: bgColor,
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    transition: 'transform 0.3s ease-out, filter 0.3s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
  });

  const leftButtonStyle: React.CSSProperties = {
    ...choiceButtonStyle('#E94560'),
    borderBottomLeftRadius: '16px',
  };

  const rightButtonStyle: React.CSSProperties = {
    ...choiceButtonStyle('#0F3460'),
    borderBottomRightRadius: '16px',
  };

  const exitButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '16px',
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
    transition: 'color 0.2s ease',
    zIndex: 10,
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '16px',
  };

  return (
    <div style={cardStyle}>
      <button
        style={exitButtonStyle}
        onClick={onExit}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#FF4757';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
        }}
        aria-label="退出"
      >
        ×
      </button>

      {isLoading || !node ? (
        <div style={loadingStyle}>加载中...</div>
      ) : (
        <div key={contentKey} style={contentStyle}>
          <h2 style={titleStyle}>{node.title}</h2>
          <p style={descStyle}>{node.description}</p>
        </div>
      )}

      <div style={choicesContainerStyle}>
        <button
          style={leftButtonStyle}
          onClick={() => handleChoice('left')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
          disabled={isLoading || !node}
        >
          {node ? node.choices[0].text : '...'}
        </button>
        <button
          style={rightButtonStyle}
          onClick={() => handleChoice('right')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.filter = 'brightness(1.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
          disabled={isLoading || !node}
        >
          {node ? node.choices[1].text : '...'}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
