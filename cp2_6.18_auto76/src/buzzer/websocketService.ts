import { v4 } from "uuid";
import eventBus from "../eventBus";

const QUESTIONS = [
  {
    id: v4(),
    text: "光在真空中的传播速度约为多少？",
    options: ["10万公里/秒", "20万公里/秒", "30万公里/秒", "40万公里/秒"],
    correctIndex: 2,
  },
  {
    id: v4(),
    text: "世界上面积最大的沙漠是？",
    options: ["撒哈拉沙漠", "戈壁沙漠", "阿拉伯沙漠", "卡拉哈里沙漠"],
    correctIndex: 0,
  },
  {
    id: v4(),
    text: "人体最大的器官是？",
    options: ["肝脏", "大脑", "心脏", "皮肤"],
    correctIndex: 3,
  },
  {
    id: v4(),
    text: "《蒙娜丽莎》的作者是？",
    options: ["米开朗基罗", "达芬奇", "拉斐尔", "梵高"],
    correctIndex: 1,
  },
  {
    id: v4(),
    text: "地球上最深的海沟是？",
    options: ["日本海沟", "菲律宾海沟", "马里亚纳海沟", "汤加海沟"],
    correctIndex: 2,
  },
  {
    id: v4(),
    text: "化学元素周期表中，第一个元素是？",
    options: ["氢", "氦", "锂", "碳"],
    correctIndex: 0,
  },
  {
    id: v4(),
    text: "「但愿人长久，千里共婵娟」出自哪位诗人？",
    options: ["李白", "杜甫", "白居易", "苏轼"],
    correctIndex: 3,
  },
  {
    id: v4(),
    text: "世界上最小的大洲是？",
    options: ["欧洲", "大洋洲", "南极洲", "南美洲"],
    correctIndex: 1,
  },
  {
    id: v4(),
    text: "DNA的双螺旋结构由谁发现？",
    options: ["达尔文", "孟德尔", "沃森和克里克", "巴斯德"],
    correctIndex: 2,
  },
  {
    id: v4(),
    text: "世界上最长的河流是？",
    options: ["尼罗河", "亚马逊河", "长江", "密西西比河"],
    correctIndex: 0,
  },
];

const AI_PLAYERS = [
  { nickname: "星辰", avatarColor: "#FF6B6B" },
  { nickname: "月影", avatarColor: "#4ECDC4" },
  { nickname: "风铃", avatarColor: "#45B7D1" },
];

const AVATAR_PALETTE = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

const QUESTION_DURATION = 10;
const BETWEEN_QUESTION_DELAY = 1500;
const ROUND_END_DELAY = 3000;
const AI_JOIN_STAGGER = 500;
const AI_ANSWER_MIN_DELAY = 3000;
const AI_ANSWER_MAX_DELAY = 7000;
const AI_CORRECT_RATE = 0.6;

interface Player {
  id: string;
  nickname: string;
  avatarColor: string;
  isHost: boolean;
}

