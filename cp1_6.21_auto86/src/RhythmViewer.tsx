import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { generateTimeline, RHYTHM_PATTERNS } from './utils/rhythmCalculator';
import {
  BEAT_WIDTH,
  MAX_BEATS,
  SLIDER_WIDTH,
  ANIMATION_DURATIONS,
} from './utils/constants';
import type { Note } from './utils/chordParser';
import { getNoteFrequency } from './utils/chordParser';

const RhythmViewer: React.FC = () => {
  const {
    chordSequence,
    selectedPattern,
    currentTime,
    isPlaying,
    tempo,
    totalBeats,
    currentSliderPosition,
    setSelectedPattern,
    setCurrentTime,
    setCurrentSliderPosition,
    setActiveNotes,
  } = useStore();

  const sliderRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedBeat, setHighlightedBeat] = useState<number | null>(null);

  const timelineBlocks = useMemo(() => {
    return generateTimeline(chordSequence, selectedPattern, totalBeats);
  }, [chordSequence, selectedPattern, totalBeats]);

  const subBeatCount = selectedPattern.beatPattern.length;
  const beatsPerMeasure = parseInt(selectedPattern.timeSignature.split('/')[0]);
  const subBeatDuration = (beatsPerMeasure / 4) * 4 / subBeatCount;
  const subBeatWidth = BEAT_WIDTH * subBeatDuration;

  const playClickSound = useCallback(
    (frequency: number = 800, duration: number = 0.05) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    },
    []
  );

  const handleSliderDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      updateSliderPosition(e);
    },
    []
  );

  const updateSliderPosition = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      let clientX: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const position = (x / rect.width) * totalBeats;
      const snappedPosition = Math.round(position / subBeatDuration) * subBeatDuration;

      setCurrentSliderPosition(snappedPosition);

      const beatIndex = Math.floor(snappedPosition / subBeatDuration) % subBeatCount;
      setHighlightedBeat(beatIndex);

      const frequency = beatIndex === 0 ? 1000 : 800;
      playClickSound(frequency);
    },
    [totalBeats, subBeatDuration, setCurrentSliderPosition, playClickSound]
  );

  const handleSliderMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      updateSliderPosition(e as unknown as React.MouseEvent | React.TouchEvent);
    },
    [isDragging, updateSliderPosition]
  );

  const handleSliderUp = useCallback(() => {
    setIsDragging(false);
    setHighlightedBeat(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleSliderMove);
      window.addEventListener('mouseup', handleSliderUp);
      window.addEventListener('touchmove', handleSliderMove);
      window.addEventListener('touchend', handleSliderUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleSliderMove);
      window.removeEventListener('mouseup', handleSliderUp);
      window.removeEventListener('touchmove', handleSliderMove);
      window.removeEventListener('touchend', handleSliderUp);
    };
  }, [isDragging, handleSliderMove, handleSliderUp]);

  useEffect(() => {
    if (isDragging) {
      const activeBlock = timelineBlocks.find(
        (block) =>
          currentSliderPosition >= block.startTime &&
          currentSliderPosition < block.startTime + block.duration
      );

      if (activeBlock?.chordId) {
        const chord = chordSequence.find((c) => c.id === activeBlock.chordId);
        if (chord) {
          setActiveNotes(chord.notes);
        }
      } else {
        setActiveNotes([]);
      }
    }
  }, [currentSliderPosition, isDragging, timelineBlocks, chordSequence, setActiveNotes]);

  const handleApplyPattern = useCallback(
    (patternId: string) => {
      const pattern = RHYTHM_PATTERNS.find((p) => p.id === patternId);
      if (pattern) {
        setSelectedPattern(pattern);
      }
    },
    [setSelectedPattern]
  );

  const renderBeatMarkers = () => {
    const markers = [];
    for (let i = 0; i <= totalBeats; i++) {
      const x = (i / totalBeats) * SLIDER_WIDTH;
      const isMeasure = i % beatsPerMeasure === 0;
      const isHighlighted =
        highlightedBeat !== null &&
        Math.floor(currentSliderPosition) === i;

      markers.push(
        <div
          key={i}
          className="absolute transition-all"
          style={{
            left: x,
            top: isMeasure ? -8 : -4,
            width: isMeasure ? 2 : 1,
            height: isMeasure ? 24 : 16,
            backgroundColor: isHighlighted
              ? 'var(--success)'
              : isMeasure
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
            transform: 'translateX(-50%)',
            borderRadius: 1,
            boxShadow: isHighlighted ? '0 0 8px var(--success)' : 'none',
            transitionDuration: `${ANIMATION_DURATIONS.fast}ms`,
          }}
        />
      );

      if (i < totalBeats && (i % beatsPerMeasure === 0 || i === 0)) {
        markers.push(
          <div
            key={`label-${i}`}
            className="absolute text-xs transition-all"
            style={{
              left: x + 4,
              top: -24,
              color: isHighlighted ? 'var(--success)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              transitionDuration: `${ANIMATION_DURATIONS.fast}ms`,
            }}
          >
            {Math.floor(i / beatsPerMeasure) + 1}
          </div>
        );
      }
    }
    return markers;
  };

  const renderTimeline = () => {
    return timelineBlocks.map((block, index) => {
      const left = (block.startTime / totalBeats) * SLIDER_WIDTH;
      const width = (block.duration / totalBeats) * SLIDER_WIDTH;

      return (
        <div
          key={index}
          className="absolute h-full transition-all"
          style={{
            left,
            width: width - 1,
            backgroundColor: block.color,
            borderRight: '1px solid rgba(255,255,255,0.3)',
            transitionDuration: `${ANIMATION_DURATIONS.normal}ms`,
            opacity: block.chordId ? 0.9 : 0,
          }}
        />
      );
    });
  };

  const displayPosition = isPlaying ? currentTime : currentSliderPosition;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">节奏编排</h2>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>速度:</span>
          <span className="font-mono text-[var(--accent-primary)] font-bold">
            {tempo} BPM
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {RHYTHM_PATTERNS.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => handleApplyPattern(pattern.id)}
            className="px-4 py-2 rounded-full font-medium text-sm transition-all hover:scale-105"
            style={{
              width: '120px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor:
                selectedPattern.id === pattern.id
                  ? 'var(--panel-selected)'
                  : 'var(--panel-bg)',
              color:
                selectedPattern.id === pattern.id
                  ? 'var(--accent-primary)'
                  : 'var(--bg-primary)',
              border:
                selectedPattern.id === pattern.id
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
            }}
          >
            {pattern.name}
          </button>
        ))}
      </div>

      <div className="relative">
        <div
          ref={sliderRef}
          className="relative cursor-pointer select-none"
          style={{
            width: SLIDER_WIDTH,
            maxWidth: '100%',
            margin: '32px auto 0',
          }}
          onMouseDown={handleSliderDown}
          onTouchStart={handleSliderDown}
        >
          {renderBeatMarkers()}

          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{
              height: '32px',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          >
            {renderTimeline()}

            <div
              className="absolute top-0 bottom-0 w-0.5 transition-all pointer-events-none z-10"
              style={{
                left: `${(displayPosition / totalBeats) * 100}%`,
                backgroundColor: 'var(--success)',
                boxShadow: '0 0 10px var(--success)',
                transitionDuration: isDragging
                  ? `${ANIMATION_DURATIONS.fast}ms`
                  : '100ms',
              }}
            >
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full transition-all"
                style={{
                  width: '20px',
                  height: '20px',
                  background:
                    'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  boxShadow: isDragging
                    ? '0 0 20px rgba(108, 99, 255, 0.6)'
                    : '0 2px 8px rgba(0,0,0,0.3)',
                  transform: `translateX(-50%) scale(${isDragging ? 1.1 : 1})`,
                  transitionDuration: `${ANIMATION_DURATIONS.fast}ms`,
                }}
              />
            </div>
          </div>

          <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)]">
            <span>0拍</span>
            <span>{totalBeats / 2}拍</span>
            <span>{totalBeats}拍</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--chord-major)' }}
          />
          <span className="text-[var(--text-secondary)]">大三和弦</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--chord-minor)' }}
          />
          <span className="text-[var(--text-secondary)]">小三和弦</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--chord-dominant7)' }}
          />
          <span className="text-[var(--text-secondary)]">属七和弦</span>
        </div>
      </div>
    </div>
  );
};

export default RhythmViewer;
