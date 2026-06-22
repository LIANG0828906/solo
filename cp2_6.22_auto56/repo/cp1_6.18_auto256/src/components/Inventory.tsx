import { useGameStore } from '../gameStore';
import './Inventory.css';

export function Inventory() {
  const { player, pickingUpItem } = useGameStore();

  return (
    <div className="inventory-container">
      <div className="inventory-title">道具栏</div>
      <div className="inventory-grid">
        {player.inventory.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className={`inventory-slot ${pickingUpItem?.id === item.id ? 'picking' : ''}`}
            title={`${item.name}: ${item.description}`}
          >
            <span className="item-icon">{item.icon}</span>
          </div>
        ))}
        {player.inventory.length === 0 && (
          <div className="inventory-empty">暂无道具</div>
        )}
      </div>
      {pickingUpItem && (
        <div className="pickup-overlay">
          <div className="pickup-item">
            <div className="pickup-glow" />
            <span className="pickup-icon">{pickingUpItem.icon}</span>
          </div>
          <div className="pickup-name">{pickingUpItem.name}</div>
        </div>
      )}
    </div>
  );
}
