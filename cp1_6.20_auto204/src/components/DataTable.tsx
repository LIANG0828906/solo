import React, { useState, useMemo, useEffect } from 'react';
import type { Product, StockStatus } from '../api';
import { createRipple } from '../utils/ripple';

interface DataTableProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  selectedProductId?: string;
}

type SortOrder = 'asc' | 'desc' | null;
type FilterStatus = 'all' | StockStatus;

const statusLabel: Record<StockStatus, string> = {
  normal: '正常',
  warning: '预警',
  outOfStock: '缺货',
};

function DataTable({ products, onRowClick, selectedProductId }: DataTableProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }
    if (sortOrder) {
      result.sort((a, b) =>
        sortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock
      );
    }
    return result;
  }, [products, filterStatus, sortOrder]);

  const handleSortToggle = () => {
    setSortOrder((prev) => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  const toggleExpandRow = (productId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#1f1f1f',
    borderRadius: '8px',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const filterButtonBase: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #3a3a3a',
    backgroundColor: 'transparent',
    color: '#e0e0e0',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  const sortButtonStyle: React.CSSProperties = {
    ...filterButtonBase,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const tableWrapperStyle: React.CSSProperties = {
    overflowX: 'auto',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#a0a0a0',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
    whiteSpace: 'nowrap',
  };

  const getTdStyle = (): React.CSSProperties => ({
    padding: '14px 20px',
    fontSize: '14px',
    borderBottom: '1px solid #2a2a2a',
    whiteSpace: 'nowrap',
  });

  const getTrStyle = (product: Product): React.CSSProperties => {
    const isWarning = product.status === 'warning' || product.status === 'outOfStock';
    const isSelected = selectedProductId === product.id;
    return {
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      backgroundColor: isSelected ? '#2a2a2a' : 'transparent',
    };
  };

  const warningCounts = useMemo(() => ({
    all: products.length,
    normal: products.filter((p) => p.status === 'normal').length,
    warning: products.filter((p) => p.status === 'warning').length,
    outOfStock: products.filter((p) => p.status === 'outOfStock').length,
  }), [products]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={filterGroupStyle}>
          {(['all', 'normal', 'warning', 'outOfStock'] as const).map((status) => (
            <button
              key={status}
              className="btn"
              style={{
                ...filterButtonBase,
                backgroundColor: filterStatus === status ? '#2a2a2a' : 'transparent',
                borderColor: filterStatus === status ? '#1890ff' : '#3a3a3a',
                color: filterStatus === status ? '#1890ff' : '#e0e0e0',
              }}
              onClick={(e) => {
                createRipple(e);
                setFilterStatus(status);
              }}
            >
              {status === 'all' ? '全部' : statusLabel[status]}
              <span
                style={{
                  marginLeft: '6px',
                  opacity: 0.7,
                  fontSize: '12px',
                }}
              >
                ({warningCounts[status]})
              </span>
            </button>
          ))}
        </div>
        <button
          className="btn"
          style={sortButtonStyle}
          onClick={(e) => {
            createRipple(e);
            handleSortToggle();
          }}
        >
          库存量排序
          <span
            style={{
              transform:
                sortOrder === 'asc'
                  ? 'rotate(0deg)'
                  : sortOrder === 'desc'
                  ? 'rotate(180deg)'
                  : 'rotate(90deg)',
              transition: 'transform 0.2s ease',
              display: 'inline-block',
            }}
          >
            ↑
          </span>
        </button>
      </div>
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>商品编号</th>
              <th style={thStyle}>商品名称</th>
              {!isMobile && <th style={thStyle}>类别</th>}
              <th style={thStyle}>当前库存</th>
              <th style={thStyle}>阈值</th>
              <th style={thStyle}>状态</th>
              {isMobile && <th style={thStyle}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProducts.map((product) => {
              const isWarning =
                product.status === 'warning' || product.status === 'outOfStock';
              const isExpanded = expandedRows.has(product.id);
              return (
                <React.Fragment key={product.id}>
                  <tr
                    className={isWarning ? 'row-warning-blink' : ''}
                    style={getTrStyle(product)}
                    onClick={() => onRowClick(product)}
                    onMouseEnter={(e) => {
                      if (selectedProductId !== product.id) {
                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedProductId !== product.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <td style={getTdStyle()}>{product.sku}</td>
                    <td style={getTdStyle()}>{product.name}</td>
                    {!isMobile && <td style={getTdStyle()}>{product.category}</td>}
                    <td style={getTdStyle()}>
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            product.status === 'outOfStock'
                              ? '#f5222d'
                              : product.status === 'warning'
                              ? '#faad14'
                              : '#e0e0e0',
                        }}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td style={getTdStyle()}>{product.threshold}</td>
                    <td style={getTdStyle()}>
                      <span className={`status-tag status-${product.status}`}>
                        {statusLabel[product.status]}
                      </span>
                    </td>
                    {isMobile && (
                      <td
                        style={getTdStyle()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandRow(product.id);
                        }}
                      >
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={createRipple}
                        >
                          {isExpanded ? '收起' : '更多'}
                        </button>
                      </td>
                    )}
                  </tr>
                  {isMobile && isExpanded && (
                    <tr key={`${product.id}-expanded`}>
                      <td
                        colSpan={6}
                        style={{
                          padding: '16px 20px',
                          backgroundColor: '#1a1a1a',
                          borderBottom: '1px solid #2a2a2a',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            fontSize: '13px',
                          }}
                        >
                          <div>
                            <span style={{ color: '#a0a0a0' }}>类别：</span>
                            {product.category}
                          </div>
                          <div>
                            <span style={{ color: '#a0a0a0' }}>供应商：</span>
                            {product.supplier}
                          </div>
                          <div>
                            <span style={{ color: '#a0a0a0' }}>单价：</span>
                            ¥{product.price.toFixed(2)}
                          </div>
                          <div>
                            <span style={{ color: '#a0a0a0' }}>近7天销量：</span>
                            {product.salesHistory.reduce((a, b) => a + b, 0)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredAndSortedProducts.length === 0 && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#a0a0a0',
            fontSize: '14px',
          }}
        >
          暂无符合条件的商品数据
        </div>
      )}
    </div>
  );
}

export default DataTable;
