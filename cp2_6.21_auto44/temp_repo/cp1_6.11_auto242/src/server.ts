import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

interface Player {
  id: string;
  nickname: string;
  score: number;
  isOnline: boolean;
  isHost: boolean;
  seatIndex: number;
  disconnectedAt?: number;
}

interface Score {
  meter: number;
  imagery: number;
  allusion: number;
  total: number;
}

interface Recommendation {
  poem: string;
  author: string;
  title: string;
  reason: string;
}

interface PoemEntry {
  playerId: string;
  nickname: string;
  upperLine: string;
  lowerLine: string;
  score: Score;
}

interface Room {
  id: string;
  players: Player[];
  currentTurn: number;
  currentUpperLine: string;
  timeLeft: number;
  gameState: 'waiting' | 'playing' | 'scoring' | 'flowing';
  poemEntries: PoemEntry[];
  timerInterval?: NodeJS.Timeout;
}

const rhymeMap = new Map<string, string[]>();
const pinyinMap = new Map<string, { pinyin: string; tone: number }>();
const imageryMap = new Map<string, string[]>();

const initPoetryDatabase = () => {
  const rhymeGroups: Record<string, string[]> = {
    'ang': ['光', '霜', '乡', '香', '长', '阳', '忘', '狂', '凉', '伤', '床', '方', '黄', '肠', '堂'],
    'ing': ['明', '声', '情', '青', '轻', '听', '星', '亭', '庭', '宁', '平', '行', '城', '成', '名'],
    'an': ['山', '间', '还', '寒', '关', '颜', '闲', '难', '眠', '年', '天', '前', '边', '烟', '泉'],
    'u': ['流', '秋', '楼', '愁', '舟', '头', '游', '留', '休', '州', '幽', '柔', '浮', '收', '钩'],
    'i': ['溪', '西', '低', '迷', '啼', '题', '堤', '梯', '泥', '犁', '鸡', '栖', '齐', '兮', '霓'],
    'ao': ['高', '毛', '豪', '桃', '朝', '遥', '桥', '调', '飘', '潮', '箫', '霄', '销', '骄', '烧'],
    'ou': ['秋', '流', '舟', '楼', '愁', '头', '游', '留', '休', '州', '幽', '柔', '浮', '收', '钩'],
    'a': ['花', '家', '霞', '茶', '沙', '涯', '鸦', '华', '斜', '夸', '麻', '瓜', '蛙', '虾', '槎'],
    'uo': ['波', '河', '歌', '多', '过', '罗', '蓑', '荷', '蛾', '磨', '阿', '哦', '婆', '梭', '驮'],
    'e': ['歌', '河', '波', '多', '过', '罗', '蓑', '荷', '蛾', '磨', '阿', '哦', '婆', '梭', '驮']
  };

  Object.entries(rhymeGroups).forEach(([rhyme, chars]) => {
    rhymeMap.set(rhyme, chars);
    chars.forEach(char => {
      const tone = Math.floor(Math.random() * 4) + 1;
      pinyinMap.set(char, { pinyin: char + rhyme, tone });
    });
  });

  const imageryData: Record<string, string[]> = {
    '月': ['思乡', '离别', '团圆', '夜晚', '清冷', '思念', '故乡', '情人'],
    '山': ['隐逸', '高远', '清幽', '自然', '隐居', '禅意', '险峻', '雄伟'],
    '水': ['柔情', '流逝', '智慧', '清净', '奔流', '不息', '源头', '活水'],
    '风': ['自由', '飘逸', '萧瑟', '春风', '秋风', '清风', '东风', '西风'],
    '花': ['美丽', '凋零', '春天', '富贵', '清雅', '傲骨', '芬芳', '烂漫'],
    '酒': ['豪情', '忧愁', '欢聚', '离别', '洒脱', '狂放', '醉意', '消愁'],
    '云': ['漂泊', '自由', '悠闲', '变化', '无心', '出岫', '苍狗', '白云'],
    '鸟': ['自由', '归巢', '啼鸣', '春天', '成双', '比翼', '鸿雁', '杜鹃'],
    '柳': ['离别', '送别', '柔情', '春天', '折柳', '灞桥', '丝绦', '依依'],
    '松': ['傲骨', '长青', '高洁', '隐士', '岁寒', '苍劲', '挺拔', '顶天'],
    '竹': ['高洁', '虚心', '君子', '坚韧', '挺拔', '翠绿', '潇湘', '竹林'],
    '梅': ['傲骨', '报春', '高洁', '清雅', '暗香', '疏影', '凌寒', '独开'],
    '雨': ['清新', '忧愁', '润物', '细雨', '夜雨', '春雨', '秋雨', '烟雨'],
    '雪': ['纯洁', '寒冷', '冬日', '纷飞', '白雪', '瑞雪', '冰雪', '积雪'],
    '夜': ['宁静', '思念', '黑暗', '星辰', '深夜', '无眠', '静谧', '阑珊']
  };

  Object.entries(imageryData).forEach(([word, tags]) => {
    imageryMap.set(word, tags);
  });
};

