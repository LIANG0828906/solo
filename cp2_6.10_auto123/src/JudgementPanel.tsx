import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store';

interface ScoreCategory {
  label: string;
  playerScore: number;
  aiScore: number;
  maxScore: number;
}

const JudgementPanel: React.FC = () => {
  const { player, ai, showJudgement, setShowJudgement, phase } = useGameStore();

  const categories: ScoreCategory[] = [
    {
      label: '汤花细腻度',
      playerScore: player.scores.foam,
      aiScore: ai.scores.foam,
      maxScore: 30,
    },
    {
      label: '咬盏时间',
      playerScore: player.scores.bite,
      aiScore: ai.scores.bite,
      maxScore: 50,
    },
    {
      label: '茶百戏意境',
      playerScore: player.scores.artFinesse,
      aiScore: ai.scores.artFinesse,
      maxScore: 30,
    },
    {
      label: '图案复杂度',
      playerScore: player.scores.artComplexity,
      aiScore: ai.scores.artComplexity,
      maxScore: 40,
    },
  ];

  const totalMax = categories.reduce((sum, cat) => sum + cat.maxScore, 0);

  const getWinner = () => {
    if (player.scores.total > ai.scores.total) return 'player';
    if (player.scores.total < ai.scores.total) return 'ai';
    return 'draw';
  };

  const winner = getWinner();

  if (!showJudgement || phase !== 'judging') return null;

  return (
    <AnimatePresence>
      <motion.div
        className="judgement-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="judgement-panel"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="judgement-title">茗战裁定</h2>

          <div
            className={`final-winner ${
              winner === 'player' ? 'win' : winner === 'ai' ? 'lose' : 'draw'
            }`}
          >
            {winner === 'player'
              ? '恭喜获胜！'
              : winner === 'ai'
              ? '惜败，请再接再厉！'
              : '势均力敌，平局！'}
          </div>

          <div className="total-scores">
            <div className="total-score-item">
              <div className="total-score-label">玩家总分</div>
              <motion.div
                className="total-score-value player"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {player.scores.total}
              </motion.div>
            </div>
            <div className="total-score-item">
              <div className="total-score-label">AI总分</div>
              <motion.div
                className="total-score-value ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {ai.scores.total}
              </motion.div>
            </div>
          </div>

          <div className="chart-container">
            {categories.map((cat, index) => {
              const playerWidth = (cat.playerScore / totalMax) * 100;
              const aiWidth = (cat.aiScore / totalMax) * 100;
              const playerWins = cat.playerScore > cat.aiScore;
              const aiWins = cat.aiScore > cat.playerScore;

              return (
                <motion.div
                  key={cat.label}
                  className="chart-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.15 }}
                >
                  <div className="chart-label">{cat.label}</div>
                  <div className="chart-bars">
                    <div className="chart-bar-row">
                      <div
                        className={`chart-bar player ${
                          playerWins ? 'winner' : ''
                        }`}
                        style={{
                          width: `${Math.max(playerWidth, 5)}%`,
                        }}
                      >
                        {cat.playerScore}
                      </div>
                      <div className="chart-score player">{cat.playerScore}</div>
                    </div>
                    <div className="chart-bar-row">
                      <div
                        className={`chart-bar ai ${aiWins ? 'winner' : ''}`}
                        style={{
                          width: `${Math.max(aiWidth, 5)}%`,
                        }}
                      >
                        {cat.aiScore}
                      </div>
                      <div className="chart-score ai">{cat.aiScore}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-color player" />
              <span>玩家</span>
            </div>
            <div className="legend-item">
              <div className="legend-color ai" />
              <span>AI对手</span>
            </div>
          </div>

          <div className="control-row" style={{ marginTop: '30px' }}>
            <button
              className="btn"
              onClick={() => setShowJudgement(false)}
            >
              查看记录
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => useGameStore.getState().resetGame()}
            >
              再来一局
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JudgementPanel;
