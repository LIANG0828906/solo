import { useState, useCallback, useEffect } from 'react';
import { SceneManager } from './SceneManager';
import { UIOverlay } from './UIOverlay';
import { useDataProvider } from './DataProvider';
import type { SelectedDataDetail } from './types';

export default function App() {
  const dataProvider = useDataProvider();
  const [selectedDetail, setSelectedDetail] = useState<SelectedDataDetail | null>(null);
  const [cameraPresetIndex, setCameraPresetIndex] = useState<number | null>(null);

  useEffect(() => {
    dataProvider.loadMockData();
  }, []);

  const handleSelectPoint = useCallback((detail: SelectedDataDetail | null) => {
    setSelectedDetail(detail);
  }, []);

  const handleCameraPreset = useCallback((index: number) => {
    setCameraPresetIndex(index);
  }, []);

  const handleCameraAnimationComplete = useCallback(() => {
    setCameraPresetIndex(null);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <SceneManager
        dataSlice={dataProvider.currentDataSlice}
        onSelectPoint={handleSelectPoint}
        selectedIndex={selectedDetail?.point.index ?? null}
        cameraPresetIndex={cameraPresetIndex}
        onCameraAnimationComplete={handleCameraAnimationComplete}
      />
      <UIOverlay
        loadingState={dataProvider.loadingState}
        currentTimestamp={dataProvider.currentTimestamp}
        timeProgress={dataProvider.timeProgress}
        totalTimeSteps={dataProvider.totalTimeSteps}
        currentTimeIndex={dataProvider.currentTimeIndex}
        dataSourceType={dataProvider.dataSourceType}
        selectedDetail={selectedDetail}
        onLoadMock={dataProvider.loadMockData}
        onUploadCSV={dataProvider.triggerFileInput}
        onTimeChange={dataProvider.setTimeProgress}
        onCameraPreset={handleCameraPreset}
        onCloseDetail={() => setSelectedDetail(null)}
      />
    </div>
  );
}
