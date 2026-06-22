import React, { useState, useEffect } from 'react';
import { XunScore } from '../types';

interface ScorePageProps {
  score: XunScore | null;
  officerName: string;
  onRestart: () => void;
}

const ScorePage: React.FC<ScorePageProps> = ({ score, officerName, onRestart }) => {
  const [showContent, setShowContent] = useState(false);
  const [animatedScores, setAnimatedScores] = useState({
    accuracy: 0,
    cultivation: 0,
    event: 0,
    total: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showContent || !score) return;

    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedScores({
        accuracy: Math.round(score.accuracyScore * progress),
        cultivation: Math.round(score.cultivationScore * progress),
        event: Math.round(score.eventScore * progress),
        total: Math.round(score.totalScore * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [showContent, score]);

  if (!score) return null;

  return (
    <div className="score-page">
      <div className="scroll-container">
        <div className="scroll">
          <h1 className="scroll-title">星 文 录</h1>
          
          {showContent && (
            <>
              <div style={{ textAlign: 'center', fontSize: '20px', color: '#5d4037', marginBottom: '20px' }}>
                星官 <span style={{ color: '#8B4513', fontWeight: 'bold' }}>{officerName}</span> 本旬政绩
              </div>

              <div className="score-row">
                <span className="score-label">准确率得分</span>
                <span className="score-value">{animatedScores.accuracy} / 50</span>
              </div>
              
              <div className="score-row">
                <span className="score-label">修为得分</span>
                <span className="score-value">{animatedScores.cultivation} / 30</span>
              </div>
              
              <div className="score-row">
                <span className="score-label">事件处理得分</span>
                <span className="score-value">{animatedScores.event} / 20</span>
              </div>
              
              <div className="score-row total">
                <span className="score-label">总分</span>
                <span className="score-value">{animatedScores.total} / 100</span>
              </div>

              <div className="rank-display">
                评定品级：{score.rank}
              </div>

              <div className="comment">
                「{score.comment}」
              </div>

              <button className="restart-btn" onClick={onRestart}>
                开启新旬
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScorePage;