class WebSocketService {
  private players: Player[] = [];
  private currentRound = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private gameActive = false;
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private answers = new Map<string, number>();

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    eventBus.on("joinRoom", (data) => this.handleJoinRoom(data.nickname));
    eventBus.on("startGame", () => this.handleStartGame());
    eventBus.on("answerSubmit", (data) => this.handleAnswerSubmit(data));
    eventBus.on("resetGame", () => this.handleResetGame());
  }

  private handleJoinRoom(nickname: string): void {
    const isHost = this.players.length === 0;
    const avatarColor = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
    const humanPlayer: Player = {
      id: v4(),
      nickname,
      avatarColor,
      isHost,
    };
    this.players.push(humanPlayer);
    eventBus.emit("playerJoined", {
      playerId: humanPlayer.id,
      nickname: humanPlayer.nickname,
      avatarColor: humanPlayer.avatarColor,
    });

    const aiCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < aiCount; i++) {
      const aiDef = AI_PLAYERS[i];
      const timeout = setTimeout(() => {
        const aiPlayer: Player = {
          id: v4(),
          nickname: aiDef.nickname,
          avatarColor: aiDef.avatarColor,
          isHost: false,
        };
        this.players.push(aiPlayer);
        eventBus.emit("playerJoined", {
          playerId: aiPlayer.id,
          nickname: aiPlayer.nickname,
          avatarColor: aiPlayer.avatarColor,
        });
      }, AI_JOIN_STAGGER * (i + 1));
      this.pendingTimeouts.push(timeout);
    }
  }

  private handleStartGame(): void {
    if (this.gameActive) return;
    this.gameActive = true;
    this.currentRound = 0;
    this.answers.clear();
    this.startRound();
  }

  private startRound(): void {
    if (this.currentRound >= QUESTIONS.length) {
      this.gameActive = false;
      return;
    }

    const question = QUESTIONS[this.currentRound];
    eventBus.emit("questionReceived", {
      questionId: question.id,
      text: question.text,
      options: question.options,
      correctIndex: question.correctIndex,
      roundIndex: this.currentRound,
    });

    this.answers.clear();
    this.scheduleAiAnswers(question.correctIndex);

    let remaining = QUESTION_DURATION;
    eventBus.emit("timerSync", { remaining, total: QUESTION_DURATION });

    this.timerInterval = setInterval(() => {
      remaining--;
      eventBus.emit("timerSync", { remaining, total: QUESTION_DURATION });
      if (remaining <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  private scheduleAiAnswers(correctIndex: number): void {
    for (const player of this.players) {
      if (this.isAiPlayer(player.id)) {
        const delay = AI_ANSWER_MIN_DELAY + Math.random() * (AI_ANSWER_MAX_DELAY - AI_ANSWER_MIN_DELAY);
        const timeout = setTimeout(() => {
          if (!this.gameActive) return;
          const isCorrect = Math.random() < AI_CORRECT_RATE;
          const selectedIndex = isCorrect
            ? correctIndex
            : this.getWrongIndex(correctIndex);
          this.answers.set(player.id, selectedIndex);
          eventBus.emit("answerSubmit", {
            playerId: player.id,
            questionId: QUESTIONS[this.currentRound].id,
            selectedIndex,
          });
        }, delay);
        this.pendingTimeouts.push(timeout);
      }
    }
  }

  private getWrongIndex(correctIndex: number): number {
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex);
    return wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
  }

  private isAiPlayer(playerId: string): boolean {
    return this.players.some(
      (p) => p.id === playerId && AI_PLAYERS.some((ai) => p.nickname === ai.nickname)
    );
  }

  private handleAnswerSubmit(data: { playerId: string; questionId: string; selectedIndex: number }): void {
    if (!this.gameActive) return;
    this.answers.set(data.playerId, data.selectedIndex);
  }

  private endRound(): void {
    this.clearTimer();
    const question = QUESTIONS[this.currentRound];
    const playerAnswers = Array.from(this.answers.entries()).map(([playerId, selectedIndex]) => ({
      playerId,
      selectedIndex,
    }));
    eventBus.emit("roundEnd", {
      roundIndex: this.currentRound,
      correctIndex: question.correctIndex,
      playerAnswers,
    });

    this.currentRound++;
    if (this.currentRound < QUESTIONS.length) {
      const timeout = setTimeout(() => {
        this.startRound();
      }, BETWEEN_QUESTION_DELAY);
      this.pendingTimeouts.push(timeout);
    } else {
      const timeout = setTimeout(() => {
        this.gameActive = false;
      }, ROUND_END_DELAY);
      this.pendingTimeouts.push(timeout);
    }
  }

  private handleResetGame(): void {
    this.clearTimer();
    for (const t of this.pendingTimeouts) {
      clearTimeout(t);
    }
    this.pendingTimeouts = [];
    this.players = [];
    this.currentRound = 0;
    this.gameActive = false;
    this.answers.clear();
  }

  private clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

export const wsService = new WebSocketService();
export default WebSocketService;
