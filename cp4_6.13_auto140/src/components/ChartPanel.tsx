import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ParsedCSVData, ChartConfig, LineVisibility, TurningPoint, TrendLine } from '../types';
import { SATURATED_COLORS } from '../types';
import { 
  calculateDimensions, 
  drawChart, 
  handleLegendClick,
  detectTurningPoints,
  calculateTrendLine
} from '../utils/chartEngine';

interface ChartPanelProps {
  data: ParsedCSVData;
  onGenerate: (config: ChartConfig, turningPoints: TurningPoint[], trendLines: TrendLine[]) => void;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ data, onGenerate }) => {
  const [xField, setXField] = useState<string>('');
  const [yFields, setYFields] = useState<string[]>([]);
  const [fieldColors, setFieldColors] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<LineVisibility>({});
  const [showChart, setShowChart] = useState(false);
  const [config, setConfig] = useState<ChartConfig | null>(null);
  const [turningPoints, setTurningPoints] = useState<TurningPoint[]>([]);
  const [trendLines, setTrendLines] = useState<TrendLine[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const timeFields = data.headers.filter(h => h.type === 'time').map(h => h.name);
  const numericFields = data.headers.filter(h => h.type === 'numeric').map(h => h.name);

  useEffect(() => {
    if (timeFields.length > 0 && !xField) {
      setXField(timeFields[0]);
    }
  }, [timeFields, xField]);

  useEffect(() => {
    const colors: Record<string, string> = {};
    data.headers.forEach((header, index) => {
      colors[header.name] = SATURATED_COLORS[index % SATURATED_COLORS.length];
    });
    setFieldColors(colors);
  }, [data.headers]);

  const handleYFieldToggle = useCallback((field: string) => {
    setYFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else if (prev.length < 3) {
        return [...prev, field];
      }
      return prev;
    });
  }, []);

  const toggleLineVisibility = useCallback((field: string) => {
    setVisibility(prev => ({
      ...prev,
      [