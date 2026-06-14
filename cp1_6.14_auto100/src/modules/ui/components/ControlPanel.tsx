import { Slider, Button, Select } from 'antd';
import { Sword, Sparkles, Target, Trash2, Play, MapPin } from 'lucide-react';
import { useBattleStore } from '../../../store/battleStore';
import type { UnitClass } from '../../battle/types';
import { UNIT_CLASS_COLORS } from '../../battle/types';

const unitOptions = [
  { value: 'warrior', label: '战士', icon: Sword, color: '#ff6b6b' },
  { value: 'mage', label: '法师', icon: Sparkles, color: '#5c9eff' },
  { value: 'archer', label: '弓箭手', icon: Target, color: '#6bdb6b' },
];

export default function ControlPanel() {
  const units = useBattleStore((state) => state.units);
  const selectedUnitId = useBattleStore((state) => state.selectedUnitId);
  const updateUnitStats = useBattleStore((state) => state.updateUnitStats);
  const removeUnit = useBattleStore((state) => state.removeUnit);
  const startNewTurn = useBattleStore((state) => state.startNewTurn);
  const turn = useBattleStore((state) => state.turn);
  const placeMode = useBattleStore((state) => state.placeMode);
  const setPlaceMode = useBattleStore((state) => state.setPlaceMode);
  const initializeDemoUnits = useBattleStore((state) => state.initializeDemoUnits);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  const handlePlaceUnit = (unitClass: UnitClass) => {
    if (placeMode === unitClass) {
      setPlaceMode(null);
    } else {
      setPlaceMode(unitClass);
    }
  };

  const handleStatChange = (stat: 'strength' | 'agility' | 'intelligence', value: number) => {
    if (selectedUnitId) {
      updateUnitStats(selectedUnitId, { [stat]: value });
    }
  };

  const handleRemoveUnit = () => {
    if (selectedUnitId) {
      removeUnit(selectedUnitId);
    }
  };

  const handleStartBattle = () => {
    if (units.length >= 2) {
      startNewTurn();
    }
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h2>工具栏</h2>
      </div>

      <div className="panel-section">
        <h3 className="section-title">放置单位</h3>
        <p className="section-hint">选择职业后点击网格放置</p>
        <div className="unit-buttons">
          {unitOptions.map((option) => {
            const Icon = option.icon;
            const isActive = placeMode === option.value;
            return (
              <button
                key={option.value}
                className={`unit-button ${isActive ? 'active' : ''}`}
                style={{
                  '--unit-color': option.color,
                } as React.CSSProperties}
                onClick={() => handlePlaceUnit(option.value as UnitClass)}
              >
                <Icon size={20} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        {placeMode && (
          <p className="place-hint" style={{ color: UNIT_CLASS_COLORS[placeMode] }}>
            点击网格放置{unitOptions.find((o) => o.value === placeMode)?.label}
          </p>
        )}
      </div>

      <div className="panel-section">
        <h3 className="section-title">战斗控制</h3>
        <div className="battle-controls">
          <Button
            type="primary"
            icon={<Play size={16} />}
            onClick={handleStartBattle}
            disabled={units.length < 2 || turn.phase !== 'idle'}
            block
          >
            {turn.phase === 'idle' ? '开始战斗' : `第 ${turn.turnNumber} 回合`}
          </Button>
          <Button
            onClick={initializeDemoUnits}
            disabled={units.length > 0}
            block
          >
            加载示例单位
          </Button>
        </div>
      </div>

      {selectedUnit && (
        <div className="panel-section selected-unit-section">
          <div className="selected-unit-header">
            <div
              className="unit-color-dot"
              style={{ backgroundColor: UNIT_CLASS_COLORS[selectedUnit.unitClass] }}
            />
            <h3 className="section-title">{selectedUnit.name}</h3>
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
              onClick={handleRemoveUnit}
              size="small"
            />
          </div>

          <div className="stat-row">
            <div className="stat-label">
              <Sword size={16} />
              <span>力量</span>
            </div>
            <Slider
              min={1}
              max={10}
              value={selectedUnit.stats.strength}
              onChange={(value) => handleStatChange('strength', value)}
              tooltip={{ formatter: (value) => `${value}` }}
            />
            <span className="stat-value">{selectedUnit.stats.strength}</span>
          </div>

          <div className="stat-row">
            <div className="stat-label">
              <Target size={16} />
              <span>敏捷</span>
            </div>
            <Slider
              min={1}
              max={10}
              value={selectedUnit.stats.agility}
              onChange={(value) => handleStatChange('agility', value)}
              tooltip={{ formatter: (value) => `${value}` }}
            />
            <span className="stat-value">{selectedUnit.stats.agility}</span>
          </div>

          <div className="stat-row">
            <div className="stat-label">
              <Sparkles size={16} />
              <span>智力</span>
            </div>
            <Slider
              min={1}
              max={10}
              value={selectedUnit.stats.intelligence}
              onChange={(value) => handleStatChange('intelligence', value)}
              tooltip={{ formatter: (value) => `${value}` }}
            />
            <span className="stat-value">{selectedUnit.stats.intelligence}</span>
          </div>

          <div className="unit-info-grid">
            <div className="info-item">
              <span className="info-label">生命值</span>
              <span className="info-value">
                {selectedUnit.currentHp} / {selectedUnit.maxHp}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">移动范围</span>
              <span className="info-value">{selectedUnit.moveRange}</span>
            </div>
            <div className="info-item">
              <span className="info-label">攻击范围</span>
              <span className="info-value">{selectedUnit.attackRange}</span>
            </div>
          </div>
        </div>
      )}

      <div className="panel-section">
        <h3 className="section-title">地形说明</h3>
        <p className="section-hint">右键格子修改地形</p>
        <div className="terrain-legend">
          <div className="terrain-item">
            <div className="terrain-color grass" />
            <div>
              <span className="terrain-name">草地</span>
              <span className="terrain-desc">无特殊效果</span>
            </div>
          </div>
          <div className="terrain-item">
            <div className="terrain-color rock" />
            <div>
              <span className="terrain-name">岩石</span>
              <span className="terrain-desc">+20% 防御</span>
            </div>
          </div>
          <div className="terrain-item">
            <div className="terrain-color swamp" />
            <div>
              <span className="terrain-name">沼泽</span>
              <span className="terrain-desc">移动消耗翻倍</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
