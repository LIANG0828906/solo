import React, { useState, useEffect, useCallback } from 'react';
import { DailyStats, StatusStats } from '../types';
import { fetchDailyStats, fetchStatusStats } from '../api';
import LineChart from './LineChart';
import DonutChart from './DonutChart';

const DashboardModule: React.FC = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStats>({
    '进行中': 0,
    '已实现': 0,
    '已归档': 0,
  });

  const refreshData = useCallback(async () => {
    try {
      const [daily, status] = await Promise.all([fetchDailyStats(7), fetchStatusStats()]);
      setDailyStats(daily);
      setStatusStats(status);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refreshData();

    const intervalId = window.setInterval(() => {
      const now = new Date();
      if (now.getMinutes() === 0 && now.getSeconds() === 0) {
        refreshData();
      }
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [refreshData]);

  useEffect(() => {
    const handler = () => refreshData();
    document.addEventListener('inspirationChanged', handler);
    return () => document.removeEventListener('inspirationChanged', handler);
  }, [refreshData]);

  return (
    <div className="dashboard">
      <div className="chart-card">
        <div className="chart-title">近 7 天新增灵感</div>
        <LineChart data={dailyStats} width={400} height={250} />
      </div>
      <div className="chart-card">
        <div className="chart-title">状态分布</div>
        <DonutChart data={statusStats} size={200} />
      </div>
    </div>
  );
};

export default DashboardModule;
