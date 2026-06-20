import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PetEgg, HatchProgress, HatchResult, WorkerMessage } from '../types';
import { elementColors, elementLabels } from '../data/eggs';
import HatchCanvas from './HatchCanvas';
import PetCard from './PetCard';
import './HatchController.css';

interface HatchControllerProps {
  selectedEgg: PetEgg | null;
  onHatchComplete: (result: HatchResult) => void;
}

const HatchController: React.FC<HatchControllerProps> = ({ selectedEgg, onHatchComplete }) => {
  const [temperature, setTemperature] = useState(30);
  const [humidity, setHumidity] = useState(50);
  const [isHatching, setIsHatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hatchedPet, setHatchedPet] = useState<HatchResult['pet'] | null>(null);
  const [tempAnimating, setTempAnimating] = useState(false);
  const [humAnimating, setHumAnimating] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const tempTimeoutRef = useRef<number | null>(null);
  const humTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/hatchWorker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const message = e.data as WorkerMessage;
      if (message.type === 'progress') {
        setProgress((message.data as HatchProgress).progress);
      } else if (message.type === 'complete') {
        const result = message.data as HatchResult;
        setIsComplete(true);
        setSuccess(result.success);
        setHatchedPet(result.pet || null);
        setIsHatching(false);
        onHatchComplete(result);
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [onHatchComplete]);

  const handleTemperatureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTemperature(value);
    setTempAnimating(true);
    if (tempTimeoutRef.current) {
      clearTimeout(tempTimeoutRef.current);
    }
    tempTimeoutRef.current = window.setTimeout(() => setTempAnimating(false), 300);
  }, []);

  const handleHumidityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setHumidity(value);
    setHumAnimating(true);
    if (humTimeoutRef.current) {
      clearTimeout(humTimeoutRef.current);
    }
    humTimeoutRef.current = window.setTimeout(() => setHumAnimating(false), 300);
  }, []);

  const startHatching = useCallback(() => {
    if (!selectedEgg || isHatching) return;

    setIsHatching(true);
    setProgress(0);
    setIsComplete(false);
    setSuccess(false);
    setHatchedPet(null);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'start',
        params: {
          eggId: selectedEgg.id,
          element: selectedEgg.element,
          rarity: selectedEgg.rarity,
          temperature,
          humidity,
        },
      } as WorkerMessage);
    }
  }, [selectedEgg, isHatching, temperature, humidity]);

  const resetHatch = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' } as WorkerMessage);
    }
    setIsHatching(false);
    setProgress(0);
    setIsComplete(false);
    setSuccess(false);
    setHatchedPet(null);
  }, []);

  const getTip = () => {
    if (!selectedEgg) return '';

    const element = selectedEgg.element;
    let tip = '';

    if (element === 'fire') {
      if (temperature < 30) tip = '温度偏低，调高温度可能提高孵化成功率';
      else if (temperature > 38) tip = '温度过高，适当降温有助于孵化';
      else if (humidity > 50) tip = '湿度偏高，降低湿度更适合火属性宠物';
      else tip = '保持温度稳定可提高孵化成功率';
    } else if (element === 'water') {
      if (temperature > 30) tip = '温度偏高，降低温度更适合水属性宠物';
      else if (humidity < 60) tip = '湿度偏低，提高湿度可能提高孵化成功率';
      else tip = '保持湿度稳定有助于孵化';
    } else {
      if (temperature < 25) tip = '温度偏低，适当提高温度';
      else if (temperature > 35) tip = '温度偏高，适当降低温度';
      else if (humidity < 50) tip = '湿度偏低，草属性宠物喜欢湿润环境';
      else tip = '温湿度适宜，保持稳定有助于孵化';
    }

    return tip;
  };

  if (!selectedEgg) {
    return (
      <div className="hatch-controller empty">
        <div className="empty-state">
          <p>请从左侧选择一个宠物蛋</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hatch-controller">
      <div className="hatch-main">
        <div className="selected-egg-info">
          <h2 className="egg-title" style={{ color: elementColors[selectedEgg.element].from }}>
            {selectedEgg.name}
          </h2>
          <div className="egg-meta">
            <span className="element-badge" style={{ background: elementColors[selectedEgg.element].from }}>
              {elementLabels[selectedEgg.element]}属性
            </span>
            <span className="rarity-stars">
              {Array.from({ length: selectedEgg.rarity }, (_, i) => (
                <span key={i}>★</span>
              ))}
            </span>
          </div>
        </div>

        <div className="hatch-display">
          {isComplete && success && hatchedPet ? (
            <PetCard pet={hatchedPet} />
          ) : (
            <HatchCanvas
              element={selectedEgg.element}
              progress={progress}
              isHatching={isHatching}
              isComplete={isComplete}
              success={success}
              petName={hatchedPet?.name}
            />
          )}
        </div>

        {isHatching && (
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${elementColors[selectedEgg.element].from}, ${elementColors[selectedEgg.element].to})`,
                }}
              />
            </div>
            <div className="progress-text">{Math.floor(progress)}%</div>
          </div>
        )}

        {!isHatching && !isComplete && (
          <button className="start-btn" onClick={startHatching}>
            开始孵化
          </button>
        )}

        {isComplete && (
          <button className="reset-btn" onClick={resetHatch}>
            重新孵化
          </button>
        )}
      </div>

      <div className="control-panel">
        <h3 className="panel-title">孵化条件</h3>

        <div className="slider-group">
          <div className="slider-label">
            <span>温度</span>
            <span className={`value ${tempAnimating ? 'bounce' : ''}`}>{temperature}°C</span>
          </div>
          <input
            type="range"
            min="20"
            max="40"
            value={temperature}
            onChange={handleTemperatureChange}
            disabled={isHatching}
            className="slider temp-slider"
          />
          <div className="slider-range">
            <span>20°C</span>
            <span>40°C</span>
          </div>
        </div>

        <div className="slider-group">
          <div className="slider-label">
            <span>湿度</span>
            <span className={`value ${humAnimating ? 'bounce' : ''}`}>{humidity}%</span>
          </div>
          <input
            type="range"
            min="30"
            max="80"
            value={humidity}
            onChange={handleHumidityChange}
            disabled={isHatching}
            className="slider hum-slider"
          />
          <div className="slider-range">
            <span>30%</span>
            <span>80%</span>
          </div>
        </div>

        <div className="tip-box">
          <div className="tip-icon">💡</div>
          <p className="tip-text">{getTip()}</p>
        </div>
      </div>
    </div>
  );
};

export default HatchController;
