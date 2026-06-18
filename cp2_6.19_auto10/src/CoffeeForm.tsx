import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CoffeeRecord, AROMA_OPTIONS, BREWING_METHODS } from './types';

interface CoffeeFormProps {
  onSubmit: (record: CoffeeRecord) => void;
  onCancel: () => void;
}

const CoffeeForm: React.FC<CoffeeFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [brewingMethod, setBrewingMethod] = useState(BREWING_METHODS[0]);
  const [aromas, setAromas] = useState<string[]>([]);
  const [acidity, setAcidity] = useState(3);
  const [body, setBody] = useState(3);
  const [aftertaste, setAftertaste] = useState(3);
  const [overall, setOverall] = useState(7);
  const [notes, setNotes] = useState('');

  const toggleAroma = (aroma: string) => {
    setAromas((prev) =>
      prev.includes(aroma) ? prev.filter((a) => a !== aroma) : [...prev, aroma]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roaster.trim()) {
      return;
    }
    const record: CoffeeRecord = {
      id: uuidv4(),
      name: name.trim(),
      roaster: roaster.trim(),
      brewingMethod,
      aromas,
      acidity,
      body,
      aftertaste,
      overall,
      notes: notes.trim(),
      date: new Date().toISOString(),
    };
    onSubmit(record);
  };

  return (
    <div className="form-container">
      <button className="back-btn" onClick={onCancel}>
        ← 返回列表
      </button>
      <div className="form-card">
        <h2 className="form-title">添加咖啡品鉴记录</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">咖啡名称 *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：耶加雪菲 水洗"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">烘焙商 *</label>
              <input
                type="text"
                className="form-input"
                value={roaster}
                onChange={(e) => setRoaster(e.target.value)}
                placeholder="如：某某咖啡工坊"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">冲泡方式</label>
            <select
              className="form-select"
              value={brewingMethod}
              onChange={(e) => setBrewingMethod(e.target.value)}
            >
              {BREWING_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">风味标签</label>
            <div className="aroma-options">
              {AROMA_OPTIONS.map((aroma) => (
                <div
                  key={aroma}
                  className={`aroma-option ${aromas.includes(aroma) ? 'selected' : ''}`}
                  onClick={() => toggleAroma(aroma)}
                >
                  {aroma}
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">酸度 (1-5)</label>
              <div className="rating-slider-group">
                <input
                  type="range"
                  className="rating-slider"
                  min={1}
                  max={5}
                  step={1}
                  value={acidity}
                  onChange={(e) => setAcidity(Number(e.target.value))}
                />
                <span className="rating-value">{acidity}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">醇厚度 (1-5)</label>
              <div className="rating-slider-group">
                <input
                  type="range"
                  className="rating-slider"
                  min={1}
                  max={5}
                  step={1}
                  value={body}
                  onChange={(e) => setBody(Number(e.target.value))}
                />
                <span className="rating-value">{body}</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">余韵 (1-5)</label>
              <div className="rating-slider-group">
                <input
                  type="range"
                  className="rating-slider"
                  min={1}
                  max={5}
                  step={1}
                  value={aftertaste}
                  onChange={(e) => setAftertaste(Number(e.target.value))}
                />
                <span className="rating-value">{aftertaste}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">整体评分 (1-10)</label>
              <div className="rating-slider-group">
                <input
                  type="range"
                  className="rating-slider"
                  min={1}
                  max={10}
                  step={1}
                  value={overall}
                  onChange={(e) => setOverall(Number(e.target.value))}
                />
                <span className="rating-value">{overall}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">品鉴笔记</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录本次冲泡的详细感受、水温、粉水比、特殊发现等..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoffeeForm;
