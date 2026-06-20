import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { BuildingType, FacadeDirection, SavedScheme, VentilationMetrics } from '../types';
import { FACADE_LABELS, METRIC_UNITS } from '../types';
import { useBuildingStore, selectBuildingType, selectOpeningRates, selectSavedSchemes } from '../controllers/BuildingController';
import { windController } from '../controllers/WindController';
import {
  generateRadarData,
  calculateVentilationMetrics,
  calculateBaselineMetrics,
  generateMetricComparison,
  getScoreFromMetrics,
  type RadarChartData,
  type MetricComparison
} from '../utils/DiagramGenerator';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface VerticalSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  color?: string;
}

function VerticalSlider({ label, value, min = 0, max = 60, onChange, color = '#4EA8DE' }: VerticalSliderProps) {
  const [isActive, setIsActive] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <div className="slider-value">{value.toFixed(0)}%</div>
      <div
        className="slider-wrapper"
        style={{ height: '200px' }}
      >
        <div
          className="slider-track"
          style={{
            background: `linear-gradient(to top, ${isActive ? color : '#888'} ${percentage}%, #E0E0E0 ${percentage}%)`
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          onMouseDown={() => setIsActive(true)}
          onMouseUp={() => setIsActive(false)}
          onTouchStart={() => setIsActive(true)}
          onTouchEnd={() => setIsActive(false)}
          className="slider-input vertical"
          style={{
            '--slider-color': isActive ? color : '#888'
          } as React.CSSProperties}
        />
      </div>
      <div className="slider-label">{label}</div>
    </div>
  );
}

interface BuildingTypeCardProps {
  type: BuildingType;
  label: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

function BuildingTypeCard({ label, icon, isSelected, onClick }: BuildingTypeCardProps) {
  return (
    <button
      className={`building-type-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="building-icon">{icon}</div>
      <div className="building-label">{label}</div>
    </button>
  );
}

interface SchemeCardProps {
  scheme: SavedScheme | null;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function SchemeCard({ scheme, index, isActive, onClick }: SchemeCardProps) {
  if (!scheme) {
    return (
      <div className="scheme-card empty">
        <span className="empty-text">空槽位 {index + 1}</span>
      </div>
    );
  }

  const typeLabels: Record<BuildingType, string> = {
    'cube': '立方体',
    'L-shape': 'L形体',
    'U-shape': 'U形体'
  };

  const avgRate = (scheme.openingRates.south + scheme.openingRates.north + scheme.openingRates.east + scheme.openingRates.west) / 4;

  return (
    <button
      className={`scheme-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="scheme-header">
        <span className="scheme-name">{scheme.name}</span>
        <span className="scheme-type">{typeLabels[scheme.buildingType]}</span>
      </div>
      <div className="scheme-rates">
        <span>S:{scheme.openingRates.south}%</span>
        <span>N:{scheme.openingRates.north}%</span>
        <span>E:{scheme.openingRates.east}%</span>
        <span>W:{scheme.openingRates.west}%</span>
      </div>
      <div className="scheme-avg">平均: {avgRate.toFixed(0)}%</div>
    </button>
  );
}

interface RadarChartProps {
  data: RadarChartData;
  currentMetrics: VentilationMetrics;
  baselineMetrics: VentilationMetrics;
}

function RadarChartComponent({ data, currentMetrics, baselineMetrics }: RadarChartProps) {
  const metricKeys: (keyof VentilationMetrics)[] = [
    'avgWindSpeed',
    'maxWindSpeed',
    'turbulenceIntensity',
    'deadZoneRatio',
    'airChangeRate'
  ];

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'Inter, sans-serif',
          size: 13
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 12
        },
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: function(context: any) {
            const datasetIndex = context.datasetIndex;
            const dataIndex = context.dataIndex;
            const key = metricKeys[dataIndex];
            const metrics = datasetIndex === 0 ? currentMetrics : baselineMetrics;
            const value = metrics[key];
            const unit = METRIC_UNITS[key];
            return `${context.dataset.label}: ${value}${unit ? ' ' + unit : ''}`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 0.2,
          font: {
            size: 9
          },
          display: false
        },
        grid: {
          color: '#CCCCCC',
          borderDash: [4, 4]
        },
        angleLines: {
          color: '#CCCCCC',
          borderDash: [4, 4]
        },
        pointLabels: {
          font: {
            family: 'Inter, sans-serif',
            size: 11,
            weight: 500
          },
          color: '#333'
        }
      }
    },
    elements: {
      line: {
        tension: 0.1
      }
    }
  };

  return <Radar data={data} options={options} />;
}

interface MetricComparisonTableProps {
  comparisons: MetricComparison[];
}

