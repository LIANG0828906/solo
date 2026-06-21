import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import { AnimationPreview } from './animationPreview';
import { generateBezier, generateSpring, cubicBezierValue, springValue } from './curveEngine';
import { generateCssCode, copyToClipboard, downloadCssFile } from './exportUtils';
import type {
  BezierEditorState,
  SpringEditorState,
  KeyframeConfig,
  Keyframe,
  CurveType,
  PreviewState,
  ControlPoint
} from './types';

type PanelKey = 'bezier' | 'spring' | 'keyframes';

const DEFAULT_BEZIER: BezierEditorState = {
  p1: { x: 0.25, y: 0.1 },
  p2: { x: 0.25, y: 1.0 }
};

const DEFAULT_SPRING: SpringEditorState = {
  mass: 1,
  stiffness: 170,
  damping: 26
};

const DEFAULT_KEYFRAMES: KeyframeConfig = {
  name: 'customAnimation',
  duration: 1500,
  keyframes: [
    {
      percentage: 0,
      properties: { translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1 }
    },
    {
      percentage: 100,
      properties: { translateX: 100, translateY: 0, scale: 1.5, rotate: 360, opacity: 0.8 }
    }
  ]
};

const App: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelKey>('bezier');
  const [curveType, setCurveType] = useState<CurveType>('bezier');
  const [targetPreview, setTargetPreview] = useState<'A' | 'B'>('A');

  const [bezierState, setBezierState] = useState<BezierEditorState>(DEFAULT_BEZIER);
  const [springState, setSpringState] = useState<SpringEditorState>(DEFAULT_SPRING);
  const [keyframesConfig, setKeyframesConfig] = useState<KeyframeConfig>(cloneDeep(DEFAULT_KEYFRAMES));

  const [previewA, setPreviewA] = useState<PreviewState>({
    curve: generateBezier([[DEFAULT_BEZIER.p1.x, DEFAULT_BEZIER.p1.y], [DEFAULT_BEZIER.p2.x, DEFAULT_BEZIER.p2.y]]),
    keyframes: cloneDeep(DEFAULT_KEYFRAMES)
  });
  const [previewB, setPreviewB] = useState<PreviewState>({
    curve: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    keyframes: cloneDeep(DEFAULT_KEYFRAMES)
  });

  const [playTrigger, setPlayTrigger] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fps, setFps] = useState(60);
  const [progressFlash, setProgressFlash] = useState(false);

  const [activeExportPreview, setActiveExportPreview] = useState<'A' | 'B'>('A');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 1024;

  const currentCurve = useMemo(() => {
    if (curveType === 'bezier') {
      return generateBezier([
        [bezierState.p1.x, bezierState.p1.y],
        [bezierState.p2.x, bezierState.p2.y]
      ]);
    } else {
      return generateSpring(springState.mass, springState.stiffness, springState.damping);
    }
  }, [curveType, bezierState, springState]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  const applyToPreview = useCallback(() => {
    const state: PreviewState = {
      curve: currentCurve,
      keyframes: cloneDeep(keyframesConfig)
    };
    if (targetPreview === 'A') {
      setPreviewA(state);
    } else {
      setPreviewB(state);
    }
    showToast(`已应用到预览区 ${targetPreview}`);
  }, [currentCurve, keyframesConfig, targetPreview, showToast]);

  const handleSyncPlay = useCallback(() => {
    setProgress(0);
    setPlayTrigger(prev => prev + 1);
  }, []);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const handleComplete = useCallback(() => {
    setProgressFlash(true);
    setTimeout(() => setProgressFlash(false), 400);
  }, []);

  const handleCopyCode = useCallback(async () => {
    const target = activeExportPreview === 'A' ? previewA : previewB;
    const code = generateCssCode(target.curve, target.keyframes);
    try {
      await copyToClipboard(code);
      showToast('代码已复制到剪贴板');
    } catch {
      showToast('复制失败，请手动复制');
    }
  }, [activeExportPreview, previewA, previewB, showToast]);

  const handleDownload = useCallback(() => {
    const target = activeExportPreview === 'A' ? previewA : previewB;
    const code = generateCssCode(target.curve, target.keyframes);
    downloadCssFile(target.keyframes.name + '.css', code);
    showToast('CSS文件已下载');
  }, [activeExportPreview, previewA, previewB, showToast]);

  const exportCode = useMemo(() => {
    const target = activeExportPreview === 'A' ? previewA : previewB;
    return generateCssCode(target.curve, target.keyframes);
  }, [activeExportPreview, previewA, previewB]);

  const addKeyframe = useCallback(() => {
    if (keyframesConfig.keyframes.length >= 5) {
      showToast('最多只能添加5个关键帧');
      return;
    }
    setKeyframesConfig(prev => {
      const newKf: Keyframe = {
        percentage: 50,
        properties: { translateX: 50, translateY: 0, scale: 1.2, rotate: 180, opacity: 0.9 }
      };
      const next = cloneDeep(prev);
      next.keyframes.push(newKf);
      next.keyframes.sort((a, b) => a.percentage - b.percentage);
      return next;
    });
  }, [keyframesConfig.keyframes.length, showToast]);

  const removeKeyframe = useCallback((index: number) => {
    if (keyframesConfig.keyframes.length <= 2) {
      showToast('至少需要保留2个关键帧');
      return;
    }
    setKeyframesConfig(prev => {
      const next = cloneDeep(prev);
      next.keyframes.splice(index, 1);
      return next;
    });
  }, [keyframesConfig.keyframes.length, showToast]);

  const updateKeyframe = useCallback((index: number, field: string, value: number) => {
    setKeyframesConfig(prev => {
      const next = cloneDeep(prev);
      if (field === '__duration__') {
        next.duration = value;
      } else if (field === 'percentage') {
        if (index >= 0 && index < next.keyframes.length) {
          next.keyframes[index].percentage = Math.max(0, Math.min(100, value));
          next.keyframes.sort((a, b) => a.percentage - b.percentage);
        }
      } else {
        if (index >= 0 && index < next.keyframes.length) {
          const prop = field as keyof typeof next.keyframes[0]['properties'];
          (next.keyframes[index].properties as Record<string, number | undefined>)[prop] = value;
        }
      }
      return next;
    });
  }, []);

  return (
    <div style={styles.root}>
      <Header mobile={isMobile} onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div style={styles.body}>
        {(isMobile ? mobileMenuOpen : true) && (
          <ControlPanel
            mobile={isMobile}
            activePanel={activePanel}
            setActivePanel={setActivePanel}
            curveType={curveType}
            setCurveType={setCurveType}
            targetPreview={targetPreview}
            setTargetPreview={setTargetPreview}
            bezierState={bezierState}
            setBezierState={setBezierState}
            springState={springState}
            setSpringState={setSpringState}
            keyframesConfig={keyframesConfig}
            addKeyframe={addKeyframe}
            removeKeyframe={removeKeyframe}
            updateKeyframe={updateKeyframe}
            onApply={applyToPreview}
            currentCurve={currentCurve}
          />
        )}

        <MainContent
          mobile={isMobile}
          previewA={previewA}
          previewB={previewB}
          playTrigger={playTrigger}
          onProgress={handleProgress}
          onFpsUpdate={setFps}
          onComplete={handleComplete}
          onSyncPlay={handleSyncPlay}
          progress={progress}
          progressFlash={progressFlash}
          fps={fps}
          activeExportPreview={activeExportPreview}
          setActiveExportPreview={setActiveExportPreview}
          exportCode={exportCode}
          onCopy={handleCopyCode}
          onDownload={handleDownload}
        />
      </div>

      <Toast visible={toastVisible} message={toastMessage} />
    </div>
  );
};

