import React from 'react';
import { useAppStore, ModelId } from './store';
import { MaterialType, EnvType } from '../engine/SceneManager';
import { Undo2, RotateCcw, Move, Droplets, Sparkles } from 'lucide-react';

import type { BrushType } from './store';

const brushTypeLabels: Record<BrushType, { label: string; icon: React.ReactNode }> = {
  pull: { label: '推拉笔刷', icon: <Move size={16} /> },
  smooth: { label: '平滑笔刷', icon: <Droplets size={16} /> },
  inflate: { label: '膨胀笔刷', icon: <Sparkles size={16} /> }
};

const materialLabels: Record<MaterialType, string> = {
  clay: '灰色粘土',
  stone: '粗糙石材',
  plastic: '抛光塑料',
  metal: '金属铬'
};

const envLabels: Record<EnvType, string> = {
  sunset: '暖黄昏',
  bluehour: '蓝色时刻',
  space: '暗黑太空',
  neutral: '中性灰'
};

const modelLabels: Record<ModelId, string> = {
  sphere: '低面球体',
  torusknot: '圆环结'
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = ''
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-[#d0d0e0] font-medium">{label}</span>
        <span className="text-sm text-[#7f8cff] font-mono">
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="relative h-2 bg-[#3a3a55] rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-[#7f8cff] rounded-full transition-all duration-100"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

interface ControlPanelProps {
  onUndo: () => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onUndo, onReset }) => {
  const {
    currentModel,
    brushParams,
    materialType,
    envType,
    vertexCount,
    undoStack,
    brushDirection,
    isUndoing,
    setCurrentModel,
    setBrushParam,
    setMaterial,
    setEnv,
    setBrushDirection
  } = useAppStore();

  return (
    <div className="h-full w-full bg-[#252538] p-4 overflow-y-auto font-sans">
      <h1 className="text-xl font-semibold text-[#d0d0e0] mb-4 tracking-tight">
        数字雕塑预览器
      </h1>

      <div className="mb-4 p-3 bg-[#2a2a40] rounded-lg border border-[#3a3a55]">
        <div className="text-xs text-[#8888aa] mb-1">当前模型顶点数</div>
        <div className="text-2xl font-mono text-[#7f8cff]">
          {vertexCount.toLocaleString()}
        </div>
      </div>

      <div className="bg-[#2a2a40] rounded-xl p-4 border border-[#3a3a55] mb-4">
        <h2 className="text-sm font-semibold text-[#d0d0e0] mb-3">模型选择</h2>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(modelLabels) as ModelId[]).map((model) => (
            <button
              key={model}
              onClick={() => setCurrentModel(model)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentModel === model
                  ? 'bg-[#7f8cff] text-white shadow-lg shadow-[#7f8cff]/20'
                  : 'bg-[#3a3a55] text-[#d0d0e0] hover:bg-[#4a4a65]'
              }`}
            >
              {modelLabels[model]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#2a2a40] rounded-xl p-4 border border-[#3a3a55] mb-4">
        <h2 className="text-sm font-semibold text-[#d0d0e0] mb-3">笔刷参数</h2>

        <div className="mb-4">
          <div className="text-xs text-[#8888aa] mb-2">笔刷类型</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(brushTypeLabels) as Array<keyof typeof brushTypeLabels>).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setBrushParam('type', type)}
                  className={`flex flex-col items-center justify-center px-2 py-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                    brushParams.type === type
                      ? 'bg-[#7f8cff] text-white shadow-lg shadow-[#7f8cff]/20'
                      : 'bg-[#3a3a55] text-[#d0d0e0] hover:bg-[#4a4a65]'
                  }`}
                >
                  {brushTypeLabels[type].icon}
                  <span className="mt-1">{brushTypeLabels[type].label}</span>
                </button>
              )
            )}
          </div>
        </div>

        {brushParams.type === 'pull' && (
          <div className="mb-4">
            <div className="text-xs text-[#8888aa] mb-2">推拉方向</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBrushDirection('out')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  brushDirection === 'out'
                    ? 'bg-[#7f8cff] text-white shadow-lg shadow-[#7f8cff]/20'
                    : 'bg-[#3a3a55] text-[#d0d0e0] hover:bg-[#4a4a65]'
                }`}
              >
                向外推
              </button>
              <button
                onClick={() => setBrushDirection('in')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  brushDirection === 'in'
                    ? 'bg-[#7f8cff] text-white shadow-lg shadow-[#7f8cff]/20'
                    : 'bg-[#3a3a55] text-[#d0d0e0] hover:bg-[#4a4a65]'
                }`}
              >
                向内拉
              </button>
            </div>
          </div>
        )}

        <Slider
          label="笔刷大小"
          value={brushParams.size}
          min={0.1}
          max={2.0}
          step={0.1}
          onChange={(v) => setBrushParam('size', v)}
          unit=" 单位"
        />

        <Slider
          label="强度"
          value={brushParams.intensity}
          min={0.1}
          max={1.0}
          step={0.1}
          onChange={(v) => setBrushParam('intensity', v)}
        />

        <Slider
          label="硬度"
          value={brushParams.hardness}
          min={0.0}
          max={1.0}
          step={0.1}
          onChange={(v) => setBrushParam('hardness', v)}
        />
      </div>

      <div className="bg-[#2a2a40] rounded-xl p-4 border border-[#3a3a55] mb-4">
        <h2 className="text-sm font-semibold text-[#d0d0e0] mb-3">材质预览</h2>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(Object.keys(materialLabels) as MaterialType[]).map((type) => (
            <button
              key={type}
              onClick={() => setMaterial(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                materialType === type
                  ? 'bg-[#7f8cff] text-white shadow-lg shadow-[#7f8cff]/20'
                  : 'bg-[#3a3a55] text-[#d0d0e0] hover:bg-[#4a4a65]'
              }`}
            >
              {materialLabels[type]}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#8888aa] mb-2">环境贴图</div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(envLabels) as EnvType[]).map((type) => (
            <button
              key={type}
              onClick={() => setEnv(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                envType === type
                  ? 'bg-[#7f8cff] text-white shadow-lg shadow-[#7f8cff]/20'
                  : 'bg-[#3a3a55] text-[#d0d0e0] hover:bg-[#4a4a65]'
              }`}
            >
              {envLabels[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#2a2a40] rounded-xl p-4 border border-[#3a3a55]">
        <h2 className="text-sm font-semibold text-[#d0d0e0] mb-3">操作</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onUndo}
            disabled={undoStack.length === 0}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              undoStack.length === 0
                ? 'bg-[#3a3a55] text-[#666680] cursor-not-allowed'
                : 'bg-[#3a3a55] text-[#d0d0e0] hover:bg-[#4a4a65] active:scale-95'
            } ${isUndoing ? 'animate-pulse' : ''}`}
          >
            <Undo2 size={18} />
            <span>撤销 ({undoStack.length}/5)</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-[#3a3a55] text-[#d0d0e0] hover:bg-[#4a4a65] transition-all duration-200 active:scale-95"
          >
            <RotateCcw size={18} />
            <span>重置</span>
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-[#666680] text-center">
        拖拽模型表面以应用笔刷 | 滚轮缩放 | 右键旋转视角
      </div>
    </div>
  );
};
