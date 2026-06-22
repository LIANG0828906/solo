import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  ORIGINS,
  ROAST_LEVELS,
  PourStage,
} from '../modules/brewing/BrewingService';
import {
  validateForm,
  recalcExtractionRate,
} from '../modules/brewing/BrewingController';

interface BrewFormProps {
  onSubmit: () => void;
}

const BrewForm: React.FC<BrewFormProps> = ({ onSubmit }) => {
  const { brewForm, setBrewForm, currentExtractionRate, setCurrentExtractionRate } = useAppStore();
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const rate = recalcExtractionRate(brewForm);
    setCurrentExtractionRate(rate);
  }, [brewForm, setCurrentExtractionRate]);

  const updateStage = (index: number, field: keyof PourStage, value: number) => {
    const newStages = brewForm.pourStages.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setBrewForm({ pourStages: newStages });
  };

  const addStage = () => {
    if (brewForm.pourStages.length >= 4) return;
    setBrewForm({ pourStages: [...brewForm.pourStages, { time: 30, water: 50 }] });
  };

  const removeStage = (index: number) => {
    if (brewForm.pourStages.length <= 1) return;
    const newStages = brewForm.pourStages.filter((_, i) => i !== index);
    setBrewForm({ pourStages: newStages });
  };

  const handleSubmit = () => {
    const formErrors = validateForm(brewForm);
    setErrors(formErrors);
    if (formErrors.length === 0) {
      onSubmit();
    }
  };

  const totalWater = brewForm.pourStages.reduce((s, p) => s + p.water, 0);
  const totalTime = brewForm.pourStages.reduce((s, p) => s + p.time, 0);

  return (
    <div className="brew-form">
      <div className="form-section">
        <label className="form-label">咖啡豆名称</label>
        <input
          type="text"
          className="form-input"
          value={brewForm.beanName}
          onChange={e => setBrewForm({ beanName: e.target.value.slice(0, 20) })}
          placeholder="例：耶加雪菲 G1"
          maxLength={20}
        />
        <span className="form-hint">{brewForm.beanName.length}/20</span>
      </div>

      <div className="form-section">
        <label className="form-label">产地</label>
        <select
          className="form-select"
          value={brewForm.origin}
          onChange={e => setBrewForm({ origin: e.target.value })}
        >
          <option value="">请选择产地</option>
          {ORIGINS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <label className="form-label">烘焙度</label>
        <div className="roast-btns">
          {ROAST_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              className={`roast-btn ${brewForm.roastLevel === level ? 'active' : ''}`}
              onClick={() => setBrewForm({ roastLevel: level as '浅' | '中' | '深' })}
            >
              {level}焙
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">
          研磨度 <span className="value-badge">{brewForm.grindSize}</span>
        </label>
        <div className="slider-wrap">
          <input
            type="range"
            className="slider"
            min={1}
            max={10}
            step={1}
            value={brewForm.grindSize}
            onChange={e => setBrewForm({ grindSize: parseInt(e.target.value) })}
          />
          <div className="slider-ticks">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <span key={n} className={`tick ${brewForm.grindSize === n ? 'active' : ''}`}>{n}</span>
            ))}
          </div>
          <div className="slider-labels">
            <span>细</span>
            <span>粗</span>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-section flex-1">
          <label className="form-label">水温 (°C)</label>
          <input
            type="number"
            className="form-input"
            min={80}
            max={100}
            step={0.5}
            value={brewForm.waterTemp}
            onChange={e => setBrewForm({ waterTemp: parseFloat(e.target.value) || 80 })}
          />
        </div>
        <div className="form-section flex-1">
          <label className="form-label">粉量 (g)</label>
          <input
            type="number"
            className="form-input"
            min={5}
            max={30}
            step={0.5}
            value={brewForm.powderWeight}
            onChange={e => setBrewForm({ powderWeight: parseFloat(e.target.value) || 15 })}
          />
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">粉水比</label>
        <div className="ratio-row">
          <select
            className="form-select ratio-select"
            value={brewForm.ratio}
            onChange={e => setBrewForm({ ratio: e.target.value })}
          >
            {['1:12', '1:13', '1:14', '1:15', '1:16', '1:17', '1:18'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <span className="ratio-info">
            推荐 {totalWater}g 水
          </span>
        </div>
      </div>

      <div className="form-section">
        <div className="stages-header">
          <label className="form-label">分段注水</label>
          <div className="stages-summary">
            <span>总{totalWater}g · {totalTime}s</span>
          </div>
        </div>
        <div className="stages-list">
          {brewForm.pourStages.map((stage, idx) => (
            <div key={idx} className="stage-item">
              <span className="stage-idx">{idx + 1}</span>
              <div className="stage-fields">
                <div className="stage-field">
                  <input
                    type="number"
                    value={stage.time}
                    min={5}
                    max={180}
                    onChange={e => updateStage(idx, 'time', parseInt(e.target.value) || 0)}
                  />
                  <span>秒</span>
                </div>
                <span className="stage-arrow">→</span>
                <div className="stage-field">
                  <input
                    type="number"
                    value={stage.water}
                    min={10}
                    max={500}
                    onChange={e => updateStage(idx, 'water', parseInt(e.target.value) || 0)}
                  />
                  <span>克</span>
                </div>
              </div>
              <button
                type="button"
                className="stage-remove"
                onClick={() => removeStage(idx)}
                disabled={brewForm.pourStages.length <= 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="add-stage-btn"
          onClick={addStage}
          disabled={brewForm.pourStages.length >= 4}
        >
          + 添加注水段 ({brewForm.pourStages.length}/4)
        </button>
      </div>

      <div className="extraction-preview">
        <div className="extraction-label">预估萃取率</div>
        <div className="extraction-value">{currentExtractionRate.toFixed(2)}%</div>
        <div className={`extraction-hint ${currentExtractionRate >= 18 && currentExtractionRate <= 22 ? 'good' : ''}`}>
          {currentExtractionRate < 18 ? '偏低' : currentExtractionRate > 22 ? '偏高' : '理想区间 18-22%'}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((e, i) => (
            <div key={i} className="error-item">• {e}</div>
          ))}
        </div>
      )}

      <button type="button" className="submit-btn" onClick={handleSubmit}>
        萃取完成
      </button>
    </div>
  );
};

export default BrewForm;
