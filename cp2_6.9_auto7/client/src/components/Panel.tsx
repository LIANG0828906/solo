import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Cluster, SentimentPoint } from '../types';

interface PanelProps {
  type: 'left' | 'right' | 'top' | 'bottom';
  clusters: Cluster[];
  sentimentHistory?: SentimentPoint[];
  highlightedCluster?: string | null;
  filteredCluster?: string | null;
  onClusterClick?: (clusterName: string) => void;
  onChartClick?: (clusterName: string | null) => void;
  style?: React.CSSProperties;
}

const Panel: React.FC<PanelProps> = ({
  type,
  clusters,
  sentimentHistory = [],
  highlightedCluster,
  filteredCluster,
  onClusterClick,
  onChartClick,
  style = {}
}) => {
  const donutCanvasRef = useRef<HTMLCanvasElement>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set());
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  const isLeftType = type === 'left' || type === 'top';
  const isRightType = type === 'right' || type === 'bottom';
  const isHorizontal = type === 'top' || type === 'bottom';

  const toggleCluster = (name: string) => {
    setCollapsedClusters(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const drawDonutChart = useCallback(() => {
    const canvas = donutCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const innerRadius = radius * 0.6;

    ctx.clearRect(0, 0, width, height);

    if (clusters.length === 0) {
      ctx.fillStyle = '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', centerX, centerY);
      return;
    }

    const total = clusters.reduce((sum, c) => sum + c.count, 0);
    let startAngle = -Math.PI / 2;

    clusters.forEach((cluster, index) => {
      const sliceAngle = (cluster.count / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const isHovered = hoveredSlice === index;
      const isFiltered = filteredCluster === cluster.name;
      const offset = isHovered || isFiltered ? 5 : 0;

      const midAngle = startAngle + sliceAngle / 2;
      const offsetX = Math.cos(midAngle) * offset;
      const offsetY = Math.sin(midAngle) * offset;

      ctx.beginPath();
      ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle);
      ctx.arc(centerX + offsetX, centerY + offsetY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = cluster.color;
      ctx.globalAlpha = isFiltered ? 1 : (hoveredSlice !== null && !isHovered ? 0.5 : 1);
      ctx.fill();

      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (cluster.count > 0) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = (radius + innerRadius) / 2;
        const labelX = centerX + offsetX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + offsetY + Math.sin(labelAngle) * labelRadius;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        ctx.fillText(`${Math.round((cluster.count / total) * 100)}%`, labelX, labelY);
      }

      startAngle = endAngle;
    });

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('聚类分布', centerX, centerY - 8);
    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText(`共 ${total} 条`, centerX, centerY + 10);
  }, [clusters, hoveredSlice, filteredCluster]);

  const drawLineChart = useCallback(() => {
    const canvas = lineCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 25, right: 15, bottom: 25, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('情感趋势', width / 2, 15);

    if (sentimentHistory.length < 2) {
      ctx.fillStyle = '#555';
      ctx.font = '11px sans-serif';
      ctx.fillText('等待数据...', width / 2, height / 2 + 10);
      return;
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${100 - i * 25}`, padding.left - 5, y + 3);
    }

    const minVal = 0;
    const maxVal = 100;
    const valRange = maxVal - minVal;

    ctx.beginPath();
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;

    sentimentHistory.forEach((point, index) => {
      const x = padding.left + (index / (sentimentHistory.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - minVal) / valRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(33, 150, 243, 0.3)');
    gradient.addColorStop(1, 'rgba(33, 150, 243, 0)');

    ctx.beginPath();
    sentimentHistory.forEach((point, index) => {
      const x = padding.left + (index / (sentimentHistory.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - minVal) / valRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    sentimentHistory.forEach((point, index) => {
      const x = padding.left + (index / (sentimentHistory.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - minVal) / valRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      const green = Math.floor((point.value / 100) * 255);
      const red = Math.floor((1 - point.value / 100) * 255);
      ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('-5min', padding.left, height - 8);
    ctx.fillText('现在', width - padding.right, height - 8);
  }, [sentimentHistory]);

  useEffect(() => {
    if (isRightType && donutCanvasRef.current) {
      drawDonutChart();
    }
  }, [isRightType, drawDonutChart]);

  useEffect(() => {
    if (isRightType && lineCanvasRef.current) {
      drawLineChart();
    }
  }, [isRightType, drawLineChart]);

  useEffect(() => {
    const handleResize = () => {
      if (isRightType) {
        drawDonutChart();
        drawLineChart();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isRightType, drawDonutChart, drawLineChart]);

  const handleDonutClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onChartClick || !donutCanvasRef.current) return;

    const canvas = donutCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const distance = Math.sqrt(x * x + y * y);
    const radius = Math.min(rect.width, rect.height) / 2 - 10;
    const innerRadius = radius * 0.6;

    if (distance < innerRadius || distance > radius) {
      onChartClick(null);
      return;
    }

    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;

    const total = clusters.reduce((sum, c) => sum + c.count, 0);
    let startAngle = 0;

    for (const cluster of clusters) {
      const sliceAngle = (cluster.count / total) * Math.PI * 2;
      if (angle >= startAngle && angle < startAngle + sliceAngle) {
        onChartClick(cluster.name);
        return;
      }
      startAngle += sliceAngle;
    }
  };

  const handleDonutHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!donutCanvasRef.current) return;

    const canvas = donutCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const distance = Math.sqrt(x * x + y * y);
    const radius = Math.min(rect.width, rect.height) / 2 - 10;
    const innerRadius = radius * 0.6;

    if (distance < innerRadius || distance > radius) {
      setHoveredSlice(null);
      return;
    }

    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;

    const total = clusters.reduce((sum, c) => sum + c.count, 0);
    let startAngle = 0;

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const sliceAngle = (cluster.count / total) * Math.PI * 2;
      if (angle >= startAngle && angle < startAngle + sliceAngle) {
        setHoveredSlice(i);
        return;
      }
      startAngle += sliceAngle;
    }

    setHoveredSlice(null);
  };

  const panelStyle: React.CSSProperties = {
    width: isHorizontal ? '100%' : '220px',
    height: isHorizontal ? 'auto' : '100%',
    minHeight: isHorizontal ? '120px' : '0',
    flexShrink: 0,
    backgroundColor: '#252526',
    borderRight: !isHorizontal && type === 'left' ? '1px solid #333' : 'none',
    borderLeft: !isHorizontal && type === 'right' ? '1px solid #333' : 'none',
    borderBottom: isHorizontal && type === 'top' ? '1px solid #333' : 'none',
    borderTop: isHorizontal && type === 'bottom' ? '1px solid #333' : 'none',
    padding: '16px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    gap: isHorizontal ? '20px' : '16px',
    ...style
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#ccc',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  };

  const clusterItemStyle: React.CSSProperties = {
    marginBottom: '8px',
    borderRadius: '6px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const clusterHeaderStyle: React.CSSProperties = {
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  };

  return (
    <div style={panelStyle}>
      {isLeftType && (
        <div style={{ flex: isHorizontal ? 1 : 'none' }}>
          <div style={sectionTitleStyle}>主题聚类</div>
          {clusters.length === 0 ? (
            <div style={{ color: '#666', fontSize: '12px', padding: '8px 0' }}>
              暂无聚类数据
            </div>
          ) : (
            clusters.map((cluster) => {
              const isCollapsed = collapsedClusters.has(cluster.name);
              const isHighlighted = highlightedCluster === cluster.name;
              const isFiltered = filteredCluster === cluster.name;

              return (
                <div
                  key={cluster.name}
                  style={{
                    ...clusterItemStyle,
                    boxShadow: isHighlighted ? `0 0 10px ${cluster.color}` : 'none'
                  }}
                >
                  <div
                    style={{
                      ...clusterHeaderStyle,
                      backgroundColor: cluster.color + (isHighlighted ? '60' : '30'),
                      color: '#fff',
                      transform: isHighlighted ? 'scale(1.02)' : 'scale(1)'
                    }}
                    onClick={() => onClusterClick?.(cluster.name)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = cluster.color + '50';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = cluster.color + (isHighlighted ? '60' : '30');
                      e.currentTarget.style.transform = isHighlighted ? 'scale(1.02)' : 'scale(1)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCluster(cluster.name);
                        }}
                        style={{ transition: 'transform 0.2s ease', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                      >
                        ▼
                      </span>
                      {cluster.name}
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}>
                      {cluster.count}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#1e1e1e',
                      fontSize: '11px',
                      color: '#888'
                    }}>
                      {isFiltered && (
                        <div style={{ color: cluster.color, marginBottom: '4px' }}>
                          ● 当前过滤显示中
                        </div>
                      )}
                      <div>气泡ID: {cluster.bubbleIds.slice(0, 3).map(id => id.slice(0, 8)).join(', ')}{cluster.bubbleIds.length > 3 ? '...' : ''}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {isRightType && (
        <>
          <div style={{ flex: isHorizontal ? 1 : 'none', minHeight: isHorizontal ? '180px' : '200px' }}>
            <div style={sectionTitleStyle}>聚类分布</div>
            <canvas
              ref={donutCanvasRef}
              onClick={handleDonutClick}
              onMouseMove={handleDonutHover}
              onMouseLeave={() => setHoveredSlice(null)}
              style={{
                width: '100%',
                height: isHorizontal ? '180px' : '180px',
                cursor: 'pointer'
              }}
            />
            {filteredCluster && (
              <div
                onClick={() => onChartClick?.(null)}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#333',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#ccc',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#444';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#333';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                点击取消过滤 (当前: {filteredCluster})
              </div>
            )}
          </div>

          <div style={{ flex: isHorizontal ? 1 : 'none', minHeight: isHorizontal ? '180px' : '200px' }}>
            <div style={sectionTitleStyle}>情感趋势</div>
            <canvas
              ref={lineCanvasRef}
              style={{
                width: '100%',
                height: isHorizontal ? '180px' : '150px'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '10px',
              color: '#888'
            }}>
              <span style={{ color: '#f44336' }}>● 负向</span>
              <span style={{ color: '#4caf50' }}>● 正向</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Panel;
