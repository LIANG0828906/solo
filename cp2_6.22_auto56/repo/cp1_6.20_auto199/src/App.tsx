import React, { useState, useCallback, useEffect, useRef } from 'react';
import Fretboard from './Fretboard';
import ChordCard from './ChordCard';
import { instruments, ChordData } from './data';

export default function App() {
  const [instrumentIdx, setInstrumentIdx] = useState(0);
  const [selectedChord, setSelectedChord] = useState<ChordData | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceChord, setPracticeChord] = useState<ChordData | null>(null);
  const [clickedPositions, setClickedPositions] = useState<Set<string>>(new Set());
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [wrongFlash, setWrongFlash] = useState(false);
  const [practiceHint, setPracticeHint] = useState<string>('');
  const practiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const instrument = instruments[instrumentIdx];

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    setSelectedChord(null);
    setCardFlipped(false);
    setPracticeMode(false);
    setPracticeChord(null);
    setClickedPositions(new Set());
    setScore({ correct: 0, wrong: 0 });
  }, [instrumentIdx]);

  const speakChord = useCallback((name: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(name);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      synthRef.current.speak(utterance);
    }
  }, []);

  const nextPracticeChord = useCallback(() => {
    const chords = instrument.chords;
    const next = chords[Math.floor(Math.random() * chords.length)];
    setPracticeChord(next);
    setSelectedChord(null);
    setClickedPositions(new Set());
    setPracticeHint(next.name);
    speakChord(next.name);
  }, [instrument.chords, speakChord]);

  useEffect(() => {
    if (practiceMode) {
      nextPracticeChord();
      practiceTimerRef.current = setInterval(nextPracticeChord, 5000);
    } else {
      if (practiceTimerRef.current) {
        clearInterval(practiceTimerRef.current);
        practiceTimerRef.current = null;
      }
      setPracticeChord(null);
      setPracticeHint('');
      setClickedPositions(new Set());
    }
    return () => {
      if (practiceTimerRef.current) {
        clearInterval(practiceTimerRef.current);
      }
    };
  }, [practiceMode, nextPracticeChord]);

  const handleChordSelect = useCallback(
    (chord: ChordData) => {
      if (practiceMode) return;
      setSelectedChord(chord);
      setCardFlipped(false);
    },
    [practiceMode]
  );

  const handlePositionClick = useCallback(
    (stringIdx: number, fret: number) => {
      if (!practiceMode || !practiceChord) return;

      const key = `${stringIdx}-${fret}`;
      if (clickedPositions.has(key)) return;

      const isCorrect = practiceChord.positions.some(
        (p) => p.string === stringIdx && p.fret === fret
      );

      if (isCorrect) {
        const newClicked = new Set(clickedPositions);
        newClicked.add(key);
        setClickedPositions(newClicked);
        setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));

        const allFound = practiceChord.positions.every((p) =>
          newClicked.has(`${p.string}-${p.fret}`)
        );
        if (allFound) {
          setTimeout(nextPracticeChord, 800);
        }
      } else {
        setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
        setWrongFlash(true);
        setTimeout(() => setWrongFlash(false), 400);
      }
    },
    [practiceMode, practiceChord, clickedPositions, nextPracticeChord]
  );

  const handleFlip = useCallback(() => {
    setCardFlipped((prev) => !prev);
  }, []);

  const displayChord = practiceMode ? practiceChord : selectedChord;

  const total = score.correct + score.wrong;
  const correctPct = total > 0 ? score.correct / total : 0;
  const circumference = 2 * Math.PI * 36;
  const greenDash = correctPct * circumference;
  const bgDash = circumference - greenDash;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">指法练习卡片</h1>
          <div className="instrument-switch">
            {instruments.map((inst, idx) => (
              <button
                key={inst.id}
                className={`inst-btn ${instrumentIdx === idx ? 'active' : ''}`}
                onClick={() => setInstrumentIdx(idx)}
              >
                {inst.name}
              </button>
            ))}
          </div>
        </div>
        <div className="header-right">
          <div className={`score-ring-wrapper ${wrongFlash ? 'wrong-flash' : ''}`}>
            <svg className="score-ring" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="5"
              />
              {total > 0 && (
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="5"
                  strokeDasharray={`${greenDash} ${bgDash}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                  className="score-arc"
                />
              )}
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#ef4444"
                strokeWidth="5"
                className={`wrong-ring ${wrongFlash ? 'flash' : ''}`}
              />
            </svg>
            <div className="score-text">
              <span className="score-correct">{score.correct}</span>
              <span className="score-divider">/</span>
              <span className="score-total">{total}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="fretboard-section">
          <Fretboard
            instrument={instrument}
            chord={displayChord}
            practiceMode={practiceMode}
            clickedPositions={clickedPositions}
            onPositionClick={handlePositionClick}
          />
          {practiceHint && practiceMode && (
            <div className="practice-chord-hint">
              <span className="hint-label">请弹奏：</span>
              <span className="hint-chord-name">{practiceHint}</span>
            </div>
          )}
        </section>

        <aside className="sidebar">
          <div className="card-section">
            <ChordCard
              chord={displayChord}
              instrument={instrument}
              flipped={cardFlipped}
              onFlip={handleFlip}
            />
          </div>

          <div className="chord-list-section">
            <h3 className="section-title">和弦列表</h3>
            <div className="chord-grid">
              {instrument.chords.map((chord) => (
                <button
                  key={chord.name}
                  className={`chord-btn ${
                    displayChord?.name === chord.name ? 'selected' : ''
                  } ${chord.type === 'minor' || chord.type === 'minor7' ? 'minor' : ''}`}
                  onClick={() => handleChordSelect(chord)}
                >
                  {chord.name}
                </button>
              ))}
            </div>
          </div>

          <div className="practice-section">
            <div className="practice-toggle-row">
              <span className="practice-label">练习模式</span>
              <button
                className={`practice-switch ${practiceMode ? 'on' : ''}`}
                onClick={() => setPracticeMode((prev) => !prev)}
              >
                <span className="switch-knob" />
              </button>
            </div>
            {practiceMode && (
              <div className="practice-info">
                随机和弦每5秒切换一次，在指板上点击正确的按弦位置
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