initPoetryDatabase();

const upperLines = [
  { line: '床前明月光', rhyme: 'ang', imagery: ['月', '思乡'] },
  { line: '白日依山尽', rhyme: 'in', imagery: ['山', '太阳'] },
  { line: '红豆生南国', rhyme: 'o', imagery: ['红豆', '相思'] },
  { line: '春眠不觉晓', rhyme: 'ao', imagery: ['春天', '睡眠'] },
  { line: '月落乌啼霜满天', rhyme: 'an', imagery: ['月', '霜', '秋'] },
  { line: '千山鸟飞绝', rhyme: 'ue', imagery: ['山', '鸟', '冬天'] },
  { line: '空山新雨后', rhyme: 'ou', imagery: ['山', '雨', '秋天'] },
  { line: '移舟泊烟渚', rhyme: 'u', imagery: ['舟', '江', '黄昏'] },
  { line: '大漠孤烟直', rhyme: 'i', imagery: ['沙漠', '边塞', '孤独'] },
  { line: '黄河入海流', rhyme: 'iu', imagery: ['黄河', '大海', '壮阔'] },
  { line: '两个黄鹂鸣翠柳', rhyme: 'iu', imagery: ['鸟', '柳', '春天'] },
  { line: '窗含西岭千秋雪', rhyme: 'ue', imagery: ['山', '雪', '冬天'] },
  { line: '飞流直下三千尺', rhyme: 'i', imagery: ['瀑布', '壮观', '庐山'] },
  { line: '朝辞白帝彩云间', rhyme: 'an', imagery: ['云', '早晨', '长江'] },
  { line: '日照香炉生紫烟', rhyme: 'an', imagery: ['太阳', '山', '云烟'] },
  { line: '独在异乡为异客', rhyme: 'e', imagery: ['思乡', '重阳', '孤独'] },
  { line: '君问归期未有期', rhyme: 'i', imagery: ['思念', '归期', '夜雨'] },
  { line: '远上寒山石径斜', rhyme: 'ia', imagery: ['山', '秋天', '小路'] },
  { line: '月黑雁飞高', rhyme: 'ao', imagery: ['月', '边塞', '夜晚'] },
  { line: '林暗草惊风', rhyme: 'eng', imagery: ['树林', '风', '夜晚'] }
];

