import { useState, useRef, useEffect } from 'react';
import { EMOTION_COLORS, getEmotionName, analyzeSentiment, generateId, Diary } from './utils';

interface DiaryEditorProps {
  initialDate?: string;
  initialDiary?: Diary;
  onSave: (diary: Diary) => void;
  onCancel: () => void;
}

export default function DiaryEditor({
  initialDate,
  initialDiary,
  onSave,
  onCancel,
}: DiaryEditorProps) {
  const [selectedColor, setSelectedColor] = useState<string>(
    initialDiary?.emotionColor || EMOTION_COLORS[11].hex
  );
  const [title, setTitle] = useState<string>(initialDiary?.title || '');
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!initialDiary);

  useEffect(() => {
    if (initialDiary && editorRef.current) {
      editorRef.current.innerHTML = initialDiary.content;
      setIsEmpty(false);
    }
  }, [initialDiary]);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      setIsEmpty(editorRef.current.innerHTML === '' || editorRef.current.innerHTML === '<br>');
    }
  };

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || '';
    const plainText = content.replace(/<[^>]*>/g, '');
    if (!title.trim() || !plainText.trim()) {
      return;
    }

    const date = initialDiary?.date || initialDate || new Date().toISOString().split('T')[0];
    const sentiment = analyzeSentiment(plainText);

    const diary: Diary = {
      id: initialDiary?.id || generateId(),
      date,
      title: title.trim(),
      content,
      emotionColor: selectedColor,
      sentiment,
    };

    onSave(diary);
  };

  const ringSize = 160;
  const swatchSize = 28;
  const radius = (ringSize - swatchSize) / 2;

  const hasSelection = initialDiary || !isEmpty;

  return (
    <div className="editor-view">
      <div className="editor-toolbar">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('bold')}
          title="加粗"
        >
          B
        </button>
        <button
          className="toolbar-btn italic"
          onClick={() => handleFormat('italic')}
          title="斜体"
        >
          I
        </button>
      </div>

      <input
        type="text"
        placeholder="今天的标题..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{
          padding: '16px 32px 0',
          fontSize: '20px',
          fontWeight: 600,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
        }}
      />

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
      />

      <div className="editor-footer">
        <div className="color-picker-section">
          <div className="color-ring-wrapper">
            <div className={`color-ring ${hasSelection ? 'shrunk' : ''}`}>
              {EMOTION_COLORS.map((color, index) => {
                const angle = (index / EMOTION_COLORS.length) * 2 * Math.PI - Math.PI / 2;
                const x = 50 + (radius / ringSize) * 100 * Math.cos(angle);
                const y = 50 + (radius / ringSize) * 100 * Math.sin(angle);
                return (
                  <div
                    key={color.hex}
                    className={`color-swatch ${selectedColor === color.hex ? 'selected' : ''}`}
                    style={{
                      backgroundColor: color.hex,
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    onClick={() => setSelectedColor(color.hex)}
                    title={color.name}
                  />
                );
              })}
            </div>
          </div>

          <div className="color-preview">
            <div
              className="color-preview-box"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="color-preview-name">
              {getEmotionName(selectedColor)}
            </span>
            <span className="color-preview-hex">{selectedColor}</span>
          </div>
        </div>

        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!title.trim() || isEmpty}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
