import { useEffect, useRef } from 'react';
import { Button } from 'antd';
import { Download, Trash2, Clock, Zap } from 'lucide-react';
import { useBattleStore } from '../../../store/battleStore';
import { UNIT_CLASS_COLORS } from '../../battle/types';
import type { Unit, BattleLogEntry } from '../../battle/types';

function TurnOrderList() {
  const units = useBattleStore((state) => state.units);
  const turn = useBattleStore((state) => state.turn);
  const selectedUnitId = useBattleStore((state) => state.selectedUnitId);
  const setSelectedUnit = useBattleStore((state) => state.setSelectedUnit);
  const selectCurrentUnit = useBattleStore((state) => state.selectCurrentUnit);

  const sortedUnits = turn.turnOrder
    .map((id) => units.find((u) => u.id === id))
    .filter((u): u is Unit => u !== undefined);

  const handleUnitClick = (unit: Unit) => {
    if (turn.phase === 'selecting' && unit.id === turn.turnOrder[turn.currentUnitIndex]) {
      selectCurrentUnit();
    } else {
      setSelectedUnit(unit.id);
    }
  };

  const getClassIcon = (unitClass: string) => {
    switch (unitClass) {
      case 'warrior':
        return '⚔️';
      case 'mage':
        return '✨';
      case 'archer':
        return '🏹';
      default:
        return '👤';
    }
  };

  return (
    <div className="turn-order-section">
      <h3 className="section-title">
        <Clock size={16} />
        <span>行动顺序</span>
      </h3>

      {turn.phase === 'idle' ? (
        <p className="empty-hint">点击"开始战斗"生成行动顺序</p>
      ) : (
        <div className="turn-order-list">
          {sortedUnits.map((unit, index) => {
            const isCurrent = index === turn.currentUnitIndex && unit.currentHp > 0;
            const isSelected = unit.id === selectedUnitId;
            const isDead = unit.currentHp <= 0;
            const hasActed = unit.hasActed && index < turn.currentUnitIndex;

            return (
              <div
                key={unit.id}
                className={`turn-order-item ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''} ${isDead ? 'dead' : ''} ${hasActed ? 'acted' : ''}`}
                style={{
                  '--order-index': index,
                  '--unit-color': UNIT_CLASS_COLORS[unit.unitClass],
                } as React.CSSProperties}
                onClick={() => !isDead && handleUnitClick(unit)}
              >
                <div className="order-number">{index + 1}</div>
                <div
                  className="unit-avatar"
                  style={{ backgroundColor: UNIT_CLASS_COLORS[unit.unitClass] }}
                >
                  <span className="unit-icon">{getClassIcon(unit.unitClass)}</span>
                </div>
                <div className="unit-info">
                  <span className="unit-name">{unit.name}</span>
                  <div className="hp-bar-container">
                    <div
                      className="hp-bar-fill"
                      style={{
                        width: `${(unit.currentHp / unit.maxHp) * 100}%`,
                        backgroundColor:
                          unit.currentHp / unit.maxHp > 0.5
                            ? '#6bdb6b'
                            : unit.currentHp / unit.maxHp > 0.25
                            ? '#f5d782'
                            : '#ff6b6b',
                      }}
                    />
                  </div>
                </div>
                <div className="agility-badge">
                  <Zap size={12} />
                  <span>{unit.stats.agility}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BattleLog() {
  const battleLog = useBattleStore((state) => state.battleLog);
  const clearBattleLog = useBattleStore((state) => state.clearBattleLog);
  const exportBattleLog = useBattleStore((state) => state.exportBattleLog);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [battleLog]);

  const handleExport = () => {
    const content = exportBattleLog();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle_log_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (type: BattleLogEntry['type']) => {
    switch (type) {
      case 'move':
        return '🚶';
      case 'attack':
        return '⚔️';
      case 'damage':
        return '💥';
      case 'death':
        return '💀';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  const getLogColor = (type: BattleLogEntry['type']) => {
    switch (type) {
      case 'move':
        return '#5c9eff';
      case 'attack':
        return '#ff6b6b';
      case 'damage':
        return '#ffa500';
      case 'death':
        return '#9b59b6';
      case 'info':
        return '#a0e7a8';
      default:
        return '#888';
    }
  };

  return (
    <div className="battle-log-section">
      <div className="log-header">
        <h3 className="section-title">战斗日志</h3>
        <div className="log-actions">
          <Button
            type="text"
            size="small"
            icon={<Trash2 size={14} />}
            onClick={clearBattleLog}
            disabled={battleLog.length === 0}
          >
            清空
          </Button>
          <Button
            type="text"
            size="small"
            icon={<Download size={14} />}
            onClick={handleExport}
            disabled={battleLog.length === 0}
            className="export-btn"
          >
            导出
          </Button>
        </div>
      </div>

      <div className="battle-log-container" ref={logContainerRef}>
        {battleLog.length === 0 ? (
          <p className="empty-hint">暂无战斗记录</p>
        ) : (
          battleLog.map((entry, index) => (
            <div
              key={entry.id}
              className="log-entry"
              style={{
                '--log-color': getLogColor(entry.type),
                animationDelay: `${index * 50}ms`,
              } as React.CSSProperties}
            >
              <span className="log-icon">{getLogIcon(entry.type)}</span>
              <span className="log-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function InfoPanel() {
  const turn = useBattleStore((state) => state.turn);

  return (
    <div className="info-panel">
      <div className="panel-header">
        <h2>战斗信息</h2>
        {turn.phase !== 'idle' && (
          <div className="turn-badge">
            第 {turn.turnNumber} 回合
          </div>
        )}
      </div>

      <TurnOrderList />
      <BattleLog />
    </div>
  );
}
