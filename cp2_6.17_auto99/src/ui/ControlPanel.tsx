import { useStore } from '../store';
import type { OscillatorType } from '../store';

const timbreOptions: { value: OscillatorType; label: string }[] = [
  { value: 'sine', label: 'Sine Wave' },
  { value: 'square', label: 'Square Wave' },
  { value: 'sawtooth', label: 'Sawtooth Wave' },
];

export function ControlPanel() {
  const { timbre, volume, bpm, reverbEnabled, setTimbre, setVolume, setBpm, toggleReverb } =
    useStore();

  return (
    <div className="control-panel">
      <div className="control-group">
        <label className="control-label">Timbre</label>
        <select
          className="timbre-select"
          value={timbre}
          onChange={(e) => setTimbre(e.target.value as OscillatorType)}
        >
          {timbreOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label className="control-label">Volume: {volume}%</label>
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label">BPM</label>
        <input
          type="number"
          className="bpm-input"
          min="30"
          max="300"
          step="5"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label">Reverb</label>
        <button
          className={`reverb-toggle ${reverbEnabled ? 'active' : ''}`}
          onClick={toggleReverb}
          aria-pressed={reverbEnabled}
        />
      </div>
    </div>
  );
}
