import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { Snapshot, SpeciesType, HistoryPoint, AllSpeciesParams } from '../types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

interface DataPanelProps {
  snapshot: Snapshot | null;
  history: HistoryPoint[];
  isPaused: boolean;
  speed: number;
  onTogglePause: () => void;
  onSpeedChange: (speed: number) => void;
  onPerturbation: () => void;
  onOpenSettings: () => void;
  params: AllSpeciesParams;
}

const SPECIES_COLORS: Record<SpeciesType, string> = {
  [SpeciesType.PLANT]: '#2D6A4F',
  [SpeciesType.HERBIVORE]: '#48CAE4',
  [SpeciesType.CARNIVORE]: '#E63946',
};

const SPECIES_NAMES: Record<SpeciesType, string> = {
  [SpeciesType.PLANT]: '植物',
  [SpeciesType.HERBIVORE]: '食草动物',
  [SpeciesType.CARNIVORE]: '食肉动物',
};

const downsample = (data: HistoryPoint[], maxPoints: number): HistoryPoint[] => {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  const result: HistoryPoint[] = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  return result;
};

export const DataPanel: React.FC<DataPanelProps> = ({
  snapshot,
  history,
  isPaused,
  speed,
  onTogglePause,
  onSpeedChange,
  onPerturbation,
  onOpenSettings,
}) => {
  const doughnutData = useMemo(() => {
    if (!snapshot) {
      return {
        labels: ['植物', '食草动物', '食肉动物'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [SPECIES_COLORS[SpeciesType.PLANT], SPECIES_COLORS[SpeciesType.HERBIVORE], SPECIES_COLORS[SpeciesType.CARNIVORE]],
          borderWidth: 0,
        }],
      };
    }
    return {
      labels: ['植物', '食草动物', '食肉动物'],
      datasets: [{
        data: [
          snapshot.counts[SpeciesType.PLANT],
          snapshot.counts[SpeciesType.HERBIVORE],
          snapshot.counts[SpeciesType.CARNIVORE],
        ],
        backgroundColor: [SPECIES_COLORS[SpeciesType.PLANT], SPECIES_COLORS[SpeciesType.HERBIVORE], SPECIES_COLORS[SpeciesType.CARNIVORE]],
        borderWidth: 0,
      }],
    };
  }, [snapshot]);

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(13,27,42,0.9)',
        titleColor: '#E0E1DD',
        bodyColor: '#E0E1DD',
        padding: 12,
        cornerRadius: 8,
      },
    },
    cutout: '65%',
  };

  const sampledHistory = useMemo(() => downsample(history, 500), [history]);

  const lineData = useMemo(() => {
    return {
      labels: sampledHistory.map(h => h.generation),
      datasets: [
        {
          label: '植物',
          data: sampledHistory.map(h => h.plant),
          borderColor: SPECIES_COLORS[SpeciesType.PLANT],
          backgroundColor: `${SPECIES_COLORS[SpeciesType.PLANT]}33`,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        },
        {
          label: '食草动物',
          data: sampledHistory.map(h => h.herbivore),
          borderColor: SPECIES_COLORS[SpeciesType.HERBIVORE],
          backgroundColor: `${SPECIES_COLORS[SpeciesType.HERBIVORE]}33`,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        },
        {
          label: '食肉动物',
          data: sampledHistory.map(h => h.carnivore),
          borderColor: SPECIES_COLORS[SpeciesType.CARNIVORE],
          backgroundColor: `${SPECIES_COLORS[SpeciesType.CARNIVORE]}33`,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        },
      ],
    };
  }, [sampledHistory]);

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#E0E1DD',
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(13,27,42,0.95)',
        titleColor: '#E0E1DD',
        bodyColor: '#E0E1DD',
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          font: { size: 10 },
          maxTicksLimit: 6,
        },
        title: {
          display: true,
          text: '代数',
          color: 'rgba(255,255,255,0.6)',
          font: { size: 11 },
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          font: { size: 10 },
        },
        title: {
          display: true,
          text: '数量',
          color: 'rgba(255,255,255,0.6)',
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div
      style={{
        width: 320,
        backgroundColor: 'rgba(13, 27, 42, 0.92)',
        borderRadius: 12,
        padding: 20,
        color: '#E0E1DD',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
        maxHeight: '100vh',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>当前迭代</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#76B900', fontFamily: 'monospace' }}>
          {snapshot?.generation ?? 0}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {([SpeciesType.PLANT, SpeciesType.HERBIVORE, SpeciesType.CARNIVORE] as SpeciesType[]).map(species => (
          <div
            key={species}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: species === SpeciesType.HERBIVORE ? '50%' : species === SpeciesType.CARNIVORE ? 2 : 0,
                  backgroundColor: SPECIES_COLORS[species],
                }}
              />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{SPECIES_NAMES[species]}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
              {snapshot?.counts[species] ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              平均能量: {(snapshot?.avgEnergy[species] ?? 0).toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 10,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textAlign: 'center' }}>
          种群占比
        </div>
        <div style={{ height: 150, position: 'relative' }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 10,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
          种群数量变化
        </div>
        <div style={{ height: 180 }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        <button
          onClick={onTogglePause}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: '#F4A261',
            color: '#0D1B2A',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E76F51')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F4A261')}
        >
          {isPaused ? '▶ 恢复模拟' : '⏸ 暂停模拟'}
        </button>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>模拟速度</span>
            <span style={{ color: '#76B900', fontWeight: 600 }}>{speed}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={e => onSpeedChange(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onPerturbation}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(230, 57, 70, 0.5)',
              backgroundColor: 'transparent',
              color: '#E63946',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(230, 57, 70, 0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ⚡ 添加扰动
          </button>
          <button
            onClick={onOpenSettings}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              backgroundColor: 'transparent',
              color: '#E0E1DD',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ⚙️ 设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPanel;
