import React, { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import GameBoard from './GameBoard';
import ScorePanel from './ScorePanel';
import {
  Difficulty,
  LetterPosition,
  WordHistoryItem,
  DIFFICULTY_CONFIG,
  generateLetterPool,
  isValidWord,
  calculateScore,
  checkIsMobile
} from './utils';

type GameStatus = 'start' | 'playing' | 'ended';

interface GameState {
  status: GameStatus;
  difficulty: Difficulty;
  letterPool: string[][];
  currentWord: LetterPosition[];
  score: number;
  comboCount: number;
  comboMultiplier: number;
  timeLeft: number;
  wordHistory: WordHistoryItem[];
  isShaking: boolean;
  showComboEffect: boolean;
  floatingScores: { id: number; value: number; x: number; y: number }[];
  usedPositions: Set<string>;
  isFading: boolean;
  isMobile: boolean;
}

type GameAction =
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'START_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'ADD_LETTER'; payload: LetterPosition }
  | { type: 'REMOVE_LETTER'; payload: number }
  | { type: 'CLEAR_WORD' }
  | { type: 'SUBMIT_WORD'; payload: { x: number; y: number } }
  | { type: 'TICK' }
  | { type: 'STOP_SHAKE' }
  | { type: 'STOP_COMBO_EFFECT' }
  | { type: 'REMOVE_FLOATING_SCORE'; payload: number }
  | { type: 'SET_MOBILE'; payload: boolean };

const initialState = (difficulty: Difficulty, isMobile: boolean): GameState => ({
  status: 'start',
  difficulty,
  letterPool: generateLetterPool(difficulty, isMobile),
  currentWord: [],
  score: 0,
  comboCount: 0,
  comboMultiplier: 1,
  timeLeft: DIFFICULTY_CONFIG[difficulty].time,
  wordHistory: [],
  isShaking: false,
  showComboEffect: false,
  floatingScores: [],
  usedPositions: new Set(),
  isFading: false,
  isMobile
});

let floatingScoreId = 0;

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_DIFFICULTY': {
      const newDifficulty = action.payload;
      return {
        ...state,
        isFading: true,
        difficulty: newDifficulty
      };
    }
    
    case 'START_GAME': {
      return {
        ...initialState(state.difficulty, state.isMobile),
        status: 'playing',
        difficulty: state.difficulty,
        isMobile: state.isMobile
      };
    }
    
    case 'RESET_GAME': {
      return {
        ...initialState(state.difficulty, state.isMobile),
        isMobile: state.isMobile
      };
    }
    
    case 'ADD_LETTER': {
      const posKey = `${action.payload.row}-${action.payload.col}`;
      if (state.usedPositions.has(posKey)) return state;
      
      return {
        ...state,
        currentWord: [...state.currentWord, action.payload],
        usedPositions: new Set([...state.usedPositions, posKey])
      };
    }
    
    case 'REMOVE_LETTER': {
      const newWord = [...state.currentWord];
      const removed = newWord.splice(action.payload, 1)[0];
      const newUsed = new Set(state.usedPositions);
      newUsed.delete(`${removed.row}-${removed.col}`);
      
      return {
        ...state,
        currentWord: newWord,
        usedPositions: newUsed
      };
    }
    
    case 'CLEAR_WORD': {
      const newUsed = new Set(state.usedPositions);
      state.currentWord.forEach(item => {
        newUsed.delete(`${item.row}-${item.col}`);
      });
      
      return {
        ...state,
        currentWord: [],
        usedPositions: newUsed
      };
    }
    
    case 'SUBMIT_WORD': {
      const word = state.currentWord.map(item => item.letter).join('');
      
      if (!isValidWord(word)) {
        const newUsed = new Set(state.usedPositions);
        state.currentWord.forEach(item => {
          newUsed.delete(`${item.row}-${item.col}`);
        });
        
        return {
          ...state,
          currentWord: [],
          score: Math.max(0, state.score - 2),
          isShaking: true,
          usedPositions: newUsed
        };
      }
      
      const wordScore = calculateScore(word.length, state.comboMultiplier);
      const newComboCount = state.comboCount + 1;
      const shouldTriggerCombo = newComboCount % 5 === 0;
      const newMultiplier = shouldTriggerCombo 
        ? Math.min(10, state.comboMultiplier + 1)
        : state.comboMultiplier;
      
      const newFloatingScore = {
        id: ++floatingScoreId,
        value: wordScore,
        x: action.payload.x,
        y: action.payload.y
      };
      
      return {
        ...state,
        currentWord: [],
        score: state.score + wordScore,
        comboCount: newComboCount,
        comboMultiplier: newMultiplier,
        wordHistory: [{ word, score: wordScore }, ...state.wordHistory],
        showComboEffect: shouldTriggerCombo,
        floatingScores: [...state.floatingScores, newFloatingScore],
        usedPositions: new Set()
      };
    }
    
    case 'TICK': {
      if (state.timeLeft <= 0) {
        return {
          ...state,
          status: 'ended'
        };
      }
      return {
        ...state,
        timeLeft: state.timeLeft - 1
      };
    }
    
    case 'STOP_SHAKE': {
      return {
        ...state,
        isShaking: false
      };
    }
    
    case 'STOP_COMBO_EFFECT': {
      return {
        ...state,
        showComboEffect: false
      };
    }
    
    case 'REMOVE_FLOATING_SCORE': {
      return {
        ...state,
        floatingScores: state.floatingScores.filter(fs => fs.id !== action.payload)
      };
    }
    
    case 'SET_MOBILE': {
      return {
        ...state,
        isMobile: action.payload,
        letterPool: generateLetterPool(state.difficulty, action.payload)
      };
    }
    
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(checkIsMobile());
  const [state, dispatch] = useReducer(gameReducer, 'normal' as Difficulty, (d) => initialState(d, isMobile));
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const floatingScoreTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handleResize = () => {
      const mobile = checkIsMobile();
      if (mobile !== isMobile) {
        setIsMobile(mobile);
        dispatch({ type: 'SET_MOBILE', payload: mobile });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    if (state.status === 'playing') {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status]);

  useEffect(() => {
    if (state.isShaking) {
      shakeTimeoutRef.current = setTimeout(() => {
        dispatch({ type: 'STOP_SHAKE' });
      }, 300);
    }
    
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, [state.isShaking]);

  useEffect(() => {
    if (state.isFading) {
      fadeTimeoutRef.current = setTimeout(() => {
        dispatch({ type: 'RESET_GAME' });
      }, 500);
    }
    
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [state.isFading]);

  useEffect(() => {
    state.floatingScores.forEach(fs => {
      if (!floatingScoreTimeoutsRef.current.has(fs.id)) {
        const timeout = setTimeout(() => {
          dispatch({ type: 'REMOVE_FLOATING_SCORE', payload: fs.id });
          floatingScoreTimeoutsRef.current.delete(fs.id);
        }, 400);
        floatingScoreTimeoutsRef.current.set(fs.id, timeout);
      }
    });
    
    return () => {
      floatingScoreTimeoutsRef.current.forEach(t => clearTimeout(t));
      floatingScoreTimeoutsRef.current.clear();
    };
  }, [state.floatingScores]);

  const handleAddLetter = useCallback((position: LetterPosition) => {
    dispatch({ type: 'ADD_LETTER', payload: position });
  }, []);

  const handleRemoveLetter = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_LETTER', payload: index });
  }, []);

  const handleClearWord = useCallback(() => {
    dispatch({ type: 'CLEAR_WORD' });
  }, []);

  const handleSubmitWord = useCallback(() => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 3;
    dispatch({ type: 'SUBMIT_WORD', payload: { x, y } });
  }, []);

  const handleStartGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const handleSetDifficulty = useCallback((difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
  }, []);

  const handleComboEffectComplete = useCallback(() => {
    dispatch({ type: 'STOP_COMBO_EFFECT' });
  }, []);

  const difficultyLabels: Record<Difficulty, string> = {
    easy: '简单',
    normal: '普通',
    hard: '困难'
  };

  return (
    <div className="app-container">
      {state.status === 'start' && (
        <div className="start-screen">
          <h1 className="start-title">文字榨汁机</h1>
          <p className="start-subtitle">
            考验你的词汇量和反应速度！在倒计时内从字母池中拖拽排列出尽可能多的有效英文单词。
          </p>
          
          <div className="difficulty-switcher">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                className={`difficulty-btn ${state.difficulty === d ? 'active' : ''}`}
                onClick={() => handleSetDifficulty(d)}
              >
                {difficultyLabels[d]}
              </button>
            ))}
          </div>
          
          <div className="instructions">
            <h3>游戏规则</h3>
            <p>• 拖拽或点击字母到上方单词槽组成单词</p>
            <p>• 单词长度需至少3个字母</p>
            <p>• 点击单词槽中的字母可移除</p>
            <p>• 每5个正确单词触发连击倍数提升</p>
            <p>• 错误提交扣2分</p>
          </div>
          
          <button className="start-btn" onClick={handleStartGame}>
            开始游戏
          </button>
        </div>
      )}

      {(state.status === 'playing' || state.status === 'ended') && (
        <div className={`game-wrapper ${state.isFading ? 'fading' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="game-header">
              <h1 className="game-title">文字榨汁机</h1>
              
              <div className="difficulty-switcher">
                {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    className={`difficulty-btn ${state.difficulty === d ? 'active' : ''}`}
                    onClick={() => handleSetDifficulty(d)}
                    disabled={state.status === 'playing'}
                  >
                    {difficultyLabels[d]}
                  </button>
                ))}
              </div>
            </div>
            
            <GameBoard
              letterPool={state.letterPool}
              usedPositions={state.usedPositions}
              currentWord={state.currentWord}
              onAddLetter={handleAddLetter}
              onRemoveLetter={handleRemoveLetter}
              onClearWord={handleClearWord}
              onSubmitWord={handleSubmitWord}
              isShaking={state.isShaking}
              isMobile={state.isMobile}
              disabled={state.status === 'ended'}
            />
          </div>
          
          <ScorePanel
            score={state.score}
            timeLeft={state.timeLeft}
            comboMultiplier={state.comboMultiplier}
            wordHistory={state.wordHistory}
            showComboEffect={state.showComboEffect}
            onComboEffectComplete={handleComboEffectComplete}
            floatingScores={state.floatingScores}
          />
        </div>
      )}

      {state.status === 'ended' && (
        <div className="game-over-overlay">
          <h2 className="game-over-title">游戏结束</h2>
          <div className="game-over-score">最终得分: {state.score}</div>
          
          <div className="game-over-stats">
            <div className="stat-item">
              <span className="stat-label">单词数</span>
              <span className="stat-value">{state.wordHistory.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最高连击</span>
              <span className="stat-value">{state.comboMultiplier}x</span>
            </div>
          </div>
          
          <button className="restart-btn" onClick={handleStartGame}>
            再玩一次
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
