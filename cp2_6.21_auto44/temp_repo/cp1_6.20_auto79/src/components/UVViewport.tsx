import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { ModelData, SelectionState, UIParams, DragInfo } from '../types';
import { getAdjacentFaces, validateTriangles, calculateTriangleAreaUV } from '../utils/uvUnwrapper';

interface UVViewportProps {
  modelData: ModelData | null;
  selection: SelectionState;
  uiParams: UIParams;
  onFaceClick: (faceIndex: number, isMultiSelect: boolean) => void;
  onVertexDragEnd: (vertexIndex: number, newU: number, newV: number) => void;
  onValidationChange?: (valid: boolean, message: string) => void;
}

export const UVViewport: React.FC<UVViewportProps> = ({
  modelData,
  selection,
  uiParams,
  onFaceClick,
  onVertexDragEnd,
  onValidationChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [hoveredVertex, setHoveredVertex] = useState<number | null>(null);
  const animationRef = useRef<number>();
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  const getCanvasCoords = useCallback((uvU: number, uvV: number, width: number, height: number) => {
    const padding = 20;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const size = Math.min(usableWidth, usableHeight);
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;
    return {
      x: offsetX + uvU * size,
      y: offsetY + (1 - uvV) * size,
    };
  }, []);

  const getUVCoords = useCallback((canvasX: number, canvasY: number, width: number, height: number) => {
    const padding = 20;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const size = Math.min(usableWidth, usableHeight);
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;
    return {
      u: Math.max(0, Math.min(1, (canvasX - offsetX) / size)),
      v: Math.max(0, Math.min(1, 1 - (canvasY - offsetY) / size)),
    };
  }, []);

  const drawCheckerboard = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const padding = 20;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const size = Math.min(usableWidth, usableHeight);
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;

    const density = uiParams.checkerboardDensity;
    const cellSize = size / density;

    for (let row = 0; row < density; row++) {
      for (let col = 0; col < density; col++) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? '#3a3a5e' : '#2a2a4e';
        ctx.fillRect(
          offsetX + col * cellSize,
          offsetY + row * cellSize,
          cellSize,
          cellSize
        );
      }
    }

    ctx.strokeStyle = '#555588';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, size, size);
  }, [uiParams.checkerboardDensity]);

  const drawFaces = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!modelData) return;

    const selectedSet = new Set(selection.selectedFaceIndices);
    const adjacentSet = new Set<number>();

    if (dragInfo) {
      dragInfo.adjacentFaces.forEach(f => adjacentSet.add(f));
    }
    if (hoveredVertex !== null && modelData) {
      getAdjacentFaces(hoveredVertex, modelData.faces).forEach(f => adjacentSet.add(f));
    }

    modelData.faces.forEach((face, index) => {
      const isSelected = selectedSet.has(index);
      const isAdjacent = adjacentSet.has(index);

      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const uv = modelData.uvs[face.uvIndices[i]];
        const pos = getCanvasCoords(uv.u, uv.v, width, height);
        if (i === 0) {
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      }
      ctx.closePath();

      if (isSelected) {
        ctx.fillStyle = face.color;
        ctx.globalAlpha = 1;
      } else if (isAdjacent) {
        ctx.fillStyle = face.color;
        ctx.globalAlpha = 0.85;
      } else {
        ctx.fillStyle = face.color;
        ctx.globalAlpha = 0.6;
      }

      ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.lineWidth = uiParams.borderWidth;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';

    modelData.faces.forEach((face) => {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const uv = modelData.uvs[face.uvIndices[i]];
        const pos = getCanvasCoords(uv.u, uv.v, width, height);
        if (i === 0) {
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    });

    selection.selectedFaceIndices.forEach((faceIndex) => {
      const face = modelData.faces[faceIndex];
      if (!face) return;

      ctx.save();

      const centerU = (modelData.uvs[face.uvIndices[0]].u +
                       modelData.uvs[face.uvIndices[1]].u +
                       modelData.uvs[face.uvIndices[2]].u) / 3;
      const centerV = (modelData.uvs[face.uvIndices[0]].v +
                       modelData.uvs[face.uvIndices[1]].v +
                       modelData.uvs[face.uvIndices[2]].v) / 3;
      const center = getCanvasCoords(centerU, centerV, width, height);

      ctx.translate(center.x, center.y);
      ctx.scale(1.05, 1.05);
      ctx.translate(-center.x, -center.y);

      ctx.shadowColor = '#ff4757';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = uiParams.borderWidth + 1;

      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const uv = modelData.uvs[face.uvIndices[i]];
        const pos = getCanvasCoords(uv.u, uv.v, width, height);
        if (i === 0) {
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    });
  }, [modelData, selection.selectedFaceIndices, dragInfo, hoveredVertex, uiParams.borderWidth, getCanvasCoords]);

  const drawVertices = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!modelData) return;

    const vertexUsed = new Set<number>();
    modelData.faces.forEach((face) => {
      face.uvIndices.forEach((idx) => vertexUsed.add(idx));
    });

    let adjacentVertexSet = new Set<number>();
    if (dragInfo) {
      adjacentVertexSet = new Set([dragInfo.vertexIndex]);
      modelData.faces.forEach((face) => {
        if (dragInfo.adjacentFaces.some(fi => fi === modelData.faces.indexOf(face))) {
          face.uvIndices.forEach(idx => adjacentVertexSet.add(idx));
        }
      });
    }

    vertexUsed.forEach((vertexIndex) => {
      const uv = modelData.uvs[vertexIndex];
      const pos = getCanvasCoords(uv.u, uv.v, width, height);

      const isHovered = hoveredVertex === vertexIndex;
      const isAdjacent = adjacentVertexSet.has(vertexIndex);
      const isDragging = dragInfo?.vertexIndex === vertexIndex;

      let radius = 3;
      let color = 'rgba(255, 255, 255, 0.6)';

      if (isDragging) {
        radius = 8;
        color = '#ff4757';
      } else if (isHovered || isAdjacent) {
        radius = 6;
        color = '#00d4ff';
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isHovered || isDragging || isAdjacent) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }, [modelData, hoveredVertex, dragInfo, getCanvasCoords]);

  const drawDragLines = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!dragInfo || !modelData) return;

    const origPos = getCanvasCoords(dragInfo.originalUV.u, dragInfo.originalUV.v, width, height);
    const currPos = getCanvasCoords(dragInfo.currentUV.u, dragInfo.currentUV.v, width, height);

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.7)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(origPos.x, origPos.y);
    ctx.lineTo(currPos.x, currPos.y);
    ctx.stroke();

    ctx.setLineDash([]);

    const arrowSize = 6;
    const angle = Math.atan2(currPos.y - origPos.y, currPos.x - origPos.x);
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(currPos.x, currPos.y);
    ctx.lineTo(
      currPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
      currPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      currPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
      currPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }, [dragInfo, modelData, getCanvasCoords]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    drawCheckerboard(ctx, width, height);
    drawFaces(ctx, width, height);
    drawDragLines(ctx, width, height);
    drawVertices(ctx, width, height);
  }, [drawCheckerboard, drawFaces, drawDragLines, drawVertices]);

  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        setCanvasSize({ width: size, height: size });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const findVertexAtPoint = useCallback((canvasX: number, canvasY: number): number | null => {
    if (!modelData) return null;

    const threshold = 8;
    let closestIndex: number | null = null;
    let closestDist = Infinity;

    const vertexUsed = new Set<number>();
    modelData.faces.forEach((face) => {
      face.uvIndices.forEach((idx) => vertexUsed.add(idx));
    });

    vertexUsed.forEach((vertexIndex) => {
      const uv = modelData.uvs[vertexIndex];
      const pos = getCanvasCoords(uv.u, uv.v, canvasSize.width, canvasSize.height);
      const dist = Math.sqrt((pos.x - canvasX) ** 2 + (pos.y - canvasY) ** 2);

      if (dist < threshold && dist < closestDist) {
        closestDist = dist;
        closestIndex = vertexIndex;
      }
    });

    return closestIndex;
  }, [modelData, getCanvasCoords, canvasSize]);

  const findFaceAtPoint = useCallback((canvasX: number, canvasY: number): number | null => {
    if (!modelData) return null;

    const uv = getUVCoords(canvasX, canvasY, canvasSize.width, canvasSize.height);

    for (let i = modelData.faces.length - 1; i >= 0; i--) {
      const face = modelData.faces[i];
      const uv0 = modelData.uvs[face.uvIndices[0]];
      const uv1 = modelData.uvs[face.uvIndices[1]];
      const uv2 = modelData.uvs[face.uvIndices[2]];

      if (pointInTriangle(uv.u, uv.v, uv0.u, uv0.v, uv1.u, uv1.v, uv2.u, uv2.v)) {
        return i;
      }
    }

    return null;
  }, [modelData, getUVCoords, canvasSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !modelData) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const vertexIndex = findVertexAtPoint(x, y);

    if (vertexIndex !== null) {
      const originalUV = modelData.uvs[vertexIndex];
      const adjacentFaces = getAdjacentFaces(vertexIndex, modelData.faces);
      setDragInfo({
        vertexIndex,
        originalUV: { ...originalUV },
        currentUV: { ...originalUV },
        adjacentFaces,
      });
    }
  }, [modelData, findVertexAtPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !modelData) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragInfo) {
      const newUV = getUVCoords(x, y, canvasSize.width, canvasSize.height);
      setDragInfo((prev) => prev ? { ...prev, currentUV: newUV } : null);

      const tempUVs = [...modelData.uvs];
      tempUVs[dragInfo.vertexIndex] = newUV;
      const validation = validateTriangles(tempUVs, modelData.faces);
      if (onValidationChange) {
        onValidationChange(validation.valid, validation.message);
      }
    } else {
      const vertex = findVertexAtPoint(x, y);
      setHoveredVertex(vertex);
    }
  }, [modelData, dragInfo, findVertexAtPoint, getUVCoords, canvasSize, onValidationChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !modelData) return;

    if (dragInfo) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newUV = getUVCoords(x, y, canvasSize.width, canvasSize.height);

      const tempUVs = [...modelData.uvs];
      tempUVs[dragInfo.vertexIndex] = newUV;
      const validation = validateTriangles(tempUVs, modelData.faces);

      if (validation.valid) {
        onVertexDragEnd(dragInfo.vertexIndex, newUV.u, newUV.v);
      }

      if (onValidationChange) {
        const finalValidation = validateTriangles(modelData.uvs, modelData.faces);
        onValidationChange(finalValidation.valid, finalValidation.message);
      }

      setDragInfo(null);
    }
  }, [modelData, dragInfo, getUVCoords, canvasSize, onVertexDragEnd, onValidationChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragInfo) return;
    if (!canvasRef.current || !modelData) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const faceIndex = findFaceAtPoint(x, y);
    if (faceIndex !== null) {
      onFaceClick(faceIndex, e.shiftKey);
    }
  }, [modelData, dragInfo, findFaceAtPoint, onFaceClick]);

  const handleMouseLeave = useCallback(() => {
    setHoveredVertex(null);
    if (dragInfo && modelData) {
      setDragInfo(null);
      const validation = validateTriangles(modelData.uvs, modelData.faces);
      if (onValidationChange) {
        onValidationChange(validation.valid, validation.message);
      }
    }
  }, [dragInfo, modelData, onValidationChange]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: dragInfo ? 'grabbing' : hoveredVertex ? 'grab' : 'pointer',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

function pointInTriangle(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number
): boolean {
  const d1 = sign(px, py, x1, y1, x2, y2);
  const d2 = sign(px, py, x2, y2, x3, y3);
  const d3 = sign(px, py, x3, y3, x1, y1);

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(hasNeg && hasPos);
}

function sign(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
}