const Header: React.FC<{ mobile: boolean; onMenuToggle: () => void }> = ({ mobile, onMenuToggle }) => (
  <div style={styles.header}>
    {mobile && (
      <button style={styles.menuBtn} onClick={onMenuToggle}>
        ☰
      </button>
    )}
    <h1 style={styles.headerTitle}>CSS动画曲线生成与关键帧对比预览工具</h1>
  </div>
);

interface ControlPanelProps {
  mobile: boolean;
  activePanel: PanelKey;
  setActivePanel: (k: PanelKey) => void;
  curveType: CurveType;
  setCurveType: (t: CurveType) => void;
  targetPreview: 'A' | 'B';
  setTargetPreview: (t: 'A' | 'B') => void;
  bezierState: BezierEditorState;
  setBezierState: (s: BezierEditorState) => void;
  springState: SpringEditorState;
  setSpringState: (s: SpringEditorState) => void;
  keyframesConfig: KeyframeConfig;
  addKeyframe: () => void;
  removeKeyframe: (i: number) => void;
  updateKeyframe: (i: number, field: string, value: number) => void;
  onApply: () => void;
  currentCurve: string;
}

const ControlPanel: React.FC<ControlPanelProps> = (props) => (
  <div style={{ ...styles.controlPanel, ...(props.mobile ? styles.controlPanelMobile : {}) }}>
    <div style={styles.curveTypeSelector}>
      <button
        style={{
          ...styles.curveTypeBtn,
          ...(props.curveType === 'bezier' ? styles.curveTypeBtnActive : {})
        }}
        onClick={() => { props.setCurveType('bezier'); props.setActivePanel('bezier'); }}
      >
        贝塞尔曲线
      </button>
      <button
        style={{
          ...styles.curveTypeBtn,
          ...(props.curveType === 'spring' ? styles.curveTypeBtnActive : {})
        }}
        onClick={() => { props.setCurveType('spring'); props.setActivePanel('spring'); }}
      >
        弹簧曲线
      </button>
    </div>

    <div style={styles.targetSelector}>
      <span style={styles.label}>应用到:</span>
      <button
        style={{ ...styles.targetBtn, ...(props.targetPreview === 'A' ? styles.targetBtnActive : {}) }}
        onClick={() => props.setTargetPreview('A')}
      >
        预览A
      </button>
      <button
        style={{ ...styles.targetBtn, ...(props.targetPreview === 'B' ? styles.targetBtnActive : {}) }}
        onClick={() => props.setTargetPreview('B')}
      >
        预览B
      </button>
    </div>

    <div style={{ marginBottom: '12px' }}>
      <div style={styles.label}>当前曲线</div>
      <div style={styles.curveDisplay}>{props.currentCurve}</div>
    </div>

    <AccordionPanel
      title="贝塞尔曲线"
      isOpen={props.activePanel === 'bezier'}
      onToggle={() => props.setActivePanel('bezier')}
    >
      <BezierEditor state={props.bezierState} setState={props.setBezierState} />
    </AccordionPanel>

    <AccordionPanel
      title="弹簧曲线"
      isOpen={props.activePanel === 'spring'}
      onToggle={() => props.setActivePanel('spring')}
    >
      <SpringEditor state={props.springState} setState={props.setSpringState} />
    </AccordionPanel>

    <AccordionPanel
      title="关键帧配置"
      isOpen={props.activePanel === 'keyframes'}
      onToggle={() => props.setActivePanel('keyframes')}
    >
      <KeyframesEditor
        config={props.keyframesConfig}
        addKeyframe={props.addKeyframe}
        removeKeyframe={props.removeKeyframe}
        updateKeyframe={props.updateKeyframe}
      />
    </AccordionPanel>

    <button style={styles.applyBtn} onClick={props.onApply}>
      应用到预览区 {props.targetPreview}
    </button>
  </div>
);

