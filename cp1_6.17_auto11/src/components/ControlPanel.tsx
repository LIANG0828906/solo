import { Card, Slider, Select, Switch, Button, Space, Typography, Row, Col } from 'antd'
import {
  ExperimentOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ReloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  FontSizeOutlined,
  BgColorsOutlined
} from '@ant-design/icons'
import {
  useViewerStore,
  ELEMENTS,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  LABEL_COLOR_PRESETS
} from '../store'
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
  const labelVisibility = useViewerStore((s) => s.labelVisibility)
  const labelFontSize = useViewerStore((s) => s.labelFontSize)
  const labelColor = useViewerStore((s) => s.labelColor)
  const autoRotate = useViewerStore((s) => s.autoRotate)

  const setMolecule = useViewerStore((s) => s.setMolecule)
  const setCameraDistance = useViewerStore((s) => s.setCameraDistance)
  const setRotationY = useViewerStore((s) => s.setRotationY)
  const setTiltX = useViewerStore((s) => s.setTiltX)
  const setLabelVisibility = useViewerStore((s) => s.setLabelVisibility)
  const setLabelFontSize = useViewerStore((s) => s.setLabelFontSize)
  const setLabelColor = useViewerStore((s) => s.setLabelColor)
  const toggleAllLabels = useViewerStore((s) => s.toggleAllLabels)
  const toggleAutoRotate = useViewerStore((s) => s.toggleAutoRotate)
  const resetView = useViewerStore((s) => s.resetView)

  const molecule = molecules[currentMolecule]

  const allLabelsOn = ELEMENTS.every((el) => labelVisibility[el])
  const allLabelsOff = ELEMENTS.every((el) => !labelVisibility[el])

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
        title={<span style={{ color: '#ffffff', fontSize: '14px' }}>标签显示</span>}
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
              {allLabelsOn ? (
                <EyeOutlined style={{ color: '#00d4ff' }} />
              ) : allLabelsOff ? (
                <EyeInvisibleOutlined style={{ color: '#888' }} />
              ) : (
                <EyeOutlined style={{ color: '#ffeb3b' }} />
              )}
              <Text style={{ color: '#c0c0e0', fontSize: '13px' }}>全部标签</Text>
            </Space>
            <Switch
              checked={allLabelsOn}
              onChange={(checked) => toggleAllLabels(checked)}
              style={{
                backgroundColor: allLabelsOn ? '#00d4ff' : '#4a4a6a'
              }}
            />
          </div>

          <Row gutter={[8, 8]}>
            {ELEMENTS.map((element) => (
              <Col span={12} key={element}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#2d2d44',
                    borderRadius: '6px',
                    border: `1px solid ${
                      labelVisibility[element] ? '#00d4ff44' : '#4a4a6a44'
                    }`,
                    transition: 'border-color 0.2s'
                  }}
                >
                  <Space size={8}>
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: ELEMENT_COLORS[element],
                        border: element === 'H' ? '1px solid #888' : 'none',
                        boxShadow: `0 0 6px ${ELEMENT_COLORS[element]}40`
                      }}
                    />
                    <Text
                      style={{
                        color: labelVisibility[element] ? '#ffffff' : '#666',
                        fontSize: '12px'
                      }}
                    >
                      {ELEMENT_LABELS[element]}
                    </Text>
                  </Space>
                  <Switch
                    size="small"
                    checked={labelVisibility[element] ?? false}
                    onChange={(checked) => setLabelVisibility(element, checked)}
                    style={{
                      transform: 'scale(0.85)',
                      backgroundColor: labelVisibility[element] ? '#00d4ff' : '#4a4a6a'
                    }}
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Space>
      </Card>

      <Card
        title={
          <span style={{ color: '#ffffff', fontSize: '14px' }}>
            <Space size={6}>
              <BgColorsOutlined />
              标签样式
            </Space>
          </span>
        }
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
              <Space size={6}>
                <FontSizeOutlined style={{ color: '#c0c0e0' }} />
                <Text style={{ color: '#c0c0e0', fontSize: '13px' }}>字体大小</Text>
              </Space>
              <Text style={{ color: '#00d4ff', fontSize: '13px' }}>{labelFontSize}px</Text>
            </div>
            <Slider
              min={12}
              max={24}
              step={1}
              value={labelFontSize}
              onChange={setLabelFontSize}
            />
          </div>

          <div>
            <Text style={{ color: '#c0c0e0', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
              标签颜色
            </Text>
            <Space size={8} wrap>
              {LABEL_COLOR_PRESETS.map((preset) => (
                <div
                  key={preset.value}
                  onClick={() => setLabelColor(preset.value)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: preset.value,
                    cursor: 'pointer',
                    border: labelColor === preset.value ? '2px solid #00d4ff' : '2px solid #4a4a6a',
                    boxShadow:
                      labelColor === preset.value
                        ? `0 0 10px ${preset.value}80`
                        : 'none',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  title={preset.name}
                >
                  {labelColor === preset.value && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: preset.value === '#ffffff' ? '#333' : '#000',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      <Card
        style={{
          background: '#3a3a54',
          borderRadius: '8px',
          border: 'none'
        }}
        bodyStyle={{ padding: '16px' }}
      >
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
