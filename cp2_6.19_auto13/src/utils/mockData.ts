import type { Song, Playlist } from '@/types';
import { generateRandomColor, generateId } from './helpers';

const songData: Array<Omit<Song, 'id' | 'color' | 'cover'>> = [
  {
    title: '夜曲',
    artist: '周杰伦',
    album: '十一月的萧邦',
    duration: 240,
    lyrics: '一群嗜血的蚂蚁 被腐肉所吸引\n我面无表情 看孤独的风景\n失去你 爱恨开始分明\n失去你 还有什么事好关心',
  },
  {
    title: '稻香',
    artist: '周杰伦',
    album: '魔杰座',
    duration: 223,
    lyrics: '对这个世界如果你有太多的抱怨\n跌倒了 就不敢继续往前走\n为什么 人要这么的脆弱 堕落',
  },
  {
    title: '晴天',
    artist: '周杰伦',
    album: '叶惠美',
    duration: 269,
    lyrics: '故事的小黄花\n从出生那年就飘着\n童年的荡秋千\n随记忆一直晃到现在',
  },
  {
    title: '七里香',
    artist: '周杰伦',
    album: '七里香',
    duration: 299,
    lyrics: '窗外的麻雀 在电线杆上多嘴\n你说这一句 很有夏天的感觉\n手中的铅笔 在纸上来来回回\n我用几行字形容你是我的谁',
  },
  {
    title: '青花瓷',
    artist: '周杰伦',
    album: '我很忙',
    duration: 239,
    lyrics: '素胚勾勒出青花笔锋浓转淡\n瓶身描绘的牡丹一如你初妆\n冉冉檀香透过窗心事我了然\n宣纸上走笔至此搁一半',
  },
  {
    title: '后来',
    artist: '刘若英',
    album: '我等你',
    duration: 338,
    lyrics: '后来 我总算学会了如何去爱\n可惜你早已远去 消失在人海\n后来 终于在眼泪中明白\n有些人 一旦错过就不在',
  },
  {
    title: '匆匆那年',
    artist: '王菲',
    album: '匆匆那年',
    duration: 287,
    lyrics: '匆匆那年我们 究竟说了几遍\n再见之后再拖延\n可惜谁有没有 爱过不是一场\n七情上面的雄辩',
  },
  {
    title: '红豆',
    artist: '王菲',
    album: '唱游',
    duration: 264,
    lyrics: '还没好好的感受 雪花绽放的气候\n我们一起颤抖 会更明白 什么是温柔\n还没跟你牵着手 走过荒芜的沙丘\n可能从此以后 学会珍惜 天长和地久',
  },
  {
    title: '十年',
    artist: '陈奕迅',
    album: '黑白灰',
    duration: 205,
    lyrics: '如果那两个字没有颤抖\n我不会发现 我难受\n怎么说出口 也不过是分手\n如果对于明天没有要求\n牵牵手就像旅游',
  },
  {
    title: '浮夸',
    artist: '陈奕迅',
    album: 'U87',
    duration: 296,
    lyrics: '有人问我 我就会讲 但是无人来\n我期待 到无奈 有话要讲\n得不到装载\n我的心情犹像樽盖 等被揭开',
  },
  {
    title: '富士山下',
    artist: '陈奕迅',
    album: 'What\'s Going On...?',
    duration: 273,
    lyrics: '拦路雨偏似雪花 饮泣的你冻吗\n这风褛我给你磨到有襟花\n连调了职也不怕 怎么始终牵挂\n苦心选中今天想车你回家',
  },
  {
    title: '演员',
    artist: '薛之谦',
    album: '绅士',
    duration: 257,
    lyrics: '简单点说话的方式简单点\n递进的情绪请省略\n你又不是个演员\n别设计那些情节\n没意见我只想看看你怎么圆',
  },
  {
    title: '丑八怪',
    artist: '薛之谦',
    album: '意外',
    duration: 246,
    lyrics: '如果世界漆黑 其实我很美\n在爱情里面进退 最多被消费\n不管同样的是非 又怎么不对 无所谓\n如果像你一样 总有人赞美',
  },
  {
    title: '光年之外',
    artist: '邓紫棋',
    album: '光年之外',
    duration: 235,
    lyrics: '感受停在我发端的指尖\n如何瞬间 冻结时间\n记住望着我坚定的双眼\n也许已经 没有明天',
  },
  {
    title: '泡沫',
    artist: '邓紫棋',
    album: 'Xposed',
    duration: 276,
    lyrics: '阳光下的泡沫 是彩色的\n就像被骗的我 是幸福的\n追究什么对错 你的谎言\n基于你还爱我',
  },
  {
    title: '年少有为',
    artist: '李荣浩',
    album: '耳朵',
    duration: 268,
    lyrics: '电视一直闪 联络方式都还没删\n你待我的好 我却错手毁掉\n也曾一起想 有个地方睡觉吃饭\n可怎么去熬 日夜颠倒连头款也凑不到',
  },
  {
    title: '李白',
    artist: '李荣浩',
    album: '模特',
    duration: 261,
    lyrics: '大部分人要我学习去看 世俗的眼光\n我认真学习了世俗眼光 世俗到天亮\n一部外国电影没听懂一句话\n看完结局才是笑话',
  },
  {
    title: '模特',
    artist: '李荣浩',
    album: '模特',
    duration: 297,
    lyrics: '穿华丽的服装 为原始的渴望而站着\n用完美的表情 为脆弱的城市而撑着\n我冷漠的接受 你焦急的等待也困着\n像无数生存在橱窗里的模特',
  },
  {
    title: '成都',
    artist: '赵雷',
    album: '无法长大',
    duration: 329,
    lyrics: '让我掉下眼泪的 不止昨夜的酒\n让我依依不舍的 不止你的温柔\n余路还要走多久 你攥着我的手\n让我感到为难的 是挣扎的自由',
  },
  {
    title: '南方姑娘',
    artist: '赵雷',
    album: '赵小雷',
    duration: 322,
    lyrics: '北方的村庄住着一个南方的姑娘\n她总是喜欢穿着带花的裙子站在路旁\n她的话不多但笑起来是那么平静优雅\n她柔弱的眼神里装的是什么 是思念的忧伤',
  },
  {
    title: '阿刁',
    artist: '赵雷',
    album: '无法长大',
    duration: 373,
    lyrics: '阿刁 住在西藏的某个地方\n秃鹫一样 栖息在山顶上\n阿刁 大昭寺门前铺满阳光\n打一壶甜茶 我们聊着过往',
  },
  {
    title: '消愁',
    artist: '毛不易',
    album: '平凡的一天',
    duration: 275,
    lyrics: '当你走进这欢乐场\n背上所有的梦与想\n各色的脸上各色的妆\n没人记得你的模样\n三巡酒过你在角落',
  },
  {
    title: '像我这样的人',
    artist: '毛不易',
    album: '平凡的一天',
    duration: 258,
    lyrics: '像我这样优秀的人\n本该灿烂过一生\n怎么二十多年到头来\n还在人海里浮沉\n像我这样聪明的人',
  },
  {
    title: '平凡的一天',
    artist: '毛不易',
    album: '平凡的一天',
    duration: 257,
    lyrics: '每个早晨七点半就自然醒\n风铃响起又是一天云很轻\n晒好的衣服味道很安心\n一切都是柔软又宁静',
  },
  {
    title: '起风了',
    artist: '买辣椒也用券',
    album: '起风了',
    duration: 325,
    lyrics: '这一路上走走停停\n顺着少年漂流的痕迹\n迈出车站的前一刻\n竟有些犹豫\n不禁笑这近乡情怯',
  },
];

