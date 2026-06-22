import React, { useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { ParameterPanel } from './components/ParameterPanel';
import { CloudParams, CloudStatus, DEFAULT_PARAMS } from './types';

const App: React.FC = () => {
  const [params, setParams] = useState<CloudParams>(DEFAULT_PARAMS);
  const [status, setStatus] = useState<CloudStatus>('generating');
  const [rainProbability, setRainProbability] = useState(0);

  const handleParamsChange = useCallback((newParams: CloudParams) => {
    setParams(newParams);
  }, []);

  const handleStatusUpdate = useCallback((newStatus: string, probability: number) => {
    setStatus(newStatus as CloudStatus);
    setRainProbability(probability);
  }, []);

  return (
    <div className="app-container">
      <Scene params={params} onStatusUpdate={handleStatusUpdate} />
      <ParameterPanel
        params={params}
        onParamsChange={handleParamsChange}
        status={status}
        rainProbability={rainProbability}
      />
    </div>
  );
};

export default App;
