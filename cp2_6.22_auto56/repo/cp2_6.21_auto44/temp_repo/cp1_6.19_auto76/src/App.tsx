import { useState, useRef, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { FaArrowDown, FaLayerGroup } from 'react-icons/fa';
import type { MutableRefObject } from 'react';
import UndergroundScene, {
  type PipelineData as ScenePipelineData,
  type LayerData,
} from './Scenes/UndergroundScene';
import ControlPanel from './components/ControlPanel';
import PipelineDetail, { type PipelineDetailData } from './components/PipelineDetail';
import {
  PIPELINES,
  SOIL_LAYERS,
  PIPELINE_COLORS,
  PIPELINE_NAMES,
  type Pipeline,
  type PipelineType,
} from './Data/undergroundData';

export interface PipelineFilters {
  water: boolean;
  drain: boolean;
  gas: boolean;
  power: boolean;
  telecom: boolean;
}

const mapPipelineToScene = (p: Pipeline): ScenePipelineData => ({
  id: p.id,
  name: p.name,
  material: p.material,
  depth: (p.depthRange.min + p.depthRange.max) / 2,
  color: PIPELINE_COLORS[p.type],
  radius: p.diameter / 2,
  points: p.points.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z })),
  visible: true,
});

const mapLayersToScene = (): LayerData[] =>
  SOIL_LAYERS.map((layer) => ({
    name: layer.name,
    color: layer.color,
    yStart: layer.depthStart,
    yEnd: layer.depthEnd,
  }));

const mapPipelineToDetail = (p: Pipeline): PipelineDetailData => ({
  id: p.id,
  type: p.type,
  name: p.name,
  material: p.material,
  installYear: p.installedYear,
  totalLength: p.totalLength,
  lastInspection: p.lastInspection,
  status: p.status,
});

const App = () => {
  const [currentDepth, setCurrentDepth] = useState<number>(5);
  const [pipelineFilters, setPipelineFilters] = useState<PipelineFilters>({
    water: true,
    drain: true,
    gas: true,
    power: true,
    telecom: true,
  });
  const [hoveredPipelineId, setHoveredPipelineId] = useState<string | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  const cameraResetRef = useRef<(() => void) | null>(null);

  const sceneLayers = useMemo(() => mapLayersToScene(), []);

  const scenePipelines = useMemo(() => {
    return PIPELINES.map((p) => {
      const mapped = mapPipelineToScene(p);
      mapped.visible = pipelineFilters[p.type];
      return mapped;
    });
  }, [pipelineFilters]);

  const selectedPipeline = useMemo(() => {
    if (!selectedPipelineId) return null;
    const p = PIPELINES.find((p) => p.id === selectedPipelineId);
    return p ? mapPipelineToDetail(p) : null;
  }, [selectedPipelineId]);

  const handleDepthChange = useCallback((depth: number) => {
    setCurrentDepth(depth);
  }, []);

  const handleFilterChange = useCallback((type: PipelineType, value: boolean) => {
    setPipelineFilters((prev) => ({ ...prev, [type]: value }));
  }, []);

  const handleHoveredChange = useCallback((id: string | null) => {
    setHoveredPipelineId(id);
  }, []);

  const handleSelectedChange = useCallback((id: string | null) => {
    setSelectedPipelineId(id);
    if (id) {
      const p = PIPELINES.find((p) => p.id === id);
      if (p) {
        toast.success(`已选中管线: ${p.name}`);
      }
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    if (cameraResetRef.current) {
      cameraResetRef.current();
      toast('视角已重置', { icon: '🎯' });
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPipelineId(null);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', position: 'relative' }}>
          <FaLayerGroup color="white" size={40} />
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 14,
            }}
          >
            <FaArrowDown color="white" size={16} />
          </div>
        </div>
        <h1
          style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            letterSpacing: 2,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          地下侦探
        </h1>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 32,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 500,
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          当前深度: {currentDepth.toFixed(1)} m
        </div>
      </div>

      <UndergroundScene
        maxDepth={currentDepth}
        pipelines={scenePipelines}
        layers={sceneLayers}
        hoveredId={hoveredPipelineId}
        setHoveredId={handleHoveredChange}
        selectedId={selectedPipelineId}
        setSelectedId={handleSelectedChange}
        cameraResetRef={cameraResetRef as MutableRefObject<(() => void) | null>}
      />

      <ControlPanel
        currentDepth={currentDepth}
        onDepthChange={handleDepthChange}
        pipelineFilters={pipelineFilters}
        onFilterChange={handleFilterChange}
        onResetCamera={handleResetCamera}
      />

      {selectedPipeline && (
        <PipelineDetail pipeline={selectedPipeline} onClose={handleCloseDetail} />
      )}

      <Toaster
        position="top-center"
        gutter={12}
        toastOptions={{
          duration: 2000,
          style: {
            background: 'rgba(30, 30, 50, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;
