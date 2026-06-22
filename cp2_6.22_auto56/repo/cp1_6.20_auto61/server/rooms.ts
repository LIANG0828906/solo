import { v4 as uuidv4 } from 'uuid';

/**
 * 房间配置类型
 */
export interface RoomConfig {
  /** 总回合数 */
  totalRounds: number;
  /** 每题限时（秒） */
  timePerQuestion: number;
  /** 队伍数量（2-4） */
  teamCount: number;
}

/**
 * 玩家类型
 */
export interface Player {
  /** 玩家唯一ID */
  id: string;
  /** 玩家昵称 */
  nickname: string;
  /** 所属队伍ID */
  teamId: string | null;
  /** 是否已就绪 */
  isReady: boolean;
  /** 是否为房主 */
  isHost: boolean;
  /** 是否为队长 */
  isCaptain: boolean;
  /** 头像渐变色 */
  avatarGradient: string;
  /** Socket连接ID */
  socketId: string;
}

/**
 * 队伍类型
 */
export interface Team {
  /** 队伍唯一ID */
  id: string;
  /** 队伍名称 */
  name: string;
  /** 队伍颜色 */
  color: string;
  /** 当前积分 */
  score: number;
  /** 是否已使用求援技能 */
  helpUsed: boolean;
  /** 本回合是否已答题 */
  hasAnswered: boolean;
  /** 上一题是否答对 */
  lastAnswerCorrect: boolean | null;
}

/**
 * 房间状态类型
 */
export interface RoomState {
  /** 房间码 */
  code: string;
  /** 房间配置 */
  config: RoomConfig;
  /** 玩家列表 */
  players: Player[];
  /** 队伍列表 */
  teams: Team[];
  /** 房间状态 */
  status: 'waiting' | 'playing' | 'ended';
  /** 当前回合数（从0开始） */
  currentRound: number;
  /** 是否所有玩家都已就绪 */
  allReady: boolean;
}

/**
 * 题目选项类型
 */
export interface QuestionOption {
  /** 选项ID */
  id: string;
  /** 选项内容 */
  text: string;
}

/**
 * 题目类型
 */
export interface Question {
  /** 题目ID */
  id: string;
  /** 题目内容 */
  text: string;
  /** 关键词列表 */
  keywords: string[];
  /** 选项列表 */
  options: QuestionOption[];
  /** 正确选项ID */
  correctOptionId: string;
  /** 答案解析 */
  explanation: string;
}

/**
 * 回合状态类型
 */
export interface RoundState {
  /** 回合序号 */
  roundNumber: number;
  /** 当前题目 */
  question: Question;
  /** 开始时间戳 */
  startTime: number;
  /** 结束时间戳 */
  endTime: number;
  /** 各队答题记录 {teamId: {answerId, isCorrect, timeUsed}} */
  teamAnswers: Record<string, {
    answerId: string | null;
    isCorrect: boolean | null;
    timeUsed: number;
    scoreGained: number;
  }>;
  /** 求援状态 {teamId: targetTeamId} */
  helpRequests: Record<string, string>;
  /** 代答记录 {teamId: {answerId, helperTeamId}} */
  helpAnswers: Record<string, {
    answerId: string;
    helperTeamId: string;
  }>;
}

/**
 * 单队回合结果
 */
export interface TeamRoundResult {
  /** 队伍ID */
  teamId: string;
  /** 队伍名称 */
  teamName: string;
  /** 队伍颜色 */
  teamColor: string;
  /** 是否答对 */
  isCorrect: boolean | null;
  /** 选择的选项ID */
  answerId: string | null;
  /** 获得分数 */
  scoreGained: number;
  /** 当前总分 */
  totalScore: number;
  /** 是否使用了求援 */
  helpUsed: boolean;
  /** 代答队伍ID（如果是被代答） */
  answeredByTeamId: string | null;
}

/**
 * 回合结果类型
 */
export interface RoundResult {
  /** 回合序号 */
  roundNumber: number;
  /** 题目信息 */
  question: Question;
  /** 各队结果 */
  teamResults: TeamRoundResult[];
  /** 本回合正确答案 */
  correctOptionId: string;
}

