import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const ingredients = [
  { id: 'i1', name: '西红柿', category: '蔬菜' },
  { id: 'i2', name: '黄瓜', category: '蔬菜' },
  { id: 'i3', name: '胡萝卜', category: '蔬菜' },
  { id: 'i4', name: '土豆', category: '蔬菜' },
  { id: 'i5', name: '洋葱', category: '蔬菜' },
  { id: 'i6', name: '青椒', category: '蔬菜' },
  { id: 'i7', name: '茄子', category: '蔬菜' },
  { id: 'i8', name: '菠菜', category: '蔬菜' },
  { id: 'i9', name: '白菜', category: '蔬菜' },
  { id: 'i10', name: '豆芽', category: '蔬菜' },
  { id: 'i11', name: '香菇', category: '蔬菜' },
  { id: 'i12', name: '豆腐', category: '蔬菜' },
  { id: 'i13', name: '西兰花', category: '蔬菜' },
  { id: 'i14', name: '芹菜', category: '蔬菜' },
  { id: 'i15', name: '南瓜', category: '蔬菜' },
  { id: 'i16', name: '生姜', category: '蔬菜' },
  { id: 'i17', name: '大蒜', category: '蔬菜' },
  { id: 'i18', name: '大葱', category: '蔬菜' },
  { id: 'i19', name: '鸡肉', category: '肉类' },
  { id: 'i20', name: '猪肉', category: '肉类' },
  { id: 'i21', name: '牛肉', category: '肉类' },
  { id: 'i22', name: '羊肉', category: '肉类' },
  { id: 'i23', name: '鸭肉', category: '肉类' },
  { id: 'i24', name: '培根', category: '肉类' },
  { id: 'i25', name: '香肠', category: '肉类' },
  { id: 'i26', name: '虾仁', category: '海鲜' },
  { id: 'i27', name: '三文鱼', category: '海鲜' },
  { id: 'i28', name: '带鱼', category: '海鲜' },
  { id: 'i29', name: '蟹肉', category: '海鲜' },
  { id: 'i30', name: '蛤蜊', category: '海鲜' },
  { id: 'i31', name: '鱿鱼', category: '海鲜' },
  { id: 'i32', name: '盐', category: '调味料' },
  { id: 'i33', name: '酱油', category: '调味料' },
  { id: 'i34', name: '醋', category: '调味料' },
  { id: 'i35', name: '料酒', category: '调味料' },
  { id: 'i36', name: '蚝油', category: '调味料' },
  { id: 'i37', name: '辣椒酱', category: '调味料' },
  { id: 'i38', name: '番茄酱', category: '调味料' },
  { id: 'i39', name: '芝麻油', category: '调味料' },
  { id: 'i40', name: '橄榄油', category: '调味料' },
  { id: 'i41', name: '黄油', category: '调味料' },
  { id: 'i42', name: '黑胡椒', category: '调味料' },
  { id: 'i43', name: '花椒', category: '调味料' },
  { id: 'i44', name: '八角', category: '调味料' },
  { id: 'i45', name: '米饭', category: '主食' },
  { id: 'i46', name: '面条', category: '主食' },
  { id: 'i47', name: '面粉', category: '主食' },
  { id: 'i48', name: '鸡蛋', category: '乳制品' },
  { id: 'i49', name: '牛奶', category: '乳制品' },
  { id: 'i50', name: '芝士', category: '乳制品' },
  { id: 'i51', name: '奶油', category: '乳制品' },
  { id: 'i52', name: '苹果', category: '水果' },
  { id: 'i53', name: '柠檬', category: '水果' },
  { id: 'i54', name: '白砂糖', category: '调味料' },
  { id: 'i55', name: '蜂蜜', category: '调味料' },
];

