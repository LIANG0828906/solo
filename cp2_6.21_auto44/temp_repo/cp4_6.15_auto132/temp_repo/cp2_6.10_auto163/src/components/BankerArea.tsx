import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import HistoryPanel from './HistoryPanel';
import './BankerArea.css';

const BankerArea = () => {
  const { currentPlayer, banker, phase, becomeBanker, leaveBanker, aiPlayers } = useGameStore(
    (state) => ({
      currentPlayer: state.currentPlayer,
      banker: state.banker,
      phase: state.phase,
      becomeBanker: state.becomeBanker,
      leaveBanker: state.leaveBanker,
      aiPlayers: state.aiPlayers,
    })
  );

  const canBecomeBanker = !banker && phase === 'betting' && currentPlayer.chips >= 500;
  const canLeaveBanker = banker?.id === currentPlayer.id && phase === 'betting';

  const displayBanker = banker || {
    name: '虚位以待',
    avatar: '🏮',
    chips: 0,
    isBanker: false,
  };

  return (
    <div className="banker-area">
      <div className="area-header">
        <h2 className="area-title">风云赌坊</h2>
      </div>

      <div className="banker-info">
        <div className="banker-card">
          <motion.div
            className="banker-avatar"
            animate={displayBanker.isBanker ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {displayBanker.avatar}
            {displayBanker.isBanker && <div className="banker-badge">庄</div>}
          </motion.div>
          <div className="banker-details">
            <span className="banker-name">{displayBanker.name}</span>
            <div className="banker-chips">
              <span className="chips-label">筹码</span>
              <motion.span
                className="chips-value"
                key={displayBanker.chips}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {displayBanker.chips.toLocaleString()}
              </motion.span>
            </div>
          </div>
        </div>

        {!banker && (
          <motion.button
            className="wood-button banker-button"
            onClick={becomeBanker}
            disabled={!canBecomeBanker}
            whileHover={canBecomeBanker ? { scale: 1.05 } : {}}
            whileTap={canBecomeBanker ? { scale: 0.95 } : {}}
          >
            {canBecomeBanker ? '坐庄' : '筹码不足500'}
          </motion.button>
        )}

        {canLeaveBanker && (
          <motion.button
            className="wood-button banker-button leave-button"
            onClick={leaveBanker}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            下庄
          </motion.button>
        )}
      </div>

      <div className="ai-players">
        <h3 className="section-title">其他赌客</h3>
        <div className="ai-list">
          {aiPlayers.map((ai) => (
            <motion.div
              key={ai.id}
              className="ai-player"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: ai.id === 'ai-0' ? 0.1 : ai.id === 'ai-1' ? 0.2 : 0.3 }}
            >
              <span className="ai-avatar">{ai.avatar}</span>
              <div className="ai-info">
                <span className="ai-name">{ai.name}</span>
                <span className="ai-chips">💰 {ai.chips}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="player-info">
        <h3 className="section-title">客官您</h3>
        <div className="player-card">
          <span className="player-avatar">{currentPlayer.avatar}</span>
          <div className="player-details">
            <span className="player-name">{currentPlayer.name}</span>
            <div className="player-chips">
              <span className="chips-label">筹码</span>
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
          {currentPlayer.isBanker && (
            <div className="player-banker-badge">庄家</div>
          )}
        </div>
      </div>

      <div className="history-section">
        <h3 className="section-title">历史记录</h3>
        <HistoryPanel />
      </div>
    </div>
  );
};

export default BankerArea;
