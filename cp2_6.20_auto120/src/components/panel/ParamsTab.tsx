import React from 'react';
import { useSceneStore } from '@/store/sceneStore';
import { Slider } from './Slider';
import type { OrganelleVisibility } from '@/types';

const visibilityItems: {
  key: keyof OrganelleVisibility;
  label: string;
  color: string;
  icon: string;
}[] = [
  { key: 'membrane', label: '细胞膜', color: '#6495ed', icon: '◯' },
  { key: 'nucleus', label: '细胞核', color: '#87ceeb', icon: '●' },
  { key: 'mitochondria', label: '线粒体', color: '#8b0000', icon: '⬭' },
  { key: 'er', label: '内质网', color: '#98fb98', icon: '◈' },
  { key: 'axisIndicator', label: '坐标轴', color: '#f59e0b', icon: '⤢' },
];

export const ParamsTab: React.FC = () => {
  const params = useSceneStore((state) => state.params);
  const updateParams = useSceneStore((state) => state.updateParams);

  const toggleVisibility = (key: keyof OrganelleVisibility) => {
    updateParams({
      visibility: {
        ...params.visibility,
        [key]: !params.visibility[key],
      },
    });
  };

  const toggleAll = (show: boolean) => {
    const all: OrganelleVisibility = {
      nucleus: show,
      mitochondria: show,
      er: show,
      membrane: show,
      axisIndicator: show,
    };
    updateParams({ visibility: all });
  };

  return (
    <div className="params-section">
      <div className="section-title">细胞器可见性</div>

      <div className="visibility-toolbar">
        <button
          className="visibility-toolbar-btn"
          onClick={() => toggleAll(true)}
        >
          显示全部
        </button>
        <button
          className="visibility-toolbar-btn"
          onClick={() => toggleAll(false)}
        >
          隐藏全部
        </button>
      </div>

      <div className="visibility-list">
        {visibilityItems.map((item) => {
          const active = params.visibility[item.key];
          return (
            <div
              key={item.key}
              className={`visibility-item ${active ? 'active' : ''}`}
              onClick={() => toggleVisibility(item.key)}
            >
              <div className="visibility-row">
                <span
                  className="visibility-icon"
                  style={{ color: active ? item.color : '#555' }}
                >
                  {item.icon}
                </span>
                <span className="visibility-label">{item.label}</span>
                <div className={`toggle-switch ${active ? 'on' : 'off'}`}>
                  <div className="toggle-thumb" />
                </div>
              </div>
              {item.key !== 'axisIndicator' && item.key !== 'membrane' && (
                <div
                  className="visibility-colorbar"
                  style={{
                    background: active
                      ? `linear-gradient(90deg, ${item.color}33, ${item.color})`
                      : 'transparent',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="section-title" style={{ marginTop: '16px' }}>渲染参数</div>

      <Slider
        label="环境光强度"
        value={params.ambientLightIntensity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateParams({ ambientLightIntensity: v })}
      />

      <Slider
        label="细胞膜透明度"
        value={params.membraneOpacity}
        min={0}
        max={0.8}
        step={0.01}
        onChange={(v) => updateParams({ membraneOpacity: v })}
      />

      <div className="section-title" style={{ marginTop: '16px' }}>囊泡参数</div>

      <Slider
        label="囊泡大小"
        value={params.vesicleSize}
        min={0.1}
        max={0.5}
        step={0.01}
        onChange={(v) => updateParams({ vesicleSize: v })}
      />

      <Slider
        label="尾迹长度"
        value={params.trailLength}
        min={5}
        max={50}
        step={1}
        onChange={(v) => updateParams({ trailLength: v })}
      />
    </div>
  );
};

export default ParamsTab;
