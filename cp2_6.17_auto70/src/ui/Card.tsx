import { useState, useEffect, useCallback } from 'react';
import type { StoryNode } from '../story/types';

interface CardProps {
  node: StoryNode;
  onChoice: (choiceIndex: 0 | 1, choiceText: string) => void;
  onClose: () => void;
  slideDirection: 'left' | 'right' | null;
  isTransitioning: boolean;
}

export default function Card({ node, onChoice, onClose, slideDirection, isTransitioning }: CardProps) {
  const [isEntering, setIsEntering] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setIsEntering(true);
    setIsFading(true);
    
    const fadeTimer = setTimeout(() => {
      setIsFading(false);
    }, 400);

    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 600);

    setKey(prev => prev + 1);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(enterTimer);
    };
  }, [node.id]);

  const handleChoice = useCallback((index: 0 | 1) => {
    if (isTransitioning) return;
    onChoice(index, node.choices[index].text);
  }, [isTransitioning, onChoice, node.choices]);

  const getSlideStyle = () => {
    if (slideDirection === 'left') {
      return {
        transform: 'translateX(-120%) rotate(-5deg)',
        opacity: 0,
        transition: 'transform 0.5s ease-in, opacity 0.5s ease-in',
      };
    }
    if (slideDirection === 'right') {
      return {
        transform: 'translateX(120%) rotate(5deg)',
        opacity: 0,
        transition: 'transform 0.5s ease-in, opacity 0.5s ease-in',
      };
    }
    if (isEntering) {
      return {
        transform: 'translateY(80px)',
        opacity: 0,
        animation: 'slideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      };
    }
    return {};
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
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

      <div
        key={key}
        style={{
          width: '600px',
          height: '400px',
          backgroundColor: '#1A1A2E',
          borderRadius: '16px',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3), 0 10px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          ...getSlideStyle(),
        }}
      >
        <button
          onClick={onClose}
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
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'color 0.2s ease',
            padding: 0,
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888';
          }}
        >
          ✕
        </button>

        <div
          style={{
            opacity: isFading ? 0 : 1,
            transition: 'opacity 0.4s ease',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '32px 40px',
          }}
        >
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
                transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
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
                transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
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
