import React, { useState } from 'react';
import { Slider, ColorPicker, Collapse, Button, Space, Tooltip } from 'antd';
import { UndoOutlined, RedoOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useLightStore, LightConfig } from '@/store/lightStore';

interface LightCardProps {
  id: 'sun' | 'moon';
  config: LightConfig;
  updateLight: (id: 'sun' | 'moon', params: Partial<LightConfig>) => void;
}

const lightLabels: Record<string, { title: string; icon: React.ReactNode }> = {
  sun: { title: '平行光（太阳）', icon: <SunOutlined /> },
  moon: { title: '点光源（月光）', icon: <MoonOutlined /> },
};

function LightCard({ id, config, updateLight }: LightCardProps) {
  const { title, icon } = lightLabels[id];

  return (
    <div className="light-card">
      <Collapse
        defaultActiveKey={['1']}
        ghost
        items={[
          {
            key: '1',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                {icon}
                <span style={{ fontWeight: 600 }}>{title}</span>
              </div>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="param-row">
                  <label className="param-label">强度</label>
                  <div className="param-control">
                    <Slider
                      min={0}
                      max={5}
                      step={0.1}
                      value={config.intensity}
                      onChange={(v) => updateLight(id, { intensity: v })}
                    />
                    <span className="param-value">{config.intensity.toFixed(1)}</span>
                  </div>
                </div>
                <div className="param-row">
                  <label className="param-label">颜色</label>
                  <div className="param-control">
                    <ColorPicker
                      value={config.color}
                      onChange={(_, hex) => updateLight(id, { color: hex })}
                      size="small"
                    />
                    <span className="param-value">{config.color}</span>
                  </div>
                </div>
                <div className="param-row">
                  <label className="param-label">高度角</label>
                  <div className="param-control">
                    <Slider
                      min={0}
                      max={90}
                      step={1}
                      value={config.elevation}
                      onChange={(v) => updateLight(id, { elevation: v })}
                    />
                    <span className="param-value">{config.elevation}°</span>
                  </div>
                </div>
                <div className="param-row">
                  <label className="param-label">方位角</label>
                  <div className="param-control">
                    <Slider
                      min={0}
                      max={360}
                      step={1}
                      value={config.azimuth}
                      onChange={(v) => updateLight(id, { azimuth: v })}
                    />
                    <span className="param-value">{config.azimuth}°</span>
                  </div>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export default function ControlPanel() {
  const sun = useLightStore((s) => s.sun);
  const moon = useLightStore((s) => s.moon);
  const updateLight = useLightStore((s) => s.updateLight);
  const undo = useLightStore((s) => s.undo);
  const redo = useLightStore((s) => s.redo);
  const past = useLightStore((s) => s._past);
  const future = useLightStore((s) => s._future);

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>光源控制</h3>
        <Space size={4}>
          <Tooltip title="撤销">
            <Button
              type="text"
              size="small"
              icon={<UndoOutlined />}
              onClick={undo}
              disabled={past.length === 0}
              style={{ color: past.length > 0 ? '#e94560' : '#555' }}
            />
          </Tooltip>
          <Tooltip title="重做">
            <Button
              type="text"
              size="small"
              icon={<RedoOutlined />}
              onClick={redo}
              disabled={future.length === 0}
              style={{ color: future.length > 0 ? '#e94560' : '#555' }}
            />
          </Tooltip>
        </Space>
      </div>
      <LightCard id="sun" config={sun} updateLight={updateLight} />
      <LightCard id="moon" config={moon} updateLight={updateLight} />
    </div>
  );
}
