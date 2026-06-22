import { useState, useCallback, useEffect } from 'react';
import NodeEditor from './components/NodeEditor';
import LevelRenderer from './components/LevelRenderer';
import { RuleConfig } from './core/LevelGenerator';
import { LevelData, PathResult } from './core/PathFinder';

export interface Preset {
  id: string;
  name: string;
  config: RuleConfig;
  thumbnail: string;
}

export interface ValidationResult {
  results: {
    jumpPower: number;
    success: boolean;
    steps: number;
    coinsCollected: number;
    successRate: number;
  }[];
  overallSuccessRate: number;
  avgSteps: number;
}

function App() {
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>({});
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [splitRatio, setSplitRatio] = useState(0.6);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      const container = document.getElementById('app-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(Math.max(0.3, Math.min(0.75, ratio)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isMobile]);

  const handleGenerate = useCallback(async (config: RuleConfig) => {
    setRuleConfig(config);
    setValidationResult(null);
    setShowFireworks(false);
  }, []);

  const handleLevelGenerated = useCallback((level: LevelData, result: PathResult) => {
    setLevelData(level);
    setPathResult(result);
    if (result.success) {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 3000);
    }
  }, []);

  const handleValidate = useCallback(async (config: RuleConfig) => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (data.success) {
        setValidationResult({
          results: data.results,
          overallSuccessRate: data.overallSuccessRate,
          avgSteps: data.avgSteps,
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleSavePreset = useCallback((preset: Preset) => {
    setPresets(prev => {
      if (prev.length >= 5) {
        return [...prev.slice(1), preset];
      }
      return [...prev, preset];
    });
  }, []);

  const handleDeletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleReorderPresets = useCallback((fromIndex: number, toIndex: number) => {
    setPresets(prev => {
      const newPresets = [...prev];
      const [removed] = newPresets.splice(fromIndex, 1);
      newPresets.splice(toIndex, 0, removed);
      return newPresets;
    });
  }, []);

  const containerStyle: React.CSSProperties = isMobile
    ? { flexDirection: 'column' as const }
    : { flexDirection: 'row' as const };

  const leftStyle: React.CSSProperties = isMobile
    ? { height: '50%', width: '100%' }
    : { width: `${splitRatio * 100}%`, height: '100%' };

  const rightStyle: React.CSSProperties = isMobile
    ? { height: '50%', width: '100%' }
    : { width: `${(1 - splitRatio) * 100}%`, height: '100%' };

  return (
    <div
      id="app-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#1e1e2e',
        color: '#e0e0e0',
        ...containerStyle,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={leftStyle}>
        <NodeEditor
          ruleConfig={ruleConfig}
          onGenerate={handleGenerate}
          onValidate={handleValidate}
          onLevelGenerated={handleLevelGenerated}
          presets={presets}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          onReorderPresets={handleReorderPresets}
          isValidating={isValidating}
          validationResult={validationResult}
        />
      </div>

      {!isMobile && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            width: '6px',
            cursor: isResizing ? 'col-resize' : 'col-resize',
            backgroundColor: isResizing ? '#5865f2' : '#282840',
            transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '2px',
              height: '30px',
              backgroundColor: '#5865f2',
              borderRadius: '1px',
            }}
          />
        </div>
      )}

      <div style={rightStyle}>
        <LevelRenderer
          levelData={levelData}
          pathResult={pathResult}
          showFireworks={showFireworks}
        />
      </div>
    </div>
  );
}

export default App;
