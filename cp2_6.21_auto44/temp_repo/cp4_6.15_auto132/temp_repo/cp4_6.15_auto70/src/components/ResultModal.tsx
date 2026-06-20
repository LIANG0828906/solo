import { Player, LoseReason } from '../GameEngine';
import { ThemeType } from '../words';
import ThemeBanner from './ThemeBanner';
import Avatar from './Avatar';
import InkParticles from './InkParticles';
import WordHistoryList from './WordHistoryList';
import './ResultModal.css';

interface WordCard {
  word: string;
  playerIndex: number;
  id: string;
  colorIndex: number;
}

interface ResultModalProps {
  theme: ThemeType;
  winner: Player;
  loser: Player;
  reason: LoseReason;
  wordCards: WordCard[];
  onRestart: () => void;
}

export default function ResultModal({
  theme,
  winner,
  loser,
  reason,
  wordCards,
  onRestart
}: ResultModalProps) {
  const maxCount = Math.max(winner.wordsCount, loser.wordsCount, 1);
  const winnerHeight = (winner.wordsCount / maxCount) * 180;
  const loserHeight = (loser.wordsCount / maxCount) * 180;
  const playerNames: [string, string] = [
    winner.wordsCount >= loser.wordsCount ? winner.name : loser.name,
    winner.wordsCount >= loser.wordsCount ? loser.name : winner.name
  ];

  const reasonText =
    reason === 'timeout'
      ? `${loser.name} 超时未作答`
      : `${loser.name} 输入了重复词语`;

  return (
    <div className="app result-phase">
      <ThemeBanner theme={theme} />

      <div className="game-layout result-layout">
        <WordHistoryList cards={wordCards} playerNames={playerNames} />

        <div className="main-panel result-main">
          <div className="frosted-mask">
            <InkParticles />

            <div className="result-modal">
              <h2 className="result-title">游戏结束</h2>
              <p className="lose-reason">{reasonText}</p>

              <div className="result-players">
                <div className="result-player winner">
                  <div className="crown">👑</div>
                  <Avatar name={winner.name} size={80} />
                  <div className="result-name">{winner.name}</div>
                  <div className="result-tag">胜</div>
                </div>

                <div className="result-vs">VS</div>

                <div className="result-player loser">
                  <Avatar name={loser.name} size={80} />
                  <div className="result-name">{loser.name}</div>
                  <div className="result-tag lose">负</div>
                </div>
              </div>

              <div className="chart-container">
                <div className="chart-title">词语总数对比</div>
                <div className="bar-chart">
                  <div className="bar-wrapper">
                    <div
                      className="bar winner-bar bar-animate"
                      style={{ height: winnerHeight }}
                    />
                    <div className="bar-label">{winner.wordsCount}</div>
                    <div className="bar-name">{winner.name}</div>
                  </div>
                  <div className="bar-wrapper">
                    <div
                      className="bar loser-bar bar-animate"
                      style={{ height: loserHeight }}
                    />
                    <div className="bar-label">{loser.wordsCount}</div>
                    <div className="bar-name">{loser.name}</div>
                  </div>
                </div>
              </div>

              <button className="restart-btn" onClick={onRestart}>
                再来一局
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
