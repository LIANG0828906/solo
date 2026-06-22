import React from 'react';
import type { CanvasElement, ImageElement, TextElement, ButtonElement, DividerElement } from '../types';

interface PropertyPanelProps {
  element: CanvasElement | null;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

export default function PropertyPanel({ element, onUpdate }: PropertyPanelProps) {
  if (!element) {
    return (
      <div className="property-panel">
        <h3 className="panel-title">属性</h3>
        <p className="no-selection">选择一个元素以编辑其属性</p>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    onUpdate(element.id, { [key]: value });
  };

  const handleNumberChange = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      onUpdate(element.id, { [key]: num });
    }
  };

  const renderCommonProperties = () => (
    <div className="panel-section">
      <div className="section-title">位置与大小</div>
      <div className="property-row">
        <span className="property-label">X 坐标</span>
        <input
          type="number"
          className="property-input"
          value={Math.round(element.x)}
          onChange={(e) => handleNumberChange('x', e.target.value)}
        />
      </div>
      <div className="property-row">
        <span className="property-label">Y 坐标</span>
        <input
          type="number"
          className="property-input"
          value={Math.round(element.y)}
          onChange={(e) => handleNumberChange('y', e.target.value)}
        />
      </div>
      <div className="property-row">
        <span className="property-label">宽度</span>
        <input
          type="number"
          className="property-input"
          value={Math.round(element.width)}
          onChange={(e) => handleNumberChange('width', e.target.value)}
        />
      </div>
      <div className="property-row">
        <span className="property-label">高度</span>
        <input
          type="number"
          className="property-input"
          value={Math.round(element.height)}
          onChange={(e) => handleNumberChange('height', e.target.value)}
        />
      </div>
    </div>
  );

  const renderImageProperties = () => {
    const imgEl = element as ImageElement;
    return (
      <>
        {renderCommonProperties()}
        <div className="panel-section">
          <div className="section-title">样式</div>
          <div className="property-row">
            <span className="property-label">背景色</span>
            <input
              type="color"
              className="property-input"
              value={imgEl.backgroundColor || '#e0e0e0'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">圆角</span>
            <input
              type="number"
              className="property-input"
              value={imgEl.borderRadius || 0}
              onChange={(e) => handleNumberChange('borderRadius', e.target.value)}
            />
          </div>
        </div>
      </>
    );
  };

  const renderTextProperties = () => {
    const txtEl = element as TextElement;
    return (
      <>
        {renderCommonProperties()}
        <div className="panel-section">
          <div className="section-title">文本内容</div>
          <textarea
            className="property-textarea"
            value={txtEl.content}
            onChange={(e) => handleChange('content', e.target.value)}
          />
        </div>
        <div className="panel-section">
          <div className="section-title">字体样式</div>
          <div className="property-row">
            <span className="property-label">字体</span>
            <select
              className="property-select"
              value={txtEl.fontFamily}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Helvetica Neue', sans-serif">Helvetica</option>
              <option value="'Times New Roman', serif">Times</option>
              <option value="'Courier New', monospace">Courier</option>
            </select>
          </div>
          <div className="property-row">
            <span className="property-label">字号</span>
            <input
              type="number"
              className="property-input"
              value={txtEl.fontSize}
              onChange={(e) => handleNumberChange('fontSize', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">字重</span>
            <select
              className="property-select"
              value={txtEl.fontWeight}
              onChange={(e) => handleNumberChange('fontWeight', e.target.value)}
            >
              <option value={300}>细体</option>
              <option value={400}>常规</option>
              <option value={500}>中等</option>
              <option value={600}>半粗</option>
              <option value={700}>粗体</option>
            </select>
          </div>
          <div className="property-row">
            <span className="property-label">颜色</span>
            <input
              type="color"
              className="property-input"
              value={txtEl.color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">对齐</span>
            <select
              className="property-select"
              value={txtEl.textAlign}
              onChange={(e) => handleChange('textAlign', e.target.value)}
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
          <div className="property-row">
            <span className="property-label">行高</span>
            <input
              type="number"
              className="property-input"
              step="0.1"
              value={txtEl.lineHeight}
              onChange={(e) => handleNumberChange('lineHeight', e.target.value)}
            />
          </div>
        </div>
      </>
    );
  };

  const renderButtonProperties = () => {
    const btnEl = element as ButtonElement;
    return (
      <>
        {renderCommonProperties()}
        <div className="panel-section">
          <div className="section-title">按钮内容</div>
          <div className="property-row">
            <span className="property-label">文字</span>
            <input
              type="text"
              className="property-input"
              style={{ width: '100%' }}
              value={btnEl.text}
              onChange={(e) => handleChange('text', e.target.value)}
            />
          </div>
        </div>
        <div className="panel-section">
          <div className="section-title">样式</div>
          <div className="property-row">
            <span className="property-label">背景色</span>
            <input
              type="color"
              className="property-input"
              value={btnEl.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">文字颜色</span>
            <input
              type="color"
              className="property-input"
              value={btnEl.textColor}
              onChange={(e) => handleChange('textColor', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">字号</span>
            <input
              type="number"
              className="property-input"
              value={btnEl.fontSize}
              onChange={(e) => handleNumberChange('fontSize', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">圆角</span>
            <input
              type="number"
              className="property-input"
              value={btnEl.borderRadius}
              onChange={(e) => handleNumberChange('borderRadius', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">边框宽度</span>
            <input
              type="number"
              className="property-input"
              value={btnEl.borderWidth}
              onChange={(e) => handleNumberChange('borderWidth', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">边框颜色</span>
            <input
              type="color"
              className="property-input"
              value={btnEl.borderColor}
              onChange={(e) => handleChange('borderColor', e.target.value)}
            />
          </div>
        </div>
      </>
    );
  };

  const renderDividerProperties = () => {
    const divEl = element as DividerElement;
    return (
      <>
        {renderCommonProperties()}
        <div className="panel-section">
          <div className="section-title">样式</div>
          <div className="property-row">
            <span className="property-label">颜色</span>
            <input
              type="color"
              className="property-input"
              value={divEl.color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">粗细</span>
            <input
              type="number"
              className="property-input"
              value={divEl.thickness}
              onChange={(e) => handleNumberChange('thickness', e.target.value)}
            />
          </div>
          <div className="property-row">
            <span className="property-label">样式</span>
            <select
              className="property-select"
              value={divEl.style}
              onChange={(e) => handleChange('style', e.target.value)}
            >
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
            </select>
          </div>
        </div>
      </>
    );
  };

  const renderTypeSpecificProperties = () => {
    switch (element.type) {
      case 'image':
        return renderImageProperties();
      case 'text':
        return renderTextProperties();
      case 'button':
        return renderButtonProperties();
      case 'divider':
        return renderDividerProperties();
      default:
        return null;
    }
  };

  return (
    <div className="property-panel">
      <h3 className="panel-title">属性</h3>
      {renderTypeSpecificProperties()}
    </div>
  );
}
