import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { Fabric, ColorFilter, PatternFilter } from '../types';

interface FabricListProps {
  onSelectFabric?: (fabric: Fabric) => void;
  selectedFabricId?: number | null;
  showFilters?: boolean;
  compact?: boolean;
}

const COLOR_OPTIONS: { value: ColorFilter; label: string; dot: string }[] = [
  { value: 'all', label: '全部', dot: 'linear-gradient(135deg,#B87333,#D7C4A1,#90AFC5)' },
  { value: '红', label: '红', dot: '#C98A8A' },
  { value: '蓝', label: '蓝', dot: '#90AFC5' },
  { value: '绿', label: '绿', dot: '#A8C3A0' },
  { value: '黄', label: '黄', dot: '#E8D090' },
  { value: '紫', label: '紫', dot: '#B8A9C9' },
  { value: '白', label: '白', dot: '#F5F0E8' },
  { value: '黑', label: '黑', dot: '#5D4037' },
];

const PATTERN_OPTIONS: PatternFilter[] = ['all', '纯色', '条纹', '碎花', '格纹', '几何'];

const FabricList: React.FC<FabricListProps> = ({
  onSelectFabric,
  selectedFabricId,
  showFilters = true,
  compact = false,
}) => {
  const navigate = useNavigate();
  const { fabrics } = useProjectStore();
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all');
  const [patternFilter, setPatternFilter] = useState<PatternFilter>('all');
  const [searchText, setSearchText] = useState('');

  const filteredFabrics = useMemo(() => {
    return fabrics.filter((f) => {
      if (colorFilter !== 'all' && f.color !== colorFilter) return false;
      if (patternFilter !== 'all' && f.pattern !== patternFilter) return false;
      if (searchText && !f.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [fabrics, colorFilter, patternFilter, searchText]);

  const handleDragStart = (e: React.DragEvent, fabric: Fabric) => {
    e.dataTransfer.setData('fabricId', String(fabric.id));
    e.dataTransfer.effectAllowed = 'copy';
    sessionStorage.setItem('draggedFabricId', String(fabric.id));
  };

  const handleClick = (fabric: Fabric) => {
    if (onSelectFabric) {
      onSelectFabric(fabric);
    } else {
      navigate(`/fabric/${fabric.id}`);
    }
  };

  const handleStockBadgeClick = (e: React.MouseEvent, fabric: Fabric) => {
    e.stopPropagation();
    navigate(`/procurement/${fabric.id}`);
  };

  if (compact) {
    return (
      <div style={styles.compactGrid}>
        {filteredFabrics.map((fabric) => (
          <div
            key={fabric.id}
            draggable
            onDragStart={(e) => handleDragStart(e, fabric)}
            onClick={() => handleClick(fabric)}
            title={`${fabric.name} - ¥${fabric.pricePerMeter}/米`}
            style={{
              ...styles.compactCard,
              background: fabric.gradient,
              border: selectedFabricId === fabric.id ? '2px solid #B87333' : '1px solid #D7C4A1',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.title}>🧶 布料库</div>
        <div style={styles.count}>{filteredFabrics.length} 款</div>
      </div>

      {showFilters && (
        <>
          <input
            type="text"
            placeholder="搜索布料名称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={styles.searchInput}
          />

          <div style={styles.filterSection}>
            <div style={styles.filterLabel}>颜色</div>
            <div style={styles.colorFilterRow}>
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColorFilter(opt.value)}
                  style={{
                    ...styles.colorFilterBtn,
                    background: opt.dot,
                    outline: colorFilter === opt.value ? '2px solid #B87333' : 'none',
                    outlineOffset: 1,
                  }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          <div style={styles.filterSection}>
            <div style={styles.filterLabel}>花纹</div>
            <div style={styles.patternFilterRow}>
              {PATTERN_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPatternFilter(opt)}
                  style={{
                    ...styles.patternFilterBtn,
                    background: patternFilter === opt ? '#B87333' : 'transparent',
                    color: patternFilter === opt ? '#FFF8F0' : '#5D4037',
                    borderColor: patternFilter === opt ? '#B87333' : '#D7C4A1',
                  }}
                >
                  {opt === 'all' ? '全部' : opt}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={styles.grid}>
        {filteredFabrics.map((fabric) => (
          <div
            key={fabric.id}
            draggable
            onDragStart={(e) => handleDragStart(e, fabric)}
            onClick={() => handleClick(fabric)}
            style={{
              ...styles.fabricCard,
              border:
                selectedFabricId === fabric.id
                  ? '2px solid #B87333'
                  : '1px solid #E8DDD0',
              boxShadow:
                selectedFabricId === fabric.id
                  ? '0 4px 16px rgba(184, 115, 51, 0.25)'
                  : '0 2px 8px rgba(93, 64, 55, 0.08)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translateY(-4px)';
              el.style.boxShadow =
                selectedFabricId === fabric.id
                  ? '0 8px 24px rgba(184, 115, 51, 0.35)'
                  : '0 8px 24px rgba(93, 64, 55, 0.18)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow =
                selectedFabricId === fabric.id
                  ? '0 4px 16px rgba(184, 115, 51, 0.25)'
                  : '0 2px 8px rgba(93, 64, 55, 0.08)';
            }}
          >
            {fabric.stockMeters < 5 && (
              <div
                style={styles.stockBadge}
                onClick={(e) => handleStockBadgeClick(e, fabric)}
                title={`库存不足：${fabric.stockMeters}米，点击查看补货建议`}
              >
                {Math.ceil(fabric.stockMeters)}
              </div>
            )}
            <div style={{ ...styles.fabricPreview, background: fabric.gradient }} />
            <div style={styles.fabricInfo}>
              <div style={styles.fabricName}>{fabric.name}</div>
              <div style={styles.fabricMeta}>
                <span style={styles.fabricPattern}>{fabric.pattern}</span>
                <span style={styles.fabricColorDot}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: fabric.colorCode,
                      marginRight: 4,
                      verticalAlign: 'middle',
                    }}
                  />
                  {fabric.colorCode}
                </span>
              </div>
              <div style={styles.fabricPrice}>
                <span style={styles.priceValue}>¥{fabric.pricePerMeter}</span>
                <span style={styles.priceUnit}>/米</span>
                <span
                  style={{
                    ...styles.stockText,
                    color: fabric.stockMeters < 5 ? '#C94A4A' : '#8D6E63',
                  }}
                >
                  库存 {fabric.stockMeters} 米
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: 280,
    minWidth: 280,
    maxWidth: 280,
    height: '100%',
    overflowY: 'auto',
    background: '#FFF8F0',
    borderRight: '1px solid #D7C4A1',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#5D4037',
  },
  count: {
    fontSize: 12,
    color: '#8D6E63',
    background: '#F5F0E8',
    padding: '2px 10px',
    borderRadius: 10,
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #D7C4A1',
    background: '#FFFAF4',
    fontSize: 13,
    color: '#5D4037',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#8D6E63',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colorFilterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  colorFilterBtn: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid #FFFAF4',
    cursor: 'pointer',
    padding: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  patternFilterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  patternFilterBtn: {
    padding: '4px 10px',
    borderRadius: 12,
    border: '1px solid',
    fontSize: 11,
    cursor: 'pointer',
    background: 'transparent',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    marginTop: 4,
  },
  compactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    padding: 8,
  },
  compactCard: {
    aspectRatio: '1',
    borderRadius: 6,
    cursor: 'grab',
    transition: 'all 0.2s',
  },
  fabricCard: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#FFFAF4',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#C94A4A',
    color: '#FFF',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(201, 74, 74, 0.4)',
  },
  fabricPreview: {
    height: 64,
    width: '100%',
  },
  fabricInfo: {
    padding: 10,
  },
  fabricName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#5D4037',
    marginBottom: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fabricMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 10,
  },
  fabricPattern: {
    color: '#8D6E63',
    background: '#F5F0E8',
    padding: '1px 6px',
    borderRadius: 4,
  },
  fabricColorDot: {
    color: '#8D6E63',
    fontFamily: 'monospace',
    fontSize: 9,
  },
  fabricPrice: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#B87333',
  },
  priceUnit: {
    fontSize: 10,
    color: '#8D6E63',
  },
  stockText: {
    fontSize: 10,
    marginLeft: 'auto',
  },
};

export default FabricList;
