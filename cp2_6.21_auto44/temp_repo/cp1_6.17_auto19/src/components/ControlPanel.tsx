import { Card, Select, Slider, Switch, Button, Space, Typography, Divider } from 'antd'
import { ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { useMoleculeStore } from '@/store'

const { Title, Text } = Typography

const PANEL_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#2d2d44',
  padding: '16px',
  boxSizing: 'border-box',
  boxShadow: 'inset 0 2px 0 #00d4ff',
  overflowY: 'auto',
  overflowX: 'hidden',
}

const CARD_STYLE: React.CSSProperties = {
  borderRadius: '8px',
  marginBottom: '12px',
}

const cardStyles = {
  body: { padding: '16px' },
}

const SLIDER_STYLE: React.CSSProperties = {
  margin: '8px 0 16px 0',
}

const LABEL_STYLE: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  display: 'block',
  marginBottom: '4px',
}

const VALUE_STYLE: React.CSSProperties = {
  color: '#00d4ff',
  fontSize: '13px',
  float: 'right',
}

const markStyle: React.CSSProperties = {
  color: '#888899',
  fontSize: '11px',
}

export default function ControlPanel() {
  const {
    molecules,
    currentMoleculeId,
    cameraDistance,
    rotationY,
    rotationX,
    showLabels,
    autoRotate,
    setCurrentMolecule,
    setCameraDistance,
    setRotationY,
    setRotationX,
    toggleLabels,
    toggleAutoRotate,
    resetView,
    getCurrentMolecule,
  } = useMoleculeStore()

  const currentMolecule = getCurrentMolecule()

  return (
    <div style={PANEL_STYLE}>
      <Card style={CARD_STYLE} styles={cardStyles}>
        <Title
          level={4}
          style={{
            color: '#00d4ff',
            fontSize: '18px',
            margin: 0,
            fontWeight: 600,
          }}
        >
          {currentMolecule?.name}
        </Title>
        <Text style={{ color: '#888899', fontSize: '13px' }}>
          {currentMolecule?.formula} · {currentMolecule?.atoms.length} 个原子
        </Text>
      </Card>

      <Card style={CARD_STYLE} styles={cardStyles}>
        <Text style={LABEL_STYLE}>选择分子</Text>
        <Select
          value={currentMoleculeId}
          onChange={setCurrentMolecule}
          style={{ width: '100%' }}
          size="large"
          options={molecules.map((mol) => ({
            value: mol.id,
            label: `${mol.name} (${mol.formula})`,
          }))}
        />
      </Card>

      <Card style={CARD_STYLE} styles={cardStyles}>
        <Text style={LABEL_STYLE}>
          视角距离
          <Text style={VALUE_STYLE}>{cameraDistance.toFixed(1)}</Text>
        </Text>
        <Slider
          min={5}
          max={20}
          step={0.1}
          value={cameraDistance}
          onChange={setCameraDistance}
          style={SLIDER_STYLE}
          tooltip={{ formatter: (value) => `${value?.toFixed(1)}` }}
          marks={{
            5: { style: markStyle, label: '5' },
            10: { style: markStyle, label: '10' },
            15: { style: markStyle, label: '15' },
            20: { style: markStyle, label: '20' },
          }}
        />

        <Text style={LABEL_STYLE}>
          水平旋转
          <Text style={VALUE_STYLE}>{rotationY}°</Text>
        </Text>
        <Slider
          min={0}
          max={360}
          step={1}
          value={rotationY}
          onChange={setRotationY}
          style={SLIDER_STYLE}
          tooltip={{ formatter: (value) => `${value}°` }}
          marks={{
            0: { style: markStyle, label: '0°' },
            90: { style: markStyle, label: '90°' },
            180: { style: markStyle, label: '180°' },
            270: { style: markStyle, label: '270°' },
            360: { style: markStyle, label: '360°' },
          }}
        />

        <Text style={LABEL_STYLE}>
          垂直倾斜
          <Text style={VALUE_STYLE}>{rotationX}°</Text>
        </Text>
        <Slider
          min={-90}
          max={90}
          step={1}
          value={rotationX}
          onChange={setRotationX}
          style={SLIDER_STYLE}
          tooltip={{ formatter: (value) => `${value}°` }}
          marks={{
            [-90]: { style: markStyle, label: '-90°' },
            [-45]: { style: markStyle, label: '-45°' },
            0: { style: markStyle, label: '0°' },
            45: { style: markStyle, label: '45°' },
            90: { style: markStyle, label: '90°' },
          }}
        />
      </Card>

      <Card style={CARD_STYLE} styles={cardStyles}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: '100%' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: '14px' }}>显示原子标签</Text>
            <Switch
              checked={showLabels}
              onChange={toggleLabels}
              style={{ backgroundColor: showLabels ? '#00d4ff' : undefined }}
            />
          </div>

          <Divider style={{ margin: '8px 0', background: '#4a4a6a' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: '14px' }}>自动旋转</Text>
            <Switch
              checked={autoRotate}
              onChange={toggleAutoRotate}
              style={{ backgroundColor: autoRotate ? '#00d4ff' : undefined }}
              checkedChildren={<PlayCircleOutlined />}
              unCheckedChildren={<PauseCircleOutlined />}
            />
          </div>
        </Space>
      </Card>

      <Space style={{ width: '100%', marginTop: '12px' }}>
        <Button
          type="primary"
          size="large"
          icon={<ReloadOutlined />}
          onClick={resetView}
          style={{
            width: '100%',
            background: '#00d4ff',
            borderColor: '#00d4ff',
            borderRadius: '6px',
            height: '44px',
            fontSize: '15px',
            fontWeight: 500,
          }}
        >
          重置视角
        </Button>
      </Space>

      <Card style={{ ...CARD_STYLE, marginTop: '12px' }} styles={cardStyles}>
        <Text style={{ color: '#888899', fontSize: '12px', display: 'block' }}>
          💡 操作提示
        </Text>
        <Text style={{ color: '#666677', fontSize: '12px', display: 'block', marginTop: '8px', lineHeight: 1.6 }}>
          · 鼠标左键拖拽旋转模型<br />
          · 鼠标滚轮缩放视图<br />
          · 鼠标右键拖拽平移场景
        </Text>
      </Card>
    </div>
  )
}
