export type PoemTheme = '山水' | '田园' | '边塞' | '咏物' | '送别' | '思乡';
export type PoemDynasty = '唐' | '宋';

export interface KeywordAnnotation {
  word: string;
  meaning: string;
  relatedPoemIds: string[];
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  dynasty: PoemDynasty;
  theme: PoemTheme;
  content: string[];
  keywords: KeywordAnnotation[];
  particleHint: string;
}

const poems: Poem[] = [
  {
    id: 'p001',
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    theme: '思乡',
    content: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'],
    keywords: [
      { word: '明月', meaning: '明亮的月光，象征思念与纯洁', relatedPoemIds: ['p002', 'p022'] },
      { word: '故乡', meaning: '家乡，诗人魂牵梦萦的地方', relatedPoemIds: ['p003', 'p021'] }
    ],
    particleHint: 'moonlight'
  },
  {
    id: 'p002',
    title: '望月怀远',
    author: '张九龄',
    dynasty: '唐',
    theme: '思乡',
    content: ['海上生明月，', '天涯共此时。', '情人怨遥夜，', '竟夕起相思。'],
    keywords: [
      { word: '明月', meaning: '海上明月，辽阔而永恒', relatedPoemIds: ['p001', 'p022'] },
      { word: '天涯', meaning: '天边，极远的地方', relatedPoemIds: ['p028', 'p032'] }
    ],
    particleHint: 'sea-moon'
  },
  {
    id: 'p003',
    title: '九月九日忆山东兄弟',
    author: '王维',
    dynasty: '唐',
    theme: '思乡',
    content: ['独在异乡为异客，', '每逢佳节倍思亲。', '遥知兄弟登高处，', '遍插茱萸少一人。'],
    keywords: [
      { word: '异乡', meaning: '他乡，远离故土的地方', relatedPoemIds: ['p001', 'p021'] },
      { word: '茱萸', meaning: '重阳节佩戴的香草，驱邪避灾', relatedPoemIds: [] }
    ],
    particleHint: 'mountain-autumn'
  },
  {
    id: 'p004',
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    theme: '田园',
    content: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'],
    keywords: [
      { word: '啼鸟', meaning: '鸣叫的鸟儿，春的使者', relatedPoemIds: ['p009', 'p018'] },
      { word: '花落', meaning: '落花，伤春之意象', relatedPoemIds: ['p010', 'p038'] }
    ],
    particleHint: 'spring-rain'
  },
  {
    id: 'p005',
    title: '山居秋暝',
    author: '王维',
    dynasty: '唐',
    theme: '山水',
    content: ['空山新雨后，', '天气晚来秋。', '明月松间照，', '清泉石上流。'],
    keywords: [
      { word: '空山', meaning: '幽静的山林，远离尘嚣', relatedPoemIds: ['p006', 'p007'] },
      { word: '明月', meaning: '松林间的月光，清冷澄澈', relatedPoemIds: ['p001', 'p002'] }
    ],
    particleHint: 'mountain-forest'
  },
  {
    id: 'p006',
    title: '鹿柴',
    author: '王维',
    dynasty: '唐',
    theme: '山水',
    content: ['空山不见人，', '但闻人语响。', '返景入深林，', '复照青苔上。'],
    keywords: [
      { word: '空山', meaning: '空寂山林，禅意悠远', relatedPoemIds: ['p005', 'p007'] },
      { word: '深林', meaning: '茂密的树林，光影斑驳', relatedPoemIds: ['p005', 'p012'] }
    ],
    particleHint: 'deep-forest'
  },
  {
    id: 'p007',
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    theme: '山水',
    content: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'],
    keywords: [
      { word: '白日', meaning: '西沉的太阳，壮丽而短暂', relatedPoemIds: ['p016', 'p033'] },
      { word: '黄河', meaning: '中华民族母亲河，气势磅礴', relatedPoemIds: ['p008', 'p031'] }
    ],
    particleHint: 'sunset-mountain-river'
  },
  {
    id: 'p008',
    title: '凉州词',
    author: '王之涣',
    dynasty: '唐',
    theme: '边塞',
    content: ['黄河远上白云间，', '一片孤城万仞山。', '羌笛何须怨杨柳，', '春风不度玉门关。'],
    keywords: [
      { word: '黄河', meaning: '奔腾万里的大河，边塞壮阔', relatedPoemIds: ['p007', 'p031'] },
      { word: '玉门关', meaning: '古代关隘，中原与西域分界', relatedPoemIds: ['p011', 'p023'] }
    ],
    particleHint: 'frontier-pass'
  },
  {
    id: 'p009',
    title: '过故人庄',
    author: '孟浩然',
    dynasty: '唐',
    theme: '田园',
    content: ['故人具鸡黍，', '邀我至田家。', '绿树村边合，', '青山郭外斜。'],
    keywords: [
      { word: '田家', meaning: '农家，淳朴的田园生活', relatedPoemIds: ['p004', 'p012'] },
      { word: '青山', meaning: '村外青山，秀美宁静', relatedPoemIds: ['p005', 'p006'] }
    ],
    particleHint: 'village-green'
  },
  {
    id: 'p010',
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    theme: '田园',
    content: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'],
    keywords: [
      { word: '啼鸟', meaning: '鸟鸣阵阵，春意盎然', relatedPoemIds: ['p004', 'p018'] },
      { word: '风雨', meaning: '夜间风雨，落红无数', relatedPoemIds: ['p004', 'p038'] }
    ],
    particleHint: 'spring-flowers'
  },
  {
    id: 'p011',
    title: '出塞',
    author: '王昌龄',
    dynasty: '唐',
    theme: '边塞',
    content: ['秦时明月汉时关，', '万里长征人未还。', '但使龙城飞将在，', '不教胡马度阴山。'],
    keywords: [
      { word: '明月', meaning: '千古明月，见证历史沧桑', relatedPoemIds: ['p001', 'p002'] },
      { word: '阴山', meaning: '北方山脉，中原屏障', relatedPoemIds: ['p008', 'p023'] }
    ],
    particleHint: 'great-wall-moon'
  },
  {
    id: 'p012',
    title: '归园田居',
    author: '陶渊明',
    dynasty: '宋',
    theme: '田园',
    content: ['种豆南山下，', '草盛豆苗稀。', '晨兴理荒秽，', '带月荷锄归。'],
    keywords: [
      { word: '南山', meaning: '庐山，隐士之山', relatedPoemIds: ['p009', 'p005'] },
      { word: '带月', meaning: '披着月光归家，田园之乐', relatedPoemIds: ['p001', 'p005'] }
    ],
    particleHint: 'farm-moon'
  },
  {
    id: 'p013',
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    theme: '山水',
    content: ['日照香炉生紫烟，', '遥看瀑布挂前川。', '飞流直下三千尺，', '疑是银河落九天。'],
    keywords: [
      { word: '香炉', meaning: '庐山香炉峰，云雾缭绕', relatedPoemIds: ['p007', 'p005'] },
      { word: '瀑布', meaning: '飞流直下，气势磅礴', relatedPoemIds: [] }
    ],
    particleHint: 'waterfall'
  },
  {
    id: 'p014',
    title: '早发白帝城',
    author: '李白',
    dynasty: '唐',
    theme: '山水',
    content: ['朝辞白帝彩云间，', '千里江陵一日还。', '两岸猿声啼不住，', '轻舟已过万重山。'],
    keywords: [
      { word: '彩云', meaning: '五彩云霞，喻顺境之始', relatedPoemIds: [] },
      { word: '轻舟', meaning: '轻快小舟，顺流而下', relatedPoemIds: ['p013', 'p007'] }
    ],
    particleHint: 'gorge-boat'
  },
  {
    id: 'p015',
    title: '送孟浩然之广陵',
    author: '李白',
    dynasty: '唐',
    theme: '送别',
    content: ['故人西辞黄鹤楼，', '烟花三月下扬州。', '孤帆远影碧空尽，', '唯见长江天际流。'],
    keywords: [
      { word: '黄鹤楼', meaning: '江南名楼，送别之地', relatedPoemIds: [] },
      { word: '孤帆', meaning: '远去的孤舟，离愁渐远', relatedPoemIds: ['p014', 'p028'] }
    ],
    particleHint: 'river-sail'
  },
  {
    id: 'p016',
    title: '使至塞上',
    author: '王维',
    dynasty: '唐',
    theme: '边塞',
    content: ['单车欲问边，', '属国过居延。', '大漠孤烟直，', '长河落日圆。'],
    keywords: [
      { word: '大漠', meaning: '浩瀚沙漠，壮阔苍凉', relatedPoemIds: ['p008', 'p011'] },
      { word: '落日', meaning: '浑圆落日，边塞壮丽', relatedPoemIds: ['p007', 'p033'] }
    ],
    particleHint: 'desert-sunset'
  },
  {
    id: 'p017',
    title: '竹里馆',
    author: '王维',
    dynasty: '唐',
    theme: '山水',
    content: ['独坐幽篁里，', '弹琴复长啸。', '深林人不知，', '明月来相照。'],
    keywords: [
      { word: '幽篁', meaning: '幽深的竹林', relatedPoemIds: ['p005', 'p006'] },
      { word: '长啸', meaning: '歌咏抒怀，隐士之风', relatedPoemIds: [] }
    ],
    particleHint: 'bamboo-moon'
  },
  {
    id: 'p018',
    title: '江畔独步寻花',
    author: '杜甫',
    dynasty: '唐',
    theme: '田园',
    content: ['黄四娘家花满蹊，', '千朵万朵压枝低。', '留连戏蝶时时舞，', '自在娇莺恰恰啼。'],
    keywords: [
      { word: '花满蹊', meaning: '花开满路，春意正浓', relatedPoemIds: ['p004', 'p010'] },
      { word: '娇莺', meaning: '柔美的黄莺啼鸣', relatedPoemIds: ['p004', 'p009'] }
    ],
    particleHint: 'flower-butterfly'
  },
  {
    id: 'p019',
    title: '春望',
    author: '杜甫',
    dynasty: '唐',
    theme: '思乡',
    content: ['国破山河在，', '城春草木深。', '感时花溅泪，', '恨别鸟惊心。'],
    keywords: [
      { word: '山河', meaning: '山河依旧，人事已非', relatedPoemIds: ['p005', 'p007'] },
      { word: '花溅泪', meaning: '见花落泪，感时伤世', relatedPoemIds: ['p010', 'p038'] }
    ],
    particleHint: 'ruined-city-spring'
  },
  {
    id: 'p020',
    title: '登高',
    author: '杜甫',
    dynasty: '唐',
    theme: '山水',
    content: ['风急天高猿啸哀，', '渚清沙白鸟飞回。', '无边落木萧萧下，', '不尽长江滚滚来。'],
    keywords: [
      { word: '落木', meaning: '落叶，秋之肃杀', relatedPoemIds: ['p005', 'p003'] },
      { word: '长江', meaning: '滚滚长江，时光流逝', relatedPoemIds: ['p015', 'p014'] }
    ],
    particleHint: 'autumn-cliff'
  },
  {
    id: 'p021',
    title: '枫桥夜泊',
    author: '张继',
    dynasty: '唐',
    theme: '思乡',
    content: ['月落乌啼霜满天，', '江枫渔火对愁眠。', '姑苏城外寒山寺，', '夜半钟声到客船。'],
    keywords: [
      { word: '月落', meaning: '残月西沉，夜色深沉', relatedPoemIds: ['p001', 'p002'] },
      { word: '渔火', meaning: '渔船上的灯火，点点乡愁', relatedPoemIds: [] }
    ],
    particleHint: 'river-night'
  },
  {
    id: 'p022',
    title: '水调歌头',
    author: '苏轼',
    dynasty: '宋',
    theme: '思乡',
    content: ['明月几时有？', '把酒问青天。', '不知天上宫阙，', '今夕是何年。'],
    keywords: [
      { word: '明月', meaning: '中秋明月，思亲之情', relatedPoemIds: ['p001', 'p002'] },
      { word: '青天', meaning: '苍天，浩渺宇宙', relatedPoemIds: [] }
    ],
    particleHint: 'moon-heaven'
  },
  {
    id: 'p023',
    title: '渔家傲·秋思',
    author: '范仲淹',
    dynasty: '宋',
    theme: '边塞',
    content: ['塞下秋来风景异，', '衡阳雁去无留意。', '四面边声连角起，', '千嶂里，长烟落日孤城闭。'],
    keywords: [
      { word: '塞下', meaning: '边塞之地，秋意萧瑟', relatedPoemIds: ['p008', 'p011'] },
      { word: '千嶂', meaning: '层层叠叠的山峰', relatedPoemIds: ['p007', 'p016'] }
    ],
    particleHint: 'frontier-autumn'
  },
  {
    id: 'p024',
    title: '浣溪沙',
    author: '晏殊',
    dynasty: '宋',
    theme: '咏物',
    content: ['一曲新词酒一杯，', '去年天气旧亭台。', '夕阳西下几时回？', '无可奈何花落去。'],
    keywords: [
      { word: '夕阳', meaning: '落日，时光流逝之叹', relatedPoemIds: ['p016', 'p033'] },
      { word: '花落', meaning: '落花，春去难留', relatedPoemIds: ['p004', 'p038'] }
    ],
    particleHint: 'pavilion-sunset'
  },
  {
    id: 'p025',
    title: '念奴娇·赤壁怀古',
    author: '苏轼',
    dynasty: '宋',
    theme: '咏物',
    content: ['大江东去，浪淘尽，', '千古风流人物。', '故垒西边，人道是，', '三国周郎赤壁。'],
    keywords: [
      { word: '大江', meaning: '长江，历史长河', relatedPoemIds: ['p020', 'p015'] },
      { word: '赤壁', meaning: '三国古战场', relatedPoemIds: [] }
    ],
    particleHint: 'river-history'
  },
  {
    id: 'p026',
    title: '题西林壁',
    author: '苏轼',
    dynasty: '宋',
    theme: '山水',
    content: ['横看成岭侧成峰，', '远近高低各不同。', '不识庐山真面目，', '只缘身在此山中。'],
    keywords: [
      { word: '岭', meaning: '连绵的山岭', relatedPoemIds: ['p005', 'p007'] },
      { word: '庐山', meaning: '江西名山，云雾缭绕', relatedPoemIds: ['p013'] }
    ],
    particleHint: 'misty-mountain'
  },
  {
    id: 'p027',
    title: '晓出净慈寺送林子方',
    author: '杨万里',
    dynasty: '宋',
    theme: '送别',
    content: ['毕竟西湖六月中，', '风光不与四时同。', '接天莲叶无穷碧，', '映日荷花别样红。'],
    keywords: [
      { word: '西湖', meaning: '杭州西湖，江南名胜', relatedPoemIds: [] },
      { word: '荷花', meaning: '夏日荷花，映日盛开', relatedPoemIds: [] }
    ],
    particleHint: 'lotus-lake'
  },
  {
    id: 'p028',
    title: '卜算子·送鲍浩然之浙东',
    author: '王观',
    dynasty: '宋',
    theme: '送别',
    content: ['水是眼波横，', '山是眉峰聚。', '欲问行人去那边？', '眉眼盈盈处。'],
    keywords: [
      { word: '眼波', meaning: '流水如美人眼波', relatedPoemIds: ['p005', 'p020'] },
      { word: '眉峰', meaning: '青山如美人眉黛', relatedPoemIds: ['p007', 'p009'] }
    ],
    particleHint: 'mountain-water'
  },
  {
    id: 'p029',
    title: '饮湖上初晴后雨',
    author: '苏轼',
    dynasty: '宋',
    theme: '山水',
    content: ['水光潋滟晴方好，', '山色空蒙雨亦奇。', '欲把西湖比西子，', '淡妆浓抹总相宜。'],
    keywords: [
      { word: '潋滟', meaning: '水面波光闪动', relatedPoemIds: ['p027', 'p020'] },
      { word: '空蒙', meaning: '山色迷蒙，雨后初晴', relatedPoemIds: ['p026', 'p005'] }
    ],
    particleHint: 'lake-rain'
  },
  {
    id: 'p030',
    title: '示儿',
    author: '陆游',
    dynasty: '宋',
    theme: '边塞',
    content: ['死去元知万事空，', '但悲不见九州同。', '王师北定中原日，', '家祭无忘告乃翁。'],
    keywords: [
      { word: '九州', meaning: '全中国', relatedPoemIds: ['p011', 'p023'] },
      { word: '中原', meaning: '北方故土，沦陷之地', relatedPoemIds: [] }
    ],
    particleHint: 'war-homeland'
  },
  {
    id: 'p031',
    title: '秋夜将晓出篱门迎凉有感',
    author: '陆游',
    dynasty: '宋',
    theme: '山水',
    content: ['三万里河东入海，', '五千仞岳上摩天。', '遗民泪尽胡尘里，', '南望王师又一年。'],
    keywords: [
      { word: '河', meaning: '黄河，三万里长', relatedPoemIds: ['p007', 'p008'] },
      { word: '岳', meaning: '西岳华山，五千仞高', relatedPoemIds: ['p007', 'p016'] }
    ],
    particleHint: 'river-mountain-north'
  },
  {
    id: 'p032',
    title: '泊船瓜洲',
    author: '王安石',
    dynasty: '宋',
    theme: '思乡',
    content: ['京口瓜洲一水间，', '钟山只隔数重山。', '春风又绿江南岸，', '明月何时照我还？'],
    keywords: [
      { word: '春风', meaning: '春风吹绿，生机盎然', relatedPoemIds: ['p004', 'p008'] },
      { word: '明月', meaning: '明月何时伴我归', relatedPoemIds: ['p001', 'p002'] }
    ],
    particleHint: 'river-spring-green'
  },
  {
    id: 'p033',
    title: '元日',
    author: '王安石',
    dynasty: '宋',
    theme: '田园',
    content: ['爆竹声中一岁除，', '春风送暖入屠苏。', '千门万户曈曈日，', '总把新桃换旧符。'],
    keywords: [
      { word: '爆竹', meaning: '鞭炮，驱邪迎新', relatedPoemIds: [] },
      { word: '曈曈', meaning: '日出时光亮温暖', relatedPoemIds: ['p007', 'p016'] }
    ],
    particleHint: 'new-year-sunrise'
  },
  {
    id: 'p034',
    title: '惠崇春江晚景',
    author: '苏轼',
    dynasty: '宋',
    theme: '田园',
    content: ['竹外桃花三两枝，', '春江水暖鸭先知。', '蒌蒿满地芦芽短，', '正是河豚欲上时。'],
    keywords: [
      { word: '桃花', meaning: '春桃初绽，三两枝', relatedPoemIds: ['p027', 'p018'] },
      { word: '春江水', meaning: '春江回暖，万物复苏', relatedPoemIds: ['p032', 'p029'] }
    ],
    particleHint: 'spring-river-duck'
  },
  {
    id: 'p035',
    title: '游山西村',
    author: '陆游',
    dynasty: '宋',
    theme: '田园',
    content: ['莫笑农家腊酒浑，', '丰年留客足鸡豚。', '山重水复疑无路，', '柳暗花明又一村。'],
    keywords: [
      { word: '农家', meaning: '淳朴农家，热情待客', relatedPoemIds: ['p009', 'p012'] },
      { word: '柳暗花明', meaning: '困境中忽见希望', relatedPoemIds: [] }
    ],
    particleHint: 'village-mountain'
  },
  {
    id: 'p036',
    title: '从军行',
    author: '王昌龄',
    dynasty: '唐',
    theme: '边塞',
    content: ['青海长云暗雪山，', '孤城遥望玉门关。', '黄沙百战穿金甲，', '不破楼兰终不还。'],
    keywords: [
      { word: '雪山', meaning: '祁连山，终年积雪', relatedPoemIds: ['p008', 'p016'] },
      { word: '楼兰', meaning: '西域古国，代指外敌', relatedPoemIds: ['p011', 'p023'] }
    ],
    particleHint: 'battlefront-snow'
  },
  {
    id: 'p037',
    title: '赋得古原草送别',
    author: '白居易',
    dynasty: '唐',
    theme: '送别',
    content: ['离离原上草，', '一岁一枯荣。', '野火烧不尽，', '春风吹又生。'],
    keywords: [
      { word: '原上草', meaning: '古原野草，顽强生命', relatedPoemIds: ['p012', 'p009'] },
      { word: '春风', meaning: '春风化雨，万物复苏', relatedPoemIds: ['p004', 'p032'] }
    ],
    particleHint: 'grassland-wind'
  },
  {
    id: 'p038',
    title: '江南春',
    author: '杜牧',
    dynasty: '唐',
    theme: '山水',
    content: ['千里莺啼绿映红，', '水村山郭酒旗风。', '南朝四百八十寺，', '多少楼台烟雨中。'],
    keywords: [
      { word: '莺啼', meaning: '黄莺啼鸣，春到江南', relatedPoemIds: ['p004', 'p018'] },
      { word: '烟雨', meaning: '烟雨朦胧，江南春色', relatedPoemIds: ['p029', 'p026'] }
    ],
    particleHint: 'jiangnan-spring'
  },
  {
    id: 'p039',
    title: '别董大',
    author: '高适',
    dynasty: '唐',
    theme: '送别',
    content: ['千里黄云白日曛，', '北风吹雁雪纷纷。', '莫愁前路无知己，', '天下谁人不识君。'],
    keywords: [
      { word: '黄云', meaning: '塞外黄云，大雪将至', relatedPoemIds: ['p016', 'p036'] },
      { word: '知己', meaning: '知心朋友，天涯若比邻', relatedPoemIds: ['p015', 'p037'] }
    ],
    particleHint: 'snow-farewell'
  },
  {
    id: 'p040',
    title: '竹石',
    author: '郑燮',
    dynasty: '宋',
    theme: '咏物',
    content: ['咬定青山不放松，', '立根原在破岩中。', '千磨万击还坚劲，', '任尔东西南北风。'],
    keywords: [
      { word: '青山', meaning: '青山如砥，坚韧不拔', relatedPoemIds: ['p009', 'p005'] },
      { word: '破岩', meaning: '岩石缝隙，艰苦环境', relatedPoemIds: [] }
    ],
    particleHint: 'bamboo-rock-wind'
  }
];

export const poemDataModule = {
  getAllPoems(): Poem[] {
    return poems;
  },
  getRandomPoem(): Poem {
    const idx = Math.floor(Math.random() * poems.length);
    return poems[idx];
  },
  getPoemById(id: string): Poem | undefined {
    return poems.find(p => p.id === id);
  },
  filterByTheme(theme: PoemTheme): Poem[] {
    return poems.filter(p => p.theme === theme);
  },
  filterByDynasty(dynasty: PoemDynasty): Poem[] {
    return poems.filter(p => p.dynasty === dynasty);
  },
  getThemes(): PoemTheme[] {
    return ['山水', '田园', '边塞', '咏物', '送别', '思乡'];
  },
  getDynasties(): PoemDynasty[] {
    return ['唐', '宋'];
  }
};

export type PoemDataModuleType = typeof poemDataModule;
