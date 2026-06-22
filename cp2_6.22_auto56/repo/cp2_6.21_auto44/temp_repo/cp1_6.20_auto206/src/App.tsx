import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import LineChart from './LineChart';
import TrendPanel from './TrendPanel';
import { parseCSV, generateSampleData } from './csvParser';
import type { DataPoint, Annotation, CSVParseResult, TimeRange } from './types';

const COLOR_PALETTE = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

const App: React.FC = () => {
  const [csvData, setCsvData] = useState<CSVParseResult | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(0);
  const [maWindow, setMaWindow] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timeRange = useMemo((): TimeRange => {
    if (!csvData || csvData.data.length < 2) {
      return { start: Date.now() - 86400000, end: Date.now() };
    }
    return {
      start: csvData.data[0].timestamp,
      end: csvData.data[csvData.data.length - 1].timestamp,
    };
  }, [csvData]);

  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRange);

  useEffect(() => {
    setSelectedTimeRange(timeRange);
  }, [timeRange]);

  useEffect(() => {
    const sample = generateSampleData();
    setCsvData(sample);
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
    setShakeKey(prev => prev + 1);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text);
      
      if (result.error) {
        showError(result.error);
        setCsvData(null);
        setAnnotations([]);
        setSelectedColumnIndex(0);
        setHiddenColumns(new Set());
      } else {
        setError(null);
        setCsvData(result);
        setAnnotations([]);
        setSelectedColumnIndex(0);
        setHiddenColumns(new Set());
      }
    };
    reader.onerror = () => {
      showError('读取文件失败');
    };
    reader.readAsText(file);
  }, [showError]);

  const handleUploadAreaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else if (file) {
      showError('请上传CSV格式的文件');
    }
  }, [handleFileUpload, showError]);

  const handleAddAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  }, []);

  const handleUpdateAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations(prev => prev.map(a => 
      a.id === annotation.id ? annotation : a
    ));
  }, []);

  const toggleColumnVisibility = useCallback((colIdx: number) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(colIdx)) {
        next.delete(colIdx);
      } else {
        next.add(colIdx);
      }
      return next;
    });
  }, []);

  const filteredForTrend = useMemo(() => {
    if (!csvData) return [];
    return csvData.data.filter(
      d => d.timestamp >= selectedTimeRange.start && d.timestamp <= selectedTimeRange.end
    );
  }, [csvData, selectedTimeRange]);

  const regressionResult = useMemo(() => {
    if (filteredForTrend.length < 2) {
      return { slope: 0, intercept: 0, rSquared: 0, startValue: 0, endValue: 0 };
    }

    const values = filteredForTrend.map(d => d.values[selectedColumnIndex]);
    const n = values.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
      sumY2 += values[i] * values[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const ssTotal = sumY2 - (sumY * sumY) / n;
    let ssResidual = 0;
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * i;
      ssResidual += (values[i] - predicted) * (values[i] - predicted);
    }
    const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

    return {
      slope,
      intercept,
      rSquared,
      startValue: intercept,
      endValue: intercept + slope * (n - 1),
    };
  }, [filteredForTrend, selectedColumnIndex]);

  const movingAverageData = useMemo(() => {
    if (!csvData || csvData.data.length < maWindow) return [];

    const values = csvData.data.map(d => ({
      timestamp: d.timestamp,
      value: d.values[selectedColumnIndex],
    }));

    const result: { timestamp: number; value: number }[] = [];

    for (let i = maWindow - 1; i < values.length; i++) {
      let sum = 0;
      for (let j = 0; j < maWindow; j++) {
        sum += values[i - j].value;
      }
      result.push({
        timestamp: values[i].timestamp,
        value: sum / maWindow,
      });
    }

    return result;
  }, [csvData, selectedColumnIndex, maWindow]);

  const dataColumns = csvData ? csvData.columns.slice(1) : [];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">折线图数据标注与趋势分析工具</h1>
        <div className="legend-container">
          {dataColumns.map((col, idx) => (
            <div
              key={col}
              className="legend-item"
              onClick={() => toggleColumnVisibility(idx)}
              style={{
                opacity: hiddenColumns.has(idx) ? 0.4 : 1,
              }}
              title="点击切换显示/隐藏"
            >
              <span
                className="legend-color"
                style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
              />
              <span>{col}</span>
            </div>
          ))}
        </div>
      </header>

      <div
        className="upload-area"
        onClick={handleUploadAreaClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19a4.5 4.5 0 1 0-1.3-8.81 6 6 0 0 0-11.6 1.52 3.5 3.5 0 0 0 .5 6.93" />
          <path d="M12 12v6" />
          <path d="m9 15 3-3 3 3" />
        </svg>
        <span className="upload-text">拖拽或点击上传CSV</span>
        <span className="upload-hint">支持最多10列数据</span>
      </div>

      {error && (
        <div key={shakeKey} className="error-message">
          {error}
        </div>
      )}

      <div className="main-content">
        <div className="chart-section">
          {csvData && csvData.data.length > 0 && (
            <LineChart
              data={csvData.data}
              columns={csvData.columns}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              colorPalette={COLOR_PALETTE}
              hiddenColumns={hiddenColumns}
              timeRange={timeRange}
              showTrendLine={true}
              selectedTimeRange={selectedTimeRange}
              regressionStartValue={regressionResult.startValue}
              regressionEndValue={regressionResult.endValue}
              movingAverageData={movingAverageData}
              selectedColumnIndex={selectedColumnIndex}
              maWindow={maWindow}
            />
          )}
          {!csvData && !error && (
            <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#666' }}>请上传CSV文件以查看图表</span>
            </div>
          )}
        </div>

        {csvData && csvData.data.length > 0 && (
          <TrendPanel
            data={csvData.data}
            columns={csvData.columns}
            timeRange={selectedTimeRange}
            onTimeRangeChange={setSelectedTimeRange}
            selectedColumnIndex={selectedColumnIndex}
            onColumnSelect={setSelectedColumnIndex}
            maWindow={maWindow}
            onMaWindowChange={setMaWindow}
            colorPalette={COLOR_PALETTE}
            regressionResult={regressionResult}
            movingAverageData={movingAverageData}
          />
        )}
      </div>
    </div>
  );
};

export default App;
