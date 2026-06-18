export interface PoemLine {
  text: string
  type: 'seven' | 'five'
  tone: 'ping' | 'ze'
}

export interface GeneratedPoem {
  id: string
  lines: string[]
  type: 'jueju' | 'lushi'
  lineType: 'seven' | 'five'
  author: string
  keyword: string
  timestamp: number
}

const toneMap: Record<string, string> = {
  春: 'ping', 花: 'ping', 风: 'ping', 月: 'ze', 夜: 'ze', 山: 'ping',
  水: 'shui', 云: 'ping', 雨: 'shui', 雪: 'shui', 江: 'ping', 河: 'ping',
  天: 'ping', 地: 'ze', 人: 'ping', 心: 'ping', 情: 'ping', 梦: 'ze',
  诗: 'ping', 酒: 'shui', 茶: 'ping', 书: 'ping', 琴: 'ping', 剑: 'ze',
  离: 'ping', 别: 'ze', 愁: 'ping', 思: 'ping', 归: 'ping', 望: 'ze',
  秋: 'qiu', 冬: 'dong', 夏: 'xia', 寒: 'ping', 暖: 'nuan', 青: 'ping',
  红: 'ping', 白: 'bai', 绿: 'lv', 黄: 'ping', 碧: 'bi', 翠: 'cui',
  柳: 'liu', 梅: 'ping', 兰: 'ping', 竹: 'zhu', 松: 'song', 荷: 'ping',
  雁: 'yan', 燕: 'yan', 莺: 'ying', 蝶: 'die', 蝉: 'ping', 鸿: 'ping',
  楼: 'ping', 台: 'ping', 亭: 'ping', 阁: 'ge', 轩: 'ping', 窗: 'ping',
  门: 'ping', 巷: 'xiang', 桥: 'qiao', 渡: 'du', 舟: 'zhou', 帆: 'fan',
  烟: 'yan', 霞: 'xia', 雾: 'wu', 霜: 'shuang', 露: 'lu', 星: 'xing',
  灯: 'deng', 火: 'huo', 光: 'guang', 影: 'ying', 声: 'sheng', 音: 'yin',
  长: 'chang', 短: 'duan', 深: 'shen', 浅: 'qian', 高: 'gao', 低: 'di',
  远: 'yuan', 近: 'jin', 上: 'shang', 下: 'xia', 前: 'qian', 后: 'hou',
  东: 'dong', 西: 'xi', 南: 'nan', 北: 'bei', 中: 'zhong', 外: 'wai'
}

function getTone(char: string): 'ping' | 'ze' {
  const pinyin = toneMap[char]
  if (!pinyin) return Math.random() > 0.5 ? 'ping' : 'ze'
  const pingPinyins = ['ping', 'qiu', 'dong', 'xia', 'nuan', 'bai', 'lv', 'qing',
    'huang', 'liu', 'zhu', 'song', 'yan', 'ying', 'die', 'dan', 'can',
    'hong', 'chang', 'shen', 'gao', 'yuan', 'qian', 'dong', 'xi', 'nan',
    'bei', 'zhong', 'zhou', 'fan', 'yan', 'xia', 'shuang', 'lu', 'xing',
    'deng', 'guang', 'sheng', 'yin', 'xiang', 'qiao']
  return pingPinyins.includes(pinyin) ? 'ping' : 'ze'
}

