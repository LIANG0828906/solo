import { useGardenStore } from '../GardenStore';
import { PlantType, PLANT_CONFIGS } from '../Plant';
import './SeedSelector.css';

const SeedSelector = () => {
  const seedPanelOpen = useGardenStore((state) => state.seedPanelOpen);
  const selectedSeed = useGardenStore((state) => state.selectedSeed);
  const toggleSeedPanel = useGardenStore((state) => state.toggleSeedPanel);
  const selectSeed = useGardenStore((state) => state.selectSeed);

  const plantTypes: PlantType[] = [
    'sunflower',
    'lavender',
    'cactus',
    'fern',
    'rose',
    'tomato',
    'mint',
    'succulent'
  ];

  const handleSeedClick = (type: PlantType) => {
    if (selectedSeed === type) {
      selectSeed(null);
    } else {
      selectSeed(type);
    }
  };

  return (
    <div className={`seed-selector ${seedPanelOpen ? 'open' : ''}`}>
      <button className="seed-toggle-btn" onClick={toggleSeedPanel}>
        <span className="seed-bag-icon">🌱</span>
        <span className="seed-toggle-text">种子包</span>
        <span className={`seed-toggle-arrow ${seedPanelOpen ? 'up' : ''}`}>▼</span>
      </button>

      <div className="seed-panel">
        <h3 className="seed-panel-title">选择种子</h3>
        <div className="seed-grid">
          {plantTypes.map((type) => {
            const config = PLANT_CONFIGS[type];
            const isSelected = selectedSeed === type;

            return (
              <button
                key={type}
                className={`seed-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSeedClick(type)}
              >
                <div className="seed-thumbnail">
                  <span className="seed-emoji">{config.stagesEmoji[3]}</span>
                </div>
                <div className="seed-name">{config.name}</div>
                <div className="seed-requirements">
                  <div className="req-item" title={`光照需求: ${config.optimalLight}%`}>
                    <span>☀️</span>
                    <div className="req-bar">
                      <div
                        className="req-fill light"
                        style={{ width: `${config.optimalLight}%` }}
                      />
                    </div>
                  </div>
                  <div className="req-item" title={`水分需求: ${config.optimalWater}%`}>
                    <span>💧</span>
                    <div className="req-bar">
                      <div
                        className="req-fill water"
                        style={{ width: `${config.optimalWater}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {selectedSeed && (
          <div className="selected-hint">
            已选择 {PLANT_CONFIGS[selectedSeed].name}，点击花圃空格种植
          </div>
        )}
      </div>
    </div>
  );
};

export default SeedSelector;
