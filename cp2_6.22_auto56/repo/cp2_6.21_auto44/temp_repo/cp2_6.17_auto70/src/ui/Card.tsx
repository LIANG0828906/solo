import { useState, useEffect, useCallback, useRef } from 'react';
import type { StoryNode } from '../story/types';

interface CardProps {
  node: StoryNode;
  onChoice: (choiceIndex: 0 | 1, choiceText: string) => void;
  onClose: () => void;
  slideDirection: 'left' | 'right' | null;
  isExiting: boolean;
  isTransitioning: boolean;
}

const SLIDE_OUT_DURATION = 500;
const ENTER_DURATION = 600;
const FADE_DURATION = 400;

export default function Card({ node, onChoice, onClose, slideDirection, isExiting, isTransitioning }: CardProps) {
  const [phase, setPhase] = useState<'entering' | 'idle' | 'exiting'>('entering');
  const [contentVisible, setContentVisible] = useState(false);
  const previousNodeId = useRef<string | null>(null);

  useEffect(() => {
    if (node.id !== previousNodeId.current) {
      previousNodeId.current = node.id;
      setPhase('entering');
      setContentVisible(false);

      const fadeTimer = window.setTimeout(() => {
        setContentVisible(true);
      }, 50);

      const enterTimer = window.setTimeout(() => {
        setPhase('idle');
      }, ENTER_DURATION);

      return () => {
        window.clearTimeout(fadeTimer);
        window.clearTimeout(enterTimer);
      };
    }
  }, [node.id]);

  useEffect(() => {
    if (isExiting) {
      setPhase('exiting');
    }
  }, [isExiting]);

  const handleChoice = useCallback((index: 0 | 1) => {
    if (isTransitioning) return;
    onChoice(index, node.choices[index].text);
  }, [isTransitioning, onChoice, node.choices]);

  const getCardStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '600px',
      height: '400px',
      backgroundColor: '#1A1A2E',
      borderRadius: '16px',
      boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3), 0 10px 40px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    };

    if (phase === 'exiting' && slideDirection) {
      const translateX = slideDirection === 'left' ? '-120%' : '120%';
      const rotate = slideDirection === 'left' ? '-5deg' : '5deg';
      return {
        ...baseStyle,
        transform: `translateX(${translateX}) rotate(${rotate})`,
        opacity: 0,
        transition: `transform ${SLIDE_OUT_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${SLIDE_OUT_DURATION}ms ease-in`,
      };
    }

    if (phase === 'entering') {
      return {
        ...baseStyle,
        transform: 'translateY(80px)',
        opacity: 0,
        animation: `cardSlideIn ${ENTER_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
      };
    }

    return baseStyle;
  };

  const getContentStyle = (): React.CSSProperties => {
    return {
      opacity: contentVisible ? 1 : 0,
      transition: `opacity ${FADE_DURATION}ms ease-in-out`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '32px 40px',
    };
  };

  return (
    <>
      <style>{`
        @keyframes cardSlideIn {
          0% {
            transform: translateY(80px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .title-text {
          background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #ffffff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
          position: relative;
        }
        
        .title-text::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          z-index: -1;
          filter: blur(8px);
          opacity: 0.6;
        }
      `}</style>

      <div style={getCardStyle()}>
        <button
          onClick={onClose}
          disabled={isTransitioning}
          aria-label="关闭并重置游戏"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '24px',
            height: '24px',
            background: 'transparent',
            border: 'none',
            color: '#888',
            fontSize: '20px',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'color 0.2s ease',
            padding: 0,
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.color = '#FF4444';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888';
          }}
        >
          ✕
        </button>

        <div style={getContentStyle()}>
          <h2
            data-text={node.title}
            className="title-text"
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: '0 0 20px 0',
              textAlign: 'center',
              letterSpacing: '1px',
            }}
          >
            {node.title}
          </h2>

          <p
            style={{
              fontSize: '16px',
              color: '#ffffff',
              lineHeight: '1.6',
              margin: '0 0 auto 0',
              textShadow: '1px 1px 2px #16213E',
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {node.description}
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={() => handleChoice(0)}
              disabled={isTransitioning}
              style={{
                flex: 1,
                height: '48px',
                backgroundColor: '#E94560',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isTransitioning ? 'not-allowed' : 'pointer',
                transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out, opacity 0.2s ease',
                opacity: isTransitioning ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isTransitioning) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 5px 20px rgba(233, 69, 96, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {node.choices[0].text}
            </button>

            <button
              onClick={() => handleChoice(1)}
              disabled={isTransitioning}
              style={{
                flex: 1,
                height: '48px',
                backgroundColor: '#0F3460',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isTransitioning ? 'not-allowed' : 'pointer',
                transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out, opacity 0.2s ease',
                opacity: isTransitioning ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isTransitioning) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 5px 20px rgba(15, 52, 96, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {node.choices[1].text}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