const famousPoems: Recommendation[] = [
  { poem: '明月松间照，清泉石上流', author: '王维', title: '山居秋暝', reason: '此句意境清幽，与王维山水诗的空灵风格相合' },
  { poem: '大漠孤烟直，长河落日圆', author: '王维', title: '使至塞上', reason: '边塞风光壮阔雄浑，意境辽远' },
  { poem: '采菊东篱下，悠然见南山', author: '陶渊明', title: '饮酒其五', reason: '隐逸之趣，物我两忘的超然境界' },
  { poem: '会当凌绝顶，一览众山小', author: '杜甫', title: '望岳', reason: '雄心壮志，登高望远的豪迈气概' },
  { poem: '海内存知己，天涯若比邻', author: '王勃', title: '送杜少府之任蜀州', reason: '送别诗中的千古名句，豁达乐观' },
  { poem: '千山鸟飞绝，万径人踪灭', author: '柳宗元', title: '江雪', reason: '孤寂清冷的意境，遗世独立' },
  { poem: '两岸猿声啼不住，轻舟已过万重山', author: '李白', title: '早发白帝城', reason: '李白式的飘逸洒脱，畅快淋漓' },
  { poem: '飞流直下三千尺，疑是银河落九天', author: '李白', title: '望庐山瀑布', reason: '大胆夸张，想象奇丽' },
  { poem: '停车坐爱枫林晚，霜叶红于二月花', author: '杜牧', title: '山行', reason: '秋日美景，生机盎然' },
  { poem: '夜来风雨声，花落知多少', author: '孟浩然', title: '春晓', reason: '惜春之情，言浅意深' },
  { poem: '举头望明月，低头思故乡', author: '李白', title: '静夜思', reason: '思乡诗的千古绝唱' },
  { poem: '野火烧不尽，春风吹又生', author: '白居易', title: '赋得古原草送别', reason: '生命力顽强，生生不息' },
  { poem: '欲穷千里目，更上一层楼', author: '王之涣', title: '登鹳雀楼', reason: '积极进取的人生哲理' },
  { poem: '随风潜入夜，润物细无声', author: '杜甫', title: '春夜喜雨', reason: '春雨的温柔，默默奉献' },
  { poem: '劝君更尽一杯酒，西出阳关无故人', author: '王维', title: '送元二使安西', reason: '送别诗的深情厚谊' }
];

const rooms = new Map<string, Room>();

const generateRoomId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getRandomUpperLine = () => {
  const selected = upperLines[Math.floor(Math.random() * upperLines.length)];
  return selected;
};

const detectTone = (char: string): '平' | '仄' | null => {
  const pinyinData = pinyinMap.get(char);
  if (!pinyinData) return null;
  return pinyinData.tone <= 2 ? '平' : '仄';
};

const getRhyme = (char: string): string | null => {
  for (const [rhyme, chars] of rhymeMap) {
    if (chars.includes(char)) {
      return rhyme;
    }
  }
  return null;
};

const calculateMeterScore = (lowerLine: string, upperLine: string): number => {
  const upperChars = upperLine.split('');
  const lowerChars = lowerLine.split('');
  
  if (lowerChars.length < 4) return 20;
  
  let correctCount = 0;
  let totalCount = 0;
  
  for (let i = 0; i < Math.min(upperChars.length, lowerChars.length); i++) {
    const upperTone = detectTone(upperChars[i]);
    const lowerTone = detectTone(lowerChars[i]);
    
    if (upperTone && lowerTone) {
      totalCount++;
      if (upperTone !== lowerTone) {
        correctCount++;
      }
    }
  }
  
  if (totalCount === 0) return 60;
  
  const score = Math.round((correctCount / totalCount) * 100);
  return Math.min(100, Math.max(20, score));
};

const calculateImageryScore = (lowerLine: string, upperLine: string): number => {
  const upperTags = new Set<string>();
  const lowerTags = new Set<string>();
  
  for (const char of upperLine) {
    const tags = imageryMap.get(char);
    if (tags) tags.forEach(t => upperTags.add(t));
  }
  
  for (const char of lowerLine) {
    const tags = imageryMap.get(char);
    if (tags) tags.forEach(t => lowerTags.add(t));
  }
  
  if (upperTags.size === 0) return 70;
  
  let matchCount = 0;
  upperTags.forEach(tag => {
    if (lowerTags.has(tag)) matchCount++;
  });
  
  const semanticScore = Math.round((matchCount / upperTags.size) * 100);
  
  const lengthBonus = lowerLine.length >= 4 ? 15 : 5;
  const charBonus = Math.min(lowerTags.size * 5, 20);
  
  const totalScore = Math.round(semanticScore * 0.6 + lengthBonus + charBonus);
  return Math.min(100, Math.max(30, totalScore));
};

const calculateAllusionScore = (lowerLine: string): number => {
  const allusionKeywords = ['明月', '南山', '东篱', '阳关', '红豆', '折柳', '梅花', '松柏', '竹', '兰', '菊', '荷', '雁', '杜鹃', '琵琶', '羌笛', '楼兰', '燕然', '长城', '黄河', '长江', '西湖', '洞庭', '泰山', '华山'];
  
  let matchCount = 0;
  for (const keyword of allusionKeywords) {
    if (lowerLine.includes(keyword)) {
      matchCount++;
    }
  }
  
  const baseScore = 50;
  const matchBonus = matchCount * 15;
  const lengthBonus = lowerLine.length >= 5 ? 10 : 0;
  
  const totalScore = baseScore + matchBonus + lengthBonus;
  return Math.min(100, Math.max(40, totalScore));
};

