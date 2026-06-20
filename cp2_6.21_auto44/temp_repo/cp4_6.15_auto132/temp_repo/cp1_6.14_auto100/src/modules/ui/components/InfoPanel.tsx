import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from 'antd';
import { Download, Trash2, Clock, Zap, FileText } from 'lucide-react';
import { useBattleStore } from '../../../store/battleStore';
import { UNIT_CLASS_COLORS } from '../../battle/types';
import type { Unit, BattleLogEntry } from '../../battle/types';

function TurnOrderList() {
  const units = useBattleStore((state) => state.units);
  const turn = useBattleStore((state) => state.turn);
  const selectedUnitId = useBattleStore((state) => state.selectedUnitId);
  const setSelectedUnit = useBattleStore((state) => state.setSelectedUnit);
  const selectCurrentUnit = useBattleStore((state) => state.selectCurrentUnit);

  const orderedUnits = useMemo(() => {
    return turn.turnOrder
      .map((id) => units.find((u) => u.id === id))
      .filter((u): u is Unit => u !== undefined);
  }, [turn.turnOrder, units]);

  const positionsMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedUnits.forEach((u, index) => map.set(u.id, index));
    return map;
  }, [orderedUnits]);

  const handleUnitClick = (unit: Unit) => {
    if (turn.phase === 'selecting' && unit.id === turn.turnOrder[turn.currentUnitIndex]) {
      selectCurrentUnit();
      return;
    }
    setSelectedUnit(unit.id);
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
        <div className="turn-order-container" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div className="turn-order-list-inner" style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', height: '100%', overflowY: 'auto' }}>
            {orderedUnits.map((unit) => {
              const index = positionsMap.get(unit.id) ?? 0;
              const isCurrent = index === turn.currentUnitIndex && unit.currentHp > 0;
              const isSelected = unit.id === selectedUnitId;
              const isDead = unit.currentHp <= 0;
              const hasActed = unit.hasActed && index < turn.currentUnitIndex;

              return (
                <div
                  key={unit.id}
                  className={`turn-order-item ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''} ${isDead ? 'dead' : ''} ${hasActed ? 'acted' : ''}`}
                  style={{
                    '--unit-color': UNIT_CLASS_COLORS[unit.unitClass],
                    '--order-index': index,
                    transform: 'translateY(0)',
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    order: index,
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
                          transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [battleLog]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const content = exportBattleLog();
      if (!content.trim()) {
        setIsExporting(false);
        return;
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `battle_log_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setIsExporting(false);
      }, 400);
    }, 300);
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
        <h3 className="section-title">
          <FileText size={16} />
          <span>战斗日志</span>
        </h3>
        <div className="log-actions">
          <Button
            type="text"
            size="small"
            icon={<Trash2 size={14} />}
            onClick={clearBattleLog}
            disabled={battleLog.length === 0 || isExporting}
          >
            清空
          </Button>
          <div className="export-wrapper" style={{ position: 'relative' }}>
            <Button
              type="text"
              size="small"
              icon={<Download size={14} />}
              onClick={handleExport}
              disabled={battleLog.length === 0 || isExporting}
              className={`export-btn ${isExporting ? 'exporting' : ''}`}
            >
              导出
            </Button>
            {isExporting && (
              <div
                className="paper-sheet"
                style={{
                  position: 'absolute',
                  right: '100%',
                  top: '50%',
                  transform: 'translateY(-50%) translateX(100%)',
                  width: '120px',
                  height: '150px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '4px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3), 0 2px 5px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  opacity: 0,
                  animation: 'paperSlideOut 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  pointerEvents: 'none',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '20px',
                    background: 'linear-gradient(90deg, #a0e7a8, #f5d782)',
                    opacity: 0.8,
                  }}
                />
                <div style={{ padding: '28px 10px 10px' }}>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: '3px',
                        background: 'rgba(0,0,0,0.08)',
                        marginBottom: '6px',
                        borderRadius: '2px',
                        width: `${60 + Math.random() * 40}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
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
                animationDelay: `${index * 30}ms`,
              } as React.CSSProperties}
            >
              <span className="log-icon">{getLogIcon(entry.type)}</span>
              <span className="log-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes paperSlideOut {
          0% {
            opacity: 0;
            transform: translateY(-50%) translateX(100%) rotate(5deg) scale(0.5);
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: translateY(-50%) translateX(-20px) rotate(-2deg) scale(1.05);
          }
          70% {
            transform: translateY(-50%) translateX(-30px) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%) translateX(-50px) rotate(-5deg) scale(0.9);
          }
        }

        .export-btn.exporting {
          color: #a0e7a8 !important;
        }
      `}</style>
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
