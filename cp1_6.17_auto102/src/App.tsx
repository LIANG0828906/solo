import { useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { StatusDisplay } from './components/StatusDisplay';
import { useGameStore } from './store/gameStore';
import { eventBus, EventType, spectrumEngine, BandParams } from './SpectrumEngine';
import { securityModule, DefenseLayer } from './SecurityModule';
import './index.css';

function App() {
  const setSecurityStatus = useGameStore((state) => state.setSecurityStatus);
  const updateGameTime = useGameStore((state) => state.updateGameTime);
  const incrementBreachCount = useGameStore((state) => state.incrementBreachCount);
  const setGameWon = useGameStore((state) => state.setGameWon);
  const addBreachNotification = useGameStore((state) => state.addBreachNotification);
  const setBandParams = useGameStore((state) => state.setBandParams);
  const resetGame = useGameStore((state) => state.resetGame);
  const gameWon = useGameStore((state) => state.gameWon);
  const gameTime = useGameStore((state) => state.gameTime);
  const breachCount = useGameStore((state) => state.breachCount);
  const securityStatus = useGameStore((state) => state.securityStatus);

  useEffect(() => {
    const updateStatus = () => {
      const status = securityModule.getStatus();
      setSecurityStatus(status);
    };

    const statusInterval = setInterval(updateStatus, 50);
    const timeInterval = setInterval(updateGameTime, 1000);

    updateStatus();

    return () => {
      clearInterval(statusInterval);
      clearInterval(timeInterval);
    };
  }, [setSecurityStatus, updateGameTime]);

  useEffect(() => {
    const handleParamsChanged = (data: unknown) => {
      const params = data as BandParams;
      setBandParams(params);
    };

    const handleDefenseBreached = (data: unknown) => {
      const { layer, message } = data as { layer: DefenseLayer; message: string };
      incrementBreachCount();
      addBreachNotification(message);
      console.log(`Defense breached: ${layer} - ${message}`);
    };

    const handleSecurityAlert = (data: unknown) => {
      console.log('Security alert:', data);
    };

    const handleGameWon = () => {
      setGameWon(true);
    };

    eventBus.on(EventType.PARAMS_CHANGED, handleParamsChanged);
    eventBus.on(EventType.DEFENSE_BREACHED, handleDefenseBreached);
    eventBus.on(EventType.SECURITY_ALERT, handleSecurityAlert);
    eventBus.on(EventType.GAME_WON, handleGameWon);

    return () => {
      eventBus.off(EventType.PARAMS_CHANGED, handleParamsChanged);
      eventBus.off(EventType.DEFENSE_BREACHED, handleDefenseBreached);
      eventBus.off(EventType.SECURITY_ALERT, handleSecurityAlert);
      eventBus.off(EventType.GAME_WON, handleGameWon);
    };
  }, [setBandParams, incrementBreachCount, addBreachNotification, setGameWon]);

  const handleVictoryClick = () => {
    resetGame();
    securityModule.reset();
    spectrumEngine.setParams({
      low: { frequency: 5, intensity: 50, phase: 0 },
      mid: { frequency: 30, intensity: 50, phase: 0 },
      high: { frequency: 75, intensity: 50, phase: 0 },
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    resetGame();
    securityModule.reset();
    spectrumEngine.setParams({
      low: { frequency: 5, intensity: 50, phase: 0 },
      mid: { frequency: 30, intensity: 50, phase: 0 },
      high: { frequency: 75, intensity: 50, phase: 0 },
    });
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">光谱入侵 - v1.0</div>
      </header>

      <main className="main-content">
        <ControlPanel />
        <StatusDisplay />

        <div className="log-panel">
          <div className="panel-header">
            <h3>系统日志</h3>
          </div>
          <div className="log-content">
            {securityStatus?.alertLogs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
            {(!securityStatus?.alertLogs || securityStatus.alertLogs.length === 0) && (
              <div className="log-entry" style={{ color: '#667788' }}>
                暂无日志记录...
              </div>
            )}
          </div>
          <button className="reset-button" onClick={handleReset}>
            重置游戏
          </button>
        </div>
      </main>

      {gameWon && (
        <div className="victory-overlay" onClick={handleVictoryClick}>
          <div className="victory-title">渗透成功</div>
          <div className="victory-stats">
            <div>
              总用时: <span>{formatTime(gameTime)}</span>
            </div>
            <div>
              破解次数: <span>{breachCount}</span>
            </div>
            <div>
              威胁评分: <span>100</span>
            </div>
          </div>
          <div className="victory-hint">点击任意位置返回主界面</div>
        </div>
      )}
    </div>
  );
}

export default App;
