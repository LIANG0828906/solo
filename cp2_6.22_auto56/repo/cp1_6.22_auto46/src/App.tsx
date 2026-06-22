import React, { useState, useCallback } from 'react';
import { WindContext } from '@/context/WindContext';
import SceneView from '@/components/SceneView';
import ControlPanel from '@/components/ControlPanel';
import '@/styles.css';

export default function App() {
  const [windSpeed, setWindSpeed] = useState(5);
  const [windAngle, setWindAngle] = useState(0);

  const contextValue = useCallback(
    () => ({
      windSpeed,
      windAngle,
      setWindSpeed,
      setWindAngle,
    }),
    [windSpeed, windAngle]
  );

  return (
    <WindContext.Provider value={contextValue()}>
      <div className="app-layout">
        <SceneView windSpeed={windSpeed} windAngle={windAngle} />
        <ControlPanel />
      </div>
    </WindContext.Provider>
  );
}
