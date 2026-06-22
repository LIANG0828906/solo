import React, { useEffect, useRef, useState } from 'react';
import { HeatMapScene } from './HeatMapScene';
import UIDataPanel from './UIDataPanel';
import { getInitialData, updateData } from './dataGenerator';
import type { BlockData, GlobalStats, HeatMapSceneCallbacks } from './types';
import './index.css';

const calculateStats = (blockData: BlockData[]): GlobalStats => {
  const total = blockData.reduce((sum, block) => sum + block.pollutionIndex, 0);
  const average = total / blockData.length;
  const highest = blockData.reduce((prev, current) => 
    prev.pollutionIndex > current.pollutionIndex ? prev : current
  );
  return {
    averagePollution: Math.round(average * 10) / 10,
    highestBlockName: highest.name
  };
};

const App: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HeatMapScene | null>(null);
  const blocksRef = useRef<BlockData[]>([]);
  const selectedBlockIdRef = useRef<number | null>(null);
  const isPanelOpenRef = useRef(false);
  
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    averagePollution: 0,
    highestBlockName: ''
  });
  const [fps, setFps] = useState(60);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const initialData = getInitialData();
    blocksRef.current = initialData;
    setBlocks(initialData);
    setGlobalStats(calculateStats(initialData));

    const callbacks: HeatMapSceneCallbacks = {
      onBlockHover: (blockId: number | null) => {
        if (sceneRef.current) {
          sceneRef.current.setHoveredBlock(blockId);
        }
      },
      onBlockClick: (blockId: number) => {
        const block = blocksRef.current.find(b => b.id === blockId);
        if (block) {
          selectedBlockIdRef.current = blockId;
          setSelectedBlock(block);
          isPanelOpenRef.current = true;
          setIsPanelOpen(true);
          if (sceneRef.current) {
            sceneRef.current.setSelectedBlock(blockId);
          }
        }
      },
      onBackgroundClick: () => {
        selectedBlockIdRef.current = null;
        isPanelOpenRef.current = false;
        setIsPanelOpen(false);
        setSelectedBlock(null);
        if (sceneRef.current) {
          sceneRef.current.setSelectedBlock(null);
        }
      },
      onFpsUpdate: (newFps: number) => {
        setFps(newFps);
      }
    };

    const scene =