/**
 * 题库模块
 * 提供文字谜题题目的数据和操作函数
 */

/**
 * 题目选项接口
 */
export interface QuestionOption {
  id: number
  text: string
}

/**
 * 题目接口
 */
export interface Question {
  /** 题目唯一ID */
  id: number
  /** 4个关键词，用于描述谜题答案 */
  keywords: string[]
  /** 4个选项 */
  options: QuestionOption[]
  /** 正确答案的选项ID (0-3) */
  correctAnswerId: number
  /** 答案解析说明 */
  explanation: string
  /** 题目类别：game(游戏角色)、anime(动漫角色)、history(历史人物)、movie(电影角色)、literature(文学角色) */
  category: string
}

/**
 * 所有题目数据
 */
export const allQuestions: Question[] = [
  {
    id: 1,
    keywords: ['蘑菇', '水管工', '公主', '红色帽子'],
    options: [
      { id: 0, text: '路易吉' },
      { id: 1, text: '马里奥' },
      { id: 2, text: '索尼克' },
      { id: 3, text: '林克' }
    ],
    correctAnswerId: 1,
    explanation: '马里奥是任天堂经典游戏《超级马里奥》系列的主角，是一位穿着红色帽子和蓝色背带裤的意大利水管工，以拯救碧琪公主和吃蘑菇变大而闻名。',
    category: 'game'
  },
  {
    id: 2,
    keywords: ['忍者', '写轮眼', '九尾', '橙色头发'],
    options: [
      { id: 0, text: '宇智波佐助' },
      { id: 1, text: '旗木卡卡西' },
      { id: 2, text: '漩涡鸣人' },
      { id: 3, text: '宇智波鼬' }
    ],
    correctAnswerId: 2,
    explanation: '漩涡鸣人是《火影忍者》的主角，体内封印着九尾妖狐，有着标志性的橙色头发，后期掌握了写轮眼等忍术，最终成为第七代火影。',
    category: 'anime'
  },
  {
    id: 3,
    keywords: ['海盗', '草帽', '橡胶', '航海王'],
    options: [
      { id: 0, text: '罗罗诺亚·索隆' },
      { id: 1, text: '蒙奇·D·路飞' },
      { id: 2, text: '香克斯' },
      { id: 3, text: '哥尔·D·罗杰' }
    ],
    correctAnswerId: 1,
    explanation: '蒙奇·D·路飞是《海贼王》的主角，头戴草帽，吃下橡胶果实后身体可以自由伸缩，梦想是成为航海王找到传说中的One Piece。',
    category: 'anime'
  },
  {
    id: 4,
    keywords: ['皇帝', '焚书坑儒', '长城', '统一六国'],
    options: [
      { id: 0, text: '汉武帝' },
      { id: 1, text: '唐太宗' },
      { id: 2, text: '秦始皇' },
      { id: 3, text: '成吉思汗' }
    ],
    correctAnswerId: 2,
    explanation: '秦始皇嬴政是中国历史上第一个皇帝，他统一六国，修建长城，实行焚书坑儒政策，建立了中国历史上第一个中央集权的统一王朝。',
    category: 'history'
  },
  {
    id: 5,
    keywords: ['巫师', '闪电伤疤', '霍格沃茨', '魔法'],
    options: [
      { id: 0, text: '哈利·波特' },
      { id: 1, text: '罗恩·韦斯莱' },
      { id: 2, text: '西弗勒斯·斯内普' },
      { id: 3, text: '伏地魔' }
    ],
    correctAnswerId: 0,
    explanation: '哈利·波特是J.K.罗琳同名小说的主角，额头上有一道闪电形伤疤，在霍格沃茨魔法学校学习魔法，是打败黑魔王伏地魔的传奇巫师。',
    category: 'literature'
  },
  {
    id: 6,
    keywords: ['蝙蝠侠', '黑暗骑士', '哥谭市', '小丑'],
    options: [
      { id: 0, text: '超人' },
      { id: 1, text: '钢铁侠' },
      { id: 2, text: '布鲁斯·韦恩' },
      { id: 3, text: '美国队长' }
    ],
    correctAnswerId: 2,
    explanation: '布鲁斯·韦恩即蝙蝠侠，是DC漫画的经典超级英雄，生活在哥谭市，《黑暗骑士》是其最经典的电影之一，小丑是他最大的对手。',
    category: 'movie'
  },
  {
    id: 7,
    keywords: ['三国', '草船借箭', '卧龙', '赤壁之战'],
    options: [
      { id: 0, text: '曹操' },
      { id: 1, text: '诸葛亮' },
      { id: 2, text: '周瑜' },
      { id: 3, text: '刘备' }
    ],
    correctAnswerId: 1,
    explanation: '诸葛亮号卧龙，是三国时期蜀汉丞相，在赤壁之战中与周瑜联手抗曹，草船借箭、借东风等典故均与他相关，是智慧的化身。',
    category: 'history'
  },
  {
    id: 8,
    keywords: ['赛亚人', '龟派气功', '超级赛亚人', '龙珠'],
    options: [
      { id: 0, text: '贝吉塔' },
      { id: 1, text: '孙悟饭' },
      { id: 2, text: '孙悟空' },
      { id: 3, text: '特兰克斯' }
    ],
    correctAnswerId: 2,
    explanation: '孙悟空是《龙珠》系列的主角，本名卡卡罗特，是赛亚人，标志性技能为龟派气功，可以变身超级赛亚人，围绕收集七颗龙珠展开冒险。',
    category: 'anime'
  },
  {
    id: 9,
    keywords: ['刺客', '袖剑', '圣殿骑士', '信仰之跃'],
    options: [
      { id: 0, text: '艾吉奥·奥迪托雷' },
      { id: 1, text: '康纳' },
      { id: 2, text: '阿泰尔' },
      { id: 3, text: '阿利克西欧斯' }
    ],
    correctAnswerId: 0,
    explanation: '艾吉奥·奥迪托雷是《刺客信条2》三部曲的主角，是文艺复兴时期的意大利刺客，使用袖剑与圣殿骑士对抗，信仰之跃是刺客的标志性动作。',
    category: 'game'
  },
  {
    id: 10,
    keywords: ['侦探', '贝克街', '烟斗', '华生'],
    options: [
      { id: 0, text: '赫尔克里·波洛' },
      { id: 1, text: '夏洛克·福尔摩斯' },
      { id: 2, text: '江户川柯南' },
      { id: 3, text: '金田一耕助' }
    ],
    correctAnswerId: 1,
    explanation: '夏洛克·福尔摩斯是阿瑟·柯南·道尔创造的传奇侦探，居住在伦敦贝克街221B号，经常叼着烟斗，与搭档华生医生一起破解各种疑难案件。',
    category: 'literature'
  },
  {
    id: 11,
    keywords: ['黑客', '红色药丸', '矩阵', '尼奥'],
    options: [
      { id: 0, text: '崔妮蒂' },
      { id: 1, text: '墨菲斯' },
      { id: 2, text: '史密斯探员' },
      { id: 3, text: '尼奥' }
    ],
    correctAnswerId: 3,
    explanation: '尼奥是电影《黑客帝国》的主角，原名托马斯·安德森，在吞下红色药丸后发现自己身处虚拟世界矩阵之中，最终成为拯救人类的救世主。',
    category: 'movie'
  },
  {
    id: 12,
    keywords: ['精灵', '魔戒', '甘道夫', '霍比特人'],
    options: [
      { id: 0, text: '阿拉贡' },
      { id: 1, text: '莱戈拉斯' },
      { id: 2, text: '佛罗多·巴金斯' },
      { id: 3, text: '索林·橡木盾' }
    ],
    correctAnswerId: 2,
    explanation: '佛罗多·巴金斯是《指环王》三部曲的核心人物，是一个霍比特人，肩负着将至尊魔戒投入末日火山销毁的重任，与精灵、巫师甘道夫等并肩作战。',
    category: 'literature'
  },
  {
    id: 13,
    keywords: ['古希腊', '特洛伊', '阿喀琉斯之踵', '半神'],
    options: [
      { id: 0, text: '奥德修斯' },
      { id: 1, text: '阿喀琉斯' },
      { id: 2, text: '赫克托耳' },
      { id: 3, text: '帕里斯' }
    ],
    correctAnswerId: 1,
    explanation: '阿喀琉斯是古希腊神话中的半神英雄，海洋女神忒提斯之子，特洛伊战争中最伟大的战士，全身刀枪不入唯有脚后跟是弱点，即"阿喀琉斯之踵"。',
    category: 'history'
  },
  {
    id: 14,
    keywords: ['最终幻想', '克劳德', '大剑', '神罗'],
    options: [
      { id: 0, text: '萨菲罗斯' },
      { id: 1, text: '扎克斯' },
      { id: 2, text: '克劳德·斯特莱夫' },
      { id: 3, text: '巴雷特' }
    ],
    correctAnswerId: 2,
    explanation: '克劳德·斯特莱夫是《最终幻想7》的主角，原神罗公司特种兵，使用标志性的破坏大剑，与反神罗组织雪崩一起对抗邪恶的神罗公司和萨菲罗斯。',
    category: 'game'
  },
  {
    id: 15,
    keywords: ['死神', '斩魄刀', '黑崎', '虚'],
    options: [
      { id: 0, text: '朽木露琪亚' },
      { id: 1, text: '黑崎一护' },
      { id: 2, text: '日番谷冬狮郎' },
      { id: 3, text: '市丸银' }
    ],
    correctAnswerId: 1,
    explanation: '黑崎一护是《BLEACH/死神》的主角，橘色头发，拥有死神之力，使用斩魄刀斩月，能看见并消灭虚（恶灵），为保护家人和朋友而战。',
    category: 'anime'
  },
  {
    id: 16,
    keywords: ['铁王座', '龙母', '坦格利安', '冰与火之歌'],
    options: [
      { id: 0, text: '瑟曦·兰尼斯特' },
      { id: 1, text: '丹妮莉丝·坦格利安' },
      { id: 2, text: '珊莎·史塔克' },
      { id: 3, text: '艾莉亚·史塔克' }
    ],
    correctAnswerId: 1,
    explanation: '丹妮莉丝·坦格利安，人称"龙母"，是《权力的游戏》（冰与火之歌改编）中的核心角色，坦格利安王朝的幸存者，拥有三条火龙，目标是夺回铁王座。',
    category: 'movie'
  },
  {
    id: 17,
    keywords: ['侠客', '独孤求败', '神雕', '玄铁重剑'],
    options: [
      { id: 0, text: '郭靖' },
      { id: 1, text: '杨过' },
      { id: 2, text: '令狐冲' },
      { id: 3, text: '张无忌' }
    ],
    correctAnswerId: 1,
    explanation: '杨过是金庸小说《神雕侠侣》的主角，断臂后使用独孤求败留下的玄铁重剑，与神雕为伴，人称"神雕侠"，最终与小龙女团聚。',
    category: 'literature'
  },
  {
    id: 18,
    keywords: ['塞尔达', '海拉鲁', '大师之剑', '三角力量'],
    options: [
      { id: 0, text: '林克' },
      { id: 1, text: '塞尔达公主' },
      { id: 2, text: '加农' },
      { id: 3, text: '米法' }
    ],
    correctAnswerId: 0,
    explanation: '林克是任天堂《塞尔达传说》系列的主角，是海拉鲁王国的勇者，使用大师之剑，代表三角力量中的勇气，与塞尔达公主一起对抗魔王加农。',
    category: 'game'
  },
  {
    id: 19,
    keywords: ['泰坦尼克号', '露丝', '杰克', '海洋之心'],
    options: [
      { id: 0, text: '卡尔·霍克利' },
      { id: 1, text: '杰克·道森' },
      { id: 2, text: '托马斯·安德鲁斯' },
      { id: 3, text: '白星·伊斯梅' }
    ],
    correctAnswerId: 1,
    explanation: '杰克·道森是电影《泰坦尼克号》的男主角，一位穷困的美国画家，在船上与富家女露丝相遇相恋，最终在沉船事故中将生还机会让给了露丝。',
    category: 'movie'
  },
  {
    id: 20,
    keywords: ['进击的巨人', '调查兵团', '立体机动装置', '艾伦'],
    options: [
      { id: 0, text: '三笠·阿克曼' },
      { id: 1, text: '利威尔·阿克曼' },
      { id: 2, text: '艾伦·耶格尔' },
      { id: 3, text: '阿尔敏·阿诺德' }
    ],
    correctAnswerId: 2,
    explanation: '艾伦·耶格尔是《进击的巨人》的主角，加入调查兵团对抗巨人，使用立体机动装置战斗，拥有变身巨人的能力，为了复仇和自由而战。',
    category: 'anime'
  },
  {
    id: 21,
    keywords: ['魔兽世界', '巫妖王', '霜之哀伤', '阿尔萨斯'],
    options: [
      { id: 0, text: '萨尔' },
      { id: 1, text: '伊利丹·怒风' },
      { id: 2, text: '阿尔萨斯·米奈希尔' },
      { id: 3, text: '瓦里安·乌瑞恩' }
    ],
    correctAnswerId: 2,
    explanation: '阿尔萨斯·米奈希尔是《魔兽世界》的经典角色，原本是洛丹伦王子，拔出诅咒之剑霜之哀伤后堕落成为第二代巫妖王，是魔兽史上最具悲剧色彩的人物之一。',
    category: 'game'
  },
  {
    id: 22,
    keywords: ['宋朝', '精忠报国', '岳家军', '抗金'],
    options: [
      { id: 0, text: '文天祥' },
      { id: 1, text: '岳飞' },
      { id: 2, text: '辛弃疾' },
      { id: 3, text: '戚继光' }
    ],
    correctAnswerId: 1,
    explanation: '岳飞是南宋著名抗金名将，背后刺有"精忠报国"四字，率领岳家军屡败金兵，是中国历史上最著名的民族英雄之一，后被秦桧以"莫须有"罪名陷害。',
    category: 'history'
  }
]

/**
 * 随机抽取不重复的题目
 * @param count 需要抽取的题目数量
 * @returns 随机抽取的题目数组
 */
export function getRandomQuestions(count: number): Question[] {
  if (count <= 0) {
    return []
  }
  if (count >= allQuestions.length) {
    return [...allQuestions]
  }

  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 校验答案是否正确
 * @param questionId 题目ID
 * @param answerId 选择的答案ID
 * @returns 答案是否正确
 */
export function checkAnswer(questionId: number, answerId: number): boolean {
  const question = allQuestions.find(q => q.id === questionId)
  if (!question) {
    return false
  }
  return question.correctAnswerId === answerId
}
