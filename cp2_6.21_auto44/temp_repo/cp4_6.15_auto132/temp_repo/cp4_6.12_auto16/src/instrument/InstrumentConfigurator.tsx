import { useState, useMemo } from 'react';
import { Wood, Instrument } from '../api';

interface WoodSelection {
  top: number | null;
  back: number | null;
  side: number | null;
  fingerboard: number | null;
  neck: number | null;
}

interface InstrumentConfiguratorProps {
  instrument: Instrument;
  allWoods: Wood[];
  onSubmit: (config: {
    topWoodId: number;
    backWoodId: number;
    sideWoodId: number;
    fingerboardWoodId: number;
    neckWoodId: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
  }) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  top: '面板',
  back: '背板',
  side: '侧板',
  fingerboard: '指板',
  neck: '琴颈',
};

const CATEGORY_ICONS: Record<string, string> = {
  top: '🪵',
  back: '🪵',
  side: '🪵',
  fingerboard: '🎹',
  neck: '🎸',
};

const INSTRUMENT_EMOJIS: Record<string, string> = {
  classical_guitar: '🎸',
  acoustic_guitar: '🎸',
  violin: '🎻',
  ukulele: '🎵',
};

const InstrumentConfigurator = ({ instrument, allWoods, onSubmit }: InstrumentConfiguratorProps) => {
  const [selection, setSelection] = useState<WoodSelection>({
    top: null,
    back: null,
    side: null,
    fingerboard: null,
    neck: null,
  });
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredWood, setHoveredWood] = useState<Wood | null>(null);

  const woodsByCategory = useMemo(() => {
    const grouped: Record<string, Wood[]> = {
      top: [],
      back: [],
      side: [],
      fingerboard: [],
      neck: [],
    };
    for (const wood of allWoods) {
      if (grouped[wood.category]) {
        grouped[wood.category].push(wood);
      }
    }
    return grouped;
  }, [allWoods]);

  const getSelectedWood = (category: keyof WoodSelection): Wood | undefined => {
    const id = selection[category];
    if (id === null) return undefined;
    return allWoods.find(w => w.id === id);
  };

  const handleSelectWood = (category: keyof WoodSelection, woodId: number) => {
    setSelection(prev => ({ ...prev, [category]: woodId }));
  };

  const isAllSelected = Object.values(selection).every(v => v !== null);

  const isFormValid =
    isAllSelected && customerName.trim() && customerEmail.trim() && customerPhone.trim();

  const getStockLabel = (stock: number): string => {
    if (stock < 5) return '缺货';
    if (stock < 10) return '少量';
    return '充足';
  };

  const getStockClass = (stock: number): string => {
    if (stock < 5) return 'stock-out';
    if (stock < 10) return 'stock-low';
    return 'stock-sufficient';
  };

  const isWoodDisabled = (wood: Wood): boolean => {
    return wood.stock < 5;
  };

  const previewGradient = useMemo(() => {
    const topWood = getSelectedWood('top');
    const backWood = getSelectedWood('back');
    const sideWood = getSelectedWood('side');
    const neckWood = getSelectedWood('neck');

    const colors = [
      topWood?.color || '#CD853F',
      backWood?.color || '#A0522D',
      sideWood?.color || '#D2691E',
      neckWood?.color || '#C04E2E',
    ];
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 35%, ${colors[2]} 65%, ${colors[3]} 100%)`;
  }, [selection, allWoods]);

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        topWoodId: selection.top!,
        backWoodId: selection.back!,
        sideWoodId: selection.side!,
        fingerboardWoodId: selection.fingerboard!,
        neckWoodId: selection.neck!,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayWood = hoveredWood || getSelectedWood('top');

  return (
    <div>
      <div className="configurator-layout">
        <div className="wood-categories">
          {(Object.keys(CATEGORY_LABELS) as Array<keyof WoodSelection>).map(category => {
            const categoryWoods = woodsByCategory[category] || [];
            const selectedWood = getSelectedWood(category);

            return (
              <div key={category} className="wood-category">
                <h3>
                  {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                  {selectedWood && (
                    <span className="category-selected">✓ {selectedWood.name}</span>
                  )}
                </h3>
                <div className="wood-list">
                  {categoryWoods.map(wood => {
                    const disabled = isWoodDisabled(wood);
                    const selected = selection[category] === wood.id;

                    return (
                      <div
                        key={wood.id}
                        className={`wood-card ${selected ? 'wood-card-selected' : ''} ${disabled ? 'wood-card-disabled' : ''}`}
                        onClick={() => {
                          if (!disabled) handleSelectWood(category, wood.id);
                        }}
                        onMouseEnter={() => setHoveredWood(wood)}
                        onMouseLeave={() => setHoveredWood(null)}
                      >
                        <div
                          className="wood-preview"
                          style={{
                            background: `linear-gradient(135deg, ${wood.color} 0%, ${adjustColor(wood.color, -30)} 100%)`,
                          }}
                        />
                        <div className="wood-info">
                          <span className="wood-name">{wood.name}</span>
                          <span className="wood-origin">{wood.origin}</span>
                          <span className={`wood-stock ${getStockClass(wood.stock)}`}>
                            {getStockLabel(wood.stock)} (库存: {wood.stock})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="preview-panel">
          <h3>配置预览</h3>

          <div
            className="preview-visual"
            style={{ background: previewGradient }}
          >
            <span className="preview-visual-emoji">
              {INSTRUMENT_EMOJIS[instrument.type] || '🎵'}
            </span>
          </div>

          <div className="preview-details">
            <div className="preview-detail-item">
              <span className="preview-detail-label">乐器型号</span>
              <span className="preview-detail-value">{instrument.name}</span>
            </div>
            {(Object.keys(CATEGORY_LABELS) as Array<keyof WoodSelection>).map(category => {
              const wood = getSelectedWood(category);
              return (
                <div key={category} className="preview-detail-item">
                  <span className="preview-detail-label">{CATEGORY_LABELS[category]}</span>
                  <span className="preview-detail-value">
                    {wood ? wood.name : '未选择'}
                  </span>
                </div>
              );
            })}
          </div>

          {displayWood && (
            <div className="preview-description">
              <strong>{displayWood.name}</strong>（{displayWood.origin}）
              <br />
              {displayWood.description}
            </div>
          )}
        </div>
      </div>

      {isAllSelected && (
        <div className="customer-form">
          <h3>联系信息</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="请输入您的姓名"
              />
            </div>
            <div className="form-group">
              <label>邮箱 *</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="请输入您的邮箱"
              />
            </div>
            <div className="form-group">
              <label>电话 *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="请输入您的电话"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>备注</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="如有特殊要求，请在此说明"
              />
            </div>
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              className="btn"
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
            >
              {submitting ? '提交中...' : '提交订单'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default InstrumentConfigurator;
