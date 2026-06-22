import React, { useEffect, useRef, useState } from 'react';
import { DisasterLogEntry, DisasterType } from '../modules/DisasterManager';
import { IslandStatus, ZoneResources } from '../modules/EcosystemSimulator';

const DISASTER_COLORS: Record<DisasterType, string> = {
  fire: '#FF5722',
  flood: '#2196F3',
  drought: '#FFEB3B',
};

const DISASTER_LABELS: Record<DisasterType, string> = {
  fire: '火灾',
  flood: '洪水',
  drought: '干旱',
};

const ZONE_LABELS: Record<string, string> = {
  forest: '森林',
  desert: '沙漠',
  glacier: '冰川',
};

interface FloatingNumber {
  id: number;
  value: number;
  key: string;
}

let floatId = 0;

export const StatusPanel: React.FC<{ status: IslandStatus }> = ({ status }) => {
  const [floats, setFloats] = useState<FloatingNumber[]>([]);
  const prevRef = useRef<IslandStatus | null>(null);

  useEffect(() => {
    if (!prevRef.current) {
      prevRef.current = status;
      return;
    }
    const prev = prevRef.current;
    const newFloats: FloatingNumber[] = [];
    const zones = ['forest', 'desert', 'glacier'] as const;

    for (const z of zones) {
      const prevH = Math.round(prev[z].health);
      const currH = Math.round(status[z].health);
      if (prevH !== currH) {
        newFloats.push({ id: ++floatId, value: currH - prevH, key: `${z}-health` });
      }
      const resKeys = ['wood', 'water', 'ore'] as const;
      for (const r of resKeys) {
        const prevR = Math.round(prev[z].resources[r]);
        const currR = Math.round(status[z].resources[r]);
        if (prevR !== currR) {
          newFloats.push({ id: ++floatId, value: currR - prevR, key: `${z}-${r}` });
        }
      }
    }

    if (newFloats.length > 0) {
      setFloats((f) => [...f, ...newFloats]);
      setTimeout(() => {
        setFloats((f) => f.filter((fi) => !newFloats.some((nf) => nf.id === fi.id)));
      }, 700);
    }

    prevRef.current = status;
  }, [status]);

  return (
    <div className="panel status-panel">
      <h3 className="panel-title">📊 生态状态</h3>
      {(['forest', 'desert', 'glacier'] as const).map((zone) => {
        const z = status[zone];
        return (
          <div key={zone} className="zone-status">
            <div className="zone-status-header">
              <span className="zone-label">{ZONE_LABELS[zone]}</span>
              <span className="zone-health">
                {Math.round(z.health)}%
                {floats
                  .filter((f) => f.key === `${zone}-health`)
                  .map((f) => (
                    <span
                      key={f.id}
                      className={`float-number ${f.value > 0 ? 'positive' : 'negative'}`}
                    >
                      {f.value > 0 ? `+${f.value}` : f.value}
                    </span>
                  ))}
              </span>
            </div>
            <div className="health-bar-bg">
              <div
                className="health-bar-fill"
                style={{
                  width: `${z.health}%`,
                  backgroundColor:
                    z.health > 60 ? '#2E7D32' : z.health > 30 ? '#F9A825' : '#FF5722',
                }}
              />
            </div>
            <div className="resource-row">
              {renderRes('🪵', z.resources.wood, floats, `${zone}-wood`)}
              {renderRes('💧', z.resources.water, floats, `${zone}-water`)}
              {renderRes('⛏️', z.resources.ore, floats, `${zone}-ore`)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function renderRes(icon: string, value: number, floats: FloatingNumber[], floatKey: string) {
  return (
    <span className="resource-item">
      {icon} {Math.round(value)}
      {floats
        .filter((f) => f.key === floatKey)
        .map((f) => (
          <span
            key={f.id}
            className={`float-number ${f.value > 0 ? 'positive' : 'negative'}`}
          >
            {f.value > 0 ? `+${f.value}` : f.value}
          </span>
        ))}
    </span>
  );
}

export const LogPanel: React.FC<{ logs: DisasterLogEntry[] }> = ({ logs }) => {
  return (
    <div className="panel log-panel">
      <h3 className="panel-title">📋 灾害日志</h3>
      <div className="log-list">
        {logs.length === 0 && <div className="log-empty">暂无灾害记录</div>}
        {logs.map((entry) => (
          <div
            key={entry.id}
            className="log-entry"
            style={{ borderLeftColor: DISASTER_COLORS[entry.type] }}
          >
            <div className="log-entry-header">
              <span className="log-type">{DISASTER_LABELS[entry.type]}</span>
              <span className="log-zone">{ZONE_LABELS[entry.zone]}</span>
              {entry.relieved && <span className="log-relieved">✅ 已救灾</span>}
            </div>
            <div className="log-time">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
