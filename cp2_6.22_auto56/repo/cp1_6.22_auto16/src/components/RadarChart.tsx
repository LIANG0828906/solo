import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { ReportData, WeightMultipliers } from '../types';
import { dataService } from '../DataService';
import '../styles/RadarChart.css';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  report: ReportData;
  weightMultipliers: WeightMultipliers;
  historyReport?: ReportData | null;
  useWeighted?: boolean;
}

const RadarChart: React.FC<RadarChartProps> = ({
  report,
  weightMultipliers,
  historyReport = null,
  useWeighted = true,
}) => {
  const chartRef = useRef<ChartJS<'radar'>>(null);

  const currentData = dataService.calculateChartData(
    report,
    weightMultipliers,
    useWeighted
  );

  const historyData = historyReport
    ? dataService.calculateChartData(historyReport, weightMultipliers, useWeighted)
    : null;

  const data = {
    labels: currentData.labels,
    datasets: [
      {
        label: report.templateName || '当前报告',
        data: currentData.data,
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderColor: 'rgba(16, 185, 129, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      ...(historyData
        ? [
            {
              label: historyReport!.templateName || '历史报告',
              data: historyData.data,
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderColor: 'rgba(99, 102, 241, 0.4)',
              borderWidth: 2,
              borderDash: [5, 5],
              pointBackgroundColor: 'rgba(99, 102, 241, 0.6)',
              pointBorderColor: '#fff',
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 13,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 22, 40, 0.9)',
        titleColor: '#fff',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 10,
        beginAtZero: true,
        ticks: {
          stepSize: 2,
          color: 'rgba(255, 255, 255, 0.5)',
          backdropColor: 'transparent',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          circular: true,
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 13,
            weight: 500,
          },
        },
      },
    },
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('none');
    }
  }, [weightMultipliers]);

  return (
    <div className="radar-chart-container">
      <div className="radar-chart-wrapper">
        <Radar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default RadarChart;
