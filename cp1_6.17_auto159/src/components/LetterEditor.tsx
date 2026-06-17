import React from 'react';
import { useLetterStore } from '../store/letterStore';
import { LetterPaperEngine, paperTextureLabels, fontLabels, type PaperTextureType, type FontFamilyType } from '../engine/LetterPaperEngine';
import { EnvelopeAnimator, envelopeStyleList, type EnvelopeStyleType } from '../engine/EnvelopeAnimator';
import { EnvelopePreview } from './EnvelopePreview';

export const LetterEditor: React.FC = () => {
  const {
    currentContent,
    currentPaperTexture,
    currentFontFamily,
    currentTextColor,
    currentEnvelopeStyle,
    setContent,
    setPaperTexture,
    setFontFamily,
    setTextColor,
    setEnvelopeStyle,
    saveLetter,
  } = useLetterStore();

  const paperStyle = LetterPaperEngine.getPaperStyle(currentPaperTexture);
  const textStyle = LetterPaperEngine.getTextStyle(currentTextColor, currentFontFamily);

  return (
    <div className="letter-editor">
      <div className="editor-header">
        <h2 className="editor-title">信纸编辑</h2>
      </div>

      <div className="editor-content">
        <div className="paper-section">
          <div
            className="letter-paper"
            style={{
              width: '600px',
              height: '800px',
              ...paperStyle,
              backgroundSize: currentPaperTexture === 'grid' ? 'auto, 20px 20px, 20px 20px' : 'auto',
              backgroundPosition: currentPaperTexture === 'grid' ? 'center, center, center' : 'center',
            }}
          >
            <textarea
              className="letter-textarea"
              value={currentContent}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此书写你的信件..."
              maxLength={500}
              style={{
                ...textStyle,
              }}
            />
            <div className="char-count">
              {currentContent.length} / 500
            </div>
          </div>
        </div>

        <div className="controls-section">
          <div className="control-group">
            <h3 className="control-label">纸张纹理</h3>
            <div className="texture-options">
              {(Object.keys(paperTextureLabels) as PaperTextureType[]).map((texture) => (
                <button
                  key={texture}
                  className={`texture-btn ${currentPaperTexture === texture ? 'active' : ''}`}
                  onClick={() => setPaperTexture(texture)}
                  style={{
                    background: LetterPaperEngine.getPaperBackground(texture),
                    backgroundSize: texture === 'grid' ? '20px 20px, 20px 20px' : 'auto',
                  }}
                >
                  <span className="texture-name">{paperTextureLabels[texture]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <h3 className="control-label">字体选择</h3>
            <div className="font-options">
              {(Object.keys(fontLabels) as FontFamilyType[]).map((font) => (
                <button
                  key={font}
                  className={`font-btn ${currentFontFamily === font ? 'active' : ''}`}
                  onClick={() => setFontFamily(font)}
                  style={{
                    fontFamily: LetterPaperEngine.getFontStyle(font).fontFamily,
                  }}
                >
                  {fontLabels[font]}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <h3 className="control-label">文字颜色</h3>
            <div className="color-picker-wrapper">
              <input
                type="color"
                className="color-picker"
                value={currentTextColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
              <span className="color-value">{currentTextColor}</span>
            </div>
          </div>

          <div className="control-group envelope-section">
            <h3 className="control-label">信封样式</h3>
            <div className="envelope-preview-large">
              <EnvelopePreview style={currentEnvelopeStyle} size="large" />
            </div>
            <div className="envelope-options">
              {envelopeStyleList.map((style) => (
                <EnvelopePreview
                  key={style}
                  style={style}
                  size="small"
                  selected={currentEnvelopeStyle === style}
                  onClick={() => setEnvelopeStyle(style as EnvelopeStyleType)}
                />
              ))}
            </div>
          </div>

          <button
            className="save-btn"
            onClick={saveLetter}
            disabled={!currentContent.trim()}
          >
            保存信件
          </button>
        </div>
      </div>

      <style>{`
        .letter-editor {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        .editor-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .editor-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 600;
          color: #4A3B32;
          margin: 0;
        }

        .editor-content {
          display: flex;
          gap: 40px;
          justify-content: center;
          align-items: flex-start;
        }

        .paper-section {
          flex-shrink: 0;
        }

        .letter-paper {
          position: relative;
          padding: 60px 50px;
          box-sizing: border-box;
          border-radius: 2px;
        }

        .letter-textarea {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .letter-textarea::placeholder {
          color: rgba(74, 59, 50, 0.4);
        }

        .char-count {
          position: absolute;
          bottom: 20px;
          right: 30px;
          font-size: 12px;
          color: #A09080;
          font-family: 'Inter', sans-serif;
        }

        .controls-section {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .control-group {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
        }

        .control-label {
          font-size: 14px;
          font-weight: 600;
          color: #4A3B32;
          margin: 0 0 12px 0;
          font-family: 'Inter', sans-serif;
        }

        .texture-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .texture-btn {
          position: relative;
          height: 60px;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 6px;
        }

        .texture-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .texture-btn.active {
          border-color: #E67E22;
          box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.3);
        }

        .texture-name {
          font-size: 11px;
          color: #4A3B32;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
        }

        .font-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .font-btn {
          padding: 10px 14px;
          border: 2px solid transparent;
          border-radius: 8px;
          background: #FFF;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          text-align: left;
        }

        .font-btn:hover {
          background: #F5E6D3;
        }

        .font-btn.active {
          border-color: #E67E22;
          background: #FDF5E6;
        }

        .color-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .color-picker {
          width: 48px;
          height: 36px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          padding: 0;
          background: none;
        }

        .color-value {
          font-size: 13px;
          color: #7F8C8D;
          font-family: 'Inter', sans-serif;
          text-transform: uppercase;
        }

        .envelope-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .envelope-section .control-label {
          align-self: flex-start;
        }

        .envelope-preview-large {
          margin-bottom: 8px;
        }

        .envelope-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          width: 100%;
          justify-items: center;
        }

        .save-btn {
          padding: 14px 32px;
          border: none;
          border-radius: 20px;
          background: #E67E22;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }

        .save-btn:hover:not(:disabled) {
          background: #D35400;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(230, 126, 34, 0.4);
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 1024px) and (min-width: 768px) {
          .editor-content {
            width: 95%;
            margin: 0 auto;
          }
        }

        @media (max-width: 768px) {
          .letter-editor {
            padding: 20px 16px;
          }

          .editor-content {
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }

          .letter-paper {
            width: 100% !important;
            max-width: 600px;
            height: auto !important;
            min-height: 500px;
            aspect-ratio: 3 / 4;
          }

          .controls-section {
            width: 100%;
            max-width: 600px;
          }

          .texture-options {
            grid-template-columns: repeat(4, 1fr);
          }

          .font-options {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .font-btn {
            flex: 1;
            min-width: 100px;
          }
        }
      `}</style>
    </div>
  );
};
