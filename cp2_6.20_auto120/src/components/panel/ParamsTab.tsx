import React from 'react';
import { useSceneStore } from '@/store/sceneStore';
import { Slider } from './Slider';

export const ParamsTab: React.FC = () => {
  const params = useSceneStore((state) => state.params);
  const updateParams = useSceneStore((state) => state.updateParams);

  return (
    <div className="params-section">
      <div className="section-title">渲染参数</div>

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

      <div className="section-title" style={{ marginTop: '8px' }}>囊泡参数</div>

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
