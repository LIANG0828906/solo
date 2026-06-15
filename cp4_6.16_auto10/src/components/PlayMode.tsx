import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { marked } from 'marked';
import type { Slide, DataPointInteraction } from '@/types';
import { useStoryStore } from '@/store/useStoryStore';
import ChartPreview from './ChartPreview';
import DataPointModal from './DataPointModal';

const PlayMode: React.FC = () => {
  const { story, currentSlideIndex, setCurrentSlideIndex, setPlayMode } = useStoryStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<DataPointInteraction | null>(null);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');

  const currentSlide = story.slides[currentSlideIndex];
  const totalSlides = story.slides.length;
  const progress = totalSlides > 0 ? ((currentSlideIndex + 1) / totalSlides) * 100 : 0;

  const goToSlide = useCallback(
    (index: number, direction: 'next' | 'prev') => {
      if (isTransitioning || index < 0 || index >= totalSlides) return;
      setSlideDirection(direction);
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlideIndex(index);
        setIsTransitioning(false);
      }, 300);
    },
    [isTransitioning, totalSlides, setCurrentSlideIndex]
  );

  const handlePrev = useCallback(() => {
    goToSlide(currentSlideIndex - 1, 'prev');
  }, [currentSlideIndex, goToSlide]);

  const handleNext = useCallback(() => {
    goToSlide(currentSlideIndex + 1, 'next');
  }, [currentSlideIndex, goToSlide]);

  const handleClose = useCallback(() => {
    setPlayMode(false);
  }, [setPlayMode]);

  const handleDataPointClick = useCallback(
    (index: number) => {
      if (!currentSlide) return;
      const interaction = currentSlide.interactions.find((i) => i.dataIndex === index);
      if (interaction) {
        setSelectedInteraction(interaction);
      }
    },
    [currentSlide]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedInteraction) {
        if (e.key === 'Escape') {
          setSelectedInteraction(null);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handle