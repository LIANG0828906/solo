import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { eventBus } from '../eventBus';
import { yieldForecaster } from '../engine/forecast';
import { farmingEngine } from '../engine/farmingEngine';
import { CROPS } from '../mockData';
import type { ForecastResult, Plot } from '../types';

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

export const StatsPanel: React.FC = () => {
  const [forecasts, setForecasts] = useState<ForecastResult[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [annualData, setAnnualData] = useState<Array<{ month: number; [key: string]: number | string }>>([]);

  useEffect(() => {
    setPlots(farmingEngine.getPlots());

    const unsubYield = eventBus.subscribe('yield:updated', (payload) => {
      setForecasts(payload.forecasts);
    });

    const unsubNutrients = eventBus.subscribe('nutrients:updated', () => {
      setPlots([...farmingEngine.getPlots()]);
    });

    const unsubPlanting = eventBus.subscribe('planting:changed', () => {
      setTimeout(() => {
        yieldForecaster.triggerForecastUpdate();
        setAnnualData(yieldForecaster.getAnnualForecastByCrop());
      }, 100);
    });

    return () => {
      unsubYield();
      unsubNutrients();
      unsubPlanting();
    };
  }, []);

  const chartData = useMemo(() => {
    const data: Array<{
      month: string;
      monthNum: number;
      [key: string]: string | number;
    }> = [];

    const plantedCropIds = [...new Set(
      farmingEngine.getPlans()
        .filter(p => p.cropId)
        .map(p => p.cropId!)
    )];

    for (let m = 1; m <= 12; m++) {
      const item: {
        month: string;
        monthNum: number;
        [key: string]: string | number;
      } = {
        month: MONTH_NAMES[m - 1],
        monthNum: m,
      };

      for (const cropId of plantedCropIds) {
        const crop = CROPS.find(c => c.id === cropId);
        if (crop) {
          const forecast = forecasts.find(f => f.month === m && f.cropId === cropId);
          if (forecast) {
            item[cropId] = forecast.estimatedYield;
            item[`${cropId}Lower`] = forecast.confidenceLower;
            item[`${cropId}Upper`] = forecast.confidenceUpper;
          }
        }
      }

      data.push(item);
    }

    return data;
  }, [forecasts]);

  const nutrientData = useMemo(() => {
    return plots.map(plot => ({
      name: plot.name,
      N: Math.round(plot.nutrients.n),
      P: Math.round(plot.nutrients.p),
      K: Math.round(plot.nutrients.k),
    }));
  }, [plots]);

  const totalConsumption = useMemo(() => {
    let totalN = 0;
    let totalP = 0;
    let totalK = 0;
    plots.forEach(plot => {
      const consumption = farmingEngine.getTotalNutrientConsumption(plot.id);
      totalN += consumption.n;
      totalP += consumption.p;
      totalK += consumption.k;
    });
    return { n: Math.round(totalN), p: Math.round(totalP), k: Math.round(totalK) };
  }, [plots]);

  const hasLowNutrient = plots.some(p => p.nutrients.n < 20 || p.nutrients.p < 20 || p.nutrients.k < 20);

  const plantedCropIds = farmingEngine.getPlans()
    .filter(p => p.cropId)
    .map(p => p.cropId!);
  const uniqueCropIds = [...new Set(plantedCropIds)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '280px',
      }}
    >
      <h3
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '24px',
          color: '#2E7D32',
          margin: '0 0 12px 0',
        }}
      >
        产量与养分统计
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#555',
            marginBottom: '8px',
          }}
        >
          年度产量趋势
        </div>
        {uniqueCropIds.length > 0 ? (
          <div style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#999' }}
                  axisLine={{ stroke: '#DDD' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#999' }}
                  axisLine={{ stroke: '#DDD' }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                />
                {uniqueCropIds.map((cropId) => {
                  const crop = CROPS.find(c => c.id === cropId);
                  if (!crop) return null;
                  return (
                    <Line
                      key={cropId}
                      type="monotone"
                      dataKey={cropId}
                      name={crop.name}
                      stroke={crop.color}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{
              height: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#BBB',
              fontSize: '12px',
              fontStyle: 'italic',
            }}
          >
            暂无种植数据
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#555',
            marginBottom: '8px',
          }}
        >
          土壤养分状态
        </div>
        <div style={{ height: '120px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nutrientData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#999' }}
                axisLine={{ stroke: '#DDD' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#999' }}
                axisLine={{ stroke: '#DDD' }}
                width={35}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
              <Bar dataKey="N" name="氮" fill="#4CAF50" radius={[2, 2, 0, 0]} />
              <Bar dataKey="P" name="磷" fill="#FF9800" radius={[2, 2, 0, 0]} />
              <Bar dataKey="K" name="钾" fill="#03A9F4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#555',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          养分消耗汇总
          {hasLowNutrient && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                backgroundColor: '#FFC107',
                color: '#5D4037',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              预警
            </motion.span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: '#F1F8E9',
              borderRadius: '6px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#4CAF50', fontWeight: 600, fontSize: '16px' }}>
              {totalConsumption.n}
            </div>
            <div style={{ color: '#777', fontSize: '10px' }}>氮消耗</div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFF3E0',
              borderRadius: '6px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#FF9800', fontWeight: 600, fontSize: '16px' }}>
              {totalConsumption.p}
            </div>
            <div style={{ color: '#777', fontSize: '10px' }}>磷消耗</div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: '#E1F5FE',
              borderRadius: '6px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#03A9F4', fontWeight: 600, fontSize: '16px' }}>
              {totalConsumption.k}
            </div>
            <div style={{ color: '#777', fontSize: '10px' }}>钾消耗</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
