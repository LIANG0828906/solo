import type {
  VentilationMetrics,
  OpeningRates,
  BuildingType,
  SavedScheme
} from '../types';
import { BASELINE_SCHEME, METRIC_LABELS } from '../types';
import { windController } from '../controllers/WindController';

const METRIC_MAX_VALUES: Record<keyof VentilationMetrics, number> = {
  avgWindSpeed: 3.0,
  maxWindSpeed: 4.0,
  turbulenceIntensity: 1.0,
  deadZoneRatio: 1.0,
  airChangeRate: 30
};

const METRIC_LOWER_IS_BETTER: Record<keyof VentilationMetrics, boolean> = {
  avgWindSpeed: false,
  maxWindSpeed: false,
  turbulenceIntensity: true,
  deadZoneRatio: true,
  airChangeRate: false
};

export function calculateVentilationMetrics(
  buildingType: BuildingType,
  openingRates: OpeningRates
): VentilationMetrics {
  const cachedMetrics = windController.getMetrics();
  if (cachedMetrics.avgWindSpeed > 0) {
    return { ...cachedMetrics };
  }
  return computeMetricsFromParams(buildingType, openingRates);
}

function computeMetricsFromParams(
  buildingType: BuildingType,
  openingRates: OpeningRates
): VentilationMetrics {
  const totalRate = openingRates.south + openingRates.north + openingRates.east + openingRates.west;
  const avgRate = totalRate / 400;

  const crossVentilation = Math.abs(openingRates.south - openingRates.north) / 100
    + Math.abs(openingRates.east - openingRates.west) / 100;

  const efficiency = {
    'cube': 1.0,
    'L-shape': 0.85,
    'U-shape': 0.75
  }[buildingType];

  const baseSpeed = 0.5 + avgRate * 2.5 * efficiency;
  const avgWindSpeed = Math.min(3.0, baseSpeed);
  const maxWindSpeed = Math.min(4.0, avgWindSpeed * 1.8);
  const turbulenceIntensity = Math.min(1.0, 0.2 + crossVentilation * 0.4 + (1 - efficiency) * 0.3);
  const deadZoneRatio = Math.max(0, 0.6 - avgRate * 0.8 * efficiency);
  const airChangeRate = Math.min(30, avgRate * 40 * efficiency);

  return {
    avgWindSpeed: Number(avgWindSpeed.toFixed(2)),
    maxWindSpeed: Number(maxWindSpeed.toFixed(2)),
    turbulenceIntensity: Number(turbulenceIntensity.toFixed(2)),
    deadZoneRatio: Number(deadZoneRatio.toFixed(2)),
    airChangeRate: Number(airChangeRate.toFixed(1))
  };
}

export function calculateBaselineMetrics(): VentilationMetrics {
  return computeMetricsFromParams(
    BASELINE_SCHEME.buildingType,
    BASELINE_SCHEME.openingRates
  );
}

export function normalizeMetrics(metrics: VentilationMetrics): number[] {
  const keys: (keyof VentilationMetrics)[] = [
    'avgWindSpeed',
    'maxWindSpeed',
    'turbulenceIntensity',
    'deadZoneRatio',
    'airChangeRate'
  ];

  return keys.map(key => {
    const value = metrics[key];
    const max = METRIC_MAX_VALUES[key];
    const lowerIsBetter = METRIC_LOWER_IS_BETTER[key];
    const normalized = Math.min(1, Math.max(0, value / max));
    return lowerIsBetter ? 1 - normalized : normalized;
  });
}

export interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointRadius: number;
    pointHoverRadius: number;
  }[];
}

export function generateRadarData(
  currentMetrics: VentilationMetrics,
  baselineMetrics: VentilationMetrics
): RadarChartData {
  const labels = Object.values(METRIC_LABELS);

  const currentData = normalizeMetrics(currentMetrics);
  const baselineData = normalizeMetrics(baselineMetrics);

  return {
    labels,
    datasets: [
      {
        label: '当前方案',
        data: currentData,
        borderColor: '#5E9AFF',
        backgroundColor: 'rgba(94, 154, 255, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: '#5E9AFF',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: '基准方案',
        data: baselineData,
        borderColor: '#AAAAAA',
        backgroundColor: 'rgba(170, 170, 170, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#AAAAAA',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
}

export interface MetricComparison {
  key: keyof VentilationMetrics;
  label: string;
  current: number;
  baseline: number;
  unit: string;
  difference: number;
  isBetter: boolean;
}

export function generateMetricComparison(
  currentMetrics: VentilationMetrics,
  baselineMetrics: VentilationMetrics
): MetricComparison[] {
  const keys: (keyof VentilationMetrics)[] = [
    'avgWindSpeed',
    'maxWindSpeed',
    'turbulenceIntensity',
    'deadZoneRatio',
    'airChangeRate'
  ];

  const units: Record<keyof VentilationMetrics, string> = {
    avgWindSpeed: 'm/s',
    maxWindSpeed: 'm/s',
    turbulenceIntensity: '',
    deadZoneRatio: '',
    airChangeRate: '次/h'
  };

  return keys.map(key => {
    const current = currentMetrics[key];
    const baseline = baselineMetrics[key];
    const difference = current - baseline;
    const lowerIsBetter = METRIC_LOWER_IS_BETTER[key];
    const isBetter = lowerIsBetter ? difference < 0 : difference > 0;

    return {
      key,
      label: METRIC_LABELS[key],
      current,
      baseline,
      unit: units[key],
      difference: Number(difference.toFixed(2)),
      isBetter
    };
  });
}

export function getScoreFromMetrics(metrics: VentilationMetrics): number {
  const weights: Record<keyof VentilationMetrics, number> = {
    avgWindSpeed: 0.25,
    maxWindSpeed: 0.15,
    turbulenceIntensity: 0.2,
    deadZoneRatio: 0.25,
    airChangeRate: 0.15
  };

  let score = 0;
  const keys = Object.keys(weights) as (keyof VentilationMetrics)[];

  for (const key of keys) {
    const value = metrics[key];
    const max = METRIC_MAX_VALUES[key];
    const lowerIsBetter = METRIC_LOWER_IS_BETTER[key];
    const normalized = Math.min(1, Math.max(0, value / max));
    const adjusted = lowerIsBetter ? 1 - normalized : normalized;
    score += adjusted * weights[key];
  }

  return Math.round(score * 100);
}

export function getSchemeMetrics(scheme: SavedScheme): VentilationMetrics {
  return computeMetricsFromParams(scheme.buildingType, scheme.openingRates);
}
