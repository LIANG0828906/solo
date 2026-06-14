import React, { useState, useMemo } from 'react';
import ChartPanel from './ChartPanel';
import ActivityTimeline from './ActivityTimeline';
import BadgeSection from './BadgeSection';
import type { CommitData, HighlightState } from '../types';
import '../styles/Dashboard.css';

interface DashboardProps {
  commits: CommitData[];
  refreshing: boolean;
}

export default function Dashboard({ commits, refreshing }: DashboardProps) {
  const [highlight, setHighlight] = useState<HighlightState>({ date: null, author: null });
  const [maskVisible, setMaskVisible] = useState(refreshing);
  const [maskFading, setMaskFading] = useState(false);

  React.useEffect(() => {
    if (refreshing) {
      setMaskVisible(true);
      setMaskFading(false);
    } else if (maskVisible && !refreshing) {
      setMaskFading(true);
      const timer = setTimeout(() => {
        setMaskVisible(false);
        setMaskFading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [refreshing, maskVisible]);

  const stats = useMemo(() => {
    const totalAdd = commits.reduce((s, c) => s + c.additions, 0);
    const totalDel = commits.reduce((s, c) => s + c.deletions, 0);
    const totalFiles = commits.reduce((s, c) => s + c.files.length, 0);
    const authors = new Set(commits.map((c) => c.author)).size;
    return { totalAdd, totalDel, totalFiles, authors };
  }, [commits]);

  return (
    <div className="dashboard">
      <BadgeSection commits={commits} />

      <div className="stats-row">
        <div className="stat-card fade-in"