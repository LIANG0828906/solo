import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FunctionPlotter from './components/FunctionPlotter';
import ControlPanel from './components/ControlPanel';
import { FunctionConfig, ViewTransform } from './types';
import { DEFAULT_FUNCTIONS } from './utils/mathParser';
import './styles/App.css';

const App: React.FC = () => {
  const [functions, setFunctions] = useState<FunctionConfig[]>(() =>
    DEFAULT_FUNCTIONS.map((f) => ({
      id: uuidv4(),
      expression: f.expression,
      color: f.color,
      amplitude: 1,
      frequency: 1,
      phase: 0,
      visible: true,
    }))
  );

  const [viewTransform, setViewTransform] = useState<ViewTransform>({
    offsetX: 0,
    offsetY: 0,
    scale: 50,
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleFunctionsChange = useCallback((newFunctions: FunctionConfig[]) => {
    setFunctions(newFunctions);
  }, []);

  const handleViewTransformChange = useCallback((transform: ViewTransform) => {
    setViewTransform(transform);
  }, []);

  const handleMobileToggle = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="title-wrapper">
          <h1 className="app-title">
            <span className="title-gradient">数学函数动态绘图</span>
            <span className="title-sub">探索器</span>
          </h1>
        </div>
      </header>

      <main className="main-content">
        <div className="plotter-area">
          <FunctionPlotter
            functions={functions}
            viewTransform={viewTransform}
            onViewTransformChange={handleViewTransformChange}
          />
        </div>

        <ControlPanel
          functions={functions}
          onFunctionsChange={handleFunctionsChange}
          isMobileOpen={isMobileOpen}
          onMobileToggle={handleMobileToggle}
        />
      </main>
    </div>
  );
};

export default App;
