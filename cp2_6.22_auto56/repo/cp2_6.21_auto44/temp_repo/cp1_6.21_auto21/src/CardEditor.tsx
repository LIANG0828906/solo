import React from 'react';
import { templates } from './templates';

interface CardEditorProps {
  title: string;
  body: string;
  templateId: string;
  showGrid: boolean;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onTemplateChange: (templateId: string) => void;
  onShowGridChange: (show: boolean) => void;
  onResetLayout: () => void;
}

const CardEditor: React.FC<CardEditorProps> = ({
  title,
  body,
  templateId,
  showGrid,
  onTitleChange,
  onBodyChange,
  onTemplateChange,
  onShowGridChange,
  onResetLayout,
}) => {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 80);
    onTitleChange(value);
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 500);
    onBodyChange(value);
  };

  return (
    <aside className="editor-panel">
      <div className="editor-section">
        <label className="editor-label">标题</label>
        <input
          type="text"
          className="editor-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="输入标题（最多80字）"
          maxLength={80}
        />
        <div className={`char-count ${title.length >= 70 ? 'warning' : ''}`}>
          {title.length}/80
        </div>
      </div>

      <div className="editor-section">
        <label className="editor-label">正文内容</label>
        <textarea
          className="editor-textarea"
          value={body}
          onChange={handleBodyChange}
          placeholder="输入正文内容（最多500字）"
          maxLength={500}
          rows={6}
        />
        <div className={`char-count ${body.length >= 450 ? 'warning' : ''}`}>
          {body.length}/500
        </div>
      </div>

      <div className="editor-section">
        <label className="editor-label">品牌模板</label>
        <div className="template-options">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`template-option ${template.id === templateId ? 'active' : ''}`}
              onClick={() => onTemplateChange(template.id)}
              style={{
                '--template-primary': template.colors.primary,
              } as React.CSSProperties}
            >
              <div
                className="template-preview"
                style={{
                  backgroundColor: template.colors.background,
                  border: `1px solid ${template.colors.secondary}`,
                }}
              >
                <div
                  style={{
                    width: '60%',
                    height: '6px',
                    backgroundColor: template.colors.primary,
                    margin: '10px auto 4px',
                    borderRadius: '2px',
                  }}
                />
                <div
                  style={{
                    width: '40%',
                    height: '4px',
                    backgroundColor: template.colors.accent,
                    margin: '0 auto',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <span className="template-name">{template.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="editor-section">
        <label className="editor-label">布局设置</label>
        <div
          className="grid-toggle"
          onClick={() => onShowGridChange(!showGrid)}
        >
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => onShowGridChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
          <span>显示网格线（16px）</span>
        </div>
      </div>

      <div className="editor-section">
        <button
          className="grid-btn"
          onClick={onResetLayout}
          style={{ width: '100%' }}
        >
          重置为默认布局
        </button>
      </div>

      <div className="editor-section">
        <label className="editor-label">使用提示</label>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            padding: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--border-radius)',
          }}
        >
          <p>• 拖拽卡片上的元素调整位置</p>
          <p>• 元素会自动吸附到16px网格</p>
          <p>• 点击导出按钮生成多平台卡片</p>
          <p>• 一键复制Markdown格式到剪贴板</p>
        </div>
      </div>
    </aside>
  );
};

export default CardEditor;
