import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ControlPanel from './components/ControlPanel';
import NeuralScene, { NeuralSceneHandle, NEURON_COLORS } from './components/NeuralScene';
import type { NeuronInitialData, SynapseInitialData } from './components/NeuralScene';
import { useSynapseWorker } from './hooks/useSynapseWorker';
import type { NeuronData, SynapseData, LogPayload } from './worker/synapseWorker';

const generateInitialNetwork = (): { neurons: NeuronInitialData[]; synapses: SynapseInitialData[] } => {
  const neuronPositions = [
    { x: -2.5, y: 1.2, z: 0 },
    { x: 0, y: 2.0, z: 0.5 },
    { x: 2.5, y: 1.2, z: 0 },
    { x: -1.8, y: -1.0, z: -0.5 },
    { x: 1.8, y: -1.0, z: 0.3 }
  ];

  const neurons: NeuronInitialData[] = neuronPositions.map((pos, i) => ({
    id: i,
    name: `N${i + 1}`,
    position: pos,
    color: NEURON_COLORS[i % NEURON_COLORS.length]
  }));

  const connectionPairs: Array<[number, number]> = [
    [0, 1], [0, 3], [1, 2], [1, 4], [2, 4],
    [3, 0], [3, 4], [4, 2], [0, 4], [1, 3]
  ];

  const synapseColors = [
    '#FF6B9D', '#C56CF0', '#786FFA', '#4DABF7', '#38D9A9',
    '#FFD43B', '#FF8787', '#69DB7C', '#4ECDC4', '#F38BA8'
  ];

  const synapses: SynapseInitialData[] = connectionPairs.map((pair, i) => ({
    id: i,
    from: pair[0],
    to: pair[1],
    color: synapseColors[i]
  }));

  return { neurons, synapses };
};