function MetricComparisonTable({ comparisons }: MetricComparisonTableProps) {
  const formatValue = (value: number, unit: string) => {
    if (unit === '' && value <= 1) {
      return `${(value * 100).toFixed(0)}%`;
    }
    return `${value}${unit ? ' ' + unit : ''}`;
  };

  const formatDiff = (diff: number, _isBetter: boolean, unit: string) => {
    const prefix = diff > 0 ? '+' : '';
    let display = diff;
    if (unit === '' && Math.abs(diff) <= 1) {
      display = diff * 100;
    }
    return `${prefix}${display.toFixed(1)}${unit === '' && Math.abs(diff) <= 1 ? '%' : unit ? ' ' + unit : ''}`;
  };

  return (
    <div className="metrics-table">
      {comparisons.map((cmp) => (
        <div key={cmp.key} className="metric-row">
          <span className="metric-name">{cmp.label}</span>
          <span className="metric-current">{formatValue(cmp.current, cmp.unit)}</span>
          <span className={`metric-diff ${cmp.isBetter ? 'better' : 'worse'}`}>
            {cmp.difference !== 0 ? formatDiff(cmp.difference, cmp.isBetter, cmp.unit) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ControlPanel() {
  const buildingType = useBuildingStore(selectBuildingType);
  const openingRates = useBuildingStore(selectOpeningRates);
  const savedSchemes = useBuildingStore(selectSavedSchemes);
  const { setBuildingType, setOpeningRate, saveScheme, loadScheme } = useBuildingStore();

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<VentilationMetrics>({
    avgWindSpeed: 0,
    maxWindSpeed: 0,
    turbulenceIntensity: 0,
    deadZoneRatio: 0,
    airChangeRate: 0
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsubscribe = windController.subscribe((state) => {
      setCurrentMetrics(state.metrics);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const metrics = calculateVentilationMetrics(buildingType, openingRates);
    setCurrentMetrics(metrics);
  }, [buildingType, openingRates]);

  const baselineMetrics = useMemo(() => calculateBaselineMetrics(), []);
  const radarData = useMemo(
    () => generateRadarData(currentMetrics, baselineMetrics),
    [currentMetrics, baselineMetrics]
  );
  const metricComparisons = useMemo(
    () => generateMetricComparison(currentMetrics, baselineMetrics),
    [currentMetrics, baselineMetrics]
  );
  const currentScore = useMemo(
    () => getScoreFromMetrics(currentMetrics),
    [currentMetrics]
  );
  const baselineScore = useMemo(
    () => getScoreFromMetrics(baselineMetrics),
    [baselineMetrics]
  );

  const buildingIcons: Record<BuildingType, string> = {
    'cube': '▢',
    'L-shape': 'L',
    'U-shape': 'U'
  };

  const buildingLabels: Record<BuildingType, string> = {
    'cube': '立方体',
    'L-shape': 'L形体',
    'U-shape': 'U形体'
  };

  const handleSaveScheme = () => {
    if (savedSchemes.length < 4) {
      saveScheme();
    }
  };

  const facades: FacadeDirection[] = ['south', 'north', 'east', 'west'];

  return (
    <>
      <div className={`left-panel ${leftCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="panel-header" onClick={() => setLeftCollapsed(!leftCollapsed)}>
          <h3>开窗率控制</h3>
          <span className={`collapse-arrow ${leftCollapsed ? 'closed' : ''}`}>▼</span>
        </div>
        {!leftCollapsed && (
          <div className="panel-content">
            <div className="sliders-container">
              {facades.map((facade) => (
                <VerticalSlider
                  key={facade}
                  label={FACADE_LABELS[facade]}
                  value={openingRates[facade]}
                  onChange={(value) => setOpeningRate(facade, value)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`right-panel ${rightCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="panel-header" onClick={() => setRightCollapsed(!rightCollapsed)}>
          <h3>通风指标对比</h3>
          <span className={`collapse-arrow ${rightCollapsed ? 'closed' : ''}`}>▼</span>
        </div>
        {!rightCollapsed && (
          <div className="panel-content">
            <div className="score-display">
              <div className="score-item">
                <span className="score-label">当前方案</span>
                <span className="score-value" style={{ color: '#5E9AFF' }}>{currentScore}</span>
              </div>
              <div className="score-divider">/</div>
              <div className="score-item">
                <span className="score-label">基准</span>
                <span className="score-value" style={{ color: '#AAA' }}>{baselineScore}</span>
              </div>
            </div>

            <div className="radar-chart-container">
              <RadarChartComponent
                data={radarData}
                currentMetrics={currentMetrics}
                baselineMetrics={baselineMetrics}
              />
            </div>

            <MetricComparisonTable comparisons={metricComparisons} />

            <div className="save-buttons">
              <button
                className="save-btn"
                onClick={handleSaveScheme}
                disabled={savedSchemes.length >= 4}
              >
                {savedSchemes.length >= 4 ? '槽位已满' : `保存方案 (${savedSchemes.length}/4)`}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bottom-panel">
        <div className="building-type-selector">
          {(Object.keys(buildingLabels) as BuildingType[]).map((type) => (
            <BuildingTypeCard
              key={type}
              type={type}
              label={buildingLabels[type]}
              icon={buildingIcons[type]}
              isSelected={buildingType === type}
              onClick={() => setBuildingType(type)}
            />
          ))}
        </div>

        <div className="scheme-bar">
          {[0, 1, 2, 3].map((index) => (
            <SchemeCard
              key={index}
              scheme={savedSchemes[index] || null}
              index={index}
              isActive={false}
              onClick={() => savedSchemes[index] && loadScheme(index)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
