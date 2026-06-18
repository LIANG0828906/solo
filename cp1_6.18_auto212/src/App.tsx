import { useEffect, useRef } from 'react';
import { CityScene } from '@/scenes/CityScene';
import type { HotSpot } from '@/scenes/CityScene';
import { useSoundStore } from '@/store/useSoundStore';
import { audioManager } from '@/engine/AudioManager';
import { Header } from '@/components/Header';
import { SoundPanel } from '@/components/SoundPanel';
import { SoundCard } from '@/components/SoundCard';
import { RecordDiscs } from '@/components/RecordDiscs';
import { Views } from '@/components/Views';

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<CityScene | null>(null);
  const activeHotspotRef = useRef<HotSpot | null>(null);

  const view = useSoundStore((s) => s.view);
  const showCardFor = useSoundStore((s) => s.showCardForHotspot);
  const setShowCardForHotspot = useSoundStore((s) => s.setShowCardForHotspot);
  const initFromPath = useSoundStore((s) => s.initFromPath);

  useEffect(() => {
    initFromPath();
  }, [initFromPath]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new CityScene(canvasRef.current);
    sceneRef.current = scene;
    scene.setOnHotspotClick((h) => {
      void audioManager.resumeContext();
      activeHotspotRef.current = h;
      setShowCardForHotspot(h.id);
    });
    scene.mount();
    const onFirstInteract = () => {
      void audioManager.resumeContext();
      window.removeEventListener('pointerdown', onFirstInteract);
    };
    window.addEventListener('pointerdown', onFirstInteract);
    return () => {
      scene.unmount();
      sceneRef.current = null;
      window.removeEventListener('pointerdown', onFirstInteract);
    };
  }, [setShowCardForHotspot]);

  const hotspotForCard = (() => {
    if (!showCardFor) return null;
    return CityScene.hotspots.find((h) => h.id === showCardFor) ?? null;
  })();

  return (
    <div className="app-root">
      <Header />
      <div className="stage">
        <div className="stage-inner">
          <canvas ref={canvasRef} className="scene-canvas" />
          <RecordDiscs canvasRef={canvasRef} />
          {hotspotForCard && <SoundCard hotspot={hotspotForCard} />}
          <Views view={view} />
        </div>
      </div>
      <SoundPanel />
    </div>
  );
}
