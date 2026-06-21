import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../data/store';
import { InstrumentType } from '../engine/audioEngine';
import { audioEngine } from '../engine/audioEngine';

const INSTRUMENTS: { type: InstrumentType; label: string; color: string }[] = [
  { type: 'drums', label: '🥁 鼓', color: '#ff6b6b' },
  { type: 'bass', label: '🎸 贝斯', color: '#4ecdc4' },
  { type: 'synth', label: '🎹 合成器', color: '#45b7d1' },
  { type: 'effects', label: '✨ 效果器', color: '#f9ca24' },
];

const playClickSound = async () => {
  let ctx = audioEngine.getAudioContext();
  if (!ctx) {
    await audioEngine.init();
    ctx = audioEngine.getAudioContext();
  }
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.value = 1200;
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

export const Grid = () => {
  const tracks = useStore(state => state.tracks);
  const currentBeat = useStore(state => state.currentBeat);
  const currentBar = useStore(state => state.currentBar);
  const toggleBeat = useStore(state => state.toggleBeat);
  const isLoadingPreset = useStore(state => state.isLoadingPreset);
  const [mouseDown, setMouseDown] = useState(false);
  const [recentlyToggled, setRecentlyToggled] = useState<Set<string>>(new Set());
  const scaleRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoadingPreset) {
      scaleRef.current = 0.8;
    } else {
      scaleRef.current = 1;
    }
  }, [isLoadingPreset]);

  const handleCellMouseDown = useCallback((type: InstrumentType, bar: number, beat: number) => {
    setMouseDown(true);
    const key = `${type}-${bar}-${beat}`;
    if (!recentlyToggled.has(key)) {
      toggleBeat(type, bar, beat);
      playClickSound();
      setRecentlyToggled(prev => new Set(prev).add(key));
      setTimeout(() => {
        setRecentlyToggled(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 100);
    }
  }, [toggleBeat, recentlyToggled]);

  const handleCellMouseEnter = useCallback((type: InstrumentType, bar: number, beat: number) => {
    if (!mouseDown) return;
    const key = `${type}-${bar}-${beat}`;
    if (!recentlyToggled.has(key)) {
      toggleBeat(type, bar, beat);
      playClickSound();
      setRecentlyToggled(prev => new Set(prev).add(key));
      setTimeout(() => {
        setRecentlyToggled(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 100);
    }
  }, [mouseDown, toggleBeat, recentlyToggled]);

  const handleMouseUp = useCallback(() => {
    setMouseDown(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  return (
    <div 
      className={`grid-container ${isLoadingPreset ? 'preset-loading' : ''}`} 
      ref={containerRef}
    >
      <div className="grid-header">
        <div className="grid-instrument-header">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid-beat-header">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      
      {INSTRUMENTS.map((instrument) => (
        <div key={instrument.type} className="grid-row">
          <div className="grid-instrument-label" style={{ color: instrument.color }}>
            {instrument.label}
          </div>
          <div className="grid-cells">
            {Array.from({ length: 8 }).map((_, barIndex) => (
              <div key={barIndex} className="grid-bar-group">
              {Array.from({ length: 8 }).map((_, beatIndex) => {
                const isActive = tracks[instrument.type].beats[barIndex]?.[beatIndex] || false;
                const isCurrentBeat = currentBeat === beatIndex && currentBar === barIndex;
                const isCurrentBar = currentBar === barIndex;
                const key = `${instrument.type}-${barIndex}-${beatIndex}`;
                const isToggled = recentlyToggled.has(key);
                
                return (
                  <div
                    key={beatIndex}
                    className={`grid-cell ${isActive ? 'active' : ''} ${isCurrentBeat ? 'current-beat' : ''} ${isCurrentBar ? 'current-bar' : ''} ${isToggled ? 'toggled' : ''}`}
                    style={{
                      '--instrument-color': instrument.color,
                      animationDelay: `${(barIndex * 8 + beatIndex) * 10}ms`,
                    } as React.CSSProperties}
                    onMouseDown={() => handleCellMouseDown(instrument.type, barIndex, beatIndex)}
                    onMouseEnter={() => handleCellMouseEnter(instrument.type, barIndex, beatIndex)}
                  >
                    <div className="cell-inner">
                      <div className="cell-glow" />
                    </div>
                  </div>
                );
              })}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="grid-labels">
        <div className="grid-bar-labels">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid-bar-label">
              小节 {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