const AccordionPanel: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => (
  <div style={styles.accordionItem}>
    <button style={styles.accordionHeader} onClick={onToggle}>
      <span style={styles.accordionTitle}>{title}</span>
      <span style={{ ...styles.accordionIcon, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
    </button>
    <div
      style={{
        ...styles.accordionContent,
        maxHeight: isOpen ? '2000px' : '0px',
        opacity: isOpen ? 1 : 0,
        padding: isOpen ? '12px' : '0 12px',
        transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease'
      }}
    >
      {children}
    </div>
  </div>
);

const BezierEditor: React.FC<{
  state: BezierEditorState;
  setState: (s: BezierEditorState) => void;
}> = ({ state, setState }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null);
  const [ballAnimTime, setBallAnimTime] = useState(0);
  const rafRef = useRef<number | null>(null);
  const ballStartRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      if (ballStartRef.current === 0) ballStartRef.current = performance.now();
      const elapsed = performance.now() - ballStartRef.current;
      const t = (elapsed % 3000) / 3000;
      setBallAnimTime(t);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const svgToCoords = useCallback((clientX: number, clientY: number): ControlPoint => {
    const svg = svgRef.current;
    if (!svg) return { x: 0.5, y: 0.5 };
    const rect = svg.getBoundingClientRect();
    const size = 280;
    const padding = 30;
    const x = (clientX - rect.left - padding) / size;
    const y = 1 - (clientY - rect.top - padding) / size;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const pt = svgToCoords(e.clientX, e.clientY);
      setState(dragging === 'p1' ? { ...state, p1: pt } : { ...state, p2: pt });
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, state, setState, svgToCoords]);

  const GRID_SIZE = 280;
  const PADDING = 30;
  const CANVAS = GRID_SIZE + PADDING * 2;

  const p1Px = {
    x: PADDING + state.p1.x * GRID_SIZE,
    y: PADDING + (1 - state.p1.y) * GRID_SIZE
  };
  const p2Px = {
    x: PADDING + state.p2.x * GRID_SIZE,
    y: PADDING + (1 - state.p2.y) * GRID_SIZE
  };
  const startPx = { x: PADDING, y: PADDING + GRID_SIZE };
  const endPx = { x: PADDING + GRID_SIZE, y: PADDING };

  const easedT = cubicBezierValue(ballAnimTime, state.p1, state.p2);
  const ballPx = {
    x: PADDING + ballAnimTime * GRID_SIZE,
    y: PADDING + (1 - easedT) * GRID_SIZE
  };

  const curvePath = useMemo(() => {
    const steps = 50;
    let d = `M ${startPx.x} ${startPx.y}`;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const y = cubicBezierValue(t, state.p1, state.p2);
      const x = PADDING + t * GRID_SIZE;
      const yy = PADDING + (1 - y) * GRID_SIZE;
      d += ` L ${x.toFixed(2)} ${yy.toFixed(2)}`;
    }
    return d;
  }, [state.p1, state.p2, startPx]);

  return (
    <div>
      <svg
        ref={svgRef}
        width={CANVAS}
        height={CANVAS}
        style={{ background: '#f0f0f0', borderRadius: '6px', display: 'block', margin: '0 auto 12px' }}
      >
        {Array.from({ length: 11 }).map((_, i) => {
          const pos = PADDING + (i / 10) * GRID_SIZE;
          return (
            <g key={i}>
              <line x1={pos} y1={PADDING} x2={pos} y2={PADDING + GRID_SIZE} stroke="#e0e0e0" strokeWidth="1" />
              <line x1={PADDING} y1={pos} x2={PADDING + GRID_SIZE} y2={pos} stroke="#e0e0e0" strokeWidth="1" />
            </g>
          );
        })}
        <line x1={PADDING} y1={PADDING + GRID_SIZE} x2={PADDING + GRID_SIZE} y2={PADDING + GRID_SIZE} stroke="#333" strokeWidth="2" />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={PADDING + GRID_SIZE} stroke="#333" strokeWidth="2" />

        <line x1={startPx.x} y1={startPx.y} x2={p1Px.x} y2={p1Px.y} stroke="#999" strokeWidth="1" strokeDasharray="4" />
        <line x1={endPx.x} y1={endPx.y} x2={p2Px.x} y2={p2Px.y} stroke="#999" strokeWidth="1" strokeDasharray="4" />

        <path d={curvePath} fill="none" stroke="#3f51b5" strokeWidth="2.5" />

        <circle cx={startPx.x} cy={startPx.y} r="4" fill="#333" />
        <circle cx={endPx.x} cy={endPx.y} r="4" fill="#333" />

        <circle cx={ballPx.x} cy={ballPx.y} r="7" fill="#ff5722" stroke="#fff" strokeWidth="2" />

        <circle
          cx={p1Px.x} cy={p1Px.y} r="9"
          fill="#4fc3f7" stroke="#fff" strokeWidth="2"
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('p1'); }}
        />
        <circle
          cx={p2Px.x} cy={p2Px.y} r="9"
          fill="#ff7043" stroke="#fff" strokeWidth="2"
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('p2'); }}
        />
      </svg>

      <div style={styles.paramRow}>
        <div style={styles.paramLabel}>P1: ({state.p1.x.toFixed(3)}, {state.p1.y.toFixed(3)})</div>
      </div>
      <div style={styles.paramRow}>
        <div style={styles.paramLabel}>P2: ({state.p2.x.toFixed(3)}, {state.p2.y.toFixed(3)})</div>
      </div>
      <div style={{ ...styles.curveDisplay, marginTop: '8px' }}>
        {generateBezier([[state.p1.x, state.p1.y], [state.p2.x, state.p2.y]])}
      </div>
    </div>
  );
};

