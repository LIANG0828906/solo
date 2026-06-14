export interface Poetry {
  id: number
  title: string
  author: string
  dynasty: string
  lines: string[]
}

export const POETRY_BANK: Poetry[] = [
  {
    id: 1,
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    lines: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
  },
  {
    id: 2,
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'],
  },
  {
    id: 3,
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    lines: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'],
  },
  {
    id: 4,
    title: '相思',
    author: '王维',
    dynasty: '唐',
    lines: ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思'],
  },
  {
    id: 5,
    title: '悯农',
    author: '李绅',
    dynasty: '唐',
    lines: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'],
  },
  {
    id: 6,
    title: '咏鹅',
    author: '骆宾王',
    dynasty: '唐',
    lines: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'],
  },
  {
    id: 7,
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    lines: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'],
  },
  {
    id: 8,
    title: '早发白帝城',
    author: '李白',
    dynasty: '唐',
    lines: ['朝辞白帝彩云间', '千里江陵一日还', '两岸猿声啼不住', '轻舟已过万重山'],
  },
  {
    id: 9,
    title: '赠汪伦',
    author: '李白',
    dynasty: '唐',
    lines: ['李白乘舟将欲行', '忽闻岸上踏歌声', '桃花潭水深千尺', '不及汪伦送我情'],
  },
  {
    id: 10,
    title: '黄鹤楼送孟浩然之广陵',
    author: '李白',
    dynasty: '唐',
    lines: ['故人西辞黄鹤楼', '烟花三月下扬州', '孤帆远影碧空尽', '唯见长江天际流'],
  },
  {
    id: 11,
    title: '绝句',
    author: '杜甫',
    dynasty: '唐',
    lines: ['两个黄鹂鸣翠柳', '一行白鹭上青天', '窗含西岭千秋雪', '门泊东吴万里船'],
  },
  {
    id: 12,
    title: '春夜喜雨',
    author: '杜甫',
    dynasty: '唐',
    lines: ['好雨知时节', '当春乃发生', '随风潜入夜', '润物细无声'],
  },
  {
    id: 13,
    title: '望岳',
    author: '杜甫',
    dynasty: '唐',
    lines: ['岱宗夫如何', '齐鲁青未了', '造化钟神秀', '阴阳割昏晓', '荡胸生曾云', '决眦入归鸟', '会当凌绝顶', '一览众山小'],
  },
  {
    id: 14,
    title: '江畔独步寻花',
    author: '杜甫',
    dynasty: '唐',
    lines: ['黄四娘家花满蹊', '千朵万朵压枝低', '留连戏蝶时时舞', '自在娇莺恰恰啼'],
  },
  {
    id: 15,
    title: '江雪',
    author: '柳宗元',
    dynasty: '唐',
    lines: ['千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪'],
  },
  {
    id: 16,
    title: '枫桥夜泊',
    author: '张继',
    dynasty: '唐',
    lines: ['月落乌啼霜满天', '江枫渔火对愁眠', '姑苏城外寒山寺', '夜半钟声到客船'],
  },
  {
    id: 17,
    title: '游子吟',
    author: '孟郊',
    dynasty: '唐',
    lines: ['慈母手中线', '游子身上衣', '临行密密缝', '意恐迟迟归', '谁言寸草心', '报得三春晖'],
  },
  {
    id: 18,
    title: '九月九日忆山东兄弟',
    author: '王维',
    dynasty: '唐',
    lines: ['独在异乡为异客', '每逢佳节倍思亲', '遥知兄弟登高处', '遍插茱萸少一人'],
  },
  {
    id: 19,
    title: '送元二使安西',
    author: '王维',
    dynasty: '唐',
    lines: ['渭城朝雨浥轻尘', '客舍青青柳色新', '劝君更尽一杯酒', '西出阳关无故人'],
  },
  {
    id: 20,
    title: '山居秋暝',
    author: '王维',
    dynasty: '唐',
    lines: ['空山新雨后', '天气晚来秋', '明月松间照', '清泉石上流'],
  },
  {
    id: 21,
    title: '出塞',
    author: '王昌龄',
    dynasty: '唐',
    lines: ['秦时明月汉时关', '万里长征人未还', '但使龙城飞将在', '不教胡马度阴山'],
  },
  {
    id: 22,
    title: '芙蓉楼送辛渐',
    author: '王昌龄',
    dynasty: '唐',
    lines: ['寒雨连江夜入吴', '平明送客楚山孤', '洛阳亲友如相问', '一片冰心在玉壶'],
  },
  {
    id: 23,
    title: '凉州词',
    author: '王翰',
    dynasty: '唐',
    lines: ['葡萄美酒夜光杯', '欲饮琵琶马上催', '醉卧沙场君莫笑', '古来征战几人回'],
  },
  {
    id: 24,
    title: '回乡偶书',
    author: '贺知章',
    dynasty: '唐',
    lines: ['少小离家老大回', '乡音无改鬓毛衰', '儿童相见不相识', '笑问客从何处来'],
  },
  {
    id: 25,
    title: '咏柳',
    author: '贺知章',
    dynasty: '唐',
    lines: ['碧玉妆成一树高', '万条垂下绿丝绦', '不知细叶谁裁出', '二月春风似剪刀'],
  },
  {
    id: 26,
    title: '题西林壁',
    author: '苏轼',
    dynasty: '宋',
    lines: ['横看成岭侧成峰', '远近高低各不同', '不识庐山真面目', '只缘身在此山中'],
  },
  {
    id: 27,
    title: '饮湖上初晴后雨',
    author: '苏轼',
    dynasty: '宋',
    lines: ['水光潋滟晴方好', '山色空蒙雨亦奇', '欲把西湖比西子', '淡妆浓抹总相宜'],
  },
  {
    id: 28,
    title: '惠崇春江晚景',
    author: '苏轼',
    dynasty: '宋',
    lines: ['竹外桃花三两枝', '春江水暖鸭先知', '蒌蒿满地芦芽短', '正是河豚欲上时'],
  },
  {
    id: 29,
    title: '水调歌头',
    author: '苏轼',
    dynasty: '宋',
    lines: ['明月几时有', '把酒问青天', '但愿人长久', '千里共婵娟'],
  },
  {
    id: 30,
    title: '游园不值',
    author: '叶绍翁',
    dynasty: '宋',
    lines: ['应怜屐齿印苍苔', '小扣柴扉久不开', '春色满园关不住', '一枝红杏出墙来'],
  },
  {
    id: 31,
    title: '晓出净慈寺送林子方',
    author: '杨万里',
    dynasty: '宋',
    lines: ['毕竟西湖六月中', '风光不与四时同', '接天莲叶无穷碧', '映日荷花别样红'],
  },
  {
    id: 32,
    title: '小池',
    author: '杨万里',
    dynasty: '宋',
    lines: ['泉眼无声惜细流', '树阴照水爱晴柔', '小荷才露尖尖角', '早有蜻蜓立上头'],
  },
  {
    id: 33,
    title: '元日',
    author: '王安石',
    dynasty: '宋',
    lines: ['爆竹声中一岁除', '春风送暖入屠苏', '千门万户曈曈日', '总把新桃换旧符'],
  },
  {
    id: 34,
    title: '泊船瓜洲',
    author: '王安石',
    dynasty: '宋',
    lines: ['京口瓜洲一水间', '钟山只隔数重山', '春风又绿江南岸', '明月何时照我还'],
  },
  {
    id: 35,
    title: '书湖阴先生壁',
    author: '王安石',
    dynasty: '宋',
    lines: ['茅檐长扫净无苔', '花木成畦手自栽', '一水护田将绿绕', '两山排闼送青来'],
  },
  {
    id: 36,
    title: '春日',
    author: '朱熹',
    dynasty: '宋',
    lines: ['胜日寻芳泗水滨', '无边光景一时新', '等闲识得东风面', '万紫千红总是春'],
  },
  {
    id: 37,
    title: '观书有感',
    author: '朱熹',
    dynasty: '宋',
    lines: ['半亩方塘一鉴开', '天光云影共徘徊', '问渠那得清如许', '为有源头活水来'],
  },
  {
    id: 38,
    title: '示儿',
    author: '陆游',
    dynasty: '宋',
    lines: ['死去元知万事空', '但悲不见九州同', '王师北定中原日', '家祭无忘告乃翁'],
  },
  {
    id: 39,
    title: '冬夜读书示子聿',
    author: '陆游',
    dynasty: '宋',
    lines: ['古人学问无遗力', '少壮工夫老始成', '纸上得来终觉浅', '绝知此事要躬行'],
  },
  {
    id: 40,
    title: '游山西村',
    author: '陆游',
    dynasty: '宋',
    lines: ['莫笑农家腊酒浑', '丰年留客足鸡豚', '山重水复疑无路', '柳暗花明又一村'],
  },
  {
    id: 41,
    title: '夏日绝句',
    author: '李清照',
    dynasty: '宋',
    lines: ['生当作人杰', '死亦为鬼雄', '至今思项羽', '不肯过江东'],
  },
  {
    id: 42,
    title: '如梦令',
    author: '李清照',
    dynasty: '宋',
    lines: ['常记溪亭日暮', '沉醉不知归路', '兴尽晚回舟', '误入藕花深处'],
  },
  {
    id: 43,
    title: '题临安邸',
    author: '林升',
    dynasty: '宋',
    lines: ['山外青山楼外楼', '西湖歌舞几时休', '暖风熏得游人醉', '直把杭州作汴州'],
  },
  {
    id: 44,
    title: '己亥杂诗',
    author: '龚自珍',
    dynasty: '清',
    lines: ['九州生气恃风雷', '万马齐喑究可哀', '我劝天公重抖擞', '不拘一格降人才'],
  },
  {
    id: 45,
    title: '竹石',
    author: '郑燮',
    dynasty: '清',
    lines: ['咬定青山不放松', '立根原在破岩中', '千磨万击还坚劲', '任尔东西南北风'],
  },
  {
    id: 46,
    title: '所见',
    author: '袁枚',
    dynasty: '清',
    lines: ['牧童骑黄牛', '歌声振林樾', '意欲捕鸣蝉', '忽然闭口立'],
  },
  {
    id: 47,
    title: '村居',
    author: '高鼎',
    dynasty: '清',
    lines: ['草长莺飞二月天', '拂堤杨柳醉春烟', '儿童散学归来早', '忙趁东风放纸鸢'],
  },
  {
    id: 48,
    title: '已凉',
    author: '韩偓',
    dynasty: '唐',
    lines: ['碧阑干外绣帘垂', '猩血屏风画折枝', '八尺龙须方锦褥', '已凉天气未寒时'],
  },
  {
    id: 49,
    title: '乌衣巷',
    author: '刘禹锡',
    dynasty: '唐',
    lines: ['朱雀桥边野草花', '乌衣巷口夕阳斜', '旧时王谢堂前燕', '飞入寻常百姓家'],
  },
  {
    id: 50,
    title: '望洞庭',
    author: '刘禹锡',
    dynasty: '唐',
    lines: ['湖光秋月两相和', '潭面无风镜未磨', '遥望洞庭山水翠', '白银盘里一青螺'],
  },
  {
    id: 51,
    title: '赋得古原草送别',
    author: '白居易',
    dynasty: '唐',
    lines: ['离离原上草', '一岁一枯荣', '野火烧不尽', '春风吹又生'],
  },
  {
    id: 52,
    title: '忆江南',
    author: '白居易',
    dynasty: '唐',
    lines: ['江南好', '风景旧曾谙', '日出江花红胜火', '春来江水绿如蓝', '能不忆江南'],
  },
  {
    id: 53,
    title: '池上',
    author: '白居易',
    dynasty: '唐',
    lines: ['小娃撑小艇', '偷采白莲回', '不解藏踪迹', '浮萍一道开'],
  },
  {
    id: 54,
    title: '寻隐者不遇',
    author: '贾岛',
    dynasty: '唐',
    lines: ['松下问童子', '言师采药去', '只在此山中', '云深不知处'],
  },
  {
    id: 55,
    title: '小儿垂钓',
    author: '胡令能',
    dynasty: '唐',
    lines: ['蓬头稚子学垂纶', '侧坐莓苔草映身', '路人借问遥招手', '怕得鱼惊不应人'],
  },
]

