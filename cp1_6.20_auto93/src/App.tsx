import { useState, useEffect, useCallback } from 'react';
import { ModelList } from './components/ModelList';
import { SceneViewer } from './components/SceneViewer';
import { ControlPanel } from './components/ControlPanel';
import { MODEL_LIST, DEFAULT_MODEL_ID } from './data/models';
import { MaterialConfig, EnvironmentPreset, LoadingState } from './types';
import { LoadProgress } from './utils/modelLoader';
import './App.css';

const DEFAULT_MATERIAL: MaterialConfig = {
  color: '#e94560',
  opacity: 1,
  metalness: 0.3,
  roughness: 0.6,
  emissiveIntensity: 0,
  useEnvMap: false,
};

function App() {
  const [currentModelId, setCurrentModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [materialConfig, setMaterialConfig] = useState<MaterialConfig>(DEFAULT_MATERIAL);
  const [envPreset, setEnvPreset] = useState<EnvironmentPreset>('solid_gray');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transitionKey, setTransitionKey] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileListOpen, setMobileListOpen] = useState<boolean>(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState<boolean>(false);
  const [useProcedural, setUseProcedural] = useState<boolean>(true);

  const currentModel = MODEL_LIST.find((m) => m.id === currentModelId) || MODEL_LIST[0];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (useProcedural) {
      setLoadingState('success');
      setLoadProgress(null);
      setLoadError(null);
    }
  }, [useProcedural]);

  const handleSelectModel = useCallback((modelId: string) => {
    if (modelId === currentModelId) return;
    setCurrentModelId(modelId);
    setTransitionKey((k) => k + 1);
    setMobileListOpen(false);
    
    if (useProcedural) {
      setLoadingState('success');
    } else {
      setLoadingState('loading');
      setLoadProgress(null);
      setLoadError(null);
    }
  }, [currentModelId, useProcedural]);

  const handleLoadProgress = useCallback((progress: LoadProgress) => {
    setLoadProgress(progress);
  }, []);

  const handleLoadError = useCallback((error: Error) => {
    setLoadingState('error');
    setLoadError(error.message);
  }, []);

  const handleLoadComplete = useCallback(() => {
    setLoadingState('success');
    setLoadProgress(null);
  }, []);

  const handleRetry = useCallback(() => {
    setTransitionKey((k) => k + 1);
    setLoadingState('loading');
    setLoadProgress(null);
    setLoadError(null);
  }, []);

  const handleMaterialChange = useCallback((config: MaterialConfig) => {
    setMaterialConfig(config);
  }, []);

  const handleEnvPresetChange = useCallback((preset: EnvironmentPreset) => {
    setEnvPreset(preset);
  }, []);

  return (
    <div className="app-container">
      {isMobile && mobileListOpen && (
        <div className="mobile-overlay" onClick={() => setMobileListOpen(false)} />
      )}
      
      {isMobile && mobileListOpen && (
        <div className="mobile-drawer left">
          <ModelList
            models={MODEL_LIST}
            currentModelId={currentModelId}
            onSelectModel={handleSelectModel}
            isCollapsed={false}
          />
        </div>
      )}

      {!isMobile && (
        <ModelList
          models={MODEL_LIST}
          currentModelId={currentModelId}
          onSelectModel={handleSelectModel}
          isCollapsed={false}
        />
      )}

      <div className="scene-container">
        {isMobile && (
          <div className="mobile-top-bar">
            <button className="mobile-menu-btn" onClick={() => setMobileListOpen(true)}>
              ☰
            </button>
            <span className="mobile-title">3D 模型展厅</span>
            <div style={{ width: 40 }} />
          </div>
        )}
        <SceneViewer
          modelId={currentModelId}
          modelSrc={currentModel.src}
          materialConfig={materialConfig}
          envPreset={envPreset}
          loadingState={loadingState}
          loadProgress={loadProgress}
          loadError={loadError}
          onLoadProgress={handleLoadProgress}
          onLoadError={handleLoadError}
          onLoadComplete={handleLoadComplete}
          onRetry={handleRetry}
          transitionKey={transitionKey}
          useProcedural={useProcedural}
        />
        <div className="scene-info">
          <span className="model-name-display">{currentModel.name}</span>
        </div>
      </div>

      {isMobile && mobilePanelOpen && (
        <div className="mobile-overlay" onClick={() => setMobilePanelOpen(false)} />
      )}

      {!isMobile && (
        <ControlPanel
          materialConfig={materialConfig}
          envPreset={envPreset}
          onMaterialChange={handleMaterialChange}
          onEnvPresetChange={handleEnvPresetChange}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      )}

      {isMobile && mobilePanelOpen && (
        <div className="mobile-drawer right">
          <ControlPanel
            materialConfig={materialConfig}
            envPreset={envPreset}
            onMaterialChange={handleMaterialChange}
            onEnvPresetChange={handleEnvPresetChange}
            isCollapsed={false}
            onToggleCollapse={() => setMobilePanelOpen(false)}
          />
        </div>
      )}

      {isMobile && !mobilePanelOpen && (
        <button
          className="floating-panel-btn"
          onClick={() => setMobilePanelOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default App;
