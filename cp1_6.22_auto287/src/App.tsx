import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EcosystemSimulator, IslandStatus } from './modules/EcosystemSimulator';
import { DisasterManager, DisasterType, DisasterLogEntry } from './modules/DisasterManager';
import { EventBus } from './events/EventBus';
import { IslandMap } from './components/IslandMap';
import { StatusPanel, LogPanel } from './components/Panel';
import './styles.css';

const eco = new EcosystemSimulator();
const disasterMgr = new DisasterManager(eco);

type ZoneKey = 'forest' | 'desert' | 'glacier';

const ACTION_RESOURCE_MAP: Record<string, { zone: ZoneKey; resource: 'wood' | 'water' | 'ore'; amount: number }> = {
  harvest: { zone: 'forest', resource: 'wood', amount: 8 },
  mine: { zone: 'desert', resource: 'ore', amount: 8 },
  collect: { zone: 'glacier', resource: 'water', amount: 8 },
};

const App: React.FC = () => {
  const [status, setStatus] = useState<IslandStatus>(eco.getStatus());
  const [logs, setLogs] = useState<DisasterLogEntry[]>([]);
  const [activeDisasters, setActiveDisasters] = useState<Map<string, DisasterType>>(new Map());

  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    disasterMgr.setLogUpdateCallback(setLogs);
    disasterMgr.startDisasterLoop();
    return () => disasterMgr.stopDisasterLoop();
  }, []);

  useEffect(() => {
    const onDisaster = (data: unknown) => {
      const evt = data as { type: DisasterType; zone: ZoneKey };
      setActiveDisasters((prev) => {
        const next = new Map(prev);
        next.set(evt.zone, evt.type);
        return next;
      });
    };

    const unsubDisaster = EventBus.on('disasterOccurred', onDisaster);

    return () => {
      EventBus.off('disasterOccurred', unsubDisaster);
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (dt > 0 && dt < 1) {
        eco.updateResources(dt);
        setStatus(eco.getStatus());
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleZoneAction = useCallback((zone: ZoneKey, action: 'harvest' | 'mine' | 'collect') => {
    const mapping = ACTION_RESOURCE_MAP[action];
    if (mapping) {
      eco.consumeResource(mapping.zone, mapping.resource, mapping.amount);
      setStatus(eco.getStatus());
    }
  }, []);

  const handleRelief = useCallback((type: DisasterType) => {
    const success = disasterMgr.handleRelief(type);
    if (success) {
      const effect = { fire: 'forest', flood: 'glacier', drought: 'desert' } as const;
      const zone = effect[type];
      setActiveDisasters((prev) => {
        const next = new Map(prev);
        next.delete(zone);
        return next;
      });
      setStatus(eco.getStatus());
    }
  }, []);

  return (
    <div className="app-layout">
      <LogPanel logs={logs} />

      <div className="center-area">
        <h1 className="island-title">Floating Island Ecosystem</h1>
        <IslandMap
          status={status}
          activeDisasters={activeDisasters}
          onZoneAction={handleZoneAction}
          onRelief={handleRelief}
        />
      </div>

      <StatusPanel status={status} />

      <div className="bottom-panels">
        <LogPanel logs={logs} />
        <StatusPanel status={status} />
      </div>
    </div>
  );
};

export default App;
