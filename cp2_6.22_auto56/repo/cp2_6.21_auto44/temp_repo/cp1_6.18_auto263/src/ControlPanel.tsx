import { useState } from 'react';
import { useDesignStore } from './store';
import {
  LEATHER_COLORS,
  CLASP_INFO,
  FONT_OPTIONS,
  MIN_BELT_LENGTH_CM,
  MAX_BELT_LENGTH_CM
} from './types';
import type { ClaspType, EngravingFont, SaveDesignResponse, GetDesignResponse } from './types';

interface ControlPanelProps {
  getThumbnail?: () => string;
}

export default function ControlPanel({ getThumbnail }: ControlPanelProps) {
  const {
    leatherColor, claspType, beltLength,
    engravingText, engravingFont, fontSize, bill, totalPrice,
    setColor, setClasp, setBeltLength, setText, setFont, setFontSize, loadDesign
  } = useDesignStore();

  const [designId, setDesignId] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const thumbnail = getThumbnail ? getThumbnail() : '';
      const state = useDesignStore.getState();
      const res = await fetch('/api/save-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leatherColor: state.leatherColor,
          claspType: state.claspType,
          beltLength: state.beltLength,
          beltWidth: state.beltWidth,
          engravingText: state.engravingText,
          engravingFont: state.engravingFont,
          engravingX: state.engravingX,
          engravingY: state.engravingY,
          fontSize: state.fontSize,
          thumbnail
        })
      });
      if (!res.ok) throw new Error('保存失败');
      const data: SaveDesignResponse = await res.json();
      setSavedId(data.id);
      setMessage(`设计已保存，ID: ${data.id}`);
    } catch (err) {
      setMessage('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (designId.trim().length === 0) {
      setMessage('请输入设计ID');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/design/${designId.trim().toUpperCase()}`);
      if (!res.ok) throw new Error('设计不存在');
      const data: GetDesignResponse = await res.json();
      loadDesign({
        leatherColor: data.leatherColor,
        claspType: data.claspType,
        beltLength: data.beltLength,
        beltWidth: data.beltWidth,
        engravingText: data.engravingText,
        engravingFont: data.engravingFont,
        engravingX: data.engravingX,
        engravingY: data.engravingY,
        fontSize: data.fontSize
      });
      setMessage('设计已加载成功');
      setSavedId(null);
    } catch {
      setMessage('加载失败，设计不存在');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="control-panel">
      <div className="card">
        <div className="card-title">参数调整</div>
        <div className="card-content">
          <div className="field">
            <label>皮料颜色</label>
            <select
              value={leatherColor}
              onChange={e => setColor(e.target.value)}
            >
              {LEATHER_COLORS.map(c => (
                <option key={c.value} value={c.value}>{c.name} ({c.value})</option>
              ))}
            </select>
            <div className="color-preview" style={{ backgroundColor: leatherColor }} />
          </div>

          <div className="field">
            <label>扣环样式</label>
            <div className="clasp-group">
              {CLASP_INFO.map(clasp => (
                <button
                  key={clasp.type}
                  className={`clasp-btn ${claspType === clasp.type ? 'active' : ''}`}
                  onClick={() => setClasp(clasp.type as ClaspType)}
                  title={clasp.name}
                >
                  <div className="clasp-icon" style={{ background: `linear-gradient(135deg, ${clasp.color}, ${shadeColor(clasp.color, -20)})` }} />
                  <span className="clasp-name">{clasp.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>皮带长度: {beltLength}cm</label>
            <input
              type="range"
              min={MIN_BELT_LENGTH_CM}
              max={MAX_BELT_LENGTH_CM}
              value={beltLength}
              onChange={e => setBeltLength(parseInt(e.target.value))}
              className="slider"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">刻字设置</div>
        <div className="card-content">
          <div className="field">
            <label>刻字内容</label>
            <input
              type="text"
              className="engraving-input"
              placeholder="限8英文/4中文"
              value={engravingText}
              onChange={e => setText(e.target.value)}
            />
            <span className="hint">可在画布上拖拽文字调整位置</span>
          </div>

          <div className="field">
            <label>字体</label>
            <select
              value={engravingFont}
              onChange={e => setFont(e.target.value as EngravingFont)}
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>字体大小: {fontSize}px</label>
            <input
              type="range"
              min={16}
              max={36}
              value={fontSize}
              onChange={e => setFontSize(parseInt(e.target.value))}
              className="slider"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">物料清单</div>
        <div className="card-content">
          <div className="bill-list">
            {bill.map((item, idx) => (
              <div key={idx} className="bill-row">
                <span className="bill-name">{item.name}</span>
                <span className="bill-qty">
                  {item.quantity}{item.unit} × ¥{item.unitPrice.toFixed(2)}
                </span>
                <span className="bill-total">¥{item.total.toFixed(2)}</span>
              </div>
            ))}
            <div className="bill-row total">
              <span className="bill-name">总计</span>
              <span />
              <span className="bill-total">¥{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="action-section">
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存设计'}
          </button>
          {savedId && <div className="saved-id">已保存ID: <strong>{savedId}</strong></div>}
          <div className="load-row">
            <input
              type="text"
              placeholder="输入6位ID"
              value={designId}
              maxLength={6}
              onChange={e => setDesignId(e.target.value.toUpperCase())}
            />
            <button className="btn-secondary" onClick={handleLoad} disabled={loading}>
              加载设计
            </button>
          </div>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    </div>
  );
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}
