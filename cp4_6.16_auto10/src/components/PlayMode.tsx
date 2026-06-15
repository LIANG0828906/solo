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
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handlePrev, handleNext, handleClose, selectedInteraction]);

  if (!currentSlide) return null;

  const renderNotes = (notes: string) => {
    try {
      return { __html: marked.parse(notes) as string };
    } catch {
      return { __html: notes.replace(/\n/g, '<br>') };
    }
  };

  const getSlideAnimation = () => {
    if (isTransitioning) {
      return slideDirection === 'next'
        ? { animation: 'slideOutLeft 0.3s ease forwards' }
        : { animation: 'slideOutRight 0.3s ease forwards' };
    }
    return { animation: 'slideIn 0.4s ease forwards' };
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1a2e] overflow-hidden">
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .notes-content h1 { font-size: 24px; font-weight: 600; margin-bottom: 12px; color: #FF6B35; }
        .notes-content h2 { font-size: 20px; font-weight: 600; margin-bottom: 10px; color: #FF6B35; }
        .notes-content h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #FF6B35; }
        .notes-content p { margin-bottom: 8px; line-height: 1.6; color: #ccc; }
        .notes-content strong { font-weight: 600; color: #fff; }
        .notes-content em { font-style: italic; }
        .notes-content ul { padding-left: 20px; margin-bottom: 8px; }
        .notes-content li { margin-bottom: 4px; color: #ccc; }
      `}</style>

      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-[#FF6B35] to-[#F7C59F] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={24} />
      </button>

      <button
        onClick={handlePrev}
        disabled={currentSlideIndex === 0 || isTransitioning}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={handleNext}
        disabled={currentSlideIndex === totalSlides - 1 || isTransitioning}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={32} />
      </button>

      <div
        className="h-full flex flex-col lg:flex-row items-center justify-center p-8 gap-8"
        style={getSlideAnimation()}
      >
        <div className="w-full lg:w-1/2 aspect-video max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <ChartPreview
            config={currentSlide.chartConfig}
            onDataPointClick={handleDataPointClick}
          />
        </div>

        <div className="w-full lg:w-1/2 max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-6">
            {currentSlide.chartConfig.title}
          </h2>
          <div
            className="notes-content text-lg"
            dangerouslySetInnerHTML={renderNotes(currentSlide.notes)}
          />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <span className="text-white/60 text-sm">
          {currentSlideIndex + 1} / {totalSlides}
        </span>
      </div>

      {selectedInteraction && (
        <DataPointModal
          interaction={selectedInteraction}
          onClose={() => setSelectedInteraction(null)}
        />
      )}
    </div>
  );
};

export default PlayMode;
