import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Star, Thermometer, Ruler, Sparkles, ChevronRight, Plus } from 'lucide-react';
import { useStarStore } from '../store/useStarStore';
import { getNearbyBrightStars } from '../utils/stardata';
import { StarData } from '../types';

export default function InfoPanel() {
  const { selectedStar, setSelectedStar, stars, flyToStar, isCreatingCluster, clusterStarIds, addStarToCluster, removeStarFromCluster } = useStarStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [starScreenPos, setStarScreenPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (selectedStar) {
      setIsVisible(false);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [selectedStar]);

  useEffect(() => {
    if (!selectedStar) return;

    const updatePosition = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      
      const x = rect.width * 0.75;
      const y = rect.height * 0.45;
      
      setStarScreenPos({ x: rect.left + rect.width