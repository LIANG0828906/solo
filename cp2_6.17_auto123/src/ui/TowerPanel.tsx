import { useGameStore } from '../store/store';
import { TOWER_DEFS, getTowerStats, getUpgradeCost, getSellValue } from '../engine/gameEngine';
import type { TowerType } from '../types';

const towerTypes: TowerType[] = ['arrow', 'fire'];

export function TowerPanel() {
  const selectedTowerType = useGameStore((state) => state.selectedTowerType);
  const selectTowerType = useGameStore((state) => state.selectTowerType);
  const gold = useGameStore((state) => state.gold);
  const upgradePanel = useGameStore((state) => state.upgradePanel);
  const towers = useGameStore((state) => state.towers);
  const upgradeTower = useGameStore((state) => state.upgradeTower);
  const sellTower = useGameStore((state) => state.sellTower);
  const hideUpgradePanel = useGameStore((state) => state.hideUpgradePanel);

  const selectedTower = upgradePanel.towerId
    ? towers.find((t) => t.id === upgradePanel.towerId)
    : null;

  return (
    <>
      <div
        style={{
          height: 80,
          backgroundColor: '#1A1A10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 24px',
          borderTop: '2px solid #3A3A2A',
        }}
      >
        {towerTypes.map((type) => {
          const def = TOWER_DEFS[type];
          const isSelected = selectedTowerType === type;
          const canAfford = gold >= def.cost;

          return (
            <div
              key={type}
              onClick={() => {
                if (canAfford) {
                  selectTowerType(isSelected ? null : type);
                  hideUpgradePanel();
                }
              }}
              style={{
                width: 64,
                height: 64,
                backgroundColor: '#3A3A2A',
                border: `2px solid ${isSelected ? '#FFD700' : '#6B8E23'}`,
                borderRadius: 4,
                cursor: canAfford ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                fontFamily: 'monospace',
                boxShadow: isSelected ? '0 0 8px #FFD700' : 'none',
                transition: 'transform 0.1s, box-shadow 0.1s, border-color 0.1s',
                opacity: canAfford ? 1 : 0.5,
                position: 'relative',
              }}
              onMouseDown={(e) => {
                if (canAfford) {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.95)';
                }
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: def.color,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
              <span style={{ color: '#C0C0C0', fontSize: 10 }}>{def.name}</span>
              <span style={{ color: '#FFD700', fontSize: 10 }}>{def.cost}金</span>
            </div>
          );
        })}
      </div>

      {upgradePanel.visible && selectedTower && (
        <UpgradePanelOverlay
          tower={selectedTower}
          gold={gold}
          screenX={upgradePanel.screenX}
          screenY={upgradePanel.screenY}
          onUpgrade={() => upgradeTower(selectedTower.id)}
          onSell={() => sellTower(selectedTower.id)}
          onClose={hideUpgradePanel}
        />
      )}
    </>
  );
}

interface UpgradePanelOverlayProps {
  tower: { id: string; type: TowerType; level: number };
  gold: number;
  screenX: number;
  screenY: number;
  onUpgrade: () => void;
  onSell: () => void;
  onClose: () => void;
}

function UpgradePanelOverlay({
  tower,
  gold,
  screenX,
  screenY,
  onUpgrade,
  onSell,
  onClose,
}: UpgradePanelOverlayProps) {
  const def = TOWER_DEFS[tower.type];
  const currentStats = getTowerStats(tower.type, tower.level);
  const nextStats = tower.level < 3 ? getTowerStats(tower.type, tower.level + 1) : null;
  const upgradeCost = tower.level < 3 ? getUpgradeCost(tower.type, tower.level) : 0;
  const sellValue = getSellValue(tower.type, tower.level);
  const canUpgrade = tower.level < 3 && gold >= upgradeCost;

  const panelWidth = 160;
  const panelHeight = 200;
  let left = screenX + 20;
  let top = screenY - panelHeight / 2;

  if (left + panelWidth > window.innerWidth) {
    left = screenX - panelWidth - 20;
  }
  if (top < 10) top = 10;
  if (top + panelHeight > window.innerHeight - 100) {
    top = window.innerHeight - panelHeight - 100;
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
        }}
      />
      <div
        style={{
          position: 'fixed',
          left,
          top,
          width: panelWidth,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 8,
          padding: 12,
          fontFamily: 'monospace',
          color: '#C0C0C0',
          fontSize: 12,
          zIndex: 100,
          border: '1px solid #3A3A2A',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: def.color,
              borderRadius: 2,
            }}
          />
          <span style={{ color: '#FFD700', fontSize: 14 }}>
            {def.name} Lv.{tower.level}
          </span>
        </div>

        <div style={{ borderTop: '1px solid #3A3A2A', paddingTop: 6 }}>
          <div>伤害: {currentStats.damage.toFixed(0)}</div>
          <div>射程: {currentStats.range.toFixed(1)}</div>
          <div>攻速: {currentStats.attackInterval.toFixed(2)}s</div>
          {currentStats.burnDamage && (
            <div>燃烧: {currentStats.burnDamage.toFixed(0)}/s x{currentStats.burnDuration}s</div>
          )}
        </div>

        {nextStats && (
          <div style={{ borderTop: '1px solid #3A3A2A', paddingTop: 6, color: '#6B8E23' }}>
            <div style={{ color: '#FFD700' }}>下一级:</div>
            <div>伤害: {nextStats.damage.toFixed(0)}</div>
            <div>射程: {nextStats.range.toFixed(1)}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <button
            onClick={onUpgrade}
            disabled={!canUpgrade}
            style={{
              flex: 1,
              height: 28,
              backgroundColor: canUpgrade ? '#6B8E23' : '#4A4A3A',
              color: '#FFFFFF',
              fontSize: 12,
              fontFamily: 'monospace',
              border: 'none',
              borderRadius: 4,
              cursor: canUpgrade ? 'pointer' : 'not-allowed',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => {
              if (canUpgrade) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            {tower.level >= 3 ? '满级' : `升级 ${upgradeCost}金`}
          </button>
          <button
            onClick={onSell}
            style={{
              width: 60,
              height: 28,
              backgroundColor: '#B22222',
              color: '#FFFFFF',
              fontSize: 12,
              fontFamily: 'monospace',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            售卖 {sellValue}
          </button>
        </div>
      </div>
    </>
  );
}