const recipes = [
  {
    id: 'r1',
    name: '番茄炒蛋',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r1/400/320',
    ingredients: ['i1', 'i48', 'i32', 'i33', 'i54', 'i16'],
    steps: [
      '西红柿洗净切块，鸡蛋打散加少许盐搅匀',
      '锅中加油烧热，倒入蛋液翻炒至凝固盛出',
      '锅中再加少许油，放入西红柿翻炒出汁',
      '加入适量盐和糖调味，倒回鸡蛋翻炒均匀',
      '撒上葱花出锅装盘'
    ],
    nutrition: { calories: 180, protein: 12, fat: 10, carbs: 14, fiber: 2, sodium: 580 }
  },
  {
    id: 'r2',
    name: '宫保鸡丁',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r2/400/320',
    ingredients: ['i19', 'i5', 'i6', 'i32', 'i33', 'i35', 'i54', 'i39', 'i42', 'i16'],
    steps: [
      '鸡胸肉切丁，加盐、料酒、淀粉腌制15分钟',
      '调碗汁：酱油、醋、糖、淀粉水混合均匀',
      '花生米炒熟备用，干辣椒剪段',
      '锅中油烧至七成热，放入鸡丁滑散变色盛出',
      '锅留底油，爆香干辣椒和花椒，下葱姜蒜',
      '倒入鸡丁和碗汁快速翻炒，撒花生米出锅'
    ],
    nutrition: { calories: 320, protein: 28, fat: 18, carbs: 16, fiber: 3, sodium: 720 }
  },
  {
    id: 'r3',
    name: '红烧肉',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r3/400/320',
    ingredients: ['i20', 'i16', 'i17', 'i33', 'i35', 'i54', 'i44', 'i18'],
    steps: [
      '五花肉切成3cm方块，冷水下锅焯水去血沫',
      '锅中少许油加糖炒出焦色，放入肉块翻炒上色',
      '加入葱段、姜片、八角、料酒',
      '加入开水没过肉块，大火烧开转小火炖1小时',
      '大火收汁至浓稠，汤汁包裹肉块即可'
    ],
    nutrition: { calories: 520, protein: 22, fat: 42, carbs: 12, fiber: 0, sodium: 680 }
  },
  {
    id: 'r4',
    name: '麻婆豆腐',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r4/400/320',
    ingredients: ['i12', 'i20', 'i37', 'i33', 'i16', 'i17', 'i43', 'i18'],
    steps: [
      '豆腐切2cm方块，入淡盐水中焯一下',
      '猪肉剁成末，锅中加油炒散变色',
      '加入豆瓣酱、辣椒粉炒出红油',
      '加入适量清水烧开，放入豆腐小火炖5分钟',
      '用水淀粉勾芡，撒上花椒粉和葱花'
    ],
    nutrition: { calories: 240, protein: 16, fat: 15, carbs: 10, fiber: 2, sodium: 820 }
  },
  {
    id: 'r5',
    name: '鱼香肉丝',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r5/400/320',
    ingredients: ['i20', 'i5', 'i6', 'i3', 'i33', 'i34', 'i54', 'i16', 'i17', 'i37'],
    steps: [
      '猪肉切丝，加盐、料酒、淀粉抓匀腌制',
      '木耳泡发切丝，胡萝卜、青椒切丝',
      '调鱼香汁：酱油、醋、糖、料酒、淀粉水',
      '热锅凉油滑散肉丝盛出',
      '爆香葱姜蒜和泡椒，下蔬菜丝翻炒',
      '倒回肉丝，淋入鱼香汁快速翻炒均匀'
    ],
    nutrition: { calories: 280, protein: 18, fat: 14, carbs: 20, fiber: 3, sodium: 650 }
  },
  {
    id: 'r6',
    name: '意大利肉酱面',
    cuisine: '西餐',
    cover: 'https://picsum.photos/seed/r6/400/320',
    ingredients: ['i46', 'i20', 'i1', 'i5', 'i16', 'i17', 'i38', 'i40', 'i42', 'i33'],
    steps: [
      '洋葱、大蒜切末，西红柿切丁',
      '橄榄油热锅，炒香洋葱末至透明',
      '加入猪肉末翻炒至变色，加番茄丁',
      '倒入番茄酱，小火炖煮30分钟至浓稠',
      '加盐和黑胡椒调味',
      '意面煮至al dente，拌上肉酱撒上芝士碎'
    ],
    nutrition: { calories: 450, protein: 22, fat: 16, carbs: 52, fiber: 4, sodium: 580 }
  },
  {
    id: 'r7',
    name: '法式黄油煎鸡排',
    cuisine: '西餐',
    cover: 'https://picsum.photos/seed/r7/400/320',
    ingredients: ['i19', 'i41', 'i16', 'i42', 'i48', 'i49', 'i13'],
    steps: [
      '鸡胸肉对剖成薄片，用肉锤敲至均匀厚度',
      '加盐和黑胡椒腌制10分钟，裹上面粉',
      '黄油中火融化，放入鸡排煎至金黄翻面',
      '加入蒜瓣和百里香增香，煎至熟透',
      '西兰花焯水摆盘，挤柠檬汁提味'
    ],
    nutrition: { calories: 380, protein: 35, fat: 20, carbs: 8, fiber: 3, sodium: 420 }
  },
  {
    id: 'r8',
    name: '凯撒沙拉',
    cuisine: '西餐',
    cover: 'https://picsum.photos/seed/r8/400/320',
    ingredients: ['i8', 'i50', 'i48', 'i41', 'i17', 'i34', 'i40', 'i42'],
    steps: [
      '制作凯撒酱：蛋黄、蒜末、柠檬汁搅拌',
      '缓慢加入橄榄油乳化，加芝士碎和黑胡椒',
      '面包丁裹黄油烤至金黄酥脆',
      '生菜撕成大块，洗净沥干',
      '生菜淋上凯撒酱拌匀，撒上面包丁和芝士粉'
    ],
    nutrition: { calories: 280, protein: 14, fat: 22, carbs: 10, fiber: 4, sodium: 520 }
  },
  {
    id: 'r9',
    name: '日式味噌拉面',
    cuisine: '日料',
    cover: 'https://picsum.photos/seed/r9/400/320',
    ingredients: ['i46', 'i19', 'i48', 'i9', 'i11', 'i17', 'i33', 'i16', 'i35'],
    steps: [
      '鸡骨熬高汤2小时，过滤清汤',
      '味噌加少许高汤化开，倒入汤中搅匀',
      '叉烧肉用酱油、味醂腌制后煎至表面焦香',
      '溏心蛋煮6.5分钟，冰水浸泡后剥壳',
      '面条煮熟盛碗，浇入味噌汤',
      '摆上叉烧、溏心蛋、葱丝、香菇、白菜'
    ],
    nutrition: { calories: 520, protein: 28, fat: 18, carbs: 58, fiber: 4, sodium: 1100 }
  },
  {
    id: 'r10',
    name: '日式照烧鸡腿',
    cuisine: '日料',
    cover: 'https://picsum.photos/seed/r10/400/320',
    ingredients: ['i19', 'i33', 'i54', 'i35', 'i16', 'i17', 'i45', 'i8'],
    steps: [
      '鸡腿去骨，皮面用叉子戳几下方便入味',
      '酱油、糖、料酒调成照烧汁',
      '平底锅不放油，鸡皮朝下煎至金黄酥脆',
      '翻面继续煎，倒入照烧汁',
      '中小火收汁，不断翻面使酱汁均匀包裹',
      '切块装盘，配米饭和焯水菠菜'
    ],
    nutrition: { calories: 420, protein: 32, fat: 20, carbs: 28, fiber: 2, sodium: 680 }
  },
  {
    id: 'r11',
    name: '三文鱼刺身饭',
    cuisine: '日料',
    cover: 'https://picsum.photos/seed/r11/400/320',
    ingredients: ['i27', 'i45', 'i33', 'i39', 'i17', 'i16', 'i34', 'i49'],
    steps: [
      '寿司米淘洗后浸泡30分钟，按1:1加水煮饭',
      '煮好的米饭拌入寿司醋，扇凉至体温温度',
      '三文鱼切成0.5cm厚片',
      '碗中盛入寿司饭，铺上三文鱼片',
      '点缀芥末和腌姜片，淋少许酱油'
    ],
    nutrition: { calories: 480, protein: 30, fat: 14, carbs: 58, fiber: 1, sodium: 420 }
  },
  {
    id: 'r12',
    name: '酸辣土豆丝',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r12/400/320',
    ingredients: ['i4', 'i6', 'i34', 'i33', 'i16', 'i17', 'i43', 'i32'],
    steps: [
      '土豆去皮切细丝，清水浸泡去淀粉',
      '青椒切丝备用',
      '热锅凉油，爆香花椒后捞出',
      '下干辣椒和蒜末爆香',
      '倒入土豆丝大火快炒，加醋和盐调味',
      '加入青椒丝翻炒均匀出锅'
    ],
    nutrition: { calories: 150, protein: 4, fat: 6, carbs: 22, fiber: 3, sodium: 380 }
  },
  {
    id: 'r13',
    name: '蒜蓉蒸虾',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r13/400/320',
    ingredients: ['i26', 'i17', 'i33', 'i39', 'i18', 'i32'],
    steps: [
      '鲜虾去虾线，从背部剖开不切断',
      '蒜蓉用油小火炒至金黄出香',
      '加入少许酱油和盐调味蒜蓉',
      '将蒜蓉铺在虾肉上',
      '水开后上锅蒸6分钟',
      '出锅淋上热油和蒸鱼豉油，撒葱花'
    ],
    nutrition: { calories: 160, protein: 24, fat: 5, carbs: 4, fiber: 0, sodium: 520 }
  },
  {
    id: 'r14',
    name: '牛肉咖喱饭',
    cuisine: '西餐',
    cover: 'https://picsum.photos/seed/r14/400/320',
    ingredients: ['i21', 'i4', 'i3', 'i5', 'i17', 'i40', 'i45', 'i33'],
    steps: [
      '牛肉切块焯水，胡萝卜土豆切块',
      '洋葱切丁，橄榄油炒香洋葱至透明',
      '加入牛肉块翻炒上色',
      '加水没过食材，大火烧开转小火炖1小时',
      '加入胡萝卜和土豆继续炖20分钟',
      '放入咖喱块搅拌融化，收汁至浓稠，配米饭食用'
    ],
    nutrition: { calories: 560, protein: 32, fat: 22, carbs: 52, fiber: 5, sodium: 620 }
  },
  {
    id: 'r15',
    name: '清蒸鲈鱼',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r15/400/320',
    ingredients: ['i28', 'i17', 'i18', 'i16', 'i33', 'i39', 'i32'],
    steps: [
      '鲈鱼处理干净，鱼身两面划几刀',
      '鱼身抹少许盐和料酒，塞入姜片葱段',
      '水开后上锅大火蒸8分钟',
      '倒掉蒸出的汤汁，去掉葱姜',
      '铺上新鲜葱丝姜丝，淋上蒸鱼豉油',
      '烧一勺热油浇在鱼身上激出香味'
    ],
    nutrition: { calories: 200, protein: 30, fat: 8, carbs: 2, fiber: 0, sodium: 480 }
  },
  {
    id: 'r16',
    name: '奶油蘑菇意面',
    cuisine: '西餐',
    cover: 'https://picsum.photos/seed/r16/400/320',
    ingredients: ['i46', 'i11', 'i17', 'i41', 'i51', 'i49', 'i42', 'i32'],
    steps: [
      '意面加盐煮至al dente，留半杯面汤',
      '蘑菇切片，蒜切末',
      '黄油融化炒香蒜末，加入蘑菇片炒至出水收干',
      '倒入淡奶油小火煮至微稠',
      '加入煮好的意面和面汤翻拌均匀',
      '加盐和黑胡椒调味，撒上芝士粉'
    ],
    nutrition: { calories: 520, protein: 16, fat: 28, carbs: 54, fiber: 3, sodium: 460 }
  },
  {
    id: 'r17',
    name: '日式天妇罗',
    cuisine: '日料',
    cover: 'https://picsum.photos/seed/r17/400/320',
    ingredients: ['i26', 'i3', 'i11', 'i7', 'i47', 'i48', 'i32', 'i33'],
    steps: [
      '胡萝卜切薄片，茄子切半圆片，香菇刻花',
      '冰水加蛋黄搅匀，筛入面粉轻轻拌至粗糙状态',
      '油温升至170度，蔬菜裹薄面糊入锅炸至金黄',
      '虾仁裹面糊炸至酥脆',
      '天妇罗蘸汁：出汁、味醂、酱油混合煮开',
      '摆盘配白萝卜泥和天妇罗蘸汁'
    ],
    nutrition: { calories: 380, protein: 18, fat: 20, carbs: 32, fiber: 4, sodium: 560 }
  },
  {
    id: 'r18',
    name: '糖醋里脊',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r18/400/320',
    ingredients: ['i20', 'i33', 'i34', 'i54', 'i47', 'i16', 'i17', 'i32'],
    steps: [
      '猪里脊切条，加盐和料酒腌制10分钟',
      '淀粉加水调成浓糊，裹在里脊条上',
      '油温六成热下锅炸至定型捞出，复炸至酥脆',
      '调糖醋汁：番茄酱、糖、醋、少许水',
      '锅留底油，倒入糖醋汁熬至冒泡',
      '放入炸好的里脊快速翻裹均匀出锅'
    ],
    nutrition: { calories: 420, protein: 22, fat: 18, carbs: 42, fiber: 1, sodium: 580 }
  },
  {
    id: 'r19',
    name: '芝士焗饭',
    cuisine: '西餐',
    cover: 'https://picsum.photos/seed/r19/400/320',
    ingredients: ['i45', 'i19', 'i1', 'i5', 'i50', 'i38', 'i33', 'i16'],
    steps: [
      '鸡胸肉切丁，洋葱西红柿切丁',
      '炒锅加油炒鸡肉丁至变色',
      '加入洋葱炒香，再加西红柿炒出汁',
      '加入番茄酱和盐调味，与米饭拌匀',
      '盛入烤盘，铺上厚厚一层芝士',
      '烤箱200度烤15分钟至芝士融化焦黄'
    ],
    nutrition: { calories: 480, protein: 26, fat: 22, carbs: 44, fiber: 3, sodium: 640 }
  },
  {
    id: 'r20',
    name: '日式亲子丼',
    cuisine: '日料',
    cover: 'https://picsum.photos/seed/r20/400/320',
    ingredients: ['i19', 'i48', 'i5', 'i33', 'i35', 'i54', 'i45'],
    steps: [
      '洋葱切丝，鸡肉切小块',
      '出汁加酱油、味醂、糖煮开',
      '加入洋葱丝煮软',
      '放入鸡肉块煮至变色',
      '打散鸡蛋淋在鸡肉上，盖盖焖30秒',
      '蛋液半熟时关火，浇在热米饭上'
    ],
    nutrition: { calories: 440, protein: 28, fat: 16, carbs: 42, fiber: 2, sodium: 580 }
  },
  {
    id: 'r21',
    name: '回锅肉',
    cuisine: '中餐',
    cover: 'https://picsum.photos/seed/r21/400/320',
    ingredients: ['i20', 'i9', 'i37', 'i33', 'i54', 'i16', 'i17', 'i18'],
    steps: [
      '五花肉整块煮至八成熟，切薄片',
      '白菜切块，蒜苗切段',
      '锅不放油，下五花肉片煸炒至出油微卷',
      '推至锅边，下豆瓣酱炒出红油',
      '加入白菜翻炒，加酱油和糖调味',
      '撒蒜苗段快速翻炒出锅'
    ],
    nutrition: { calories: 460, protein: 20, fat: 36, carbs: 12, fiber: 2, sodium: 740 }
  },
  {
    id: 'r22',
    name: '蒜香黄油虾',
    cuisine: '西餐',
    cover: 'https://picsum.photos/seed/r22/400/320',
    ingredients: ['i26', 'i41', 'i17', 'i40', 'i42', 'i34', 'i32'],
    steps: [
      '大虾去壳留尾，开背去虾线',
      '盐和黑胡椒腌制5分钟',
      '黄油和橄榄油中火融化',
      '加入蒜末炒香至金黄',
      '放入大虾煎2分钟翻面再煎1分钟',
      '挤柠檬汁翻炒，撒欧芹碎出锅'
    ],
    nutrition: { calories: 240, protein: 26, fat: 14, carbs: 4, fiber: 0, sodium: 440 }
  },
];

