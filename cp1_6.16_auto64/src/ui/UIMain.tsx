import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ForestRenderer } from '../visualization/forestRenderer';
import { EcosystemEngine } from '../ecosystem/ecosystemEngine';
import { SpeciesInfo } from './SpeciesInfo';
import type { ForestStatistics } from '../ecosystem/ecosystemEngine';

export const UIMain: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ForestRenderer | null>(null);
  const engineRef = useRef<EcosystemEngine | null>(null);
  const isSimulatingRef = useRef(false);
  const iterationTimerRef = useRef<number | null>(null);
  const lastIterationRef = useRef<number>(0);

  const [treeDensity, setTreeDensity] = useState(50);
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [precipitation, setPrecipitation] = useState(1.0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statistics, setStatistics] = useState<ForestStatistics>({
    totalCount: 0,
    speciesCount: {},
    averageHeight: 0,
    dominantSpecies: null,
  });

  const updateStatistics = useCallback(() => {
    if (engineRef.current) {
      setStatistics(engineRef.current.getStatistics());
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new EcosystemEngine();
    engineRef.current = engine;

    const renderer = new ForestRenderer(containerRef.current);
    rendererRef.current = renderer;

    renderer.updateTrees(engine.getTreesSnapshot());
    updateStatistics();

    const onAnimationFrame = (deltaTime: number) => {
      if (!engineRef.current || !rendererRef.current) return;

      engineRef.current.updateAnimation(deltaTime);
      rendererRef.current.updateTrees(engineRef.current.getTreesSnapshot());

      if (isSimulatingRef.current) {
        const now = performance.now();
        if (now - lastIterationRef.current >= 1000) {
          engineRef.current.iterate();
          lastIterationRef.current = now;
          setStatistics(engineRef.current.getStatistics());
        }
      }
    };

    renderer.startAnimationLoop(onAnimationFrame);

    return () => {
      if (iterationTimerRef.current) {
        clearInterval(iterationTimerRef.current);
      }
      renderer.dispose();
      rendererRef.current = null;
      engineRef.current = null;
    };
  }, [updateStatistics]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setLightIntensity(lightIntensity);
    }
  }, [lightIntensity]);

  const handleStartSimulation = () => {
    if (isSimulating) {
      isSimulatingRef.current = false;
      setIsSimulating(false);
    } else {
      if (engineRef.current) {
        engineRef.current.setEnvironment({
          lightIntensity,
          precipitation,
        });
      }
      isSimulatingRef.current = true;
      lastIterationRef.current = performance.now();
      setIsSimulating(true);
    }
  };

  const handleReset = () => {
    if (!engineRef.current || !rendererRef.current) return;

    isSimulatingRef.current = false;
    setIsSimulating(false);

    if (iterationTimerRef.current) {
      clearInterval(iterationTimerRef.current);
      iterationTimerRef.current = null;
    }

    engineRef.current.initialize(treeDensity);
    engineRef.current.setEnvironment({
      lightIntensity,
      precipitation,
    });
    rendererRef.current.updateTrees(engineRef.current.getTreesSnapshot());
    updateStatistics();
  };

  const handleDensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTreeDensity(value);
  };

  const handleLightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLightIntensity(value);
  };

  const handlePrecipitationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setPrecipitation(value);
  };

  useEffect(() => {
    if (engineRef.current && !isSimulating) {
      engineRef.current.setEnvironment({
        lightIntensity,
        precipitation,
      });
    }
  }, [lightIntensity, precipitation]);

  return (
    <div className="app-container">
      <div className="control-panel">
        <h1 className="panel-title">森林生态演替模拟</h1>
        <p className="panel-description">
          调整环境参数，观察不同树种在光照、降水影响下的生长与竞争过程
        </p>

        <div className="control-section">
          <div className="slider-group">
            <label className="slider-label">
              <span>树木密度</span>
              <span className="slider-value">{treeDensity} 棵</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={treeDensity}
              onChange={handleDensityChange}
              className="custom-slider"
              disabled={isSimulating}
            />
            <div className="slider-range">
              <span>10</span>
              <span>100</span>
            </div>
          </div>

          <div className="slider-group">
            <label className="slider-label">
              <span>光照强度</span>
              <span className="slider-value">{lightIntensity.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.01"
              value={lightIntensity}
              onChange={handleLightChange}
              className="custom-slider"
            />
            <div className="slider-range">
              <span>弱</span>
              <span>强</span>
            </div>
          </div>

          <div className="slider-group">
            <label className="slider-label">
              <span>降水系数</span>
              <span className="slider-value">{precipitation.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.01"
              value={precipitation}
              onChange={handlePrecipitationChange}
              className="custom-slider"
            />
            <div className="slider-range">
              <span>干旱</span>
              <span>湿润</span>
            </div>
          </div>
        </div>

        <div className="button-group">
          <button
            className={`action-btn primary ${isSimulating ? 'stop' : ''}`}
            onClick={handleStartSimulation}
          >
            {isSimulating ? '暂停模拟' : '开始模拟'}
          </button>
          <button className="action-btn secondary" onClick={handleReset}>
            重置
          </button>
        </div>

        <SpeciesInfo statistics={statistics} />
      </div>

      <div className="viewport-container" ref={containerRef} />
    </div>
  );
};

export default UIMain;
