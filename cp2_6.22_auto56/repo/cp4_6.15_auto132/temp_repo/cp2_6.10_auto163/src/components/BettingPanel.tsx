import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { BET_OPTIONS } from '../types/game';
import type { BetOption } from '../types/game';
import Chip from './Chip';
import './BettingPanel.css';

const BettingPanel = () => {
  const {
    phase,
    bets,
    selectedBetAmount,
    currentPlayer,
    placeBet,
    rollDice,
    startNewRound,
    setSelectedBetAmount,
  } = useGameStore((state) => ({
    phase: state.phase,
    bets: state.bets,
    selectedBetAmount: state.selectedBetAmount,
    currentPlayer: state.currentPlayer,
    placeBet: state.placeBet,
    rollDice: state.rollDice,
    startNewRound: state.startNewRound,
    setSelectedBetAmount: state.setSelectedBetAmount,
  }));

  const playerBets = bets.filter((b) => b.playerId === currentPlayer.id);
  const totalPlayerBet = playerBets.reduce((sum, b) => sum + b.amount, 0);

  const betAmounts = [1, 5, 10, 20, 50, 100];

  const handlePlaceBet = useCallback(
    (option: BetOption) => {
      if (phase !== 'betting') return;
      if (currentPlayer.chips < selectedBetAmount) return;
      placeBet(option, selectedBetAmount);
    },
    [phase, currentPlayer.chips, selectedBetAmount, placeBet]
  );

  const getBetForOption = (option: BetOption) => {
    return playerBets.find((b) => b.option === option);
  };

  const canRoll = phase === 'betting' && (totalPlayerBet > 0 || currentPlayer.isBanker);

  return (
    <div className="betting-panel">
      <div className="panel-header">
        <h2 className="panel-title">下注区</h2>
        <div className="player-chips">
          <span className="chips-icon">💰</span>
          <motion.span
            className="chips-value"
            key={currentPlayer.chips}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {currentPlayer.chips.toLocaleString()}
          </motion.span>
        </div>
      </div>

      <div className="amount-selector">
        <span className="selector-label">投注金额</span>
        <div className="chips-row">
          {betAmounts.map((amount) => (
            <Chip
              key={amount}
              amount={amount}
              onClick={() => setSelectedBetAmount(amount)}
              disabled={phase !== 'betting' || currentPlayer.chips < amount}
              isFlying={selectedBetAmount === amount && phase === 'betting'}
            />
          ))}
        </div>
      </div>

      <div className="bet-options">
        {Object.entries(BET_OPTIONS).map(([key, option]) => {
          const betOption = key as BetOption;
          const bet = getBetForOption(betOption);
          return (
            <motion.button
              key={key}
              className={`bet-option ${bet ? 'has-bet' : ''}`}
              onClick={() => handlePlaceBet(betOption)}
              disabled={phase !== 'betting' || currentPlayer.chips < selectedBetAmount}
              whileHover={phase === 'betting' ? { scale: 1.02 } : {}}
              whileTap={phase === 'betting' ? { scale: 0.98 } : {}}
            >
              <div className="bet-option-main">
                <span className="bet-icon">🎲</span>
                <span className="bet-label">{option.label}</span>
              </div>
              <div className="bet-option-info">
                <span className="bet-odds">1:{option.odds}</span>
                <span className="bet-desc">{option.description}</span>
              </div>
              {bet && (
                <motion.div
                  className="bet-amount-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {bet.amount}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {totalPlayerBet > 0 && (
        <div className="bet-summary">
          <span>已下注: </span>
          <span className="summary-amount">{totalPlayerBet}</span>
        </div>
      )}

      <div className="action-buttons">
        {phase === 'betting' && (
          <motion.button
            className="wood-button roll-button"
            onClick={rollDice}
            disabled={!canRoll}
            whileHover={canRoll ? { scale: 1.05 } : {}}
            whileTap={canRoll ? { scale: 0.95 } : {}}
          >
            {currentPlayer.isBanker ? '摇骰开盅' : '下注开骰'}
          </motion.button>
        )}
        {phase === 'settling' && (
          <motion.button
            className="wood-button roll-button"
            onClick={startNewRound}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            再来一局
          </motion.button>
        )}
        {phase === 'rolling' && (
          <div className="rolling-indicator">
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              摇骰中...
            </motion.span>
          </div>
        )}
        {phase === 'revealing' && (
          <div className="rolling-indicator">
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              开骰！
            </motion.span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingPanel;
