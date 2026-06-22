import { useEditorStore } from '../store/editorStore';
import { ComponentRenderer } from './ComponentRenderer';

export function PropertyPanel() {
  const { components, selectedComponentId, updateComponentProps, updateComponentStyle } =
    useEditorStore();

  const selectedComponent = components.find((c) => c.id === selectedComponentId);

  if (!selectedComponent) {
    return (
      <div
        style={{
          width: 280,
          backgroundColor: '#f5f5f5',
          borderLeft: '1px solid #e0e0e0',
          padding: 16,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: 14,
        }}
      >
        请选择画布中的组件
      </div>
    );
  }

  const { type, props, style, id } = selectedComponent;

  const sectionStyle: React.CSSProperties = {
    marginBottom: 20,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid #e0e0e0',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 13,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const rowStyle: React.CSSProperties = {
    marginBottom: 12,
  };

  return (
    <div
      style={{
        width: 280,
        backgroundColor: '#f5f5f5',
        borderLeft: '1px solid #e0e0e0',
        padding: 16,
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 16 }}>
        属性面板
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>基本设置</div>

        {type === 'banner' && (
          <>
            <div style={rowStyle}>
              <label style={labelStyle}>图片URL</label>
              <input
                type="text"
                style={inputStyle}
                value={(props as { imageUrl: string }).imageUrl}
                onChange={(e) => updateComponentProps(id, { imageUrl: e.target.value })}
                placeholder="请输入图片地址"
                onFocus={(e) => (e.target.style.borderColor = '#3a7bd5')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>跳转链接</label>
              <input
                type="text"
                style={inputStyle}
                value={(props as { link: string }).link}
                onChange={(e) => updateComponentProps(id, { link: e.target.value })}
                placeholder="请输入跳转链接"
                onFocus={(e) => (e.target.style.borderColor = '#3a7bd5')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
            </div>
          </>
        )}

        {type === 'product-grid' && (
          <div style={rowStyle}>
            <label style={labelStyle}>每行列数</label>
            <select
              style={{ ...inputStyle, backgroundColor: '#fff', cursor: 'pointer' }}
              value={(props as { columns: 2 | 3 }).columns}
              onChange={(e) =>
                updateComponentProps(id, { columns: Number(e.target.value) as 2 | 3 })
              }
            >
              <option value={2}>2列</option>
              <option value={3}>3列</option>
            </select>
          </div>
        )}

        {type === 'coupon' && (
          <>
            <div style={rowStyle}>
              <label style={labelStyle}>优惠券标题</label>
              <input
                type="text"
                style={inputStyle}
                value={(props as { title: string }).title}
                onChange={(e) => updateComponentProps(id, { title: e.target.value })}
                placeholder="请输入优惠券标题"
                onFocus={(e) => (e.target.style.borderColor = '#3a7bd5')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>折扣码</label>
              <input
                type="text"
                style={inputStyle}
                value={(props as { discountCode: string }).discountCode}
                onChange={(e) => updateComponentProps(id, { discountCode: e.target.value })}
                placeholder="请输入折扣码"
                onFocus={(e) => (e.target.style.borderColor = '#3a7bd5')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
            </div>
          </>
        )}
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>样式设置</div>

        <div style={rowStyle}>
          <label style={labelStyle}>背景色</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={style.backgroundColor}
              onChange={(e) => updateComponentStyle(id, { backgroundColor: e.target.value })}
              style={{
                width: 40,
                height: 32,
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
                padding: 2,
              }}
            />
            <input
              type="text"
              style={inputStyle}
              value={style.backgroundColor}
              onChange={(e) => updateComponentStyle(id, { backgroundColor: e.target.value })}
              onFocus={(e) => (e.target.style.borderColor = '#3a7bd5')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>
        </div>

        <div style={rowStyle}>
          <label style={labelStyle}>
            内边距: {style.padding}px
          </label>
          <input
            type="range"
            min={5}
            max={30}
            value={style.padding}
            onChange={(e) => updateComponentStyle(id, { padding: Number(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <div style={rowStyle}>
          <label style={labelStyle}>
            字体大小: {style.fontSize}px
          </label>
          <input
            type="range"
            min={12}
            max={24}
            value={style.fontSize}
            onChange={(e) => updateComponentStyle(id, { fontSize: Number(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>组件预览</div>
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          <ComponentRenderer component={selectedComponent} isEditor />
        </div>
      </div>
    </div>
  );
}
