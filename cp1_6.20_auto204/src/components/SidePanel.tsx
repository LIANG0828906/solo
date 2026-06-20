import { useState, useEffect } from 'react';
import type { Product, RestockSuggestion } from '../api';
import { createRipple } from '../utils/ripple';

interface SidePanelProps {
  product: Product | null;
  onClose: () => void;
  onSetThreshold: (productId: string, threshold: number) => Promise<void>;
  onGenerateRestock: (product: Product) => Promise<RestockSuggestion[]>;
}

const statusLabel: Record<string, string> = {
  normal: '正常',
  warning: '预警',
  outOfStock: '缺货',
};

function SidePanel({
  product,
  onClose,
  onSetThreshold,
  onGenerateRestock,
}: SidePanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showThresholdInput, setShowThresholdInput] = useState(false);
  const [newThreshold, setNewThreshold] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (product) {
      setNewThreshold(product.threshold);
      setShowThresholdInput(false);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [product]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSetThreshold = async (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    if (!product) return;
    setLoading(true);
    try {
      await onSetThreshold(product.id, newThreshold);
      setShowThresholdInput(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRestock = async (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    if (!product) return;
    setLoading(true);
    try {
      await onGenerateRestock(product);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isMobile ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.3s ease-out',
    pointerEvents: isVisible ? 'auto' : 'none',
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: isMobile ? '100vw' : '420px',
    maxWidth: '100vw',
    backgroundColor: '#1f1f1f',
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.4)',
    zIndex: 1001,
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease-out',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const closeBtnStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#a0a0a0',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  };

  const imagePlaceholderStyle: React.CSSProperties = {
    width: '100%',
    height: '180px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    fontSize: '48px',
    color: '#5a5a5a',
  };

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #2a2a2a',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    color: '#a0a0a0',
  };

  const valueStyle: React.CSSProperties = {
    color: '#e0e0e0',
    fontWeight: 500,
  };

  const chartContainerStyle: React.CSSProperties = {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
  };

  const chartTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#e0e0e0',
  };

  const barsContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100px',
    gap: '6px',
  };

  const barWrapperStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  };

  const barStyle = (height: number): React.CSSProperties => ({
    width: '100%',
    maxWidth: '32px',
    backgroundColor: height >= 20 ? '#52c41a' : height >= 10 ? '#faad14' : '#f5222d',
    borderRadius: '4px 4px 0 0',
    height: `${height}%`,
    minHeight: '4px',
    transition: 'height 0.3s ease',
  });

  const barLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#a0a0a0',
    marginTop: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #3a3a3a',
    backgroundColor: '#1a1a1a',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    textAlign: 'center',
  };

  const footerStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderTop: '1px solid #2a2a2a',
    display: 'flex',
    gap: '12px',
  };

  const maxSales = Math.max(...product.salesHistory, 1);
  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <>
      <div style={overlayStyle} onClick={handleClose} />
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#e0e0e0' }}>
            商品详情
          </h2>
          <button
            className="btn"
            style={closeBtnStyle}
            onClick={(e) => {
              createRipple(e);
              handleClose();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.color = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#a0a0a0';
            }}
          >
            ×
          </button>
        </div>
        <div style={contentStyle}>
          <div style={imagePlaceholderStyle}>📦</div>

          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#e0e0e0',
                marginBottom: '8px',
              }}
            >
              {product.name}
            </div>
            <div style={{ fontSize: '13px', color: '#a0a0a0' }}>
              {product.sku}
            </div>
          </div>

          <div style={infoRowStyle}>
            <span style={labelStyle}>类别</span>
            <span style={valueStyle}>{product.category}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>供应商</span>
            <span style={valueStyle}>{product.supplier}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>单价</span>
            <span style={valueStyle}>¥{product.price.toFixed(2)}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>当前库存</span>
            <span
              style={{
                ...valueStyle,
                color:
                  product.status === 'outOfStock'
                    ? '#f5222d'
                    : product.status === 'warning'
                    ? '#faad14'
                    : '#e0e0e0',
                fontWeight: 600,
              }}
            >
              {product.stock}
            </span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>状态</span>
            <span className={`status-tag status-${product.status}`}>
              {statusLabel[product.status]}
            </span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>预警阈值</span>
            {showThresholdInput ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  value={newThreshold}
                  onChange={(e) =>
                    setNewThreshold(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  style={inputStyle}
                />
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={handleSetThreshold}
                  disabled={loading}
                >
                  {loading ? '保存中...' : '确认'}
                </button>
              </div>
            ) : (
              <span style={valueStyle}>{product.threshold}</span>
            )}
          </div>

          <div style={chartContainerStyle}>
            <div style={chartTitleStyle}>近7天销售趋势</div>
            <div style={barsContainerStyle}>
              {product.salesHistory.map((sales, index) => (
                <div key={index} style={barWrapperStyle}>
                  <div
                    style={barStyle((sales / maxSales) * 100)}
                    title={`销量：${sales}`}
                  />
                  <span style={barLabelStyle}>周{dayLabels[index]}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#a0a0a0',
                textAlign: 'center',
              }}
            >
              周平均销量：
              {(
                product.salesHistory.reduce((a, b) => a + b, 0) /
                product.salesHistory.length
              ).toFixed(1)}
            </div>
          </div>
        </div>
        <div style={footerStyle}>
          {!showThresholdInput && (
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={(e) => {
                createRipple(e);
                setShowThresholdInput(true);
              }}
            >
              设置阈值
            </button>
          )}
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleGenerateRestock}
            disabled={loading}
          >
            {loading ? '生成中...' : '生成补货单'}
          </button>
        </div>
      </div>
    </>
  );
}

export default SidePanel;
