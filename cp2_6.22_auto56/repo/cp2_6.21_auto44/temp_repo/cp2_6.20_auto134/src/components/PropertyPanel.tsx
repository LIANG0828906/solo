import { useRef } from 'react';
import { Download, Upload, Trash2, Move, RotateCw } from 'lucide-react';
import {
  useEditorStore,
  type MaterialType,
  type MaterialParams,
} from '@/store/editorStore';
import { downloadSnapshot, loadSnapshotFromFile } from '@/utils/snapshot';

const GEOMETRY_NAMES: Record<string, string> = {
  box: '立方体',
  sphere: '球体',
  cylinder: '圆柱',
  torus: '圆环',
  cone: '圆锥',
};

const MATERIAL_TYPES: Array<{ value: MaterialType; label: string }> = [
  { value: 'diffuse', label: '漫反射' },
  { value: 'metal', label: '金属' },
  { value: 'glossy', label: '光泽' },
  { value: 'transparent', label: '半透明' },
];

const Slider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
        <span style={{ fontSize: 12, opacity: 0.9 }}>{Number(value.toFixed(2))}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};

const NumberInputRow = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) => {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, opacity: 0.7, width: 40 }}>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={Number(value.toFixed(2))}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(clamp(v));
        }}
        style={{ flex: 1 }}
      />
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 600,
      opacity: 0.8,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const PropertyPanel = () => {
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedLightId = useEditorStore((s) => s.selectedLightId);
  const geometryList = useEditorStore((s) => s.geometryList);
  const lightList = useEditorStore((s) => s.lightList);
  const transformMode = useEditorStore((s) => s.transformMode);
  const setTransformMode = useEditorStore((s) => s.setTransformMode);
  const updateTransform = useEditorStore((s) => s.updateTransform);
  const updateMaterialType = useEditorStore((s) => s.updateMaterialType);
  const updateMaterialParams = useEditorStore((s) => s.updateMaterialParams);
  const removeGeometry = useEditorStore((s) => s.removeGeometry);
  const saveSnapshot = useEditorStore((s) => s.saveSnapshot);
  const loadSnapshot = useEditorStore((s) => s.loadSnapshot);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = geometryList.find((g) => g.id === selectedId);
  const selectedLight = lightList.find((l) => l.id === selectedLightId);

  const clampPos = (v: number) => Math.max(-10, Math.min(10, v));
  const clampRot = (v: number) => Math.max(-180, Math.min(180, v));
  const clampScale = (v: number) => Math.max(0.2, Math.min(5, v));

  const handleExport = () => {
    const data = saveSnapshot();
    downloadSnapshot(data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await loadSnapshotFromFile(file);
        loadSnapshot(data);
      } catch (err) {
        alert('导入失败：无效的快照文件');
      }
      e.target.value = '';
    }
  };

  return (
    <div
      style={{
        width: 280,
        height: '100%',
        background: 'rgba(30,30,50,0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderLeft: '1px solid #2a2a4a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {selectedItem && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {GEOMETRY_NAMES[selectedItem.type] || selectedItem.type}
                </div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                  ID: {selectedItem.id.slice(0, 8)}
                </div>
              </div>
              <button
                onClick={() => removeGeometry(selectedItem.id)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  opacity: 0.7,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.background = 'rgba(255,100,100,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <SectionTitle>变换模式</SectionTitle>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setTransformMode('translate')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    background:
                      transformMode === 'translate' ? '#6c63ff' : 'rgba(255,255,255,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (transformMode !== 'translate') {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (transformMode !== 'translate') {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                >
                  <Move size={14} />
                  平移 (T)
                </button>
                <button
                  onClick={() => setTransformMode('rotate')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    background:
                      transformMode === 'rotate' ? '#6c63ff' : 'rgba(255,255,255,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (transformMode !== 'rotate') {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (transformMode !== 'rotate') {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                >
                  <RotateCw size={14} />
                  旋转 (R)
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <SectionTitle>位置 Position</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <NumberInputRow
                  label="X"
                  value={selectedItem.position[0]}
                  min={-10}
                  max={10}
                  step={0.1}
                  onChange={(v) =>
                    updateTransform(selectedItem.id, {
                      position: [clampPos(v), selectedItem.position[1], selectedItem.position[2]],
                    })
                  }
                />
                <NumberInputRow
                  label="Y"
                  value={selectedItem.position[1]}
                  min={-10}
                  max={10}
                  step={0.1}
                  onChange={(v) =>
                    updateTransform(selectedItem.id, {
                      position: [selectedItem.position[0], clampPos(v), selectedItem.position[2]],
                    })
                  }
                />
                <NumberInputRow
                  label="Z"
                  value={selectedItem.position[2]}
                  min={-10}
                  max={10}
                  step={0.1}
                  onChange={(v) =>
                    updateTransform(selectedItem.id, {
                      position: [selectedItem.position[0], selectedItem.position[1], clampPos(v)],
                    })
                  }
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <SectionTitle>旋转 Rotation (°)</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <NumberInputRow
                  label="X"
                  value={selectedItem.rotation[0]}
                  min={-180}
                  max={180}
                  step={0.1}
                  onChange={(v) =>
                    updateTransform(selectedItem.id, {
                      rotation: [clampRot(v), selectedItem.rotation[1], selectedItem.rotation[2]],
                    })
                  }
                />
                <NumberInputRow
                  label="Y"
                  value={selectedItem.rotation[1]}
                  min={-180}
                  max={180}
                  step={0.1}
                  onChange={(v) =>
                    updateTransform(selectedItem.id, {
                      rotation: [selectedItem.rotation[0], clampRot(v), selectedItem.rotation[2]],
                    })
                  }
                />
                <NumberInputRow
                  label="Z"
                  value={selectedItem.rotation[2]}
                  min={-180}
                  max={180}
                  step={0.1}
                  onChange={(v) =>
                    updateTransform(selectedItem.id, {
                      rotation: [selectedItem.rotation[0], selectedItem.rotation[1], clampRot(v)],
                    })
                  }
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <SectionTitle>缩放 Scale</SectionTitle>
              <Slider
                label="等比例缩放"
                value={selectedItem.scale}
                min={0.2}
                max={5}
                step={0.1}
                onChange={(v) => updateTransform(selectedItem.id, { scale: clampScale(v) })}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <SectionTitle>材质类型</SectionTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 6,
                }}
              >
                {MATERIAL_TYPES.map((mt) => (
                  <button
                    key={mt.value}
                    onClick={() => updateMaterialType(selectedItem.id, mt.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      background:
                        selectedItem.material.type === mt.value
                          ? '#6c63ff'
                          : 'rgba(255,255,255,0.06)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedItem.material.type !== mt.value) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedItem.material.type !== mt.value) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }
                    }}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <SectionTitle>材质参数</SectionTitle>
              <MaterialParamsEditor
                type={selectedItem.material.type}
                params={selectedItem.material.params}
                onChange={(params) => updateMaterialParams(selectedItem.id, params)}
              />
            </div>
          </>
        )}

        {selectedLight && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>点光源</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                ID: {selectedLight.id.slice(0, 8)}
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
              请在左侧面板展开光源卡片进行参数编辑，或在场景中直接拖拽光源小球调整位置。
            </div>
          </>
        )}

        {!selectedItem && !selectedLight && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              opacity: 0.5,
              gap: 12,
            }}
          >
            <div style={{ fontSize: 14 }}>未选中任何物体</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 200 }}>
              点击场景中的几何体或光源进行编辑，或从左侧面板添加新的几何体
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: 10,
        }}
      >
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#6c63ff',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5a52e0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6c63ff';
          }}
        >
          <Upload size={14} />
          导入快照
        </button>
        <button
          onClick={handleExport}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#6c63ff',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5a52e0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6c63ff';
          }}
        >
          <Download size={14} />
          导出快照
        </button>
      </div>
    </div>
  );
};