const substitutions: Record<string, Array<{
  substitute: string;
  reason: string;
  diffPercent: string;
}>> = {
  'i1': [
    { substitute: '番茄酱', reason: '提供类似酸甜风味，适合无法获得新鲜番茄时使用', diffPercent: '热量+15%' },
    { substitute: '红甜椒', reason: '颜色和口感接近，适合配色和增加脆感', diffPercent: '热量-40%' },
    { substitute: '南瓜泥', reason: '天然甜味和浓稠质地，适合酱汁基底', diffPercent: '热量+20%' },
  ],
  'i4': [
    { substitute: '红薯', reason: '质地相似，口感更甜糯，适合炖煮', diffPercent: '热量+10%' },
    { substitute: '芋头', reason: '淀粉含量相近，口感绵密', diffPercent: '热量+5%' },
    { substitute: '山药', reason: '口感脆嫩，营养价值更高', diffPercent: '热量-15%' },
  ],
  'i19': [
    { substitute: '火鸡胸肉', reason: '蛋白质含量更高，脂肪更低', diffPercent: '热量-25%' },
    { substitute: '豆腐', reason: '植物蛋白替代，适合素食者', diffPercent: '热量-50%' },
    { substitute: '虾仁', reason: '低脂高蛋白，口感鲜嫩', diffPercent: '热量-30%' },
  ],
  'i20': [
    { substitute: '鸡肉', reason: '脂肪含量更低，口感嫩滑', diffPercent: '热量-40%' },
    { substitute: '牛肉', reason: '铁含量更高，蛋白质更丰富', diffPercent: '热量-10%' },
    { substitute: '素肉', reason: '植物蛋白替代，减少饱和脂肪', diffPercent: '热量-55%' },
  ],
  'i21': [
    { substitute: '鹿肉', reason: '更瘦的红肉选择，蛋白质含量高', diffPercent: '热量-20%' },
    { substitute: '猪肉里脊', reason: '口感接近，脂肪略低', diffPercent: '热量-5%' },
    { substitute: '素牛肉', reason: '植物基替代品，降低胆固醇摄入', diffPercent: '热量-45%' },
  ],
  'i41': [
    { substitute: '橄榄油', reason: '富含不饱和脂肪酸，更健康的选择', diffPercent: '热量-5%' },
    { substitute: '椰子油', reason: '耐高温烹饪，独特椰香风味', diffPercent: '热量+5%' },
    { substitute: '牛油果泥', reason: '天然脂肪来源，口感绵密，富含纤维', diffPercent: '热量-20%' },
  ],
  'i40': [
    { substitute: '黄油', reason: '风味更浓郁，适合煎炒烘焙', diffPercent: '热量+10%' },
    { substitute: '芝麻油', reason: '独特香味，适合亚洲菜式', diffPercent: '热量+5%' },
    { substitute: '菜籽油', reason: '中性口味，烟点高，适合多种烹饪方式', diffPercent: '热量-10%' },
  ],
  'i33': [
    { substitute: '椰子酱油', reason: '无大豆无麸质，氨基酸含量丰富', diffPercent: '热量-15%' },
    { substitute: '鱼露', reason: '鲜味更浓，用量可减半', diffPercent: '钠+30%' },
    { substitute: '海盐+香菇粉', reason: '天然鲜味来源，减少加工添加', diffPercent: '热量-20%' },
  ],
  'i48': [
    { substitute: '亚麻籽蛋', reason: '纯素替代，亚麻籽粉加热水搅拌', diffPercent: '热量-30%' },
    { substitute: '嫩豆腐', reason: '口感嫩滑，蛋白质来源，适合烘焙', diffPercent: '热量-40%' },
    { substitute: '香蕉泥', reason: '天然甜味和粘合性，适合烘焙甜品', diffPercent: '热量+10%' },
  ],
  'i49': [
    { substitute: '燕麦奶', reason: '植物基替代，质地顺滑适合咖啡和烘焙', diffPercent: '热量-20%' },
    { substitute: '椰奶', reason: '浓郁口感和独特风味，适合咖喱和甜品', diffPercent: '热量+30%' },
    { substitute: '豆浆', reason: '蛋白质含量接近，价格实惠', diffPercent: '热量-35%' },
  ],
  'i50': [
    { substitute: '营养酵母', reason: '类似芝士风味，富含B族维生素', diffPercent: '热量-50%' },
    { substitute: '腰果酱', reason: '浓郁坚果风味和奶油质地', diffPercent: '热量-10%' },
    { substitute: '豆腐乳', reason: '发酵风味独特，可提供咸鲜口感', diffPercent: '热量-40%' },
  ],
  'i26': [
    { substitute: '扇贝', reason: '口感嫩滑，蛋白质含量相当', diffPercent: '热量-15%' },
    { substitute: '蟹棒', reason: '价格更亲民，海鲜风味接近', diffPercent: '热量-25%' },
    { substitute: '素虾', reason: '植物基替代，造型逼真', diffPercent: '热量-35%' },
  ],
  'i12': [
    { substitute: '鸡蛋', reason: '优质蛋白来源，口感嫩滑', diffPercent: '热量+10%' },
    { substitute: '面筋', reason: '口感弹牙有嚼劲，吸味能力强', diffPercent: '热量+20%' },
    { substitute: '杏鲍菇', reason: '口感鲜嫩有肉感，低热量高纤维', diffPercent: '热量-60%' },
  ],
  'i27': [
    { substitute: '鳕鱼', reason: '口感细嫩，适合多种烹饪方式', diffPercent: '热量-25%' },
    { substitute: '虹鳟鱼', reason: '颜色和口感接近三文鱼', diffPercent: '热量-20%' },
    { substitute: '素三文鱼', reason: '植物基替代，富含Omega-3', diffPercent: '热量-40%' },
  ],
  'i46': [
    { substitute: '米粉', reason: '无麸质替代，口感爽滑', diffPercent: '热量-15%' },
    { substitute: '荞麦面', reason: '营养价值更高，富含膳食纤维', diffPercent: '热量-10%' },
    { substitute: '粉丝', reason: '口感透明爽滑，适合汤面和凉拌', diffPercent: '热量-20%' },
  ],
  'i45': [
    { substitute: '藜麦', reason: '完全蛋白质来源，营养更全面', diffPercent: '热量-5%' },
    { substitute: '糙米', reason: '保留更多膳食纤维和维生素B', diffPercent: '热量+10%' },
    { substitute: '花菜碎', reason: '极低碳水替代，适合减脂人群', diffPercent: '热量-80%' },
  ],
  'i5': [
    { substitute: '韭葱', reason: '风味温和类似，口感柔嫩', diffPercent: '热量-10%' },
    { substitute: '红葱头', reason: '风味更浓郁，用量可减半', diffPercent: '热量+5%' },
    { substitute: '小葱', reason: '风味清新，适合凉拌和炒菜', diffPercent: '热量-30%' },
  ],
  'i16': [
    { substitute: '姜粉', reason: '使用方便，浓度更高用量减半', diffPercent: '热量+10%' },
    { substitute: '南姜', reason: '风味独特，适合东南亚菜式', diffPercent: '热量+5%' },
    { substitute: '柠檬草', reason: '清香提味，适合泰式和越式菜', diffPercent: '热量-20%' },
  ],
  'i17': [
    { substitute: '蒜粉', reason: '使用方便，保存时间长', diffPercent: '热量+15%' },
    { substitute: '蒜蓉酱', reason: '风味浓郁，便于快速烹饪', diffPercent: '热量+10%' },
    { substitute: '洋葱粉', reason: '温和蒜香，适合对大蒜敏感者', diffPercent: '热量+5%' },
  ],
  'i34': [
    { substitute: '柠檬汁', reason: '清爽酸味，天然无添加', diffPercent: '热量-60%' },
    { substitute: '酸梅汁', reason: '独特酸甜风味，开胃解腻', diffPercent: '热量-30%' },
    { substitute: '酸奶', reason: '温和酸味，同时增加奶香', diffPercent: '热量+20%' },
  ],
  'i37': [
    { substitute: '新鲜辣椒', reason: '天然辣椒风味，可控辣度', diffPercent: '热量-40%' },
    { substitute: '辣椒粉', reason: '使用方便，辣度可选', diffPercent: '热量-20%' },
    { substitute: '甜椒酱', reason: '辣度降低，甜味增加', diffPercent: '热量-15%' },
  ],
  'i51': [
    { substitute: '椰浆', reason: '植物基替代，口感浓郁', diffPercent: '热量-10%' },
    { substitute: '豆浆+玉米淀粉', reason: '低脂替代，质地接近', diffPercent: '热量-45%' },
    { substitute: '希腊酸奶', reason: '蛋白质更高，质地浓稠', diffPercent: '热量-30%' },
  ],
  'i54': [
    { substitute: '蜂蜜', reason: '天然甜味剂，含微量元素', diffPercent: '热量+5%' },
    { substitute: '枫糖浆', reason: '独特焦糖风味，适合西式甜品', diffPercent: '热量-10%' },
    { substitute: '赤藓糖醇', reason: '零热量代糖，适合控糖人群', diffPercent: '热量-100%' },
  ],
  'i3': [
    { substitute: '南瓜', reason: '颜色和甜味接近，质地更软', diffPercent: '热量+15%' },
    { substitute: '红薯', reason: '更甜更软糯，适合炖煮和烤制', diffPercent: '热量+25%' },
    { substitute: '白萝卜', reason: '口感清脆，适合炖汤', diffPercent: '热量-50%' },
  ],
  'i6': [
    { substitute: '彩椒', reason: '颜色更丰富，甜度更高', diffPercent: '热量+10%' },
    { substitute: '西葫芦', reason: '口感清爽，适合炒菜', diffPercent: '热量-30%' },
    { substitute: '豆角', reason: '口感脆嫩，蛋白质含量更高', diffPercent: '热量-10%' },
  ],
  'i9': [
    { substitute: '娃娃菜', reason: '口感更嫩更甜，适合清炒', diffPercent: '热量-20%' },
    { substitute: '生菜', reason: '清脆爽口，适合凉拌', diffPercent: '热量-50%' },
    { substitute: '甘蓝', reason: '营养更丰富，适合炖煮', diffPercent: '热量+5%' },
  ],
  'i8': [
    { substitute: '羽衣甘蓝', reason: '超级食物，营养价值极高', diffPercent: '热量-30%' },
    { substitute: '油菜', reason: '口感嫩滑，适合炒菜和做汤', diffPercent: '热量-20%' },
    { substitute: '芥蓝', reason: '口感脆嫩，风味独特', diffPercent: '热量-10%' },
  ],
  'i11': [
    { substitute: '口蘑', reason: '味道温和，口感嫩滑', diffPercent: '热量-15%' },
    { substitute: '杏鲍菇', reason: '口感有肉感，适合煎烤', diffPercent: '热量-25%' },
    { substitute: '干香菇', reason: '风味更浓郁，适合炖汤', diffPercent: '热量+20%' },
  ],
  'i13': [
    { substitute: '花菜', reason: '口感和外观相近，营养均衡', diffPercent: '热量-20%' },
    { substitute: '芦笋', reason: '口感脆嫩，营养价值高', diffPercent: '热量-30%' },
    { substitute: '四季豆', reason: '口感爽脆，适合清炒', diffPercent: '热量-15%' },
  ],
};

app.get('/api/ingredients', (_req, res) => {
  res.json(ingredients);
});

app.post('/api/recipes/search', (req, res) => {
  const { ingredientIds } = req.body as { ingredientIds: string[] };
  if (!ingredientIds || ingredientIds.length === 0) {
    res.json([]);
    return;
  }
  const results = recipes
    .map(recipe => {
      const matched = recipe.ingredients.filter(id => ingredientIds.includes(id));
      const missing = recipe.ingredients.filter(id => !ingredientIds.includes(id));
      return {
        ...recipe,
        matchedIngredients: matched,
        missingIngredients: missing,
        matchRate: matched.length / recipe.ingredients.length,
      };
    })
    .filter(r => r.matchedIngredients.length > 0)
    .sort((a, b) => b.matchRate - a.matchRate || b.matchedIngredients.length - a.matchedIngredients.length);
  res.json(results);
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json(recipe);
});

app.get('/api/substitutions/:ingredientId', (req, res) => {
  const subs = substitutions[req.params.ingredientId];
  if (!subs) {
    res.json([]);
    return;
  }
  res.json(subs);
});

app.get('/api/favorites', (_req, res) => {
  res.json({ ok: true });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
