import React from 'react';
import { Select, Slider, Switch, Card, Button, Space, Tooltip } from 'antd';
import {
  SyncOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  RotateRightOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { useMoleculeStore } from '@/store';
import moleculesData from '@/data/molecules.json';

const moleculeOptions = Object.entries(moleculesData).map(([key, val]) => ({
  value: key,
  label: (val as { name: string }).name,
}));

export default function ControlPanel() {
  const currentMolecule = useMoleculeStore((s) => s.currentMolecule);
  const viewDistance = useMoleculeStore((s) => s.viewDistance);
  const horizontalRotation = useMoleculeStore((s) => s.horizontalRotation);
  const verticalTilt = useMoleculeStore((s) => s.verticalTilt);
  const showLabels = useMoleculeStore((s) => s.showLabels);
  const autoRotate = useMoleculeStore((s) => s.autoRotate);
  const setCurrentMolecule = useMoleculeStore((s) => s.setCurrentMolecule);
  const setViewDistance = useMoleculeStore((s) => s.setViewDistance);
  const setHorizontalRotation = useMoleculeStore((s) => s.setHorizontalRotation);
  const setVerticalTilt = useMoleculeStore((s) => s.setVerticalTilt);
  const setShowLabels = useMoleculeStore((s) => s.setShowLabels);
  const setAutoRotate = useMoleculeStore((s) => s.setAutoRotate);

  const currentData = moleculesData[currentMolecule] as {
    name: string;
    atoms: unknown[];
  };

  const atomCount = currentData?.atoms?.length ?? 0;

  const sliderStyle: React.CSSProperties = {
    '--antd-slider-track-color': '#4a4a6a',
    '--antd-slider-handle-color': '#00d4ff',
  } as React.CSSProperties;

  return (
    <div
      style={{
        width: '320px',
        height: '100vh',
        background: '#2d2d44',
        borderTop: '2px solid #00d4ff',
        padding: '20px 16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '-4px 0 20px rgba(0, 212, 255, 0.1)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '8px',
          paddingBottom: '16px',
          borderBottom: '1px solid #4a4a6a',
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#00d4ff', marginBottom: '4px' }}>
          {currentData?.name ?? ''}
        </div>
        <div style={{ fontSize: '14px', color: '#8888aa' }}>
          原子数量: <span style={{ color: '#00d4ff', fontSize: '18px', fontWeight: 600 }}>{atomCount}</span>
        </div>
      </div>

      <Card
        size="small"
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: '1px solid #4a4a6a',
        }}
        styles={{ body: { padding: '12px' } }}
      >
        <div style={{ color: '#aaaacc', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
          选择分子
        </div>
        <Select
          value={currentMolecule}
          onChange={setCurrentMolecule}
          options={moleculeOptions}
          style={{ width: '100%' }}
          classNames={{ popup: { root: 'dark-dropdown' } }}
        />
      </Card>

      <Card
        size="small"
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: '1px solid #4a4a6a',
        }}
        styles={{ body: { padding: '12px' } }}
      >
        <div style={{ color: '#aaaacc', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
          视角距离: <span style={{ color: '#00d4ff' }}>{viewDistance.toFixed(1)}</span>
        </div>
        <Slider
          min={5}
          max={20}
          step={0.1}
          value={viewDistance}
          onChange={setViewDistance}
          style={sliderStyle}
        />
      </Card>

      <Card
        size="small"
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: '1px solid #4a4a6a',
        }}
        styles={{ body: { padding: '12px' } }}
      >
        <div style={{ color: '#aaaacc', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
          水平旋转: <span style={{ color: '#00d4ff' }}>{horizontalRotation}°</span>
        </div>
        <Slider
          min={0}
          max={360}
          step={1}
          value={horizontalRotation}
          onChange={setHorizontalRotation}
          style={sliderStyle}
        />
      </Card>

      <Card
        size="small"
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: '1px solid #4a4a6a',
        }}
        styles={{ body: { padding: '12px' } }}
      >
        <div style={{ color: '#aaaacc', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
          垂直倾斜: <span style={{ color: '#00d4ff' }}>{verticalTilt}°</span>
        </div>
        <Slider
          min={-90}
          max={90}
          step={1}
          value={verticalTilt}
          onChange={setVerticalTilt}
          style={sliderStyle}
        />
      </Card>

      <Card
        size="small"
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: '1px solid #4a4a6a',
        }}
        styles={{ body: { padding: '12px' } }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#aaaacc', fontSize: '13px', fontWeight: 500 }}>显示原子标签</span>
            <Switch
              checked={showLabels}
              onChange={setShowLabels}
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#aaaacc', fontSize: '13px', fontWeight: 500 }}>自动旋转</span>
            <Switch
              checked={autoRotate}
              onChange={setAutoRotate}
              checkedChildren={<RotateRightOutlined />}
              unCheckedChildren={<PauseCircleOutlined />}
            />
          </div>
        </Space>
      </Card>

      <Card
        size="small"
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: '1px solid #4a4a6a',
        }}
        styles={{ body: { padding: '12px' } }}
      >
        <div style={{ color: '#aaaacc', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
          快捷操作
        </div>
        <Space style={{ width: '100%' }} wrap>
          <Tooltip title="重置视角">
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => {
                setViewDistance(10);
                setHorizontalRotation(0);
                setVerticalTilt(0);
              }}
            >
              重置
            </Button>
          </Tooltip>
        </Space>
      </Card>

      <div
        style={{
          marginTop: 'auto',
          textAlign: 'center',
          color: '#4a4a6a',
          fontSize: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #4a4a6a',
        }}
      >
        分子结构3D查看器 v1.0
      </div>
    </div>
  );
}
