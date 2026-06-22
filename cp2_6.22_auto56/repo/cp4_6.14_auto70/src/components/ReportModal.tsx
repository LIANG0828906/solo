import { useEffect, useState } from 'react';
import { FontConfig, MeasureData, renderTextToCanvas } from '../utils/fontMeasure';
import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  configA: FontConfig;
  configB: FontConfig;
  measureA: MeasureData | null;
  measureB: MeasureData | null;
  score: number;
  screenshotA: string;
  screenshotB: string;
  getFontLabel: (config: FontConfig) => string;
  text?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  configA,
  configB,
  measureA,
  measureB,
  score,
  screenshotA,
  screenshotB,
  getFontLabel,
  text = '',
}: ReportModalProps) {
  const [screenshotAData, setScreenshotAData] = useState<string>('');
  const [screenshotBData, setScreenshotBData] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(false);
        });
      });

      if (!screenshotA || !screenshotB) {
        setTimeout(() => {
          const a = renderTextToCanvas(text, configA, 500);
          const b = renderTextToCanvas(text, configB, 500);
          setScreenshotAData(a);
          setScreenshotBData(b);
        }, 50);
      } else {
        setScreenshotAData(screenshotA);
        setScreenshotBData(screenshotB);
      }
    }
  }, [isOpen, screenshotA, screenshotB, text, configA, configB]);

  if (!isOpen) return null;

  const aScreenshot = screenshotA || screenshotAData;
  const bScreenshot = screenshotB || screenshotBData;

  return (
    <div className={`modal-overlay ${isAnimating ? 'overlay-enter' : ''}`} onClick={onClose}>
      <div
        className={`modal-content ${isAnimating ? 'modal-enter' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} title="关闭">
          ×
        </button>

        <h2 className="modal-title">对比报告</h2>

        <div className="score-section">
          <div className="score-label">视觉差异评分</div>
          <div className="score-value">{score}</div>
        </div>

        <table className="report-table">
          <thead>
            <tr>
              <th>参数</th>
              <th>面板 A</th>
              <th>面板 B</th>
              <th>差异</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>字体族</td>
              <td>{getFontLabel(configA)}</td>
              <td>{getFontLabel(configB)}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>字号</td>
              <td>{configA.fontSize}px</td>
              <td>{configB.fontSize}px</td>
              <td>{(configB.fontSize - configA.fontSize).toFixed(1)}px</td>
            </tr>
            <tr>
              <td>行高</td>
              <td>{configA.lineHeight.toFixed(1)}</td>
              <td>{configB.lineHeight.toFixed(1)}</td>
              <td>{(configB.lineHeight - configA.lineHeight).toFixed(1)}</td>
            </tr>
            <tr>
              <td>选区宽度</td>
              <td>{measureA ? `${measureA.width.toFixed(1)}px` : '-'}</td>
              <td>{measureB ? `${measureB.width.toFixed(1)}px` : '-'}</td>
              <td>
                {measureA && measureB
                  ? `${(measureB.width - measureA.width).toFixed(1)}px`
                  : '-'}
              </td>
            </tr>
            <tr>
              <td>选区高度</td>
              <td>{measureA ? `${measureA.height.toFixed(1)}px` : '-'}</td>
              <td>{measureB ? `${measureB.height.toFixed(1)}px` : '-'}</td>
              <td>
                {measureA && measureB
                  ? `${(measureB.height - measureA.height).toFixed(1)}px`
                  : '-'}
              </td>
            </tr>
            {measureA?.charBounds && measureB?.charBounds && (
              <>
                <tr>
                  <td>字符 top</td>
                  <td>{measureA.charBounds.top.toFixed(1)}px</td>
                  <td>{measureB.charBounds.top.toFixed(1)}px</td>
                  <td>{(measureB.charBounds.top - measureA.charBounds.top).toFixed(1)}px</td>
                </tr>
                <tr>
                  <td>字符 right</td>
                  <td>{measureA.charBounds.right.toFixed(1)}px</td>
                  <td>{measureB.charBounds.right.toFixed(1)}px</td>
                  <td>{(measureB.charBounds.right - measureA.charBounds.right).toFixed(1)}px</td>
                </tr>
                <tr>
                  <td>字符 bottom</td>
                  <td>{measureA.charBounds.bottom.toFixed(1)}px</td>
                  <td>{measureB.charBounds.bottom.toFixed(1)}px</td>
                  <td>{(measureB.charBounds.bottom - measureA.charBounds.bottom).toFixed(1)}px</td>
                </tr>
                <tr>
                  <td>字符 left</td>
                  <td>{measureA.charBounds.left.toFixed(1)}px</td>
                  <td>{measureB.charBounds.left.toFixed(1)}px</td>
                  <td>{(measureB.charBounds.left - measureA.charBounds.left).toFixed(1)}px</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <div className="screenshots-section">
          <h3 className="section-title">渲染对比</h3>
          <div className="screenshots-row">
            <div className="screenshot-item">
              <div className="screenshot-label">面板 A</div>
              {aScreenshot ? (
                <img src={aScreenshot} alt="Panel A screenshot" className="screenshot-img" />
              ) : (
                <div className="screenshot-placeholder">生成中...</div>
              )}
            </div>
            <div className="screenshot-item">
              <div className="screenshot-label">面板 B</div>
              {bScreenshot ? (
                <img src={bScreenshot} alt="Panel B screenshot" className="screenshot-img" />
              ) : (
                <div className="screenshot-placeholder">生成中...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
