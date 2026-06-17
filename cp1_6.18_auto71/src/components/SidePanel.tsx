import React from 'react';
import { useGameStore } from '../store/gameStore';
import { ANIMATION } from '../constants';

export const SidePanel: React.FC = () => {
  const { logs, panelCollapsed, togglePanel, focusCapsule, capsules } = useGameStore();

  const handleItemClick = (capsuleId: string) => {
    focusCapsule(capsuleId);
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    const appEl = document.querySelector('.app-container');
    const canvasWrap = document.querySelector('.canvas-wrapper') as HTMLElement | null;
    if (!appEl || !canvasWrap) return;
    const rect = canvasWrap.getBoundingClientRect();
    const appRect = appEl.getBoundingClientRect();
    const targetLeft = appRect.left + rect.left + capsule.position.x;
    const targetTop = appRect.top + rect.top + capsule.position.y;
    const existing = document.querySelector('.focus-indicator') as HTMLElement | null;
    if (existing) existing.remove();
    const indicator = document.createElement('div');
    indicator.className = 'focus-indicator';
    indicator.style.left = `${targetLeft}px`;
    indicator.style.top = `${targetTop}px`;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 1100);
    const startScrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const startScrollTop = window.scrollY || document.documentElement.scrollTop;
    const desiredX = Math.max(0, targetLeft - window.innerWidth / 2);
    const desiredY = Math.max(0, targetTop - window.innerHeight / 2);
    const dx = desiredX - startScrollLeft;
    const dy = desiredY - startScrollTop;
    const startTime = performance.now();
    const duration = ANIMATION.scrollDuration;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOut(t);
      window.scrollTo(startScrollLeft + dx * eased, startScrollTop + dy * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <div className="side-panel">
      <div className={`side-panel-content ${panelCollapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          <span>时光日志</span>
          <span style={{ fontSize: 11, color: '#6C6C8A', fontWeight: 400 }}>
            {logs.length}/5
          </span>
        </div>
        <div className="panel-list">
          {logs.length === 0 ? (
            <div className="panel-empty">
              暂无已开启的胶囊
              <br />
              去沙滩上挖挖看吧～
            </div>
          ) : (
            logs.map(entry => (
              <div
                key={entry.id}
                className="panel-item"
                onClick={() => handleItemClick(entry.capsuleId)}
                title={entry.summary}
              >
                <span className="panel-item-emoji">{entry.summary.slice(0, 2)}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.summary.slice(2).trim()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      <button className="panel-toggle" onClick={togglePanel} title={panelCollapsed ? '展开日志' : '收起日志'}>
        {panelCollapsed ? '◀' : '▶'}
      </button>
    </div>
  );
};
