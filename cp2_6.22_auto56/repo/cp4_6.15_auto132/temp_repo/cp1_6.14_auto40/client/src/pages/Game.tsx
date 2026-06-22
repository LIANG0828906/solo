import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomManager, RoomState, PublicPlayer } from '../roomManager';
import { gameEngine, RoundStartData, RoundEndData, GameEndData } from '../gameEngine';
import PaintingBoard, { PaintingBoardRef } from '../components/PaintingBoard';
import GuessingPanel from '../components/GuessingPanel';
import ScoreBoard from '../components/ScoreBoard';

const CONFETTI_COLORS = ['#e94560', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const Game: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<PaintingBoardRef>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isDrawer, setIsDrawer] = useState(false);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [wordLength, setWordLength] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [revealedLetters, setRevealedLetters] = useState<boolean[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [flashState, setFlashState] = useState<'none' | 'correct' | 'wrong'>('none');
  const [guessHistory, setGuessHistory] = useState<{
    guess: string;
    playerId: string;
    playerNickname?: string;
    isCorrect?: boolean;
  }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<
    { id: number; left: number; delay: number; color: string; size: number }[]
  >([]);
  const [roundEndModal, setRoundEndModal] = useState<{
    word: string;
    score: number;
    teamName: string;
    guessed: boolean;
    isLastRound: boolean;
  } | null>(null);
  const [finalRankings, setFinalRankings] = useState<GameEndData['finalRankings'] | null>(null);
  const [recentScore, setRecentScore] = useState<{ teamId: number; score: number } | null>(null);
  const myId = roomManager.getPlayerId();

  const triggerConfetti = useCallback(() => {
    const particles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 10
    }));
    setConfettiParticles(particles);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  useEffect(() => {
    if (!code) return;

    const unsubRoom = roomManager.onMessage((type, data) => {
      if (type === 'room_joined' || type === 'player_joined' || type === 'player_left') {
        setRoom(data.room);
      }

      if (type === 'round_start') {
        const roundData = data as RoundStartData;
        gameEngine.startRound(roundData);
        setRoom(roundData);
        setIsDrawer(roundData.isDrawer);
        setCurrentWord(roundData.word);
        setWordLength(roundData.wordLength);
        setRevealedLetters(new Array(roundData.wordLength).fill(false));
        setWrongGuesses(0);
        setHintsUsed(0);
        setGuessHistory([]);
        setFlashState('none');
        setRoundEndModal(null);
        canvasRef.current?.clear();
      }

      if (type === 'draw_action') {
        canvasRef.current?.applyDrawAction(data);
      }

      if (type === 'canvas_clear') {
        canvasRef.current?.clear();
      }

      if (type === 'canvas_undo') {
        canvasRef.current?.undo();
      }

      if (type === 'guess_correct') {
        triggerConfetti();
        gameEngine.playVictorySound();
        setFlashState('correct');
        const player = room?.players.find((p) => p.id === data.playerId);
        setGuessHistory((prev) => [
          ...prev,
          { guess: data.guess, playerId: data.playerId, playerNickname: player?.nickname, isCorrect: true }
        ]);
      }

      if (type === 'guess_wrong') {
        gameEngine.playWrongSound();
        setFlashState('wrong');
        setWrongGuesses(data.wrongGuesses);
        const player = room?.players.find((p) => p.id === data.playerId);
        setGuessHistory((prev) => [
          ...prev,
          { guess: data.guess, playerId: data.playerId, playerNickname: player?.nickname, isCorrect: false }
        ]);
        setTimeout(() => setFlashState('none'), 800);
      }

      if (type === 'hint_granted') {
        const newRevealed = [...data.revealedLetters];
        newRevealed[data.index] = data.letter;
        (newRevealed as any)[data.index] = data.letter;
        setRevealedLetters(newRevealed as any);
        setHintsUsed(data.hintsUsed);
      }

      if (type === 'round_end') {
        const roundEnd = data as RoundEndData;
        gameEngine.stopTimers();
        setRecentScore({ teamId: roundEnd.teamId, score: roundEnd.roundScore });
        setRoundEndModal({
          word: roundEnd.word,
          score: roundEnd.roundScore,
          teamName: room?.teams.find((t) => t.id === roundEnd.teamId)?.name || '',
          guessed: roundEnd.guessed,
          isLastRound: roundEnd.isLastRound
        });
      }

      if (type === 'game_end') {
        const gameEnd = data as GameEndData;
        setFinalRankings(gameEnd.finalRankings);
        setRoom(gameEnd);
      }

      if (type === 'error') {
        console.error('Game error:', data.message);
      }
    });

    const unsubEngine = gameEngine.on((type, data) => {
      if (type === 'tick') {
        setTimeRemaining(data.timeRemaining);
        if (data.timeRemaining <= 0) {
          roomManager.notifyTimeout();
        }
      }
    });

    if (roomManager.getRoomCode() !== code) {
      navigate('/');
    }

    return () => {
      unsubRoom();
      unsubEngine();
      gameEngine.destroy();
    };
  }, [code, navigate, room?.players, room?.teams, triggerConfetti]);

  const handleLeave = () => {
    roomManager.leaveRoom();
    navigate('/');
  };

  if (!room) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#a0aec0' }}>加载中...</div>
    );
  }

  const gameLayout =
    window.innerWidth < 768
      ? { flexDirection: 'column' as const }
      : { flexDirection: 'row' as const };

  return (
    <div style={{ minHeight: '100vh', padding: 16, background: 'var(--bg-primary)' }}>
      {showConfetti && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: -20,
                width: p.size,
                height: p.size,
                background: p.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animation: `confettiFall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          padding: '8px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              background: 'linear-gradient(90deg, #e94560, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            🎨 猜词对战
          </h1>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 8,
              background: 'rgba(15, 52, 96, 0.6)',
              fontSize: 13,
              color: '#a0aec0'
            }}
          >
            房间: <strong style={{ color: '#e94560', letterSpacing: 2 }}>{code}</strong>
          </div>
        </div>
        <button
          onClick={handleLeave}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: 'rgba(233, 69, 96, 0.2)',
            color: '#ff8098',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          退出游戏
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          height: 'calc(100vh - 80px)',
          ...gameLayout
        }}
      >
        <div
          style={{
            flex: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 400
          }}
        >
          <PaintingBoard
            ref={canvasRef}
            isDrawer={isDrawer}
            word={currentWord}
            wordCategory={room.currentWordCategory}
            flashState={flashState}
          />
        </div>

        <div
          style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 400
          }}
        >
          <div style={{ flex: 1 }}>
            <GuessingPanel
              isDrawer={isDrawer}
              wordLength={wordLength}
              revealedLetters={revealedLetters}
              wrongGuesses={wrongGuesses}
              hintsUsed={hintsUsed}
              wordCategory={room.currentWordCategory}
              guessHistory={guessHistory}
            />
          </div>
          <div style={{ flex: 1 }}>
            <ScoreBoard
              teams={room.teams}
              currentRound={room.currentRound}
              totalRounds={room.totalRounds}
              timeRemaining={timeRemaining}
              currentTeamIndex={room.currentTeamIndex}
              recentScore={recentScore}
              showFinalRankings={finalRankings}
            />
          </div>
        </div>
      </div>

      {roundEndModal && !finalRankings && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="card fade-in" style={{ maxWidth: 480, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {roundEndModal.guessed ? '🎉' : '⏰'}
            </div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                marginBottom: 8,
                color: roundEndModal.guessed ? '#10b981' : '#e94560'
              }}
            >
              {roundEndModal.guessed ? '猜对了！' : '时间到！'}
            </h2>
            <div style={{ fontSize: 14, color: '#a0aec0', marginBottom: 16 }}>
              {roundEndModal.guessed ? `${roundEndModal.teamName} 本轮得分` : '正确答案是'}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#e94560',
                marginBottom: 16,
                letterSpacing: 4
              }}
            >
              {roundEndModal.word}
            </div>
            {roundEndModal.guessed && (
              <div
                className="score-bounce"
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#fbbf24',
                  marginBottom: 16,
                  textShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
                }}
              >
                +{roundEndModal.score}
              </div>
            )}
            <div style={{ fontSize: 14, color: '#a0aec0' }}>
              {roundEndModal.isLastRound ? '正在计算最终排名...' : '下一轮即将开始...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
