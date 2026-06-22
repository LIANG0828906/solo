import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../utils/constants';
import { useAI } from '../hooks/useAI';

export const StatusPanel = () => {
  const {
    turn,
    currentPlayer,
    fishCount,
    bets,
    lastSteps,
    hasCasted,
    isAIThinking,
    phase,
  } = useGameStore();

  useAI();

  const panelBg = COLORS.inkBlack;
  const textColor = COLORS.darkGold;
  const accentRed = COLORS.tigerRed;
  const accentBlue = COLORS.leopardBlue;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        backgroundColor: panelBg,
        padding: '20px',
        borderRadius: '8px',
        minWidth: '200px',
        border: `4px solid ${COLORS.darkGold}`,
        borderImage: `repeating-linear-gradient(90deg, ${COLORS.darkGold} 0px, ${COLORS.darkGold} 8px, transparent 8px, transparent 12px) 4`,
        boxShadow: `0 0 20px rgba(184, 134, 11, 0.3), inset 0 0 30px rgba(0,0,0,0.5)`,
        fontFamily: '"SimSun", "STSong", serif',
      }}
    >
      <h2
        style={{
          color: textColor,
          fontSize: '20px',
          margin: '0 0 20px 0',
          textAlign: 'center',
          borderBottom: `2px solid ${COLORS.darkGold}`,
          paddingBottom: '10px',
          letterSpacing: '4px',
        }}
      >
        棋局状态
      </h2>

      <div style={{ marginBottom: '15px' }}>
        <div
          style={{
            color: textColor,
            fontSize: '14px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>轮次：</span>
          <span style={{ color: COLORS.gold }}>第 {turn} 轮</span>
        </div>
        <div
          style={{
            color: textColor,
            fontSize: '14px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>当前：</span>
          <motion.span
            animate={{
              scale: currentPlayer === 'tiger' ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              color: currentPlayer === 'tiger' ? accentRed : accentBlue,
              fontWeight: 'bold',
            }}
          >
            {currentPlayer === 'tiger' ? '朱红虎方' : '玄青豹方'}
            {isAIThinking && (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ marginLeft: '5px', fontSize: '12px' }}
              >
                思考中...
              </motion.span>
            )}
          </motion.span>
        </div>
        {hasCasted && phase === 'playing' && (
          <div
            style={{
              color: textColor,
              fontSize: '14px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>步数：</span>
            <span style={{ color: COLORS.gold, fontSize: '18px', fontWeight: 'bold' }}>
              {lastSteps}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: `1px solid ${COLORS.darkGold}`,
          borderBottom: `1px solid ${COLORS.darkGold}`,
          padding: '15px 0',
          marginBottom: '15px',
        }}
      >
        <div
          style={{
            color: textColor,
            fontSize: '14px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: accentRed }}>🐯 虎方鱼牌：</span>
          <span style={{ color: COLORS.gold, fontSize: '16px', fontWeight: 'bold' }}>
            {fishCount.tiger} 枚
          </span>
        </div>
        <div
          style={{
            color: textColor,
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: accentBlue }}>🐆 豹方鱼牌：</span>
          <span style={{ color: COLORS.gold, fontSize: '16px', fontWeight: 'bold' }}>
            {fishCount.leopard} 枚
          </span>
        </div>
      </div>

      <div>
        <div
          style={{
            color: textColor,
            fontSize: '14px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: accentRed }}>🐯 虎方赌注：</span>
          <span style={{ color: COLORS.bronzeYellow }}>
            💰 {bets.tiger}
          </span>
        </div>
        <div
          style={{
            color: textColor,
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: accentBlue }}>🐆 豹方赌注：</span>
          <span style={{ color: COLORS.bronzeYellow }}>
            💰 {bets.leopard}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
