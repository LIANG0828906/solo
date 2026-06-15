import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { BET_OPTIONS } from '../types/game';
import './HistoryPanel.css';

const HistoryPanel = () => {
  const history = useGameStore((state) => state.history);

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <span>暂无记录</span>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <AnimatePresence initial={false}>
        {history.map((entry, index) => {
          const winningOptions = Object.entries(entry.result)
            .filter(([key, value]) => value && key !== 'sum')
            .map(([key]) => BET_OPTIONS[key as keyof typeof BET_OPTIONS]?.label)
            .filter(Boolean);

          return (
            <motion.div
              key={entry.id}
              className="history-item"
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="history-header">
                <span className="history-round">第{history.length - index}局</span>
                <span
                  className={`history-profit ${entry.playerProfit > 0 ? 'win' : entry.playerProfit < 0 ? 'lose' : ''}`}
                >
                  {entry.playerProfit > 0 ? '+' : ''}
                  {entry.playerProfit}
                </span>
              </div>
              <div className="history-dice">
                {entry.dice.map((value, i) => (
                  <span key={i} className="history-dice-value">
                    {value}
                  </span>
                ))}
              </div>
              <div className="history-result">
                <span className="result-label">结果:</span>
                <div className="result-tags">
                  {winningOptions.map((option, i) => (
                    <span key={i} className="result-tag">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default HistoryPanel;
