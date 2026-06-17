import { useCardStore } from '@/store';
import {
  TEMPLATES,
  EMOJI_LIST,
  TITLE_MAX_LENGTH,
  BODY_MAX_LENGTH,
  type TemplateName,
  type CardColors,
} from '@/constants/templates';

export function Editor() {
  const {
    currentCard,
    updateCard,
    setTemplate,
    generateColors,
    applyColors,
    saveHistory,
    generatedSchemes,
  } = useCardStore();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, TITLE_MAX_LENGTH);
    updateCard({ title: value });
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, BODY_MAX_LENGTH);
    updateCard({ body: value });
  };

  const handleEmojiSelect = (emoji: string) => {
    updateCard({ emoji });
  };

  const handleTemplateSelect = (name: TemplateName) => {
    setTemplate(name);
  };

  const handleGenerateColors = () => {
    generateColors();
  };

  const handleApplyColors = (colors: CardColors) => {
    applyColors(colors);
    saveHistory();
  };

  return (
    <div className="editor-container">
      <div className="section">
        <h3 className="section-title">选择模板</h3>
        <div className="template-group">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              className={`template-btn ${currentCard.template === t.name ? 'active' : ''}`}
              onClick={() => handleTemplateSelect(t.name)}
              style={{
                background: t.defaultColors.background,
                color: t.defaultColors.title,
                borderColor:
                  currentCard.template === t.name
                    ? '#4A90D9'
                    : t.defaultColors.accent,
              }}
            >
              <div
                className="template-dot"
                style={{
                  background: t.defaultColors.accent,
                }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          标题
          <span className="counter">
            {currentCard.title.length}/{TITLE_MAX_LENGTH}
          </span>
        </h3>
        <input
          type="text"
          className="input-field"
          value={currentCard.title}
          onChange={handleTitleChange}
          placeholder="请输入标题（最多30字）"
          maxLength={TITLE_MAX_LENGTH}
        />
      </div>

      <div className="section">
        <h3 className="section-title">
          正文
          <span className="counter">
            {currentCard.body.length}/{BODY_MAX_LENGTH}
          </span>
        </h3>
        <textarea
          className="textarea-field"
          value={currentCard.body}
          onChange={handleBodyChange}
          placeholder="请输入正文内容（最多200字）"
          maxLength={BODY_MAX_LENGTH}
          rows={4}
        />
      </div>

      <div className="section">
        <h3 className="section-title">选择图标</h3>
        <div className="emoji-grid">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              className={`emoji-btn ${currentCard.emoji === emoji ? 'active' : ''}`}
              onClick={() => handleEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">配色方案</h3>
        <button className="primary-btn generate-btn" onClick={handleGenerateColors}>
          🎨 生成配色
        </button>
        {generatedSchemes.length > 0 && (
          <div className="color-schemes">
            {generatedSchemes.map((scheme, idx) => (
              <button
                key={idx}
                className="color-scheme-item"
                onClick={() => handleApplyColors(scheme)}
                title="点击应用此配色"
              >
                <div className="color-block" style={{ background: scheme.background }}>
                  <span
                    className="color-preview-text"
                    style={{ color: scheme.title }}
                  >
                    Aa
                  </span>
                </div>
                <div className="color-strip">
                  <div
                    className="color-dot"
                    style={{ background: scheme.background }}
                    title="背景色"
                  />
                  <div
                    className="color-dot"
                    style={{ background: scheme.title }}
                    title="标题色"
                  />
                  <div
                    className="color-dot"
                    style={{ background: scheme.body }}
                    title="正文色"
                  />
                  <div
                    className="color-dot"
                    style={{ background: scheme.accent }}
                    title="强调色"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
