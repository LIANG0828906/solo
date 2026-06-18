import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '../eventBus';
import { questions } from '../data/questions';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

const BOT_NAMES = ['星辰玩家', '月光侠客', '雷霆战神', '风暴达人'];

class WebSocketService {
  private connected = false;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private currentPlayerId: string = '';
  private botIds: string[] = [];
  private botAnswerTimers: ReturnType<typeof setTimeout>[] = [];

  connect(nickname: string): void {
    if (this.connected) return;
    this.connected = true;
    this.currentPlayerId = uuidv4();

    const player = {
      playerId: this.currentPlayerId,
      nickname,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };
    eventBus.emit('playerJoined', player);

    setTimeout(() => this.addBots(), 800);
  }

  private addBots(): void {
    const botCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < botCount; i++) {
      const botId = uuidv4();
      this.botIds.push(botId);
      setTimeout(() => {
        eventBus.emit('playerJoined', {
          playerId: botId,
          nickname: BOT_NAMES[i % BOT_NAMES.length],
          avatarColor: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length],
          isBot: true,
        });
      }, 300 + i * 500);
    }
  }

  startGame(): void {
    const players: { id: string; nickname: string; avatarColor: string }[] = [];
    eventBus.emit('gameStart', { players });
    setTimeout(() => this.sendQuestion(0), 600);
  }

  private sendQuestion(index: number): void {
    if (index >= questions.length) {
      eventBus.emit('gameEnd', {});
      return;
    }

    const q = questions[index];
    eventBus.emit('questionReceived', {
      questionIndex: index,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
    });
    eventBus.emit('roundUpdate', {
      round: index + 1,
      totalRounds: questions.length,
    });

    this.startTimer(10, index);
    this.scheduleBotAnswers(index);
  }

  private startTimer(total: number, questionIndex: number): void {
    let remaining = total;
    eventBus.emit('timerSync', { remaining, total });

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      remaining -= 0.1;
      if (remaining <= 0) {
        remaining = 0;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.handleRoundEnd(questionIndex);
      }
      eventBus.emit('timerSync', { remaining, total });
    }, 100);
  }

  private scheduleBotAnswers(questionIndex: number): void {
    this.clearBotTimers();
    const q = questions[questionIndex];
    this.botIds.forEach((botId) => {
      const delay = 2000 + Math.random() * 5000;
      const timer = setTimeout(() => {
        const isCorrect = Math.random() > 0.4;
        const answerIndex = isCorrect
          ? q.correctIndex
          : (q.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;
        eventBus.emit('answerSubmit', {
          playerId: botId,
          answerIndex,
          timeElapsed: delay / 1000,
          isBot: true,
        });
      }, delay);
      this.botAnswerTimers.push(timer);
    });
  }

  private clearBotTimers(): void {
    this.botAnswerTimers.forEach((t) => clearTimeout(t));
    this.botAnswerTimers = [];
  }

  submitAnswer(playerId: string, answerIndex: number, timeElapsed: number): void {
    eventBus.emit('answerSubmit', { playerId, answerIndex, timeElapsed });
  }

  private handleRoundEnd(questionIndex: number): void {
    this.clearBotTimers();
    const q = questions[questionIndex];
    eventBus.emit('roundEnd', {
      questionIndex,
      correctIndex: q.correctIndex,
    });
  }

  nextQuestion(questionIndex: number): void {
    const nextIndex = questionIndex + 1;
    setTimeout(() => this.sendQuestion(nextIndex), 300);
  }

  reset(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.clearBotTimers();
    this.connected = false;
    this.currentPlayerId = '';
    this.botIds = [];
    eventBus.emit('gameReset', {});
  }

  getCurrentPlayerId(): string {
    return this.currentPlayerId;
  }
}

export const wsService = new WebSocketService();
