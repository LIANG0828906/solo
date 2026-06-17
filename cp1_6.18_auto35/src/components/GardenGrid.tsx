import { useGardenStore } from '../store/gardenStore';
import PlantCard from './PlantCard';
import './GardenGrid.css';

const GardenGrid = () => {
  const plants = useGardenStore((s) => s.plants);
  const selectedSeed = useGardenStore((s) => s.selectedSeed);
  const plantSeed = useGardenStore((s) => s.plantSeed);
  const particles = useGardenStore((s) => s.particles);

  const handleCellClick = (index: number) => {
    if (!plants[index] && selectedSeed) {
      plantSeed(index);
    }
  };

  return (
    <div className="garden-wrapper">
      <div className="garden-grid">
        {plants.map((plant, index) => (
          <div
            key={index}
            className={`grid-cell ${!plant && selectedSeed ? 'plantable' : ''} ${plant ? 'occupied' : ''}`}
            onClick={() => handleCellClick(index)}
          >
            {plant ? (
              <PlantCard plant={plant} position={index} />
            ) : selectedSeed ? (
              <div className="empty-cell-hint">
                <span className="plus-icon">+</span>
                <span className="hint-text">点击种植</span>
              </div>
            ) : (
              <div className="empty-cell" />
            )}
          </div>
        ))}
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.life,
              transform: `translate(${p.x}px, ${p.y}px)`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GardenGrid;
