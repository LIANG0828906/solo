import { eventBus } from '../eventBus';
import { useGameStore } from '../store';
import type { PlayerRanking } from '../types';

class GameManager {
  private unsubscribers: (() => void)[] = [];
  private answeredPlayers: Set<string> = new Set();

  init(): void {
    this.unsubscribers.push(
      eventBus.on('playerJoined', (payload) => {
        const store = useGameStore.getState();
        store.addPlayer({
          id: payload.id as string,
          nickname: payload.nickname as string,
          avatarColor: payload.avatarColor as string,
          score: 0,
          correctCount: 0,
          totalTime: 0,
          isHost: store.players.length === 0,
        });
        this.emitRankings();
      }),

      eventBus.on('gameStart', () => {
        const store = useGameStore.getState();
        store.setPhase('playing');
        store.setCurrentPlayerId(store.players[0]?.id || '');
      }),

      eventBus.on('questionReceived', (payload) => {
        const store = useGameStore.getState();
        store.setCurrentQuestion(
          {
            question: payload.question as string,
            options: payload.options as string[],
            correctIndex: payload.correctIndex as number,
          },
          payload.questionIndex as number
        );
        store.setAnswerState({ selectedIndex: null, isCorrect: null, isLocked: false });
        store.setIsTransitioning(false);
        this.answeredPlayers.clear();
      }),

      eventBus.on('timerSync', (payload) => {
        const store = useGameStore.getState();
        store.setTimeRemaining(payload.remaining as number);
        store.setTotalTime(payload.total as number);
      }),

      eventBus.on('answerSubmit', (payload) => {
        const playerId = payload.id as string || payload.playerId as string;
        if (this.answeredPlayers.has(playerId)) return;
        this.answeredPlayers.add(playerId);

        const store = useGameStore.getState();
        if (!store.currentQuestion) return;

        const isCorrect =
          (payload.answerIndex as number) === store.currentQuestion.correctIndex;
        const delta = isCorrect ? 100 : 0;
        store.updatePlayerScore(playerId, delta, isCorrect);

        if (playerId === store.currentPlayerId) {
          store.setAnswerState({
            selectedIndex: payload.answerIndex as number,
            isCorrect,
            isLocked: true,
          });

          eventBus.emit('scoreUpdate', {
            playerId,
            score: store.players.find((p) => p.id === playerId)?.score || 0,
            delta,
          });
        }

        this.emitRankings();

        if (isCorrect && playerId === store.currentPlayerId) {
          setTimeout(() => {
            if (store.roundEndTime === null) {
              store.setRoundEndTime(Date.now());
            }
          }, 1500);
        }
      }),

      eventBus.on('roundEnd', (payload) => {
        const store = useGameStore.getState();
        store.setRoundEndTime(Date.now());
        this.emitRankings();

        if (store.questionIndex >= store.totalRounds - 1) {
          setTimeout(() => {
            const finalRankings = this.computeRankings();
            eventBus.emit('gameEnd', { finalRankings });
            store.setPhase('result');
          }, 1500);
        }
      }),

      eventBus.on('gameEnd', () => {
        const store = useGameStore.getState();
        const finalRankings = this.computeRankings();
        store.setRankings(finalRankings);
        store.setPhase('result');
      }),

      eventBus.on('gameReset', () => {
        const store = useGameStore.getState();
        store.resetGame();
        this.answeredPlayers.clear();
      })
    );
  }

  private emitRankings(): void {
    const rankings = this.computeRankings();
    useGameStore.getState().setRankings(rankings);
    eventBus.emit('rankUpdate', { rankings });
  }

  private computeRankings(): PlayerRanking[] {
    const players = useGameStore.getState().players;
    const sorted = [...players].sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
    return sorted.map((p, i) => ({
      playerId: p.id,
      nickname: p.nickname,
      score: p.score,
      rank: i + 1,
      correctCount: p.correctCount,
      avgTime: p.correctCount > 0 ? p.totalTime / p.correctCount : 0,
      avatarColor: p.avatarColor,
    }));
  }

  destroy(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }
}

export const gameManager = new GameManager();
