import React from 'react';
import { Wine } from './types';

interface WineListProps {
  wines: Wine[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function WineList({ wines, selectedId, onSelect }: WineListProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🍷 品鉴笔记</h1>
        <p>风味图谱 · 酒款管理</p>
      </div>
      <div className="wine-list">
        {wines.map(wine => (
          <div
            key={wine.id}
            className={`wine-item ${wine.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(wine.id)}
          >
            <div className="wine-item-name">{wine.name}</div>
            <div className="wine-item-meta">{wine.year} · {wine.region}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