const poetryCorpus: { text: string; type: 'seven' | 'five'; endTone: 'ping' | 'ze' }[] = [
  { text: '春风十里扬州路', type: 'seven', endTone: 'ze' },
  { text: '卷上珠帘总不如', type: 'seven', endTone: 'ping' },
  { text: '月落乌啼霜满天', type: 'seven', endTone: 'ping' },
  { text: '江枫渔火对愁眠', type: 'seven', endTone: 'ping' },
  { text: '姑苏城外寒山寺', type: 'seven', endTone: 'ze' },
  { text: '夜半钟声到客船', type: 'seven', endTone: 'ping' },
  { text: '独在异乡为异客', type: 'seven', endTone: 'ze' },
  { text: '每逢佳节倍思亲', type: 'seven', endTone: 'ping' },
  { text: '遥知兄弟登高处', type: 'seven', endTone: 'ze' },
  { text: '遍插茱萸少一人', type: 'seven', endTone: 'ping' },
  { text: '清明时节雨纷纷', type: 'seven', endTone: 'ping' },
  { text: '路上行人欲断魂', type: 'seven', endTone: 'ping' },
  { text: '借问酒家何处有', type: 'seven', endTone: 'ze' },
  { text: '牧童遥指杏花村', type: 'seven', endTone: 'ping' },
  { text: '千山鸟飞绝', type: 'five', endTone: 'ze' },
  { text: '万径人踪灭', type: 'five', endTone: 'ze' },
  { text: '孤舟蓑笠翁', type: 'five', endTone: 'ping' },
  { text: '独钓寒江雪', type: 'five', endTone: 'ze' },
  { text: '白日依山尽', type: 'five', endTone: 'ze' },
  { text: '黄河入海流', type: 'five', endTone: 'ping' },
  { text: '欲穷千里目', type: 'five', endTone: 'ze' },
  { text: '更上一层楼', type: 'five', endTone: 'ping' },
  { text: '床前明月光', type: 'five', endTone: 'ping' },
  { text: '疑是地上霜', type: 'five', endTone: 'ping' },
  { text: '举头望明月', type: 'five', endTone: 'ze' },
  { text: '低头思故乡', type: 'five', endTone: 'ping' },
  { text: '春眠不觉晓', type: 'five', endTone: 'ze' },
  { text: '处处闻啼鸟', type: 'five', endTone: 'ze' },
  { text: '夜来风雨声', type: 'five', endTone: 'ping' },
  { text: '花落知多少', type: 'five', endTone: 'ze' },
  { text: '红豆生南国', type: 'five', endTone: 'ze' },
  { text: '春来发几枝', type: 'five', endTone: 'ping' },
  { text: '愿君多采撷', type: 'five', endTone: 'ze' },
  { text: '此物最相思', type: 'five', endTone: 'ping' },
  { text: '海内存知己', type: 'five', endTone: 'ze' },
  { text: '天涯若比邻', type: 'five', endTone: 'ping' },
  { text: '无为在歧路', type: 'five', endTone: 'ze' },
  { text: '儿女共沾巾', type: 'five', endTone: 'ping' },
  { text: '大漠孤烟直', type: 'five', endTone: 'ze' },
  { text: '长河落日圆', type: 'five', endTone: 'ping' },
  { text: '萧关逢候骑', type: 'five', endTone: 'ze' },
  { text: '都护在燕然', type: 'five', endTone: 'ping' },
  { text: '国破山河在', type: 'five', endTone: 'ze' },
  { text: '城春草木深', type: 'five', endTone: 'ping' },
  { text: '感时花溅泪', type: 'five', endTone: 'ze' },
  { text: '恨别鸟惊心', type: 'five', endTone: 'ping' },
  { text: '烽火连三月', type: 'five', endTone: 'ze' },
  { text: '家书抵万金', type: 'five', endTone: 'ping' },
  { text: '白头搔更短', type: 'five', endTone: 'ze' },
  { text: '浑欲不胜簪', type: 'five', endTone: 'ping' },
  { text: '两个黄鹂鸣翠柳', type: 'seven', endTone: 'ze' },
  { text: '一行白鹭上青天', type: 'seven', endTone: 'ping' },
  { text: '窗含西岭千秋雪', type: 'seven', endTone: 'ze' },
  { text: '门泊东吴万里船', type: 'seven', endTone: 'ping' },
  { text: '好雨知时节', type: 'five', endTone: 'ze' },
  { text: '当春乃发生', type: 'five', endTone: 'ping' },
  { text: '随风潜入夜', type: 'five', endTone: 'ze' },
  { text: '润物细无声', type: 'five', endTone: 'ping' },
  { text: '野径云俱黑', type: 'five', endTone: 'ze' },
  { text: '江船火独明', type: 'five', endTone: 'ping' },
  { text: '晓看红湿处', type: 'five', endTone: 'ze' },
  { text: '花重锦官城', type: 'five', endTone: 'ping' },
  { text: '空山新雨后', type: 'five', endTone: 'ze' },
  { text: '天气晚来秋', type: 'five', endTone: 'ping' },
  { text: '明月松间照', type: 'five', endTone: 'ze' },
  { text: '清泉石上流', type: 'five', endTone: 'ping' },
  { text: '竹喧归浣女', type: 'five', endTone: 'ze' },
  { text: '莲动下渔舟', type: 'five', endTone: 'ping' },
  { text: '随意春芳歇', type: 'five', endTone: 'ze' },
  { text: '王孙自可留', type: 'five', endTone: 'ping' },
  { text: '君问归期未有期', type: 'seven', endTone: 'ping' },
  { text: '巴山夜雨涨秋池', type: 'seven', endTone: 'ping' },
  { text: '何当共剪西窗烛', type: 'seven', endTone: 'ze' },
  { text: '却话巴山夜雨时', type: 'seven', endTone: 'ping' },
  { text: '曾经沧海难为水', type: 'seven', endTone: 'ze' },
  { text: '除却巫山不是云', type: 'seven', endTone: 'ping' },
  { text: '取次花丛懒回顾', type: 'seven', endTone: 'ze' },
  { text: '半缘修道半缘君', type: 'seven', endTone: 'ping' },
  { text: '去年今日此门中', type: 'seven', endTone: 'ping' },
  { text: '人面桃花相映红', type: 'seven', endTone: 'ping' },
  { text: '人面不知何处去', type: 'seven', endTone: 'ze' },
  { text: '桃花依旧笑春风', type: 'seven', endTone: 'ping' },
  { text: '日照香炉生紫烟', type: 'seven', endTone: 'ping' },
  { text: '遥看瀑布挂前川', type: 'seven', endTone: 'ping' },
  { text: '飞流直下三千尺', type: 'seven', endTone: 'ze' },
  { text: '疑是银河落九天', type: 'seven', endTone: 'ping' },
  { text: '朝辞白帝彩云间', type: 'seven', endTone: 'ping' },
  { text: '千里江陵一日还', type: 'seven', endTone: 'ping' },
  { text: '两岸猿声啼不住', type: 'seven', endTone: 'ze' },
  { text: '轻舟已过万重山', type: 'seven', endTone: 'ping' },
  { text: '故人西辞黄鹤楼', type: 'seven', endTone: 'ping' },
  { text: '烟花三月下扬州', type: 'seven', endTone: 'ping' },
  { text: '孤帆远影碧空尽', type: 'seven', endTone: 'ze' },
  { text: '唯见长江天际流', type: 'seven', endTone: 'ping' },
  { text: '李白乘舟将欲行', type: 'seven', endTone: 'ping' },
  { text: '忽闻岸上踏歌声', type: 'seven', endTone: 'ping' },
  { text: '桃花潭水深千尺', type: 'seven', endTone: 'ze' },
  { text: '不及汪伦送我情', type: 'seven', endTone: 'ping' },
  { text: '葡萄美酒夜光杯', type: 'seven', endTone: 'ping' },
  { text: '欲饮琵琶马上催', type: 'seven', endTone: 'ping' },
  { text: '醉卧沙场君莫笑', type: 'seven', endTone: 'ze' },
  { text: '古来征战几人回', type: 'seven', endTone: 'ping' },
  { text: '秦时明月汉时关', type: 'seven', endTone: 'ping' },
  { text: '万里长征人未还', type: 'seven', endTone: 'ping' },
  { text: '但使龙城飞将在', type: 'seven', endTone: 'ze' },
  { text: '不教胡马度阴山', type: 'seven', endTone: 'ping' },
  { text: '寒雨连江夜入吴', type: 'seven', endTone: 'ping' },
  { text: '平明送客楚山孤', type: 'seven', endTone: 'ping' },
  { text: '洛阳亲友如相问', type: 'seven', endTone: 'ze' },
  { text: '一片冰心在玉壶', type: 'seven', endTone: 'ping' },
  { text: '移舟泊烟渚', type: 'five', endTone: 'ze' },
  { text: '日暮客愁新', type: 'five', endTone: 'ping' },
  { text: '野旷天低树', type: 'five', endTone: 'ze' },
  { text: '江清月近人', type: 'five', endTone: 'ping' },
  { text: '春山多胜事', type: 'five', endTone: 'ze' },
  { text: '赏玩夜忘归', type: 'five', endTone: 'ping' },
  { text: '掬水月在手', type: 'five', endTone: 'ze' },
  { text: '弄花香满衣', type: 'five', endTone: 'ping' },
  { text: '兴来无远近', type: 'five', endTone: 'ze' },
  { text: '欲去惜芳菲', type: 'five', endTone: 'ping' },
  { text: '南望鸣钟处', type: 'five', endTone: 'ze' },
  { text: '楼台深翠微', type: 'five', endTone: 'ping' },
  { text: '独坐幽篁里', type: 'five', endTone: 'ze' },
  { text: '弹琴复长啸', type: 'five', endTone: 'ze' },
  { text: '深林人不知', type: 'five', endTone: 'ping' },
  { text: '明月来相照', type: 'five', endTone: 'ze' },
  { text: '美人卷珠帘', type: 'five', endTone: 'ping' },
  { text: '深坐颦蛾眉', type: 'five', endTone: 'ping' },
  { text: '但见泪痕湿', type: 'five', endTone: 'ze' },
  { text: '不知心恨谁', type: 'five', endTone: 'ping' },
  { text: '玉阶生白露', type: 'five', endTone: 'ze' },
  { text: '夜久侵罗袜', type: 'five', endTone: 'ze' },
  { text: '却下水晶帘', type: 'five', endTone: 'ping' },
  { text: '玲珑望秋月', type: 'five', endTone: 'ze' },
  { text: '渡远荆门外', type: 'five', endTone: 'ze' },
  { text: '来从楚国游', type: 'five', endTone: 'ping' },
  { text: '山随平野尽', type: 'five', endTone: 'ze' },
  { text: '江入大荒流', type: 'five', endTone: 'ping' },
  { text: '月下飞天镜', type: 'five', endTone: 'ze' },
  { text: '云生结海楼', type: 'five', endTone: 'ping' },
  { text: '仍怜故乡水', type: 'five', endTone: 'ze' },
  { text: '万里送行舟', type: 'five', endTone: 'ping' },
  { text: '青山横北郭', type: 'five', endTone: 'ze' },
  { text: '白水绕东城', type: 'five', endTone: 'ping' },
  { text: '此地一为别', type: 'five', endTone: 'ze' },
  { text: '孤蓬万里征', type: 'five', endTone: 'ping' },
  { text: '浮云游子意', type: 'five', endTone: 'ze' },
  { text: '落日故人情', type: 'five', endTone: 'ping' },
  { text: '挥手自兹去', type: 'five', endTone: 'ze' },
  { text: '萧萧班马鸣', type: 'five', endTone: 'ping' },
  { text: '细草微风岸', type: 'five', endTone: 'ze' },
  { text: '危樯独夜舟', type: 'five', endTone: 'ping' },
  { text: '星垂平野阔', type: 'five', endTone: 'ze' },
  { text: '月涌大江流', type: 'five', endTone: 'ping' },
  { text: '名岂文章著', type: 'five', endTone: 'ze' },
  { text: '官应老病休', type: 'five', endTone: 'ping' },
  { text: '飘飘何所似', type: 'five', endTone: 'ze' },
  { text: '天地一沙鸥', type: 'five', endTone: 'ping' },
  { text: '风急天高猿啸哀', type: 'seven', endTone: 'ping' },
  { text: '渚清沙白鸟飞回', type: 'seven', endTone: 'ping' },
  { text: '无边落木萧萧下', type: 'seven', endTone: 'ze' },
  { text: '不尽长江滚滚来', type: 'seven', endTone: 'ping' },
  { text: '万里悲秋常作客', type: 'seven', endTone: 'ze' },
  { text: '百年多病独登台', type: 'seven', endTone: 'ping' },
  { text: '艰难苦恨繁霜鬓', type: 'seven', endTone: 'ze' },
  { text: '潦倒新停浊酒杯', type: 'seven', endTone: 'ping' },
  { text: '舍南舍北皆春水', type: 'seven', endTone: 'ze' },
  { text: '但见群鸥日日来', type: 'seven', endTone: 'ping' },
  { text: '花径不曾缘客扫', type: 'seven', endTone: 'ze' },
  { text: '蓬门今始为君开', type: 'seven', endTone: 'ping' },
  { text: '盘餐市远无兼味', type: 'seven', endTone: 'ze' },
  { text: '樽酒家贫只旧醅', type: 'seven', endTone: 'ping' },
  { text: '肯与邻翁相对饮', type: 'seven', endTone: 'ze' },
  { text: '隔篱呼取尽馀杯', type: 'seven', endTone: 'ping' },
  { text: '锦城丝管日纷纷', type: 'seven', endTone: 'ping' },
  { text: '半入江风半入云', type: 'seven', endTone: 'ping' },
  { text: '此曲只应天上有', type: 'seven', endTone: 'ze' },
  { text: '人间能得几回闻', type: 'seven', endTone: 'ping' },
  { text: '黄四娘家花满蹊', type: 'seven', endTone: 'ping' },
  { text: '千朵万朵压枝低', type: 'seven', endTone: 'ping' },
  { text: '留连戏蝶时时舞', type: 'seven', endTone: 'ze' },
  { text: '自在娇莺恰恰啼', type: 'seven', endTone: 'ping' },
  { text: '银烛秋光冷画屏', type: 'seven', endTone: 'ping' },
  { text: '轻罗小扇扑流萤', type: 'seven', endTone: 'ping' },
  { text: '天阶夜色凉如水', type: 'seven', endTone: 'ze' },
  { text: '卧看牵牛织女星', type: 'seven', endTone: 'ping' },
  { text: '烟笼寒水月笼沙', type: 'seven', endTone: 'ping' },
  { text: '夜泊秦淮近酒家', type: 'seven', endTone: 'ping' },
  { text: '商女不知亡国恨', type: 'seven', endTone: 'ze' },
  { text: '隔江犹唱后庭花', type: 'seven', endTone: 'ping' },
  { text: '君自故乡来', type: 'five', endTone: 'ping' },
  { text: '应知故乡事', type: 'five', endTone: 'ze' },
  { text: '来日绮窗前', type: 'five', endTone: 'ping' },
  { text: '寒梅著花未', type: 'five', endTone: 'ze' },
  { text: '岭外音书断', type: 'five', endTone: 'ze' },
  { text: '经冬复历春', type: 'five', endTone: 'ping' },
  { text: '近乡情更怯', type: 'five', endTone: 'ze' },
  { text: '不敢问来人', type: 'five', endTone: 'ping' },
  { text: '心逐南云逝', type: 'five', endTone: 'ze' },
  { text: '形随北雁来', type: 'five', endTone: 'ping' },
  { text: '故乡篱下菊', type: 'five', endTone: 'ze' },
  { text: '今日几花开', type: 'five', endTone: 'ping' },
  { text: '劝君更尽一杯酒', type: 'seven', endTone: 'ze' },
  { text: '西出阳关无故人', type: 'seven', endTone: 'ping' },
  { text: '渭城朝雨浥轻尘', type: 'seven', endTone: 'ping' },
  { text: '客舍青青柳色新', type: 'seven', endTone: 'ping' },
  { text: '远上寒山石径斜', type: 'seven', endTone: 'ping' },
  { text: '白云生处有人家', type: 'seven', endTone: 'ping' },
  { text: '停车坐爱枫林晚', type: 'seven', endTone: 'ze' },
  { text: '霜叶红于二月花', type: 'seven', endTone: 'ping' },
  { text: '千里莺啼绿映红', type: 'seven', endTone: 'ping' },
  { text: '水村山郭酒旗风', type: 'seven', endTone: 'ping' },
  { text: '南朝四百八十寺', type: 'seven', endTone: 'ze' },
  { text: '多少楼台烟雨中', type: 'seven', endTone: 'ping' },
  { text: '庆全庵桃花', type: 'five', endTone: 'ping' },
  { text: '寻得桃源好避秦', type: 'seven', endTone: 'ping' },
  { text: '桃红又是一年春', type: 'seven', endTone: 'ping' },
  { text: '花飞莫遣随流水', type: 'seven', endTone: 'ze' },
  { text: '怕有渔郎来问津', type: 'seven', endTone: 'ping' },
  { text: '梅雪争春未肯降', type: 'seven', endTone: 'ping' },
  { text: '骚人阁笔费评章', type: 'seven', endTone: 'ping' },
  { text: '梅须逊雪三分白', type: 'seven', endTone: 'ze' },
  { text: '雪却输梅一段香', type: 'seven', endTone: 'ping' },
  { text: '天街小雨润如酥', type: 'seven', endTone: 'ping' },
  { text: '草色遥看近却无', type: 'seven', endTone: 'ping' },
  { text: '最是一年春好处', type: 'seven', endTone: 'ze' },
  { text: '绝胜烟柳满皇都', type: 'seven', endTone: 'ping' },
  { text: '莫道谗言如浪深', type: 'seven', endTone: 'ping' },
  { text: '莫言迁客似沙沉', type: 'seven', endTone: 'ping' },
  { text: '千淘万漉虽辛苦', type: 'seven', endTone: 'ze' },
  { text: '吹尽狂沙始到金', type: 'seven', endTone: 'ping' },
  { text: '乱烟笼碧砌', type: 'five', endTone: 'ze' },
  { text: '飞月向南端', type: 'five', endTone: 'ping' },
  { text: '寂寂离亭掩', type: 'five', endTone: 'ze' },
  { text: '江山此夜寒', type: 'five', endTone: 'ping' },
  { text: '疏影横斜水清浅', type: 'seven', endTone: 'ze' },
  { text: '暗香浮动月黄昏', type: 'seven', endTone: 'ping' },
  { text: '众芳摇落独暄妍', type: 'seven', endTone: 'ping' },
  { text: '占尽风情向小园', type: 'seven', endTone: 'ping' },
  { text: '霜禽欲下先偷眼', type: 'seven', endTone: 'ze' },
  { text: '粉蝶如知合断魂', type: 'seven', endTone: 'ping' },
  { text: '幸有微吟可相狎', type: 'seven', endTone: 'ze' },
  { text: '不须檀板共金樽', type: 'seven', endTone: 'ping' },
  { text: '迟日江山丽', type: 'five', endTone: 'ze' },
  { text: '春风花草香', type: 'five', endTone: 'ping' },
  { text: '泥融飞燕子', type: 'five', endTone: 'ze' },
  { text: '沙暖睡鸳鸯', type: 'five', endTone: 'ping' },
  { text: '江碧鸟逾白', type: 'five', endTone: 'ze' },
  { text: '山青花欲燃', type: 'five', endTone: 'ping' },
  { text: '今春看又过', type: 'five', endTone: 'ze' },
  { text: '何日是归年', type: 'five', endTone: 'ping' }
]

