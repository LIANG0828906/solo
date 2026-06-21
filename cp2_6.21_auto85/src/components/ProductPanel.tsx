import { useState } from 'react';
import {
  LIPSTICK_PRODUCTS,
  EYESHADOW_PRODUCTS,
  BLUSH_PRODUCTS,
  type CategoryTab,
  type LipstickProduct,
  type EyeshadowProduct,
  type BlushProduct,
} from '../types';
import './ProductPanel.css';

interface ProductPanelProps {
  selectedLipstick: LipstickProduct | null;
  selectedEyeshadow: EyeshadowProduct | null;
  selectedBlush: BlushProduct | null;
  onSelectLipstick: (product: LipstickProduct | null) => void;
  onSelectEyeshadow: (product: EyeshadowProduct | null) => void;
  onSelectBlush: (product: BlushProduct | null) => void;
  isCollapsed?: boolean;
}

export function ProductPanel({
  selectedLipstick,
  selectedEyeshadow,
  selectedBlush,
  onSelectLipstick,
  onSelectEyeshadow,
  onSelectBlush,
  isCollapsed = false,
}: ProductPanelProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('lipstick');

  const renderLipstickColors = () => (
    <div className="color-grid">
      {LIPSTICK_PRODUCTS.map((product) => (
        <button
          key={product.id}
          className={`color-card ${selectedLipstick?.id === product.id ? 'selected' : ''}`}
          onClick={() =>
            onSelectLipstick(selectedLipstick?.id === product.id ? null : product)
          }
          title={product.name}
        >
          <div
            className="color-circle"
            style={{ backgroundColor: product.color }}
          />
          <span className="color-name">{product.name}</span>
        </button>
      ))}
    </div>
  );

  const renderEyeshadowColors = () => (
    <div className="color-grid">
      {EYESHADOW_PRODUCTS.map((product) => (
        <button
          key={product.id}
          className={`color-card ${selectedEyeshadow?.id === product.id ? 'selected' : ''}`}
          onClick={() =>
            onSelectEyeshadow(selectedEyeshadow?.id === product.id ? null : product)
          }
          title={product.name}
        >
          <div
            className="color-circle"
            style={{ backgroundColor: product.color }}
          />
          <span className="color-name">{product.name}</span>
        </button>
      ))}
    </div>
  );

  const renderBlushColors = () => (
    <div className="color-grid">
      {BLUSH_PRODUCTS.map((product) => (
        <button
          key={product.id}
          className={`color-card ${selectedBlush?.id === product.id ? 'selected' : ''}`}
          onClick={() =>
            onSelectBlush(selectedBlush?.id === product.id ? null : product)
          }
          title={product.name}
        >
          <div
            className="color-circle"
            style={{ backgroundColor: product.color }}
          />
          <span className="color-name">{product.name}</span>
        </button>
      ))}
    </div>
  );

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="product-panel">
      <h3 className="panel-title">产品选择</h3>

      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === 'lipstick' ? 'active' : ''}`}
          onClick={() => setActiveTab('lipstick')}
        >
          口红
        </button>
        <button
          className={`tab-btn ${activeTab === 'eyeshadow' ? 'active' : ''}`}
          onClick={() => setActiveTab('eyeshadow')}
        >
          眼影
        </button>
        <button
          className={`tab-btn ${activeTab === 'blush' ? 'active' : ''}`}
          onClick={() => setActiveTab('blush')}
        >
          腮红
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'lipstick' && renderLipstickColors()}
        {activeTab === 'eyeshadow' && renderEyeshadowColors()}
        {activeTab === 'blush' && renderBlushColors()}
      </div>
    </div>
  );
}
