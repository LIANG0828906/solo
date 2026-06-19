import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePromotionStore } from '../store';
import type { ABTest } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#00c853', '#ff6b6b', '#ffd93d'];

const TestDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { abTests, fetchABTests, realtimeStats, fetchRealtimeStats, fetchHistoryData, loading } = usePromotionStore();
  
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  useEffect(() => {
    fetchABTests();
  }, [fetchABTests]);

  useEffect(() => {
    if (id && abTests.length > 0) {
      const test = abTests.find(t => t.id === id);
      if (test) {
        setSelectedTest(test);
        fetchRealtimeStats(test.id);
        fetchHistoryData(test.id).then(data => setHistoryData(data));
      }
    } else if (abTests.length > 0) {
      const test = abTests[0];
      setSelectedTest(test);
      fetchRealtimeStats(test.id);
      fetchHistoryData(test.id).then(data => setHistoryData(data));
    }
  }, [id, abTests, fetchRealtimeStats, fetchHistoryData]);

  const handleTestSelect =