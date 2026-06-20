import { useState, useEffect } from 'react';
import { useGardenStore } from '../GardenStore';
import { PLANT_CONFIGS, getStageName, getCareAdvice, GrowthStage } from '../Plant';
import './PlantDetail.css';

const PlantDetail = () => {
  const selectedPlantId = useGardenStore((state) => state.selectedPlantId);
  const selectPlant = useGardenStore((state) => state.selectPlant);
  const plants = useGardenStore((state) => state.plants);
  const environment = useGardenStore((state) => state.environment);
  const removePlant = useGardenStore((state) => state.removePlant);
  const advanceTime = useGardenStore((state) => state.advanceTime);
  const updatePlantTag = useGardenStore((state) => state.updatePlantTag);

  const [timeHours, setTimeHours] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isEditingTag, setIsEditingTag] = useState(false);

  const plant = plants.find((p) => p.id === selectedPlantId);
  const config = plant ? PLANT_CONFIGS[plant.type] : null;
  const isOpen = !!selectedPlantId;

  useEffect(() => {
    if (plant && plant.tag) {
      setTagInput(plant.tag);
    } else {
      setTagInput('');
    }
  }, [plant?.id, plant?.tag]);

  const handleClose = () => {
    selectPlant(null);
  };

  const handleRemove = () => {
    if (plant && confirm(`确定要移除${config?.name}吗？`)) {
      removePlant(plant.id);
    }
  };

  const handleTimeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeHours(Number(e.target.value));
  };

  const handleTimeApply = () => {
    if (timeHours > 0) {
      advanceTime(timeHours);
      setTimeHours(0);
    }
  };

  const handleTagSubmit = () => {
    if (plant) {
      updatePlantTag(plant.id, tagInput.trim());
      setIsEditingTag(false);
    }
  };

  if (!plant || !config) {
    return <div className={`plant-detail-panel ${isOpen ? 'open' : ''}`} />;
  }

  const careAdvice = getCareAdvice(plant.type, environment.light, environment.water, environment.nutrients);

  const currentStageIndex = plant.stage;
  const totalStages = 4;
  const overallProgress = (currentStageIndex * 100 + plant.growthProgress) / totalStages;

  const nextStageProgress = plant.stage < GrowthStage.Flowering
    ? 100 - plant.growthProgress
    : 0;

  return (
    <div className={`plant-detail-panel ${isOpen ? 'open' : ''}`}>
      <div className="detail-content">
        <button className="close-btn" onClick={handleClose}>
          ✕
        </button>

        <div className="plant-header">
          <div className="plant-big-emoji">{config.stagesEmoji[plant.stage]}</div>
          <div className="plant-info">
            <h2 className="plant-name">{config.name}</h2>
            <p className="plant-desc">{config.description}</p>
          </div>
        </div>

        <div className="tag-section">
          <span className="section-label">标签</span>
          {isEditingTag ? (
            <div className="tag-edit">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onBlur={handleTagSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTagSubmit()}
                maxLength={20}
                className="tag-input-field"
                autoFocus
              />
              <button className="tag-save-btn" onClick={handleTagSubmit}>
                保存
              </button>
            </div>
          ) : (
            <button className="tag-edit-btn" onClick={() => setIsEditingTag(true)}>
              {plant.tag || '添加标签'} ✏️
            </button>
          )}
        </div>

        <div className="section">
          <span className="section-label">当前阶段</span>
          <div className="stage-display">
            <span className="stage-emoji">{config.stagesEmoji[plant.stage]}</span>
            <span className="stage-name">{getStageName(plant.stage)}</span>
          </div>
        </div>

        <div className="section">
          <span className="section-label">生长进度</span>
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${overallProgress}%`, transition: 'width 0.3s ease' }}
              />
            </div>
            <div className="stages-row">
              {config.stagesEmoji.map((emoji, i) => (
                <div
                  key={i}
                  className={`stage-dot ${i <= plant.stage ? 'active' : ''}`}
                  title={getStageName(i as GrowthStage)}
                >
                  {emoji}
                </div>
              ))}
            </div>
            {plant.stage < GrowthStage.Flowering && (
              <p className="next-stage-hint">
                距下一阶段还差 {nextStageProgress.toFixed(1)}%
              </p>
            )}
            {plant.stage >= GrowthStage.Flowering && (
              <p className="next-stage-hint flowering">🎉 已完全成熟！</p>
            )}
          </div>
        </div>

        <div className="section">
          <span className="section-label">养护建议</span>
          <div className="advice-list">
            {careAdvice.map((advice, index) => (
              <div key={index} className="advice-item">
                <span className="advice-icon">💡</span>
                <span className="advice-text">{advice}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <span className="section-label">时间沙漏 ⏳</span>
          <div className="time-hourglass-section">
            <div className="hourglass-container">
              <div className="hourglass">
                <div className="hourglass-top">
                  <div
                    className="sand-top"
                    style={{
                      height: `${100 - (timeHours / 72) * 100}%`,
                      transition: 'height 0.3s ease'
                    }}
                  />
                </div>
                <div className="hourglass-neck" />
                <div className="hourglass-bottom">
                  <div
                    className="sand-bottom"
                    style={{
                      height: `${(timeHours / 72) * 100}%`,
                      transition: 'height 0.3s ease'
                    }}
                  />
                </div>
              </div>
              <div className="hourglass-stream" style={{ opacity: timeHours > 0 ? 1 : 0 }} />
            </div>

            <div className="time-slider-container">
              <input
                type="range"
                min="0"
                max="72"
                value={timeHours}
                onChange={handleTimeSliderChange}
                className="time-slider"
              />
              <div className="time-labels">
                <span>0小时</span>
                <span className="time-value">{timeHours}小时</span>
                <span>72小时</span>
              </div>
            </div>

            <button
              className="apply-time-btn"
              onClick={handleTimeApply}
              disabled={timeHours === 0}
            >
              加速生长
            </button>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <span className="stat-icon">❤️</span>
            <span className="stat-label">健康度</span>
            <span className="stat-value">{Math.round(plant.health)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📅</span>
            <span className="stat-label">种植时长</span>
            <span className="stat-value">
              {Math.floor((Date.now() - plant.plantedAt) / 3600000)}小时
            </span>
          </div>
        </div>

        <button className="remove-btn" onClick={handleRemove}>
          🗑️ 移除植物
        </button>
      </div>
    </div>
  );
};

export default PlantDetail;
