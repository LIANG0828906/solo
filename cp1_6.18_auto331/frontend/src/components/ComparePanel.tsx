import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getVowelColor, normalizeWaveform } from '../utils/helpers';

export default function ComparePanel() {
  const notes = useAppStore((state) => state.notes);
  const selectedNotes = useAppStore((state) => state.selectedNotes);
  const comparePanelOpen = useAppStore((state) => state.comparePanelOpen);
  const clearSelection = useAppStore((state) => state.clearSelection);

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ [key: number]: number }>({});
  
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});
  const animationRef = useRef<number | null>(null);

  const selectedNoteObjects = selectedNotes
    .map((id) => notes.find((n) => n.id === id))
    .filter(Boolean) as typeof notes;

  useEffect(() => {
    selectedNoteObjects.forEach((note) => {
      if (note.audioUrl && !audioRefs.current[note.id]) {
        const audio = new Audio(note.audioUrl);
        audioRefs.current[note.id] = audio;
      }
    });
  }, [selectedNoteObjects]);

  useEffect(() => {
    drawWaveform(canvasRef1.current, selectedNoteObjects[0], progress[selectedNoteObjects[0]?.id] || 0);
    drawWaveform(canvasRef2.current, selectedNoteObjects[1], progress[selectedNoteObjects[1]?.id] || 0);
  }, [selectedNoteObjects, progress]);

  const drawWaveform = (
    canvas: HTMLCanvasElement | null,
    note: typeof notes[0] | undefined,
    prog: number
  ) => {
    if (!canvas || !note) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const color = getVowelColor(note.ipa);
    const waveformData = normalizeWaveform(note.waveformData || [], 200);
    const barWidth = rect.width / waveformData.length;
    const maxHeight = rect.height * 0.4;
    const centerY = rect.height / 2;

    const progressRatio = note.audioDuration > 0 ? prog / note.audioDuration : 0;

    waveformData.forEach((amp, i) => {
      const x = i * barWidth;
      const barHeight = amp * maxHeight;
      
      const isPast = i / waveformData.length <= progressRatio;
      
      ctx.fillStyle = isPast ? color : `${color}40`;
      ctx.fillRect(
        x + barWidth * 0.2,
        centerY - barHeight,
        Math.max(1, barWidth * 0.6),
        barHeight * 2
      );
    });

    if (progressRatio > 0 && progressRatio < 1) {
      const lineX = progressRatio * rect.width;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, rect.height);
      ctx.stroke();
    }
  };

  const togglePlay = (noteId: number) => {
    const audio = audioRefs.current[noteId];
    if (!audio) return;

    if (playingId === noteId) {
      audio.pause();
      setPlayingId(null);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      if (playingId !== null && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }
      
      audio.play();
      setPlayingId(noteId);
      
      const updateProgress = () => {
        setProgress((prev) => ({
          ...prev,
          [noteId]: audio.currentTime * 1000,
        }));
        
        if (!audio.paused) {
          animationRef.current = requestAnimationFrame(updateProgress);
        }
      };
      
      animationRef.current = requestAnimationFrame(updateProgress);
      
      audio.onended = () => {
        setPlayingId(null);
        setProgress((prev) => ({ ...prev, [noteId]: 0 }));
      };
    }
  };

  if (selectedNoteObjects.length < 2) {
    return (
      <div className={`compare-panel collapsed ${comparePanelOpen ? 'open' : ''}`}>
        <div className="panel-placeholder">
          <div className="placeholder-icon">🎵</div>
          <p>选择两张笔记卡片进行对比</p>
          <span>点击卡片即可选中</span>
        </div>
        <style>{panelStyles}</style>
      </div>
    );
  }

  const note1 = selectedNoteObjects[0];
  const note2 = selectedNoteObjects[1];
  const color1 = getVowelColor(note1.ipa);
  const color2 = getVowelColor(note2.ipa);

  return (
    <div className={`compare-panel ${comparePanelOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h3>语音对比分析</h3>
        <button className="close-btn" onClick={clearSelection}>
          ✕
        </button>
      </div>

      <div className="compare-content">
        <div className="compare-item">
          <div className="item-header" style={{ borderColor: color1 }}>
            <div className="item-word">{note1.word}</div>
            <div className="item-ipa">{note1.ipa}</div>
          </div>
          
          <div className="waveform-container">
            <canvas ref={canvasRef1} className="waveform-canvas" />
          </div>

          <div className="item-footer">
            <button
              className={`play-btn ${playingId === note1.id ? 'playing' : ''}`}
              style={{ background: color1 }}
              onClick={() => togglePlay(note1.id)}
            >
              {playingId === note1.id ? '❚❚' : '▶'}
            </button>
            <div className="time-display">
              {formatTime(progress[note1.id] || 0)} / {formatTime(note1.audioDuration)}
            </div>
            <div className="family-badge">{note1.languageFamily}</div>
          </div>
        </div>

        <div className="compare-divider">
          <div className="divider-line" />
          <span className="divider-text">VS</span>
          <div className="divider-line" />
        </div>

        <div className="compare-item">
          <div className="item-header" style={{ borderColor: color2 }}>
            <div className="item-word">{note2.word}</div>
            <div className="item-ipa">{note2.ipa}</div>
          </div>
          
          <div className="waveform-container">
            <canvas ref={canvasRef2} className="waveform-canvas" />
          </div>

          <div className="item-footer">
            <button
              className={`play-btn ${playingId === note2.id ? 'playing' : ''}`}
              style={{ background: color2 }}
              onClick={() => togglePlay(note2.id)}
            >
              {playingId === note2.id ? '❚❚' : '▶'}
            </button>
            <div className="time-display">
              {formatTime(progress[note2.id] || 0)} / {formatTime(note2.audioDuration)}
            </div>
            <div className="family-badge">{note2.languageFamily}</div>
          </div>
        </div>
      </div>

      <div className="analysis-tips">
        <div className="tip-item">
          <span className="tip-icon">💡</span>
          <span>观察两个单词的元音发音差异</span>
        </div>
      </div>

      <style>{panelStyles}</style>
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const panelStyles = `
  .compare-panel {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    transition: all 0.3s ease;
  }

  .compare-panel.collapsed {
    opacity: 0.6;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .panel-header h3 {
    margin: 0;
    color: #E0E0E0;
    font-size: 16px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #E0E0E0;
  }

  .panel-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #666;
    text-align: center;
  }

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .panel-placeholder p {
    margin: 0 0 4px 0;
    color: #888;
    font-size: 14px;
  }

  .panel-placeholder span {
    font-size: 12px;
    color: #666;
  }

  .compare-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  .compare-content::-webkit-scrollbar {
    width: 4px;
  }

  .compare-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  .compare-item {
    background: rgba(30, 30, 46, 0.6);
    border-radius: 12px;
    padding: 14px;
  }

  .item-header {
    border-left: 3px solid;
    padding-left: 10px;
    margin-bottom: 12px;
  }

  .item-word {
    font-size: 18px;
    font-weight: 600;
    color: #E0E0E0;
  }

  .item-ipa {
    font-size: 13px;
    color: #B0B0B0;
    margin-top: 2px;
    font-family: 'IPA', serif;
  }

  .waveform-container {
    height: 80px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    margin-bottom: 12px;
    overflow: hidden;
  }

  .waveform-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .item-footer {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .play-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    color: white;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    flex-shrink: 0;
  }

  .play-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .play-btn.playing {
    animation: pulse-btn 1.5s infinite;
  }

  @keyframes pulse-btn {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .time-display {
    font-size: 11px;
    color: #888;
    font-family: monospace;
  }

  .family-badge {
    margin-left: auto;
    font-size: 10px;
    color: #B0B0B0;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 10px;
  }

  .compare-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  .divider-text {
    color: #666;
    font-size: 12px;
    font-weight: 600;
  }

  .analysis-tips {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }

  .tip-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: #888;
  }

  .tip-icon {
    font-size: 14px;
  }
`;
