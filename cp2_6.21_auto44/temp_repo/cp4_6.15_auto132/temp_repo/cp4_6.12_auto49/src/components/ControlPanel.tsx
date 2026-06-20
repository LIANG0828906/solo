import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { IconItem, PatternType, ThemeType, ThemeConfig } from '../types';

interface ControlPanelProps {
  iconList: IconItem[];
  pattern: PatternType;
  theme: ThemeType;
  density: number;
  iconSize: number;
  onIconsChange: (icons: IconItem[]) => void;
  onPatternChange: (pattern: PatternType) => void;
  onThemeChange: (theme: ThemeType) => void;
  onDensityChange: (density: number) => void;
  onSizeChange: (size: number) => void;
  onExport: () => void;
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const themeConfigs: Record<ThemeType, ThemeConfig> = {
  warm: {
    background: '#FFF8E7',
    primaryColors: ['#FF6B35', '#FF8C42'],
    accentColor: '#FF6B35'
  },
  cool: {
    background: '#1A1A2E',
    primaryColors: ['#00D2FF', '#7B2FFF'],
    accentColor: '#00D2FF'
  },
  neon: {
    background: '#0D0D0D',
    primaryColors: ['#FF007F', '#00FF41'],
    accentColor: '#FF007F'
  }
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  iconList,
  pattern,
  theme,
  density,
  iconSize,
  onIconsChange,
  onPatternChange,
  onThemeChange,
  onDensityChange,
  onSizeChange,
  onExport,
  isMobile,
  isOpen,
  onToggle
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiInputRef = useRef<HTMLInputElement>(null);

  const currentTheme = themeConfigs[theme];

  const handleFiles = useCallback((files: FileList) => {
    if (iconList.length >= 20) {
      alert('最多只能添加20个图标');
      return;
    }

    const newIcons: IconItem[] = [];
    const remainingSlots = 20 - iconList.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type === 'image/png' || file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const icon: IconItem = {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            type: 'image',
            content: e.target?.result as string
          };
          onIconsChange([...iconList, ...newIcons, icon]);
        };
        reader.readAsDataURL(file);
      }
    });
  }, [iconList, onIconsChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleEmojiSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const emoji = emojiInputRef.current?.value.trim();
    if (!emoji) return;
    if (iconList.length >= 20) {
      alert('最多只能添加20个图标');
      return;
    }

    const emojiRegex = /^[\p{Emoji}\s]+$/u;
    if (!emojiRegex.test(emoji)) {
      alert('请输入有效的emoji');
      return;
    }

    const newIcon: IconItem = {
      id: `${Date.now()}-${Math.random()}`,
      name: 'emoji',
      type: 'emoji',
      content: emoji
    };
    onIconsChange([...iconList, newIcon]);
    if (emojiInputRef.current) {
      emojiInputRef.current.value = '';
    }
  }, [iconList, onIconsChange]);

  const handleRemoveIcon = useCallback((id: string) => {
    onIconsChange(iconList.filter(icon => icon.id !== id));
  }, [iconList, onIconsChange]);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  }, [handleFiles]);

  const panelContent = (
    <div className="control-panel-content">
      <h2 className="panel-title">控制面板</h2>

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFileClick}
      >
        <p>拖放图标到此</p>
        <p className="upload-hint">或点击选择文件（支持PNG/SVG）</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.svg"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <form onSubmit={handleEmojiSubmit} className="emoji-input-form">
        <input
          ref={emojiInputRef}
          type="text"
          placeholder="输入emoji后按回车添加"
          className="emoji-input"
        />
        <button type="submit" className="add-btn">添加</button>
      </form>

      <div className="icon-list">
        {iconList.map((icon, index) => (
          <div key={icon.id} className="icon-thumbnail">
            {icon.type === 'emoji' ? (
              <span className="emoji-preview">{icon.content}</span>
            ) : (
              <img src={icon.content} alt={icon.name} className="image-preview" />
            )}
            <span className="icon-index">#{index + 1}</span>
            <button
              className="remove-btn"
              onClick={() => handleRemoveIcon(icon.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="control-group">
        <label>排列模式</label>
        <div className="pattern-selector glass">
          {(['wave', 'spiral', 'random'] as PatternType[]).map((p) => (
            <button
              key={p}
              className={`pattern-btn ${pattern === p ? 'active' : ''}`}
              onClick={() => onPatternChange(p)}
            >
              {p === 'wave' ? '波浪' : p === 'spiral' ? '螺旋' : '随机'}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>颜色主题</label>
        <select
          className="theme-select glass"
          value={theme}
          onChange={(e) => onThemeChange(e.target.value as ThemeType)}
        >
          <option value="warm">晨曦暖色</option>
          <option value="cool">深夜冷色</option>
          <option value="neon">霓虹撞色</option>
        </select>
      </div>

      <div className="control-group">
        <label>排列密度: {density}px</label>
        <input
          type="range"
          min="50"
          max="200"
          value={density}
          onChange={(e) => onDensityChange(Number(e.target.value))}
          className="custom-slider"
          style={{
            '--slider-accent': currentTheme.accentColor
          } as React.CSSProperties}
        />
      </div>

      <div className="control-group">
        <label>图标大小: {iconSize}px</label>
        <input
          type="range"
          min="40"
          max="120"
          value={iconSize}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="custom-slider"
          style={{
            '--slider-accent': currentTheme.accentColor
          } as React.CSSProperties}
        />
      </div>

      <button className="export-btn" onClick={onExport}>
        导出PNG壁纸
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button className="mobile-toggle" onClick={onToggle}>
          ⚙️
        </button>
        {isOpen && <div className="mobile-overlay" onClick={onToggle} />}
        <div className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
          {panelContent}
        </div>
        <style>{getMobileStyles(currentTheme)}</style>
      </>
    );
  }

  return (
    <aside className="control-panel">
      {panelContent}
      <style>{getStyles(currentTheme)}</style>
    </aside>
  );
};

function getStyles(theme: ThemeConfig) {
  return `
    .control-panel {
      width: 300px;
      background: rgba(30, 30, 30, 0.85);
      padding: 20px;
      color: white;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      max-height: 100vh;
      box-sizing: border-box;
    }

    .panel-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .upload-zone {
      border: 2px dashed #666;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .upload-zone:hover {
      border-color: ${theme.accentColor};
    }

    .upload-zone.dragging {
      border: 2px solid #4CAF50;
      background: rgba(76, 175, 80, 0.1);
    }

    .upload-zone p {
      margin: 4px 0;
    }

    .upload-hint {
      font-size: 12px;
      color: #999;
    }

    .emoji-input-form {
      display: flex;
      gap: 8px;
    }

    .emoji-input {
      flex: 1;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #555;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 14px;
    }

    .emoji-input::placeholder {
      color: #888;
    }

    .add-btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      background: ${theme.accentColor};
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .add-btn:hover {
      opacity: 0.8;
    }

    .icon-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-height: 120px;
      overflow-y: auto;
      padding: 8px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
    }

    .icon-thumbnail {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #888;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
    }

    .emoji-preview {
      font-size: 20px;
    }

    .image-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .icon-index {
      position: absolute;
      bottom: -2px;
      right: -2px;
      background: ${theme.accentColor};
      color: white;
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 4px;
    }

    .remove-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: none;
      background: #ff4444;
      color: white;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .control-group label {
      font-size: 14px;
      color: #ddd;
    }

    .pattern-selector {
      display: flex;
      gap: 4px;
      border-radius: 8px;
      padding: 4px;
    }

    .pattern-btn {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
    }

    .pattern-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .pattern-btn.active {
      background: ${theme.accentColor};
    }

    .theme-select {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #555;
      color: white;
      cursor: pointer;
      font-size: 14px;
    }

    .theme-select option {
      background: #333;
      color: white;
    }

    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .custom-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 8px;
      border-radius: 4px;
      background: #444;
      outline: none;
      cursor: pointer;
    }

    .custom-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--slider-accent);
      cursor: pointer;
      box-shadow: 0 0 10px var(--slider-accent);
      transition: box-shadow 0.2s;
    }

    .custom-slider::-webkit-slider-thumb:hover {
      box-shadow: 0 0 20px var(--slider-accent);
    }

    .custom-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--slider-accent);
      cursor: pointer;
      border: none;
      box-shadow: 0 0 10px var(--slider-accent);
    }

    .export-btn {
      margin-top: auto;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, ${theme.primaryColors[0]}, ${theme.primaryColors[1]});
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }
  `;
}

function getMobileStyles(theme: ThemeConfig) {
  return `
    ${getStyles(theme)}
    
    .mobile-toggle {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1001;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: rgba(30, 30, 30, 0.9);
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    .mobile-drawer {
      position: fixed;
      top: 0;
      right: -300px;
      width: 300px;
      height: 100vh;
      background: rgba(30, 30, 30, 0.95);
      z-index: 1000;
      transition: right 0.3s ease-out;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }

    .mobile-drawer.open {
      right: 0;
    }

    .control-panel-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }
  `;
}

export default ControlPanel;
