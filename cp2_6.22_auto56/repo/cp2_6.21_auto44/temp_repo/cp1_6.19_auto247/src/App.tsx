import React from 'react';
import { useGameEngine } from './GameEngine';
import StatusPanel from './StatusPanel';
import EventLog from './EventLog';

const App: React.FC = () => {
  const { state, startGame, dispatchWorker, useSparePart, activateEmergency } = useGameEngine();

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        * {
          box-sizing: border-box;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #3D3D5C;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #5D5D7C;
        }
        button:hover {
          background: #3D3D5C !important;
          box-shadow: 0 0 12px rgba(0,200,255,0.2);
        }
        button:active {
          transform: scale(0.98);
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            🛰️ 维生系统模拟器
            <span style={styles.subtitle}>Life Support System Simulator</span>
          </h1>
          <div style={styles.scorePanel}>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>当前得分</span>
              <span style={styles.scoreValue}>{state.score}</span>
            </div>
            <div style={styles.scoreDivider} />
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>运行时间</span>
              <span style={styles.scoreValue}>
                {Math.floor(state.totalTime / 60)}:{(state.totalTime % 60).toFixed(0).padStart(2, '0')}
              </span>
            </div>
            <div style={styles.scoreDivider} />
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>修复次数</span>
              <span style={styles.scoreValue}>{state.repairsCompleted}</span>
            </div>
          </div>
        </div>
      </header>

      {!state.running && !state.gameOver && (
        <div style={styles.startOverlay}>
          <div style={styles.startPanel}>
            <h2 style={styles.startTitle}>🚀 火星殖民基地 - 维生系统管理</h2>
            <p style={styles.startDesc}>
              你是火星殖民基地的维生系统工程师。你的任务是管理水循环模块，
              应对各种突发故障，维持系统运行状态不低于临界阈值。
            </p>
            <div style={styles.startTips}>
              <h3 style={styles.tipsTitle}>游戏规则</h3>
              <ul style={styles.tipsList}>
                <li>共 10 轮，每轮约 30 秒</li>
                <li>每 3-5 秒可能触发随机故障</li>
                <li>最多同时存在 3 个叠加故障</li>
                <li>每次操作后有 3 秒冷却时间</li>
                <li>水位或氧气归零则游戏失败</li>
              </ul>
              <h3 style={styles.tipsTitle}>操作方式</h3>
              <ul style={styles.tipsList}>
                <li>👷 派遣工人维修 - 消耗疲劳，加速修复</li>
                <li>🔧 使用备件更换 - 立即修复故障</li>
                <li>⚡ 紧急协议 - 消耗能源，故障减半</li>
              </ul>
            </div>
            <button
              style={styles.startBtn}
              onClick={startGame}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
              }}
            >
              启动系统 ▶
            </button>
          </div>
        </div>
      )}

      {state.gameOver && (
        <div style={styles.gameOverOverlay}>
          <div style={styles.gameOverPanel}>
            <h2 style={{
              ...styles.gameOverTitle,
              color: state.score > 500 ? '#4CAF50' : '#F44336'
            }}>
              {state.score > 500 ? '🎉 任务完成' : '💥 系统崩溃'}
            </h2>
            <p style={styles.gameOverDesc}>
              {state.score > 500
                ? '恭喜你成功完成了维生系统管理任务！'
                : '维生系统未能维持在安全阈值以上...'}
            </p>

            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>总得分</span>
                <span style={styles.summaryValue}>{state.score}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>运行时间</span>
                <span style={styles.summaryValue}>
                  {Math.floor(state.totalTime / 60)}分{Math.floor(state.totalTime % 60)}秒
                </span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>修复次数</span>
                <span style={styles.summaryValue}>{state.repairsCompleted} 次</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>完成轮数</span>
                <span style={styles.summaryValue}>{state.round - 1} / {state.totalRounds}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>剩余备件</span>
                <span style={styles.summaryValue}>
                  {state.spares.valve + state.spares.seal + state.spares.filter} 个
                </span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>事件总数</span>
                <span style={styles.summaryValue}>{state.events.length} 条</span>
              </div>
            </div>

            <button
              style={styles.restartBtn}
              onClick={startGame}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
              }}
            >
              🔄 重新开始
            </button>
          </div>
        </div>
      )}

      <main style={styles.main}>
        <div style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            <StatusPanel
              status={state.status}
              statusTrend={state.statusTrend}
              faults={state.faults}
              spares={state.spares}
              workers={state.workers}
              cooldown={state.cooldown}
              emergencyProtocol={state.emergencyProtocol}
              emergencyDuration={state.emergencyDuration}
              onDispatchWorker={dispatchWorker}
              onUseSparePart={useSparePart}
              onActivateEmergency={activateEmergency}
            />
          </div>
          <div style={styles.rightColumn}>
            <EventLog
              events={state.events}
              currentRound={state.round}
              totalRounds={state.totalRounds}
            />
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          火星殖民基地 · 维生系统 v1.0 · 保持冷静，持续监控
        </p>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#1A1A2E',
    color: '#E0E0E0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #3D3D5C',
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#E0E0E0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  subtitle: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#757575',
    letterSpacing: '1px'
  },
  scorePanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'rgba(0,0,0,0.2)',
    padding: '12px 24px',
    borderRadius: '12px',
    border: '1px solid #3D3D5C'
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  scoreLabel: {
    fontSize: '11px',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  scoreValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#00C8FF',
    fontFamily: 'monospace'
  },
  scoreDivider: {
    width: '1px',
    height: '32px',
    background: '#3D3D5C'
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  mainGrid: {
    display: 'flex',
    gap: '24px',
    minHeight: 'calc(100vh - 180px)'
  },
  leftColumn: {
    flex: '1.5',
    minWidth: 0
  },
  rightColumn: {
    flex: '1',
    minWidth: '300px'
  },
  startOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(26, 26, 46, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px'
  },
  startPanel: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid #3D3D5C',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  },
  startTitle: {
    margin: '0 0 16px 0',
    fontSize: '28px',
    color: '#E0E0E0'
  },
  startDesc: {
    color: '#9E9E9E',
    fontSize: '14px',
    lineHeight: 1.6,
    margin: '0 0 24px 0'
  },
  startTips: {
    textAlign: 'left',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '24px'
  },
  tipsTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#00C8FF',
    marginTop: '12px'
  },
  tipsList: {
    margin: '0 0 8px 0',
    paddingLeft: '20px',
    color: '#BDBDBD',
    fontSize: '13px',
    lineHeight: 1.8
  },
  startBtn: {
    width: '100%',
    padding: '16px 32px',
    border: 'none',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
  },
  gameOverOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(26, 26, 46, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px'
  },
  gameOverPanel: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid #3D3D5C',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  },
  gameOverTitle: {
    margin: '0 0 8px 0',
    fontSize: '32px'
  },
  gameOverDesc: {
    color: '#9E9E9E',
    fontSize: '14px',
    margin: '0 0 24px 0'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  summaryItem: {
    background: 'rgba(0,0,0,0.2)',
    padding: '12px 16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#757575'
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#E0E0E0'
  },
  restartBtn: {
    width: '100%',
    padding: '14px 32px',
    border: 'none',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #2196F3, #03A9F4)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
  },
  footer: {
    padding: '16px 24px',
    textAlign: 'center',
    borderTop: '1px solid #3D3D5C'
  },
  footerText: {
    margin: 0,
    color: '#616161',
    fontSize: '12px'
  }
};

export default App;
