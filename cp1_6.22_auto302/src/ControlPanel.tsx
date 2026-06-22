import { useState } from 'react';
import { WaveType, ParticleConfig } from './types';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  onConfigChange: (config: ParticleConfig) => void;
  initialConfig: ParticleConfig;
}

const waveOptions: { type: WaveType; label: string }[] = [
  { type: WaveType.SINE, label: '正弦 Sine' },
  { type: WaveType.SQUARE, label: '方波 Square' },
  { type: WaveType.TRIANGLE, label: '三角 Triangle' },
  { type: WaveType.SAWTOOTH, label: '锯齿 Sawtooth' },
];

export function ControlPanel({ onConfigChange, initialConfig }: ControlPanelProps) {
  const [waveType, setWaveType] = useState<WaveType>(initialConfig.waveType);
  const [frequency, setFrequency] = useState<number>(initialConfig.frequency);
  const [amplitude, setAmplitude] = useState<number>(initialConfig.amplitude);

  const handleWaveChange = (type: WaveType) => {
    setWaveType(type);
    onConfigChange({ frequency, amplitude, waveType: type });
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setFrequency(value);
    onConfigChange({ frequency: value, amplitude, waveType });
  };

  const handleAmplitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAmplitude(value);
    onConfigChange({ frequency, amplitude: value, waveType });
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>声波参数控制</h2>

      <div className={styles.section}>
        <label className={styles.label}>波形选择</label>
        <div className={styles.waveButtons}>
          {waveOptions.map((option) => (
            <button
              key={option.type}
              className={`${styles.waveButton} ${waveType === option.type ? styles.active : ''}`}
              onClick={() => handleWaveChange(option.type)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>频率 Frequency</label>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="10"
            max="440"
            step="1"
            value={frequency}
            onChange={handleFrequencyChange}
            className={styles.slider}
          />
          <div className={styles.valueDisplay}>
            <span>10 Hz</span>
            <span className={styles.currentValue}>{frequency} Hz</span>
            <span>440 Hz</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>振幅 Amplitude</label>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={amplitude}
            onChange={handleAmplitudeChange}
            className={styles.slider}
          />
          <div className={styles.valueDisplay}>
            <span>0.1</span>
            <span className={styles.currentValue}>{amplitude.toFixed(1)}</span>
            <span>2.0</span>
          </div>
        </div>
      </div>

      <div className={styles.info}>
        <p className={styles.infoText}>💡 拖拽旋转视角</p>
        <p className={styles.infoText}>🔍 滚轮缩放观察</p>
        <p className={styles.infoText}>✨ 2000 粒子实时渲染</p>
      </div>
    </div>
  );
}
