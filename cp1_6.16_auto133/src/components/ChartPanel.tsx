import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { EnvironmentData, PredictionDay } from '../types';

interface ChartPanelProps {
  data: EnvironmentData[];
  predictions: PredictionDay[];
}

const ChartPanel: React.FC<ChartPanelProps> = ({ data, predictions }) => {
  const chartData = data.slice(-7).map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    }),
    温度: item.temperature,
    湿度: item.humidity,
    fullDate: new Date(item.timestamp).toLocaleString('zh-CN')
  }));

  return (
    <div style={styles.container} className="fade-in">
      <h3 style={styles.title}>数据趋势</h3>

      <div style={styles.chartsRow}>
        <div style={styles.chartWrapper}>
          <h4 style={styles.chartTitle}>温度趋势 (近7天)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="date" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                contentStyle={styles.tooltip}
                formatter={(value: number, name: string, props: any) => [
                  <span key={value}>{value}℃</span>,
                  name
                ]}
                labelFormatter={(label: string, payload: any) => {
                  const item = chartData.find((d) => d.date === label);
                  return item?.fullDate || label;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="温度"
                stroke="#4CAF50"
                strokeWidth={3}
                dot={{ fill: '#4CAF50', r: 5 }}
                activeDot={{ r: 8, fill: '#388E3C' }}
                animationDuration={500}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartWrapper}>
          <h4 style={styles.chartTitle}>湿度趋势 (近7天)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="date" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={styles.tooltip}
                formatter={(value: number) => [`${value}%`, '湿度']}
                labelFormatter={(label: string) => {
                  const item = chartData.find((d) => d.date === label);
                  return item?.fullDate || label;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar
                dataKey="湿度"
                fill="#2196F3"
                radius={[4, 4, 0, 0]}
                animationDuration={500}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.predictionSection}>
        <h4 style={styles.predictionTitle}>未来3天预测</h4>
        <div style={styles.predictionCards}>
          {predictions.map((day, index) => (
            <div key={index} style={styles.predictionCard}>
              <div style={styles.predictionDay}>{day.day}</div>
              <div style={styles.predictionValues}>
                <span style={styles.tempValue}>🌡️ {day.temp}°C</span>
                <span style={styles.humidityValue}>💧 {day.humidity}%</span>
              </div>
              <div style={styles.predictionAdvice}>{day.advice}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#2E7D32',
    marginBottom: '20px',
    fontFamily: 'Georgia, serif'
  },
  chartsRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  chartWrapper: {
    flex: 1,
    minWidth: '300px',
    padding: '0 20px'
  },
  chartTitle: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#555',
    marginBottom: '12px'
  },
  tooltip: {
    backgroundColor: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  predictionSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #E0E0E0'
  },
  predictionTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '16px'
  },
  predictionCards: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  predictionCard: {
    flex: 1,
    minWidth: '200px',
    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center'
  },
  predictionDay: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2E7D32',
    marginBottom: '12px'
  },
  predictionValues: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '12px'
  },
  tempValue: {
    fontSize: '18px',
    fontWeight: 500,
    color: '#4CAF50'
  },
  humidityValue: {
    fontSize: '18px',
    fontWeight: 500,
    color: '#2196F3'
  },
  predictionAdvice: {
    fontSize: '13px',
    color: '#5D4037',
    lineHeight: 1.5
  }
};

export default ChartPanel;
