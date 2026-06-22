import { useEffect, useRef, memo } from 'react';
import { useBandStore } from '../store/bandStore';
import { audioEngine } from '../core/AudioEngine';
import { visualizer } from '../core/Visualizer';
import type { MusicianType } from '../types';
import { MUSICIAN_LABELS, GENRE_LABELS, GENRES, ROOT_NOTES, CHORD_TYPES, CHORD_LABELS, TIME_SIGNATURES, RHYTHM_PATTERNS } from '../types';

const NEON_COLORS: Record<MusicianType, string> = {
  drummer: '#ffaa00',
  bassist: '#ff00aa',
  guitarist: '#00ffaa',
  keyboardist: '#4488ff'
};

const MusicianSilhouette = memo(function MusicianSilhouette({ type, color }: { type: MusicianType; color: string }) {
  if (type === 'drummer') {
    return (
      <svg viewBox="0 0 100 120" fill="currentColor" style={{ color }}>
        <ellipse cx="50" cy="20" rx="18" ry="16" />
        <path d="M32 35 Q50 40 68 35 L72 70 Q50 80 28 70 Z" />
        <rect x="20" y="72" width="15" height="40" rx="5" />
        <rect x="65" y="72" width="15" height="40" rx="5" />
        <circle cx="35" cy="100" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="65" cy="100" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
        <line x1="28" y1="50" x2="8" y2="80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <line x1="72" y1="50" x2="92" y2="80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <circle cx="8" cy="80" r="5" />
        <circle cx="92" cy="80" r="5" />
      </svg>
    );
  }
  
  if (type === 'bassist') {
    return (
      <svg viewBox="0 0 100 120" fill="currentColor" style={{ color }}>
        <ellipse cx="50" cy="20" rx="16" ry="14" />
        <path d="M34 33 Q50 38 66 33 L70 68 Q50 78 30 68 Z" />
        <rect x="30" y="70" width="14" height="42" rx="4" />
        <rect x="56" y="70" width="14" height="42" rx="4" />
        <path d="M15 100 Q45 75 75 50 L80 55 Q50 82 20 108 Z" />
        <rect x="75" y="40" width="8" height="25" rx="2" />
        <circle cx="79" cy="35" r="5" />
        <line x1="66" y1="55" x2="78" y2="48" stroke="currentColor" strokeWidth="2" />
        <line x1="66" y1="62" x2="78" y2="55" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  
  if (type === 'guitarist') {
    return (
      <svg viewBox="0 0 100 120" fill="currentColor" style={{ color }}>
        <ellipse cx="50" cy="20" rx="17" ry="15" />
        <path d="M33 34 Q50 39 67 34 L71 70 Q50 80 29 70 Z" />
        <rect x="32" y="72" width="16" height="40" rx="5" />
        <rect x="52" y="72" width="16" height="40" rx="5" />
        <path d="M85 105 Q55 80 30 55 L25 60 Q52 85 80 112 Z" />
        <circle cx="58" cy="78" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="18" y="50" width="10" height="18" rx="2" />
        <circle cx="23" cy="45" r="6" />
        <line x1="55" y1="72" x2="35" y2="58" stroke="currentColor" strokeWidth="2" />
        <line x1="58" y1="75" x2="38" y2="61" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  
  return (
    <svg viewBox="0 0 100 120" fill="currentColor" style={{ color }}>
      <ellipse cx="50" cy="20" rx="16" ry="14" />
      <path d="M34 33 Q50 38 66 33 L70 65 Q50 75 30 65 Z" />
      <rect x="34" y="67" width="14" height="45" rx="4" />
      <rect x="52" y="67" width="14" height="45" rx="4" />
      <rect x="5" y="100" width="90" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="18" y1="100" x2="18" y2="114" stroke="currentColor" strokeWidth="2" />
      <line x1="32" y1="100" x2="32" y2="114" stroke="currentColor" strokeWidth="2" />
      <line x1="46" y1="100" x2="46" y2="114" stroke="currentColor" strokeWidth="2" />
      <line x1="60" y1="100" x2="60" y2="114" stroke="currentColor" strokeWidth="2" />
      <line x1="74" y1="100" x2="74" y2="114" stroke="currentColor" strokeWidth="2" />
      <line x1="86" y1="100" x2="86" y2="114" stroke="currentColor" strokeWidth="2" />
      <path d="M20 50 Q8 70 12 95" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M80 50 Q92 70 88 95" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
});

interface MusicianCardProps {
  type: MusicianType;
  isSelected: boolean;
  onClick: () => void;
}

function MusicianCard({ type, isSelected, onClick }: MusicianCardProps) {
  const musician = useBandStore(state => state.musicians[type]);
  const isPlaying = useBandStore(state => state.isPlaying);
  const updateMusician = useBandStore(state => state.updateMusician);
  const color = NEON_COLORS[type];

  const cardClasses = [
    'musician-card',
    `genre-${musician.genre}`,
    isPlaying ? 'playing' : 'paused',
    isSelected ? 'selected' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      onClick={onClick}
      className={cardClasses}
      style={{
        '--musician-color': color,
        '--selected-glow': isSelected ? '0 0 20px 3px #ffd700, 0 0 40px 6px rgba(255, 215, 0, 0.4)' : 'none',
        '--border-color': isSelected ? '#ffd700' : color
      } as React.CSSProperties}
    >
      <div className="musician-icon">
        <MusicianSilhouette type={type} color={color} />
        {musician.solo && <div className="solo-badge">SOLO</div>}
      </div>
      <div className="musician-name">{MUSICIAN_LABELS[type]}</div>
      
      <div className="status-panel">
        <div className="param-row">
          <label>音量</label>
          <input
            type="range"
            min="0"
            max="100"
            value={musician.volume}
            onChange={(e) => updateMusician(type, { volume: Number(e.target.value) })}
            onClick={(e) => e.stopPropagation()}
            style={{ '--slider-color': color } as React.CSSProperties}
          />
          <span>{musician.volume}</span>
        </div>
        
        <div className="param-row">
          <label>节奏偏移</label>
          <input
            type="range"
            min="-50"
            max="50"
            value={musician.rhythmShift}
            onChange={(e) => updateMusician(type, { rhythmShift: Number(e.target.value) })}
            onClick={(e) => e.stopPropagation()}
            style={{ '--slider-color': color } as React.CSSProperties}
          />
          <span>{musician.rhythmShift > 0 ? '+' : ''}{musician.rhythmShift}</span>
        </div>
        
        <div className="param-row">
          <label>曲风</label>
          <select
            value={musician.genre}
            onChange={(e) => updateMusician(type, { genre: e.target.value as any })}
            onClick={(e) => e.stopPropagation()}
            style={{ '--select-color': color } as React.CSSProperties}
          >
            {GENRES.map(g => (
              <option key={g} value={g}>{GENRE_LABELS[g]}</option>
            ))}
          </select>
        </div>
        
        <div className="param-row">
          <label>复杂度</label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={musician.complexity}
            onChange={(e) => updateMusician(type, { complexity: Number(e.target.value) })}
            onClick={(e) => e.stopPropagation()}
            style={{ '--slider-color': color } as React.CSSProperties}
          />
          <span>{musician.complexity}</span>
        </div>
      </div>
    </div>
  );
}

function DetailPanel() {
  const selectedMusician = useBandStore(state => state.selectedMusician);
  const selectMusician = useBandStore(state => state.selectMusician);
  const musician = useBandStore(state => selectedMusician ? state.musicians[selectedMusician] : null);
  const updateMusician = useBandStore(state => state.updateMusician);
  const toggleSolo = useBandStore(state => state.toggleSolo);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!selectedMusician || !musician) return null;

  const color = NEON_COLORS[selectedMusician];

  return (
    <div className="detail-panel-overlay" onClick={() => selectMusician(null)}>
      <div
        ref={panelRef}
        className="detail-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ '--panel-color': color } as React.CSSProperties}
      >
        <div className="panel-header">
          <h2 style={{ color }}>{MUSICIAN_LABELS[selectedMusician]} 详细设置</h2>
          <button className="close-btn" onClick={() => selectMusician(null)}>×</button>
        </div>

        <div className="panel-section">
          <h3>节奏型选择</h3>
          <div className="rhythm-patterns">
            {Array.from({ length: RHYTHM_PATTERNS }).map((_, i) => (
              <button
                key={i}
                className={`pattern-btn ${musician.rhythmPattern === i ? 'active' : ''}`}
                onClick={() => updateMusician(selectedMusician, { rhythmPattern: i })}
                style={{
                  '--pattern-color': color,
                  '--pattern-glow': musician.rhythmPattern === i ? `0 0 15px ${color}, 0 0 30px ${color}` : 'none'
                } as React.CSSProperties}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h3>和弦编辑器</h3>
          <div className="chord-editor">
            <div className="chord-row">
              <label>根音</label>
              <select
                value={musician.rootNote}
                onChange={(e) => updateMusician(selectedMusician, { rootNote: e.target.value })}
              >
                {ROOT_NOTES.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>
            <div className="chord-row">
              <label>和弦类型</label>
              <select
                value={musician.chordType}
                onChange={(e) => updateMusician(selectedMusician, { chordType: e.target.value as any })}
              >
                {CHORD_TYPES.map(type => (
                  <option key={type} value={type}>{CHORD_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div className="chord-row">
              <label>拍号</label>
              <select
                value={musician.timeSignature}
                onChange={(e) => updateMusician(selectedMusician, { timeSignature: e.target.value as any })}
              >
                {TIME_SIGNATURES.map(sig => (
                  <option key={sig} value={sig}>{sig}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <div className="solo-section">
            <span>独奏模式</span>
            <button
              className={`solo-toggle ${musician.solo ? 'active' : ''}`}
              onClick={() => toggleSolo(selectedMusician)}
              style={{ '--solo-color': color } as React.CSSProperties}
            >
              {musician.solo ? '开启' : '关闭'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BandStage() {
  const selectedMusician = useBandStore(state => state.selectedMusician);
  const selectMusician = useBandStore(state => state.selectMusician);
  const musicians = useBandStore(state => state.musicians);
  const isPlaying = useBandStore(state => state.isPlaying);
  const bpm = useBandStore(state => state.bpm);
  const masterVolume = useBandStore(state => state.masterVolume);

  useEffect(() => {
    audioEngine.init();
  }, []);

  useEffect(() => {
    const types: MusicianType[] = ['drummer', 'bassist', 'guitarist', 'keyboardist'];
    types.forEach(type => {
      audioEngine.setMusicianConfig(type, musicians[type]);
    });
    audioEngine.updateSoloStates();
  }, [musicians]);

  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    if (isPlaying) {
      audioEngine.start();
      visualizer.start();
    } else {
      audioEngine.stop();
      visualizer.stop();
    }
  }, [isPlaying]);

  const handleSelect = (type: MusicianType) => {
    selectMusician(selectedMusician === type ? null : type);
  };

  return (
    <div className="band-stage">
      <div className="stage-backdrop" />
      
      <div className="stage-lights">
        <div className="spotlight spot-1" />
        <div className="spotlight spot-2" />
        <div className="spotlight spot-3" />
        <div className="spotlight spot-4" />
      </div>

      <div className="musicians-container">
        <div className="drummer-position">
          <MusicianCard
            type="drummer"
            isSelected={selectedMusician === 'drummer'}
            onClick={() => handleSelect('drummer')}
          />
        </div>
        
        <div className="front-row">
          <div className="bassist-position">
            <MusicianCard
              type="bassist"
              isSelected={selectedMusician === 'bassist'}
              onClick={() => handleSelect('bassist')}
            />
          </div>
          
          <div className="guitarist-position">
            <MusicianCard
              type="guitarist"
              isSelected={selectedMusician === 'guitarist'}
              onClick={() => handleSelect('guitarist')}
            />
          </div>
        </div>
        
        <div className="keyboardist-position">
          <MusicianCard
            type="keyboardist"
            isSelected={selectedMusician === 'keyboardist'}
            onClick={() => handleSelect('keyboardist')}
          />
        </div>
      </div>

      <DetailPanel />
    </div>
  );
}