const App: React.FC = () => {
  const [frequency, setFrequency] = useState(120);
  const [duration, setDuration] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [fps, setFps] = useState(60);

  const { neurons, synapses } = useMemo(() => generateInitialNetwork(), []);

  const [weights, setWeights] = useState<number[]>(() => synapses.map(() => 1.0));
  const [weightHistory, setWeightHistory] = useState<number[][]>(() => synapses.map(() => []));
  const [logs, setLogs] = useState<LogPayload[]>([]);
  const [hoveredSynapse, setHoveredSynapse] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<NeuralSceneHandle>(null);
  const lastChartUpdateRef = useRef<number>(0);
  const prevWeightsRef = useRef<number[]>(synapses.map(() => 1.0));

  const handleWeightsUpdate = useCallback((newWeights: number[], _targets: number[]) => {
    setWeights(newWeights);

    const prevWeights = prevWeightsRef.current;
    newWeights.forEach((weight, idx) => {
      const prevWeight = prevWeights[idx] ?? 1.0;
      if (prevWeight < 1.5 && weight >= 1.5) {
        sceneRef.current?.triggerLTP(synapses[idx].id);
      } else if (prevWeight > 0.5 && weight <= 0.5) {
        sceneRef.current?.triggerLTD(synapses[idx].id);
      }
    });
    prevWeightsRef.current = [...newWeights];

    const now = performance.now();
    if (now - lastChartUpdateRef.current >= 100) {
      lastChartUpdateRef.current = now;
      setWeightHistory(prev => {
        const newHistory = prev.map((arr, idx) => {
          const nextArr = [...arr, newWeights[idx]];
          if (nextArr.length > 100) nextArr.shift();
          return nextArr;
        });
        return newHistory;
      });
    }
  }, [synapses]);

  const handleLog = useCallback((log: LogPayload) => {
    setLogs(prev => {
      const next = [log, ...prev];
      return next.slice(0, 50);
    });
  }, []);

  const handlePulse = useCallback((neuronId: number) => {
    sceneRef.current?.triggerPulse(neuronId);
  }, []);

  const { initNetwork, startSimulation, resetNetwork } = useSynapseWorker({
    onWeightsUpdate: handleWeightsUpdate,
    onLog: handleLog,
    onPulse: handlePulse
  });

  useEffect(() => {
    const workerNeurons: NeuronData[] = neurons.map(n => ({ ...n }));
    const workerSynapses: SynapseData[] = synapses.map(s => ({
      ...s,
      weight: 1.0,
      targetWeight: 1.0
    }));
    initNetwork(workerNeurons, workerSynapses);
  }, [initNetwork, neurons, synapses]);

  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    drawChart(canvas, weightHistory, synapses, neurons, hoveredSynapse);
  }, [weightHistory, synapses, neurons, hoveredSynapse]);

  const handleStart = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startSimulation(frequency, duration);

    const durationMs = duration * 1000 + 500;
    setTimeout(() => {
      setIsRunning(false);
    }, durationMs);
  }, [isRunning, frequency, duration, startSimulation]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    resetNetwork();
    setWeights(synapses.map(() => 1.0));
    setWeightHistory(synapses.map(() => []));
    prevWeightsRef.current = synapses.map(() => 1.0);
    lastChartUpdateRef.current = 0;
    setLogs([]);
    sceneRef.current?.resetVisuals();
  }, [resetNetwork, synapses]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = canvas.width;
    const height = canvas.height;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (x < padding.left || x > width - padding.right || y < padding.top || y > height - padding.bottom) {
      setHoveredSynapse(null);
      return;
    }

    const dataIdx = Math.min(Math.floor(((x - padding.left) / chartWidth) * 100), 99);
    let closestSynapse = -1;
    let closestDist = Infinity;

    weightHistory.forEach((history, synapseIdx) => {
      if (history.length === 0) return;
      const valIdx = Math.min(dataIdx, history.length - 1);
      const weight = history[valIdx];
      const yPos = padding.top + chartHeight - (weight / 2) * chartHeight;
      const dist = Math.abs(y - yPos);
      if (dist < closestDist && dist < 15) {
        closestDist = dist;
        closestSynapse = synapseIdx;
      }
    });

    if (closestSynapse >= 0) {
      setHoveredSynapse(closestSynapse);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredSynapse(null);
    }
  }, [weightHistory]);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredSynapse(null);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <ControlPanel
          frequency={frequency}
          duration={duration}
          isRunning={isRunning}
          onFrequencyChange={setFrequency}
          onDurationChange={setDuration}
          onStart={handleStart}
          onReset={handleReset}
        />
      </div>

      <div style={styles.centerPanel}>
        <NeuralScene
          ref={sceneRef}
          neurons={neurons}
          synapses={synapses}
          weights={weights}
          isRunning={isRunning}
          frequency={frequency}
          onFPSUpdate={setFps}
        />

        <div style={styles.fpsCounter}>
          <span style={{ opacity: 0.7 }}>FPS:</span>
          <span style={{
            color: fps >= 45 ? '#00ff88' : fps >= 30 ? '#ffcc00' : '#ff6b6b',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {fps}
          </span>
        </div>

        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: '#FFD700' }} />
            <span>信号粒子</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: '#4169E1', boxShadow: '0 0 8px #4169E1' }} />
            <span>LTP 增强</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: '#DC143C', boxShadow: '0 0 8px #DC143C' }} />
            <span>LTD 抑制</span>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.rightHeader}>
          <h2 style={styles.rightTitle}>实时数据分析</h2>
          <p style={styles.rightSubtitle}>突触权重变化监控</p>
        </div>

        <div style={styles.chartContainer}>
          <canvas
            ref={chartCanvasRef}
            width={400}
            height={300}
            style={styles.chartCanvas}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
          {hoveredSynapse !== null && (
            <div
              style={{
                ...styles.tooltip,
                left: tooltipPos.x + 15,
                top: tooltipPos.y + 15
              }}
            >
              <div style={{ color: synapses[hoveredSynapse].color, fontWeight: 600, marginBottom: '4px' }}>
                突触 #{hoveredSynapse + 1}: N{synapses[hoveredSynapse].from + 1} → N{synapses[hoveredSynapse].to + 1}
              </div>
              <div style={{ fontSize: '12px', color: '#a0a0c0' }}>
                目标神经元: {neurons[synapses[hoveredSynapse].to].name}
              </div>
              <div style={{ fontSize: '12px', color: '#00d4ff', marginTop: '4px' }}>
                当前权重: {weights[hoveredSynapse]?.toFixed(3)}
              </div>
            </div>
          )}
        </div>

        <div style={styles.synapseListHeader}>
          <span style={styles.listHeaderText}>突触连接列表</span>
        </div>
        <div style={styles.synapseList}>
          {synapses.map((s, idx) => (
            <div
              key={s.id}
              style={{
                ...styles.synapseListItem,
                background: hoveredSynapse === idx ? 'rgba(74, 140, 255, 0.1)' : 'transparent',
                borderColor: hoveredSynapse === idx ? s.color : 'rgba(74, 140, 255, 0.1)'
              }}
              onMouseEnter={() => setHoveredSynapse(idx)}
              onMouseLeave={() => setHoveredSynapse(null)}
            >
              <div style={styles.synapseInfo}>
                <span style={{ ...styles.synapseDot, background: s.color }} />
                <span style={styles.synapseLabel}>
                  N{s.from + 1} → N{s.to + 1}
                </span>
              </div>
              <div style={styles.synapseWeight}>
                <div style={styles.weightBarBg}>
                  <div
                    style={{
                      ...styles.weightBarFill,
                      width: `${(weights[idx] / 2) * 100}%`,
                      background: weights[idx] >= 1.5 ? 'linear-gradient(90deg, #4169E1, #00d4ff)' :
                                  weights[idx] <= 0.5 ? 'linear-gradient(90deg, #DC143C, #ff6b6b)' :
                                  `linear-gradient(90deg, ${s.color}, ${s.color}aa)`
                    }}
                  />
                </div>
                <span style={{
                  ...styles.weightValue,
                  color: weights[idx] >= 1.5 ? '#4169E1' : weights[idx] <= 0.5 ? '#ff6b6b' : '#e0e0f0'
                }}>
                  {weights[idx]?.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.logsHeader}>
          <span style={styles.listHeaderText}>事件日志</span>
        </div>
        <div style={styles.logsContainer}>
          {logs.length === 0 ? (
            <div style={styles.emptyLogs}>暂无事件...</div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.logItem,
                  borderLeftColor: log.type === 'ltp' ? '#4169E1' :
                                   log.type === 'ltd' ? '#DC143C' :
                                   '#00d4ff'
                }}
              >
                <div style={{
                  ...styles.logType,
                  background: log.type === 'ltp' ? 'rgba(65, 105, 225, 0.2)' :
                              log.type === 'ltd' ? 'rgba(220, 20, 60, 0.2)' :
                              'rgba(0, 212, 255, 0.2)',
                  color: log.type === 'ltp' ? '#6b8cff' :
                         log.type === 'ltd' ? '#ff6b8a' :
                         '#00d4ff'
                }}>
                  {log.type === 'ltp' ? 'LTP' : log.type === 'ltd' ? 'LTD' : 'INFO'}
                </div>
                <div style={styles.logMessage}>{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const drawChart = (
  canvas: HTMLCanvasElement,
  weightHistory: number[][],
  synapses: SynapseInitialData[],
  _neurons: NeuronInitialData[],
  hoveredSynapse: number | null
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.fillStyle = 'rgba(15, 15, 35, 0.5)';
  ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

  ctx.strokeStyle = 'rgba(74, 140, 255, 0.1)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 10; i++) {
    const x = padding.left + (chartWidth / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(74, 140, 255, 0.5)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  ctx.fillStyle = '#6a6a8a';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= 5; i++) {
    const value = (2 - i * 0.4).toFixed(1);
    const y = padding.top + (chartHeight / 5) * i;
    ctx.fillText(value, padding.left - 8, y);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i <= 10; i++) {
    const value = Math.round((i / 10) * 100);
    const x = padding.left + (chartWidth / 10) * i;
    ctx.fillText(`${value}`, x, height - padding.bottom + 8);
  }

  ctx.fillStyle = '#8a8aaa';
  ctx.font = '12px sans-serif';
  ctx.fillText('时间 (样本点)', width / 2, height - 12);

  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('权重值', 0, 0);
  ctx.restore();

  weightHistory.forEach((history, idx) => {
    if (history.length < 2) return;

    const isHovered = hoveredSynapse === idx;
    ctx.strokeStyle = synapses[idx].color;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.globalAlpha = hoveredSynapse === null || isHovered ? 1 : 0.15;

    ctx.beginPath();
    history.forEach((weight, pointIdx) => {
      const x = padding.left + (pointIdx / 99) * chartWidth;
      const y = padding.top + chartHeight - (weight / 2) * chartHeight;
      if (pointIdx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    if (isHovered && history.length > 0) {
      const lastIdx = history.length - 1;
      const lastX = padding.left + (lastIdx / 99) * chartWidth;
      const lastY = padding.top + chartHeight - (history[lastIdx] / 2) * chartHeight;

      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = synapses[idx].color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  ctx.globalAlpha = 1;
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    background: '#0a0a1a'
  },
  leftPanel: {
    width: '10%',
    minWidth: '240px',
    flex: '0 0 auto',
    height: '100%',
    transition: 'all 0.3s ease-out',
    zIndex: 10
  },
  centerPanel: {
    flex: '1 1 70%',
    minWidth: '500px',
    height: '100%',
    position: 'relative',
    transition: 'all 0.3s ease-out'
  },
  rightPanel: {
    width: '20%',
    minWidth: '300px',
    flex: '0 0 auto',
    height: '100%',
    background: 'rgba(15, 15, 35, 0.75)',
    backdropFilter: 'blur(8px)',
    borderLeft: '1px solid rgba(74, 140, 255, 0.2)',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    transition: 'all 0.3s ease-out',
    zIndex: 10
  },
  fpsCounter: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    padding: '8px 14px',
    background: 'rgba(10, 10, 26, 0.8)',
    backdropFilter: 'blur(4px)',
    borderRadius: '8px',
    border: '1px solid rgba(74, 140, 255, 0.3)',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '14px',
    color: '#e0e0f0',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none'
  },
  legend: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    padding: '12px 16px',
    background: 'rgba(10, 10, 26, 0.8)',
    backdropFilter: 'blur(4px)',
    borderRadius: '10px',
    border: '1px solid rgba(74, 140, 255, 0.2)',
    display: 'flex',
    gap: '20px',
    zIndex: 100,
    pointerEvents: 'none'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#a0a0c0'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0
  },
  rightHeader: {
    borderBottom: '1px solid rgba(74, 140, 255, 0.15)',
    paddingBottom: '16px'
  },
  rightTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#e0e0f0',
    margin: 0,
    letterSpacing: '1px'
  },
  rightSubtitle: {
    fontSize: '12px',
    color: '#6a6a8a',
    margin: '6px 0 0 0'
  },
  chartContainer: {
    position: 'relative',
    padding: '12px',
    background: 'rgba(42, 42, 74, 0.3)',
    borderRadius: '8px',
    border: '1px solid #2a2a4a'
  },
  chartCanvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    cursor: 'crosshair'
  },
  tooltip: {
    position: 'fixed',
    padding: '10px 14px',
    background: 'rgba(15, 15, 40, 0.95)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    border: '1px solid rgba(74, 140, 255, 0.5)',
    fontSize: '12px',
    color: '#e0e0f0',
    pointerEvents: 'none',
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    whiteSpace: 'nowrap'
  },
  synapseListHeader: {
    paddingTop: '8px'
  },
  listHeaderText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8a8aaa',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  synapseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  synapseListItem: {
    padding: '10px 12px',
    background: 'rgba(42, 42, 74, 0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(74, 140, 255, 0.1)',
    transition: 'all 0.2s ease-out',
    cursor: 'pointer'
  },
  synapseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  synapseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0
  },
  synapseLabel: {
    fontSize: '12px',
    color: '#c0c0e0',
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums'
  },
  synapseWeight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  weightBarBg: {
    flex: 1,
    height: '6px',
    background: 'rgba(42, 42, 74, 0.8)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  weightBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.1s linear, background 0.3s ease-out'
  },
  weightValue: {
    fontSize: '13px',
    fontWeight: 600,
    minWidth: '40px',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums'
  },
  logsHeader: {
    marginTop: '8px'
  },
  logsContainer: {
    flex: 1,
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  emptyLogs: {
    padding: '20px',
    textAlign: 'center',
    color: '#5a5a7a',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  logItem: {
    padding: '10px 12px',
    background: 'rgba(42, 42, 74, 0.3)',
    borderRadius: '6px',
    borderLeft: '3px solid #00d4ff',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },
  logType: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    flexShrink: 0,
    textTransform: 'uppercase'
  },
  logMessage: {
    fontSize: '11px',
    color: '#a0a0c0',
    lineHeight: 1.5,
    wordBreak: 'break-all'
  }
};

export default App;
