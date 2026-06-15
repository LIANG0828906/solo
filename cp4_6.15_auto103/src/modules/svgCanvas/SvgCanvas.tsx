import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  memo,
} from 'react';
import useSketchStore from '../../store/useSketchStore';
import type { Layer, Point } from '../../types';
import { throttle, RAFBatchUpdater } from '../../utils/performance';

type HandlePosition =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se';

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HANDLE_SIZE = 8;
const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF6B6B', '#4ECDC4',
  '#7BC67E', '#5DA860', '#FFD93D', '#FF8C42', '#6C5CE7',
];

const getLayerBBox = (layer: Layer): BBox => {
  if (layer.type === 'shape') {
    if (layer.shapeType === 'rectangle' || layer.shapeType === 'polygon') {
      return {
        x: layer.x ?? 0,
        y: layer.y ?? 0,
        width: layer.width ?? 0,
        height: layer.height ?? 0,
      };
    }
    if (layer.shapeType === 'circle') {
      const r = layer.radius ?? 0;
      return {
        x: (layer.x ?? 0) - r,
        y: (layer.y ?? 0) - r,
        width: r * 2,
        height: r * 2,
      };
    }
    if (layer.shapeType === 'triangle' && layer.points && layer.points.length >= 3) {
      const xs = layer.points.map(p => p.x);
      const ys = layer.points.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY,
      };
    }
  }
  if (layer.type === 'stroke' && layer.points && layer.points.length > 0) {
    const xs = layer.points.map(p => p.x);
    const ys = layer.points.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      x: minX,
      y: minY,
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY,
    };
  }
  if (layer.type === 'text') {
    return {
      x: layer.x ?? 0,
      y: (layer.y ?? 0) - 20,
      width: layer.width ?? 100,
      height: layer.height ?? 30,
    };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
};

const getHandlePositions = (bbox: BBox): Record<HandlePosition, Point> => {
  const { x, y, width, height } = bbox;
  return {
    nw: { x, y },
    n: { x: x + width / 2, y },
    ne: { x: x + width, y },
    w: { x, y: y + height / 2 },
    e: { x: x + width, y: y + height / 2 },
    sw: { x, y: y + height },
    s: { x: x + width / 2, y: y + height },
    se: { x: x + width, y: y + height },
  };
};