/**
 * 最终结果类型
 */
export interface FinalResult {
  /** 总回合数 */
  totalRounds: number;
  /** 各队最终排名 */
  rankings: {
    /** 排名 */
    rank: number;
    /** 队伍ID */
    teamId: string;
    /** 队伍名称 */
    teamName: string;
    /** 队伍颜色 */
    teamColor: string;
    /** 最终总分 */
    totalScore: number;
    /** 队员列表 */
    players: Player[];
  }[];
}

/**
 * 预设队伍颜色和名称
 */
const TEAM_PRESETS: { name: string; color: string }[] = [
  { name: '红队', color: '#ff6b6b' },
  { name: '蓝队', color: '#4ecdc4' },
  { name: '黄队', color: '#ffd93d' },
  { name: '紫队', color: '#c084fc' },
];

/**
 * 头像渐变色预设
 */
const AVATAR_GRADIENTS: string[] = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

/**
 * 示例题库（实际项目中应从数据库或文件加载）
 */
const QUESTION_BANK: Question[] = [
  {
    id: 'q1',
    text: '太阳系中最大的行星是？',
    keywords: ['太阳系', '行星', '体积'],
    options: [
      { id: 'a', text: '地球' },
      { id: 'b', text: '木星' },
      { id: 'c', text: '土星' },
      { id: 'd', text: '海王星' },
    ],
    correctOptionId: 'b',
    explanation: '木星是太阳系中体积最大的行星，其质量是其他七颗行星总和的2.5倍。',
  },
  {
    id: 'q2',
    text: '《红楼梦》的作者是谁？',
    keywords: ['古典文学', '四大名著', '清代'],
    options: [
      { id: 'a', text: '罗贯中' },
      { id: 'b', text: '施耐庵' },
      { id: 'c', text: '曹雪芹' },
      { id: 'd', text: '吴承恩' },
    ],
    correctOptionId: 'c',
    explanation: '《红楼梦》是清代作家曹雪芹创作的章回体长篇小说，是中国古典四大名著之一。',
  },
  {
    id: 'q3',
    text: '水的化学式是什么？',
    keywords: ['化学', '分子式', '氢氧'],
    options: [
      { id: 'a', text: 'CO2' },
      { id: 'b', text: 'H2O' },
      { id: 'c', text: 'O2' },
      { id: 'd', text: 'NaCl' },
    ],
    correctOptionId: 'b',
    explanation: '水由两个氢原子和一个氧原子组成，化学式为H2O。',
  },
  {
    id: 'q4',
    text: '世界上最高的山峰是？',
    keywords: ['地理', '海拔', '喜马拉雅'],
    options: [
      { id: 'a', text: '乔戈里峰' },
      { id: 'b', text: '珠穆朗玛峰' },
      { id: 'c', text: '干城章嘉峰' },
      { id: 'd', text: '洛子峰' },
    ],
    correctOptionId: 'b',
    explanation: '珠穆朗玛峰海拔8848.86米，是世界上海拔最高的山峰，位于中国与尼泊尔边境。',
  },
  {
    id: 'q5',
    text: '计算机的"大脑"指的是什么？',
    keywords: ['计算机', '硬件', '核心部件'],
    options: [
      { id: 'a', text: '内存' },
      { id: 'b', text: '硬盘' },
      { id: 'c', text: '中央处理器' },
      { id: 'd', text: '显卡' },
    ],
    correctOptionId: 'c',
    explanation: '中央处理器（CPU）是计算机的核心部件，负责执行指令和处理数据，被称为计算机的"大脑"。',
  },
  {
    id: 'q6',
    text: '光年是什么单位？',
    keywords: ['天文', '距离', '物理'],
    options: [
      { id: 'a', text: '时间单位' },
      { id: 'b', text: '距离单位' },
      { id: 'c', text: '速度单位' },
      { id: 'd', text: '质量单位' },
    ],
    correctOptionId: 'b',
    explanation: '光年是距离单位，表示光在真空中行进一年的距离，约为9.46万亿公里。',
  },
  {
    id: 'q7',
    text: '人体最大的器官是？',
    keywords: ['生物', '人体', '生理'],
    options: [
      { id: 'a', text: '心脏' },
      { id: 'b', text: '肝脏' },
      { id: 'c', text: '皮肤' },
      { id: 'd', text: '肺' },
    ],
    correctOptionId: 'c',
    explanation: '皮肤是人体最大的器官，成年人的皮肤面积约为1.5-2平方米。',
  },
  {
    id: 'q8',
    text: '《蒙娜丽莎》的作者是谁？',
    keywords: ['艺术', '绘画', '文艺复兴'],
    options: [
      { id: 'a', text: '梵高' },
      { id: 'b', text: '毕加索' },
      { id: 'c', text: '达芬奇' },
      { id: 'd', text: '米开朗基罗' },
    ],
    correctOptionId: 'c',
    explanation: '《蒙娜丽莎》是意大利文艺复兴时期画家列奥纳多·达·芬奇创作的油画。',
  },
  {
    id: 'q9',
    text: '哪个国家被称为"樱花之国"？',
    keywords: ['地理', '文化', '国花'],
    options: [
      { id: 'a', text: '中国' },
      { id: 'b', text: '日本' },
      { id: 'c', text: '韩国' },
      { id: 'd', text: '泰国' },
    ],
    correctOptionId: 'b',
    explanation: '日本被誉为"樱花之国"，樱花是日本的国花，每年春季的樱花季吸引大量游客。',
  },
  {
    id: 'q10',
    text: 'DNA的中文全称是什么？',
    keywords: ['生物', '遗传', '分子'],
    options: [
      { id: 'a', text: '核糖核酸' },
      { id: 'b', text: '脱氧核糖核酸' },
      { id: 'c', text: '蛋白质' },
      { id: 'd', text: '氨基酸' },
    ],
    correctOptionId: 'b',
    explanation: 'DNA的中文全称是脱氧核糖核酸，是携带遗传信息的分子。',
  },
];

