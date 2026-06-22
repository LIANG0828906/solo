import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { YARN_TYPES, TASSEL_STYLES, type Pattern, type YarnType, type TasselStyle } from '../types';

interface OrderFormProps {
  onClose?: () => void;
}

export default function OrderForm({ onClose }: OrderFormProps) {
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [length, setLength] = useState(160);
  const [width, setWidth] = useState(30);
  const [yarnType, setYarnType] = useState<YarnType>('wool');
  const [colorScheme, setColorScheme] = useState<string[]>([]);
  const [tasselStyle, setTasselStyle] = useState<TasselStyle>('none');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, []);

  useEffect(() => {
    if (selectedPattern && selectedPattern.colors.length > 0) {
      setColorScheme(selectedPattern.colors.slice(0, Math.min(3, selectedPattern.colors.length)));
    } else {
      setColorScheme([]);
    }
  }, [selectedPattern]);

  const loadPatterns = async () => {
    try {
      const res = await axios.get('/api/patterns');
      setPatterns(res.data);
      if (res.data.length > 0) {
        setSelectedPattern(res.data[0]);
      }
    } catch (err) {
      console.error('加载图案失败:', err);
    }
  };

  const toggleColor = (color: string) => {
    if (colorScheme.includes(color)) {
      setColorScheme(colorScheme.filter(c => c !== color));
    } else if (colorScheme.length < 3) {
      setColorScheme([...colorScheme, color]);
    } else {
      alert('最多选择3种配色');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPattern) {
      alert('请选择一个图案');
      return;
    }
    if (!customerName.trim()) {
      alert('请输入客户姓名');
      return;
    }
    if (colorScheme.length === 0) {
      alert('请至少选择一种配色');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post('/api/orders', {
        customer_name: customerName,
        customer_phone: customerPhone,
        pattern_id: selectedPattern.id,
        pattern_name: selectedPattern.name,
        size_length: length,
        size_width: width,
        yarn_type: yarnType,
        color_scheme: colorScheme,
        tassel_style: tasselStyle
      });
      alert(`订单创建成功！订单号: ${res.data.order_no}`);
      onClose?.();
      navigate(`/orders/${res.data.id}`);
    } catch (err: any) {
      alert('提交失败: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="order-form card" onSubmit={handleSubmit}>
      <h3 className="form-title">客户定制订单</h3>

      <div className="form-section">
        <label className="section-label">选择图案</label>
        <div className="pattern-selector">
          <div className="pattern-cards-scroll">
            {patterns.map(p => (
              <div
                key={p.id}
                className={`pattern-select-card ${selectedPattern?.id === p.id ? 'selected' : ''}`}
                onClick={() => setSelectedPattern(p)}
              >
                <div className="select-thumb">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={p.name} />
                  ) : (
                    <span>无预览</span>
                  )}
                </div>
                <span className="select-pattern-name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        {selectedPattern && (
          <div className="pattern-preview-large">
            <div className="preview-label">高清预览</div>
            {selectedPattern.thumbnail ? (
              <img src={selectedPattern.thumbnail} alt={selectedPattern.name} className="preview-img" />
            ) : (
              <div className="preview-empty">暂无预览图</div>
            )}
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">客户姓名 *</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="form-input"
            placeholder="请输入客户姓名"
          />
        </div>
        <div className="form-group">
          <label className="form-label">联系电话</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="form-input"
            placeholder="请输入联系电话"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">围巾长度: {length}cm</label>
          <input
            type="range"
            min="120"
            max="200"
            step="5"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="slider"
          />
          <div className="range-labels">
            <span>120cm</span>
            <span>200cm</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">围巾宽度: {width}cm</label>
          <input
            type="range"
            min="20"
            max="40"
            step="5"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            className="slider"
          />
          <div className="range-labels">
            <span>20cm</span>
            <span>40cm</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <label className="section-label">纱线材质</label>
        <div className="yarn-options">
          {YARN_TYPES.map(yarn => (
            <button
              key={yarn.value}
              type="button"
              className={`yarn-option ${yarnType === yarn.value ? 'selected' : ''}`}
              onClick={() => setYarnType(yarn.value)}
            >
              <span className="yarn-icon">🧵</span>
              <span className="yarn-name">{yarn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedPattern && (
        <div className="form-section">
          <label className="section-label">配色方案 (已选{colorScheme.length}/3)</label>
          <div className="color-scheme-grid">
            {selectedPattern.colors.map((color, idx) => (
              <button
                key={idx}
                type="button"
                className={`scheme-color ${colorScheme.includes(color) ? 'selected' : ''}`}
                onClick={() => toggleColor(color)}
                style={{ backgroundColor: color }}
                title={color}
              >
                {colorScheme.includes(color) && <span className="check-mark">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-section">
        <label className="section-label">流苏样式</label>
        <div className="tassel-options">
          {TASSEL_STYLES.map(tassel => (
            <button
              key={tassel.value}
              type="button"
              className={`tassel-option ${tasselStyle === tassel.value ? 'selected' : ''}`}
              onClick={() => setTasselStyle(tassel.value)}
            >
              {tassel.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-summary card" style={{ background: 'var(--background)' }}>
        <h4 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>订单摘要</h4>
        <div className="summary-row">
          <span>图案:</span>
          <strong>{selectedPattern?.name || '未选择'}</strong>
        </div>
        <div className="summary-row">
          <span>尺寸:</span>
          <strong>{length}cm × {width}cm</strong>
        </div>
        <div className="summary-row">
          <span>材质:</span>
          <strong>{YARN_TYPES.find(y => y.value === yarnType)?.label}</strong>
        </div>
        <div className="summary-row colors-row">
          <span>配色:</span>
          <div className="colors-preview">
            {colorScheme.map((c, i) => (
              <span key={i} className="color-dot" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="summary-row">
          <span>流苏:</span>
          <strong>{TASSEL_STYLES.find(t => t.value === tasselStyle)?.label}</strong>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 2 }}>
          {submitting ? '提交中...' : '确认提交订单'}
        </button>
      </div>

      <style>{`
        .order-form {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .form-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--primary-dark);
          margin: 0;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--border);
        }
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .section-label {
          font-weight: 600;
          color: var(--primary-dark);
          font-size: 14px;
        }
        .form-label {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          display: block;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-input {
          padding: 12px 16px;
          border: 2px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: var(--primary);
        }
        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .pattern-cards-scroll {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .pattern-select-card {
          border: 2px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }
        .pattern-select-card:hover {
          border-color: var(--secondary);
          box-shadow: var(--shadow-hover);
        }
        .pattern-select-card.selected {
          border-color: #6B4E3D;
          box-shadow: 0 0 0 2px rgba(107, 78, 61, 0.2);
        }
        .select-thumb {
          aspect-ratio: 1;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .select-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .select-pattern-name {
          padding: 8px;
          font-size: 12px;
          text-align: center;
          background: var(--background);
        }
        .pattern-preview-large {
          margin-top: 8px;
          padding: 16px;
          background: var(--background);
          border-radius: 8px;
        }
        .preview-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .preview-img {
          width: 100%;
          max-width: 300px;
          height: auto;
          display: block;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: var(--shadow);
        }
        .preview-empty {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }
        .yarn-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .yarn-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 16px 8px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
        }
        .yarn-option:hover {
          border-color: var(--secondary);
        }
        .yarn-option.selected {
          border-color: #6B4E3D;
          background: var(--background);
          box-shadow: 0 0 0 2px rgba(107, 78, 61, 0.15);
        }
        .yarn-icon {
          font-size: 24px;
        }
        .yarn-name {
          font-size: 13px;
          font-weight: 500;
        }
        .color-scheme-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .scheme-color {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .scheme-color.selected {
          border-color: #6B4E3D;
          transform: scale(1.1);
        }
        .check-mark {
          color: white;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .tassel-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .tassel-option {
          padding: 12px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: white;
          font-size: 13px;
          transition: all 0.2s;
        }
        .tassel-option:hover {
          border-color: var(--secondary);
        }
        .tassel-option.selected {
          border-color: #6B4E3D;
          background: var(--background);
          font-weight: 500;
        }
        .form-summary {
          padding: 20px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          font-size: 14px;
        }
        .colors-row {
          align-items: center;
        }
        .colors-preview {
          display: flex;
          gap: 6px;
        }
        .color-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
        }
        .form-actions {
          display: flex;
          gap: 12px;
        }
        @media (max-width: 600px) {
          .form-row { grid-template-columns: 1fr; }
          .yarn-options { grid-template-columns: repeat(2, 1fr); }
          .tassel-options { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </form>
  );
}
