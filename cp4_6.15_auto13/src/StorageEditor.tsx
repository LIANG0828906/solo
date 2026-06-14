import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Plus, Upload, Download, Trash2, Box, Archive, LayoutGrid, X, Edit3, GripVertical,
} from 'lucide-react';
import { useStore } from './store';
import { StorageUnit, StorageType, Item, STORAGE_TYPE_LABELS } from './types';
import {
  calculateUtilization, snapToGrid, exportToJSON, importFromJSON, generateId,
} from './utils';

const GRID_SIZE = 5;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

const getBlueByUtilization = (utilization: number): string => {
  const alpha = 0.3 + (utilization / 100) * 0.6;
  return `rgba(74, 144, 217, ${alpha})`;
};

const StorageEditor: React.FC = () => {
  const {
    units, selectedUnitId, addUnit, updateUnit, deleteUnit,
    setSelectedUnitId, importData,
  } = useStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [dragInfo, setDragInfo] = useState<{
    id: string; type: 'move' | 'resize'; startX: number; startY: number;
    origX: number; origY: number; origW: number; origD: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || null;

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .on('zoom', (event) => setTransform(event.transform));
    svg.call(zoom as any);
  }, []);

  const handleUnitMouseDown = useCallback((
    e: React.MouseEvent, unit: StorageUnit, type: 'move' | 'resize',
  ) => {
    e.stopPropagation();
    setSelectedUnitId(unit.id);
    const point = d3.pointer(e, svgRef.current);
    setDragInfo({
      id: unit.id, type,
      startX: point[0], startY: point[1],
      origX: unit.x, origY: unit.y, origW: unit.width, origD: unit.depth,
    });
  }, [setSelectedUnitId]);

  useEffect(() => {
    if (!dragInfo) return;
    const handleMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const point = d3.pointer(e, svgRef.current);
      const dx = (point[0] - dragInfo.startX) / transform.k;
      const dy = (point[1] - dragInfo.startY) / transform.k;
      if (dragInfo.type === 'move') {
        updateUnit(dragInfo.id, {
          x: Math.max(0, snapToGrid(dragInfo.origX + dx, GRID_SIZE)),
          y: Math.max(0, snapToGrid(dragInfo.origY + dy, GRID_SIZE)),
        });
      } else {
        updateUnit(dragInfo.id, {
          width: Math.max(GRID_SIZE * 2, snapToGrid(dragInfo.orig