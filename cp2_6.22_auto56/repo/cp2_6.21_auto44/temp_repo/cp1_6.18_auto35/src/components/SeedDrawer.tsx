import { useGardenStore } from '../store/gardenStore';
import { getPlantSpeciesList, PLANT_SPECIES } from '../api/weatherApi';
import type { PlantSpecies } from '../types';
import './SeedDrawer.css';

const SeedDrawer = () => {
  const isOpen = useGardenStore((s) => s.isDrawerOpen);
  const toggleDrawer = useGardenStore((s) => s.toggleDrawer);
  const setDrawerOpen = useGardenStore((s) => s.setDrawerOpen);
  const selectedSeed = useGardenStore((s) => s.selectedSeed);
  const setSelectedSeed = useGardenStore((s) => s.setSelectedSeed);

  const speciesList = getPlantSpeciesList();

  const handleSelectSeed = (species: PlantSpecies) => {
    if (selectedSeed === species) {
      setSelectedSeed(null);
    } else {
      setSelectedSeed(species);
    }
  };

  const renderPlantPreview = (species: PlantSpecies, color: string) => {
    return (
      <svg width="50" height="60" viewBox="0 0 50 60">
        <rect x="23" y="25" width="4" height="30" rx="2" fill="#4CAF50" />
        <path d="M25 40 Q12 36 10 26 Q18 29 25 36" fill="#6BCB77" />
        <path d="M25 32 Q38 28 40 18 Q32 21 25 28" fill="#6BCB77" />
        <g>
          <circle cx="25" cy="18" r="5" fill={color} />
          <ellipse cx="25" cy="8" rx="4" ry="7" fill={color} opacity="0.9" />
          <ellipse cx="35" cy="15" rx="4" ry="7" fill={color} opacity="0.9" transform="rotate(72 25 18)" />
          <ellipse cx="32" cy="26" rx="4" ry="7" fill={color} opacity="0.9" transform="rotate(144 25 18)" />
          <ellipse cx="18" cy="26" rx="4" ry="7" fill={color} opacity="0.9" transform="rotate(216 25 18)" />
          <ellipse cx="15" cy="15" rx="4" ry="7" fill={color} opacity="0.9" transform="rotate(288 25 18)" />
          <circle cx="25" cy="18" r="3" fill="#FFE66D" />
        </g>
      </svg>
    );
  };

  return (
    <>
      <div 
        className={`drawer-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleDrawer}
        title={isOpen ? '收起种子面板' : '展开种子面板'}
      >
        <span className="toggle-icon">🌱</span>
        {!isOpen && <span className="toggle-label">种子</span>}
      </div>

      <div className={`seed-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">
            <span className="title-icon">🌱</span>
            <span>选择种子</span>
          </div>
          <button 
            className="drawer-close"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="drawer-handle" onClick={toggleDrawer} />

        <div className="species-list">
          {speciesList.map((species) => (
            <div
              key={species.id}
              className={`species-card ${selectedSeed === species.id ? 'selected' : ''}`}
              onClick={() => handleSelectSeed(species.id)}
            >
              <div className="species-preview">
                {renderPlantPreview(species.id, species.color)}
              </div>
              <div className="species-info">
                <div className="species-name">{species.name}</div>
                <div className="species-desc">{species.description}</div>
                <div className="species-stats">
                  <div className="stat-item">
                    <span className="stat-label">生长</span>
                    <div className="stat-bar-mini">
                      <div 
                        className="stat-fill-mini" 
                        style={{ width: `${species.baseGrowthRate * 80}%` }}
                      />
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">需水</span>
                    <div className="stat-bar-mini">
                      <div 
                        className="stat-fill-mini water" 
                        style={{ width: `${species.waterNeed * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {selectedSeed === species.id && (
                <div className="selected-badge">✓ 已选</div>
              )}
            </div>
          ))}
        </div>

        {selectedSeed && (
          <div className="selection-hint">
            <span>💡 已选择 {PLANT_SPECIES[selectedSeed].name}，点击花园空位种植</span>
          </div>
        )}
      </div>
    </>
  );
};

export default SeedDrawer;
