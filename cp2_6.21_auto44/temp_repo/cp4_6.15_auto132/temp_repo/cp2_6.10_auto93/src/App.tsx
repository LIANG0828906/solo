import React, { useState, useCallback } from 'react';
import StarMap from './StarMap';
import {
  ConstellationSidebar,
  ConstellationInfo,
  StarTableBar,
  FlashEffect,
  StampEffect,
  CandleHolder
} from './UIComponents';

const App: React.FC = () => {
  const [showFlash, setShowFlash] = useState(false);
  const [showStamp, setShowStamp] = useState(false);

  const handleSaveAsScroll = useCallback(async () => {
    setShowFlash(true);
    
    setTimeout(() => {
      setShowFlash(false);
      setShowStamp(true);
    }, 300);
    
    setTimeout(() => {
      setShowStamp(false);
    }, 2000);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        console.log('Saved image as base64 (first 100 chars):', dataUrl.substring(0, 100) + '...');
        
        const link = document.createElement('a');
        link.download = `dunhuang-star-map-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Failed to save image:', error);
      }
    }
  }, []);

  return (
    <div className="app-container">
      <div className="canvas-container">
        <StarMap />
      </div>
      
      <ConstellationSidebar />
      
      <ConstellationInfo />
      
      <CandleHolder />
      
      <StarTableBar onSave={handleSaveAsScroll} />
      
      <FlashEffect show={showFlash} />
      <StampEffect show={showStamp} />
      
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          textAlign: 'center'
        }}
      >
        <h1
          style={{
            color: '#f5e6c8',
            fontSize: '28px',
            fontFamily: '"KaiTi", "STKaiti", serif',
            letterSpacing: '8px',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(255, 215, 0, 0.3)',
            margin: 0,
            fontWeight: 'normal'
          }}
        >
          敦煌星图交互可视卷
        </h1>
        <p
          style={{
            color: '#c9a66b',
            fontSize: '13px',
            fontFamily: '"KaiTi", "STKaiti", serif',
            letterSpacing: '2px',
            marginTop: '6px',
            textShadow: '1px 1px 4px rgba(0,0,0,0.6)'
          }}
        >
          S.3326 · 唐 · 二十八宿星象
        </p>
      </div>
      
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 20,
          color: '#8b7355',
          fontSize: '12px',
          fontFamily: '"KaiTi", "STKaiti", serif',
          textAlign: 'right',
          lineHeight: '1.8'
        }}
      >
        <div>🖱️ 拖拽旋转 · 滚轮缩放</div>
        <div>⇧ Shift + 点击 添加星点</div>
        <div>点击左侧宿名查看详情</div>
      </div>
    </div>
  );
};

export default App;
