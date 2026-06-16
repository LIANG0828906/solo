import React, { useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Save, Download, Image } from 'lucide-react';
import { useGeneStore } from '@/store/useGeneStore';
import { GeneticElement, ELEMENT_SIZE, SimulationResult } from '@/models/GeneticElement';
import { exportSvg, exportGif } from '@/utils/exportHelpers';

export const SimulationController: React.FC = () => {
  const elements = useGeneStore((s) => s.elements);
  const connections = useGeneStore((s) => s.connections);
  const simulation = useGeneStore((s) => s.simulation);
  const playSimulation = useGeneStore((s) => s.playSimulation);
  const pauseSimulation = useGeneStore((s) => s.pauseSimulation);
  const resetSimulation = useGeneStore((s) => s.resetSimulation);
  const updateSimulation = useGeneStore((s) => s.updateSimulation);
  const saveSnapshot = useGeneStore((s) => s.saveSnapshot);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pathRef = useRef<{ x: number; y: number; elementId: string }[]>([]);
  const pathIndexRef = useRef(0);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const buildPath = useCallback((): { x: number; y: number; elementId: string }[] => {
    const promoters = elements.filter((e) => e.type === 'promoter');
    if (promoters.length === 0) return [];

    const path: { x: number; y: number; elementId: string }[] = [];
    const visited = new Set<string>();

    const traverse = (elementId: string) => {
      if (visited.has(elementId)) return;
      visited.add(elementId);

      const element = elements.find((e) => e.id === elementId);
      if (!element) return;

      path.push({
        x: element.position.x + ELEMENT_SIZE.width / 2,
        y: element.position.y + ELEMENT_SIZE.height / 2,
        elementId
      });

      const outConnections = connections.filter((c) => c.fromId === elementId);
      outConnections.forEach((conn) => traverse(conn.toId));
    };

    promoters.forEach((p) => traverse(p.id));
    return path;
  }, [elements, connections]);

  const interpolatePosition = (p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) => {
    return {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    };
  };

  const animate = useCallback((timestamp: number) => {
    if (!simulation.isPlaying) return;

    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
      pathRef.current = buildPath();
      pathIndexRef.current = 0;

      if (pathRef.current.length > 0) {
        updateSimulation({
          polymerasePosition: pathRef.current[0],
          totalSteps: pathRef.current.length
        });
      }
    }

    const path = pathRef.current;
    if (path.length < 2) {
      updateSimulation({ status: 'complete', isPlaying: false, pairedResult: '请添加至少两个调控元件并连接' });
      return;
    }

    const stepDuration = 500;
    const elapsed = timestamp - startTimeRef.current;
    const currentStep = Math.floor(elapsed / stepDuration);
    const stepProgress = (elapsed % stepDuration) / stepDuration;

    if (currentStep >= path.length - 1) {
      const lastElement = elements.find((e) => e.id === path[path.length - 1].elementId);
      const hasStructuralGene = elements.some((e) => e.type === 'structural-gene');
      const hasRepressor = elements.some((e) => e.type === 'repressor');
      const hasInducer = elements.some((e) => e.type === 'inducer');

      let message = '';
      let proteinProduced = false;

      if (hasStructuralGene) {
        if (hasRepressor && !hasInducer) {
          message = '转录被阻遏物阻断，未产生蛋白质';
        } else {
          message = '转录翻译成功完成，产生了目标蛋白质！';
          proteinProduced = true;
        }
      } else {
        message = '缺少结构基因，无法完成蛋白质合成';
      }

      const result: SimulationResult = {
        success: proteinProduced,
        message,
        proteinProduced
      };

      updateSimulation({
        polymerasePosition: path[path.length - 1],
        currentStep: path.length - 1,
        status: 'complete',
        isPlaying: false,
        mrnaGenerated: proteinProduced,
        pairedResult: message
      });

      saveSnapshot(result);
      return;
    }

    if (currentStep !== pathIndexRef.current) {
      pathIndexRef.current = currentStep;

      const currentElementId = path[currentStep].elementId;
      const element = elements.find((e) => e.id === currentElementId);

      if (element?.type === 'repressor') {
        const hasInducerNearby = elements.some((e) => {
          if (e.type !== 'inducer') return false;
          const dist = Math.sqrt(
            Math.pow(e.position.x - element.position.x, 2) +
            Math.pow(e.position.y - element.position.y, 2)
          );
          return dist < 200;
        });

        if (!hasInducerNearby) {
          updateSimulation({
            status: 'blocked',
            isPlaying: false,
            blockedByRepressor: true,
            pairedResult: '转录被阻遏物阻断！添加诱导物可解除抑制。'
          });
          const result: SimulationResult = {
            success: false,
            message: '转录被阻遏物阻断',
            proteinProduced: false,
            blockedAt: element.label
          };
          saveSnapshot(result);
          return;
        }
      }
    }

    const pos = interpolatePosition(path[currentStep], path[currentStep + 1], stepProgress);

    updateSimulation({
      currentStep,
      polymerasePosition: pos,
      status: 'running'
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [simulation.isPlaying, buildPath, elements, updateSimulation, saveSnapshot]);

  useEffect(() => {
    if (simulation.isPlaying) {
      startTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [simulation.isPlaying, animate]);

  const handlePlayPause = () => {
    if (simulation.status === 'complete' || simulation.status === 'blocked') {
      resetSimulation();
      setTimeout(() => playSimulation(), 100);
    } else if (simulation.isPlaying) {
      pauseSimulation();
    } else {
      playSimulation();
    }
  };

  const handleReset = () => {
    resetSimulation();
    startTimeRef.current = 0;
    pathIndexRef.current = 0;
    pathRef.current = [];
  };

  const handleExportSvg = () => {
    exportSvg(elements, connections);
  };

  const handleExportGif = () => {
    const canvas = document.querySelector('.canvas-svg') as unknown as HTMLCanvasElement;
    exportGif(canvas);
  };

  const handleSaveSnapshot = () => {
    saveSnapshot();
  };

  const progress = simulation.totalSteps > 0
    ? (simulation.currentStep / Math.max(simulation.totalSteps - 1, 1)) * 100
    : 0;

  const isButtonPressed = simulation.isPlaying;

  return (
    <div className="simulation-controller" ref={canvasRef}>
      <div className="controller-left">
        <button
          className="icon-button"
          onClick={handleSaveSnapshot}
          title="保存快照"
        >
          <Save size={18} />
          <span>保存</span>
        </button>
        <button
          className="icon-button"
          onClick={handleExportSvg}
          title="导出SVG"
        >
          <Download size={18} />
          <span>SVG</span>
        </button>
        <button
          className="icon-button"
          onClick={handleExportGif}
          title="导出GIF"
        >
          <Image size={18} />
          <span>GIF</span>
        </button>
      </div>

      <div className="controller-center">
        <button
          className="icon-button"
          onClick={handleReset}
          title="重置"
        >
          <RotateCcw size={20} />
        </button>

        <button
          className={`play-button ${isButtonPressed ? 'pressed' : ''}`}
          onClick={handlePlayPause}
          title={simulation.isPlaying ? '暂停' : '播放'}
        >
          {simulation.isPlaying ? <Pause size={24} color="#fff" /> : <Play size={24} color="#fff" />}
        </button>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">
            {simulation.currentStep + 1} / {Math.max(simulation.totalSteps, 1)}
          </span>
        </div>
      </div>

      <div className="controller-right">
        <span className={`status-indicator status-${simulation.status}`}>
          {simulation.status === 'idle' && '待开始'}
          {simulation.status === 'running' && '模拟中...'}
          {simulation.status === 'blocked' && '已阻断'}
          {simulation.status === 'complete' && '已完成'}
        </span>
      </div>
    </div>
  );
};
