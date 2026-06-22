import { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import { getVowelColor, formatDuration } from '../utils/helpers';

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  index: number;
  onSelect: (id: number) => void;
  onPlay: (id: number) => void;
}

export default function NoteCard({ note, isSelected, index, onSelect, onPlay }: NoteCardProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardColor = getVowelColor(note.ipa);

  const handleClick = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples((prev) => [...prev, { x, y, id }]);
      
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }
    
    onSelect(note.id);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(note.id);
  };

  const waveformDisplay = note.waveformData?.slice(0, 100) || [];
  const maxAmp = Math.max(...waveformDisplay, 0.001);

  return (
    <div
      ref={cardRef}
      className={`note-card ${isSelected ? 'selected' : ''}`}
      style={{
        animationDelay: `${index * 0.05}s`,
        '--card-color': cardColor,
      } as React.CSSProperties}
      onClick={handleClick}
    >
      <div
        className="card-header"
        style={{
          background: `linear-gradient(135deg, ${cardColor}20 0%, transparent 70%)`,
        }}
      >
        <div className="card-word">{note.word}</div>
        <div className="card-ipa">{note.ipa}</div>
      </div>

      <div className="card-waveform">
        {waveformDisplay.map((amp, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{
              height: `${(amp / maxAmp) * 100}%`,
              background: cardColor,
            }}
          />
        ))}
      </div>

      <div className="card-footer">
        <div className="duration-badge">
          <span className="duration-icon">◉</span>
          {formatDuration(note.audioDuration)}
        </div>
        <div className="family-tag">{note.languageFamily}</div>
      </div>

      {note.description && (
        <div className="card-description">{note.description}</div>
      )}

      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}

      <button
        className="play-button"
        onClick={handlePlayClick}
        style={{ background: cardColor }}
      >
        ▶
      </button>

      <style>{`
        .note-card {
          position: relative;
          background: #1E1E2E;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.3s ease forwards;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .note-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .note-card.selected {
          border-color: var(--card-color);
          box-shadow: 0 0 20px rgba(124, 77, 255, 0.3);
        }

        .card-header {
          margin-bottom: 12px;
          padding: 8px 12px;
          border-radius: 10px;
          margin: -8px -8px 12px -8px;
        }

        .card-word {
          font-size: 18px;
          font-weight: 600;
          color: #E0E0E0;
          margin-bottom: 4px;
        }

        .card-ipa {
          font-size: 13px;
          color: #B0B0B0;
          font-family: 'IPA', 'Times New Roman', serif;
        }

        .card-waveform {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1px;
          height: 40px;
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .waveform-bar {
          flex: 1;
          min-width: 1px;
          border-radius: 1px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .note-card:hover .waveform-bar {
          opacity: 1;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .duration-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #B0B0B0;
          font-size: 11px;
          font-family: monospace;
        }

        .duration-icon {
          font-size: 8px;
        }

        .family-tag {
          font-size: 11px;
          color: #B0B0B0;
          background: rgba(255, 255, 255, 0.06);
          padding: 4px 8px;
          border-radius: 10px;
        }

        .card-description {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 12px;
          color: #888;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%) scale(0);
          animation: rippleExpand 0.6s ease-out;
          pointer-events: none;
        }

        @keyframes rippleExpand {
          to {
            width: 200px;
            height: 200px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          color: white;
          font-size: 14px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .note-card:hover .play-button {
          opacity: 1;
        }

        .play-button:hover {
          transform: translate(-50%, -50%) scale(1.1);
        }
      `}</style>
    </div>
  );
}