const authorNames = [
  '李白', '杜甫', '王维', '孟浩然', '白居易', '李商隐', '杜牧',
  '王昌龄', '岑参', '高适', '刘禹锡', '柳宗元', '韩愈', '苏轼',
  '李清照', '辛弃疾', '陆游', '王安石', '欧阳修', '柳永'
]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function filterByKeyword(corpus: typeof poetryCorpus, keyword: string): typeof poetryCorpus {
  if (!keyword) return corpus
  const chars = keyword.split('')
  return corpus.filter(line => chars.some(char => line.text.includes(char)))
}

export function generatePoem(keyword: string, forceType?: 'seven' | 'five'): GeneratedPoem {
  const lineType: 'seven' | 'five' = forceType || (Math.random() > 0.5 ? 'seven' : 'five')
  let corpus = poetryCorpus.filter(line => line.type === lineType)
  corpus = filterByKeyword(corpus, keyword)
  
  if (corpus.length < 4) {
    corpus = poetryCorpus.filter(line => line.type === lineType)
  }

  const patterns = [
    ['ze', 'ping', 'ze', 'ping'],
    ['ping', 'ping', 'ze', 'ping'],
    ['ze', 'ze', 'ping', 'ping']
  ]
  const selectedPattern = randomElement(patterns)
  const selectedLines: string[] = []
  const usedIndices: Set<number> = new Set()

  for (let i = 0; i < 4; i++) {
    const targetTone = selectedPattern[i]
    const candidates = corpus
      .map((line, idx) => ({ line, idx }))
      .filter(({ line, idx }) => 
        !usedIndices.has(idx) && 
        (line.endTone === targetTone || i === 0 || i === 2)
      )
    
    if (candidates.length === 0) {
      const allCandidates = corpus
        .map((line, idx) => ({ line, idx }))
        .filter(({ idx }) => !usedIndices.has(idx))
      const chosen = randomElement(allCandidates)
      selectedLines.push(chosen.line.text)
      usedIndices.add(chosen.idx)
    } else {
      const chosen = randomElement(candidates)
      selectedLines.push(chosen.line.text)
      usedIndices.add(chosen.idx)
    }
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    lines: selectedLines,
    type: 'jueju',
    lineType,
    author: randomElement(authorNames),
    keyword: keyword || '无题',
    timestamp: Date.now()
  }
}

export function validateKeyword(keyword: string): { valid: boolean; message?: string } {
  if (!keyword.trim()) {
    return { valid: true }
  }
  const trimmed = keyword.trim()
  if (trimmed.length > 4) {
    return { valid: false, message: '关键词最多4个汉字' }
  }
  const chineseRegex = /^[\u4e00-\u9fa5]{1,4}$/
  if (!chineseRegex.test(trimmed)) {
    return { valid: false, message: '请输入汉字关键词' }
  }
  return { valid: true }
}
