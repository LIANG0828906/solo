import { useState, useRef, useEffect, useCallback } from 'react';
import { GameEngine, Player, LoseReason } from './GameEngine';
import { ThemeType } from './words';
import { getRandomCardColorIndex } from './utils/colors';
import StartPanel from './components/StartPanel';
import GamePanel from './components/GamePanel';
import ResultModal from './components/ResultModal';

type Phase = 'start' | 'playing' | 'result';

interface WordCard {
  word: string;
  playerIndex: number;
  id: string;
  colorIndex: number;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('start');
  const [theme, setTheme] = useState<ThemeType>('idiom');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<0 | 1>(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [wordCards, setWordCards] = useState<WordCard[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [players, setPlayers] = useState<[Player, Player]>([
    { id: '1', name: '玩家1', wordsCount: 0 },
    { id: '2', name: '玩家2', wordsCount: 0 }
  ]);
  const [gameResult, setGameResult] = useState<{
    winner: Player;
    loser: Player;
    reason: LoseReason;
  } | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<HTMLInputElement>(null!);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickSecondRef = useRef<number>(-1);

  const playTickSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch {
      // audio not supported, ignore
    }
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;

    const currentSecond = Math.ceil(timeLeft);
    if (timeLeft <= 5 && timeLeft > 0 && currentSecond !== lastTickSecondRef.current) {
      lastTickSecondRef.current = currentSecond;
      playTickSound();
    }
    if (timeLeft <= 0) {
      lastTickSecondRef.current = -1;
    }
  }, [timeLeft, phase, playTickSound]);

  useEffect(() => {
    engineRef.current = new GameEngine({
      onTimeUpdate: (t) => setTimeLeft(t),
      onTurnChange: (idx) => {
        setCurrentPlayerIndex(idx);
        setInputValue('');
        setErrorMessage('');
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      onWordAdded: (word, playerIndex) => {
        const colorIndex = getRandomCardColorIndex();
        setWordCards((prev) => [
          ...prev,
          {
            word,
            playerIndex,
            id: `${word}-${Date.now()}-${Math.random()}`,
            colorIndex
          }
        ]);
        setCurrentWord(word);
        setInputValue('');
        setErrorMessage('');
      },
      onGameOver: (winner, loser, reason) => {
        setPlayers([winner, loser]);
        setGameResult({ winner, loser, reason });
        setPhase('result');
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 2000);
      }
    });

    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  const handleStartGame = useCallback(
    (selectedTheme: ThemeType, playerNames: [string, string]) => {
      setTheme(selectedTheme);
      setWordCards([]);
      setGameResult(null);
      setPhase('playing');
      lastTickSecondRef.current = -1;
      engineRef.current?.startGame(selectedTheme, playerNames);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) {
      setErrorMessage('请输入一个词语');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }
    engineRef.current?.submitWord(inputValue);
  }, [inputValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleRestart = useCallback(() => {
    setPhase('start');
    setWordCards([]);
    setCurrentWord('');
    setInputValue('');
    setErrorMessage('');
    setTimeLeft(30);
    setGameResult(null);
    lastTickSecondRef.current = -1;
  }, []);

  if (phase === 'start') {
    return <StartPanel onStart={handleStartGame} />;
  }

  if (phase === 'playing') {
    return (
      <GamePanel
        theme={theme}
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        timeLeft={timeLeft}
        currentWord={currentWord}
        inputValue={inputValue}
        errorMessage={errorMessage}
        wordCards={wordCards}
        onInputChange={setInputValue}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        inputRef={inputRef}
      />
    );
  }

  if (phase === 'result' && gameResult) {
    return (
      <ResultModal
        theme={theme}
        winner={gameResult.winner}
        loser={gameResult.loser}
        reason={gameResult.reason}
        wordCards={wordCards}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}
