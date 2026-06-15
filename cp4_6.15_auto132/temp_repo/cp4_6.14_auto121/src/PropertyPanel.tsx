import { useStore } from './store';
import type { SearchBarProps, UserCardProps, DataTableProps, ModuleInstance } from './types';

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: 6,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #334155',
  backgroundColor: '#1e293b',
  color: '#f8fafc',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

const inputFocusStyle = {
  borderColor: '#3b82f6',
};

const rowStyle: React.CSSProperties = {
  marginBottom: 16,
};

function SearchBarEditor({ module }: { module: ModuleInstance }) {
  const props = module.props as SearchBarProps;
  const { updateModuleProps } = useStore();

  return (
    <div>
      <div style={rowStyle}>
        <label style={labelStyle}>Placeholder 文字</label>
        <input
          type="text"
          value={props.placeholder}
          onChange={(e) => updateModuleProps(module.id, { placeholder: e.target.value } as Partial<SearchBarProps>)}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#334155')}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>圆角大小: {props.borderRadius}px</label>
        <input
          type="range"
          min={0}
          max={32}
          value={props.borderRadius}
          onChange={(e) => updateModuleProps(module.id, { borderRadius: Number(e.target.value) } as Partial<SearchBarProps>)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>背景色</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="color"
            value={props.backgroundColor}
            onChange={(e) => updateModuleProps(module.id, { backgroundColor: e.target.value } as Partial<SearchBarProps>)}
            style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid #334155', backgroundColor: 'transparent', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={props.backgroundColor}
            onChange={(e) => updateModuleProps(module.id, { backgroundColor: e.target.value } as Partial<SearchBarProps>)}
            style={{ ...inputStyle, flex: 1 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => (e.target.style.borderColor = '#334155')}
          />
        </div>
      </div>
    </div>
  );
}

function UserCardEditor({ module }: { module: ModuleInstance }) {
  const props = module.props as UserCardProps;
  const { updateModuleProps } = useStore();

  return (
    <div>
      <div style={rowStyle}>
        <label style={labelStyle}>头像链接</label>
        <input
          type="text"
          value={props.avatarUrl}
          onChange={(e) => updateModuleProps(module.id, { avatarUrl: e.target.value } as Partial<UserCardProps>)}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#334155')}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>姓名</label>
        <input
          type="text"
          value={props.name}
          onChange={(e) => updateModuleProps(module.id, { name: e.target.value } as Partial<UserCardProps>)}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#334155')}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>角色</label>
        <input
          type="text"
          value={props.role}
          onChange={(e) => updateModuleProps(module.id, { role: e.target.value } as Partial<UserCardProps>)}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#334155')}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>标签颜色</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="color"
            value={props.tagColor}
            onChange={(e) => updateModuleProps(module.id, { tagColor: e.target.value } as Partial<UserCardProps>)}
            style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid #334155', backgroundColor: 'transparent', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={props.tagColor}
            onChange={(e) => updateModuleProps(module.id, { tagColor: e.target.value } as Partial<UserCardProps>)}
            style={{ ...inputStyle, flex: 1 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => (e.target.style.borderColor = '#334155')}
          />
        </div>
      </div>
    </div>
  );
}

function DataTableEditor({ module }: { module: ModuleInstance }) {
  const props = module.props as DataTableProps;
  const { updateModuleProps } = useStore();

  const handleColumnChange = (index: number, value: string) => {
    const newColumns = [...props.columns];
    newColumns[index] = value;
    updateModuleProps(module.id, { columns: newColumns } as Partial<DataTableProps>);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = props.rows.map((row) => [...row]);
    newRows[rowIndex][colIndex] = value;
    updateModuleProps(module.id, { rows: newRows } as Partial<DataTableProps>);
  };

  const addColumn = () => {
    updateModuleProps(module.id, {
      columns: [...props.columns, `列${props.columns.length + 1}`],
      rows: props.rows.map((row) => [...row, '']),
    } as Partial<DataTableProps>);
  };

  const addRow = () => {
    updateModuleProps(module.id, {
      rows: [...props.rows, props.columns.map(() => '')],
    } as Partial<DataTableProps>);
  };

  const removeColumn = (index: number) => {
    if (props.columns.length <= 1) return;
    updateModuleProps(module.id, {
      columns: props.columns.filter((_, i) => i !== index),
      rows: props.rows.map((row) => row.filter((_, i) => i !== index)),
    } as Partial<DataTableProps>);
  };

  const removeRow = (index: number) => {
    if (props.rows.length <= 1) return;
    updateModuleProps(module.id, {
      rows: props.rows.filter((_, i) => i !== index),
    } as Partial<DataTableProps>);
  };

  return (
    <div>
      <div style={rowStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>表头</label>
          <button
            onClick={addColumn}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#334155',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            + 添加列
          </button>
        </div>
        {props.columns.map((col, index) => (
          <div key={index} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              type="text"
              value={col}
              onChange={(e) => handleColumnChange(index, e.target.value)}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => (e.target.style.borderColor = '#334155')}
            />
            <button
              onClick={() => removeColumn(index)}
              style={{
                width: 32,
                borderRadius: 6,
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={rowStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>数据行</label>
          <button
            onClick={addRow}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#334155',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            + 添加行
          </button>
        </div>
        {props.rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#64748b', width: 20 }}>{rowIndex + 1}.</span>
            {row.map((cell, colIndex) => (
              <input
                key={colIndex}
                type="text"
                value={cell}
                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
            ))}
            <button
              onClick={() => removeRow(rowIndex)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PropertyPanel() {
  const { modules, selectedId } = useStore();
  const selectedModule = modules.find((m) => m.id === selectedId);

  const getModuleLabel = (type: string) => {
    switch (type) {
      case 'searchBar':
        return '搜索栏';
      case 'userCard':
        return '用户卡片';
      case 'dataTable':
        return '数据表格';
      default:
        return type;
    }
  };

  return (
    <div
      style={{
        width: 280,
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {selectedModule ? (
        <>
          <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>属性编辑</h2>
            <span style={{ fontSize: 12, color: '#64748b' }}>{getModuleLabel(selectedModule.type)}</span>
          </div>
          {selectedModule.type === 'searchBar' && <SearchBarEditor module={selectedModule} />}
          {selectedModule.type === 'userCard' && <UserCardEditor module={selectedModule} />}
          {selectedModule.type === 'dataTable' && <DataTableEditor module={selectedModule} />}
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#94a3b8',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
            点击画布上的模块<br />编辑其属性
          </p>
        </div>
      )}
    </div>
  );
}
