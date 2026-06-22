import React, { useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useSimulationStore } from './store/useSimulationStore';
import Header from './components/Header';
import TerminalView from './components/码头视图/TerminalView';
import Dashboard from './components/调度数据/Dashboard';
import './App.css';

const App: React.FC = () => {
  const { tick, assignShipToBerth, generateShip, isRunning } = useSimulationStore();
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;

      tick(deltaTime);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [tick]);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        generateShip();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isRunning, generateShip]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.ship) {
      const shipId = active.id as string;
      const berthId = over.id as string;
      assignShipToBerth(shipId, berthId);
    }
  };

  const handleDragStart = (_event: DragStartEvent) => {
  };

  return (
    <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className="app">
        <Header />
        
        <main className="main-content">
          <TerminalView />
        </main>
        
        <Dashboard />
      </div>
    </DndContext>
  );
};

export default App;
