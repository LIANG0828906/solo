import React, { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Point,
  Wall,
  Door,
  Window,
  Room,
  Dimension,
  Tool,
  ElementType,
  PIXELS_PER_METER
} from './types';
import { CanvasEngine } from './CanvasEngine';
import { DimensionCalculator } from './DimensionCalculator';

const WALL_THICKNESS = 8;
const WALL_COLOR = '#4A5568';
const DOOR_COLOR = '#ED8936';
const WINDOW_COLOR = '#A0AEC0';
const SELECTED_COLOR = '#3182CE';

export const DrawingApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  const [walls, setWalls] = useState<Wall[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);

  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<ElementType | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragElementType, setDragElementType] = useState<'door' | 'window' | null>(null);
  const [dragElementId, setDragElementId] = useState<string | null>(null);

  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  const stateRef = useRef({
    walls,
    doors,
    windows,
    rooms,
    currentTool,
    selectedElementId,
    selectedElementType,
    isDrawing,
    drawingPoints,
    isDraggingElement,
    dragElementType,
    dragElementId
  });

  useEffect(() => {
    stateRef.current = {
      walls,
      doors,
      windows,
      rooms,
      currentTool,
      selectedElementId,
      selectedElementType,
      isDrawing,
      drawingPoints,
      isDraggingElement,
      dragElementType,
      dragElementId
    };
    handleCanvasClickRef.current = handleCanvasClick;
    handleCanvasMouseMoveRef.current = handleCanvasMouseMove;
    handleCanvasMouseDownRef.current = handleCanvasMouseDown;
    handleCanvasMouseUpRef.current = handleCanvasMouseUp;
  });

  const updateDimensions = useCallback((wallList: Wall[], roomList: Room[]) => {
    const dims = DimensionCalculator.calculateDimensionsForWalls(wallList, roomList);
    setDimensions(dims);
    if (engineRef.current) {
      engineRef.current.setDimensions(dims);
    }
  }, []);

  const handleCanvasClickRef = useRef<(point: Point, event: MouseEvent) => void>(() => {});
  const handleCanvasMouseMoveRef = useRef<(point: Point) => void>(() => {});
  const handleCanvasMouseDownRef = useRef<(point: Point) => void>(() => {});
  const handleCanvasMouseUpRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new CanvasEngine({
      canvas: canvasRef.current,
      gridSize: PIXELS_PER_METER,
      minZoom: 0.5,
      maxZoom: 3
    });

    engineRef.current = engine;

    engine.setCallbacks({
      onCanvasClick: (p, e) => handleCanvasClickRef.current(p, e),
      onCanvasMouseMove: (p) => handleCanvasMouseMoveRef.current(p),
      onCanvasMouseDown: (p) => handleCanvasMouseDownRef.current(p),
      onCanvasMouseUp: () => handleCanvasMouseUpRef.current(),
      onZoomChange: (z) => setZoom(z),
      onPanChange: (p) => setPan(p)
    });

    const rect = canvasRef.current.getBoundingClientRect();
    engine.setPan({ x: rect.width / 2 - 300, y: rect.height / 2 - 200 });

    return () => {
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setWalls(walls);
      engineRef.current.setDoors(doors);
      engineRef.current.setWindows(windows);
      engineRef.current.setRooms(rooms);
      engineRef.current.setDimensions(dimensions);
      engineRef.current.render();
    }
  }, [walls, doors, windows, rooms, dimensions]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedElement(selectedElementId, selectedElementType);
      engineRef.current.render();
    }
  }, [selectedElementId, selectedElementType]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCurrentTool(currentTool);
      engineRef.current.setDrawingState(isDrawing, drawingPoints);
      engineRef.current.render();
    }
  }, [currentTool, isDrawing, drawingPoints]);

  const handleCanvasClick = useCallback((point: Point, event: MouseEvent) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (currentTool === 'select') {
      const door = engine.findDoorAtPoint(point);
      if (door) {
        setSelectedElementId(door.id);
        setSelectedElementType('door');
        return;
      }

      const win = engine.findWindowAtPoint(point);
      if (win) {
        setSelectedElementId(win.id);
        setSelectedElementType('window');
        return;
      }

      const wall = engine.findWallAtPoint(point);
      if (wall) {
        setSelectedElementId(wall.id);
        setSelectedElementType('wall');
        return;
      }

      setSelectedElementId(null);
      setSelectedElementType(null);
    }

    if (currentTool === 'room') {
      const snappedPoint = engine.snapToGrid(point);

      if (!isDrawing) {
        setIsDrawing(true);
        setDrawingPoints([snappedPoint]);
      } else {
        const newPoints = [...drawingPoints, snappedPoint];
        setDrawingPoints(newPoints);

        if (newPoints.length >= 4) {
          createRoom(newPoints);
          setIsDrawing(false);
          setDrawingPoints([]);
        }
      }
    }

    if (currentTool === 'door' && selectedElementType === 'wall' && selectedElementId) {
      addDoorToWall(selectedElementId, point);
    }

    if (currentTool === 'window' && selectedElementType === 'wall' && selectedElementId) {
      addWindowToWall(selectedElementId, point);
    }
  }, [currentTool, isDrawing, drawingPoints, selectedElementId, selectedElementType]);

  const handleCanvasMouseMove = useCallback((point: Point) => {
    setMousePos(point);

    if (isDraggingElement && dragElementId && dragElementType) {
      const engine = engineRef.current;
      if (!engine) return;

      const wall = walls.find(w => {
        if (dragElementType === 'door') {
          const door = doors.find(d => d.id === dragElementId);
          return door ? w.id === door.wallId : false;
        } else {
          const win = windows.find(wi => wi.id === dragElementId);
          return win ? w.id === win.wallId : false;
        }
      });

      if (!wall) return;

      const position = DimensionCalculator.getPositionAlongWall(wall, point);

      if (dragElementType === 'door') {
        setDoors(prev => prev.map(d =>
          d.id === dragElementId ? { ...d, position } : d
        ));
      } else {
        setWindows(prev => prev.map(w =>
          w.id === dragElementId ? { ...w, position } : w
        ));
      }
    }

    if (isDrawing && engineRef.current) {
      engineRef.current.render();
    }
  }, [isDraggingElement, dragElementId, dragElementType, walls, doors, windows, isDrawing]);

  const handleCanvasMouseDown = useCallback((point: Point) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (currentTool === 'select') {
      const door = engine.findDoorAtPoint(point);
      if (door) {
        setIsDraggingElement(true);
        setDragElementType('door');
        setDragElementId(door.id);
        setSelectedElementId(door.id);
        setSelectedElementType('door');
        return;
      }

      const win = engine.findWindowAtPoint(point);
      if (win) {
        setIsDraggingElement(true);
        setDragElementType('window');
        setDragElementId(win.id);
        setSelectedElementId(win.id);
        setSelectedElementType('window');
        return;
      }
    }
  }, [currentTool]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingElement(false);
    setDragElementId(null);
    setDragElementType(null);
  }, []);

  const createRoom = (points: Point[]) => {
    const roomId = uuidv4();
    const wallIds: string[] = [];
    const newWalls: Wall[] = [];

    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];
      const wallId = uuidv4();
      wallIds.push(wallId);
      newWalls.push({
        id: wallId,
        start,
        end,
        thickness: WALL_THICKNESS,
        color: WALL_COLOR
      });
    }

    const newRoom: Room = {
      id: roomId,
      walls: wallIds,
      points
    };

    const updatedWalls = [...walls, ...newWalls];
    const updatedRooms = [...rooms, newRoom];

    setWalls(updatedWalls);
    setRooms(updatedRooms);

    updateDimensions(updatedWalls, updatedRooms);
  };

  const addDoorToWall = (wallId: string, point: Point) => {
    const wall = walls.find(w => w.id === wallId);
    if (!wall) return;

    const wallLength = DimensionCalculator.calculateWallLength(wall);
    const doorWidth = wallLength * 0.4;
    const position = DimensionCalculator.getPositionAlongWall(wall, point);

    const newDoor: Door = {
      id: uuidv4(),
      wallId,
      position: Math.max(0.1, Math.min(0.9, position)),
      width: doorWidth,
      swingAngle: 90,
      color: DOOR_COLOR
    };

    setDoors([...doors, newDoor]);
    setSelectedElementId(newDoor.id);
    setSelectedElementType('door');
    setCurrentTool('select');
  };

  const addWindowToWall = (wallId: string, point: Point) => {
    const wall = walls.find(w => w.id === wallId);
    if (!wall) return;

    const wallLength = DimensionCalculator.calculateWallLength(wall);
    const windowWidth = wallLength * 0.4;
    const position = DimensionCalculator.getPositionAlongWall(wall, point);

    const newWindow: Window = {
      id: uuidv4(),
      wallId,
      position: Math.max(0.1, Math.min(0.9, position)),
      width: windowWidth,
      height: 20,
      color: WINDOW_COLOR
    };

    setWindows([...windows, newWindow]);
    setSelectedElementId(newWindow.id);
    setSelectedElementType('window');
    setCurrentTool('select');
  };

  const deleteSelected = () => {
    if (!selectedElementId || !selectedElementType) return;

    if (selectedElementType === 'wall') {
      const roomIdsToRemove = rooms.filter(r => r.walls.includes(selectedElementId)).map(r => r.id);
      
      setRooms(prev => prev.filter(r => !roomIdsToRemove.includes(r.id)));
      setWalls(prev => prev.filter(w => w.id !== selectedElementId));
      setDoors(prev => prev.filter(d => d.wallId !== selectedElementId));
      setWindows(prev => prev.filter(w => w.wallId !== selectedElementId));
      
      const remainingWalls = walls.filter(w => w.id !== selectedElementId);
      const remainingRooms = rooms.filter(r => !roomIdsToRemove.includes(r.id));
      updateDimensions(remainingWalls, remainingRooms);
    } else if (selectedElementType === 'door') {
      setDoors(prev => prev.filter(d => d.id !== selectedElementId));
    } else if (selectedElementType === 'window') {
      setWindows(prev => prev.filter(w => w.id !== selectedElementId));
    }

    setSelectedElementId(null);
    setSelectedElementType(null);
  };

  const updateDoorProperty = (id: string, property: keyof Door, value: number) => {
    setDoors(prev => prev.map(d =>
      d.id === id ? { ...d, [property]: value } : d
    ));
  };

  const updateWindowProperty = (id: string, property: keyof Window, value: number) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, [property]: value } : w
    ));
  };

  const getSelectedElementInfo = () => {
    if (!selectedElementId || !selectedElementType) return null;

    if (selectedElementType === 'wall') {
      const wall = walls.find(w => w.id === selectedElementId);
      if (!wall) return null;
      const length = DimensionCalculator.calculateWallLength(wall);
      return {
        type: '墙体',
        name: `墙体 ${walls.indexOf(wall) + 1}`,
        properties: [
          { label: '长度', value: DimensionCalculator.formatDimension(length) },
          { label: '厚度', value: `${wall.thickness}px` }
        ]
      };
    }

    if (selectedElementType === 'door') {
      const door = doors.find(d => d.id === selectedElementId);
      if (!door) return null;
      return {
        type: '门',
        name: `门 ${doors.indexOf(door) + 1}`,
        properties: [
          { label: '宽度', value: `${(door.width / PIXELS_PER_METER).toFixed(1)}m`, editable: true, property: 'width', min: 20, max: 150, step: 5 },
          { label: '开启角度', value: `${door.swingAngle}°`, editable: true, property: 'swingAngle', min: 30, max: 180, step: 5 }
        ],
        element: door
      };
    }

    if (selectedElementType === 'window') {
      const win = windows.find(w => w.id === selectedElementId);
      if (!win) return null;
      return {
        type: '窗户',
        name: `窗户 ${windows.indexOf(win) + 1}`,
        properties: [
          { label: '宽度', value: `${(win.width / PIXELS_PER_METER).toFixed(1)}m`, editable: true, property: 'width', min: 20, max: 200, step: 5 },
          { label: '高度', value: `${win.height}px`, editable: true, property: 'height', min: 10, max: 50, step: 2 }
        ],
        element: win
      };
    }

    return null;
  };

  const selectedInfo = getSelectedElementInfo();
  const mousePosMeters = {
    x: (mousePos.x / PIXELS_PER_METER).toFixed(1),
    y: (mousePos.y / PIXELS_PER_METER).toFixed(1)
  };

  const selectElement = (id: string, type: ElementType) => {
    setSelectedElementId(id);
    setSelectedElementType(type);
  };

  const ToolButton: React.FC<{
    tool: Tool;
    icon: string;
    label: string;
    disabled?: boolean;
  }> = ({ tool, icon, label, disabled }) => (
    <button
      className={`tool-button ${currentTool === tool ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && setCurrentTool(tool)}
      disabled={disabled}
      title={disabled ? '请先选择一面墙体' : label}
    >
      <span className="tool-icon">{icon}</span>
      <span className="tool-label">{label}</span>
    </button>
  );

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="toolbar-header">
          <h1 className="toolbar-title">建筑绘图工具</h1>
        </div>

        <div className="toolbar-section">
          <h2 className="section-title">绘图工具</h2>
          <div className="tool-buttons">
            <ToolButton tool="select" icon="↖" label="选择" />
            <ToolButton tool="room" icon="▢" label="房间" />
            <ToolButton
              tool="door"
              icon="🚪"
              label="门"
              disabled={!(selectedElementType === 'wall')}
            />
            <ToolButton
              tool="window"
              icon="▭"
              label="窗户"
              disabled={!(selectedElementType === 'wall')}
            />
          </div>
        </div>

        <div className="toolbar-section">
          <h2 className="section-title">图层面板</h2>
          <div className="layers-panel">
            <div className="layer-group">
              <h3 className="layer-group-title">墙体 ({walls.length})</h3>
              <div className="layer-items">
                {walls.map((wall, index) => (
                  <div
                    key={wall.id}
                    className={`layer-item ${selectedElementId === wall.id ? 'selected' : ''}`}
                    onClick={() => selectElement(wall.id, 'wall')}
                  >
                    <span className="layer-icon" style={{ backgroundColor: selectedElementId === wall.id ? SELECTED_COLOR : WALL_COLOR }}></span>
                    <span className="layer-name">墙体 {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="layer-group">
              <h3 className="layer-group-title">门 ({doors.length})</h3>
              <div className="layer-items">
                {doors.map((door, index) => (
                  <div
                    key={door.id}
                    className={`layer-item ${selectedElementId === door.id ? 'selected' : ''}`}
                    onClick={() => selectElement(door.id, 'door')}
                  >
                    <span className="layer-icon" style={{ backgroundColor: selectedElementId === door.id ? SELECTED_COLOR : DOOR_COLOR }}></span>
                    <span className="layer-name">门 {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="layer-group">
              <h3 className="layer-group-title">窗户 ({windows.length})</h3>
              <div className="layer-items">
                {windows.map((win, index) => (
                  <div
                    key={win.id}
                    className={`layer-item ${selectedElementId === win.id ? 'selected' : ''}`}
                    onClick={() => selectElement(win.id, 'window')}
                  >
                    <span className="layer-icon" style={{ backgroundColor: selectedElementId === win.id ? SELECTED_COLOR : WINDOW_COLOR }}></span>
                    <span className="layer-name">窗户 {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {selectedInfo && (
          <div className="toolbar-section">
            <h2 className="section-title">属性编辑</h2>
            <div className="properties-panel">
              <div className="property-row">
                <span className="property-label">类型</span>
                <span className="property-value">{selectedInfo.type}</span>
              </div>
              <div className="property-row">
                <span className="property-label">名称</span>
                <span className="property-value">{selectedInfo.name}</span>
              </div>
              {selectedInfo.properties.map((prop: any, index: number) => (
                <div key={index} className="property-row">
                  <span className="property-label">{prop.label}</span>
                  {prop.editable && selectedElementType && selectedElementId && selectedInfo.element ? (
                    <input
                      type="range"
                      min={prop.min}
                      max={prop.max}
                      step={prop.step}
                      value={(selectedInfo.element as any)[prop.property]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (selectedElementType === 'door') {
                          updateDoorProperty(selectedElementId, prop.property as keyof Door, value);
                        } else if (selectedElementType === 'window') {
                          updateWindowProperty(selectedElementId, prop.property as keyof Window, value);
                        }
                      }}
                      className="property-slider"
                    />
                  ) : (
                    <span className="property-value">{prop.value}</span>
                  )}
                </div>
              ))}
              <button className="delete-button" onClick={deleteSelected}>
                🗑 删除选中
              </button>
            </div>
          </div>
        )}

        <div className="toolbar-section hint-section">
          <h2 className="section-title">操作提示</h2>
          <div className="hints">
            <p>• 滚轮：缩放画布</p>
            <p>• 空格+拖拽：平移画布</p>
            <p>• 房间工具：点击四点绘制</p>
            <p>• 门窗：先选墙再添加</p>
          </div>
        </div>
      </div>

      <div className="drawing-area">
        <canvas ref={canvasRef} className="drawing-canvas" />

        <div className="zoom-indicator">
          {(zoom * 100).toFixed(0)}%
        </div>

        <div className="coordinate-indicator">
          X: {mousePosMeters.x}m, Y: {mousePosMeters.y}m
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setShowMobileToolbar(!showMobileToolbar)}
        >
          ☰
        </button>

        {showMobileToolbar && (
          <div className="mobile-toolbar-overlay" onClick={() => setShowMobileToolbar(false)}>
            <div className="mobile-toolbar" onClick={(e) => e.stopPropagation()}>
              <button className="mobile-close" onClick={() => setShowMobileToolbar(false)}>✕</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .app-container {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        .toolbar {
          width: 240px;
          background: #2D3748;
          color: #E2E8F0;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          flex-shrink: 0;
          border-radius: 8px 0 0 8px;
        }

        .toolbar-header {
          padding: 16px;
          border-bottom: 1px solid #4A5568;
        }

        .toolbar-title {
          font-size: 16px;
          font-weight: 600;
          color: #F7FAFC;
        }

        .toolbar-section {
          padding: 12px;
          border-bottom: 1px solid #4A5568;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #A0AEC0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .tool-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .tool-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: #E2E8F0;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
        }

        .tool-button:hover:not(.disabled) {
          background: #4A5568;
        }

        .tool-button.active {
          background: #3182CE;
          border-color: #4299E1;
        }

        .tool-button.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tool-icon {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .tool-label {
          font-size: 12px;
        }

        .layers-panel {
          max-height: 180px;
          overflow-y: auto;
        }

        .layer-group {
          margin-bottom: 8px;
        }

        .layer-group-title {
          font-size: 11px;
          color: #718096;
          margin-bottom: 4px;
          padding-left: 4px;
        }

        .layer-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .layer-item {
          display: flex;
          align-items: center;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .layer-item:hover {
          background: #4A5568;
        }

        .layer-item.selected {
          background: rgba(49, 130, 206, 0.2);
        }

        .layer-icon {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          margin-right: 8px;
        }

        .layer-name {
          font-size: 13px;
          color: #E2E8F0;
        }

        .properties-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .property-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .property-label {
          font-size: 11px;
          color: #A0AEC0;
        }

        .property-value {
          font-size: 13px;
          color: #F7FAFC;
          font-family: monospace;
        }

        .property-slider {
          width: 100%;
          cursor: pointer;
        }

        .delete-button {
          width: 100%;
          padding: 8px;
          background: #C53030;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s ease;
          margin-top: 8px;
        }

        .delete-button:hover {
          background: #E53E3E;
        }

        .hint-section {
          margin-top: auto;
        }

        .hints {
          font-size: 11px;
          color: #A0AEC0;
          line-height: 1.6;
        }

        .hints p {
          margin-bottom: 2px;
        }

        .drawing-area {
          flex: 1;
          position: relative;
          background: #F8F9FA;
          overflow: hidden;
        }

        .drawing-canvas {
          width: 100%;
          height: 100%;
          display: block;
        }

        .zoom-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #FFFFFF;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          color: #2D3748;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .coordinate-indicator {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.8);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          color: #4A5568;
          font-family: monospace;
        }

        .mobile-menu-toggle {
          display: none;
          position: absolute;
          top: 12px;
          left: 12px;
          background: #2D3748;
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 6px;
          font-size: 20px;
          cursor: pointer;
          z-index: 10;
        }

        .mobile-toolbar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 100;
        }

        .mobile-toolbar {
          position: absolute;
          top: 0;
          left: 0;
          width: 240px;
          height: 100%;
          background: #2D3748;
        }

        .mobile-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: #E2E8F0;
          font-size: 20px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }

          .toolbar {
            display: none;
          }

          .mobile-menu-toggle {
            display: block;
          }

          .mobile-toolbar-overlay.active {
            display: block;
          }

          .mobile-toolbar-overlay {
            display: block;
          }

          .drawing-area {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
