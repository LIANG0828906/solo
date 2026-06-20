import React, { useState, useEffect, useRef, useCallback } from 'react';
import { extractLetters, shuffleArray, playSound, getRandomLetters } from '@/shared/utils';
import { Word, getAllWords } from '@/api/wordsApi';

interface GameBoardProps {
  word: Word;
  wordIndex: number;
  totalWords: number;
  mode: 'spelling' | 'matching';
  onSubmit: (correct: boolean, mode: 'spelling' | 'matching') => void;
}

interface LetterCard {
  id: string;
  letter: string;
}

interface MatchingOption {
  meaning: string;
  isCorrect: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ word, wordIndex, totalWords, mode, onSubmit }) => {
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'error'>('none');
  const feedbackTimerRef = useRef<number | null>(null);

  const [availableLetters, setAvailableLetters] = useState<LetterCard[]>([]);
  const [placedLetters, setPlacedLetters] = useState<LetterCard[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [fadingOutId, setFadingOutId] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [options, setOptions] = useState<MatchingOption[]>([]);

  const dragAnimRef = useRef<number | null>(null);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearFeedbackTimer();
      if (dragAnimRef.current !== null) {
        cancelAnimationFrame(dragAnimRef.current);
      }
    };
  }, [clearFeedbackTimer]);

  useEffect(() => {
    setFeedback('none');
    setSelectedOption(null);
    clearFeedbackTimer();

    if (mode === 'spelling') {
      setAvailableLetters(extractLetters(word.word));
      setPlacedLetters([]);
      setDraggedId(null);
      setDropTargetIndex(null);
      setFadingOutId(null);
    } else {
      const allWords = getAllWords();
      const otherWords = allWords.filter(w => w.id !== word.id);
      const shuffledOthers = shuffleArray(otherWords);
      const wrongOptions = shuffledOthers.slice(0, 3).map(w => ({
        meaning: w.meaning,
        isCorrect: false,
      }));
      const correctOption = { meaning: word.meaning, isCorrect: true };
      setOptions(shuffleArray([correctOption, ...wrongOptions]));
    }
  }, [word, mode, clearFeedbackTimer]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);

    if (dragAnimRef.current !== null) {
      cancelAnimationFrame(dragAnimRef.current);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handlePlacedLetterDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  };

  const handleDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedId) return;

    const placedIdx = placedLetters.findIndex(l => l.id === draggedId);
    const availableIdx = availableLetters.findIndex(l => l.id === draggedId);

    if (availableIdx !== -1) {
      const letter = availableLetters[availableIdx];
      const newAvailable = [...availableLetters.slice(0, availableIdx), ...availableLetters.slice(availableIdx + 1)];
      const newPlaced = [...placedLetters];
      if (dropTargetIndex !== null && dropTargetIndex <= newPlaced.length) {
        newPlaced.splice(dropTargetIndex, 0, letter);
      } else {
        newPlaced.push(letter);
      }
      setAvailableLetters(newAvailable);
      setPlacedLetters(newPlaced);
    } else if (placedIdx !== -1) {
      const letter = placedLetters[placedIdx];
      const newPlaced = [...placedLetters.slice(0, placedIdx), ...placedLetters.slice(placedIdx + 1)];
      const targetIdx = dropTargetIndex !== null
        ? (dropTargetIndex > placedIdx ? dropTargetIndex - 1 : dropTargetIndex)
        : newPlaced.length;
      newPlaced.splice(Math.min(targetIdx, newPlaced.length), 0, letter);
      setPlacedLetters(newPlaced);
    }

    setDraggedId(null);
    setDropTargetIndex(null);
  };

  const handleAvailableZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedId) return;

    const placedIdx = placedLetters.findIndex(l => l.id === draggedId);
    if (placedIdx !== -1) {
      const letter = placedLetters[placedIdx];
      const newPlaced = [...placedLetters.slice(0, placedIdx), ...placedLetters.slice(placedIdx + 1)];
      setPlacedLetters(newPlaced);
      setAvailableLetters(prev => [...prev, letter]);
    }

    setDraggedId(null);
    setDropTargetIndex(null);
  };

  const handlePlacedLetterClick = (id: string, index: number) => {
    if (feedback !== 'none') return;
    const letter = placedLetters[index];
    setFadingOutId(id);
    setTimeout(() => {
      const newPlaced = placedLetters.filter(l => l.id !== id);
      setPlacedLetters(newPlaced);
      setAvailableLetters(prev => [...prev, letter]);
      setFadingOutId(null);
    }, 200);
  };

  const handleSubmitSpelling = () => {
    if (placedLetters.length === 0 || feedback !== 'none') return;

    const userAnswer = placedLetters.map(l => l.letter).join('');
    const correctAnswer = word.word.toUpperCase();
    const isCorrect = userAnswer === correctAnswer;

    clearFeedbackTimer();

    if (isCorrect) {
      setFeedback('correct');
      playSound();
      feedbackTimerRef.current = window.setTimeout(() => {
        onSubmit(true, 'spelling');
      }, 800);
    } else {
      setFeedback('error');
      feedbackTimerRef.current = window.setTimeout(() => {
        onSubmit(false, 'spelling');
        const allReturned = [...placedLetters];
        setPlacedLetters([]);
        setAvailableLetters(prev => [...prev, ...allReturned]);
        setFeedback('none');
      }, 1000);
    }
  };

  const handleSubmitMatching = () => {
    if (selectedOption === null || feedback !== 'none') return;

    const isCorrect = options[selectedOption].isCorrect;
    clearFeedbackTimer();

    if (isCorrect) {
      setFeedback('correct');
      playSound();
      feedbackTimerRef.current = window.setTimeout(() => {
        onSubmit(true, 'matching');
      }, 800);
    } else {
      setFeedback('error');
      feedbackTimerRef.current = window.setTimeout(() => {
        onSubmit(false, 'matching');
        setFeedback('none');
      }, 1000);
    }
  };

  const getDropZoneBackground = () => {
    if (feedback === 'correct') return 'rgba(107, 203, 119, 0.25)';
    if (feedback === 'error') return 'rgba(255, 107, 107, 0.25)';
    return 'transparent';
  };

  const getLetterCardBorder = () => {
    if (feedback === 'correct') return '2px solid #6BCB77';
    if (feedback === 'error') return '2px solid #FF6B6B';
    return 'none';
  };

  const getLetterCardAnimationClass = () => {
    if (feedback === 'correct') return 'animate-flash';
    if (feedback === 'error') return 'animate-shake';
    return '';
  };

  const renderSpellingMode = () => {
    const hintStyle: React.CSSProperties = {
      marginBottom: '32px',
      textAlign: 'center',
    };

    const meaningStyle: React.CSSProperties = {
      fontSize: '36px',
      fontWeight: 700,
      color: '#E2E8F0',
      marginBottom: '8px',
    };

    const posStyle: React.CSSProperties = {
      fontSize: '16px',
      color: '#94A3B8',
      display: 'inline-block',
      padding: '4px 12px',
      background: 'rgba(78, 205, 196, 0.15)',
      borderRadius: '12px',
    };

    const dropZoneStyle: React.CSSProperties = {
      minHeight: '48px',
      border: '2px dashed #4ECDC4',
      borderRadius: '8px',
      padding: '8px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      minWidth: '100%',
      marginBottom: '32px',
      background: getDropZoneBackground(),
      transition: 'background 0.3s ease',
    };

    const placeholderStyle: React.CSSProperties = {
      width: '48px',
      height: '54px',
      border: '2px dashed #FFD93D',
      borderRadius: '8px',
      background: 'rgba(255, 217, 61, 0.1)',
      flexShrink: 0,
    };

    const placedLetterStyle: React.CSSProperties = {
      width: '48px',
      height: '54px',
      borderRadius: '8px',
      background: '#2D4A6C',
      color: 'white',
      fontSize: '22px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'grab',
      userSelect: 'none',
      transition: 'all 0.15s ease',
      border: getLetterCardBorder(),
      flexShrink: 0,
    };

    const availableWrapperStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '40px',
    };

    const availableTitleStyle: React.CSSProperties = {
      fontSize: '14px',
      color: '#94A3B8',
      marginBottom: '12px',
    };

    const lettersContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      justifyContent: 'center',
    };

    const submitBtnStyle: React.CSSProperties = {
      width: '160px',
      height: '44px',
      fontSize: '16px',
      opacity: placedLetters.length === 0 || feedback !== 'none' ? 0.5 : 1,
      cursor: placedLetters.length === 0 || feedback !== 'none' ? 'not-allowed' : 'pointer',
      borderRadius: '22px',
      background: '#4ECDC4',
      color: 'white',
      fontWeight: 600,
      border: 'none',
      transition: 'all 0.15s ease-out',
    };

    const renderDropZoneContent = () => {
      const elements: React.ReactNode[] = [];
      const showPlaceholder = draggedId !== null && dropTargetIndex !== null;

      if (placedLetters.length === 0 && !showPlaceholder) {
        return null;
      }

      placedLetters.forEach((letter, idx) => {
        if (showPlaceholder && idx === dropTargetIndex) {
          elements.push(
            <div key={`placeholder-${idx}`} style={placeholderStyle} />
          );
        }
        const isDragging = draggedId === letter.id;
        const animClass = fadingOutId === letter.id
          ? 'animate-fade-out'
          : (draggedId !== letter.id ? getLetterCardAnimationClass() : '');

        elements.push(
          <div
            key={letter.id}
            draggable={feedback === 'none' && fadingOutId !== letter.id}
            onDragStart={(e) => handleDragStart(e, letter.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handlePlacedLetterDragOver(e, idx)}
            onClick={() => handlePlacedLetterClick(letter.id, idx)}
            className={animClass}
            style={{
              ...placedLetterStyle,
              transform: isDragging ? 'scale(1.1)' : 'none',
              boxShadow: isDragging ? '0 8px 20px rgba(0, 0, 0, 0.3)' : 'none',
              opacity: isDragging ? 0.8 : 1,
            }}
          >
            {letter.letter}
          </div>
        );
      });

      if (showPlaceholder && dropTargetIndex !== null && dropTargetIndex >= placedLetters.length) {
        elements.push(
          <div key={`placeholder-end`} style={placeholderStyle} />
        );
      }

      return elements;
    };

    return (
      <>
        <div style={hintStyle}>
          <div style={meaningStyle}>{word.meaning}</div>
          <div style={posStyle}>{word.partOfSpeech}</div>
        </div>

        <div
          style={dropZoneStyle}
          onDragOver={handleDragOver}
          onDrop={handleDropZoneDrop}
        >
          {renderDropZoneContent()}
        </div>

        <div
          style={availableWrapperStyle}
          onDragOver={handleDragOver}
          onDrop={handleAvailableZoneDrop}
        >
          <div style={availableTitleStyle}>可选字母（拖拽到上方或点击放置区的字母可移除）</div>
          <div style={lettersContainerStyle}>
            {availableLetters.map((letter) => {
              const isDragging = draggedId === letter.id;
              return (
                <div
                  key={letter.id}
                  draggable={feedback === 'none'}
                  onDragStart={(e) => handleDragStart(e, letter.id)}
                  onDragEnd={handleDragEnd}
                  className={draggedId !== letter.id ? getLetterCardAnimationClass() : ''}
                  style={{
                    width: '48px',
                    height: '54px',
                    borderRadius: '8px',
                    background: '#2D4A6C',
                    color: 'white',
                    fontSize: '22px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    border: getLetterCardBorder(),
                    transform: isDragging ? 'scale(1.1)' : 'none',
                    boxShadow: isDragging ? '0 8px 20px rgba(0, 0, 0, 0.3)' : 'none',
                    opacity: isDragging ? 0.8 : 1,
                    flexShrink: 0,
                  }}
                >
                  {letter.letter}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            className="btn-primary"
            onClick={handleSubmitSpelling}
            disabled={placedLetters.length === 0 || feedback !== 'none'}
            style={submitBtnStyle}
          >
            提交答案
          </button>
        </div>
      </>
    );
  };

  const renderMatchingMode = () => {
    const wordHintStyle: React.CSSProperties = {
      marginBottom: '40px',
      textAlign: 'center',
    };

    const wordStyle: React.CSSProperties = {
      fontSize: '48px',
      fontWeight: 800,
      color: '#4ECDC4',
      letterSpacing: '2px',
      marginBottom: '8px',
      textShadow: '0 0 30px rgba(78, 205, 196, 0.2)',
    };

    const posStyle: React.CSSProperties = {
      fontSize: '16px',
      color: '#94A3B8',
      display: 'inline-block',
      padding: '4px 12px',
      background: 'rgba(78, 205, 196, 0.15)',
      borderRadius: '12px',
    };

    const exampleStyle: React.CSSProperties = {
      fontSize: '14px',
      color: '#94A3B8',
      marginTop: '12px',
      fontStyle: 'italic',
      padding: '12px 20px',
      background: 'rgba(45, 74, 108, 0.4)',
      borderRadius: '8px',
      borderLeft: '3px solid #4ECDC4',
      textAlign: 'left',
      display: 'inline-block',
      maxWidth: '100%',
    };

    const titleStyle: React.CSSProperties = {
      fontSize: '14px',
      color: '#94A3B8',
      marginBottom: '16px',
      textAlign: 'center',
    };

    const optionsStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      maxWidth: '600px',
      margin: '0 auto 40px',
    };

    const getOptionStyle = (option: MatchingOption, index: number): React.CSSProperties => {
      let style: React.CSSProperties = {
        width: '100%',
        height: '56px',
        minHeight: '56px',
        borderRadius: '8px',
        background: '#1A3A5C',
        color: '#E2E8F0',
        fontSize: '16px',
        fontWeight: 500,
        border: '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      };

      if (feedback === 'none') {
        if (selectedOption === index) {
          style.borderColor = '#4ECDC4';
          style.boxShadow = '0 0 0 3px rgba(78, 205, 196, 0.2)';
        }
      } else if (feedback === 'correct') {
        if (option.isCorrect) {
          style.borderColor = '#6BCB77';
          style.background = 'rgba(107, 203, 119, 0.2)';
        }
      } else if (feedback === 'error') {
        if (option.isCorrect) {
          style.borderColor = '#6BCB77';
          style.background = 'rgba(107, 203, 119, 0.2)';
        } else if (selectedOption === index) {
          style.borderColor = '#FF6B6B';
          style.background = 'rgba(255, 107, 107, 0.2)';
        }
      }

      return style;
    };

    const getOptionClass = (option: MatchingOption, index: number): string => {
      if (feedback === 'correct' && option.isCorrect) {
        return 'animate-flash';
      }
      if (feedback === 'error' && selectedOption === index && !option.isCorrect) {
        return 'animate-shake';
      }
      return '';
    };

    const submitBtnStyle: React.CSSProperties = {
      width: '160px',
      height: '44px',
      fontSize: '16px',
      opacity: selectedOption === null || feedback !== 'none' ? 0.5 : 1,
      cursor: selectedOption === null || feedback !== 'none' ? 'not-allowed' : 'pointer',
      borderRadius: '22px',
      background: '#4ECDC4',
      color: 'white',
      fontWeight: 600,
      border: 'none',
      transition: 'all 0.15s ease-out',
    };

    const maskedExample = word.example.replace(
      new RegExp(`\\b${word.word}\\b`, 'gi'),
      '___'
    );

    return (
      <>
        <div style={wordHintStyle}>
          <div style={wordStyle}>{word.word}</div>
          <div style={posStyle}>{word.partOfSpeech}</div>
          <div style={{ marginTop: '12px' }}>
            <div style={exampleStyle}>{maskedExample}</div>
          </div>
        </div>

        <div style={titleStyle}>请选择以下单词的正确释义：</div>

        <div style={optionsStyle}>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => feedback === 'none' && setSelectedOption(index)}
              disabled={feedback !== 'none'}
              className={getOptionClass(option, index)}
              style={getOptionStyle(option, index)}
              onMouseEnter={(e) => {
                if (feedback === 'none' && selectedOption !== index) {
                  e.currentTarget.style.background = '#2D5A8A';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (feedback === 'none' && selectedOption !== index) {
                  e.currentTarget.style.background = '#1A3A5C';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {option.meaning}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            className="btn-primary"
            onClick={handleSubmitMatching}
            disabled={selectedOption === null || feedback !== 'none'}
            style={submitBtnStyle}
          >
            确认答案
          </button>
        </div>
      </>
    );
  };

  const progressStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '32px',
    fontSize: '14px',
    color: '#94A3B8',
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={progressStyle}>
        第 {wordIndex + 1} / {totalWords} 题 · {mode === 'spelling' ? '拼写模式' : '匹配模式'}
      </div>
      {mode === 'spelling' ? renderSpellingMode() : renderMatchingMode()}
    </div>
  );
};

export default GameBoard;
