import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

interface Song {
  id: string;
  title: string;
  artist: string;
  chorusStart: number;
  chorusEnd: number;
  duration: number;
  lyrics: string[];
  chorusLineIndex: number;
  audioUrl: string;
}

interface Player {
  id: string;
  socketId: string;
  nickname: string;
  avatar: string;
  score: number;
  isHost: boolean;
  feedback?: { type: 'success' | 'error'; timestamp: number } | null;
}

interface Room {
  id: string;
  name: string;
  players: Player[];
  currentSongIndex: number;
  roundActive: boolean;
  targetLyric: string;
  nextLyric: string;
  currentLineIndex: number;
  roundNumber: number;
  records: GameRecord[];
  startTime: number;
  countdown: number;
  hostId: string;
}

interface GameRecord {
  id: string;
  playerId: string;
  nickname: string;
  avatar: string;
  input: string;
  correct: boolean;
  scoreDelta: number;
  timestamp: number;
  songTitle: string;
}

const songs: Song[] = [
  {
    id: '1', title: '晴天', artist: '周杰伦',
    chorusStart: 60, chorusEnd: 75, duration: 269,
    lyrics: ['故事的小黄花', '从出生那年就飘着', '童年的荡秋千', '随记忆一直晃到现在', 'Re So So Si Do Si La', 'So La Si Si Si Si La Si La So', '吹着前奏望着天空', '我想起花瓣试着掉落', '为你翘课的那一天', '花落的那一天', '教室的那一间', '我怎么看不见', '消失的下雨天', '我好想再淋一遍'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: '2', title: '七里香', artist: '周杰伦',
    chorusStart: 55, chorusEnd: 70, duration: 298,
    lyrics: ['窗外的麻雀在电线杆上多嘴', '你说这一句很有夏天的感觉', '手中的铅笔在纸上来来回回', '我用几行字形容你是我的谁', '秋刀鱼的滋味猫跟你都想了解', '初恋的香味就这样被我们寻回', '那温暖的阳光像刚摘的鲜艳草莓', '你说你舍不得吃掉这一种感觉', '雨下整夜我的爱溢出就像雨水', '院子落叶跟我的思念厚厚一叠', '几句是非也无法将我的热情冷却', '你出现在我诗的每一页'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: '3', title: '稻香', artist: '周杰伦',
    chorusStart: 50, chorusEnd: 65, duration: 223,
    lyrics: ['对这个世界如果你有太多的抱怨', '跌倒了就不敢继续往前走', '为什么人要这么的脆弱堕落', '请你打开电视看看', '多少人为生命在努力勇敢的走下去', '我们是不是该知足', '珍惜一切就算没有拥有', '还记得你说家是唯一的城堡', '随着稻香河流继续奔跑', '微微笑小时候的梦我知道', '不要哭让萤火虫带着你逃跑', '乡间的歌谣永远的依靠', '回家吧回到最初的美好'],
    chorusLineIndex: 7,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: '4', title: '青花瓷', artist: '周杰伦',
    chorusStart: 62, chorusEnd: 77, duration: 239,
    lyrics: ['素胚勾勒出青花笔锋浓转淡', '瓶身描绘的牡丹一如你初妆', '冉冉檀香透过窗心事我了然', '宣纸上走笔至此搁一半', '釉色渲染仕女图韵味被私藏', '而你嫣然的一笑如含苞待放', '你的美一缕飘散', '去到我去不了的地方', '天青色等烟雨而我在等你', '炊烟袅袅升起隔江千万里', '在瓶底书汉隶仿前朝的飘逸', '就当我为遇见你伏笔'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: '5', title: '简单爱', artist: '周杰伦',
    chorusStart: 48, chorusEnd: 63, duration: 270,
    lyrics: ['说不上为什么我变得很主动', '若爱上一个人什么都会值得去做', '我想大声宣布对你依依不舍', '连隔壁邻居都猜到我现在的感受', '河边的风在吹着头发飘动', '牵着你的手一阵莫名感动', '我想带你回我的外婆家', '一起看着日落一直到我们都睡着', '我想就这样牵着你的手不放开', '爱能不能够永远单纯没有悲哀', '我想和你骑单车我想和你看棒球', '想这样没担忧唱着歌一直走'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: '6', title: '后来', artist: '刘若英',
    chorusStart: 70, chorusEnd: 85, duration: 336,
    lyrics: ['后来我总算学会了如何去爱', '可惜你早已远去消失在人海', '后来终于在眼泪中明白', '有些人一旦错过就不再', '栀子花白花瓣落在我蓝色百褶裙上', '爱你你轻声说我低下头闻见一阵芬芳', '那个永恒的夜晚十七岁仲夏', '你吻我的那个夜晚', '让我往后的时光每当有感叹', '总想起当天的星光', '那时候的爱情为什么就能那样简单', '而又是为什么人年少时', '一定要让深爱的人受伤'],
    chorusLineIndex: 0,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: '7', title: '童话', artist: '光良',
    chorusStart: 75, chorusEnd: 90, duration: 264,
    lyrics: ['忘了有多久再没听到你', '对我说你最爱的故事', '我想了很久我开始慌了', '是不是我又做错了什么', '你哭着对我说童话里都是骗人的', '我不可能是你的王子', '也许你不会懂从你说爱我以后', '我的天空星星都亮了', '我愿变成童话里你爱的那个天使', '张开双手变成翅膀守护你', '你要相信相信我们会像童话故事里', '幸福和快乐是结局'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: '8', title: '孤勇者', artist: '陈奕迅',
    chorusStart: 65, chorusEnd: 80, duration: 262,
    lyrics: ['都是勇敢的', '你额头的伤口你的不同你犯的错', '都不必隐藏', '你破旧的玩偶你的面具你的自我', '他们说要带着光驯服每一头怪兽', '他们说要缝好你的伤没有人爱小丑', '为何孤独不可光荣', '人只有不完美值得歌颂', '谁说污泥满身的不算英雄', '爱你孤身走暗巷爱你不跪的模样', '爱你对峙过绝望不肯哭一场', '爱你破烂的衣裳却敢堵命运的枪', '爱你和我那么像缺口都一样', '去吗配吗这褴褛的披风', '战吗战啊以最卑微的梦', '致那黑夜中的呜咽与怒吼', '谁说站在光里的才算英雄'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: '9', title: '十年', artist: '陈奕迅',
    chorusStart: 60, chorusEnd: 75, duration: 206,
    lyrics: ['如果那两个字没有颤抖', '我不会发现我难受', '怎么说出口也不过是分手', '如果对于明天没有要求', '牵牵手就像旅游', '成千上万个门口总有一个人要先走', '怀抱既然不能逗留', '何不在离开的时候', '一边享受一边泪流', '十年之前我不认识你你不属于我', '我们还是一样陪在一个陌生人左右', '走过渐渐熟悉的街头', '十年之后我们是朋友还可以问候', '只是那种温柔再也找不到拥抱的理由', '情人最后难免沦为朋友'],
    chorusLineIndex: 9,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: '10', title: '演员', artist: '薛之谦',
    chorusStart: 72, chorusEnd: 87, duration: 260,
    lyrics: ['简单点说话的方式简单点', '递进的情绪请省略', '你又不是个演员', '别设计那些情节', '没意见我只想看看你怎么圆', '你难过的太表面像没天赋的演员', '观众一眼能看见', '该配合你演出的我演视而不见', '在逼一个最爱你的人即兴表演', '什么时候我们开始收起了底线', '顺应时代的改变看那些拙劣的表演', '可你曾经那么爱我干嘛演出细节', '我该变成什么样子才能延缓厌倦', '原来当爱放下防备后的这些那些', '才是考验'],
    chorusLineIndex: 7,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  {
    id: '11', title: '告白气球', artist: '周杰伦',
    chorusStart: 52, chorusEnd: 67, duration: 215,
    lyrics: ['塞纳河畔左岸的咖啡', '我手一杯品尝你的美', '留下唇印的嘴', '花店玫瑰名字写错谁', '告白气球风吹到对街', '微笑在天上飞', '你说你有点难追想让我知难而退', '礼物不需挑最贵只要香榭的落叶', '喔营造浪漫的约会不害怕搞砸一切', '拥有你就拥有全世界', '亲爱的爱上你从那天起', '甜蜜的很轻易', '亲爱的别任性你的眼睛', '在说我愿意'],
    chorusLineIndex: 10,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'
  },
  {
    id: '12', title: '起风了', artist: '买辣椒也用券',
    chorusStart: 85, chorusEnd: 100, duration: 325,
    lyrics: ['这一路上走走停停', '顺着少年漂流的痕迹', '迈出车站的前一刻', '竟有些犹豫', '不禁笑这近乡情怯', '仍无可避免', '而长野的天', '依旧那么暖', '风吹起了从前', '从前初识这世间万般流连', '看着天边似在眼前', '也甘愿赴汤蹈火去走它一遍', '如今走过这世间万般流连', '翻过岁月不同侧脸', '措不及防闯入你的笑颜', '我曾难自拔于世界之大', '也沉溺于其中梦话', '不得真假不做挣扎不惧笑话'],
    chorusLineIndex: 9,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
  },
  {
    id: '13', title: '平凡之路', artist: '朴树',
    chorusStart: 78, chorusEnd: 93, duration: 305,
    lyrics: ['徘徊着的在路上的', '你要走吗Via Via', '易碎的骄傲着', '那也曾是我的模样', '沸腾着的不安着的', '你要去哪Via Via', '谜一样的沉默着的', '故事你真的在听吗', '我曾经跨过山和大海', '也穿过人山人海', '我曾经拥有着的一切', '转眼都飘散如烟', '我曾经失落失望失掉所有方向', '直到看见平凡才是唯一的答案'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'
  },
  {
    id: '14', title: '光年之外', artist: '邓紫棋',
    chorusStart: 70, chorusEnd: 85, duration: 235,
    lyrics: ['感受停在我发端的指尖', '如何瞬间冻结时间', '记住望着我坚定的双眼', '也许已经没有明天', '面对浩瀚的星海', '我们微小得像尘埃', '漂浮在一片无奈', '缘分让我们相遇乱世以外', '命运却要我们危难中相爱', '也许未来遥远在光年之外', '我愿守候未知里为你等待', '我没想到为了你我能疯狂到', '山崩海啸没有你根本不想逃', '我的大脑为了你已经疯狂到', '脉搏心跳没有你根本不重要'],
    chorusLineIndex: 7,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'
  },
  {
    id: '15', title: '夜曲', artist: '周杰伦',
    chorusStart: 58, chorusEnd: 73, duration: 225,
    lyrics: ['一群嗜血的蚂蚁被腐肉所吸引', '我面无表情看孤独的风景', '失去你爱恨开始分明', '失去你还有什么事好关心', '当鸽子不再象征和平', '我终于被提醒广场上喂食的是秃鹰', '我用漂亮的押韵形容被掠夺一空的爱情', '啊乌云开始遮蔽夜色不干净', '公园里葬礼的回音在漫天飞行', '送你的白色玫瑰在纯黑的环境凋零', '乌鸦在树枝上诡异的很安静', '静静听我黑色的大衣想温暖你日渐冰冷的回忆', '走过的走过的生命'],
    chorusLineIndex: 7,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'
  },
  {
    id: '16', title: '倔强', artist: '五月天',
    chorusStart: 65, chorusEnd: 80, duration: 265,
    lyrics: ['当我和世界不一样那就让我不一样', '坚持对我来说就是以刚克刚', '我如果对自己妥协如果对自己说谎', '即使别人原谅我也不能原谅', '最美的愿望一定最疯狂', '我就是我自己的神在我活的地方', '我和我最后的倔强握紧双手绝对不放', '下一站是不是天堂就算失望不能绝望', '我和我骄傲的倔强我在风中大声的唱', '这一次为自己疯狂就这一次我和我的倔强', '对爱我的人别紧张我的固执很善良', '我的手越肮脏眼神越是发光'],
    chorusLineIndex: 6,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'
  },
  {
    id: '17', title: '突然好想你', artist: '五月天',
    chorusStart: 68, chorusEnd: 83, duration: 316,
    lyrics: ['最怕空气突然安静', '最怕朋友突然的关心', '最怕回忆突然翻滚绞痛着不平息', '最怕突然听到你的消息', '想念如果会有声音', '不愿那是悲伤的哭泣', '事到如今终于让自已属于我自已', '只剩眼泪还骗不过自己', '突然好想你你会在哪里', '过得快乐或委屈', '突然好想你突然锋利的回忆', '突然模糊的眼睛', '我们像一首最美丽的歌曲', '变成两部悲伤的电影'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3'
  },
  {
    id: '18', title: '小幸运', artist: '田馥甄',
    chorusStart: 75, chorusEnd: 90, duration: 293,
    lyrics: ['我听见雨滴落在青青草地', '我听见远方下课钟声响起', '可是我没有听见你的声音', '认真呼唤我姓名', '爱上你的时候还不懂感情', '离别了才觉得刻骨铭心', '为什么没有发现遇见了你', '是生命最好的事情', '也许当时忙着微笑和哭泣', '忙着追逐天空中的流星', '人理所当然的忘记', '是谁风里雨里一直默默守护在原地', '原来你是我最想留住的幸运', '原来我们和爱情曾经靠得那么近', '那为我对抗世界的决定', '那陪我淋的雨一幕幕都是你一尘不染的真心'],
    chorusLineIndex: 13,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3'
  },
  {
    id: '19', title: '成都', artist: '赵雷',
    chorusStart: 60, chorusEnd: 75, duration: 328,
    lyrics: ['让我掉下眼泪的不止昨夜的酒', '让我依依不舍的不止你的温柔', '余路还要走多久你攥着我的手', '让我感到为难的是挣扎的自由', '分别总是在九月回忆是思念的愁', '深秋嫩绿的垂柳亲吻着我额头', '在那座阴雨的小城里我从未忘记你', '成都带不走的只有你', '和我在成都的街头走一走', '直到所有的灯都熄灭了也不停留', '你会挽着我的衣袖我会把手揣进裤兜', '走到玉林路的尽头坐在小酒馆的门口'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3'
  },
  {
    id: '20', title: '体面', artist: '于文文',
    chorusStart: 65, chorusEnd: 80, duration: 266,
    lyrics: ['别堆砌怀念让剧情变得狗血', '深爱了多年又何必毁了经典', '都已成年不拖不欠', '浪费时间是我情愿', '像谢幕的演员眼看着灯光熄灭', '来不及再轰轰烈烈', '就保留告别的尊严', '我爱你不后悔也尊重故事结尾', '分手应该体面谁都不要说抱歉', '何来亏欠我敢给就敢心碎', '镜头前面是从前的我们', '在喝彩流着泪声嘶力竭', '离开也很体面才没辜负这些年', '爱得热烈认真付出的画面'],
    chorusLineIndex: 8,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3'
  },
  {
    id: '21', title: '海阔天空', artist: 'Beyond',
    chorusStart: 72, chorusEnd: 87, duration: 326,
    lyrics: ['今天我寒夜里看雪飘过', '怀着冷却了的心窝飘远方', '风雨里追赶雾里分不清影踪', '天空海阔你与我', '可会变谁没在变', '多少次迎着冷眼与嘲笑', '从没有放弃过心中的理想', '一刹那恍惚若有所失的感觉', '不知不觉已变淡心里爱谁明白我', '原谅我这一生不羁放纵爱自由', '也会怕有一天会跌倒', '背弃了理想谁人都可以', '那会怕有一天只你共我'],
    chorusLineIndex: 9,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: '22', title: '匆匆那年', artist: '王菲',
    chorusStart: 70, chorusEnd: 85, duration: 287,
    lyrics: ['匆匆那年我们', '一时匆忙撂下难以承受的诺言', '只有等别人兑现', '不怪那吻痕还没积累成茧', '拥抱着冬眠也没能羽化再成仙', '不怪这一段情没空反复再排练', '是岁月宽容恩赐反悔的时间', '如果再见不能红着眼', '是否还能红着脸', '就像那年匆促刻下永远一起', '那样美丽的谣言', '如果过去还值得眷恋', '别太快冰释前嫌', '谁甘心就这样彼此无挂也无牵'],
    chorusLineIndex: 7,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  }
];

const rooms: Map<string, Room> = new Map();
const avatars = ['🦊', '🐼', '🦁', '🐯', '🐨', '🐸', '🦉', '🦄', '🐙', '🐬', '🦋', '🌸', '🌺', '🌟', '💎', '🔥'];

function normalize(str: string): string {
  return str.replace(/[，。！？、,.!?\s"'`~@#$%^&*()_+\-=\[\]{};:"\\|<>\/]/g, '').toLowerCase();
}

function isSimilar(a: string, b: string, maxErrors = 1): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (Math.abs(na.length - nb.length) > maxErrors + 2) return false;
  const dp: number[][] = [];
  for (let i = 0; i <= na.length; i++) {
    dp[i] = new Array(nb.length + 1).fill(0);
    dp[i][0] = i;
  }
  for (let j = 0; j <= nb.length; j++) dp[0][j] = j;
  for (let i = 1; i <= na.length; i++) {
    for (let j = 1; j <= nb.length; j++) {
      if (na[i - 1] === nb[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }
  return dp[na.length][nb.length] <= maxErrors;
}

function pickRandomAvatar(): string {
  return avatars[Math.floor(Math.random() * avatars.length)];
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/songs', (_req, res) => {
  res.json(songs.map(s => ({
    id: s.id, title: s.title, artist: s.artist,
    chorusStart: s.chorusStart, chorusEnd: s.chorusEnd,
    duration: s.duration, lyrics: s.lyrics,
    chorusLineIndex: s.chorusLineIndex, audioUrl: s.audioUrl
  })));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

function broadcastRanking(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const ranking = [...room.players].sort((a, b) => b.score - a.score).map((p, i) => ({
    rank: i + 1, id: p.id, nickname: p.nickname, avatar: p.avatar, score: p.score, isHost: p.isHost, feedback: p.feedback || null
  }));
  io.to(roomId).emit('updateRanking', { ranking, hostId: room.hostId });
}

function broadcastRecords(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('updateRecords', { records: room.records.slice(-30) });
}

io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinRoom', ({ roomName, nickname }, cb) => {
    try {
      let room = Array.from(rooms.values()).find(r => r.name === roomName);
      const playerId = uuidv4();
      const isNewRoom = !room;
      if (!room) {
        room = {
          id: uuidv4(), name: roomName, players: [],
          currentSongIndex: 0, roundActive: false,
          targetLyric: '', nextLyric: '', currentLineIndex: 0,
          roundNumber: 0, records: [], startTime: 0, countdown: 15,
          hostId: playerId
        };
        rooms.set(room.id, room);
      }
      const player: Player = {
        id: playerId, socketId: socket.id, nickname,
        avatar: pickRandomAvatar(), score: 0, isHost: isNewRoom,
        feedback: null
      };
      if (isNewRoom) room.hostId = playerId;
      room.players.push(player);
      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.data.playerId = playerId;
      io.to(room.id).emit('playerJoined', {
        player: { id: player.id, nickname: player.nickname, avatar: player.avatar, score: 0, isHost: player.isHost },
        currentSong: null,
        roundActive: room.roundActive,
        countdown: room.countdown,
        roomName: room.name
      });
      broadcastRanking(room.id);
      cb && cb({ success: true, playerId, roomId: room.id, isHost: player.isHost });
    } catch (e: any) {
      cb && cb({ success: false, error: e.message });
    }
  });

  socket.on('startRound', (_data, cb) => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room) { cb && cb({ success: false }); return; }
    const currentPlayer = room.players.find(p => p.id === socket.data.playerId);
    if (!currentPlayer || currentPlayer.id !== room.hostId) { cb && cb({ success: false }); return; }
    const songIdx = Math.floor(Math.random() * songs.length);
    const song = songs[songIdx];
    const lineIdx = song.chorusLineIndex;
    const target = song.lyrics[lineIdx] || '';
    const next = song.lyrics[lineIdx + 1] || song.lyrics[lineIdx] || '';
    room.currentSongIndex = songIdx;
    room.currentLineIndex = lineIdx;
    room.targetLyric = target;
    room.nextLyric = next;
    room.roundActive = true;
    room.roundNumber += 1;
    room.countdown = 15;
    room.startTime = Date.now();
    io.to(roomId).emit('roundStarted', {
      song: {
        id: song.id, title: song.title, artist: song.artist,
        chorusStart: song.chorusStart, chorusEnd: song.chorusEnd,
        duration: song.duration, audioUrl: song.audioUrl,
        targetLyric: target, nextLyric: next
      },
      countdown: 15,
      roundNumber: room.roundNumber,
      host: { id: currentPlayer.id, nickname: currentPlayer.nickname, avatar: currentPlayer.avatar }
    });
    const tick = setInterval(() => {
      const r = rooms.get(roomId);
      if (!r || !r.roundActive) { clearInterval(tick); return; }
      r.countdown = Math.max(0, 15 - Math.floor((Date.now() - r.startTime) / 1000));
      io.to(roomId).emit('countdownTick', { countdown: r.countdown });
      if (r.countdown <= 0) {
        clearInterval(tick);
        r.roundActive = false;
        const sorted = [...r.players].sort((a, b) => b.score - a.score);
        const newHost = sorted[0];
        if (newHost) {
          r.players.forEach(p => { p.isHost = (p.id === newHost.id); });
          r.hostId = newHost.id;
        }
        io.to(roomId).emit('roundEnded', {
          correctAnswer: r.nextLyric,
          newHost: { id: newHost?.id, nickname: newHost?.nickname, avatar: newHost?.avatar }
        });
        broadcastRanking(roomId);
      }
    }, 500);
    cb && cb({ success: true });
  });

  socket.on('submitLyric', ({ input }, cb) => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || !room.roundActive) { cb && cb({ success: false }); return; }
    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player) { cb && cb({ success: false }); return; }
    const correct = isSimilar(input, room.nextLyric, 1);
    let scoreDelta = 0;
    if (correct) {
      const timeLeft = room.countdown;
      scoreDelta = 10 + timeLeft * 2;
      player.score += scoreDelta;
      player.feedback = { type: 'success', timestamp: Date.now() };
    } else {
      player.feedback = { type: 'error', timestamp: Date.now() };
    }
    const song = songs[room.currentSongIndex];
    const record: GameRecord = {
      id: uuidv4(), playerId: player.id, nickname: player.nickname,
      avatar: player.avatar, input, correct, scoreDelta,
      timestamp: Date.now(), songTitle: song?.title || ''
    };
    room.records.push(record);
    io.to(roomId).emit('broadcastResult', {
      result: record,
      allCorrect: Array.from(new Set(room.records.filter(r => r.correct).map(r => r.playerId))).length,
      totalPlayers: room.players.length
    });
    setTimeout(() => {
      const r = rooms.get(roomId);
      if (r) {
        const p = r.players.find(pp => pp.id === player.id);
        if (p) p.feedback = null;
        broadcastRanking(roomId);
      }
    }, 500);
    broadcastRecords(roomId);
    broadcastRanking(roomId);
    cb && cb({ success: true, correct, scoreDelta });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    const room = rooms.get(roomId);
    if (room) {
      const idx = room.players.findIndex(p => p.id === playerId);
      if (idx >= 0) {
        const leftPlayer = room.players[idx];
        room.players.splice(idx, 1);
        io.to(roomId).emit('playerLeft', { playerId, nickname: leftPlayer.nickname });
        if (leftPlayer.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          room.hostId = room.players[0].id;
        }
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          broadcastRanking(roomId);
        }
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎤 Lyrics Chain Server running on port ${PORT}`);
});
