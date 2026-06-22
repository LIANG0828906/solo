import { useState, useRef, useEffect } from 'react';
import type { Fabric, FabricDetail } from '../types';
import { getFabricDetail } from '../fabricInventory';

interface FabricTableProps {
  fabrics: Fabric[];
}

interface Column {
  key: keyof Fabric;
  label: string;
  width: number;
  minWidth: number;
}

const colorMap: Record<string, string> = {
  '白色': '#FFFFFF',
  '黑色': '#2C3E50',
  '红色': '#E74C3C',
  '蓝色': '#3498DB',
  '绿色': '#27AE60',
  '黄色': '#F1C40F',
  '灰色': '#95A5A6',
  '粉色': '#FFB6C1',
  '紫色': '#9B59B6',
  '棕色': '#8B4513',
  '米色': '#F5F5DC',
  '卡其色': '#C3B091',
};

const columns: Column[] = [
  { key: 'name', label: '面料名称', width: 180, minWidth: 120 },
  { key: 'color', label: '颜色', width: 120, minWidth: 80 },
  { key: 'totalMeters', label: '剩余米数', width: 120, minWidth: 80 },
  { key: 'supplier', label: '供应商', width: 180, minWidth: 120 },
  { key: 'threshold', label: '最低库存阈值', width: 140, minWidth: 100 },
];

