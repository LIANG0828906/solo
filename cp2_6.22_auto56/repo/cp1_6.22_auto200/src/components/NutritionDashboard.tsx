import React from 'react';
import { DailyGoals, DailySummary } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface NutritionDashboardProps {
  goals: DailyGoals | null;
  summary: DailySummary | null;
}

const NutritionDashboard: React.FC<NutritionDashboardProps> = ({ goals, summary }) => {
  const isLoading = !goals || !summary;
  const total = summary?.total;
  const percentage = summary?.percentage;

  const calcPct = (current: number, goal: number) =>
    goal > 0 ? Math.min((current / goal)