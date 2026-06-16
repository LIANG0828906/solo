import { useMemo } from 'react';
import { Card, Select, Slider, Switch, Button, ConfigProvider } from 'antd';
import moleculesData from '@/data/molecules.json';
import { useMoleculeStore } from '@/store';
import type { MoleculeState } from '@/store';

interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Array<{ element: string; x: number; y: number; z: number; radius: number; color: string }>;
  bonds: Array<{ from: number; to: number; order: number }>;
}

const { molecules } = moleculesData as { molecules: Molecule[] };

const cardStyle: React.CSSProperties = {
  background: '#3a3a54',
  borderRadius: 8,
  border: 'none',
};

const cardBodyStyle: React.CSSProperties = {
  padding: 16,
};

const labelStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: 14,
  marginBottom: 8,
};

const valueStyle: React.CSSProperties = {
  color: '#00d4ff',
  fontSize: 14,
  fontWeight: 600,
};

const rowStyle: React.CSSProperties = {
  marginBottom: 12,
};

const lastRowStyle: React.CSSProperties = {
  marginBottom: 0,
};

export default function ControlPanel() {
  const currentMoleculeId = useMoleculeStore((state: MoleculeState) => state.currentMoleculeId);
  const cameraDistance = useMoleculeStore((state: MoleculeState) => state.cameraDistance);
  const rotationY = useMoleculeStore((state: MoleculeState) => state.rotationY);
  const rotationX = useMoleculeStore((state: MoleculeState) => state.rotationX);
  const showLabels = useMoleculeStore((state: MoleculeState) => state.showLabels);
  const autoRotate = useMoleculeStore((state: MoleculeState) => state.autoRotate);

  const setCurrentMolecule = useMoleculeStore((state: MoleculeState) => state.setCurrentMolecule);
  const setCameraDistance = useMoleculeStore((state: MoleculeState) => state.setCameraDistance);
  const setRotationY = useMoleculeStore((state: MoleculeState) => state.setRotationY);
  const setRotationX = useMoleculeStore((state: MoleculeState) => state.setRotationX);
  const toggleLabels = useMoleculeStore((state: MoleculeState) => state.toggleLabels);
  const toggleAutoRotate = useMoleculeStore((state: MoleculeState) => state.toggleAutoRotate);
  const resetView = useMoleculeStore((state: MoleculeState) => state.resetView);

  const currentMolecule = useMemo(
    () => molecules.find((m) => m.id === currentMoleculeId),
    [currentMoleculeId]
  );

  const options = molecules.map((m) => ({
    value: m.id,
    label: m.name,
  }));

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00d4ff',
          colorBgContainer: '#3a3a54',
          colorBorder: '#555577',
          colorText: '#ffffff',
          colorTextPlaceholder: '#9999bb',
          borderRadius: 8,
        },
        components: {
          Slider: {
            trackBg: '#00d4ff',
            railBg: '#555577',
            handleColor: '#00d4ff',
            handleActiveColor: '#00d4ff',
            dotBorderColor: '#555577',
            dotActiveBorderColor: '#00d4ff',
          },
          Select: {
            optionSelectedBg: '#4a4a64',
            optionActiveBg: '#454560',
          },
        },
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Card style={cardStyle} styles={{ body: cardBodyStyle }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#00d4ff', fontSize: 18, fontWeight: 700 }}>
              {currentMolecule?.name}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ffffff', fontSize: 14 }}>
              原子数量: <span style={valueStyle}>{currentMolecule?.atoms.length ?? 0}</span>
            </span>
            <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 600 }}>
              {currentMolecule?.formula}
            </span>
          </div>
        </Card>

        <Card style={cardStyle} styles={{ body: cardBodyStyle }}>
          <div style={rowStyle}>
            <div style={labelStyle}>分子选择</div>
            <Select
              value={currentMoleculeId}
              onChange={setCurrentMolecule}
              options={options}
              style={{ width: '100%' }}
              size="large"
            />
          </div>
        </Card>

        <Card style={cardStyle} styles={{ body: cardBodyStyle }}>
          <div style={rowStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={labelStyle}>视角距离</span>
              <span style={valueStyle}>{cameraDistance.toFixed(1)} Å</span>
            </div>
            <Slider
              min={5}
              max={20}
              step={0.1}
              value={cameraDistance}
              onChange={setCameraDistance}
            />
          </div>
          <div style={rowStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={labelStyle}>水平旋转角度</span>
              <span style={valueStyle}>{rotationY}°</span>
            </div>
            <Slider
              min={0}
              max={360}
              step={1}
              value={rotationY}
              onChange={setRotationY}
            />
          </div>
          <div style={lastRowStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={labelStyle}>垂直倾斜角度</span>
              <span style={valueStyle}>{rotationX}°</span>
            </div>
            <Slider
              min={-90}
              max={90}
              step={1}
              value={rotationX}
              onChange={setRotationX}
            />
          </div>
        </Card>

        <Card style={cardStyle} styles={{ body: cardBodyStyle }}>
          <div style={{ ...rowStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={labelStyle}>标签显示</span>
            <Switch checked={showLabels} onChange={toggleLabels} />
          </div>
          <div style={{ ...rowStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={labelStyle}>自动旋转</span>
            <Switch checked={autoRotate} onChange={toggleAutoRotate} />
          </div>
          <div style={lastRowStyle}>
            <Button type="primary" block size="large" onClick={resetView}>
              重置视角
            </Button>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}
