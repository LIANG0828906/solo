import { useEffect, useState, type ReactNode } from 'react';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  const [display, setDisplay] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setDisplay(value);
    setAnimKey(k => k + 1);
  }, [value]);

  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-body">
        <span key={animKey} className="stat-card-value">{display}</span>
        <div className="stat-card-icon">{icon}</div>
      </div>
    </div>
  );
}