export default function FabricTable({ fabrics }: FabricTableProps) {
  const [colorFilter, setColorFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [selectedFabric, setSelectedFabric] = useState<FabricDetail | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.width }), {})
  );
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

  const colors = [...new Set(fabrics.map((f) => f.color))];
  const suppliers = [...new Set(fabrics.map((f) => f.supplier))];

  const filteredFabrics = fabrics.filter((fabric) => {
    const colorMatch = !colorFilter || fabric.color === colorFilter;
    const supplierMatch = !supplierFilter || fabric.supplier === supplierFilter;
    return colorMatch && supplierMatch;
  });

  const handleRowClick = async (fabric: Fabric) => {
    setLoadingDetail(true);
    try {
      const detail = await getFabricDetail(fabric.id);
      setSelectedFabric(detail);
    } catch (error) {
      console.error('Failed to load fabric detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      key,
      startX: e.clientX,
      startWidth: colWidths[key],
    });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const col = columns.find((c) => c.key === resizing.key)!;
      const newWidth = Math.max(resizing.startWidth + diff, col.minWidth);
      setColWidths((prev) => ({ ...prev, [resizing.key]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const renderCell = (fabric: Fabric, key: keyof Fabric) => {
    const value = fabric[key];
    if (key === 'totalMeters' || key === 'threshold') {
      return <span>{value}米</span>;
    }
    if (key === 'color') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              backgroundColor: colorMap[String(value)] || '#CCCCCC',
              border: '1px solid #E0E0E0',
            }}
          />
          <span>{value}</span>
        </div>
      );
    }
    return <span>{value}</span>;
  };

  return (
    <div style={containerStyle}>
      <div style={filterBarStyle}>
        <div style={filterGroupStyle}>
          <label style={filterLabelStyle}>颜色筛选：</label>
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">全部</option>
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div style={filterGroupStyle}>
          <label style={filterLabelStyle}>供应商筛选：</label>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">全部</option>
            {suppliers.map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={tableRef} style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    ...thStyle,
                    width: `${colWidths[col.key]}px`,
                    minWidth: `${col.minWidth}px`,
                  }}
                >
                  <div style={thContentStyle}>
                    <span>{col.label}</span>
                    <div
                      onMouseDown={(e) => handleMouseDown(e, col.key)}
                      style={{
                        ...resizeHandleStyle,
                        ...(resizing?.key === col.key ? resizeHandleActiveStyle : {}),
                      }}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={tbodyStyle}>
            {filteredFabrics.map((fabric) => (
              <tr
                key={fabric.id}
                onClick={() => handleRowClick(fabric)}
                style={{
                  ...trStyle,
                  ...(fabric.totalMeters < fabric.threshold ? trLowStockStyle : {}),
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      ...tdStyle,
                      width: `${colWidths[col.key]}px`,
                      minWidth: `${col.minWidth}px`,
                    }}
                  >
                    {renderCell(fabric, col.key)}
                  </td>
                ))}
              </tr>
            ))}
            {filteredFabrics.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={emptyCellStyle}>
                  暂无符合条件的面料数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedFabric && (
        <div style={modalOverlayStyle} onClick={() => setSelectedFabric(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>面料详情</h3>
              <button
                onClick={() => setSelectedFabric(null)}
                style={closeButtonStyle}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {loadingDetail ? (
              <div style={loadingStyle}>加载中...</div>
            ) : (
              <div style={modalContentStyle}>
                <div style={detailGridStyle}>
                  <div style={detailItemStyle}>
                    <div style={detailLabelStyle}>面料名称</div>
                    <div style={detailValueStyle}>{selectedFabric.name}</div>
                  </div>
                  <div style={detailItemStyle}>
                    <div style={detailLabelStyle}>颜色</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          backgroundColor: colorMap[selectedFabric.color] || '#CCCCCC',
                          border: '1px solid #E0E0E0',
                        }}
                      />
                      <span>{selectedFabric.color}</span>
                    </div>
                  </div>
                  <div style={detailItemStyle}>
                    <div style={detailLabelStyle}>库存米数</div>
                    <div
                      style={{
                        ...detailValueStyle,
                        color: selectedFabric.totalMeters < selectedFabric.threshold ? '#E74C3C' : '#333333',
                        fontWeight: 600,
                      }}
                    >
                      {selectedFabric.totalMeters}米
                    </div>
                  </div>
                  <div style={detailItemStyle}>
                    <div style={detailLabelStyle}>最低阈值</div>
                    <div style={detailValueStyle}>{selectedFabric.threshold}米</div>
                  </div>
                  <div style={{ ...detailItemStyle, gridColumn: 'span 2' }}>
                    <div style={detailLabelStyle}>供应商</div>
                    <div style={detailValueStyle}>{selectedFabric.supplier}</div>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h4 style={sectionTitleStyle}>关联订单</h4>
                  {selectedFabric.relatedOrders.length > 0 ? (
                    <div style={relatedOrdersStyle}>
                      {selectedFabric.relatedOrders.map((order) => (
                        <div key={order.id} style={relatedOrderItemStyle}>
                          <div>
                            <div style={orderNameStyle}>{order.customerName}</div>
                            <div style={orderDateStyle}>
                              {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                          <div
                            style={{
                              ...statusBadgeStyle,
                              backgroundColor:
                                order.status === '设计中'
                                  ? '#5B8DEF20'
                                  : order.status === '生产中'
                                  ? '#F5A62320'
                                  : '#B0B0B020',
                              color:
                                order.status === '设计中'
                                  ? '#5B8DEF'
                                  : order.status === '生产中'
                                  ? '#F5A623'
                                  : '#B0B0B0',
                            }}
                          >
                            {order.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={emptyOrdersStyle}>暂无关联订单</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  flexWrap: 'wrap',
};

const filterGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const filterLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#666666',
  whiteSpace: 'nowrap',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #E0E0E0',
  borderRadius: '8px',
  fontSize: '13px',
  backgroundColor: '#FFFFFF',
  cursor: 'pointer',
  minWidth: '120px',
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: '12px',
  border: '1px solid #E0E0E0',
  backgroundColor: '#FFFFFF',
  maxHeight: 'calc(100vh - 280px)',
  position: 'relative',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
};

const theadStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: '#333333',
  backgroundColor: '#F8F9FA',
  borderBottom: '2px solid #E0E0E0',
};

const thContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
};

const resizeHandleStyle: React.CSSProperties = {
  position: 'absolute',
  right: '-8px',
  top: 0,
  bottom: 0,
  width: '16px',
  cursor: 'col-resize',
  zIndex: 1,
};

const resizeHandleActiveStyle: React.CSSProperties = {
  cursor: 'col-resize',
};

const tbodyStyle: React.CSSProperties = {
  overflowY: 'auto',
};

const trStyle: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const trLowStockStyle: React.CSSProperties = {
  backgroundColor: '#FFE4E1',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  color: '#333333',
  borderBottom: '1px solid #F0F0F0',
};

const emptyCellStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#999999',
  fontSize: '14px',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '500px',
  maxHeight: '80vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px',
  borderBottom: '1px solid #F0F0F0',
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#333333',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  color: '#666666',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalContentStyle: React.CSSProperties = {
  padding: '24px',
  overflowY: 'auto',
};

const loadingStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#999999',
};

const detailGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const detailItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
};

const detailValueStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#333333',
  fontWeight: 500,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#333333',
  marginBottom: '12px',
};

const relatedOrdersStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const relatedOrderItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#F8F9FA',
  borderRadius: '8px',
};

const orderNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#333333',
};

const orderDateStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#999999',
  marginTop: '2px',
};

const statusBadgeStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
};

const emptyOrdersStyle: React.CSSProperties = {
  padding: '20px',
  textAlign: 'center',
  color: '#999999',
  fontSize: '13px',
  backgroundColor: '#F8F9FA',
  borderRadius: '8px',
};
