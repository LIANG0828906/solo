import React from 'react';
import ControlPanel from './components/ControlPanel';
import CardPreview from './components/CardPreview';
import ResizableDivider from './components/ResizableDivider';
import { usePreviewWidth } from './store/useCardStore';

const App: React.FC = () => {
  const previewWidth = usePreviewWidth();

  return (
    <div className="app-container">
      <div className="app-layout">
        <div className="left-panel">
          <ControlPanel />
        </div>
        
        <ResizableDivider />
        
        <div className="right-panel">
          <div className="preview-area">
            <div 
              className="preview-container"
              style={{ width: `${previewWidth}px` }}
            >
              <CardPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
