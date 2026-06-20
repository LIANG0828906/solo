import { CanvasState, CanvasAction, Shape, Point, ToolType } from './types';
import { v4 as uuidv4 } from 'uuid';

export const initialState: CanvasState = {
  shapes: [],
  selectedIds: [],
  currentTool: 'pen',
  strokeColor: '#424242',
  fillColor: 'rgba(255,255,255,0.3)',
  strokeWidth: 2,
  fontSize: 16,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  isDrawing: false,
  isPanning: false,
  isDragging: false,
  isResizing: false,
  dragStart: null,
  currentShape: null,
  resizeHandle: null,
  isSpacePressed: false
};

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, currentTool: action.payload };
    
    case 'SET_STROKE_COLOR':
      return { ...state, strokeColor: action.payload };
    
    case 'SET_FILL_COLOR':
      return { ...state, fillColor: action.payload };
    
    case 'SET_STROKE_WIDTH':
      return { ...state, strokeWidth: action.payload };
    
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload };
    
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.2, Math.min(5, action.payload)) };
    
    case 'SET_OFFSET':
      return { ...state, offsetX: action.payload.x, offsetY: action.payload.y };
    
    case 'SET_SELECTED_IDS':
      return { ...state, selectedIds: action.payload };
    
    case 'ADD_SHAPE':
      return { ...state, shapes: [...state.shapes, action.payload] };
    
    case 'UPDATE_SHAPE':
      return {
        ...state,
        shapes: state.shapes.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } as Shape : s
        )
      };
    
    case 'DELETE_SHAPES':
      return {
        ...state,
        shapes: state.shapes.filter(s => !action.payload.includes(s.id)),
        selectedIds: state.selectedIds.filter(id => !action.payload.includes(id))
      };
    
    case 'SET_IS_DRAWING':
      return { ...state, isDrawing: action.payload };
    
    case 'SET_IS_PANNING':
      return { ...state, isPanning: action.payload };
    
    case 'SET_IS_DRAGGING':
      return { ...state, isDragging: action.payload };
    
    case 'SET_IS_RESIZING':
      return { ...state, isResizing: action.payload };
    
    case 'SET_DRAG_START':
      return { ...state, dragStart: action.payload };
    
    case 'SET_CURRENT_SHAPE':
      return { ...state, currentShape: action.payload };
    
    case 'SET_RESIZE_HANDLE':
      return { ...state, resizeHandle: action.payload };
    
    case 'SET_SPACE_PRESSED':
      return { ...state, isSpacePressed: action.payload };
    
    case 'ALIGN_SHAPES': {
      const selectedShapes = state.shapes.filter(s => state.selectedIds.includes(s.id));
      if (selectedShapes.length < 2) return state;
      
      let referenceShape: Shape | null = null;
      let referenceValue = 0;
      
      const updatedShapes = [...state.shapes];
      
      switch (action.payload) {
        case 'left': {
          const minX = Math.min(...selectedShapes.map(s => s.x));
          for (const shape of selectedShapes) {
            const idx = updatedShapes.findIndex(s => s.id === shape.id);
            if (idx !== -1) {
              updatedShapes[idx] = { ...updatedShapes[idx], x: minX } as Shape;
            }
          }
          break;
        }
        case 'right': {
          const maxX = Math.max(...selectedShapes.map(s => s.x + s.width));
          for (const shape of selectedShapes) {
            const idx = updatedShapes.findIndex(s => s.id === shape.id);
            if (idx !== -1) {
              updatedShapes[idx] = { ...updatedShapes[idx], x: maxX - shape.width } as Shape;
            }
          }
          break;
        }
        case 'top': {
          const minY = Math.min(...selectedShapes.map(s => s.y));
          for (const shape of selectedShapes) {
            const idx = updatedShapes.findIndex(s => s.id === shape.id);
            if (idx !== -1) {
              updatedShapes[idx] = { ...updatedShapes[idx], y: minY } as Shape;
            }
          }
          break;
        }
        case 'bottom': {
          const maxY = Math.max(...selectedShapes.map(s => s.y + s.height));
          for (const shape of selectedShapes) {
            const idx = updatedShapes.findIndex(s => s.id === shape.id);
            if (idx !== -1) {
              updatedShapes[idx] = { ...updatedShapes[idx], y: maxY - shape.height } as Shape;
            }
          }
          break;
        }
        case 'centerH': {
          const avgCenterX = selectedShapes.reduce((sum, s) => sum + s.x + s.width / 2, 0) / selectedShapes.length;
          for (const shape of selectedShapes) {
            const idx = updatedShapes.findIndex(s => s.id === shape.id);
            if (idx !== -1) {
              updatedShapes[idx] = { ...updatedShapes[idx], x: avgCenterX - shape.width / 2 } as Shape;
            }
          }
          break;
        }
        case 'centerV': {
          const avgCenterY = selectedShapes.reduce((sum, s) => sum + s.y + s.height / 2, 0) / selectedShapes.length;
          for (const shape of selectedShapes) {
            const idx = updatedShapes.findIndex(s => s.id === shape.id);
            if (idx !== -1) {
              updatedShapes[idx] = { ...updatedShapes[idx], y: avgCenterY - shape.height / 2 } as Shape;
            }
          }
          break;
        }
      }
      
      return { ...state, shapes: updatedShapes };
    }
    
    default:
      return state;
  }
}

export function createShape(type: ToolType, x: number, y: number, options: Partial<Shape> = {}): Shape {
  const base = {
    id: uuidv4(),
    x,
    y,
    width: 0,
    height: 0,
    strokeColor: options.strokeColor || '#424242',
    fillColor: options.fillColor || 'rgba(255,255,255,0.3)',
    strokeWidth: options.strokeWidth || 2,
    rotation: 0,
    opacity: 1,
    roughSeed: Math.floor(Math.random() * 100000),
    ...options
  };
  
  switch (type) {
    case 'pen':
      return { ...base, type: 'pen', points: [{ x, y }] } as Shape;
    case 'rectangle':
      return { ...base, type: 'rectangle' } as Shape;
    case 'diamond':
      return { ...base, type: 'diamond' } as Shape;
    case 'arrow':
      return { ...base, type: 'arrow', startX: x, startY: y, endX: x, endY: y } as Shape;
    case 'text':
      return { ...base, type: 'text', text: '', fontSize: options.fontSize || 16, width: 100, height: 24 } as Shape;
    default:
      return { ...base, type: 'pen', points: [{ x, y }] } as Shape;
  }
}
