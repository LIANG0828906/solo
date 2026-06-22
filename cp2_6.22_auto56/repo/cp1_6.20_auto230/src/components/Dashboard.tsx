import React, { useState } from 'react';
import { Route, Dimension } from '../types';
import { valueToColor, costToColor } from '../utils/gradientColor';

interface DashboardProps {
  routes: Route[];
  dimensions: Dimension[];
  selectedKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onOrderChange: (dimensions: Dimension[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  routes,
  dimensions,
  selectedKeys,
  onSelectionChange,
  onOrderChange,
}) => {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const getRouteValue = (route: Route, key: string): number => {
    if (key === 'avgCost') {
      return Math.round((route.costRange.min + route.costRange.max) / 2);
    }
    return (route as unknown as Record<string, number>)[key] || 0;
  };

  const getDisplayValue = (route: Route, dim: Dimension): string => {
    const val = getRouteValue(route, dim.key);
    if (dim.key === 'avgCost') {
      return `¥${val.toLocaleString()}`;
    }
    if (dim.unit) {
      return `${val}${dim.unit}`;
    }
    return String(val);
  };

  const getCellColor = (route: Route, dim: Dimension): string => {
    const values = routes.map((r) => getRouteValue(r, dim.key));
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    if (dim.key === 'avgCost') {
      return costToColor(getRouteValue(route, dim.key), min, max);
    }
    if (dim.key === 'attractionTypes') {
      return valueToColor(getRouteValue(route, dim.key), max, dim.higherIsBetter);
    }
    return valueToColor(getRouteValue(route, dim.key), 100, dim.higherIsBetter);
  };

  const handleCheckbox = (key: string) => {
    if (selectedKeys.includes(key)) {
      if (selectedKeys.length > 1) {
        onSelectionChange(selectedKeys.filter((k) => k !== key));
      }
    } else {
      if (selectedKeys.length < 5) {
        onSelectionChange([...selectedKeys, key]);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDragKey(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (dragKey && dragKey !== key) {
      setDragOverKey(key);
    }
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (dragKey && dragKey !== targetKey) {
      const newDims = [...dimensions];
      const fromIdx = newDims.findIndex((d) => d.key === dragKey);
      const toIdx = newDims.findIndex((d) => d.key === targetKey);
      const [moved] = newDims.splice(fromIdx, 1);
      newDims.splice(toIdx, 0, moved);
      onOrderChange(newDims);
    }
    setDragKey(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDragKey(null);
    setDragOverKey(null);
  };

  const visibleDimensions = dimensions.filter((d) => selectedKeys.includes(d.key));
  const maxBarValue = Math.max(
    ...visibleDimensions.flatMap((dim) => routes.map((r) => getRouteValue(r, dim.key)))
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">并排对比仪表盘</h2>
        <div className="dimension-selector">
          <span className="selector-label">选择对比维度（{selectedKeys.length}/5）：</span>
          <div className="dimension-checkboxes">
            {dimensions.map((dim) => (
              <label
                key={dim.key}
                className={`dimension-item ${dragOverKey === dim.key ? 'drag-over' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, dim.key)}
                onDragOver={(e) => handleDragOver(e, dim.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dim.key)}
                onDragEnd={handleDragEnd}
              >
                <span className="drag-handle" title="拖拽排序">⋮⋮</span>
                <input
                  type="checkbox"
                  checked={selectedKeys.includes(dim.key)}
                  onChange={() => handleCheckbox(dim.key)}
                  disabled={!selectedKeys.includes(dim.key) && selectedKeys.length >= 5}
                />
                <span className="dimension-name">{dim.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="table-dim-header">对比维度</th>
              {routes.map((route) => (
                <th key={route.id} className="table-route-header">
                  {route.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleDimensions.map((dim) => {
              const barValues = routes.map((r) => getRouteValue(r, dim.key));
              const barMax = Math.max(...barValues);
              return (
                <tr key={dim.key} className="table-row">
                  <td className="table-dim-cell">
                    <span className="dim-cell-label">{dim.label}</span>
                    <div className="dim-bar-chart">
                      {barValues.map((v, i) => (
                        <div
                          key={i}
                          className="dim-bar-segment"
                          style={{
                            width: `${barMax > 0 ? (v / barMax) * 100 : 0}%`,
                            backgroundColor: routes[i] ? valueToColor(v, 100, dim.higherIsBetter) : '#ccc',
                          }}
                        />
                      ))}
                    </div>
                  </td>
                  {routes.map((route) => (
                    <td
                      key={`${dim.key}-${route.id}`}
                      className="table-value-cell"
                      style={{ backgroundColor: getCellColor(route, dim) }}
                    >
                      {getDisplayValue(route, dim)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
