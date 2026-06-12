import { Plant } from '../types';

interface Props {
  plant: Plant;
  onOrder: () => void;
  showAdminBadge?: boolean;
}

export default function PlantCard({ plant, onOrder, showAdminBadge }: Props) {
  const isLowStock = plant.stock < 3;
  const isOutOfStock = plant.stock <= 0;

  const gradient = getPlantGradient(plant.name);

  return (
    <div className={`plant-card card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      {showAdminBadge && isLowStock && (
        <span className="card-badge stock-low">
          <span className="stock-dot red"></span>
          低库存
        </span>
      )}
      {isLowStock && !showAdminBadge && (
        <span className="card-badge-corner stock-dot red" title="库存紧张"></span>
      )}

      <div className="plant-image" style={{ background: gradient }}>
        {plant.image ? (
          <img src={plant.image} alt={plant.name} />
        ) : (
          <div className="plant-placeholder">
            <span className="leaf-icon">🌿</span>
          </div>
        )}
      </div>

      <div className="plant-info">
        <div className="plant-header">
          <h3 className="plant-name">{plant.name}</h3>
          <span className={`stock-badge ${isLowStock ? 'low' : ''}`}>
            库存: {plant.stock}
          </span>
        </div>
        <p className="plant-desc">{plant.description}</p>
        <div className="plant-footer">
          <div className="plant-price">
            <span className="price-currency">¥</span>
            <span className="price-value">{plant.price_monthly}</span>
            <span className="price-unit">/月</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={onOrder}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? '已租完' : '立即租赁'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getPlantGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)',
    'linear-gradient(135deg, #A5D6A7 0%, #66BB6A 50%, #43A047 100%)',
    'linear-gradient(135deg, #C5E1A5 0%, #8BC34A 50%, #7CB342 100%)',
    'linear-gradient(135deg, #C8E6C9 0%, #81C784 50%, #66BB6A 100%)',
    'linear-gradient(135deg, #DCEDC8 0%, #AED581 50%, #9CCC65 100%)',
    'linear-gradient(135deg, #B9F6CA 0%, #69F0AE 50%, #00E676 100%)',
    'linear-gradient(135deg, #B2DFDB 0%, #4DB6AC 50%, #26A69A 100%)',
    'linear-gradient(135deg, #D1C4E9 0%, #9575CD 50%, #7E57C2 100%)',
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
}
