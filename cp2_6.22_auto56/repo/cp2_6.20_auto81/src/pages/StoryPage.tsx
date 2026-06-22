import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { storyApi } from '../api/storyApi';
import TopBar from '../components/TopBar';
import StoryDisplay from '../components/StoryDisplay';
import ChoicePanel from '../components/ChoicePanel';
import Sidebar from '../components/Sidebar';
import SaveButton from '../components/SaveButton';
import SaveModal from '../components/SaveModal';
import StartScreen from '../components/StartScreen';
import type { SaveData } from '../types';
import { v4 as uuidv4 } from 'uuid';

const StoryPage = () => {
  const {
    currentNode,
    gameState,
    displayedText,
    isTyping,
    sidebarOpen,
    setCurrentNode,
    setGameState,
    setIsTyping,
    setDisplayedText,
    appendDisplayedText,
    addSave,
    setSidebarOpen,
  } = useGameStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const typingIndexRef = useRef(0);
  const typingTimerRef = useRef<number | null>(null);

  const startTypingEffect = useCallback((text: string) => {
    setDisplayedText('');
    setIsTyping(true);
    typingIndexRef.current = 0;

    const typeChar = () => {
      if (typingIndexRef.current < text.length) {
        const char = text[typingIndexRef.current];
        appendDisplayedText(char);
        typingIndexRef.current++;
        const delay = 30 + Math.random() * 30;
        typingTimerRef.current = window.setTimeout(typeChar, delay);
      } else {
        setIsTyping(false);
      }
    };

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typeChar();
  }, [appendDisplayedText, setDisplayedText, setIsTyping]);

  const handleStart = useCallback(async (theme?: string) => {
    try {
      setIsTransitioning(true);
      const response = await storyApi.startStory(theme);
      setCurrentNode(response.node);
      setGameState(response.state);
      setTimeout(() => {
        setIsTransitioning(false);
        setGameStarted(true);
        startTypingEffect(response.node.text);
      }, 500);
    } catch (err) {
      console.error('Failed to start story:', err);
      setIsTransitioning(false);
    }
  }, [setCurrentNode, setGameState, startTypingEffect]);

  const handleChoice = useCallback(
    async (choiceId: string) => {
      if (!currentNode || isTyping || isTransitioning) return;

      try {
        setIsTransitioning(true);
        const response = await storyApi.chooseOption(
          currentNode.id,
          choiceId,
          gameState
        );

        setTimeout(() => {
          setCurrentNode(response.node);
          setGameState(response.state);
          setIsTransitioning(false);
          startTypingEffect(response.node.text);
        }, 300);
      } catch (err) {
        console.error('Failed to choose option:', err);
        setIsTransitioning(false);
      }
    },
    [currentNode, isTyping, isTransitioning, gameState, setCurrentNode, setGameState, startTypingEffect]
  );

  const handleInputSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentNode || isTyping) return;

      const trimmed = inputValue.trim();
      if (!trimmed) return;

      const numChoice = parseInt(trimmed, 10);
      if (!isNaN(numChoice) && numChoice >= 1 && numChoice <= currentNode.choices.length) {
        handleChoice(currentNode.choices[numChoice - 1].id);
      } else {
        const matchedChoice = currentNode.choices.find(
          (c) => c.text.toLowerCase().includes(trimmed.toLowerCase())
        );
        if (matchedChoice) {
          handleChoice(matchedChoice.id);
        }
      }
      setInputValue('');
    },
    [currentNode, isTyping, inputValue, handleChoice]
  );

  const handleSaveGame = useCallback(() => {
    if (!currentNode) return;
    const summary = displayedText.slice(0, 60) + (displayedText.length > 60 ? '...' : '');
    const save: SaveData = {
      id: uuidv4(),
      timestamp: Date.now(),
      sceneSummary: summary,
      state: gameState,
    };
    addSave(save);
  }, [currentNode, displayedText, gameState, addSave]);

  const handleLoadGame = useCallback(
    async (save: SaveData) => {
      try {
        setIsTransitioning(true);
        setShowSaveModal(false);
        setGameState(save.state);
        setTimeout(async () => {
          if (save.state.currentNodeId) {
            const response = await storyApi.chooseOption(
              save.state.currentNodeId,
              '__load__',
              save.state
            );
            setCurrentNode(response.node);
            setIsTransitioning(false);
            setGameStarted(true);
            startTypingEffect(response.node.text);
          }
        }, 500);
      } catch (err) {
        console.error('Failed to load game:', err);
        setIsTransitioning(false);
      }
    },
    [setGameState, setCurrentNode, startTypingEffect]
  );

  const skipTyping = useCallback(() => {
    if (isTyping && currentNode) {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      setDisplayedText(currentNode.text);
      setIsTyping(false);
    }
  }, [isTyping, currentNode, setDisplayedText, setIsTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {isTransitioning && (
        <div
          className="absolute inset-0 z-50 animate-fade-out"
          style={{ backgroundColor: '#000' }}
        />
      )}

      <TopBar />

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden">
          {!gameStarted ? (
            <StartScreen onStart={handleStart} />
          ) : (
            <>
              <StoryDisplay
                text={displayedText}
                isTyping={isTyping}
                onClick={skipTyping}
              />

              <ChoicePanel
                choices={currentNode?.choices || []}
                onChoice={handleChoice}
                disabled={isTyping || isTransitioning}
              />

              <form
                onSubmit={handleInputSubmit}
                className="flex-shrink-0 border-t px-4 py-3 flex items-center gap-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <span style={{ color: 'var(--text-accent)' }} className="font-bold">
                  {'>'}
                </span>
                <span className="animate-cursor-blink" style={{ color: 'var(--text-primary)' }}>
                  _
                </span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isTyping || isTransitioning}
                  placeholder="输入编号或关键词选择行动..."
                  className="flex-1 bg-transparent outline-none text-base font-mono"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                />
              </form>
            </>
          )}
        </div>

        <Sidebar />
      </div>

      <SaveButton onClick={() => setShowSaveModal(true)} disabled={!gameStarted} />

      <SaveModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveGame}
        onLoad={handleLoadGame}
      />
    </div>
  );
};

export default StoryPage;
