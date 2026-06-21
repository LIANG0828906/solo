import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store, ComponentType } from './store/store';
import Navbar from './components/Navbar';
import Panel from './components/Panel';
import Canvas from './components/Canvas';
import EventLog from './components/EventLog';

const Shell: React.FC = () => {
  const canvasRef = React.useRef<HTMLDivElement | null>(null);

  const handleCanvasDrop = (type: ComponentType, x: number, y: number) => {
    const detail = { type, x, y };
    window.dispatchEvent(new CustomEvent('panel-drop', { detail }));
  };

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      // noop, 由Canvas组件自身消费
    };
    window.addEventListener('panel-drop' as any, handler as any);
    return () => window.removeEventListener('panel-drop' as any, handler as any);
  }, []);

  return (
    <div className="app-root">
      <Navbar />
      <div className="app-body">
        <Panel onCanvasDrop={handleCanvasDrop} />
        <Canvas canvasRef={canvasRef} />
        <EventLog />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Shell />
    </Provider>
  );
};

export default App;
