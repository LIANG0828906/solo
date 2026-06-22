import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SceneManager } from './SceneManager';
import type { BuildingData, SceneState } from './SceneManager';
import UIControls from './UIControls';
import './App.css';

interface Preset {
  id: string;
  name: string;
  description: string;
  time: number;
  season: string;
  weather: string;
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  
  const [time, setTime] = useState(12);
  const [season, setSeason] = useState('summer');
  const [weather, setWeather] = useState('sunny');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new SceneManager(containerRef.current);
    sceneManagerRef.current = sceneManager;

    const fetchData = async () => {
      try {
        const [buildingsRes, presetsRes] = await Promise.all([
          fetch('/api/buildings?count=30'),
          fetch('/api/presets')
        ]);
        
        const buildingData: BuildingData[] = await buildingsRes.json();
        const presetsData: Preset[] = await presetsRes.json();
        
        sceneManager.setBuildingData(buildingData);
        setPresets(presetsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
      }
    };
  }, []);

  const handleTimeChange = useCallback((newTime: number) => {
    setTime(newTime);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setState({ time: newTime }, false);
    }
  }, []);

  const handleSeasonChange = useCallback((newSeason: string) => {
    setSeason(newSeason);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setState({ season: newSeason }, true);
    }
  }, []);

  const handleWeatherChange = useCallback((newWeather: string) => {
    setWeather(newWeather);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setState({ weather: newWeather }, true);
    }
  }, []);

  const handleSavePreset = useCallback(async (presetData: {
    name: string;
    description: string;
    time: number;
    season: string;
    weather: string;
  }) => {
    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(presetData),
      });
      
      if (response.ok) {
        const newPreset = await response.json();
        setPresets(prev => [...prev, newPreset]);
      }
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  }, []);

  const handleLoadPreset = useCallback((preset: Preset) => {
    setTime(preset.time);
    setSeason(preset.season);
    setWeather(preset.weather);
    
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setState(
        { 
          time: preset.time, 
          season: preset.season, 
          weather: preset.weather 
        },
        true
      );
    }
  }, []);

  return (
    <div className="app-container">
      <div ref={containerRef} className="scene-container" />
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">加载场景中...</div>
        </div>
      )}
      
      <div className="title-bar">
        <h1 className="app-title">SkylineMorph</h1>
        <p className="app-subtitle">城市光影艺术展览</p>
      </div>
      
      <UIControls
        time={time}
        season={season}
        weather={weather}
        onTimeChange={handleTimeChange}
        onSeasonChange={handleSeasonChange}
        onWeatherChange={handleWeatherChange}
        presets={presets}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
      />
    </div>
  );
}

export default App;