const SpringEditor: React.FC<{
  state: SpringEditorState;
  setState: (s: SpringEditorState) => void;
}> = ({ state, setState }) => {
  const [animTime, setAnimTime] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      if (startRef.current === 0) startRef.current = performance.now();
      const elapsed = performance.now() - startRef.current;
      const t = (elapsed % 3000) / 3000;
      setAnimTime(t);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const springVal = springValue(animTime, state.mass, state.stiffness, state.damping);
  const ballY = 90 - springVal * 70;

  return (
    <div>
      <svg width="240" height="120" style={{ background: '#f9f9f9', borderRadius: '6px', display: 'block', margin: '0 auto 12px' }}>
        <line x1="20" y1="95" x2="220" y2="95" stroke="#ccc" strokeWidth="2" strokeDasharray="4" />
        {Array.from({ length: 12 }).map((_, i) => {
          const coilY1 = 95 + (ballY - 95) * (i / 11);
          const coilY2 = 95 + (ballY - 95) * ((i + 1) / 11);
          const xOffset = i % 2 === 0 ? -5 : 5;
          const nextXOffset = (i + 1) % 2 === 0 ? -5 : 5;
          return (
            <line
              key={i}
              x1={120 + xOffset}
              y1={coilY1}
              x2={120 + nextXOffset}
              y2={coilY2}
              stroke="#666"
              strokeWidth="2"
            />
          );
        })}
        <line x1="120" y1={ballY} x2="120" y2={ballY + 5} stroke="#666" strokeWidth="2" />
        <circle cx="120" cy={ballY} r="14" fill="#4CAF50" stroke="#fff" strokeWidth="2" />
      </svg>

      <SliderControl
        label="质量 (mass)"
        value={state.mass}
        min={0.1} max={10} step={0.1}
        onChange={(v) => setState({ ...state, mass: v })}
        display={state.mass.toFixed(1)}
      />
      <SliderControl
        label="刚度 (stiffness)"
        value={state.stiffness}
        min={50} max={300} step={10}
        onChange={(v) => setState({ ...state, stiffness: v })}
        display={state.stiffness.toString()}
      />
      <SliderControl
        label="阻尼 (damping)"
        value={state.damping}
        min={5} max={50} step={1}
        onChange={(v) => setState({ ...state, damping: v })}
        display={state.damping.toString()}
      />
      <div style={{ ...styles.curveDisplay, marginTop: '8px' }}>
        {generateSpring(state.mass, state.stiffness, state.damping)}
      </div>
    </div>
  );
};

const SliderControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}> = ({ label, value, min, max, step, onChange, display }) => (
  <div style={styles.sliderContainer}>
    <div style={styles.sliderHeader}>
      <span style={styles.sliderLabel}>{label}</span>
      <span style={styles.sliderValue}>{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={styles.slider}
    />
  </div>
);

const KeyframesEditor: React.FC<{
  config: KeyframeConfig;
  addKeyframe: () => void;
  removeKeyframe: (i: number) => void;
  updateKeyframe: (i: number, field: string, value: number) => void;
}> = ({ config, addKeyframe, removeKeyframe, updateKeyframe }) => (
  <div>
    <div style={styles.sliderContainer}>
      <div style={styles.sliderHeader}>
        <span style={styles.sliderLabel}>动画名称</span>
        <span style={styles.sliderValue}>{config.duration}ms</span>
      </div>
      <input
        type="range"
        min={200}
        max={5000}
        step={100}
        value={config.duration}
        onChange={(e) => updateKeyframe(-1, '__duration__', parseFloat(e.target.value))}
        style={styles.slider}
      />
    </div>

    <button style={styles.addKfBtn} onClick={addKeyframe}>
      + 添加关键帧 ({config.keyframes.length}/5)
    </button>

    {config.keyframes.map((kf, idx) => (
      <div key={idx} style={styles.kfCard}>
        <div style={styles.kfHeader}>
          <span style={{ ...styles.label, margin: 0 }}>关键帧 {idx + 1}</span>
          <button
            style={styles.removeKfBtn}
            onClick={() => removeKeyframe(idx)}
            disabled={config.keyframes.length <= 2}
          >
            ×
          </button>
        </div>
        <div style={styles.kfRow}>
          <label style={styles.kfLabel}>百分比</label>
          <input
            type="number"
            min={0} max={100}
            value={kf.percentage}
            onChange={(e) => updateKeyframe(idx, 'percentage', parseFloat(e.target.value) || 0)}
            style={styles.kfInput}
          />
          <span>%</span>
        </div>
        <div style={styles.kfGrid}>
          {[
            { key: 'translateX', label: 'X位移', unit: 'px' },
            { key: 'translateY', label: 'Y位移', unit: 'px' },
            { key: 'scale', label: '缩放', unit: '×' },
            { key: 'rotate', label: '旋转', unit: '°' },
            { key: 'opacity', label: '透明度', unit: '' }
          ].map(item => (
            <div key={item.key} style={styles.kfRow}>
              <label style={styles.kfLabel}>{item.label}</label>
              <input
                type="number"
                step={item.key === 'opacity' ? 0.1 : 1}
                value={kf.properties[item.key as keyof typeof kf.properties] ?? 0}
                onChange={(e) => updateKeyframe(idx, item.key, parseFloat(e.target.value) || 0)}
                style={styles.kfInput}
              />
              <span style={{ fontSize: '11px', color: '#888' }}>{item.unit}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

interface MainContentProps {
  mobile: boolean;
  previewA: PreviewState;
  previewB: PreviewState;
  playTrigger: number;
  onProgress: (p: number) => void;
  onFpsUpdate: (f: number) => void;
  onComplete: () => void;
  onSyncPlay: () => void;
  progress: number;
  progressFlash: boolean;
  fps: number;
  activeExportPreview: 'A' | 'B';
  setActiveExportPreview: (p: 'A' | 'B') => void;
  exportCode: string;
  onCopy: () => void;
  onDownload: () => void;
}

const MainContent: React.FC<MainContentProps> = (props) => (
  <div style={styles.mainContent}>
    <div style={{ ...styles.previewsContainer, flexDirection: props.mobile ? 'column' : 'row' }}>
      <PreviewCard
        label="预览区 A"
        active={props.activeExportPreview === 'A'}
        curve={props.previewA.curve}
        canvasId="previewA"
        keyframes={props.previewA.keyframes}
        playTrigger={props.playTrigger}
        onProgress={props.onProgress}
        onFpsUpdate={props.onFpsUpdate}
        onComplete={props.onComplete}
        onClick={() => props.setActiveExportPreview('A')}
      />

      <div style={props.mobile ? { height: '20px' } : { width: '40px' }} />

      <PreviewCard
        label="预览区 B"
        active={props.activeExportPreview === 'B'}
        curve={props.previewB.curve}
        canvasId="previewB"
        keyframes={props.previewB.keyframes}
        playTrigger={props.playTrigger}
        onProgress={() => {}}
        onFpsUpdate={() => {}}
        onComplete={() => {}}
        onClick={() => props.setActiveExportPreview('B')}
      />
    </div>

    <div style={styles.syncControl}>
      <button style={styles.playBtn} onClick={props.onSyncPlay}>
        ▶ 同步播放
      </button>
      <div style={styles.progressContainer}>
        <div
          style={{
            ...styles.progressBar,
            width: `${props.progress * 100}%`,
            animation: props.progressFlash ? 'flashProgress 0.4s' : undefined
          }}
        />
      </div>
      <span style={styles.fpsLabel}>FPS: {props.fps.toFixed(0)}</span>
    </div>

    <div style={styles.codeSection}>
      <div style={styles.codeHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            style={{ ...styles.exportTab, ...(props.activeExportPreview === 'A' ? styles.exportTabActive : {}) }}
            onClick={() => props.setActiveExportPreview('A')}
          >
            预览 A
          </button>
          <button
            style={{ ...styles.exportTab, ...(props.activeExportPreview === 'B' ? styles.exportTabActive : {}) }}
            onClick={() => props.setActiveExportPreview('B')}
          >
            预览 B
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={styles.copyBtn} onClick={props.onCopy}>复制代码</button>
          <button style={styles.downloadBtn} onClick={props.onDownload}>下载CSS</button>
        </div>
      </div>
      <pre style={styles.codeBlock}>{props.exportCode}</pre>
    </div>
  </div>
);

interface PreviewCardProps {
  label: string;
  active: boolean;
  curve: string;
  canvasId: string;
  keyframes: KeyframeConfig;
  playTrigger: number;
  onProgress: (p: number) => void;
  onFpsUpdate: (f: number) => void;
  onComplete: () => void;
  onClick: () => void;
}

const PreviewCard: React.FC<PreviewCardProps> = (props) => (
  <div
    style={{
      ...styles.previewCard,
      ...(props.active ? styles.previewCardActive : {}),
      ...(styles as any).hoverable
    }}
    onClick={props.onClick}
  >
    <div style={styles.previewTitle}>{props.label}</div>
    <div style={styles.previewCanvasWrap}>
      <AnimationPreview
        canvasId={props.canvasId}
        curve={props.curve}
        keyframes={props.keyframes}
        playTrigger={props.playTrigger}
        onProgress={props.onProgress}
        onFpsUpdate={props.onFpsUpdate}
        onComplete={props.onComplete}
      />
    </div>
    <div style={styles.paramDisplay}>{props.curve}</div>
  </div>
);

const Toast: React.FC<{ visible: boolean; message: string }> = ({ visible, message }) => (
  <div
    style={{
      ...styles.toast,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-20px)',
      pointerEvents: visible ? 'auto' : 'none'
    }}
  >
    {message}
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#FAFAFA',
    position: 'relative'
  },
  header: {
    height: '56px',
    background: '#fff',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    margin: 0
  },
  menuBtn: {
    width: '36px',
    height: '36px',
    background: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s all'
  },
  body: {
    display: 'flex',
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '24px'
  },
  controlPanel: {
    width: '280px',
    flexShrink: 0,
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    height: 'fit-content',
    position: 'sticky',
    top: '80px',
    maxHeight: 'calc(100vh - 104px)',
    overflowY: 'auto'
  },
  controlPanelMobile: {
    width: '100%',
    position: 'static',
    maxHeight: 'none',
    marginBottom: '20px'
  },
  curveTypeSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px'
  },
  curveTypeBtn: {
    flex: 1,
    padding: '8px 10px',
    fontSize: '12px',
    borderRadius: '6px',
    background: '#f5f5f5',
    color: '#666',
    transition: '0.2s all',
    fontWeight: 500
  },
  curveTypeBtnActive: {
    background: '#3f51b5',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(63,81,181,0.3)'
  },
  targetSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  targetBtn: {
    flex: 1,
    padding: '6px 8px',
    fontSize: '12px',
    borderRadius: '6px',
    background: '#f5f5f5',
    color: '#666',
    transition: '0.2s all',
    fontWeight: 500
  },
  targetBtnActive: {
    background: '#4fc3f7',
    color: '#fff'
  },
  label: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px',
    display: 'block',
    fontWeight: 500
  },
  curveDisplay: {
    background: '#f7f7f9',
    padding: '8px 10px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#333',
    border: '1px solid #eee',
    wordBreak: 'break-all'
  },
  accordionItem: {
    border: '1px solid #eee',
    borderRadius: '8px',
    marginBottom: '10px',
    overflow: 'hidden',
    background: '#fafafa'
  },
  accordionHeader: {
    width: '100%',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff',
    transition: '0.2s all',
    fontSize: '13px',
    fontWeight: 600,
    color: '#333'
  },
  accordionTitle: {
    fontSize: '13px',
    fontWeight: 600
  },
  accordionIcon: {
    fontSize: '10px',
    color: '#999',
    transition: '0.3s transform ease'
  },
  accordionContent: {
    background: '#fff',
    overflow: 'hidden',
    borderTop: '1px solid #f0f0f0'
  },
  paramRow: {
    marginBottom: '6px'
  },
  paramLabel: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#666'
  },
  sliderContainer: {
    marginBottom: '14px'
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  sliderLabel: {
    fontSize: '12px',
    color: '#555',
    fontWeight: 500
  },
  sliderValue: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#3f51b5',
    fontWeight: 600
  },
  slider: {
    width: '100%',
    height: '4px',
    accentColor: '#3f51b5',
    cursor: 'pointer'
  },
  addKfBtn: {
    width: '100%',
    padding: '8px',
    fontSize: '12px',
    background: '#f0f4ff',
    color: '#3f51b5',
    borderRadius: '6px',
    fontWeight: 600,
    marginBottom: '12px',
    transition: '0.2s all'
  },
  kfCard: {
    background: '#fafafa',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '10px'
  },
  kfHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  removeKfBtn: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#ffebee',
    color: '#e53935',
    fontSize: '16px',
    lineHeight: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kfRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px'
  },
  kfGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2px'
  },
  kfLabel: {
    fontSize: '11px',
    color: '#888',
    width: '52px',
    flexShrink: 0
  },
  kfInput: {
    flex: 1,
    padding: '4px 6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '11px',
    width: '60px'
  },
  applyBtn: {
    width: '100%',
    padding: '12px',
    background: '#3f51b5',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: '8px',
    transition: '0.2s all',
    boxShadow: '0 2px 8px rgba(63,81,181,0.3)'
  },
  mainContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: '24px'
  },
  previewsContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  previewCard: {
    width: '500px',
    background: '#fff',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '2px solid transparent',
    transition: '0.2s all',
    cursor: 'pointer'
  },
  previewCardActive: {
    borderColor: '#3f51b5',
    boxShadow: '0 4px 20px rgba(63,81,181,0.15)'
  },
  previewTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '12px'
  },
  previewCanvasWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px'
  },
  paramDisplay: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#666',
    background: '#f7f7f9',
    padding: '8px 12px',
    borderRadius: '6px',
    wordBreak: 'break-all'
  },
  syncControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '20px'
  },
  playBtn: {
    padding: '10px 24px',
    background: '#4CAF50',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    transition: '0.2s all',
    boxShadow: '0 2px 8px rgba(76,175,80,0.3)',
    whiteSpace: 'nowrap'
  },
  progressContainer: {
    flex: 1,
    maxWidth: '960px',
    height: '6px',
    background: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    background: '#3f51b5',
    borderRadius: '3px',
    transition: 'width 0.016s linear'
  },
  fpsLabel: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#666',
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  codeSection: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #eee'
  },
  exportTab: {
    padding: '6px 14px',
    fontSize: '12px',
    borderRadius: '6px',
    background: '#f5f5f5',
    color: '#666',
    fontWeight: 600,
    transition: '0.2s all'
  },
  exportTabActive: {
    background: '#3f51b5',
    color: '#fff'
  },
  copyBtn: {
    padding: '7px 16px',
    fontSize: '12px',
    borderRadius: '6px',
    background: '#4CAF50',
    color: '#fff',
    fontWeight: 600,
    transition: '0.2s all'
  },
  downloadBtn: {
    padding: '7px 16px',
    fontSize: '12px',
    borderRadius: '6px',
    background: '#2196F3',
    color: '#fff',
    fontWeight: 600,
    transition: '0.2s all'
  },
  codeBlock: {
    margin: 0,
    padding: '18px',
    background: '#263238',
    color: '#e0e0e0',
    fontFamily: 'monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    maxHeight: '340px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  },
  toast: {
    position: 'fixed',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#4CAF50',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 16px rgba(76,175,80,0.4)',
    transition: '0.5s all cubic-bezier(0.25, 0.1, 0.25, 1)',
    zIndex: 9999,
    whiteSpace: 'nowrap'
  },
  hoverable: {
    transition: 'all 0.2s ease'
  }
};

const keyframesStyle = document.createElement('style');
keyframesStyle.textContent = `
  @keyframes flashProgress {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  button:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }
  button:active {
    transform: translateY(0);
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(keyframesStyle);
}

export default App;
