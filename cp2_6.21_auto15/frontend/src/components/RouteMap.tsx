import React from 'react';

interface Address {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

interface RouteMapProps {
  addresses: Address[];
  optimized_route: number[];
  width?: number;
  height?: number;
}

const RouteMap: React.FC<RouteMapProps> = ({
  addresses,
  optimized_route,
  width = 600,
  height = 400,
}) => {
  const padding = 40;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  if (addresses.length === 0) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        color: '#9ca3af',
        fontSize: '14px',
      }}>
        暂无配送地址
      </div>
    );
  }

  const lats = addresses.map((a) => a.lat);
  const lngs = addresses.map((a) => a.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const scale = Math.min(innerWidth / lngRange, innerHeight / latRange) * 0.8;

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const getX = (lng: number) => {
    return padding + innerWidth / 2 + (lng - centerLng) * scale;
  };

  const getY = (lat: number) => {
    return padding + innerHeight / 2 - (lat - centerLat) * scale;
  };

  const orderedAddresses = optimized_route
    .map((id) => addresses.find((a) => a.id === id))
    .filter(Boolean) as Address[];

  const points = orderedAddresses.map((addr) => ({
    x: getX(addr.lng),
    y: getY(addr.lat),
    ...addr,
  }));

  const startPoint = points[0];
  const deliveryPoints = points.slice(1);

  return (
    <div style={{
      width,
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      padding: '16px',
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '16px',
        fontWeight: 600,
        color: '#1f2937',
      }}>
        配送路线图
      </h3>
      <svg
        width={width}
        height={height}
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#4f46e5"
              opacity="0.6"
            />
          </marker>
        </defs>

        {points.length > 1 && points.slice(0, -1).map((point, index) => {
          const nextPoint = points[index + 1];
          const midX = (point.x + nextPoint.x) / 2;
          const midY = (point.y + nextPoint.y) / 2;

          return (
            <g key={`line-${index}`}>
              <line
                x1={point.x}
                y1={point.y}
                x2={nextPoint.x}
                y2={nextPoint.y}
                stroke="#4f46e5"
                strokeWidth="2"
                strokeDasharray="8,4"
                opacity="0.6"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={midX}
                y={midY - 8}
                textAnchor="middle"
                fontSize="11px"
                fill="#4f46e5"
                fontWeight="500"
              >
                {index + 1} → {index + 2}
              </text>
            </g>
          );
        })}

        {startPoint && (
          <g>
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r="18"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="3"
            />
            <text
              x={startPoint.x}
              y={startPoint.y + 5}
              textAnchor="middle"
              fontSize="14px"
              fontWeight="bold"
              fill="#ffffff"
            >
              起
            </text>
            <text
              x={startPoint.x}
              y={startPoint.y + 35}
              textAnchor="middle"
              fontSize="12px"
              fill="#374151"
              fontWeight="500"
            >
              {startPoint.name}
            </text>
          </g>
        )}

        {deliveryPoints.map((point, index) => (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r="16"
              fill="#4f46e5"
              stroke="#ffffff"
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={point.y + 4}
              textAnchor="middle"
              fontSize="12px"
              fontWeight="bold"
              fill="#ffffff"
            >
              {index + 1}
            </text>
            <text
              x={point.x}
              y={point.y + 32}
              textAnchor="middle"
              fontSize="11px"
              fill="#4b5563"
            >
              {point.name}
            </text>
          </g>
        ))}

        <g transform={`translate(${padding}, ${height - padding + 10})`}>
          <circle cx="0" cy="0" r="6" fill="#10b981" />
          <text x="14" y="4" fontSize="12px" fill="#6b7280">起点</text>
          <circle cx="80" cy="0" r="6" fill="#4f46e5" />
          <text x="94" y="4" fontSize="12px" fill="#6b7280">配送点</text>
          <line x1="160" y1="0" x2="180" y2="0" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4,2" />
          <text x="190" y="4" fontSize="12px" fill="#6b7280">配送路线</text>
        </g>
      </svg>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '8px',
        }}>
          优化配送顺序：
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}>
          {orderedAddresses.map((addr, index) => (
            <React.Fragment key={addr.id}>
              <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: index === 0 ? '#10b981' : '#4f46e5',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                {index === 0 ? '起点' : `${index}号`}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{addr.name}</span>
              {index < orderedAddresses.length - 1 && (
                <span style={{ color: '#9ca3af' }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
