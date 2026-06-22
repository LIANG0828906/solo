import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '@/scene/SceneManager';
import { LightSource, LightSourceData, LightType } from '@/scene/LightSource';
import { EventBus, Events } from '@/events/EventBus';
import LightControlPanel from '@/components/LightControlPanel';
import SavedSchemesPanel, { SchemeData } from '@/components/SavedSchemesPanel';

const App: React.FC = () => {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const crossfadeRef = useRef<HTMLDivElement>(null);

  const [lights, setLights] = useState<LightSourceData[]>([]);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<SchemeData[]>([]);
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCompact = windowWidth < 1024;

  useEffect(() => {
    if (!sceneContainerRef.current) return;
    const sm = new SceneManager();
    sm.init(sceneContainerRef.current);
    sceneManagerRef.current = sm;

    const unsub1 = EventBus.on(Events.SCENE_DRAG_UPDATE, (payload: any) => {
      const { id, position } = payload;
      setLights((prev) =>
        prev.map((l) => (l.id === id ? { ...l, position: [...position] as [number, number, number] } : l))
      );
    });

    const unsub2 = EventBus.on(Events.SCENE_LIGHT_CLICK, (payload: any) => {
      const { id } = payload;
      setSelectedLightId((prev) => {
        const newId = prev === id ? null : id;
        sceneManagerRef.current?.selectLight(newId);
        return newId;
      });
    });

    return () => {
      unsub1();
      unsub2();
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneContainerRef.current || !sceneManagerRef.current) return;
    sceneManagerRef.current.resize();
  }, [leftPanelOpen, isCompact]);

  const handleAddLight = useCallback(
    (type: LightType) => {
      if (lights.length >= 6) return;
      const ls = new LightSource(type);
      const offsetX = (Math.random() - 0.5) * 4;
      const offsetZ = (Math.random() - 0.5) * 3;
      ls.data.position = [
        Math.round(offsetX * 10) / 10,
        type === 'directional' ? 2.5 : 2.0,
        Math.round(offsetZ * 10) / 10,
      ];
      const data = { ...ls.data };
      sceneManagerRef.current?.addLight(data);
      setLights((prev) => [...prev, data]);
      setSelectedLightId(data.id);
    },
    [lights.length]
  );

  const handleDeleteLight = useCallback((id: string) => {
    sceneManagerRef.current?.removeLight(id);
    sceneManagerRef.current?.selectLight(null);
    setLights((prev) => prev.filter((l) => l.id !== id));
    setSelectedLightId((prev) => (prev === id ? null : prev));
  }, []);

  const handleUpdateLight = useCallback(
    (id: string, updates: Partial<LightSourceData>) => {
      sceneManagerRef.current?.updateLight(id, updates);
      setLights((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const merged = { ...l, ...updates };
          if (updates.position) {
            merged.position = [...updates.position] as [number, number, number];
          }
          return merged;
        })
      );
    },
    []
  );

  const handleSelectLight = useCallback((id: string | null) => {
    sceneManagerRef.current?.selectLight(id);
    setSelectedLightId(id);
  }, []);

  const handleSaveScheme = useCallback(
    (label: string) => {
      const sm = sceneManagerRef.current;
      if (!sm) return;
      const thumbnail = sm.captureTopDownThumbnail(100, 70);
      const scheme: SchemeData = {
        id: crypto.randomUUID(),
        label,
        lights: lights.map((l) => ({ ...l, position: [...l.position] as [number, number, number] })),
        thumbnail,
      };
      setSchemes((prev) => [...prev, scheme]);
      setActiveSchemeId(scheme.id);
    },
    [lights]
  );

  const handleDeleteScheme = useCallback((schemeId: string) => {
    setSchemes((prev) => prev.filter((s) => s.id !== schemeId));
    setActiveSchemeId((prev) => (prev === schemeId ? null : prev));
  }, []);

  const handleSwitchScheme = useCallback(
    (schemeId: string) => {
      const scheme = schemes.find((s) => s.id === schemeId);
      if (!scheme) return;

      const sm = sceneManagerRef.current;
      if (!sm) return;

      const currentView = sm.captureCurrentView();

      const overlay = crossfadeRef.current;
      if (overlay) {
        overlay.style.backgroundImage = `url(${currentView})`;
        overlay.style.backgroundSize = 'cover';
        overlay.style.backgroundPosition = 'center';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }

      sm.applyLights(scheme.lights);
      setLights(
        scheme.lights.map((l) => ({ ...l, position: [...l.position] as [number, number, number] }))
      );
      setSelectedLightId(null);
      sm.selectLight(null);
      setActiveSchemeId(schemeId);

      requestAnimationFrame(() => {
        if (overlay) {
          overlay.style.opacity = '0';
        }
      });

      setTimeout(() => {
        if (overlay) {
          overlay.style.pointerEvents = 'none';
        }
      }, 550);
    },
    [schemes]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#1a1a1a',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isCompact && !leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 100,
            width: 40,
            height: 40,
            borderRadius: 8,
            background: '#4A90D9',
            color: '#fff',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          ☰
        </button>
      )}

      {isCompact && leftPanelOpen && (
        <div
          onClick={() => setLeftPanelOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      <div
        style={{
          position: isCompact && leftPanelOpen ? 'fixed' : 'relative',
          left: isCompact && leftPanelOpen ? 0 : undefined,
          top: isCompact && leftPanelOpen ? 0 : undefined,
          zIndex: isCompact && leftPanelOpen ? 60 : 'auto',
          height: '100%',
          transform:
            isCompact && !leftPanelOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.2s ease',
        }}
      >
        <LightControlPanel
          lights={lights}
          selectedLightId={selectedLightId}
          onAdd={handleAddLight}
          onDelete={handleDeleteLight}
          onUpdate={handleUpdateLight}
          onSelect={handleSelectLight}
        />
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          minWidth: 0,
        }}
      >
        <div
          ref={sceneContainerRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        <div
          ref={crossfadeRef}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.5s ease',
            zIndex: 10,
          }}
        />

        {lights.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              background: 'rgba(30,30,30,0.8)',
              backdropFilter: 'blur(4px)',
              padding: '6px 12px',
              borderRadius: 6,
              color: '#aaa',
              fontSize: 11,
              pointerEvents: 'none',
            }}
          >
            拖拽发光球体调整光源位置 | 鼠标右键旋转视角
          </div>
        )}
      </div>

      <SavedSchemesPanel
        schemes={schemes}
        onSave={handleSaveScheme}
        onDelete={handleDeleteScheme}
        onSwitch={handleSwitchScheme}
        activeSchemeId={activeSchemeId}
      />
    </div>
  );
};

export default App;
