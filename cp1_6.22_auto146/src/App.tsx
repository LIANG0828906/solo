import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import ControlPanel from './ControlPanel';
import TimeLine from './TimeLine';
import {
  loadModel,
  forwardPass,
  generateTestImages,
  type InferenceResult,
  type ModelWeights
} from './inferenceEngine';
import {
  FeatureMapRenderer,
  type VertexInfo
} from './featureMapRenderer';

const App: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FeatureMapRenderer | null>(null);

  const [modelName, setModelName] = useState<string>('lenet5');
  const [model, setModel] = useState<ModelWeights | null>(null);
  const [testImages, setTestImages] = useState<{
    images: Float32Array[];
    labels: number[];
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isInferencing, setIsInferencing] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [selectedVertex, setSelectedVertex] = useState<VertexInfo | null>(null);
  const [labelAnim, setLabelAnim] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const lastRunIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const m = loadModel();
    const t = generateTestImages();
    setModel(m);
    setTestImages(t);
  }, []);

  useEffect(() => {
    if (!sceneRef.current || rendererRef.current) return;
    const r = new FeatureMapRenderer(sceneRef.current);
    r.onVertexClick((info) => {
      if (info === null) {
        setSelectedVertex(null);
        setLabelAnim(false);
      } else {
        setSelectedVertex(info);
        requestAnimationFrame(() => setLabelAnim(true));
      }
    });
    rendererRef.current = r;
    return () => {
      r.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedVertex(null);
        setLabelAnim(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const runInference = useCallback(
    async (imageIdx: number) => {
      if (!model || !testImages || !rendererRef.current) return;
      if (imageIdx < 0 || imageIdx >= testImages.images.length) return;

      setIsInferencing(true);
      try {
        await new Promise((res) => setTimeout(res, 15));
        const image = testImages.images[imageIdx];
        const infResult = forwardPass(image, model);
        setResult(infResult);
        setHasRun(true);
        lastRunIndexRef.current = imageIdx;

        const r = rendererRef.current;
        if (lastRunIndexRef.current === imageIdx || r) {
          if (!hasRun) {
            r.renderLayer(infResult.layers);
          } else {
            await r.updateAll(infResult.layers, 600);
          }
        }
      } catch (e) {
        console.error('Inference error:', e);
      } finally {
        setIsInferencing(false);
      }
    },
    [model, testImages, hasRun]
  );

  useEffect(() => {
    if (selectedVertex) {
      setLabelAnim(false);
      requestAnimationFrame(() => setLabelAnim(true));
    }
  }, [selectedVertex?.layerIndex, selectedVertex?.channel, selectedVertex?.position.x, selectedVertex?.position.y]);

  const handleForward = () => {
    setSelectedVertex(null);
    setLabelAnim(false);
    runInference(currentIndex);
  };

  const handleIndexChange = (idx: number) => {
    setCurrentIndex(idx);
  };

  const handleChangeCommitted = (idx: number) => {
    if (!hasRun) return;
    if (!model || !testImages) return;
    setSelectedVertex(null);
    setLabelAnim(false);
    runInference(idx);
  };

  const labelScreenPos = (() => {
    if (!selectedVertex || !sceneRef.current) return null;
    try {
      const cam = (rendererRef.current as any)?.camera;
      if (!cam) return null;
      const THREE = (FeatureMapRenderer as any)._THREE;
    } catch {}
    return null;
  })();

  const trueLabel = testImages ? testImages.labels[currentIndex] : currentIndex;
  const currentImg = testImages ? testImages.images[currentIndex] : null;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        color: '#E0E0E0',
        fontFamily: "'Segoe UI', 'JetBrains Mono', sans-serif"
      }}
    >
      {isMobile && (
        <div style={mobileHeaderStyle}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: '15px' }}>
            <span style={{ color: '#E94560' }}>Feature</span>Viz Pro
          </div>
          <button
            onClick={() => setMobileMenuOpen((s) => !s)}
            style={mobileMenuBtn}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: 0,
          position: 'relative'
        }}
      >
        {!isMobile && testImages && (
          <ControlPanel
            modelName={modelName}
            onModelChange={setModelName}
            onForward={handleForward}
            isInferencing={isInferencing}
            trueLabel={trueLabel}
            prediction={result !== null ? result.prediction : null}
            confidence={result !== null ? result.confidence : null}
            hasRun={hasRun}
          />
        )}

        {isMobile && mobileMenuOpen && testImages && (
          <div style={mobileOverlayStyle}>
            <div style={{ ...mobilePanelStyle, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
              <ControlPanel
                modelName={modelName}
                onModelChange={(n) => {
                  setModelName(n);
                }}
                onForward={() => {
                  handleForward();
                  setMobileMenuOpen(false);
                }}
                isInferencing={isInferencing}
                trueLabel={trueLabel}
                prediction={result !== null ? result.prediction : null}
                confidence={result !== null ? result.confidence : null}
                hasRun={hasRun}
              />
            </div>
          </div>
        )}

        <div
          ref={sceneRef}
          style={{
            flex: 1,
            position: 'relative',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
            background: '#1A1A2E'
          }}
          onClick={(e) => {
            if (e.target === sceneRef.current || (e.target as HTMLElement).tagName === 'CANVAS') {
              // renderer handles click internally; only ensure we don't block it
            }
          }}
        >
          {!hasRun && (
            <div style={placeholderStyle}>
              <div style={placeholderInner}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  opacity: 0.7
                }}>
                  🔬
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#E0E0E0'
                }}>
                  等待推理
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#8080A0',
                  maxWidth: '320px',
                  textAlign: 'center',
                  lineHeight: 1.6
                }}>
                  点击左侧「<span style={{ color: '#4FC3F7' }}>▶ 前向传播</span>」按钮
                  <br />
                  运行LeNet-5模型并查看四层特征图可视化
                </div>
              </div>
            </div>
          )}

          {selectedVertex && (
            <VertexLabel
              info={selectedVertex}
              visible={labelAnim}
              containerRef={sceneRef}
              getRenderer={() => rendererRef.current}
            />
          )}
        </div>
      </div>

      {testImages && (
        <TimeLine
          currentIndex={currentIndex}
          totalImages={testImages.images.length}
          onIndexChange={handleIndexChange}
          onChangeCommitted={handleChangeCommitted}
          currentImage={currentImg}
          labels={testImages.labels}
        />
      )}
    </div>
  );
};

