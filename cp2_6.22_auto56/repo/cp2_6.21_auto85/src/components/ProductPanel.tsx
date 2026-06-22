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

  const renderColorCard = (
    product: { id: string; name: string; color: string },
    isSelected: boolean,
    onClick: () => void,
  ) => (
    <button
      key={product.id}
      className={`color-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      title={product.name}
    >
      <div className="color-swatch-wrapper">
        <div
          className="color-swatch"
          style={{
            background: `linear-gradient(135deg, ${product.color} 0%, ${product.color}dd 100%)`,
          }}
        >
          <div className="swatch-highlight" />
          {isSelected && (
            <div className="checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
        <div
          className="color-stripe"
          style={{ backgroundColor: product.color }}
        />
      </div>
      <span className="color-name">{product.name}</span>
    </button>
  );

  const renderLipstickColors = () => (
    <div className="color-grid">
      {LIPSTICK_PRODUCTS.map((product) =>
        renderColorCard(
          product,
          selectedLipstick?.id === product.id,
          () => onSelectLipstick(selectedLipstick?.id === product.id ? null : product),
        ),
      )}
    </div>
  );

  const renderEyeshadowColors = () => (
    <div className="color-grid">
      {EYESHADOW_PRODUCTS.map((product) =>
        renderColorCard(
          product,
          selectedEyeshadow?.id === product.id,
          () => onSelectEyeshadow(selectedEyeshadow?.id === product.id ? null : product),
        ),
      )}
    </div>
  );

  const renderBlushColors = () => (
    <div className="color-grid">
      {BLUSH_PRODUCTS.map((product) =>
        renderColorCard(
          product,
          selectedBlush?.id === product.id,
          () => onSelectBlush(selectedBlush?.id === product.id ? null : product),
        ),
      )}
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
