import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chord } from '../types';
import { useSongStore } from '../store/useSongStore';
import { ChordSelector } from './ChordSelector';
import { CollaborativeCursor } from './CollaborativeCursor';

interface ChordEditorProps {
  chordSequence: Chord[][];
  currentMeasure: number;
  isPlaying: boolean;
  onScrollToMeasure: (measure: number) => void;
  rowHeight: number;
}

export const ChordEditor: React.FC<ChordEditorProps> = ({
  chordSequence,
  currentMeasure,
  isPlaying,
  onScrollToMeasure,
  rowHeight
}) => {
  const {
    addChord,
    removeChord,
    requestRecommendation,
    sendCursorPosition,
    remoteCursors,
    recommendations
  } = useSongStore();
  
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const [selectedPosition, setSelectedPosition] = useState<{ measure: number; position: number } | null>(null);
  const [recommendedChord, setRecommendedChord] = useState<string>('');
  const [localRecommendations, setLocalRecommendations] = useState<Record<number, string>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      chordSequence.forEach(async (measureChords, measureIndex) => {
        if (measureChords.length > 0 && measureChords.length < 4 && !localRecommendations[measureIndex]) {
          try {
            const rec = await requestRecommendation(measureIndex);
            setLocalRecommendations(prev => ({ ...prev, [measureIndex]: rec }));
          } catch (e) {
            // ignore
          }
        }
      });
    };
    fetchRecommendations();
  }, [chordSequence, requestRecommendation, localRecommendations]);

  const handleSlotClick = useCallback(async (e: React.MouseEvent, measure: number, position: number) => {
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setSelectorPosition({
        x: rect.left - containerRect.left,
        y: rect.bottom - containerRect.top + 8
      });
    }
    
    setSelectedPosition({ measure, position });
    
    const rec = await requestRecommendation(measure);
    setRecommendedChord(rec);
    setSelectorOpen(true);
    
    sendCursorPosition(measure, position, 'chord');
  }, [requestRecommendation, sendCursorPosition]);

  const handleChordSelect = useCallback((chord: string) => {
    if (selectedPosition) {
      addChord(selectedPosition.measure, selectedPosition.position, chord);
      
      const nextMeasure = selectedPosition.position >= 3
        ? selectedPosition.measure + 1
        : selectedPosition.measure;
      const nextPosition = (selectedPosition.position + 1) % 4;
      
      requestRecommendation(nextMeasure).then(rec => {
        setLocalRecommendations(prev => ({ ...prev, [nextMeasure]: rec }));
      });
    }
    setSelectorOpen(false);
    setSelectedPosition(null);
  }, [selectedPosition, addChord, requestRecommendation]);

  const handleChordRemove = useCallback((e: React.MouseEvent, measure: number, position: number) => {
    e.stopPropagation();
    e.preventDefault();
    removeChord(measure, position);
  }, [removeChord]);

  const handleAddMeasure = useCallback(() => {
    const newMeasure = chordSequence.length;
    addChord(newMeasure, 0, 'C');
  }, [chordSequence.length, addChord]);

  const displaySequence = chordSequence.length > 0 ? chordSequence : [[]];

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'auto',
        position: 'relative',
        padding: '16px'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {displaySequence.map((measureChords, measureIndex) => (
          <div
            key={measureIndex}
            ref={el => rowRefs.current[measureIndex] = el}
            style={{
              minHeight: `${rowHeight}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: currentMeasure === measureIndex && isPlaying
                ? 'var(--bg-highlight)'
                : 'transparent',
              transition: 'background var(--transition-fast)',
              position: 'relative',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                minWidth: '50px',
                userSelect: 'none'
              }}
            >
              小节 {measureIndex + 1}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
              {[0, 1, 2, 3].map(position => {
                const chord = measureChords[position];
                const isRecommended = !chord && 
                  position === measureChords.length &&
                  localRecommendations[measureIndex] &&
                  position < 4;
                const recommended = isRecommended ? localRecommendations[measureIndex] : null;
                
                return (
                  <div key={position} style={{ position: 'relative' }}>
                    {chord ? (
                      <div
                        className={`chord-box ${currentMeasure === measureIndex && isPlaying ? 'active' : ''}`}
                        onClick={(e) => handleSlotClick(e, measureIndex, position + 1)}
                        onContextMenu={(e) => handleChordRemove(e, measureIndex, position)}
                        title="右键删除"
                      >
                        {chord.name}
                      </div>
                    ) : (
                      <div
                        className={`chord-box ${recommended ? 'recommended' : 'empty'}`}
                        onClick={(e) => {
                          if (recommended && position === measureChords.length) {
                            handleChordSelect(recommended);
                            setSelectedPosition({ measure: measureIndex, position });
                          } else if (position <= measureChords.length) {
                            handleSlotClick(e, measureIndex, position);
                          }
                        }}
                      >
                        {recommended && position === measureChords.length
                          ? `推荐: ${recommended}`
                          : position === measureChords.length
                            ? '+ 添加'
                            : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <button
            className="btn btn-secondary ripple"
            onClick={handleAddMeasure}
            style={{ width: '100%', maxWidth: '200px' }}
          >
            + 添加小节
          </button>
        </div>
      </div>

      {remoteCursors
        .filter(c => c.type === 'chord')
        .map(cursor => (
          <CollaborativeCursor
            key={cursor.userId}
            cursor={cursor}
            containerRef={containerRef}
            rowHeight={rowHeight}
          />
        ))}

      {selectorOpen && selectedPosition && (
        <ChordSelector
          position={selectorPosition}
          onSelect={handleChordSelect}
          onClose={() => setSelectorOpen(false)}
          recommendedChord={recommendedChord}
        />
      )}
    </div>
  );
};

export default ChordEditor;
