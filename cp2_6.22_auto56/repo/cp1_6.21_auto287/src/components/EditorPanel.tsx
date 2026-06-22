import { memo } from 'react';
import { PoemLine, FONT_OPTIONS } from '../types';
import './EditorPanel.css';

interface EditorPanelProps {
  poemLines: PoemLine[];
  fontFamily: string;
  onTextChange: (text: string) => void;
  onFontChange: (font: string) => void;
}

const EditorPanel = memo(function EditorPanel({
  poemLines,
  fontFamily,
  onTextChange,
  onFontChange,
}: EditorPanelProps) {
  const textValue = poemLines.map(line => line.text).join('\n');

  return (
    <div className="editor-panel">
      <div className="panel-section">
        <label className="panel-label">诗句内容</label>
        <textarea
          className="poem-textarea"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="在此输入诗句，每行一句..."
          rows={10}
        />
      </div>

      <div className="panel-section">
        <label className="panel-label">字体选择</label>
        <div className="font-selector">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              className={`font-option ${fontFamily === font.value ? 'active' : ''}`}
              onClick={() => onFontChange(font.value)}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-tip">
        <p>提示：每行诗句可在右侧画布上拖动调整位置</p>
      </div>
    </div>
  );
});

export default EditorPanel;
