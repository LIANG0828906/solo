import React, { useState, useEffect } from 'react';
import { Skull, Heart, Shield, Footprints, Sword, Zap, Brain, Plus, Minus, Trash2 } from 'lucide-react';
import { useGameStore } from './store';
import { THEME, ANIMATION_DURATION } from './config';

const UnitPanel: React.FC = () => {
  const { units, selectedUnitId, updateUnit, removeUnit, addLog, currentRound } = useGameStore();
  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  const [displayHp, setDisplayHp] = useState(selectedUnit?.hp ?? 0);
  const [hpAnimating, setHpAnimating] = useState(false);

  useEffect(() => {
    if (selectedUnit) {
      if (displayHp !== selectedUnit.hp) {
        setHpAnimating(true);
        const startHp = displayHp;
        const endHp = selectedUnit.hp;
        const startTime = performance.now();
        const duration = ANIMATION_DURATION;

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 2);
          const currentHp = Math.round(startHp + (endHp - startHp) * eased);
          setDisplayHp(currentHp);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setHpAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      }
    }
  }, [selectedUnit?.hp]);

  useEffect(() => {
    if (selectedUnit) {
      setDisplayHp(selectedUnit.hp);
    }
  }, [selectedUnit?.id]);

  const handleHpChange = (delta: number) => {
    if (!selectedUnit) return;
    const newHp = Math.max(0, Math.min(selectedUnit.maxHp, selectedUnit.hp + delta));
    const isDead = newHp <= 0;

    updateUnit(selectedUnit.id, { hp: newHp, isDead });

    if (delta !== 0) {
      addLog({
        round: currentRound,
        source: '系统',
        target: selectedUnit.name,
        skill: delta > 0 ? '治疗' : '伤害',
        value: Math.abs(delta),
        type: delta > 0 ? 'heal' : 'attack',
      });
    }
  };

  if (!selectedUnit) {
    return (
      <div className="unit-panel h-full flex flex-col">
        <div className="panel-header">
          <h3 className="panel-title">单位详情</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-textMuted">
          <div className="text-center">
            <div className="text-4xl mb-3">👆</div>
            <p>选择一个单位查看详情</p>
            <p className="text-sm mt-2 opacity-70">点击地图上的棋子</p>
          </div>
        </div>
      </div>
    );
  }

  const hpPercent = (displayHp / selectedUnit.maxHp) * 100;
  const hpColor = hpPercent > 50 ? '#4CAF50' : hpPercent > 25 ? '#FF9800' : '#f44336';

  return (
    <div className={`unit-panel h-full flex flex-col ${selectedUnit.isDead ? 'unit-dead' : ''}`}>
      <div className="panel-header">
        <h3 className="panel-title">单位详情</h3>
        {selectedUnit.isDead && (
          <span className="dead-badge">
            <Skull size={14} />
            已阵亡
          </span>
        )}
      </div>

      <div className="panel-content flex-1 overflow-y-auto">
        <div className="unit-header mb-4">
          <div className="flex items-center gap-3">
            <div className={`unit-avatar ${selectedUnit.type} ${selectedUnit.isDead ? 'dead' : ''}`}>
              {selectedUnit.isDead ? (
                <Skull size={24} className="text-gray-400" />
              ) : selectedUnit.type === 'player' ? (
                <div className="text-blue-300 font-bold text-lg">英</div>
              ) : (
                <div className="text-red-300 font-bold text-lg">敌</div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="unit-name">{selectedUnit.name}</h4>
              <p className="unit-race">
                {selectedUnit.race} · Lv.{selectedUnit.level}
              </p>
            </div>
          </div>
        </div>

        <div className="hp-section mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1 hp-label">
              <Heart size={14} />
              <span>生命值</span>
            </div>
            <span className={`hp-value ${hpAnimating ? 'animating' : ''}`}>
              {displayHp} / {selectedUnit.maxHp}
            </span>
          </div>
          <div className="hp-bar-container">
            <div
              className="hp-bar-fill"
              style={{
                width: `${hpPercent}%`,
                backgroundColor: hpColor,
                transition: `width ${ANIMATION_DURATION}ms ease-out, background-color ${ANIMATION_DURATION}ms ease`,
              }}
            />
          </div>

          {!selectedUnit.isDead && (
            <div className="hp-controls mt-2">
              <button
                className="hp-btn minus"
                onClick={() => handleHpChange(-5)}
              >
                <Minus size={14} />
                5
              </button>
              <button
                className="hp-btn minus"
                onClick={() => handleHpChange(-1)}
              >
                <Minus size={12} />
                1
              </button>
              <button
                className="hp-btn plus"
                onClick={() => handleHpChange(1)}
              >
                <Plus size={12} />
                1
              </button>
              <button
                className="hp-btn plus"
                onClick={() => handleHpChange(5)}
              >
                <Plus size={14} />
                5
              </button>
            </div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">
              <Shield size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">护甲</span>
              <span className="stat-value">{selectedUnit.armor}</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <Footprints size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">移动力</span>
              <span className="stat-value">{selectedUnit.movement}</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <Sword size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">力量</span>
              <span className="stat-value">{selectedUnit.strength}</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <Zap size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">敏捷</span>
              <span className="stat-value">{selectedUnit.agility}</span>
            </div>
          </div>

          <div className="stat-item col-span-2">
            <div className="stat-icon">
              <Brain size={16} />
            </div>
            <div className="stat-info">
              <span className="stat-label">智力</span>
              <span className="stat-value">{selectedUnit.intelligence}</span>
            </div>
          </div>
        </div>

        <div className="position-info mt-4 p-2 rounded">
          <span className="text-textMuted text-sm">位置: </span>
          <span className="text-accent text-sm">
            ({selectedUnit.position.q}, {selectedUnit.position.r})
          </span>
        </div>
      </div>

      <div className="panel-footer">
        <button
          className="delete-btn"
          onClick={() => removeUnit(selectedUnit.id)}
        >
          <Trash2 size={16} />
          移除单位
        </button>
      </div>
    </div>
  );
};

export default UnitPanel;
