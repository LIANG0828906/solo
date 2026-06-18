import { Shape, ChatMessage, User, generateMessageId, appStore } from '../store';

const COLOR_NAMES: Record<string, string> = {
  '#E74C3C': '红色',
  '#3498DB': '蓝色',
  '#2ECC71': '绿色',
  '#F1C40F': '黄色',
  '#9B59B6': '紫色',
  '#E67E22': '橙色',
  '#1ABC9C': '青色',
  '#34495E': '深灰色',
};

const SHAPE_TYPE_NAMES: Record<string, string> = {
  pen: '自由笔迹',
  rectangle: '矩形',
  circle: '圆形',
  sticky: '便签',
};

export function getColorName(color: string): string {
  return COLOR_NAMES[color] || color;
}

export function getShapeTypeName(type: string): string {
  return SHAPE_TYPE_NAMES[type] || type;
}

export function getShapePosition(shape: Shape): { x: number; y: number } {
  switch (shape.type) {
    case 'pen':
      if (shape.points.length > 0) {
        return { x: Math.round(shape.points[0].x), y: Math.round(shape.points[0].y) };
      }
      return { x: 0, y: 0 };
    case 'rectangle':
      return { x: Math.round(shape.x), y: Math.round(shape.y) };
    case 'circle':
      return { x: Math.round(shape.x), y: Math.round(shape.y) };
    case 'sticky':
      return { x: Math.round(shape.x), y: Math.round(shape.y) };
    default:
      return { x: 0, y: 0 };
  }
}

export function formatAddNotification(shape: Shape, user: User): ChatMessage {
  const pos = getShapePosition(shape);
  const colorName = getColorName(shape.color);
  const shapeTypeName = getShapeTypeName(shape.type);
  const content = `添加了一个${colorName}${shapeTypeName} (坐标 x:${pos.x}, y:${pos.y})`;

  return {
    id: generateMessageId(),
    type: 'notification',
    userId: user.id,
    content,
    timestamp: Date.now(),
    shapeInfo: {
      shapeType: shape.type,
      color: shape.color,
      x: pos.x,
      y: pos.y,
      shapeName: shapeTypeName,
    },
  };
}

export function formatMoveNotification(shape: Shape, user: User): ChatMessage {
  const pos = getShapePosition(shape);
  const colorName = getColorName(shape.color);
  const shapeTypeName = getShapeTypeName(shape.type);
  const content = `移动了${colorName}${shapeTypeName}到 (x:${pos.x}, y:${pos.y})`;

  return {
    id: generateMessageId(),
    type: 'notification',
    userId: user.id,
    content,
    timestamp: Date.now(),
    shapeInfo: {
      shapeType: shape.type,
      color: shape.color,
      x: pos.x,
      y: pos.y,
      shapeName: shapeTypeName,
    },
  };
}

export function formatDeleteNotification(shape: Shape, user: User): ChatMessage {
  const colorName = getColorName(shape.color);
  const shapeTypeName = getShapeTypeName(shape.type);
  const content = `删除了一个${colorName}${shapeTypeName}`;

  return {
    id: generateMessageId(),
    type: 'notification',
    userId: user.id,
    content,
    timestamp: Date.now(),
    shapeInfo: {
      shapeType: shape.type,
      color: shape.color,
      x: 0,
      y: 0,
      shapeName: shapeTypeName,
    },
  };
}

export function processShapeAdd(shape: Shape): void {
  const user = appStore.users.find((u) => u.id === shape.createdBy);
  if (user) {
    const message = formatAddNotification(shape, user);
    appStore.addMessage(message);
  }
}

export function processShapeMove(shape: Shape): void {
  const user = appStore.users.find((u) => u.id === shape.createdBy);
  if (user) {
    const message = formatMoveNotification(shape, user);
    appStore.addMessage(message);
  }
}

export function processShapeDelete(shape: Shape): void {
  const user = appStore.users.find((u) => u.id === shape.createdBy);
  if (user) {
    const message = formatDeleteNotification(shape, user);
    appStore.addMessage(message);
  }
}
