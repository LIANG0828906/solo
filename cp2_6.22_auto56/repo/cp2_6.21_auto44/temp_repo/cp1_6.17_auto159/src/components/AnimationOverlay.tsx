import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLetterStore } from '../store/letterStore';
import { LetterPaperEngine } from '../engine/LetterPaperEngine';
import { EnvelopeAnimator, type HandwritingFrame } from '../engine/EnvelopeAnimator';
import { EnvelopePreview } from './EnvelopePreview';

export const AnimationOverlay: React.FC = () => {
  const {
    isAnimating,
    stopAnimation,
    getCurrentAnimationLetter,
    hasNextLetter,
    hasPrevLetter,
    goToNextLetter,
    goToPrevLetter,
    currentAnimationLetterId,
  } = useLetterStore();

  const letter = getCurrentAnimationLetter();
  
  const [envelopeProgress, setEnvelopeProgress] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'envelope' | 'writing' | 'complete'>('envelope');
  
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const framesRef = useRef<HandwritingFrame[]>([]);

  const handwritingFrames = useMemo(() => {
    if (!letter) return [];
    return EnvelopeAnimator.generateHandwritingFrames(letter.content);
  }, [letter?.id, letter?.content]);

  const totalWritingDuration = useMemo(() => {
    return EnvelopeAnimator.getTotalAnimationDuration(handwritingFrames);
  }, [handwritingFrames]);

  useEffect(() => {
    if (!isAnimating || !letter) return;

    setEnvelopeProgress(0);
    setVisibleChars(0);
    setAnimationPhase('envelope');
    framesRef.current = handwritingFrames;

    const envelopeDuration = 1200;
    const writingDuration = totalWritingDuration;

    const totalDuration = envelopeDuration + writingDuration + 500;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;

      if (elapsed < envelopeDuration) {
        const progress = elapsed / envelopeDuration;
        const easedProgress = EnvelopeAnimator.easeOutCubic(progress);
        setEnvelopeProgress(easedProgress);
        setAnimationPhase('envelope');
      } else if (elapsed < envelopeDuration + writingDuration) {
        const writingElapsed = elapsed - envelopeDuration;
        setAnimationPhase('writing');
        
        let visibleCount = 0;
        for (const frame of framesRef.current) {
          if (writingElapsed >= frame.delay) {
            visibleCount++;
          } else {
            break;
          }
        }
        setVisibleChars(visibleCount);
      } else {
        setVisibleChars(letter.content.length);
        setAnimationPhase('complete');
      }

      if (elapsed < totalDuration) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = 0;
    };
  }, [isAnimating, currentAnimationLetterId, handwritingFrames, totalWritingDuration, letter]);

  const handleNext = () => {
    if (hasNextLetter()) {
      goToNextLetter();
    }
  };

  const handlePrev = () => {
    if (hasPrevLetter()) {
      goToPrevLetter();
    }
  };

  if (!isAnimating || !letter) return null;

  const envelopeTransform = EnvelopeAnimator.getEnvelopeTransform(envelopeProgress);
  const paperStyle = LetterPaperEngine.getPaperStyle(letter.paperTexture);
  const textStyle = LetterPaperEngine.getTextStyle(letter.textColor, letter.fontFamily);

  const displayText = letter.content.substring(0, visibleChars);

  return (
    <div className="animation-overlay" onClick={stopAnimation}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        <div className="envelope-container">
          <div
            className="animated-envelope"
            style={{
              transform: `
                perspective(1000px) 
                rotateY(${envelopeTransform.rotateY}deg) 
                rotateX(${envelopeTransform.rotateX}deg) 
                scale(${envelopeTransform.scale})
                translateZ(${envelopeTransform.translateZ}px)
              `,
              opacity: envelopeTransform.opacity,
            }}
          >
            <EnvelopePreview style={letter.envelopeStyle} size="medium" />
          </div>
        </div>

        <div
          className="letter-paper-animation"
          style={{
            ...paperStyle,
            backgroundSize: letter.paperTexture === 'grid' ? 'auto, 20px 20px, 20px 20px' : 'auto',
            opacity: animationPhase === 'envelope' ? 0.3 : 1,
          }}
        >
          <div
            className="letter-content"
            style={{
              ...textStyle,
              whiteSpace: 'pre-wrap',
            }}
          >
            {displayText}
            {animationPhase === 'writing' && (
              <span className="cursor">|</span>
            )}
          </div>
        </div>

        <div className={`controls ${animationPhase === 'complete' ? 'visible' : ''}`}>
          <button className="control-btn back-btn" onClick={stopAnimation}>
            返回
          </button>
          <div className="nav-buttons">
            <button
              className="control-btn prev-btn"
              onClick={handlePrev}
              disabled={!hasPrevLetter()}
            >
              上一封
            </button>
            <button
              className="control-btn next-btn"
              onClick={handleNext}
              disabled={!hasNextLetter()}
            >
              下一封
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .animation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #0D1117 0%, #1A1A2E 100%);
          opacity: 0.95;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.95; }
        }

        .overlay-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .envelope-container {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .animated-envelope {
          transform-style: preserve-3d;
          transition: opacity 0.1s;
        }

        .letter-paper-animation {
          width: 500px;
          min-height: 650px;
          padding: 60px 50px;
          box-sizing: border-box;
          border-radius: 2px;
          transition: opacity 0.5s ease;
        }

        .letter-content {
          width: 100%;
          min-height: 100%;
        }

        .cursor {
          display: inline-block;
          animation: blink 0.7s infinite;
          margin-left: 2px;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .controls {
          display: flex;
          gap: 16px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease;
          pointer-events: none;
          margin-top: 8px;
        }

        .controls.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .control-btn {
          padding: 12px 28px;
          border: none;
          border-radius: 30px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }

        .back-btn {
          background: transparent;
          color: #FFF;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .nav-buttons {
          display: flex;
          gap: 12px;
        }

        .prev-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #FFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .prev-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .prev-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .next-btn {
          background: #3498DB;
          color: white;
        }

        .next-btn:hover:not(:disabled) {
          background: #2980B9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
        }

        .next-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .letter-paper-animation {
            width: 90vw;
            max-width: 500px;
            min-height: 60vh;
            padding: 40px 30px;
          }

          .controls {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
          }

          .nav-buttons {
            width: 100%;
          }

          .nav-buttons button {
            flex: 1;
          }

          .back-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
