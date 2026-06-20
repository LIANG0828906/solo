import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import type { BattleLog, Team } from '@/modules/battle-engine';

const ITEM_HEIGHT = 32;
const VISIBLE_COUNT = 15;

function getTeamFromLog(log: BattleLog): Team | null {
  if (log.unitId === 'system') return null;
  const unit = useGameStore.getState().units.find((u) => u.id === log.unitId);
  return unit?.team ?? null;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export default function SimControl() {
  const {
    isSimulating,
    isPaused,
    battleResult,
    currentTurn,
    battleLogs,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stepSimulation,
    resetSimulation,
    executeTurn,
    exportLogs,
    clearLogs,
  } = useGameStore();

  const [scrollTop, setScrollTop] = useState(0);
  const logListRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoScrollRef = useRef(true);

  const handleStart = useCallback(() => {
    if (!isSimulating) {
      startSimulation();
    } else if (isPaused) {
      resumeSimulation();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      executeTurn();
    }, 1000);
  }, [isSimulating, isPaused, startSimulation, resumeSimulation, executeTurn]);

  const handlePause = useCallback(() => {
    pauseSimulation();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [pauseSimulation]);

  const handleStep = useCallback(() => {
    if (!isSimulating) {
      startSimulation();
      setTimeout(() => stepSimulation(), 0);
    } else {
      stepSimulation();
    }
  }, [isSimulating, startSimulation, stepSimulation]);

  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    resetSimulation();
  }, [resetSimulation]);

  useEffect(() => {
    if (isSimulating && !isPaused && !timerRef.current) {
      timerRef.current = setInterval(() => {
        executeTurn();
      }, 1000);
    }
  }, [isSimulating, isPaused, executeTurn]);

  useEffect(() => {
    if (battleResult && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [battleResult]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoScrollRef.current && logListRef.current) {
      logListRef.current.scrollTop = logListRef.current.scrollHeight;
    }
  }, [battleLogs.length]);

  const handleScroll = useCallback(() => {
    if (!logListRef.current) return;
    const el = logListRef.current;
    autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < ITEM_HEIGHT * 2;
    setScrollTop(el.scrollTop);
  }, []);

  const useVirtual = battleLogs.length > 50;

  const virtualItems = useMemo(() => {
    if (!useVirtual) return battleLogs;
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, battleLogs.length);
    return battleLogs.slice(startIndex, endIndex);
  }, [useVirtual, battleLogs, scrollTop]);

  const virtualOffset = useVirtual ? Math.floor(scrollTop / ITEM_HEIGHT) : 0;
  const virtualTotalHeight = battleLogs.length * ITEM_HEIGHT;
  const virtualTopPad = virtualOffset * ITEM_HEIGHT;

  const handleExport = useCallback(() => {
    const json = exportLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportLogs]);

  const handleClear = useCallback(() => {
    clearLogs();
  }, [clearLogs]);

  const canStart = !isSimulating || isPaused;
  const canPause = isSimulating && !isPaused;
  const canStep = !isSimulating || isPaused;
  const canReset = isSimulating || battleResult !== null;

  return (
    <div className="sim-control">
      <div className="sim-btn-group">
        <button
          className="sim-btn"
          onClick={handleStart}
          disabled={!canStart || !!battleResult}
        >
          {isSimulating && isPaused ? '继续' : '启动'}
        </button>
        <button
          className="sim-btn"
          onClick={handlePause}
          disabled={!canPause}
        >
          暂停
        </button>
        <button
          className="sim-btn"
          onClick={handleStep}
          disabled={!canStep || !!battleResult}
        >
          单步执行
        </button>
        <button
          className="sim-btn"
          onClick={handleReset}
          disabled={!canReset}
        >
          重置
        </button>
      </div>

      <div className="turn-info">
        <span>回合: {currentTurn}</span>
        {battleResult && (
          <span style={{ marginLeft: 12, color: battleResult === 'red' ? '#ff7875' : '#69c0ff' }}>
            {battleResult === 'red' ? '红方胜利' : '蓝方胜利'}
          </span>
        )}
      </div>

      <div className="battle-log-panel">
        <div className="battle-log-header">
          <span>战斗日志</span>
          <div>
            <button className="sim-btn" onClick={handleExport} disabled={battleLogs.length === 0}>
              导出
            </button>
            <button className="sim-btn" onClick={handleClear} disabled={battleLogs.length === 0}>
              清空
            </button>
          </div>
        </div>

        <div
          className="log-list"
          ref={logListRef}
          onScroll={useVirtual ? handleScroll : undefined}
          style={useVirtual ? { position: 'relative', overflowY: 'auto' } : undefined}
        >
          {useVirtual ? (
            <div style={{ height: virtualTotalHeight, position: 'relative' }}>
              <div style={{ position: 'absolute', top: virtualTopPad, left: 0, right: 0 }}>
                {virtualItems.map((log, i) => {
                  const team = getTeamFromLog(log);
                  const idx = virtualOffset + i;
                  return (
                    <div key={log.id} className="log-item" style={{ height: ITEM_HEIGHT }}>
                      <span className="log-turn">{idx + 1}</span>
                      <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                      <span
                        className="log-text"
                        style={{ color: team === 'red' ? '#ff7875' : team === 'blue' ? '#69c0ff' : undefined }}
                      >
                        {log.unitName}: {log.action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            battleLogs.map((log, i) => {
              const team = getTeamFromLog(log);
              return (
                <div key={log.id} className="log-item">
                  <span className="log-turn">{i + 1}</span>
                  <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                  <span
                    className="log-text"
                    style={{ color: team === 'red' ? '#ff7875' : team === 'blue' ? '#69c0ff' : undefined }}
                  >
                    {log.unitName}: {log.action}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
