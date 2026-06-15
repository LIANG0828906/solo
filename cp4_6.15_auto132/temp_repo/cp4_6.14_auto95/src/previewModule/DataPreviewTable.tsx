import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import { Trash2, RotateCcw } from 'lucide-react';
import type { DataRow, FieldRule } from '../types';

interface DataPreviewTableProps {
  data: DataRow[];
  rules: FieldRule[];
  onDeleteRow: (index: number) => void;
  onClearAll: () => void;
  deletedRowIndex: number | null;
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 44;

interface RowRendererProps extends ListChildComponentProps {
  data: {
    data: DataRow[];
    sortedRules: FieldRule[];
    onDelete: (index: number) => void;
    deletingRows: Set<number>;
    hoveredRow: number | null;
    setHoveredRow: (index: number | null) => void;
    handleCellHover: (e: React.MouseEvent<HTMLDivElement>, value: string | number) => void;
    handleCellLeave: () => void;
  };
}

const RowRenderer: React.FC<RowRendererProps> = ({ index, style, data }) => {
  const {
    data: rows,
    sortedRules,
    onDelete,
    deletingRows,
    hoveredRow,
    setHoveredRow,
    handleCellHover,
    handleCellLeave,
  } = data;

  const row = rows[index];
  const isEven = index % 2 === 0;
  const isHovered = hoveredRow === index;
  const isDeleting = deletingRows.has(index);

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: ROW_HEIGHT,
          backgroundColor: isHovered
            ? '#e2e8f0'
            : isEven
            ? '#ffffff'
            : '#f1f5f9',
          opacity: isDeleting ? 0 : 1,
          transform: isDeleting ? 'translateX(100%)' : 'translateX(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
        onMouseEnter={() => setHoveredRow(index)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        {sortedRules.map((rule) => (
          <div
            key={rule.id}
            style={cellStyle}
            onMouseEnter={(e) => handleCellHover(e, row[rule.fieldName])}
            onMouseLeave={handleCellLeave}
          >
            {String(row[rule.fieldName] ?? '')}
          </div>
        ))}
        <div style={{ ...cellStyle, width: 60, flexShrink: 0 }}>
          <button
            onClick={() => onDelete(index)}
            style={{
              ...rowDeleteBtnStyle,
              opacity: isHovered ? 1 : 0,
              backgroundColor: isHovered ? '#ef4444' : 'transparent',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#dc2626')
            }
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isHovered
                ? '#ef4444'
                : 'transparent';
            }}
          >
            <Trash2 size={14} style={{ color: 'white' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  data,
  rules,
  onDeleteRow,
  onClearAll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(500);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  }>({ visible: false, text: '', x: 0, y: 0 });
  const [deletingRows, setDeletingRows] = useState<Set<number>>(new Set());

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.sortIndex - b.sortIndex),
    [rules]
  );

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleDelete = useCallback(
    (index: number) => {
      setDeletingRows((prev) => new Set(prev).add(index));
      setTimeout(() => {
        onDeleteRow(index);
        setDeletingRows((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }, 200);
    },
    [onDeleteRow]
  );

  const handleCellHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, value: string | number) => {
      const cell = e.currentTarget;
      const isOverflowing = cell.scrollWidth > cell.clientWidth;
      if (isOverflowing) {
        setTooltip({
          visible: true,
          text: String(value),
          x: e.clientX + 10,
          y: e.clientY + 10,
        });
      }
    },
    []
  );

  const handleCellLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const listItemData = useMemo(
    () => ({
      data,
      sortedRules,
      onDelete: handleDelete,
      deletingRows,
      hoveredRow,
      setHoveredRow,
      handleCellHover,
      handleCellLeave,
    }),
    [data, sortedRules, handleDelete, deletingRows, hoveredRow, handleCellHover, handleCellLeave]
  );

  return (
    <div style={tableWrapperStyle}>
      <div style={tableHeaderStyle}>
        <div style={headerRowStyle}>
          {sortedRules.map((rule) => (
            <div key={rule.id} style={headerCellStyle}>
              {rule.fieldName}
            </div>
          ))}
          <div style={{ ...headerCellStyle, width: 60, flexShrink: 0 }}>
            <button
              onClick={onClearAll}
              style={clearButtonStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {data.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>📊</div>
            <div style={emptyTextStyle}>暂无数据</div>
            <div style={emptySubTextStyle}>
              添加字段并点击生成按钮创建测试数据
            </div>
          </div>
        ) : (
          <List
            height={containerHeight}
            itemCount={data.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            itemData={listItemData}
            overscanCount={10}
          >
            {RowRenderer}
          </List>
        )}
      </div>

      <div style={tableFooterStyle}>共 {data.length} 条数据</div>

      {tooltip.visible && (
        <div
          style={{
            ...tooltipStyle,
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

const tableWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  width: '100%',
};

const tableHeaderStyle: React.CSSProperties = {
  flexShrink: 0,
  backgroundColor: '#475569',
  height: HEADER_HEIGHT,
  width: '100%',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  height: '100%',
  width: '100%',
};

const headerCellStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 100,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  fontSize: 16,
  fontWeight: 'bold',
  color: '#f8fafc',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const cellStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 100,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  fontSize: 14,
  color: '#334155',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const rowDeleteBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s ease, opacity 0.2s ease',
  padding: 0,
};

const clearButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#f8fafc',
  backgroundColor: 'transparent',
  transition: 'background-color 0.2s ease',
};

const tableFooterStyle: React.CSSProperties = {
  flexShrink: 0,
  height: 40,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  fontSize: 14,
  color: '#64748b',
  backgroundColor: '#ffffff',
  borderTop: '1px solid #e2e8f0',
};

const emptyStateStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  pointerEvents: 'none',
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: 48,
  marginBottom: 12,
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  color: '#64748b',
  marginBottom: 8,
};

const emptySubTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
};

const tooltipStyle: React.CSSProperties = {
  position: 'fixed',
  backgroundColor: '#1e293b',
  color: '#f8fafc',
  padding: '6px 10px',
  borderRadius: 6,
  fontSize: 12,
  zIndex: 2000,
  pointerEvents: 'none',
  maxWidth: 300,
  wordBreak: 'break-all',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};
