import { useControls, button } from 'leva'
import type { GeometryItemData } from '../store/sceneStore'
import { useSceneStore, GeometryType, TransformMode } from '../store/sceneStore'

const GeometryButton = ({
  type,
  icon,
  gradient,
  label,
}: {
  type: GeometryType
  icon: string
  gradient: string
  label: string
}) => {
  const addGeometry = useSceneStore((s) => s.addGeometry)
  return (
    <button
      className="geom-btn"
      onClick={() => addGeometry(type)}
      style={{
        background: gradient,
      }}
      title={`添加${label}`}
    >
      <span className="geom-icon">{icon}</span>
      <span className="geom-label">{label}</span>
    </button>
  )
}

const ModeSelector = () => {
  const { transformMode, setTransformMode } = useSceneStore()
  const modes: { key: TransformMode; label: string; icon: string; shortcut: string }[] = [
    { key: 'translate', label: '移动', icon: '↔', shortcut: 'W' },
    { key: 'rotate', label: '旋转', icon: '↻', shortcut: 'R' },
    { key: 'scale', label: '缩放', icon: '⇲', shortcut: 'S' },
  ]
  return (
    <div className="mode-selector">
      <div className="section-title">变换模式</div>
      <div className="mode-buttons">
        {modes.map((m) => (
          <button
            key={m.key}
            className={`mode-btn ${transformMode === m.key ? 'active' : ''}`}
            onClick={() => setTransformMode(m.key)}
            title={`快捷键: ${m.shortcut}`}
          >
            <span className="mode-icon">{m.icon}</span>
            <span className="mode-label">{m.label}</span>
            <span className="mode-shortcut">{m.shortcut}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const PositionControls = ({ selected }: { selected: GeometryItemData }) => {
  const updateGeometry = useSceneStore((s) => s.updateGeometry)
  useControls(
    `${selected.name} - 位置`,
    {
      positionX: {
        value: selected.position.x,
        min: -10,
        max: 10,
        step: 0.01,
        label: 'X 位置',
        onChange: (v) =>
          updateGeometry(selected.id, {
            position: { ...selected.position, x: Number(v.toFixed(3)) },
          }),
      },
      positionY: {
        value: selected.position.y,
        min: -10,
        max: 10,
        step: 0.01,
        label: 'Y 位置',
        onChange: (v) =>
          updateGeometry(selected.id, {
            position: { ...selected.position, y: Number(v.toFixed(3)) },
          }),
      },
      positionZ: {
        value: selected.position.z,
        min: -10,
        max: 10,
        step: 0.01,
        label: 'Z 位置',
        onChange: (v) =>
          updateGeometry(selected.id, {
            position: { ...selected.position, z: Number(v.toFixed(3)) },
          }),
      },
    },
    { collapsed: false }
  )
  return null
}

const RotationControls = ({ selected }: { selected: GeometryItemData }) => {
  const updateGeometry = useSceneStore((s) => s.updateGeometry)
  useControls(
    `${selected.name} - 旋转`,
    {
      rotationX: {
        value: selected.rotation.x,
        min: 0,
        max: 360,
        step: 1,
        label: 'X 旋转 (°)',
        onChange: (v) =>
          updateGeometry(selected.id, {
            rotation: { ...selected.rotation, x: Number(v.toFixed(1)) },
          }),
      },
      rotationY: {
        value: selected.rotation.y,
        min: 0,
        max: 360,
        step: 1,
        label: 'Y 旋转 (°)',
        onChange: (v) =>
          updateGeometry(selected.id, {
            rotation: { ...selected.rotation, y: Number(v.toFixed(1)) },
          }),
      },
      rotationZ: {
        value: selected.rotation.z,
        min: 0,
        max: 360,
        step: 1,
        label: 'Z 旋转 (°)',
        onChange: (v) =>
          updateGeometry(selected.id, {
            rotation: { ...selected.rotation, z: Number(v.toFixed(1)) },
          }),
      },
    },
    { collapsed: true }
  )
  return null
}

const ScaleControls = ({ selected }: { selected: GeometryItemData }) => {
  const updateGeometry = useSceneStore((s) => s.updateGeometry)
  useControls(
    `${selected.name} - 缩放`,
    {
      scaleX: {
        value: selected.scale.x,
        min: 0.1,
        max: 5,
        step: 0.01,
        label: 'X 缩放',
        onChange: (v) =>
          updateGeometry(selected.id, {
            scale: { ...selected.scale, x: Number(v.toFixed(3)) },
          }),
      },
      scaleY: {
        value: selected.scale.y,
        min: 0.1,
        max: 5,
        step: 0.01,
        label: 'Y 缩放',
        onChange: (v) =>
          updateGeometry(selected.id, {
            scale: { ...selected.scale, y: Number(v.toFixed(3)) },
          }),
      },
      scaleZ: {
        value: selected.scale.z,
        min: 0.1,
        max: 5,
        step: 0.01,
        label: 'Z 缩放',
        onChange: (v) =>
          updateGeometry(selected.id, {
            scale: { ...selected.scale, z: Number(v.toFixed(3)) },
          }),
      },
    },
    { collapsed: true }
  )
  return null
}

const MaterialControls = ({ selected }: { selected: GeometryItemData }) => {
  const updateGeometry = useSceneStore((s) => s.updateGeometry)
  useControls(
    `${selected.name} - 材质`,
    {
      color: {
        value: selected.material.color,
        label: '颜色',
        onChange: (v) =>
          updateGeometry(selected.id, {
            material: { ...selected.material, color: v },
          }),
      },
      roughness: {
        value: selected.material.roughness,
        min: 0,
        max: 1,
        step: 0.01,
        label: '粗糙度',
        onChange: (v) =>
          updateGeometry(selected.id, {
            material: {
              ...selected.material,
              roughness: Number(v.toFixed(2)),
            },
          }),
      },
      metalness: {
        value: selected.material.metalness,
        min: 0,
        max: 1,
        step: 0.01,
        label: '金属度',
        onChange: (v) =>
          updateGeometry(selected.id, {
            material: {
              ...selected.material,
              metalness: Number(v.toFixed(2)),
            },
          }),
      },
    },
    { collapsed: true }
  )
  return null
}

const ActionControls = ({ selected }: { selected: GeometryItemData }) => {
  const removeGeometry = useSceneStore((s) => s.removeGeometry)
  useControls(
    `${selected.name} - 操作`,
    {
      删除物体: button(() => {
        if (window.confirm(`确定要删除 "${selected.name}" 吗？`)) {
          removeGeometry(selected.id)
        }
      }),
    },
    { collapsed: true }
  )
  return null
}

const SelectedObjectPanel = () => {
  const { selectedId, geometries } = useSceneStore()
  const selected = geometries.find((g) => g.id === selectedId)

  if (!selected) return null

  return (
    <>
      <PositionControls selected={selected} />
      <RotationControls selected={selected} />
      <ScaleControls selected={selected} />
      <MaterialControls selected={selected} />
      <ActionControls selected={selected} />
    </>
  )
}

const LightsPanel = () => {
  const { lights, setLights } = useSceneStore()

  useControls(
    '环境光',
    {
      ambientIntensity: {
        value: lights.ambientIntensity,
        min: 0.1,
        max: 1,
        step: 0.01,
        label: '环境光强度',
        onChange: (v) => setLights({ ambientIntensity: Number(v.toFixed(2)) }),
      },
    },
    { collapsed: true }
  )

  useControls(
    '点光源',
    {
      pointIntensity: {
        value: lights.pointIntensity,
        min: 0,
        max: 2,
        step: 0.01,
        label: '点光源强度',
        onChange: (v) => setLights({ pointIntensity: Number(v.toFixed(2)) }),
      },
      pointX: {
        value: lights.pointPosition.x,
        min: -10,
        max: 10,
        step: 0.1,
        label: '位置 X',
        onChange: (v) =>
          setLights({
            pointPosition: { ...lights.pointPosition, x: Number(v.toFixed(2)) },
          }),
      },
      pointY: {
        value: lights.pointPosition.y,
        min: -10,
        max: 10,
        step: 0.1,
        label: '位置 Y',
        onChange: (v) =>
          setLights({
            pointPosition: { ...lights.pointPosition, y: Number(v.toFixed(2)) },
          }),
      },
      pointZ: {
        value: lights.pointPosition.z,
        min: -10,
        max: 10,
        step: 0.1,
        label: '位置 Z',
        onChange: (v) =>
          setLights({
            pointPosition: { ...lights.pointPosition, z: Number(v.toFixed(2)) },
          }),
      },
    },
    { collapsed: true }
  )

  return null
}

export const ControlPanel = () => {
  const geometries = useSceneStore((s) => s.geometries)
  const selectedId = useSceneStore((s) => s.selectedId)
  const selectGeometry = useSceneStore((s) => s.selectGeometry)
  const selected = geometries.find((g) => g.id === selectedId)

  return (
    <div className="control-panel">
      <div className="panel-section add-section">
        <div className="section-title">添加几何体</div>
        <div className="geom-buttons-grid">
          <GeometryButton
            type="box"
            icon="▢"
            label="立方体"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <GeometryButton
            type="sphere"
            icon="◯"
            label="球体"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <GeometryButton
            type="cylinder"
            icon="⬡"
            label="圆柱"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <GeometryButton
            type="torus"
            icon="◉"
            label="圆环"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
          <GeometryButton
            type="cone"
            icon="△"
            label="圆锥"
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          />
        </div>
      </div>

      <ModeSelector />

      {geometries.length > 0 && (
        <div className="panel-section">
          <div className="section-title">物体列表 ({geometries.length})</div>
          <div className="object-list">
            {geometries.map((g) => (
              <div
                key={g.id}
                className={`object-list-item ${selectedId === g.id ? 'selected' : ''}`}
                onClick={() => selectGeometry(g.id)}
              >
                <span
                  className="object-color-dot"
                  style={{ backgroundColor: g.material.color }}
                />
                <span className="object-name">{g.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selected && (
        <div className="panel-section hint-section">
          <div className="hint-text">
            💡 提示：点击场景中的物体或从上方列表选择物体进行编辑
          </div>
          <div className="shortcut-list">
            <div><kbd>W</kbd> 移动模式</div>
            <div><kbd>R</kbd> 旋转模式</div>
            <div><kbd>S</kbd> 缩放模式</div>
            <div><kbd>Delete</kbd> 删除选中</div>
          </div>
        </div>
      )}

      <SelectedObjectPanel />
      <LightsPanel />
    </div>
  )
}