/**
 * 生成6位唯一房间码
 */
function generateRoomCode(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingCodes.has(code));
  return code;
}

/**
 * 房间管理类
 */
export class RoomManager {
  /** 所有房间 {roomCode: roomState} */
  private rooms: Map<string, RoomState> = new Map();

  /** 房间回合状态 {roomCode: roundState} */
  private roundStates: Map<string, RoundState> = new Map();

  /** 已使用的题目索引 {roomCode: number[]} */
  private usedQuestionIndices: Map<string, number[]> = new Map();

  /**
   * 创建房间
   * @param config 房间配置
   * @param hostNickname 房主昵称
   * @param hostSocketId 房主Socket ID
   * @returns 房间码和玩家ID
   */
  createRoom(
    config: RoomConfig,
    hostNickname: string,
    hostSocketId: string,
  ): { roomCode: string; playerId: string } {
    const existingCodes = new Set(this.rooms.keys());
    const roomCode = generateRoomCode(existingCodes);

    const playerId = uuidv4();
    const avatarGradient = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];

    const host: Player = {
      id: playerId,
      nickname: hostNickname,
      teamId: null,
      isReady: false,
      isHost: true,
      isCaptain: false,
      avatarGradient,
      socketId: hostSocketId,
    };

    const roomState: RoomState = {
      code: roomCode,
      config,
      players: [host],
      teams: [],
      status: 'waiting',
      currentRound: 0,
      allReady: false,
    };

    this.rooms.set(roomCode, roomState);
    this.usedQuestionIndices.set(roomCode, []);

