import { useGameStore, type UnitType } from '../store/gameStore';
import { getUnitTypeName, COLORS } from '../core/hexGrid';

const unitTypes: { type: UnitType; color: string; desc: string }[] = [
  { type: 'assault', color: COLORS.unitAssault, desc: '近战高伤害' },
  { type: 'sniper', color: COLORS.unitSniper, desc: '远程高精度' },
  { type: 'medic', color: COLORS.unitMedic, desc: '治疗支援' }
];

export default function ControlPanel() {
  const {
    currentTurn,
    selectedUnitType,
    selectedUnitId,
    units,
    deploymentCount,
    maxDeployments,
    maxUnits,
    deployedThisTurn,
    isAnimating,
    selectUnitType,
    selectUnit,
    nextTurn,
    resetGame
  } = useGameStore();

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const canDeploy = deploymentCount < maxDeployments && units.length < maxUnits;
  const allUnitsActed = units.length > 0 && units.every(u => u.hasActed);

  const getDeployedCountByType = (type: UnitType) => {
    return units.filter(u => u.type === type).length;
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h1 className="title">战术指挥官</h1>
        <div className="turn-indicator">
          <span className="turn-label">回合</span>
          <span className="turn-number">{currentTurn}</span>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">单位部署</h2>
        <div className="deploy-info">
          <span>已部署: {units.length}/{maxUnits}</span>
          <span>总部署次数: {deploymentCount}/{maxDeployments}</span>
        </div>
        
        <div className="unit-list">
          {unitTypes.map(({ type, color, desc }) => {
            const isSelected = selectedUnitType === type;
            const isDisabled = !canDeploy || deployedThisTurn.has(type);
            const count = getDeployedCountByType(type);
            const alreadyDeployed = deployedThisTurn.has(type);

            return (
              <button
                key={type}
                className={`unit-btn ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && selectUnitType(isSelected ? null : type)}
                disabled={isDisabled}
                style={{ '--unit-color': color } as React.CSSProperties}
              >
                <div className="unit-icon" style={{ backgroundColor: color }}>
                  {type === 'assault' ? '突' : type === 'sniper' ? '狙' : '医'}
                </div>
                <div className="unit-info">
                  <div className="unit-name">{getUnitTypeName(type)}</div>
                  <div className="unit-desc">{desc}</div>
                </div>
                <div className="unit-count">
                  {count}/{maxUnits}
                  {alreadyDeployed && <span className="badge">本回合已部署</span>}
                </div>
              </button>
            );
          })}
        </div>

        {selectedUnitType && (
          <div className="hint">
            点击地图空白网格部署 {getUnitTypeName(selectedUnitType)}
          </div>
        )}
      </div>

      <div className="section">
        <h2 className="section-title">单位信息</h2>
        {selectedUnit ? (
          <div className="selected-unit">
            <div 
              className="selected-unit-icon" 
              style={{ backgroundColor: getUnitColor(selectedUnit.type, selectedUnit.hasActed) }}
            >
              {selectedUnit.type === 'assault' ? '突' : selectedUnit.type === 'sniper' ? '狙' : '医'}
            </div>
            <div className="selected-unit-info">
              <div className="selected-unit-name">{getUnitTypeName(selectedUnit.type)}</div>
              <div className="selected-unit-status">
                状态: {selectedUnit.hasActed ? (
                  <span className="status-inactive">已行动</span>
                ) : (
                  <span className="status-active">待命</span>
                )}
              </div>
              <div className="selected-unit-pos">
                位置: ({selectedUnit.q}, {selectedUnit.r})
              </div>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            {units.length > 0 ? '点击单位选中并查看移动范围' : '请先部署单位'}
          </div>
        )}
      </div>

      <div className="section">
        <h2 className="section-title">操作</h2>
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={nextTurn}
            disabled={isAnimating || units.length === 0}
          >
            结束回合
          </button>
          <button
            className="action-btn secondary"
            onClick={() => {
              selectUnit(null);
              selectUnitType(null);
            }}
            disabled={isAnimating || (!selectedUnitId && !selectedUnitType)}
          >
            取消选择
          </button>
          <button
            className="action-btn danger"
            onClick={resetGame}
            disabled={isAnimating}
          >
            重置游戏
          </button>
        </div>
      </div>

      {allUnitsActed && !isAnimating && (
        <div className="turn-hint">
          所有单位已行动完毕，请点击「结束回合」
        </div>
      )}

      <div className="legend">
        <h3 className="legend-title">图例</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: COLORS.highlight, opacity: 0.3 }}></div>
            <span>可达区域</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: COLORS.unitInactive }}></div>
            <span>已行动单位</span>
          </div>
          <div className="legend-item">
            <div className="legend-border" style={{ borderColor: COLORS.unitBorder }}></div>
            <span>选中单位</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getUnitColor(type: UnitType, hasActed: boolean): string {
  if (hasActed) return COLORS.unitInactive;
  switch (type) {
    case 'assault': return COLORS.unitAssault;
    case 'sniper': return COLORS.unitSniper;
    case 'medic': return COLORS.unitMedic;
  }
}
