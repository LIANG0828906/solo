import { useEffect, useRef } from 'react';
import { useEvolutionStore } from '../evolution/EvolutionStore';
import {
  drawBarChart,
  drawViolinChart,
  drawRadarChart,
  drawEvolutionTree,
} from './GeneChart';
import type { Genotype } from '../evolution/EvolutionEngine';
import { GENE_LABELS, GENE_NAMES } from '../evolution/EvolutionEngine';

export default function GeneticsPanel(): JSX.Element {
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const violinChartRef = useRef<HTMLCanvasElement>(null);
  const radarChartRef = useRef<HTMLCanvasElement>(null);
  const treeChartRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    population,
    populationStats,
    history,
    selectionPressure,
    mutationRate,
    generationSpeed,
    setSelectionPressure,
    setMutationRate,
    setGenerationSpeed,
    mutationAlert,
    hideMutationAlert,
  } = useEvolutionStore();

  const selectedIndividual = useEvolutionStore(
    (state) => state.population.find((ind) => ind.id === state.selectedIndividualId)
  );

  useEffect(() => {
    const drawCharts = (): void => {
      const barCanvas = barChartRef.current;
      const violinCanvas = violinChartRef.current;
      const radarCanvas = radarChartRef.current;
      const treeCanvas = treeChartRef.current;

      if (barCanvas) {
        const ctx = barCanvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = barCanvas.getBoundingClientRect();
          barCanvas.width = rect.width * dpr;
          barCanvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          drawBarChart(ctx, rect.width, rect.height, populationStats);
        }
      }

      if (violinCanvas) {
        const ctx = violinCanvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = violinCanvas.getBoundingClientRect();
          violinCanvas.width = rect.width * dpr;
          violinCanvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          drawViolinChart(ctx, rect.width, rect.height, population);
        }
      }

      if (radarCanvas) {
        const ctx = radarCanvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = radarCanvas.getBoundingClientRect();
          radarCanvas.width = rect.width * dpr;
          radarCanvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          drawRadarChart(ctx, rect.width, rect.height, selectedIndividual);
        }
      }

      if (treeCanvas && history.length > 0) {
        const ctx = treeCanvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = treeCanvas.getBoundingClientRect();
          treeCanvas.width = rect.width * dpr;
          treeCanvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          drawEvolutionTree(ctx, rect.width, rect.height, history);
        }
      }

      animationFrameRef.current = requestAnimationFrame(drawCharts);
    };

    animationFrameRef.current = requestAnimationFrame(drawCharts);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [population, populationStats, selectedIndividual, history]);

  const getGeneValue = (individual: Genotype, index: number): string => {
    const geneName = GENE_NAMES[index];
    return (individual[geneName] * 100).toFixed(1) + '%';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1E1E2E] text-white overflow-y-auto">
      {mutationAlert && mutationAlert.visible && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50
          bg-gradient-to-r from-[#E74C3C] to-[#FF6B6B]
          px-6 py-3 rounded-xl shadow-2xl
          animate-bounce">
          <p className="font-semibold text-sm">
            ⚡ 突变个体 #{mutationAlert.id.slice(0, 8)} 出现！
          </p>
          <button
            onClick={hideMutationAlert}
            className="absolute top-1 right-2 text-white/80 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white mb-1 font-['Space_Grotesk']">
          🧬 基因分析面板
        </h2>
        <p className="text-xs text-white/50">实时监控种群基因分布</p>
      </div>

      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90 mb-3">基因平均值分布</h3>
        <div className="bg-[#16162A] rounded-xl p-2">
          <canvas
            ref={barChartRef}
            className="w-full"
            style={{ height: '140px' }}
          />
        </div>
      </div>

      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90 mb-3">基因分布密度</h3>
        <div className="bg-[#16162A] rounded-xl p-2">
          <canvas
            ref={violinChartRef}
            className="w-full"
            style={{ height: '140px' }}
          />
        </div>
      </div>

      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90 mb-3">个体基因详情</h3>
        <div className="bg-[#16162A] rounded-xl p-2 mb-3">
          <canvas
            ref={radarChartRef}
            className="w-full"
            style={{ height: '200px' }}
          />
        </div>
        {selectedIndividual && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {GENE_LABELS.map((label, index) => (
              <div
                key={label}
                className="flex justify-between items-center
                  bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-white/60">{label}</span>
                <span className="font-mono text-[#7C4DFF] font-semibold">
                  {getGeneValue(selectedIndividual, index)}
                </span>
              </div>
            ))}
            <div className="col-span-2 flex justify-between items-center
              bg-gradient-to-r from-[#3498DB]/20 to-[#E74C3C]/20 rounded-lg px-3 py-2">
              <span className="text-white/80 font-semibold">适应度</span>
              <span className="font-mono text-white font-bold">
                {(selectedIndividual.fitness * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90 mb-3">进化趋势</h3>
        <div className="bg-[#16162A] rounded-xl p-2">
          <canvas
            ref={treeChartRef}
            className="w-full"
            style={{ height: '120px' }}
          />
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-white/90 mb-4">进化参数控制</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-white/70">选择压力</label>
              <span className="text-xs font-mono text-[#7C4DFF] font-semibold">
                {selectionPressure.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={selectionPressure}
              onChange={(e) => setSelectionPressure(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#7C4DFF]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-125"
            />
            <p className="text-[10px] text-white/40 mt-1">
              值越高，适应度高的个体越容易被选择
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-white/70">变异率</label>
              <span className="text-xs font-mono text-[#7C4DFF] font-semibold">
                {(mutationRate * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={mutationRate}
              onChange={(e) => setMutationRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#7C4DFF]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-125"
            />
            <p className="text-[10px] text-white/40 mt-1">
              基因随机突变的概率
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-white/70">代际速度</label>
              <span className="text-xs font-mono text-[#7C4DFF] font-semibold">
                {generationSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={generationSpeed}
              onChange={(e) => setGenerationSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#7C4DFF]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-125"
            />
            <p className="text-[10px] text-white/40 mt-1">
              进化动画的播放速度
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
