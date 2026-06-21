import { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import TreeScene from './treeScene';
import ControlPanel from './controlPanel';
import { TreeParams } from './treeModel';

function App() {
  const [params, setParams] = useState<TreeParams>({
    lightIntensity: 1.0,
    waterAmount: 0.5,
    nutrientAmount: 0.5,
    growthSpeed: 1.0,
  });

  const handleParamsChange = useCallback((newParams: TreeParams) => {
    setParams(newParams);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          position: 'relative',
          minWidth: 0,
        }}
      >
        <TreeScene params={params} />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          maxHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <ControlPanel params={params} onChange={handleParamsChange} />
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
