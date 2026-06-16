import { usePoemStore, ThemeType } from '../store/poemStore';
import { poems } from '../data/poems';
import './ControlPanel.css';

const ControlPanel = () => {
  const { 
    currentPoemIndex, 
    theme, 
    speed, 
    setCurrentPoemIndex, 
    setTheme, 
    setSpeed, 
    reset 
  } = usePoemStore();

  const handlePoemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value, 10);
    setCurrentPoemIndex(index);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as ThemeType);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseInt(e.target.value, 10));
  };

  const handleReset = () => {
    reset();
  };

  const themeOptions: { value: ThemeType; label: string }[] = [
    { value: 'standard', label: '标准打字机' },
    { value: 'vintage', label: '复古诗意' },
    { value: 'modern', label: '现代优雅' },
  ];

  return (
    <div className="control-panel">
      <div className="control-group">
        <label className="control-label">选择诗作</label>
        <select 
          className="control-select" 
          value={currentPoemIndex} 
          onChange={handlePoemChange}
        >
          {poems.map((poem, index) => (
            <option key={poem.id} value={index}>
              {poem.poet} - {poem.title}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label className="control-label">字体主题</label>
        <select 
          className="control-select" 
          value={theme} 
          onChange={handleThemeChange}
        >
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group speed-group">
        <label className="control-label">
          播放速度 <span className="speed-value">{speed}ms</span>
        </label>
        <input
          type="range"
          min="100"
          max="600"
          value={speed}
          onChange={handleSpeedChange}
          className="speed-slider"
        />
      </div>

      <div className="control-group reset-group">
        <label className="control-label">&nbsp;</label>
        <button 
          className="reset-button"
          onClick={handleReset}
          aria-label="重置"
        >
          ↻
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