    return { roomCode, playerId };
  }

  /**
   * 加入房间
   * @param roomCode 房间码
   * @param nickname 玩家昵称
   * @param socketId 玩家Socket ID
   * @returns 房间状态和玩家ID，房间不存在则返回null
   */
  joinRoom(
    roomCode: string,
    nickname: string,
    socketId: string,
  ): { room: RoomState; playerId: string } | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'waiting') {
      return null;
    }

    const playerId = uuidv4();
    const avatarGradient = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];

    const player: Player = {
      id: playerId,
      nickname,
      teamId: null,
      isReady: false,
      isHost: false,
      isCaptain: false,
      avatarGradient,
      socketId,
    };

    room.players.push(player);
    this.updateAllReady(room);

    return { room, playerId };
  }

  /**
   * 离开房间
   * @param roomCode 房间码
   * @param playerId 玩家ID
   */
  leaveRoom(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const leavingPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    if (leavingPlayer.isCaptain && room.status === 'waiting') {
      this.reassignCaptain(room, leavingPlayer.teamId);
    }

    if (leavingPlayer.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      this.roundStates.delete(roomCode);
      this.usedQuestionIndices.delete(roomCode);
    } else {
      this.updateAllReady(room);
    }
  }

  /**
   * 设置玩家就绪状态
   * @param roomCode 房间码
   * @param playerId 玩家ID
   * @param isReady 是否就绪
   * @returns 更新后的房间状态
   */
  setPlayerReady(
    roomCode: string,
    playerId: string,
    isReady: boolean,
  ): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'waiting') return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;

    player.isReady = isReady;
    this.updateAllReady(room);

    return room;
  }

  /**
   * 开始游戏，初始化队伍和队长
   * @param roomCode 房间码
   * @returns 房间状态，失败返回null
   */
  startGame(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'waiting') return null;
    if (!room.allReady) return null;
    if (room.players.length < room.config.teamCount) return null;

    const teams: Team[] = [];
    for (let i = 0; i < room.config.teamCount; i++) {
      const preset = TEAM_PRESETS[i];
      teams.push({
        id: uuidv4(),
        name: preset.name,
        color: preset.color,
        score: 0,
        helpUsed: false,
        hasAnswered: false,
        lastAnswerCorrect: null,
      });
    }

    room.teams = teams;
    this.assignPlayersToTeams(room);

    room.status = 'playing';
    room.currentRound = 0;

    return room;
  }

  /**
   * 获取下一题
   * @param roomCode 房间码
   * @returns 回合状态，失败返回null
   */
  getNextQuestion(roomCode: string): RoundState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'playing') return null;
    if (room.currentRound >= room.config.totalRounds) return null;

    const usedIndices = this.usedQuestionIndices.get(roomCode) || [];
    const availableIndices: number[] = [];
    for (let i = 0; i < QUESTION_BANK.length; i++) {
      if (!usedIndices.includes(i)) {
        availableIndices.push(i);
      }
    }

    let questionIndex: number;
    if (availableIndices.length === 0) {
      questionIndex = Math.floor(Math.random() * QUESTION_BANK.length);
    } else {
      questionIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
    usedIndices.push(questionIndex);
    this.usedQuestionIndices.set(roomCode, usedIndices);

    const question = { ...QUESTION_BANK[questionIndex] };

    const teamAnswers: RoundState['teamAnswers'] = {};
    for (const team of room.teams) {
      team.hasAnswered = false;
      team.lastAnswerCorrect = null;
      teamAnswers[team.id] = {
        answerId: null,
        isCorrect: null,
        timeUsed: 0,
        scoreGained: 0,
      };
    }

    const startTime = Date.now();
    const endTime = startTime + room.config.timePerQuestion * 1000;

    const roundState: RoundState = {
      roundNumber: room.currentRound + 1,
      question,
      startTime,
      endTime,
      teamAnswers,
      helpRequests: {},
      helpAnswers: {},
    };

    this.roundStates.set(roomCode, roundState);

    return roundState;
  }

  /**
   * 处理答题，计算积分
   * @param roomCode 房间码
   * @param playerId 玩家ID
   * @param answerId 选项ID
   * @returns 答题结果
   */
  submitAnswer(
    roomCode: string,
    playerId: string,
    answerId: string,
  ): { isCorrect: boolean; scoreGained: number; teamId: string } | null {
    const room = this.rooms.get(roomCode);
    const roundState = this.roundStates.get(roomCode);
    if (!room || !roundState || room.status !== 'playing') return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.teamId) return null;
    if (!player.isCaptain) return null;

    const team = room.teams.find((t) => t.id === player.teamId);
    if (!team || team.hasAnswered) return null;

    if (Date.now() > roundState.endTime) {
      return null;
    }

    const isCorrect = answerId === roundState.question.correctOptionId;
    const timeUsed = (Date.now() - roundState.startTime) / 1000;
    const scoreGained = isCorrect ? 100 : 0;

    team.hasAnswered = true;
    team.lastAnswerCorrect = isCorrect;
    team.score += scoreGained;

    roundState.teamAnswers[team.id] = {
      answerId,
      isCorrect,
      timeUsed,
      scoreGained,
    };

    return { isCorrect, scoreGained, teamId: team.id };
  }

  /**
   * 使用求援技能，随机分配到其他队
   * @param roomCode 房间码
   * @param playerId 玩家ID
   * @returns 目标队伍信息，失败返回null
   */
  useHelp(
    roomCode: string,
    playerId: string,
  ): { targetTeamId: string; targetTeamName: string } | null {
    const room = this.rooms.get(roomCode);
    const roundState = this.roundStates.get(roomCode);
    if (!room || !roundState || room.status !== 'playing') return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.teamId) return null;
    if (!player.isCaptain) return null;

    const team = room.teams.find((t) => t.id === player.teamId);
    if (!team || team.helpUsed) return null;
    if (team.hasAnswered) return null;

    if (roundState.helpRequests[team.id]) {
      return null;
    }

    const otherTeams = room.teams.filter((t) => t.id !== team.id);
    if (otherTeams.length === 0) return null;

    const targetTeam = otherTeams[Math.floor(Math.random() * otherTeams.length)];
    team.helpUsed = true;
    roundState.helpRequests[team.id] = targetTeam.id;

    return { targetTeamId: targetTeam.id, targetTeamName: targetTeam.name };
  }

  /**
   * 代答（被求援队伍代为回答）
   * @param roomCode 房间码
   * @param playerId 代答玩家ID
   * @param answerId 选项ID
   * @param targetTeamId 被代答的队伍ID
   * @returns 答题结果，失败返回null
   */
  submitHelpAnswer(
    roomCode: string,
    playerId: string,
    answerId: string,
    targetTeamId: string,
  ): { isCorrect: boolean; scoreGained: number } | null {
    const room = this.rooms.get(roomCode);
    const roundState = this.roundStates.get(roomCode);
    if (!room || !roundState || room.status !== 'playing') return null;

    const helperPlayer = room.players.find((p) => p.id === playerId);
    if (!helperPlayer || !helperPlayer.teamId) return null;
    if (!helperPlayer.isCaptain) return null;

    const helpRequestTeamId = Object.keys(roundState.helpRequests).find(
      (teamId) => roundState.helpRequests[teamId] === helperPlayer.teamId && teamId === targetTeamId,
    );
    if (!helpRequestTeamId) return null;

    const targetTeam = room.teams.find((t) => t.id === targetTeamId);
    if (!targetTeam || targetTeam.hasAnswered) return null;

    if (roundState.helpAnswers[targetTeamId]) {
      return null;
    }

    if (Date.now() > roundState.endTime) {
      return null;
    }

    const isCorrect = answerId === roundState.question.correctOptionId;
    const timeUsed = (Date.now() - roundState.startTime) / 1000;
    const scoreGained = isCorrect ? 100 : 0;

    targetTeam.hasAnswered = true;
    targetTeam.lastAnswerCorrect = isCorrect;
    targetTeam.score += scoreGained;

    roundState.teamAnswers[targetTeamId] = {
      answerId,
      isCorrect,
      timeUsed,
      scoreGained,
    };

    roundState.helpAnswers[targetTeamId] = {
      answerId,
      helperTeamId: helperPlayer.teamId,
    };

    return { isCorrect, scoreGained };
  }

  /**
   * 结束回合，准备下一回合
   * @param roomCode 房间码
   * @returns 回合结果，如果游戏结束则返回FinalResult
   */
  endRound(
    roomCode: string,
  ): { roundResult: RoundResult; finalResult?: FinalResult } | null {
    const room = this.rooms.get(roomCode);
    const roundState = this.roundStates.get(roomCode);
    if (!room || !roundState) return null;

    for (const team of room.teams) {
      if (!team.hasAnswered) {
        team.lastAnswerCorrect = false;
        if (roundState.teamAnswers[team.id]) {
          roundState.teamAnswers[team.id].isCorrect = false;
          roundState.teamAnswers[team.id].scoreGained = 0;
        }
      }
    }

    const teamResults: TeamRoundResult[] = room.teams.map((team) => {
      const answer = roundState.teamAnswers[team.id];
      const helpAnswer = roundState.helpAnswers[team.id];
      return {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        isCorrect: answer?.isCorrect ?? false,
        answerId: answer?.answerId ?? null,
        scoreGained: answer?.scoreGained ?? 0,
        totalScore: team.score,
        helpUsed: team.helpUsed,
        answeredByTeamId: helpAnswer?.helperTeamId ?? null,
      };
    });

    const roundResult: RoundResult = {
      roundNumber: roundState.roundNumber,
      question: roundState.question,
      teamResults,
      correctOptionId: roundState.question.correctOptionId,
    };

    room.currentRound++;

    let finalResult: FinalResult | undefined;
    if (room.currentRound >= room.config.totalRounds) {
      room.status = 'ended';
      finalResult = this.getFinalResult(room);
    }

    return { roundResult, finalResult };
  }

  /**
   * 获取房间状态
   * @param roomCode 房间码
   * @returns 房间状态，不存在返回null
   */
  getRoomState(roomCode: string): RoomState | null {
    return this.rooms.get(roomCode) || null;
  }

  /**
   * 获取回合状态
   * @param roomCode 房间码
   * @returns 回合状态，不存在返回null
   */
  getRoundState(roomCode: string): RoundState | null {
    return this.roundStates.get(roomCode) || null;
  }

  /**
   * 根据Socket ID查找玩家和房间
   * @param socketId Socket ID
   * @returns 房间码和玩家信息
   */
  findPlayerBySocketId(
    socketId: string,
  ): { roomCode: string; player: Player } | null {
    for (const [roomCode, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        return { roomCode, player };
      }
    }
    return null;
  }

  /**
   * 自动分配玩家到队伍，平衡人数
   */
  private assignPlayersToTeams(room: RoomState): void {
    const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledPlayers.length; i++) {
      const teamIndex = i % room.teams.length;
      const team = room.teams[teamIndex];
      const player = shuffledPlayers[i];
      player.teamId = team.id;
      player.isCaptain = false;
    }

    for (const team of room.teams) {
      const teamPlayers = room.players.filter((p) => p.teamId === team.id);
      if (teamPlayers.length > 0) {
        teamPlayers[0].isCaptain = true;
      }
    }
  }

  /**
   * 重新分配队长
   */
  private reassignCaptain(room: RoomState, teamId: string | null): void {
    if (!teamId) return;
    const teamPlayers = room.players.filter((p) => p.teamId === teamId);
    if (teamPlayers.length > 0) {
      teamPlayers[0].isCaptain = true;
    }
  }

  /**
   * 更新allReady状态
   */
  private updateAllReady(room: RoomState): void {
    if (room.players.length === 0) {
      room.allReady = false;
      return;
    }
    room.allReady = room.players.every((p) => p.isReady);
  }

  /**
   * 获取最终结果
   */
  private getFinalResult(room: RoomState): FinalResult {
    const sortedTeams = [...room.teams].sort((a, b) => b.score - a.score);

    let currentRank = 0;
    let lastScore = -1;
    const rankings = sortedTeams.map((team, index) => {
      if (team.score !== lastScore) {
        currentRank = index + 1;
        lastScore = team.score;
      }
      const teamPlayers = room.players.filter((p) => p.teamId === team.id);
      return {
        rank: currentRank,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        totalScore: team.score,
        players: teamPlayers,
      };
    });

    return {
      totalRounds: room.config.totalRounds,
      rankings,
    };
  }
}

/**
 * 全局单例房间管理器
 */
export const roomManager = new RoomManager();

export default RoomManager;
