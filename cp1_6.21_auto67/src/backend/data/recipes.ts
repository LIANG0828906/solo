import { Recipe } from '../../shared/types'

export const recipes: Recipe[] = [
  {
    id: '1',
    name: '番茄炒蛋',
    ingredients: ['鸡蛋', '番茄', '葱花', '盐', '糖'],
    duration: 15,
    difficulty: 1,
    steps: [
      '番茄切块，鸡蛋打散加少许盐',
      '热锅倒油，倒入蛋液炒至凝固盛出',
      '锅中加油放入番茄翻炒出汁',
      '加入盐和少许糖调味',
      '倒入炒好的鸡蛋翻炒均匀',
      '撒上葱花即可出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)'
  },
  {
    id: '2',
    name: '土豆炖牛肉',
    ingredients: ['牛肉', '土豆', '胡萝卜', '洋葱', '姜片', '料酒', '生抽', '老抽'],
    duration: 90,
    difficulty: 3,
    steps: [
      '牛肉切块焯水去血沫',
      '土豆胡萝卜切滚刀块，洋葱切片',
      '热锅倒油爆香姜片和洋葱',
      '放入牛肉翻炒，加料酒去腥',
      '加入生抽老抽调色',
      '加水没过食材大火烧开转小火炖60分钟',
      '加入土豆胡萝卜继续炖20分钟',
      '大火收汁即可'
    ],
    imageGradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)'
  },
  {
    id: '3',
    name: '青椒炒肉丝',
    ingredients: ['猪肉', '青椒', '蒜末', '生抽', '料酒', '淀粉'],
    duration: 20,
    difficulty: 2,
    steps: [
      '猪肉切丝，用生抽料酒淀粉腌制10分钟',
      '青椒去籽切丝',
      '热锅倒油爆香蒜末',
      '放入肉丝快速翻炒至变色',
      '加入青椒丝翻炒至断生',
      '加少许盐调味出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
  },
  {
    id: '4',
    name: '宫保鸡丁',
    ingredients: ['鸡胸肉', '花生', '黄瓜', '葱', '姜', '蒜', '干辣椒', '生抽', '醋', '糖'],
    duration: 25,
    difficulty: 3,
    steps: [
      '鸡胸肉切丁，用料酒生抽淀粉腌制',
      '黄瓜切丁，葱姜蒜切末',
      '调酱汁：生抽、醋、糖、淀粉、水',
      '热锅倒油爆香干辣椒和葱姜蒜',
      '放入鸡丁翻炒至变色',
      '加入黄瓜丁翻炒',
      '倒入酱汁快速翻炒均匀',
      '最后加入花生米拌匀出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
  },
  {
    id: '5',
    name: '麻婆豆腐',
    ingredients: ['豆腐', '猪肉', '蒜末', '豆瓣酱', '花椒粉', '葱花', '生抽'],
    duration: 20,
    difficulty: 2,
    steps: [
      '豆腐切小块焯水备用',
      '猪肉切末',
      '热锅倒油爆香蒜末和豆瓣酱',
      '放入肉末翻炒至变色',
      '加入适量水烧开',
      '放入豆腐轻轻推动',
      '加生抽调味，水淀粉勾芡',
      '出锅撒花椒粉和葱花'
    ],
    imageGradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
  },
  {
    id: '6',
    name: '西红柿鸡蛋面',
    ingredients: ['面条', '鸡蛋', '番茄', '葱花', '盐', '香油'],
    duration: 20,
    difficulty: 1,
    steps: [
      '番茄切块，鸡蛋打散',
      '热锅倒油炒鸡蛋盛出',
      '炒番茄出汁加水烧开',
      '放入面条煮熟',
      '加入炒好的鸡蛋',
      '加盐调味，撒葱花滴香油'
    ],
    imageGradient: 'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)'
  },
  {
    id: '7',
    name: '蛋炒饭',
    ingredients: ['米饭', '鸡蛋', '胡萝卜', '黄瓜', '葱花', '盐', '生抽'],
    duration: 15,
    difficulty: 1,
    steps: [
      '鸡蛋打散，胡萝卜黄瓜切丁',
      '热锅倒油炒鸡蛋盛出',
      '锅中倒油放入米饭炒散',
      '加入胡萝卜丁翻炒',
      '加入黄瓜丁和鸡蛋',
      '加盐和生抽调味',
      '最后撒葱花翻炒均匀'
    ],
    imageGradient: 'linear-gradient(135deg, #feca57 0%, #ff9f43 100%)'
  },
  {
    id: '8',
    name: '清蒸鲈鱼',
    ingredients: ['鱼', '葱', '姜', '料酒', '蒸鱼豉油', '香油'],
    duration: 25,
    difficulty: 2,
    steps: [
      '鱼处理干净，两面划几刀',
      '鱼身抹料酒，放姜丝',
      '水开后上锅蒸8-10分钟',
      '取出倒掉盘中汤汁',
      '淋上蒸鱼豉油',
      '放葱丝，淋热油激香',
      '滴几滴香油即可'
    ],
    imageGradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
  },
  {
    id: '9',
    name: '蒜蓉西兰花',
    ingredients: ['西兰花', '蒜末', '盐', '蚝油'],
    duration: 10,
    difficulty: 1,
    steps: [
      '西兰花切小朵焯水备用',
      '热锅倒油爆香蒜末',
      '放入西兰花快速翻炒',
      '加盐和蚝油调味',
      '翻炒均匀即可出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)'
  },
  {
    id: '10',
    name: '红烧肉',
    ingredients: ['猪肉', '冰糖', '生抽', '老抽', '料酒', '姜片', '八角', '桂皮'],
    duration: 120,
    difficulty: 4,
    steps: [
      '五花肉切块焯水',
      '锅中放冰糖小火炒糖色',
      '放入肉块翻炒上色',
      '加料酒、生抽、老抽调味',
      '加入姜片、八角、桂皮',
      '加水没过肉块大火烧开',
      '转小火炖90分钟',
      '大火收汁即可'
    ],
    imageGradient: 'linear-gradient(135deg, #8b4513 0%, #654321 100%)'
  },
  {
    id: '11',
    name: '地三鲜',
    ingredients: ['土豆', '茄子', '青椒', '蒜末', '生抽', '醋', '糖', '淀粉'],
    duration: 30,
    difficulty: 3,
    steps: [
      '土豆茄子切滚刀块，青椒切片',
      '土豆茄子分别油炸至金黄',
      '调酱汁：生抽、醋、糖、淀粉、水',
      '热锅留底油爆香蒜末',
      '倒入酱汁熬至浓稠',
      '放入炸好的土豆茄子和青椒',
      '快速翻炒均匀出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)'
  },
  {
    id: '12',
    name: '鱼香肉丝',
    ingredients: ['猪肉', '胡萝卜', '木耳', '青椒', '蒜末', '豆瓣酱', '生抽', '醋', '糖'],
    duration: 25,
    difficulty: 3,
    steps: [
      '猪肉切丝腌制，胡萝卜木耳青椒切丝',
      '调鱼香汁：生抽、醋、糖、淀粉、水',
      '热锅倒油炒肉丝盛出',
      '爆香蒜末和豆瓣酱',
      '放入蔬菜丝翻炒',
      '倒入肉丝和鱼香汁',
      '快速翻炒均匀出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)'
  },
  {
    id: '13',
    name: '洋葱炒鸡蛋',
    ingredients: ['鸡蛋', '洋葱', '盐', '生抽'],
    duration: 15,
    difficulty: 1,
    steps: [
      '洋葱切丝，鸡蛋打散',
      '热锅倒油炒鸡蛋盛出',
      '锅中加油炒洋葱至软',
      '加少许生抽调味',
      '倒入鸡蛋翻炒均匀',
      '加盐调味出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
  },
  {
    id: '14',
    name: '豆角烧茄子',
    ingredients: ['豆角', '茄子', '蒜末', '生抽', '老抽', '蚝油'],
    duration: 25,
    difficulty: 2,
    steps: [
      '豆角切段，茄子切条',
      '茄子撒盐腌制10分钟挤干水分',
      '豆角焯水备用',
      '热锅倒油煎茄子至软',
      '爆香蒜末，放入豆角翻炒',
      '加生抽老抽蚝油调味',
      '加水焖5分钟收汁'
    ],
    imageGradient: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)'
  },
  {
    id: '15',
    name: '白灼虾',
    ingredients: ['虾', '姜', '葱', '料酒', '生抽', '醋', '香油'],
    duration: 15,
    difficulty: 1,
    steps: [
      '虾剪去虾须，挑去虾线',
      '锅中加水放姜片葱段料酒',
      '水开后放入虾煮2-3分钟',
      '捞出过冰水保持弹脆',
      '调蘸料：生抽、醋、香油、姜末',
      '摆盘即可'
    ],
    imageGradient: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)'
  },
  {
    id: '16',
    name: '蘑菇炒肉片',
    ingredients: ['蘑菇', '猪肉', '蒜末', '生抽', '淀粉'],
    duration: 20,
    difficulty: 2,
    steps: [
      '蘑菇切片焯水备用',
      '猪肉切片腌制',
      '热锅倒油炒肉片盛出',
      '爆香蒜末炒蘑菇',
      '加少许水炒出汤汁',
      '倒入肉片翻炒',
      '加生抽调味，水淀粉勾芡'
    ],
    imageGradient: 'linear-gradient(135deg, #b2bec3 0%, #636e72 100%)'
  },
  {
    id: '17',
    name: '酸辣白菜',
    ingredients: ['白菜', '干辣椒', '蒜末', '醋', '糖', '盐'],
    duration: 10,
    difficulty: 1,
    steps: [
      '白菜切片，干辣椒切段',
      '热锅倒油爆香干辣椒和蒜末',
      '放入白菜快速翻炒',
      '加醋和糖调味',
      '加盐翻炒均匀出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #55a3ff 0%, #0066cc 100%)'
  },
  {
    id: '18',
    name: '黄瓜炒鸡蛋',
    ingredients: ['鸡蛋', '黄瓜', '蒜末', '盐'],
    duration: 12,
    difficulty: 1,
    steps: [
      '黄瓜切片，鸡蛋打散',
      '热锅倒油炒鸡蛋盛出',
      '爆香蒜末炒黄瓜片',
      '黄瓜断生后倒入鸡蛋',
      '加盐调味翻炒均匀出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #7bed9f 0%, #2ed573 100%)'
  },
  {
    id: '19',
    name: '红烧茄子',
    ingredients: ['茄子', '蒜末', '生抽', '老抽', '糖', '淀粉'],
    duration: 20,
    difficulty: 2,
    steps: [
      '茄子切滚刀块，撒盐腌制10分钟',
      '挤干茄子水分，裹上淀粉',
      '调酱汁：生抽、老抽、糖、淀粉、水',
      '热锅油煎茄子至金黄',
      '爆香蒜末，倒入酱汁',
      '放入茄子快速翻炒均匀出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #8e44ad 0%, #6c3483 100%)'
  },
  {
    id: '20',
    name: '牛肉炒饭',
    ingredients: ['米饭', '牛肉', '胡萝卜', '豌豆', '鸡蛋', '生抽', '料酒', '淀粉'],
    duration: 25,
    difficulty: 2,
    steps: [
      '牛肉切丁腌制，胡萝卜切丁',
      '鸡蛋打散炒熟盛出',
      '热锅炒牛肉丁至变色',
      '加胡萝卜丁豌豆翻炒',
      '放入米饭炒散',
      '加鸡蛋和生抽调味',
      '大火翻炒均匀出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)'
  },
  {
    id: '21',
    name: '番茄牛腩汤',
    ingredients: ['牛肉', '番茄', '土豆', '胡萝卜', '洋葱', '姜片', '番茄酱'],
    duration: 120,
    difficulty: 3,
    steps: [
      '牛肉切块焯水去血沫',
      '番茄切块炒出汁',
      '高压锅中放入牛肉、番茄、番茄酱',
      '加姜片、洋葱、水',
      '上汽后压40分钟',
      '加入土豆胡萝卜继续压15分钟',
      '开盖加盐调味即可'
    ],
    imageGradient: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)'
  },
  {
    id: '22',
    name: '鸡蛋羹',
    ingredients: ['鸡蛋', '温水', '盐', '葱花', '生抽', '香油'],
    duration: 15,
    difficulty: 1,
    steps: [
      '鸡蛋打散加1.5倍温水',
      '加少许盐搅拌均匀',
      '过筛去除浮沫',
      '盖上保鲜膜扎小孔',
      '水开后中火蒸10分钟',
      '淋生抽、香油，撒葱花'
    ],
    imageGradient: 'linear-gradient(135deg, #fff200 0%, #ffd700 100%)'
  },
  {
    id: '23',
    name: '辣子鸡',
    ingredients: ['鸡胸肉', '干辣椒', '花椒', '葱', '姜', '蒜', '生抽', '料酒', '淀粉'],
    duration: 35,
    difficulty: 4,
    steps: [
      '鸡肉切丁腌制',
      '油炸至金黄酥脆',
      '锅中留油爆香干辣椒花椒',
      '加葱姜蒜炒香',
      '倒入鸡丁翻炒',
      '加生抽调味',
      '撒熟芝麻和葱花出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #e55039 0%, #b71540 100%)'
  },
  {
    id: '24',
    name: '清炒土豆丝',
    ingredients: ['土豆', '青椒', '蒜末', '醋', '盐'],
    duration: 15,
    difficulty: 1,
    steps: [
      '土豆青椒切丝，土豆丝泡水去淀粉',
      '热锅爆香蒜末',
      '放入土豆丝快速翻炒',
      '沿锅边淋醋',
      '加青椒丝翻炒',
      '加盐调味出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
  },
  {
    id: '25',
    name: '冬瓜丸子汤',
    ingredients: ['猪肉', '冬瓜', '葱', '姜', '生抽', '淀粉', '盐'],
    duration: 30,
    difficulty: 2,
    steps: [
      '猪肉剁碎，加葱姜末、生抽、淀粉搅拌上劲',
      '冬瓜去皮切片',
      '锅中加水烧开',
      '将肉馅挤成丸子下锅',
      '丸子浮起后加冬瓜片',
      '煮至冬瓜透明加盐调味',
      '撒葱花即可'
    ],
    imageGradient: 'linear-gradient(135deg, #81ecec 0%, #00cec9 100%)'
  },
  {
    id: '26',
    name: '糖醋里脊',
    ingredients: ['猪肉', '番茄酱', '糖', '醋', '淀粉', '鸡蛋', '面粉'],
    duration: 40,
    difficulty: 3,
    steps: [
      '里脊肉切条腌制',
      '调面糊：淀粉、面粉、鸡蛋、水',
      '肉条裹面糊炸至金黄',
      '复炸一次更酥脆',
      '调糖醋汁：番茄酱、糖、醋、水、淀粉',
      '锅中熬汁至浓稠',
      '倒入炸好的里脊快速翻炒均匀'
    ],
    imageGradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)'
  },
  {
    id: '27',
    name: '蒜蓉蒸虾',
    ingredients: ['虾', '蒜末', '粉丝', '葱', '生抽', '蚝油', '香油'],
    duration: 20,
    difficulty: 2,
    steps: [
      '粉丝泡软铺盘底',
      '虾开背去虾线摆在粉丝上',
      '蒜末加油、生抽、蚝油调成酱汁',
      '将酱汁淋在虾上',
      '水开后蒸8分钟',
      '取出撒葱花，淋热油激香'
    ],
    imageGradient: 'linear-gradient(135deg, #ff7979 0%, #eb4d4b 100%)'
  },
  {
    id: '28',
    name: '胡萝卜炒肉片',
    ingredients: ['胡萝卜', '猪肉', '蒜末', '生抽', '淀粉'],
    duration: 20,
    difficulty: 1,
    steps: [
      '胡萝卜切片，猪肉切片腌制',
      '热锅炒肉片盛出',
      '爆香蒜末炒胡萝卜',
      '加少许水焖软',
      '倒入肉片翻炒',
      '加生抽调味出锅'
    ],
    imageGradient: 'linear-gradient(135deg, #ff9f43 0%, #ee5a24 100%)'
  },
  {
    id: '29',
    name: '香菇滑鸡',
    ingredients: ['鸡肉', '香菇', '姜', '葱', '生抽', '料酒', '淀粉', '蚝油'],
    duration: 30,
    difficulty: 2,
    steps: [
      '鸡肉切块腌制',
      '香菇切片',
      '热锅爆香姜片',
      '放入鸡块翻炒至变色',
      '加香菇翻炒出香',
      '加生抽蚝油调味',
      '加水焖10分钟',
      '水淀粉勾芡，撒葱花'
    ],
    imageGradient: 'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)'
  },
  {
    id: '30',
    name: '什锦蔬菜炒饭',
    ingredients: ['米饭', '鸡蛋', '胡萝卜', '玉米', '豌豆', '黄瓜', '火腿', '生抽', '盐'],
    duration: 20,
    difficulty: 1,
    steps: [
      '所有蔬菜切丁，火腿切丁',
      '鸡蛋炒熟盛出',
      '热锅炒胡萝卜丁',
      '加玉米豌豆翻炒',
      '放米饭炒散',
      '加火腿、鸡蛋、黄瓜丁',
      '加生抽盐调味翻炒均匀'
    ],
    imageGradient: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)'
  }
]

export const commonIngredients = [
  '鸡蛋', '番茄', '鸡胸肉', '洋葱', '土豆', '胡萝卜',
  '牛肉', '面条', '米饭', '猪肉', '白菜', '豆腐',
  '黄瓜', '茄子', '青椒', '豆角', '西兰花', '蘑菇',
  '虾', '鱼'
]
