import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EventCard } from './EventCard';
import { useTimelineStore } from '../store';
import type { HistoryEvent } from '../types';

export const Timeline: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const yearRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  const {
    expandedYears,
    highlightedEventId,
    scrollToYear,
    toggleYear,
    toggleFavorite,
    toggleCompare,
    setHighlightedEvent,
    setScrollToYear,
    getFilteredEvents,
  } = useTimelineStore();

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  const filteredEvents = useMemo(() => getFilteredEvents(), [getFilteredEvents]);

  const eventsByYear = useMemo(() => {
    const map = new Map<number, HistoryEvent[]>();
    filteredEvents.forEach((event) => {
      if (!map.has(event.year)) {
        map.set(event.year, []);
      }
      map.get(event.year)!.push(event);
    });
    return map;
  }, [filteredEvents]);

  const years = useMemo(() => {
    return Array.from(eventsByYear.keys()).sort((a, b) => a - b;
  }, [eventsByYear]);

  const checkScrollEdges = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let velocity = 0;
    let animationFrame: number | null = null;
    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      velocity += e.deltaY * 0.8;
      velocity = Math.max(-100, Math.min(100, velocity));

      const animate = () => {
        if (!el) return;
        el.scrollLeft += velocity;
        velocity *= 0.92;

        if (Math.abs(velocity) > 0.5) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          animationFrame = null;
        }
      };

      animationFrame = requestAnimationFrame(animate);

      if (wheelTimeout) clearTimeout(wheelTimeout);
      setIsScrolling(true);
      wheelTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('scroll', checkScrollEdges);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('scroll', checkScrollEdges);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [checkScrollEdges]);

  useEffect(() => {
    checkScrollEdges();
  }, [years, checkScrollEdges]);

  useEffect(() => {
    if (scrollToYear !== null && yearRefs.current.has(scrollToYear)) {
      const yearEl = yearRefs.current.get(scrollToYear);
      const container = scrollContainerRef.current;
      if (yearEl && container) {
        const targetLeft = yearEl.offsetLeft - container.clientWidth / 2 + yearEl.clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: 'smooth',
        });
      }
      setScrollToYear(null);
    }
  }, [scrollToYear, setScrollToYear]);

  useEffect(() => {
    if (highlightedEventId) {
      const timer = setTimeout(() => {
        setHighlightedEvent(null);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [highlightedEventId, setHighlightedEvent]);

  const scrollByPage = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleToggleYear = (year: number) => {
    toggleYear(year);
  };

  return (
    <div className="timeline-wrapper">
      <button
        className={`nav-arrow nav-arrow-left ${showLeftArrow ? 'visible' : ''}`}
        onClick={() => scrollByPage('left')}
      >
        <ChevronLeft size={24} />
      </button>

      <div
        ref={scrollContainerRef}
        className={`timeline-container ${isScrolling ? 'scrolling' : ''}
      >
        <div className="timeline-track">
          <div className="timeline-line" />
          
          {years.map((year) => {
            const yearEvents = eventsByYear.get(year) || [];
            const isExpanded = expandedYears.includes(year);
            
            return (
              <div
                key={year}
                ref={(el) => {
                  if (el) yearRefs.current.set(year, el);
                }}
                className={`year-node ${isExpanded ? 'expanded' : ''}`}
              >
                <button
                  className="year-dot"
                  onClick={() => handleToggleYear(year)}
                >
                  <span className="dot-inner">
                    {yearEvents.length}
                  </span>
                </button>
                <span className="year-label">{year}</span>

                {isExpanded && (
                  <div className="event-cards-container">
                    {yearEvents.map((event, idx) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isFavorite={useTimelineStore.getState().favorites.includes(event.id)}
                        isInCompare={useTimelineStore.getState().compareList.includes(event.id)}
                        isHighlighted={highlightedEventId === event.id}
                        onToggleFavorite={() => toggleFavorite(event.id)}
                        onToggleCompare={() => toggleCompare(event.id)}
                        index={idx}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        className={`nav-arrow nav-arrow-right ${showRightArrow ? 'visible' : ''}`}
        onClick={() => scrollByPage('right')}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};