export const mockSongs: Song[] = songData.map((song) => ({
  ...song,
  id: generateId(),
  color: generateRandomColor(),
  cover: `https://picsum.photos/seed/${encodeURIComponent(song.title)}/300/300`,
}));

const playlistData: Array<Omit<Playlist, 'id' | 'color' | 'cover' | 'createdAt' | 'updatedAt'>> = [
  {
    name: '华语经典金曲',
    description: '收录华语乐坛最经典的代表作，陪伴你走过每一段难忘时光',
    songIds: [],
    shared: false,
  },
  {
    name: '深夜治愈情歌',
    description: '夜深人静时，用温柔的歌声抚慰你疲惫的心灵',
    songIds: [],
    shared: false,
  },
  {
    name: '周杰伦精选',
    description: '周杰伦出道以来最受欢迎的歌曲全收录，青春的回忆',
    songIds: [],
    shared: false,
  },
  {
    name: '陈奕迅精选',
    description: 'Eason Chan的经典代表作，感受歌神的魅力',
    songIds: [],
    shared: false,
  },
  {
    name: '民谣时光',
    description: '质朴的民谣，唱出生活的平凡与美好',
    songIds: [],
    shared: false,
  },
  {
    name: '流行新歌榜',
    description: '最新最热门的流行歌曲，紧跟音乐潮流',
    songIds: [],
    shared: false,
  },
  {
    name: '健身房燃脂BGM',
    description: '节奏强劲的运动音乐，让健身更有动力',
    songIds: [],
    shared: false,
  },
  {
    name: '学习工作专注',
    description: '轻柔的背景音乐，帮助你保持专注提高效率',
    songIds: [],
    shared: false,
  },
];

export const mockPlaylists: Playlist[] = playlistData.map((playlist, index) => {
  const shuffled = [...mockSongs].sort(() => Math.random() - 0.5);
  const songCount = Math.floor(Math.random() * 10) + 5;
  const selectedSongs = shuffled.slice(0, songCount);
  
  return {
    ...playlist,
    id: generateId(),
    color: generateRandomColor(),
    cover: `https://picsum.photos/seed/${encodeURIComponent(playlist.name)}/300/300`,
    songIds: selectedSongs.map(song => song.id),
    createdAt: Date.now() - index * 86400000,
    updatedAt: Date.now() - index * 86400000,
  };
});