const LayerShape: React.FC<{
  layer: Layer;
  isSelected: boolean;
  isEditing: boolean;
  opacity: number;
}> = memo(({ layer, isSelected, isEditing, opacity }) => {
  const strokeColor = isSelected ? '#00BFFF' : layer.strokeColor;
  const strokeWidth = isSelected ? Math.max(layer.strokeWidth, 2) : layer.strokeWidth;
  const fillOpacity = layer.fillOpacity ?? 0;
  const transform = layer.rotation ? `rotate(${layer.rotation} ${layer.x ?? 0} ${layer.y ?? 0})` : undefined;

  if (layer.type === 'stroke' && layer.points && layer.points.length > 0) {
    const d = layer.points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
    return (
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        transform={transform}
        style={{ transition: isEditing ? 'none' : 'all 0.2s ease' }}
      />
    );
  }

  if (layer.type === 'shape') {
    if (layer.shapeType === 'rectangle') {
      return (
        <rect
          x={layer.x}
          y={layer.y}
          width={layer.width}
          height={layer.height}
          fill={layer.fillColor}
          fillOpacity={fillOpacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
          style={{ transition: isEditing ? 'none' : 'all 0.2s ease' }}
        />
      );
    }
    if (layer.shapeType === 'circle') {
      return (
        <ellipse
          cx={layer.x}
          cy={layer.y}
          rx={layer.radius}
          ry={layer.radius}
          fill={layer.fillColor}
          fillOpacity={fillOpacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
          style={{ transition: isEditing ? 'none' : 'all 0.2s ease' }}
        />
      );
    }
    if ((layer.shapeType === 'triangle' || layer.shapeType === 'polygon') && layer.points) {
      const pointsStr = layer.points.map(p => `${p.x},${p.y}`).join(' ');
      return (
        <polygon
          points={pointsStr}
          fill={layer.fillColor}
          fillOpacity={fillOpacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
          style={{ transition: isEditing ? 'none' : 'all 0.2s ease' }}
        />
      );
    }
  }

  if (layer.type === 'text') {
    return (
      <text
        x={layer.x}
        y={layer.y}
        fill={strokeColor}
        fontSize={16}
        fontFamily="sans-serif"
        opacity={opacity}
        transform={transform}
        style={{ transition: isEditing ? 'none' : 'all 0.2s ease', userSelect: 'none' }}
      >
        {layer.text}
      </text>
    );
  }

  return null;
});

LayerShape.displayName = 'LayerShape';

const ControlHandles: React.FC<{
  bbox: BBox;
  zoom: number;
  onHandleMouseDown: (position: HandlePosition, e: React.MouseEvent) => void;
}> = ({ bbox, zoom, onHandleMouseDown }) => {
  const handles = getHandlePositions(bbox);
  const size = HANDLE_SIZE / zoom;
  const half = size / 2;

  const cursorMap: Record<HandlePosition, string> = {
    nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
    w: 'ew-resize', e: 'ew-resize',
    sw: 'nesw-resize', s: 'ns-resize', se: 'nwse-resize',
  };

  return (
    <>
      <rect
        x={bbox.x - size}
        y={bbox.y - size}
        width={bbox.width + size * 2}
        height={bbox.height + size * 2}
        fill="none"
        stroke="#00BFFF"
        strokeWidth={1.5 / zoom}
        strokeDasharray={`${4 / zoom} ${4 / zoom}`}
        pointerEvents="none"
      />
      {(Object.keys(handles) as HandlePosition[]).map(pos => {
        const p = handles[pos];
        const isCorner = ['nw', 'ne', 'sw', 'se'].includes(pos);
        return (
          <rect
            key={pos}
            x={p.x - half}
            y={p.y - half}
            width={size}
            height={size}
            fill="#00BFFF"
            stroke="#FFFFFF"
            strokeWidth={1 / zoom}
            style={{ cursor: cursorMap[pos] }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onHandleMouseDown(pos, e);
            }}
          >
            {isCorner && (
              <title>按住 Shift 拖拽旋转</title>
            )}
          </rect>
        );
      })}
    </>
  );
};

const PropertyPanel: React.FC<{
  layer: Layer;
  screenX: number;
  screenY: number;
  onChange: (updates: Partial<Layer>) => void;
  onClose: () => void;
}> = ({ layer, screenX, screenY, onChange, onClose }) => {
  const [localColor, setLocalColor] = useState(layer.strokeColor);
  const [localWidth, setLocalWidth] = useState(layer.strokeWidth);
  const [localOpacity, setLocalOpacity] = useState(Math.round((layer.opacity ?? 1) * 100));

  const handleColorChange = (color: string) => {
    setLocalColor(color);
    onChange({ strokeColor: color });
  };

  const handleWidthChange = (width: number) => {
    setLocalWidth(width);
    onChange({ strokeWidth: width });
  };

  const handleOpacityChange = (opacity: number) => {
    setLocalOpacity(opacity);
    onChange({ opacity: opacity / 100 });
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: Math.min(screenX, window.innerWidth - 280),
        top: Math.min(screenY, window.innerHeight - 320),
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(0, 191, 255, 0.3)',
        width: 260,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#2D3436' }}>属性编辑</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: '#636E72',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#636E72', display: 'block', marginBottom: 6 }}>
          颜色
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <input
              type="color"
              value={localColor}
              onChange={(e) => handleColorChange(e.target.value)}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: localColor,
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
          <input
            type="text"
            value={localColor}
            onChange={(e) => handleColorChange(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #E8E0D8',
              fontSize: 12,
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                border: localColor === color ? '2px solid #00BFFF' : '1px solid #E8E0D8',
                background: color,
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#636E72', display: 'block', marginBottom: 6 }}>
          线宽: <span style={{ color: '#00BFFF', fontWeight: 500 }}>{localWidth}px</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={localWidth}
          onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#00BFFF' }}
        />
      </div>

      <div>
        <label style={{ fontSize: 12, color: '#636E72', display: 'block', marginBottom: 6 }}>
          透明度: <span style={{ color: '#00BFFF', fontWeight: 500 }}>{localOpacity}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={localOpacity}
          onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#00BFFF' }}
        />
      </div>
    </div>
  );
};

const AngleTooltip: React.FC<{
  x: number;
  y: number;
  angle: number;
}> = ({ x, y, angle }) => (
  <div
    style={{
      position: 'fixed',
      left: x + 15,
      top: y + 15,
      zIndex: 1001,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '4px 10px',
      borderRadius: 6,
      fontSize: 12,
      fontFamily: 'monospace',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}
  >
    {angle.toFixed(1)}°
  </div>
);

const SvgCanvas: React.FC = () => {
  const {
    originalImageUrl,
    layerGroups,
    selectedLayerId,
    zoom,
    panX,
    panY,
    selectLayer,
    updateLayer,
    setZoom,
    setPan,
  } = useSketchStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [propertyPanelPos, setPropertyPanelPos] = useState({ x: 0, y: 0 });
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [rotationCenter, setRotationCenter] = useState<Point>({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    handle: HandlePosition;
    startBBox: BBox;
    startMouse: Point;
    layerId: string;
  } | null>(null);

  const batchUpdater = useMemo(() => new RAFBatchUpdater<{ zoom: number; panX: number; panY: number }>(
    (update) => {
      if (update.zoom !== undefined) setZoom(update.zoom);
      if (update.panX !== undefined && update.panY !== undefined) setPan(update.panX, update.panY);
    }
  ), [setZoom, setPan]);

  const allLayers = useMemo(() => {
    const layers: Layer[] = [];
    layerGroups.forEach(group => {
      group.layers.forEach(layer => {
        if (layer.visible) {
          layers.push(layer);
        }
      });
    });
    return layers;
  }, [layerGroups]);

  const selectedLayer = useMemo(() => {
    return allLayers.find(l => l.id === selectedLayerId) || null;
  }, [allLayers, selectedLayerId]);

  const screenToSvg = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  }, [zoom, panX, panY]);

  const handleWheel = useCallback(throttle((e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;
    const newZoom = Math.min(20, Math.max(0.1, zoom * factor));

    const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);

    batchUpdater.queueUpdate({
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY,
    });
  }, 16), [zoom, panX, panY, batchUpdater]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isDraggingHandle) return;

    const target = e.target as SVGElement;
    const layerId = target.closest('[data-layer-id]')?.getAttribute('data-layer-id');

    if (layerId) {
      selectLayer(layerId);
    } else {
      selectLayer(null);
      setEditingLayerId(null);
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        panX,
        panY,
      });
    }
  }, [selectLayer, panX, panY, isDraggingHandle]);

  const handleMouseMove = useCallback(throttle((e: MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      batchUpdater.queueUpdate({
        panX: panStart.panX + dx,
        panY: panStart.panY + dy,
      });
      return;
    }

    if (dragState && !isRotating) {
      const svgMouse = screenToSvg(e.clientX, e.clientY);
      const dx = svgMouse.x - dragState.startMouse.x;
      const dy = svgMouse.y - dragState.startMouse.y;
      const bbox = dragState.startBBox;

      let newX = bbox.x;
      let newY = bbox.y;
      let newWidth = bbox.width;
      let newHeight = bbox.height;

      switch (dragState.handle) {
        case 'nw':
          newX = bbox.x + dx;
          newY = bbox.y + dy;
          newWidth = bbox.width - dx;
          newHeight = bbox.height - dy;
          break;
        case 'n':
          newY = bbox.y + dy;
          newHeight = bbox.height - dy;
          break;
        case 'ne':
          newY = bbox.y + dy;
          newWidth = bbox.width + dx;
          newHeight = bbox.height - dy;
          break;
        case 'w':
          newX = bbox.x + dx;
          newWidth = bbox.width - dx;
          break;
        case 'e':
          newWidth = bbox.width + dx;
          break;
        case 'sw':
          newX = bbox.x + dx;
          newWidth = bbox.width - dx;
          newHeight = bbox.height + dy;
          break;
        case 's':
          newHeight = bbox.height + dy;
          break;
        case 'se':
          newWidth = bbox.width + dx;
          newHeight = bbox.height + dy;
          break;
      }

      if (newWidth < 5) newWidth = 5;
      if (newHeight < 5) newHeight = 5;

      const layer = allLayers.find(l => l.id === dragState.layerId);
      if (layer) {
        if (layer.type === 'shape' && layer.shapeType === 'circle') {
          const cx = newX + newWidth / 2;
          const cy = newY + newHeight / 2;
          const r = Math.max(newWidth, newHeight) / 2;
          updateLayer(dragState.layerId, { x: cx, y: cy, radius: r });
        } else if (layer.type === 'stroke' && layer.points) {
          const scaleX = newWidth / bbox.width;
          const scaleY = newHeight / bbox.height;
          const newPoints = layer.points.map(p => ({
            x: newX + (p.x - bbox.x) * scaleX,
            y: newY + (p.y - bbox.y) * scaleY,
          }));
          updateLayer(dragState.layerId, { points: newPoints });
        } else {
          updateLayer(dragState.layerId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          });
        }
      }
      return;
    }

    if (isRotating) {
      const svgMouse = screenToSvg(e.clientX, e.clientY);
      const angle = Math.atan2(
        svgMouse.y - rotationCenter.y,
        svgMouse.x - rotationCenter.x
      ) * (180 / Math.PI) + 90;
      setRotationAngle(angle);
      if (selectedLayer) {
        updateLayer(selectedLayer.id, { rotation: angle });
      }
    }
  }, 16), [isPanning, panStart, dragState, isRotating, rotationCenter, screenToSvg, batchUpdater, allLayers, updateLayer, selectedLayer]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragState(null);
    setIsDraggingHandle(false);
    setIsRotating(false);
  }, []);

  useEffect(() => {
    if (isPanning || dragState || isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, dragState, isRotating, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      batchUpdater.cancel();
    };
  }, [batchUpdater]);

  const handleLayerDoubleClick = useCallback((e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    setEditingLayerId(layerId);
    setPropertyPanelPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleHandleMouseDown = useCallback((position: HandlePosition, e: React.MouseEvent) => {
    if (!selectedLayer) return;
    e.stopPropagation();

    if (e.shiftKey && ['nw', 'ne', 'sw', 'se'].includes(position)) {
      const bbox = getLayerBBox(selectedLayer);
      setIsRotating(true);
      setRotationCenter({
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2,
      });
      const svgMouse = screenToSvg(e.clientX, e.clientY);
      setRotationAngle(
        Math.atan2(
          svgMouse.y - (bbox.y + bbox.height / 2),
          svgMouse.x - (bbox.x + bbox.width / 2)
        ) * (180 / Math.PI) + 90
      );
      return;
    }

    setIsDraggingHandle(true);
    setDragState({
      handle: position,
      startBBox: getLayerBBox(selectedLayer),
      startMouse: screenToSvg(e.clientX, e.clientY),
      layerId: selectedLayer.id,
    });
  }, [selectedLayer, screenToSvg]);

  const editingLayer = editingLayerId
    ? allLayers.find(l => l.id === editingLayerId) || null
    : null;

  const gridSize = 10;
  const gridStrokeWidth = Math.max(0.5, 1 / zoom);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'default',
        background: '#FAFAFA',
      }}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onClick={() => { setEditingLayerId(null); }}
    >
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <pattern
            id="grid-pattern"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${panX} ${panY}) scale(${zoom})`}
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="#E8E8E8"
              strokeWidth={gridStrokeWidth}
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
          {originalImageUrl && (
            <image
              href={originalImageUrl}
              x={0}
              y={0}
              width={800}
              height={600}
              opacity={0.3}
              style={{ pointerEvents: 'none' }}
              preserveAspectRatio="xMidYMid meet"
            />
          )}

          {allLayers.map(layer => {
            const isSelected = layer.id === selectedLayerId;
            const isEditing = layer.id === editingLayerId;
            const showDimmed = selectedLayerId !== null && !isSelected;
            const opacity = showDimmed ? 0.3 : (layer.opacity ?? 1);

            return (
              <g
                key={layer.id}
                data-layer-id={layer.id}
                style={{ cursor: 'pointer' }}
                onDoubleClick={(e) => handleLayerDoubleClick(e, layer.id)}
              >
                <LayerShape
                  layer={layer}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  opacity={opacity}
                />
              </g>
            );
          })}

          {selectedLayer && (() => {
            const bbox = getLayerBBox(selectedLayer);
            return (
              <g transform={selectedLayer.rotation ? `rotate(${selectedLayer.rotation} ${bbox.x + bbox.width / 2} ${bbox.y + bbox.height / 2})` : undefined}>
                <ControlHandles
                  bbox={bbox}
                  zoom={zoom}
                  onHandleMouseDown={handleHandleMouseDown}
                />
              </g>
            );
          })()}
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(0, 191, 255, 0.3)',
          animation: 'fadeIn 0.3s ease',
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#00BFFF',
            fontFamily: 'monospace',
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {editingLayer && (
        <PropertyPanel
          layer={editingLayer}
          screenX={propertyPanelPos.x}
          screenY={propertyPanelPos.y}
          onChange={(updates) => updateLayer(editingLayer.id, updates)}
          onClose={() => setEditingLayerId(null)}
        />
      )}

      {isRotating && (
        <AngleTooltip
          x={rotationCenter.x * zoom + panX}
          y={rotationCenter.y * zoom + panY}
          angle={rotationAngle}
        />
      )}
    </div>
  );
};

export default memo(SvgCanvas);
