import { useEffect, useRef } from 'react';
import { SceneManager } from '@/renderer/sceneManager';
import { ControlPanel } from '@/components/ControlPanel';
import { InfoCard } from '@/components/InfoCard';
import { useAppStore } from '@/stores/appStore';
import type { BoneNode } from '@/data/speciesData';
import './App.css';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    selectedSpecies,
    density,
    thickness,
    showLabels,
    pointCloudData,
    selectedNode,
    isLoading,
    setSelectedNode,
  } = useAppStore();

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const sceneManager = new SceneManager(canvasContainerRef.current);
    sceneManagerRef.current = sceneManager;

    sceneManager.setOnNodeClick((node: BoneNode | null) => {
      setSelectedNode(node);
    });

    sceneManager.loadSpecies(selectedSpecies, density, thickness, showLabels);

    return () => {
      sceneManager.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneManagerRef.current) return;

    if (pointCloudData) {
      sceneManagerRef.current.loadPointCloud(pointCloudData, density, thickness);
    } else {
      sceneManagerRef.current.loadSpecies(selectedSpecies, density, thickness, showLabels);
    }
  }, [selectedSpecies, pointCloudData]);

  useEffect(() => {
    if (!sceneManagerRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      sceneManagerRef.current?.updateParams(density, thickness, showLabels);
    }, 100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [density, thickness, showLabels]);

  return (
    <div className="app-container">
      <div className="control-panel-wrapper">
        <ControlPanel />
      </div>
      <div className="scene-container">
        <div ref={canvasContainerRef} className="canvas-container" />
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>正在生成骨骼模型...</p>
          </div>
        )}
      </div>
      <InfoCard node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