export interface Question {
  prompt: string
  correctAnswer: string
  options: string[]
  poetry: Poetry
  promptIndex: number
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const usedPoetryIds: Set<number> = new Set()

export function resetUsedPoetry(): void {
  usedPoetryIds.clear()
}

export function getRandomQuestion(): Question {
  let availablePoetry = POETRY_BANK.filter((p) => !usedPoetryIds.has(p.id))
  if (availablePoetry.length === 0) {
    usedPoetryIds.clear()
    availablePoetry = [...POETRY_BANK]
  }

  const poetry = availablePoetry[Math.floor(Math.random() * availablePoetry.length)]
  usedPoetryIds.add(poetry.id)

  const validPairs: { prompt: string; answer: string; promptIndex: number }[] = []
  for (let i = 0; i < poetry.lines.length - 1; i++) {
    validPairs.push({
      prompt: poetry.lines[i],
      answer: poetry.lines[i + 1],
      promptIndex: i,
    })
  }

  const selectedPair = validPairs[Math.floor(Math.random() * validPairs.length)]

  const wrongAnswers: string[] = []
  const otherPoetry = POETRY_BANK.filter((p) => p.id !== poetry.id)
  const shuffledOthers = shuffle(otherPoetry)

  for (const other of shuffledOthers) {
    for (const line of other.lines) {
      if (line !== selectedPair.answer && !wrongAnswers.includes(line)) {
        wrongAnswers.push(line)
        if (wrongAnswers.length >= 3) break
      }
    }
    if (wrongAnswers.length >= 3) break
  }

  while (wrongAnswers.length < 3) {
    const fallbackPoetry = POETRY_BANK[Math.floor(Math.random() * POETRY_BANK.length)]
    const fallbackLine = fallbackPoetry.lines[Math.floor(Math.random() * fallbackPoetry.lines.length)]
    if (fallbackLine !== selectedPair.answer && !wrongAnswers.includes(fallbackLine)) {
      wrongAnswers.push(fallbackLine)
    }
  }

  const options = shuffle([selectedPair.answer, ...wrongAnswers])

  return {
    prompt: selectedPair.prompt,
    correctAnswer: selectedPair.answer,
    options,
    poetry,
    promptIndex: selectedPair.promptIndex,
  }
}
