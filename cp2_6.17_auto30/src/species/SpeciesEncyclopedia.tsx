import { SPECIES_PRESETS } from '../types';
import './SpeciesEncyclopedia.css';

export function SpeciesEncyclopedia() {
  return (
    <div className="species-page">
      <div className="species-header">
        <h1 className="species-title">📚 品种百科</h1>
        <p className="species-subtitle">了解常见多肉品种的养护要点</p>
      </div>

      <div className="species-grid">
        {SPECIES_PRESETS.map(species => (
          <div key={species.name} className="species-card">
            <div className="species-icon">🌵</div>
            <h3 className="species-name">{species.name}</h3>
            <div className="species-info">
              <div className="info-item">
                <span className="info-icon">💧</span>
                <span>浇水间隔：{species.wateringInterval} 天</span>
              </div>
              <div className="info-item">
                <span className="info-icon">☀️</span>
                <span>光照偏好：{species.lightPreference}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
