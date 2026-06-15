import React, { useState, useEffect, useCallback, useRef } from 'react';
import Gallery from './component/Gallery';
import CalligraphyCanvas from './component/CalligraphyCanvas';
import { rubbings } from './data/rubbings';
import type { Rubbing, PracticeRecord, AnimationSpeed, ViewMode, Stroke, CharacterStroke } from './types';
import { calculateOverallScore, getScoreGradient, getScoreColor } from './utils/scoring';

const STORAGE_KEY = 'calligraphy_practice_records';

const loadRecords = (): PracticeRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecords = (records: PracticeRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [selectedRubbing, setSelectedRubbing] = useState<Rubbing | null>(null);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>('normal');
  const [strokeScores, setStrokeScores] = useState<Map<number, number>>(new Map());
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [visibleRecords, setVisibleRecords] = useState<Set<string>>(new Set());
  const [compareRecord, setCompareRecord] = useState<PracticeRecord | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const userStrokesRef = useRef<Stroke[]>([]);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
      if (window.innerWidth <= 600) {
        document.body.classList.add('mobile-nav-active');
      } else {
        document.body.classList.remove('mobile-nav-active');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (viewMode === 'history') {
      records.forEach((record, index) => {
        setTimeout(() => {
          setVisibleRecords((prev) => new Set(prev).add(record.id));
        }, index * 80);
      });
    }
  }, [viewMode, records]);

  const currentChar = selectedRubbing?.characters[selectedCharIndex];

  const handleSelectRubbing = (rubbing: Rubbing) => {
    setSelectedRubbing(rubbing);
    setSelectedCharIndex(0);
    setStrokeScores(new Map());
    setShowScoreCard(false);
    setResetTrigger((t) => t + 1);
    userStrokesRef.current = [];
    setViewMode('practice');
  };

  const handleBackToGallery = () => {
    setViewMode('gallery');
    setSelectedRubbing(null);
    setStrokeScores(new Map());
    setShowScoreCard(false);
  };

  const handleScoreUpdate = useCallback((strokeId: number, score: number) => {
    setStrokeScores((prev) => {
      const next = new Map(prev);
      const existing = next.get(strokeId) || 0;
      next.set(strokeId, Math.max(existing, score));
      return next;
    });
  }, []);

  const handleAllStrokesComplete = useCallback(() => {
    if (!selectedRubbing || !currentChar) return;

    setShowScoreCard(true);

    const scoresArray = Array.from(strokeScores.values());
    const overallScore = calculateOverallScore(scoresArray);

    const record: PracticeRecord = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      rubbingId: selectedRubbing.id,
      rubbingName: selectedRubbing.name,
      character: currentChar.char,
      score: overallScore,
      strokeScores: currentChar.strokes.map((s) => ({
        strokeId: s.id,
        score: strokeScores.get(s.id) || 0
      })),
      userStrokes: [...userStrokesRef.current],
      date: new Date().toLocaleDateString('zh-CN'),
      timestamp: Date.now()
    };

    setRecords((prev) => {
      const updated = [record, ...prev];
      saveRecords(updated);
      return updated;
    });
  }, [selectedRubbing, currentChar, strokeScores]);

  const handleClearCanvas = () => {
    setResetTrigger((t) => t + 1);
    setStrokeScores(new Map());
    setShowScoreCard(false);
    userStrokesRef.current = [];
  };

  const handleCharChange = (index: number) => {
    setSelectedCharIndex(index);
    setStrokeScores(new Map());
    setShowScoreCard(false);
    setResetTrigger((t) => t + 1);
    userStrokesRef.current = [];
  };

  const overallScore = calculateOverallScore(Array.from(strokeScores.values()));

  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  const renderGallery = () => (
    <Gallery rubbings={rubbings} onSelect={handleSelectRubbing} />
  );

  const renderPractice = () => {
    if (!selectedRubbing || !currentChar) return null;

    return (
      <div className="practice-page">
        <div className="canvas-wrapper">
          <div className="canvas-header">
            <button className="back-btn" onClick={handleBackToGallery}>
              ← 返回碑帖
            </button>
            <div className="character-selector">
              {selectedRubbing.characters.map((ch, idx) => (
                <button
                  key={ch.char}
                  className={`char-btn ${idx === selectedCharIndex ? 'active' : ''}`}
                  onClick={() => handleCharChange(idx)}
                >
                  {ch.char}
                </button>
              ))}
            </div>
            <div style={{ width: 100 }} />
          </div>

          <CalligraphyCanvas
            characterStrokes={currentChar.strokes}
            character={currentChar.char}
            size={420}
            speed={animationSpeed}
            onScoreUpdate={handleScoreUpdate}
            onAllStrokesComplete={handleAllStrokesComplete}
            resetTrigger={resetTrigger}
          />

          {showScoreCard && (
            <div className="panel-card score-card" style={{ width: '100%', maxWidth: 420 }}>
              <div className="score-header">
                <span className="score-label">整体匹配度</span>
                <span className="score-value" style={{ color: getScoreColor(overallScore) }}>
                  {overallScore}%
                </span>
              </div>
              <div className="score-bar-container">
                <div
                  className="score-bar"
                  style={{
                    width: `${overallScore}%`,
                    backgroundColor: getScoreGradient(overallScore