const MaterialParamsEditor = ({
  type,
  params,
  onChange,
}: {
  type: MaterialType;
  params: MaterialParams;
  onChange: (p: Partial<MaterialParams>) => void;
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>颜色</span>
        <input
          type="color"
          value={params.color}
          onChange={(e) => onChange({ color: e.target.value })}
        />
        <span style={{ fontSize: 11, opacity: 0.5, fontFamily: 'monospace' }}>
          {params.color.toUpperCase()}
        </span>
      </div>

      <Slider
        label="环境反射强度"
        value={params.ambientIntensity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onChange({ ambientIntensity: v })}
      />

      {type === 'metal' && (
        <>
          <Slider
            label="粗糙度"
            value={params.roughness ?? 0.3}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ roughness: v })}
          />
          <Slider
            label="金属度"
            value={params.metalness ?? 0.8}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ metalness: v })}
          />
        </>
      )}

      {type === 'glossy' && (
        <>
          <Slider
            label="高光强度"
            value={params.specularIntensity ?? 1}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => onChange({ specularIntensity: v })}
          />
          <Slider
            label="高光锐度"
            value={params.specularSharpness ?? 0.5}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ specularSharpness: v })}
          />
        </>
      )}

      {type === 'transparent' && (
        <>
          <Slider
            label="透明度"
            value={params.opacity ?? 0.7}
            min={0.2}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ opacity: v })}
          />
          <Slider
            label="折射率"
            value={params.ior ?? 1.5}
            min={1}
            max={2}
            step={0.01}
            onChange={(v) => onChange({ ior: v })}
          />
        </>
      )}
    </div>
  );
};

export default PropertyPanel;
