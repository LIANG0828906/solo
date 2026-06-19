import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { CARD_TEMPLATES, type CardType } from '../types/card';
import { useCardType, useStyleParams, useCardActions } from '../store/useCardStore';

const ControlPanel: React.FC = React.memo(() => {
  const currentCardType = useCardType();
  const styleParams = useStyleParams();
  const { setCardType, setBorderRadius, setShadowIntensity } = useCardActions();

  const handleCardTypeChange = useCallback((type: CardType) => {
    setCardType(type);
  }, [setCardType]);

  const handleBorderRadiusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setBorderRadius(value);
  }, [setBorderRadius]);

  const handleShadowIntensityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setShadowIntensity(value);
  }, [setShadowIntensity]);

  const cardTypes: CardType[] = ['info', 'product', 'person', 'milestone'];

  return (
    <div className="control-panel">
      <h2 className="panel-title">卡片模板</h2>
      
      <div className="template-buttons">
        {cardTypes.map((type) => {
          const template = CARD_TEMPLATES[type];
          const isActive = currentCardType === type;
          
          return (
            <motion.button
              key={type}
              className={`template-btn ${isActive ? 'active' : ''}`}
              style={{
                '--primary-color': template.primaryColor,
                backgroundColor: isActive ? template.bgColor : 'transparent',
                borderColor: isActive ? template.primaryColor : 'transparent',
              } as React.CSSProperties}
              onClick={() => handleCardTypeChange(type)}
              whileHover={{ backgroundColor: isActive ? template.bgColor : '#F5F5F5' }}
              transition={{ duration: 0.2 }}
            >
              <span 
                className="color-dot" 
                style={{ backgroundColor: template.primaryColor }}
              />
              {template.name}
            </motion.button>
          );
        })}
      </div>

      <div className="slider-section">
        <div className="slider-label">
          <span>圆角半径</span>
          <span className="slider-value">{styleParams.borderRadius}px</span>
        </div>
        <input
          type="range"
          min="8"
          max="32"
          step="2"
          value={styleParams.borderRadius}
          onChange={handleBorderRadiusChange}
          className="slider"
        />
      </div>

      <div className="slider-section">
        <div className="slider-label">
          <span>阴影强度</span>
          <span className="slider-value">{styleParams.shadowIntensity}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={styleParams.shadowIntensity}
          onChange={handleShadowIntensityChange}
          className="slider"
        />
      </div>
    </div>
  );
});

ControlPanel.displayName = 'ControlPanel';

export default ControlPanel;
