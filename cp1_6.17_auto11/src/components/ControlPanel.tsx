import { Card, Slider, Select, Switch, Button, Space, Typography } from 'antd'
import {
  ExperimentOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ReloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined
} from '@ant-design/icons'
import { useViewerStore } from '../store'
import moleculesData from '../data/molecules.json'
import type { Molecule } from '../types'

const { Title, Text } = Typography

const molecules = moleculesData as unknown as Record<string, Molecule>

const moleculeOptions = Object.entries(molecules).map(([key, mol]) => ({
  value: key,
  label: `${mol.nameZh} (${mol.formula})`
}))

export default function ControlPanel() {
  const currentMolecule = useViewerStore((s) => s.currentMolecule)
  const cameraDistance = useViewerStore((s) => s.cameraDistance)
  const rotationY = useViewerStore((s) => s.rotationY)
  const tiltX = useViewerStore((s) => s.tiltX)
  const showLabels = useViewerStore((s) => s.showLabels)
  const autoRotate = useViewerStore((s) => s.autoRotate)

  const setMolecule = useViewerStore((s) => s.setMolecule)
  const setCameraDistance = useViewerStore((s) => s.setCameraDistance)
  const setRotationY = useViewerStore((s) => s.setRotationY)
  const setTiltX = useViewerStore((s) => s.setTiltX)
  const toggleLabels = useViewerStore((s) => s.toggleLabels)
  const toggleAutoRotate = useViewerStore((s) => s.toggleAutoRotate)
  const resetView = useViewerStore((s) => s.resetView)

  const molecule = molecules[currentMolecule]

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        background: '#2d2d44',
        borderTop: '2px solid #00d4ff',
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <Card
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: 'none'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Space align="center" size={8}>
            <ExperimentOutlined style={{ fontSize: '24px', color: '#00d4ff' }} />
            <Title
              level={4}
              style={{
                color: '#00d4ff',
                fontSize: '18px',
                margin: 0,
                fontWeight: 600
              }}
            >
              {molecule.nameZh}
            </Title>
          </Space>
          <Text style={{ color: '#a0a0c0', fontSize: '13px' }}>
            分子式: {molecule.formula} · 原子数: {molecule.atoms.length}
          </Text>
        </Space>
      </Card>

      <Card
        title={<span style={{ color: '#ffffff', fontSize: '14px' }}>分子选择</span>}
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: 'none'
        }}
        headStyle={{
          borderBottom: '1px solid #4a4a6a',
          padding: '12px 16px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Select
          value={currentMolecule}
          onChange={setMolecule}
          options={moleculeOptions}
          size="large"
          variant="filled"
          style={{ width: '100%' }}
        />
      </Card>

      <Card
        title={<span style={{ color: '#ffffff', fontSize: '14px' }}>视角控制</span>}
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: 'none'
        }}
        headStyle={{
          borderBottom: '1px solid #4a4a6a',
          padding: '12px 16px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}
            >
              <Text style={{ color: '#c0c0e0', fontSize: '13px' }}>视角距离</Text>
              <Text style={{ color: '#00d4ff', fontSize: '13px' }}>
                {cameraDistance.toFixed(1)}
              </Text>
            </div>
            <Slider
              min={5}
              max={20}
              step={0.1}
              value={cameraDistance}
              onChange={setCameraDistance}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}
            >
              <Text style={{ color: '#c0c0e0', fontSize: '13px' }}>水平旋转</Text>
              <Text style={{ color: '#00d4ff', fontSize: '13px' }}>{rotationY}°</Text>
            </div>
            <Slider
              min={0}
              max={360}
              step={1}
              value={rotationY}
              onChange={setRotationY}
              disabled={autoRotate}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}
            >
              <Text style={{ color: '#c0c0e0', fontSize: '13px' }}>垂直倾斜</Text>
              <Text style={{ color: '#00d4ff', fontSize: '13px' }}>{tiltX}°</Text>
            </div>
            <Slider
              min={-90}
              max={90}
              step={1}
              value={tiltX}
              onChange={setTiltX}
            />
          </div>
        </Space>
      </Card>

      <Card
        title={<span style={{ color: '#ffffff', fontSize: '14px' }}>显示选项</span>}
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: 'none'
        }}
        headStyle={{
          borderBottom: '1px solid #4a4a6a',
          padding: '12px 16px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Space>
              {showLabels ? (
                <EyeOutlined style={{ color: '#00d4ff' }} />
              ) : (
                <EyeInvisibleOutlined style={{ color: '#888' }} />
              )}
              <Text style={{ color: '#c0c0e0', fontSize: '13px' }}>显示原子标签</Text>
            </Space>
            <Switch
              checked={showLabels}
              onChange={toggleLabels}
              style={{
                backgroundColor: showLabels ? '#00d4ff' : '#4a4a6a'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Space>
              {autoRotate ? (
                <RotateRightOutlined style={{ color: '#00d4ff' }} />
              ) : (
                <RotateLeftOutlined style={{ color: '#888' }} />
              )}
              <Text style={{ color: '#c0c0e0', fontSize: '13px' }}>自动旋转</Text>
            </Space>
            <Switch
              checked={autoRotate}
              onChange={toggleAutoRotate}
              style={{
                backgroundColor: autoRotate ? '#00d4ff' : '#4a4a6a'
              }}
            />
          </div>
        </Space>
      </Card>

      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={resetView}
        size="large"
        style={{
          background: '#00d4ff',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 500
        }}
      >
        重置视角
      </Button>

      <Card
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: 'none',
          marginTop: 'auto'
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Text style={{ color: '#888', fontSize: '11px', lineHeight: 1.6 }}>
          💡 提示: 鼠标拖拽可旋转模型，滚轮可缩放，右键可平移
        </Text>
      </Card>
    </div>
  )
}
