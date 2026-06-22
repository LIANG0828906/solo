import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Activity } from 'lucide-react';
import Scene3D from '@/components/Scene3D';
import ControlPanel, { TimeRange, AnimationSpeed } from '@/components/ControlPanel';
import {
  HeatmapPoint,
  TrafficDataResponse,
  processTrafficData,
  getCongestionLevel,
  getAnimationFrameData
} from '@/utils/dataProcessor';

export default function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [historicalHeatmapData, setHistoricalHeatmapData] = useState<HeatmapPoint[]>([]);
  const [rawData, setRawData] = useState<TrafficDataResponse | null>(null);
  const [historicalRawData, setHistoricalRawData] = useState<TrafficDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);
  const [pitchAngle, setPitchAngle] = useState(45);

  const animationProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const fetchData = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    setLoadProgress(0);

    const progressInterval = setInterval(() => {
      setLoadProgress((prev) => Math.min(prev + 10, 90));
    }, 50);

    try {
      const [currentRes, historicalRes] = await Promise.all([
        fetch(`/api/traffic-data?timeRange=${range}`),
        fetch(`/api/traffic-data/historical?timeRange=${range}`)
      ]);

      const currentData: TrafficDataResponse = await currentRes.json();
      const historicalData: TrafficDataResponse = await historicalRes.json();

      setRawData(currentData);
      setHistoricalRawData(historicalData);

      const processed = processTrafficData(currentData);
      const historicalProcessed = processTrafficData(historicalData);

      setHeatmapData(processed);
      setHistoricalHeatmapData(historicalProcessed);
      setLoadProgress(100);

      setTimeout(() => {
        setIsLoading(false);
        setLoadProgress(0);
      }, 300);
    } catch (error) {
      console.error('Failed to fetch traffic data:', error);
      setIsLoading(false);
    } finally {
      clearInterval(progressInterval);
    }
  }, []);

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(timeRange);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, fetchData]);

  useEffect(() => {
    if (!isAnimating || !rawData) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      animationProgressRef.current += delta * 0.05 * animationSpeed;
      if (animationProgressRef.current > 1) {
        animationProgressRef.current = 0;
      }

      const frameData = getAnimationFrameData(rawData, animationProgressRef.current);
      setHeatmapData(frameData);

      if (historicalRawData) {
        const historicalFrameData = getAnimationFrameData(historicalRawData, animationProgressRef.current);
        setHistoricalHeatmapData(historicalFrameData);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, rawData, historicalRawData, animationSpeed]);

  const handleRefresh = () => {
    fetchData(timeRange);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setIsAnimating(false);
    setSelectedPoint(null);
  };

  const handleToggleAnimation = () => {
    if (!isAnimating) {
      animationProgressRef.current = 0;
    }
    setIsAnimating(!isAnimating);
  };

  const handlePointClick = (point: HeatmapPoint) => {
    setSelectedPoint(point);
  };

  const congestionColor = (level: string) => {
    switch (level) {
      case '高': return 'text-[#EF4444]';
      case '中': return 'text-[#F59E0B]';
      default: return 'text-[#10B981]';
    }
  };

  const congestionBg = (level: string) => {
    switch (level) {
      case '高': return 'bg-[#EF4444]/20';
      case '中': return 'bg-[#F59E0B]/20';
      default: return 'bg-[#10B981]/20';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0F172A]">
      <header className="h-16 md:h-16 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between z-50 relative">
        <div className="flex items-center gap-3 ml-4 md:ml-6">
          <div className="w-9 h-9 rounded-lg bg-[#3B82F6] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-base font-semibold text-white">城市交通流量可视化</h1>
            <span className="text-xs text-[#94A3B8] hidden sm:block">3D热力图实时监控</span>
          </div>
        </div>

        <ControlPanel
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onRefresh={handleRefresh}
          isAnimating={isAnimating}
          onToggleAnimation={handleToggleAnimation}
          animationSpeed={animationSpeed}
          onAnimationSpeedChange={setAnimationSpeed}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
          compareMode={compareMode}
          onToggleCompareMode={() => setCompareMode(!compareMode)}
          isLoading={isLoading}
        />
      </header>

      <main className="flex-1 relative overflow-hidden">
        {compareMode ? (
          <>
            <div className="absolute inset-0 flex">
              <div className="w-1/2 h-full relative">
                <Scene3D
                  heatmapData={heatmapData}
                  onPointClick={handlePointClick}
                  selectedPoint={selectedPoint}
                  onPitchChange={setPitchAngle}
                  className="w-full h-full"
                />
                <div className="scene-label scene-label-left">当前数据</div>
              </div>
              <div className="w-1/2 h-full relative">
                <Scene3D
                  heatmapData={historicalHeatmapData}
                  onPointClick={() => {}}
                  selectedPoint={null}
                  className="w-full h-full"
                />
                <div className="scene-label scene-label-right">历史平均数据</div>
              </div>
            </div>
            <div className="compare-divider" />
          </>
        ) : (
          <Scene3D
            heatmapData={heatmapData}
            onPointClick={handlePointClick}
            selectedPoint={selectedPoint}
            onPitchChange={setPitchAngle}
            className="w-full h-full"
          />
        )}

        {pitchAngle >= 45 && !compareMode && (
          <div className="pitch-indicator">
            俯仰角: {pitchAngle}°
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="text-white text-sm font-medium">加载交通数据中...</div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}

        {selectedPoint && (
          <div className="info-card">
            <button
              className="info-card-close"
              onClick={() => setSelectedPoint(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-semibold text-white mb-3">{selectedPoint.roadName}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8] text-sm">车流量</span>
                <span className="text-white font-medium">
                  {selectedPoint.vehicleCount} 辆/小时
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8] text-sm">拥堵等级</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${congestionBg(
                    getCongestionLevel(selectedPoint.intensity)
                  )} ${congestionColor(getCongestionLevel(selectedPoint.intensity))}`}
                >
                  {getCongestionLevel(selectedPoint.intensity)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8] text-sm">经纬度</span>
                <span className="text-white text-xs font-mono">
                  {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#334155]">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: `rgb(${Math.floor(selectedPoint.intensity * 255)}, ${Math.floor((1 - Math.abs(selectedPoint.intensity - 0.5) * 2) * 255)}, ${Math.floor((1 - selectedPoint.intensity) * 255)})`
                  }}
                />
                <span className="text-xs text-[#94A3B8]">
                  流量强度: {(selectedPoint.intensity * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 md:left-6 bg-[#1E293B]/80 backdrop-blur-sm rounded-lg p-3 z-40">
          <div className="text-xs text-[#94A3B8] mb-2">流量图例</div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #00FF00, #FFFF00, #FF0000)' }} />
            <div className="flex justify-between w-24 text-xs text-[#94A3B8]">
              <span>低</span>
              <span>中</span>
              <span>高</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
