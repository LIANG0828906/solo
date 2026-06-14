import React from 'react';
import { Sun, Droplets, Leaf, Thermometer, Wind, Sparkles } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { CareSuggestion, DiagnosisStatus } from '@/shared/types';

const iconMap = {
  sun: Sun,
  droplets: Droplets,
  leaf: Leaf,
  fertilizer: Sparkles,
  temperature: Thermometer,
  wind: Wind,
};

const statusConfig: Record<DiagnosisStatus, { label: string; gradient: string; severity: number }> = {
  healthy: {
    label: '健康',
    gradient: 'linear-gradient(90deg, #4CAF50, #81C784, #A5D6A7)',
    severity: 0,
  },
  nutrient_deficiency: {
    label: '营养不足',
    gradient: 'linear-gradient(90deg, #FBC02D, #FFD54F, #FFEB3B)',
    severity: 50,
  },
  diseased: {
    label: '病害',
    gradient: 'linear-gradient(90deg, #FF9800, #F44336, #E53935)',
    severity: 100,
  },
};

function SuggestionCard({ suggestion, index }: { suggestion: CareSuggestion; index: number }) {
  const Icon = iconMap[suggestion.icon];
  return (
    <div
      className="suggestion-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="suggestion-icon">
        <Icon size={28} />
      </div>
      <h4 className="suggestion-title">{suggestion.title}</h4>
      <p className="suggestion-desc">{suggestion.description}</p>
    </div>
  );
}

export default function DiagnosisPanel() {
  const { state } = useAppStore();
  const record = state.currentRecord;

  if (!record && !state.isDiagnosing) {
    return null;
  }

  if (state.isDiagnosing) {
    return (
      <div className="diagnosis-panel diagnosis-loading">
        <div className="loading-skeleton">
          <div className="skeleton-line skeleton-1" />
          <div className="skeleton-line skeleton-2" />
          <div className="skeleton-line skeleton-3" />
          <div className="skeleton-cards">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!record) return null;

  const status = statusConfig[record.status];

  return (
    <div className="diagnosis-panel fade-in">
      <div
        className="severity-bar"
        style={{ background: status.gradient }}
      >
        <span className="severity-label">严重等级</span>
        <div className="severity-track">
          <div
            className="severity-fill"
            style={{
              width: `${status.severity}%`,
              background: 'rgba(255,255,255,0.3)',
            }}
          />
        </div>
        <span className="severity-value">{status.label}</span>
      </div>

      <div className="diagnosis-content">
        <div className="diagnosis-header">
          <div>
            <span className="plant-name">{record.plantName}</span>
            <h2 className="disease-name">{record.diseaseName}</h2>
          </div>
          <div className="confidence-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E8F5E9" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={record.status === 'healthy' ? '#4CAF50' : record.status === 'diseased' ? '#E53935' : '#FBC02D'}
                strokeWidth="8"
                strokeDasharray={`${record.confidence * 2.64} 264`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="confidence-fill"
              />
            </svg>
            <span className="confidence-value">{record.confidence}%</span>
          </div>
        </div>

        <div className="symptoms-section">
          <h3 className="section-title">症状描述</h3>
          <p className="symptoms-text">{record.symptoms}</p>
        </div>

        <div className="suggestions-section">
          <h3 className="section-title">护理建议</h3>
          <div className="suggestions-scroll">
            <div className="suggestions-track">
              {record.suggestions.map((s, i) => (
                <SuggestionCard key={s.id} suggestion={s} index={i} />
              ))}
            </div>
          </div>
          <p className="scroll-hint">← 左右滑动查看更多建议 →</p>
        </div>
      </div>
    </div>
  );
}
