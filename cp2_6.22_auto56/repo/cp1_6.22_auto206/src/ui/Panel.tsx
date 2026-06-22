import React, { useState } from 'react';
import { ChevronDown, Sparkles, Zap, Waves, Tornado, CloudRain } from 'lucide-react';
import { Slider } from './Slider';
import { useParticleStore } from '../store/useParticleStore';
import { presets } from '../particlePresets';

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles size={18} />,
  Zap: <Zap size={18} />,
  Waves: <Waves size={18} />,
  Tornado: <Tornado size={18} />,
  CloudRain: <CloudRain size={18} />,
};

export const Panel: React.FC = () => {
  const [paramsExpanded, setParamsExpanded] = useState(true);
  const [presetsExpanded, setPresetsExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  const params = useParticleStore((state) => state.params);
  const activePreset = useParticleStore((state) => state.activePreset);
  const isTransitioning = useParticleStore((state) => state.isTransitioning);
  const transitionProgress = useParticleStore((state) => state.transitionProgress);
  const setParam = useParticleStore((state) => state.setParam);
  const applyPreset = useParticleStore((state) => state.applyPreset);
  const renderMode = useParticleStore((state) => state.renderMode);
  const toggleRenderMode = useParticleStore((state) => state.toggleRenderMode);
  const autoRotate = useParticleStore((state) => state.autoRotate);
  const toggleAutoRotate = useParticleStore((state) => state.toggleAutoRotate);
  const resetParams = useParticleStore((state) => state.resetParams);

  const handlePresetClick = (presetId: string) => {
    if (!isTransitioning) {
      applyPreset(presetId);
    }
  };

  return (
    <div className="w-[340px] h-full glass-panel flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          流体粒子系统
        </h1>
        <p className="text-xs text-slate-400 mt-1">Fluid Particle Studio</p>
        {isTransitioning && (
          <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-100"
              style={{ width: `${transitionProgress * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="mb-4 animate-fade-in-up">
          <button
            onClick={() => setPresetsExpanded(!presetsExpanded)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400" />
              预设形态
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform duration-300 ${presetsExpanded ? '' : '-rotate-90'}`}
            />
          </button>
          {presetsExpanded && (
            <div className="grid grid-cols-2 gap-2 mt-2 px-1">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id)}
                  disabled={isTransitioning}
                  className={`preset-button flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 text-slate-300 text-sm ${
                    activePreset === preset.id ? 'active' : ''
                  } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-cyan-400">{iconMap[preset.icon]}</span>
                  <span className="text-xs font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 animate-fade-in-up animate-delay-100">
          <button
            onClick={() => setParamsExpanded(!paramsExpanded)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              参数控制
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform duration-300 ${paramsExpanded ? '' : '-rotate-90'}`}
            />
          </button>
          {paramsExpanded && (
            <div className="mt-3 px-1">
              <Slider
                label="粒子数量"
                value={params.count}
                min={500}
                max={15000}
                step={500}
                onChange={(v) => setParam('count', Math.round(v))}
              />
              <Slider
                label="发射半径"
                value={params.emissionRadius}
                min={1}
                max={10}
                step={0.5}
                unit=" 单位"
                onChange={(v) => setParam('emissionRadius', v)}
              />
              <Slider
                label="粒子寿命"
                value={params.lifetime}
                min={0.5}
                max={5}
                step={0.1}
                unit=" 秒"
                onChange={(v) => setParam('lifetime', v)}
              />
              <Slider
                label="涡流强度"
                value={params.vortexStrength}
                min={0}
                max={5}
                step={0.1}
                onChange={(v) => setParam('vortexStrength', v)}
              />
              <Slider
                label="波浪频率"
                value={params.waveFrequency}
                min={0.1}
                max={3}
                step={0.1}
                onChange={(v) => setParam('waveFrequency', v)}
              />
              <Slider
                label="重力影响"
                value={params.gravity}
                min={-1}
                max={1}
                step={0.1}
                onChange={(v) => setParam('gravity', v)}
              />
              <Slider
                label="扩散角度"
                value={params.spreadAngle}
                min={0}
                max={180}
                step={5}
                unit="°"
                onChange={(v) => setParam('spreadAngle', v)}
              />
            </div>
          )}
        </div>

        <div className="animate-fade-in-up animate-delay-200">
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              显示设置
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform duration-300 ${settingsExpanded ? '' : '-rotate-90'}`}
            />
          </button>
          {settingsExpanded && (
            <div className="mt-3 px-1 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-300">渲染模式</p>
                  <p className="text-xs text-slate-500">
                    {renderMode === 'points' ? '点阵模式' : '网格模式'}
                  </p>
                </div>
                <button
                  onClick={toggleRenderMode}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-medium hover:border-cyan-400 transition-colors"
                >
                  切换
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-300">自动旋转</p>
                  <p className="text-xs text-slate-500">
                    {autoRotate ? '已开启' : '已关闭'}
                  </p>
                </div>
                <div
                  className={`switch-track ${autoRotate ? 'active' : ''}`}
                  onClick={toggleAutoRotate}
                >
                  <div className="switch-thumb" />
                </div>
              </div>

              <button
                onClick={resetParams}
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 text-sm hover:bg-slate-700/50 hover:border-slate-600 transition-colors"
              >
                重置所有参数
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>粒子数: {params.count.toLocaleString()}</span>
          <span>FPS: <span className="text-cyan-400 font-mono">--</span></span>
        </div>
      </div>
    </div>
  );
};
