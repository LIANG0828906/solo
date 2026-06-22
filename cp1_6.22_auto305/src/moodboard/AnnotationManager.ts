import type { ArrowAnnotation } from '../types';

const generateId = (): string => {
  return `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const DEFAULT_COLOR = '#ff6b6b';
const DEFAULT_LINE_WIDTH = 2;

export class AnnotationManager {
  createAnnotation(
    startX: number,
    startY: number,
    maxZ: number = 0
  ): ArrowAnnotation {
    return {
      id: generateId(),
      startX,
      startY,
      endX: startX + 80,
      endY: startY + 50,
      color: DEFAULT_COLOR,
      lineWidth: DEFAULT_LINE_WIDTH,
      zIndex: maxZ + 1,
    };
  }

  updateEndpoint(
    annotation: ArrowAnnotation,
    point: 'start' | 'end',
    x: number,
    y: number
  ): ArrowAnnotation {
    if (point === 'start') {
      return {
        ...annotation,
        startX: x,
        startY: y,
      };
    } else {
      return {
        ...annotation,
        endX: x,
        endY: y,
      };
    }
  }

  moveAnnotation(
    annotation: ArrowAnnotation,
    deltaX: number,
    deltaY: number
  ): ArrowAnnotation {
    return {
      ...annotation,
      startX: annotation.startX + deltaX,
      startY: annotation.startY + deltaY,
      endX: annotation.endX + deltaX,
      endY: annotation.endY + deltaY,
    };
  }

  getHitTest(
    annotation: ArrowAnnotation,
    x: number,
    y: number,
    threshold: number = 10
  ): 'body' | 'start' | 'end' | null {
    const startDist = Math.sqrt(
      Math.pow(x - annotation.startX, 2) + Math.pow(y - annotation.startY, 2)
    );
    const endDist = Math.sqrt(
      Math.pow(x - annotation.endX, 2) + Math.pow(y - annotation.endY, 2)
    );

    if (startDist < threshold) return 'start';
    if (endDist < threshold) return 'end';

    const lineLength = Math.sqrt(
      Math.pow(annotation.endX - annotation.startX, 2) +
        Math.pow(annotation.endY - annotation.startY, 2)
    );

    if (lineLength === 0) return null;

    const t =
      ((x - annotation.startX) * (annotation.endX - annotation.startX) +
        (y - annotation.startY) * (annotation.endY - annotation.startY)) /
      (lineLength * lineLength);

    if (t < 0 || t > 1) return null;

    const closestX =
      annotation.startX + t * (annotation.endX - annotation.startX);
    const closestY =
      annotation.startY + t * (annotation.endY - annotation.startY);

    const distToLine = Math.sqrt(
      Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2)
    );

    return distToLine < threshold ? 'body' : null;
  }

  getArrowPoints(
    annotation: ArrowAnnotation,
    arrowSize: number = 12
  ): { x1: number; y1: number; x2: number; y2: number } {
    const angle = Math.atan2(
      annotation.endY - annotation.startY,
      annotation.endX - annotation.startX
    );
    const arrowAngle = Math.PI / 6;

    return {
      x1: annotation.endX - arrowSize * Math.cos(angle - arrowAngle),
      y1: annotation.endY - arrowSize * Math.sin(angle - arrowAngle),
      x2: annotation.endX - arrowSize * Math.cos(angle + arrowAngle),
      y2: annotation.endY - arrowSize * Math.sin(angle + arrowAngle),
    };
  }
}
