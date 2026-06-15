import { ThemeType } from '../words';
import { Player } from '../GameEngine';
import ThemeBanner from './ThemeBanner';
import CountdownTimer from './CountdownTimer';
import Avatar from './Avatar';
import WordHistoryList from './WordHistoryList';
import './GamePanel.css';

interface WordCard {
  word: string;
  playerIndex: number;
  id: string;
  colorIndex: number;
}

interface GamePanelProps {
  theme: ThemeType;
  players: [Player, Player];
  currentPlayerIndex: 0 | 1;
  timeLeft: number;
  currentWord: string;
  inputValue: string;
  errorMessage: string;
  wordCards: WordCard[];
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export default function GamePanel({
  theme,
  players,
  currentPlayerIndex,
  timeLeft,
  currentWord,
  inputValue,
  errorMessage,
  wordCards,
  onInputChange,
  onSubmit,
  onKeyDown,
  inputRef
}: GamePanelProps) {
  const lastChar = currentWord ? currentWord.charAt(currentWord.length - 1) : '';
  const playerNames: [string, string] = [players[0].name, players[1].name];

  return (
    <div className="app play-phase">
      <ThemeBanner theme={theme} />

      <div className="game-layout">
        <WordHistoryList cards={wordCards} playerNames={playerNames} />

        <div className="main-panel">
          <div className="players-bar">
            <div
              className={`player-info p1 ${
                currentPlayerIndex === 0 ? 'active' : ''
              }`}
            >
              <Avatar name={players[0].name} size={48} />
              <div className="player-detail">
                <span className="player-name">{players[0].name}</span>
                <span className="player-count">
                  词语数: {players[0].wordsCount}
                </span>
              </div>
            </div>

            <div className="vs-text">VS</div>

            <div
              className={`player-info p2 ${
                currentPlayerIndex === 1 ? 'active' : ''
              }`}
            >
              <Avatar name={players[1].name} size={48} />
              <div className="player-detail">
                <span className="player-name">{players[1].name}</span>
                <span className="player-count">
                  词语数: {players[1].wordsCount}
                </span>
              </div>
            </div>
          </div>

          <div className="center-area">
            <CountdownTimer timeLeft={timeLeft} totalTime={30} />

            <div className="current-word-box">
              <span className="current-label">当前词语</span>
              <span className="current-word">{currentWord}</span>
              <span className="hint-text">
                请输入以「{lastChar}」开头的词语
              </span>
            </div>

            <div className="input-area">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`${players[currentPlayerIndex].name}，请输入词语...`}
                className="word-input"
                autoFocus
              />
              <button className="submit-btn" onClick={onSubmit}>
                提交
              </button>
            </div>

            {errorMessage && (
              <div className="error-message error-fade">{errorMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