const calculateTotalScore = (meter: number, imagery: number, allusion: number): number => {
  return Math.round(meter * 0.25 + imagery * 0.35 + allusion * 0.40);
};

const findRecommendations = (lowerLine: string, imageryScore: number): Recommendation[] => {
  const scored = famousPoems.map(poem => {
    let score = Math.random();
    for (const char of lowerLine) {
      if (poem.poem.includes(char)) {
        score += 0.1;
      }
    }
    return { ...poem, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(({ score, ...rest }) => rest);
};

const checkRhymeMatch = (lowerLine: string, upperRhyme: string): boolean => {
  const lastChar = lowerLine.charAt(lowerLine.length - 1);
  const lineRhyme = getRhyme(lastChar);
  return lineRhyme === upperRhyme;
};

const handlePlayerJoin = (socket: Socket, roomId: string, nickname: string, existingPlayerId?: string) => {
  let room = rooms.get(roomId);
  
  if (!room) {
    room = {
      id: roomId,
      players: [],
      currentTurn: 0,
      currentUpperLine: '',
      timeLeft: 90,
      gameState: 'waiting',
      poemEntries: []
    };
    rooms.set(roomId, room);
  }
  
  const existingPlayer = room.players.find(p => p.id === existingPlayerId);
  
  if (existingPlayer) {
    existingPlayer.isOnline = true;
    existingPlayer.id = socket.id;
    delete existingPlayer.disconnectedAt;
    socket.join(roomId);
    io.to(roomId).emit('room_state', room);
    return;
  }
  
  if (room.players.length >= 6) {
    socket.emit('error', { message: '房间已满' });
    return;
  }
  
  const usedSeats = room.players.map(p => p.seatIndex);
  let seatIndex = 0;
  while (usedSeats.includes(seatIndex)) {
    seatIndex++;
  }
  
  const player: Player = {
    id: socket.id,
    nickname,
    score: 0,
    isOnline: true,
    isHost: room.players.length === 0,
    seatIndex
  };
  
  room.players.push(player);
  socket.join(roomId);
  
  io.to(roomId).emit('player_joined', player);
  io.to(roomId).emit('room_state', room);
};

const startTurn = (room: Room) => {
  if (room.gameState !== 'playing') return;
  
  const currentPlayer = room.players[room.currentTurn];
  if (!currentPlayer) return;
  
  const upperLineData = getRandomUpperLine();
  room.currentUpperLine = upperLineData.line;
  room.timeLeft = 90;
  
  io.to(room.id).emit('turn_start', {
    playerId: currentPlayer.id,
    nickname: currentPlayer.nickname,
    upperLine: upperLineData.line,
    upperRhyme: upperLineData.rhyme,
    timeLeft: room.timeLeft
  });
  
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
  }
  
  room.timerInterval = setInterval(() => {
    room.timeLeft--;
    io.to(room.id).emit('time_update', room.timeLeft);
    
    if (room.timeLeft <= 0) {
      endTurn(room, true);
    }
  }, 1000);
};

const endTurn = (room: Room, timeout: boolean = false) => {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    delete room.timerInterval;
  }
  
  if (!timeout) {
    room.currentTurn++;
    
    if (room.currentTurn >= room.players.length) {
      room.gameState = 'flowing';
      io.to(room.id).emit('flowing_start', room.poemEntries);
      return;
    }
  } else {
    room.currentTurn++;
    if (room.currentTurn >= room.players.length) {
      room.gameState = 'flowing';
      io.to(room.id).emit('flowing_start', room.poemEntries);
      return;
    }
  }
  
  setTimeout(() => startTurn(room), 1000);
};

const submitPoem = (socket: Socket, roomId: string, poem: string) => {
  const room = rooms.get(roomId);
  if (!room || room.gameState !== 'playing') return;
  
  const currentPlayer = room.players[room.currentTurn];
  if (!currentPlayer || currentPlayer.id !== socket.id) return;
  
  const upperLine = room.currentUpperLine;
  const upperLineData = upperLines.find(u => u.line === upperLine);
  const upperRhyme = upperLineData?.rhyme || 'ang';
  
  const rhymeMatch = checkRhymeMatch(poem, upperRhyme);
  
  const meterScore = calculateMeterScore(poem, upperLine);
  const imageryScore = calculateImageryScore(poem, upperLine);
  const allusionScore = calculateAllusionScore(poem);
  const totalScore = calculateTotalScore(meterScore, imageryScore, allusionScore);
  
  const finalTotalScore = rhymeMatch ? totalScore : Math.max(40, Math.round(totalScore * 0.7));
  
  const score: Score = {
    meter: meterScore,
    imagery: imageryScore,
    allusion: allusionScore,
    total: finalTotalScore
  };
  
  const recommendations = findRecommendations(poem, imageryScore);
  
  currentPlayer.score += finalTotalScore;
  
  const entry: PoemEntry = {
    playerId: currentPlayer.id,
    nickname: currentPlayer.nickname,
    upperLine,
    lowerLine: poem,
    score
  };
  
  room.poemEntries.push(entry);
  
  io.to(roomId).emit('score_result', {
    playerId: currentPlayer.id,
    nickname: currentPlayer.nickname,
    poem,
    upperLine,
    score,
    recommendations,
    rhymeMatch
  });
  
  endTurn(room, false);
};

io.on('connection', (socket: Socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('create_room', ({ nickname }: { nickname: string }) => {
    const roomId = generateRoomId();
    handlePlayerJoin(socket, roomId, nickname);
    socket.emit('room_created', roomId);
  });
  
  socket.on('join_room', ({ roomId, nickname, playerId }: { roomId: string; nickname: string; playerId?: string }) => {
    if (!rooms.has(roomId.toUpperCase())) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    handlePlayerJoin(socket, roomId.toUpperCase(), nickname, playerId);
    socket.emit('room_joined', roomId.toUpperCase());
  });
  
  socket.on('start_game', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { message: '只有房主可以开始游戏' });
      return;
    }
    
    if (room.players.length < 3) {
      socket.emit('error', { message: '至少需要3位玩家才能开始游戏' });
      return;
    }
    
    room.gameState = 'playing';
    room.currentTurn = 0;
    room.poemEntries = [];
    
    io.to(roomId).emit('game_started', room);
    setTimeout(() => startTurn(room), 1500);
  });
  
  socket.on('submit_poem', ({ roomId, poem }: { roomId: string; poem: string }) => {
    submitPoem(socket, roomId, poem);
  });
  
  socket.on('typing', ({ roomId, isTyping }: { roomId: string; isTyping: boolean }) => {
    socket.to(roomId).emit('player_typing', { playerId: socket.id, isTyping });
  });
  
  socket.on('restart_game', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) return;
    
    room.gameState = 'playing';
    room.currentTurn = 0;
    room.poemEntries = [];
    
    io.to(roomId).emit('game_restarted', room);
    setTimeout(() => startTurn(room), 1500);
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    rooms.forEach((room, roomId) => {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.isOnline = false;
        player.disconnectedAt = Date.now();
        
        io.to(roomId).emit('player_left', player);
        io.to(roomId).emit('room_state', room);
        
        setTimeout(() => {
          const currentRoom = rooms.get(roomId);
          const currentPlayer = currentRoom?.players.find(p => p.id === socket.id);
          if (currentPlayer && !currentPlayer.isOnline && currentPlayer.disconnectedAt) {
            const timePassed = Date.now() - currentPlayer.disconnectedAt;
            if (timePassed >= 60000) {
              if (currentRoom) {
                currentRoom.players = currentRoom.players.filter(p => p.id !== socket.id);
                if (currentRoom.players.length > 0 && currentPlayer.isHost) {
                  currentRoom.players[0].isHost = true;
                }
                io.to(roomId).emit('room_state', currentRoom);
                
                if (currentRoom.players.length === 0) {
                  rooms.delete(roomId);
                }
              }
            }
          }
        }, 60000);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`曲水流觞服务器运行在端口 ${PORT}`);
});