interface VertexLabelProps {
  info: VertexInfo;
  visible: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  getRenderer: () => FeatureMapRenderer | null;
}

const VertexLabel: React.FC<VertexLabelProps> = ({ info, visible, containerRef, getRenderer }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const computePos = () => {
      const container = containerRef.current;
      const r = getRenderer();
      if (!container) {
        setPos(null);
        return;
      }
      const rect = container.getBoundingClientRect();
      let screen: { x: number; y: number } | null = null;
      if (r) {
        screen = r.worldToScreen(info.worldPos.x, info.worldPos.y, info.worldPos.z);
      }
      let sx: number, sy: number;
      if (screen) {
        sx = Math.min(rect.width - 150, Math.max(20, screen.x + 20));
        sy = Math.min(rect.height - 90, Math.max(20, screen.y - 20));
      } else {
        sx = Math.min(rect.width - 140, Math.max(20, rect.width * 0.5));
        sy = Math.min(rect.height - 100, Math.max(20, rect.height * 0.4));
      }
      setPos({ x: sx, y: sy });
    };
    computePos();
    const iv = setInterval(computePos, 100);
    return () => clearInterval(iv);
  }, [info, containerRef, getRenderer]);

  if (!pos) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        background: 'rgba(255, 255, 255, 0.95)',
        color: '#1A1A2E',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500,
        lineHeight: 1.7,
        zIndex: 1000,
        pointerEvents: 'none',
        transform: visible ? 'scale(1)' : 'scale(0.8)',
        transformOrigin: 'top left',
        transition: 'transform 0.15s ease-out, opacity 0.15s',
        opacity: visible ? 1 : 0,
        whiteSpace: 'nowrap',
        border: '1px solid rgba(233, 69, 96, 0.3)'
      }}
    >
      <div style={{ color: '#E94560', fontWeight: 700, fontSize: '10px', letterSpacing: '1px', marginBottom: '3px' }}>
        ◆ FEATURE POINT
      </div>
      <div>Ch:&nbsp;<span style={{ color: '#0F3460', fontWeight: 700 }}>{info.channel}</span></div>
      <div>Pos:&nbsp;<span style={{ color: '#0F3460', fontWeight: 700 }}>({info.position.x}, {info.position.y})</span></div>
      <div>Val:&nbsp;<span style={{ color: '#E94560', fontWeight: 700 }}>{info.value.toFixed(4)}</span></div>
      <div style={{
        marginTop: '5px',
        paddingTop: '5px',
        borderTop: '1px solid rgba(15, 52, 96, 0.15)',
        fontSize: '10px',
        color: '#606080',
        letterSpacing: '0.5px'
      }}>
        Layer {info.layerIndex + 1} · ESC 关闭
      </div>
    </div>
  );
};

const placeholderStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: 5
};

const placeholderInner: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '32px 48px',
  background: 'rgba(22, 33, 62, 0.6)',
  backdropFilter: 'blur(8px)',
  border: '1px solid #2A2A4E',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
};

const mobileHeaderStyle: React.CSSProperties = {
  height: '60px',
  minHeight: '60px',
  background: '#16213E',
  borderBottom: '2px solid #2A2A4E',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  color: '#E0E0E0',
  fontFamily: "'Segoe UI', sans-serif"
};

const mobileMenuBtn: React.CSSProperties = {
  background: '#0F3460',
  color: '#E0E0E0',
  border: '1.5px solid #2A2A4E',
  borderRadius: '6px',
  width: '40px',
  height: '40px',
  fontSize: '18px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const mobileOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 50,
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(4px)',
  padding: '12px'
};

const mobilePanelStyle: React.CSSProperties = {
  background: '#16213E',
  border: '2px solid #2A2A4E',
  borderRadius: '10px',
  overflow: 'hidden'
};

export default App;
