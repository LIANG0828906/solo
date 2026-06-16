import { useFontStore } from '@/store/fontStore';
import { useFontLoader } from '@/hooks/useFontLoader';
import PreviewCanvas from './PreviewCanvas';
import Spinner from './Spinner';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function PreviewPanel() {
  const selectedFontId = useFontStore((s) => s.selectedFontId);
  const fonts = useFontStore((s) => s.fonts);
  const selectedFontLoading = useFontStore((s) => s.selectedFontLoading);
  const previewParams = useFontStore((s) => s.previewParams);
  const setPreviewParams = useFontStore((s) => s.setPreviewParams);
  const compareFontIds = useFontStore((s) => s.compareFontIds);
  const toggleCompareFont = useFontStore((s) => s.toggleCompareFont);

  useFontLoader();

  const selectedFont = fonts.find((f) => f.id === selectedFontId);

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        className="preview-panel__mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <div className={`preview-panel ${mobileOpen ? 'preview-panel--mobile-open' : ''}`}>
        <div className="preview-panel__header">
          <h2 className="preview-panel__title">
            {selectedFont ? selectedFont.name : '请选择字体'}
          </h2>
          {selectedFontLoading && <Spinner />}
        </div>

        <div className="preview-panel__canvas-area">
          <PreviewCanvas
            text={previewParams.text}
            fontFamily={selectedFont?.googleFontName || 'sans-serif'}
            fontSize={previewParams.fontSize}
            lineHeight={previewParams.lineHeight}
            color={previewParams.color}
            backgroundColor={previewParams.backgroundColor}
          />
        </div>

        <div className="preview-panel__controls">
          <label className="preview-panel__label">
            预览文本
            <input
              type="text"
              className="preview-panel__input"
              value={previewParams.text}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 50) setPreviewParams({ text: val });
              }}
              maxLength={50}
              placeholder="输入预览文本..."
            />
          </label>

          <label className="preview-panel__label">
            字号: {previewParams.fontSize}px
            <input
              type="range"
              className="preview-panel__range"
              min={12}
              max={72}
              step={1}
              value={previewParams.fontSize}
              onChange={(e) => setPreviewParams({ fontSize: Number(e.target.value) })}
            />
            <div className="preview-panel__range-marks">
              <span>12</span>
              <span>24</span>
              <span>36</span>
              <span>48</span>
              <span>60</span>
              <span>72</span>
            </div>
          </label>

          <label className="preview-panel__label">
            行高: {previewParams.lineHeight.toFixed(1)}
            <input
              type="range"
              className="preview-panel__range"
              min={1.0}
              max={2.0}
              step={0.1}
              value={previewParams.lineHeight}
              onChange={(e) => setPreviewParams({ lineHeight: Number(e.target.value) })}
            />
          </label>

          <div className="preview-panel__color-row">
            <label className="preview-panel__label preview-panel__label--color">
              前景色
              <div className="preview-panel__color-picker">
                <input
                  type="color"
                  value={previewParams.color}
                  onChange={(e) => setPreviewParams({ color: e.target.value })}
                />
                <span className="preview-panel__color-swatch" style={{ backgroundColor: previewParams.color }} />
              </div>
            </label>

            <label className="preview-panel__label preview-panel__label--color">
              背景色
              <div className="preview-panel__color-picker">
                <input
                  type="color"
                  value={previewParams.backgroundColor}
                  onChange={(e) => setPreviewParams({ backgroundColor: e.target.value })}
                />
                <span className="preview-panel__color-swatch" style={{ backgroundColor: previewParams.backgroundColor }} />
              </div>
            </label>
          </div>
        </div>

        {compareFontIds.length > 0 && (
          <div className="preview-panel__compare">
            <h3 className="preview-panel__compare-title">字体对比</h3>
            {compareFontIds.map((fid) => {
              const f = fonts.find((ft) => ft.id === fid);
              if (!f) return null;
              return (
                <div key={fid} className="preview-panel__compare-item">
                  <div className="preview-panel__compare-header">
                    <span className="preview-panel__compare-name">{f.name}</span>
                    <button
                      className="preview-panel__compare-close"
                      onClick={() => toggleCompareFont(fid)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <PreviewCanvas
                    text="The quick brown fox jumps over the lazy dog."
                    fontFamily={f.googleFontName}
                    fontSize={18}
                    lineHeight={1.4}
                    color="#333333"
                    backgroundColor="#FFFFFF"
                    className="preview-panel__compare-canvas"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
