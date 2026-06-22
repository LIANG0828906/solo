import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archer } from '../types';

interface ScoreBoardProps {
  archers: Archer[];
  currentArcherIndex: number;
  currentRound: number;
  arrowsPerRound: number;
}

interface RankedArcher extends Archer {
  rank: number;
  prevRank: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
  archers,
  currentArcherIndex,
  currentRound,
  arrowsPerRound,
}) => {
  const rankedArchers = useMemo((): RankedArcher[] => {
    const sorted = [...archers].sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.upperShots - a.upperShots;
    });
    return sorted.map((archer, index) => ({
      ...archer,
      rank: index + 1,
      prevRank: archer.id,
    }));
  }, [archers]);

  const getScoreTypeText = (type: string): string => {
    switch (type) {
      case '上射': return '上';
      case '参射': return '参';
      case '干射': return '干';
      case '脱靶': return '脱';
      default: return '-';
    }
  };

  const getRoundScores = (archer: Archer, round: number): React.ReactNode[] => {
    const roundScores = archer.scores.filter(s => s.round === round);
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < arrowsPerRound; i++) {
      const score = roundScores[i];
      cells.push(
        <span
          key={i}
          className="score-cell"
          style={{
            display: 'inline-block',
            width: '28px',
            height: '28px',
            lineHeight: '26px',
            textAlign: 'center',
            border: '1px solid #4a3728',
            marginRight: '4px',
            fontSize: '14px',
            backgroundColor: score
              ? (score.type === '上射' ? '#ffe4b5' :
                 score.type === '参射' ? '#f0e68c' :
                 score.type === '干射' ? '#98fb98' : '#d3d3d3')
              : '#f5e6c8',
            color: score ? (score.type === '脱靶' ? '#888' : '#4a3728') : '#bbb',
            borderRadius: '2px',
          }}
        >
          {score ? getScoreTypeText(score.type) : '·'}
        </span>
      );
    }
    return cells;
  };

  return (
    <div className="score-panel jiandu-box" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #4a3728' }}>
        <h2 style={{ fontSize: '20px', color: '#4a3728' }}>射礼记分</h2>
        <span style={{ fontSize: '16px', color: '#6b5344' }}>第 {currentRound} 轮</span>
      </div>

      <AnimatePresence mode="popLayout">
        {rankedArchers.map((archer) => (
          <motion.div
            key={archer.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              marginBottom: '10px',
              padding: '10px',
              border: archer.id === archers[currentArcherIndex]?.id ? '2px solid #cc3333' : '1px solid #8b7355',
              borderRadius: '4px',
              backgroundColor: archer.id === archers[currentArcherIndex]?.id ? '#fff8e7' : '#f5efe0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: archer.rank === 1 ? '#ffd700' : archer.rank === 2 ? '#c0c0c0' : '#cd7f32',
                  color: '#4a3728',
                  fontWeight: 'bold',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                {archer.rank}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4a3728' }}>
                  {archer.title} {archer.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b5344' }}>
                  已射 {archer.currentArrow} / {arrowsPerRound} 矢 · 上射 {archer.upperShots} 次
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#cc3333' }}>
                  {archer.totalScore}
                </div>
                <div style={{ fontSize: '12px', color: '#6b5344' }}>总分</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b5344', minWidth: '48px' }}>本轮:</span>
              {getRoundScores(archer, currentRound)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ScoreBoard;
