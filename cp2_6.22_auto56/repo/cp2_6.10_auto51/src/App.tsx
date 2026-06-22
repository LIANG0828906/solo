import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterGrid from './components/CharacterGrid';
import PrintingPress from './components/PrintingPress';
import { useGameStore } from './store/gameStore';
import { levels } from './data/levels';

const App: React.FC = () => {
  const {
    gamePhase,
    currentLevel,
    setLevel,
    startGame,
    goToMenu
  } = useGameStore();

  const renderMenu = () => (
    <motion.div
      className="menu-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="menu-header">
        <h1 className="game-title">泥活字排版</h1>
        <h2 className="game-subtitle">毕昇印刷术体验</h2>
        <div className="game-description">
          <p>体验中国古代四大发明之一的活字印刷术</p>
          <p>从选字、排版、上墨到印刷，感受古人的智慧</p>
        </div>
      </div>

      <div className="level-selection">
        <h3 className="section-title">选择关卡</h3>
        <div className="level-cards">
          {levels.map((level) => (
            <motion.div
              key={level.id}
              className={`level-card level-${level.id}`}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setLevel(level.id);
                startGame();
              }}
            >
              <div className="level-number">第{level.id}关</div>
              <div className="level-name">{level.title.split('·')[1]?.trim() || level.title}</div>
              <div className="level-info">
                <span className="char-count">{level.targetChars.length}字</span>
                <span className="difficulty">
                  {'★'.repeat(level.id)}{'☆'.repeat(3 - level.id)}
                </span>
              </div>
              <div className="level-hint">
                {level.id === 1 && '入门：仅包含目标字'}
                {level.id === 2 && '进阶：含5个干扰字'}
                {level.id === 3 && '挑战：含10个干扰字，随机排列'}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="game-instructions">
        <h3 className="section-title">游戏说明</h3>
        <div className="instructions-content">
          <div className="instruction-item">
            <span className="instruction-icon">1</span>
            <span className="instruction-text">从字格架中拖拽泥活字到字盘对应位置</span>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">2</span>
            <span className="instruction-text">按文章顺序排列，放错会扣减错误次数（最多3次）</span>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">3</span>
            <span className="instruction-text">排版完成后点击"上墨"，拖动滚筒刷满字盘</span>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">4</span>
            <span className="instruction-text">刷墨覆盖率达90%以上即可印刷，查看评分</span>
          </div>
        </div>
      </div>

      <style>{`
        .menu-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          box-sizing: border-box;
          background: linear-gradient(180deg, #f5e6cc 0%, #e8d6b3 50%, #dcc59c 100%);
        }
        
        .menu-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .game-title {
          font-size: 48px;
          color: #8b5a2a;
          margin: 0;
          letter-spacing: 12px;
          text-shadow: 2px 2px 4px rgba(139, 90, 42, 0.3);
        }
        
        .game-subtitle {
          font-size: 20px;
          color: #b22222;
          margin: 10px 0 20px 0;
          letter-spacing: 6px;
        }
        
        .game-description {
          color: #5a3e1a;
          font-size: 14px;
          line-height: 1.8;
        }
        
        .game-description p {
          margin: 4px 0;
        }
        
        .section-title {
          font-size: 18px;
          color: #8b5a2a;
          text-align: center;
          margin-bottom: 20px;
          letter-spacing: 4px;
          border-bottom: 2px solid #c8a46e;
          padding-bottom: 8px;
        }
        
        .level-selection {
          width: 100%;
          max-width: 800px;
          margin-bottom: 40px;
        }
        
        .level-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        
        .level-card {
          background: linear-gradient(135deg, #f5e6cc 0%, #ebe0c4 100%);
          border: 3px solid #8b5a2a;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          text-align: center;
          box-shadow: 0 4px 12px rgba(139, 90, 42, 0.2);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .level-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238b5a2a' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }
        
        .level-card:hover {
          box-shadow: 0 8px 24px rgba(139, 90, 42, 0.4);
          border-color: #b22222;
        }
        
        .level-number {
          font-size: 14px;
          color: #8b7355;
          margin-bottom: 8px;
        }
        
        .level-name {
          font-size: 22px;
          color: #8b5a2a;
          font-weight: bold;
          margin-bottom: 12px;
          letter-spacing: 2px;
        }
        
        .level-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 13px;
        }
        
        .char-count {
          color: #5a3e1a;
          background: rgba(200, 164, 110, 0.3);
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .difficulty {
          color: #ffd700;
          text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
        }
        
        .level-hint {
          font-size: 12px;
          color: #8b7355;
          font-style: italic;
        }
        
        .game-instructions {
          width: 100%;
          max-width: 600px;
        }
        
        .instructions-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .instruction-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.4);
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid #b22222;
        }
        
        .instruction-icon {
          width: 28px;
          height: 28px;
          background: #8b5a2a;
          color: #f5e6cc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .instruction-text {
          color: #5a3e1a;
          font-size: 14px;
          line-height: 1.5;
        }
        
        @media (max-width: 768px) {
          .menu-container {
            padding: 20px 12px;
          }
          
          .game-title {
            font-size: 32px;
            letter-spacing: 6px;
          }
          
          .game-subtitle {
            font-size: 16px;
            letter-spacing: 3px;
          }
          
          .level-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  );

  const renderGame = () => (
    <motion.div
      className="game-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="game-header">
        <button className="back-btn" onClick={goToMenu}>
          ← 返回主菜单
        </button>
        <h2 className="current-level">
          {levels.find(l => l.id === currentLevel)?.title || `第${currentLevel}关`}
        </h2>
        <div className="header-spacer" />
      </div>
      
      <div className="game-content">
        <div className="character-grid-section">
          <CharacterGrid />
        </div>
        <div className="printing-press-section">
          <PrintingPress />
        </div>
      </div>

      <style>{`
        .game-container {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #f5e6cc 0%, #ebe0c4 100%);
          overflow: hidden;
        }
        
        .game-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: linear-gradient(90deg, #8b5a2a 0%, #a86a3a 50%, #8b5a2a 100%);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .back-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #f5e6cc;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'KaiTi', 'STKaiti', serif;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .back-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .current-level {
          color: #f5e6cc;
          margin: 0;
          font-size: 18px;
          letter-spacing: 4px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .header-spacer {
          width: 100px;
        }
        
        .game-content {
          flex: 1;
          display: flex;
          gap: 16px;
          padding: 16px;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .character-grid-section {
          width: 60%;
          height: 100%;
          min-height: 0;
        }
        
        .printing-press-section {
          width: 40%;
          height: 100%;
          min-height: 0;
        }
        
        @media (max-width: 768px) {
          .game-container {
            height: auto;
            min-height: 100vh;
          }
          
          .game-header {
            padding: 8px 12px;
          }
          
          .current-level {
            font-size: 14px;
            letter-spacing: 2px;
          }
          
          .back-btn {
            padding: 6px 12px;
            font-size: 12px;
          }
          
          .header-spacer {
            width: 70px;
          }
          
          .game-content {
            flex-direction: column;
            padding: 8px;
            gap: 8px;
          }
          
          .character-grid-section {
            width: 100%;
            height: 40vh;
          }
          
          .printing-press-section {
            width: 100%;
            height: calc(60vh - 80px);
          }
        }
      `}</style>
    </motion.div>
  );

  return (
    <div className="app-root">
      <AnimatePresence mode="wait">
        {gamePhase === 'menu' ? (
          <div key="menu">{renderMenu()}</div>
        ) : (
          <div key="game">{renderGame()}</div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
