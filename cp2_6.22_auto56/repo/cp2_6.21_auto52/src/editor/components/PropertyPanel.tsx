import React from 'react';
import { SketchPicker } from 'react-color';
import { useEditorStore } from '../store/editorStore';
import { findTwoColumnPair } from '../utils/twoColumnUtils';
import { Trash2 } from 'lucide-react';

export const PropertyPanel: React.FC = () => {
  const {
    selectedId,
    components,
    theme,
    themes,
    updateComponent,
    setTheme,
    updateThemeColor,
    deleteComponent,
    setColumnRatio,
    getColumnRatio,
    getIsTwoColumn,
  } = useEditorStore();

  const selectedComponent = components.find((c) => c.id === selectedId);
  const columnRatio = getColumnRatio();
  const isTwoColumn = getIsTwoColumn();
  const isInTwoColumnPair = selectedId ? findTwoColumnPair(components, selectedId) !== null : false;
  const isSelectedText = selectedComponent?.type === 'text';
  const showColumnRatio = isTwoColumn && isSelectedText && isInTwoColumnPair;

  const [activeColorPicker, setActiveColorPicker] = React.useState<string | null>(null);

  const handleStyleChange = (key: string, value: any) => {
    if (!selectedId) return;
    updateComponent(selectedId, {
      style: { ...selectedComponent!.style, [key]: value },
    });
  };

  const handlePropertyChange = (key: string, value: any) => {
    if (!selectedId) return;
    updateComponent(selectedId, { [key]: value });
  };

  const handleContentChange = (content: string) => {
    if (!selectedId || selectedComponent?.type !== 'text') return;
    updateComponent(selectedId, {
      data: { ...(selectedComponent.data as any), content },
    });
  };

  const renderColorPicker = (label: string, colorKey: string, currentColor?: string, colorIndex?: number) => {
    if (currentColor === undefined) return null;

    const isActive = activeColorPicker === colorKey;

    return (
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            onClick={() => setActiveColorPicker(isActive ? null : colorKey)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: currentColor,
              border: '2px solid #e0e0e0',
              cursor: 'pointer',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
            }}
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => handleStyleChange(colorKey, e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              fontSize: 13,
              outline: 'none',
            }}
          />
          {colorIndex !== undefined && (
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: theme.colors[colorIndex % theme.colors.length],
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px #e0e0e0',
              }}
              title={`主题色 ${colorIndex + 1}`}
            />
          )}
        </div>
        {isActive && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: 4 }}>
            <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={() => setActiveColorPicker(null)} />
            <SketchPicker
              color={currentColor}
              onChange={(color) => handleStyleChange(colorKey, color.hex)}
              disableAlpha
            />
          </div>
        )}
      </div>
    );
  };

  const renderSlider = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    min: number,
    max: number,
    step: number = 1,
    unit: string = ''
  ) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#666' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', cursor: 'pointer' }}
      />
    </div>
  );

  const renderColumnRatioSlider = () => {
    if (!showColumnRatio) return null;

    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#e8f0fe',
        borderRadius: 8,
        marginBottom: 20,
        border: '1px solid #bbdefb',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1976d2', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 4, height: 16, backgroundColor: '#1976d2', borderRadius: 2 }} />
          栏宽比例
        </div>
        {renderSlider(
          '左侧占比',
          columnRatio || 50,
          (v) => setColumnRatio(v),
          30,
          70,
          1,
          '%'
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginTop: 4 }}>
          <span>左 {columnRatio || 50}%</span>
          <span style={{ color: '#999' }}>|</span>
          <span>右 {100 - (columnRatio || 50)}%</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.08)', padding: '8px 10px', borderRadius: 4 }}>
          提示：拖拽调整组件大小时按住 Shift 键可同步调整另一侧宽度
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: 300,
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '16px solid #e0e0e0',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 16 }}>
          主题色板
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {themes.map((t) => (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                padding: '10px',
                borderRadius: 8,
                border: theme.id === t.id ? '2px solid #2196f3' : '2px solid transparent',
                backgroundColor: theme.id === t.id ? '#e8f0fe' : '#fafafa',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{t.name}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {t.colors.map((color, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (theme.id === t.id) {
                        setActiveColorPicker(activeColorPicker === `theme-${idx}` ? null : `theme-${idx}`);
                      } else {
                        setTheme(t.id);
                      }
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color,
                      border: theme.id === t.id && activeColorPicker === `theme-${idx}` ? '3px solid #2196f3' : '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {activeColorPicker === `theme-${idx}` && theme.id === t.id && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: 4 }}>
                        <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={() => setActiveColorPicker(null)} />
                        <SketchPicker
                          color={color}
                          onChange={(c) => updateThemeColor(idx, c.hex)}
                          disableAlpha
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px' }}>
        {selectedComponent ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                {selectedComponent.type === 'text' && '文本组件'}
                {selectedComponent.type === 'image' && '图片组件'}
                {selectedComponent.type === 'chart' && '图表组件'}
                {selectedComponent.type === 'shape' && '形状组件'}
              </div>
              <button
                onClick={() => deleteComponent(selectedId!)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#fce4ec',
                  color: '#c62828',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Trash2 size={14} />
                删除
              </button>
            </div>

            {renderColumnRatioSlider()}

            {selectedComponent.type === 'text' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>文本内容</div>
                <textarea
                  value={(selectedComponent.data as any)?.content || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 13,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>X 坐标</div>
                <input
                  type="number"
                  value={Math.round(selectedComponent.x)}
                  onChange={(e) => handlePropertyChange('x', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Y 坐标</div>
                <input
                  type="number"
                  value={Math.round(selectedComponent.y)}
                  onChange={(e) => handlePropertyChange('y', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>宽度</div>
                <input
                  type="number"
                  value={Math.round(selectedComponent.width)}
                  onChange={(e) => handlePropertyChange('width', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>高度</div>
                <input
                  type="number"
                  value={Math.round(selectedComponent.height)}
                  onChange={(e) => handlePropertyChange('height', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>

            {renderSlider('透明度', Math.round(selectedComponent.opacity * 100), (v) => handlePropertyChange('opacity', v / 100), 0, 100, 1, '%')}
            {renderSlider('旋转角度', selectedComponent.rotation, (v) => handlePropertyChange('rotation', v), 0, 360, 1, '°')}
            {renderSlider('圆角大小', selectedComponent.borderRadius, (v) => handlePropertyChange('borderRadius', v), 0, 100, 1, 'px')}

            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 20, marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16 }}>样式</div>
              
              {selectedComponent.type === 'text' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>字号</div>
                      <input
                        type="number"
                        value={selectedComponent.style.fontSize || 14}
                        onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
                        style={inputStyle}
                        min={8}
                        max={200}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>字重</div>
                      <select
                        value={selectedComponent.style.fontWeight || 'normal'}
                        onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                        style={inputStyle}
                      >
                        <option value="normal">正常</option>
                        <option value="bold">粗体</option>
                        <option value="lighter">细体</option>
                      </select>
                    </div>
                  </div>
                  {renderColorPicker('文字颜色', 'textColor', selectedComponent.style.textColor, selectedComponent.style.textColorIndex)}
                </>
              )}

              {renderColorPicker('填充颜色', 'fillColor', selectedComponent.style.fillColor, selectedComponent.style.fillColorIndex)}
              
              {(selectedComponent.style.strokeWidth !== undefined || selectedComponent.type !== 'text') && (
                <>
                  {renderColorPicker('边框颜色', 'strokeColor', selectedComponent.style.strokeColor, selectedComponent.style.strokeColorIndex)}
                  {renderSlider('边框宽度', selectedComponent.style.strokeWidth || 0, (v) => handleStyleChange('strokeWidth', v), 0, 20, 1, 'px')}
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🎯</div>
            <div style={{ fontSize: 14 }}>点击画布中的组件</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>查看和编辑属性</div>
          </div>
        )}
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};
