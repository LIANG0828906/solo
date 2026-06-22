import type { Recipe } from '../types/recipe';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: '红烧肉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20braised%20pork%20belly%20hong%20shao%20rou%20delicious%20food%20photography&image_size=square',
    description: '经典中式红烧肉，肥而不腻，入口即化',
    cuisine: 'chinese',
    difficulty: 'medium',
    tags: ['家常', '肉类', '下饭'],
    rating: 4.5,
    cookTime: 90,
    ingredients: ['五花肉 500g', '冰糖 30g', '生抽 2勺', '老抽 1勺', '料酒 2勺', '姜片 5片', '八角 2个', '桂皮 1小块'],
    steps: ['五花肉切块，冷水下锅焯水去血沫', '锅中放少许油，加入冰糖小火炒糖色', '放入五花肉翻炒上色', '加入生抽、老抽、料酒调味', '加入开水没过肉块，放入姜片、八角、桂皮', '大火烧开后转小火炖60分钟', '大火收汁即可出锅'],
    comments: [
      { id: 'c1', text: '非常好吃，按照菜谱做很成功！', timestamp: Date.now() - 86400000 }
    ]
  },
  {
    id: '2',
    name: '意大利面',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=italian%20spaghetti%20bolognese%20pasta%20delicious%20food%20photography&image_size=square',
    description: '经典意式番茄肉酱面，香浓可口',
    cuisine: 'western',
    difficulty: 'easy',
    tags: ['意面', '西式', '快手'],
    rating: 4.2,
    cookTime: 30,
    ingredients: ['意大利面 200g', '牛肉馅 200g', '番茄 3个', '洋葱 半个', '大蒜 3瓣', '番茄酱 2勺', '橄榄油 适量', '盐 适量', '黑胡椒 适量'],
    steps: ['锅中烧水加盐，下意大利面煮至八分熟', '洋葱、大蒜切碎，番茄切丁', '平底锅加橄榄油，炒香洋葱和大蒜', '加入牛肉馅炒散', '加入番茄丁和番茄酱，小火熬煮10分钟', '加入煮好的意面翻炒均匀', '撒上黑胡椒和帕玛森芝士即可'],
    comments: []
  },
  {
    id: '3',
    name: '寿司拼盘',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20sushi%20platter%20salmon%20tuna%20delicious%20food%20photography&image_size=square',
    description: '新鲜三文鱼寿司和金枪鱼寿司，日料经典',
    cuisine: 'japanese',
    difficulty: 'hard',
    tags: ['寿司', '日料', '海鲜'],
    rating: 4.8,
    cookTime: 60,
    ingredients: ['寿司米 300g', '三文鱼 200g', '金枪鱼 200g', '寿司醋 3勺', '海苔 4片', '黄瓜 1根', '牛油果 1个', '芥末 适量', '酱油 适量'],
    steps: ['寿司米洗净，浸泡30分钟后蒸熟', '趁热拌入寿司醋，扇凉备用', '三文鱼、金枪鱼切薄片', '黄瓜、牛油果切条', '海苔片上铺米饭，放入配料卷成寿司卷', '握寿司：取适量饭捏成椭圆形，放上鱼片', '摆盘，配上芥末和酱油'],
    comments: [
      { id: 'c2', text: '寿司饭的比例很重要，这个菜谱很详细', timestamp: Date.now() - 172800000 }
    ]
  },
  {
    id: '4',
    name: '宫保鸡丁',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kung%20pao%20chicken%20chinese%20food%20delicious%20food%20photography&image_size=square',
    description: '川菜经典，麻辣鲜香，鸡肉嫩滑',
    cuisine: 'chinese',
    difficulty: 'medium',
    tags: ['川菜', '鸡肉', '下饭'],
    rating: 4.6,
    cookTime: 25,
    ingredients: ['鸡胸肉 300g', '花生米 50g', '干辣椒 10个', '花椒 1勺', '大葱 2根', '生姜 3片', '大蒜 3瓣', '生抽 2勺', '醋 1勺', '糖 1勺', '淀粉 适量'],
    steps: ['鸡胸肉切丁，加盐、料酒、淀粉腌制15分钟', '调碗汁：生抽、醋、糖、淀粉、少许水', '花生米炸至金黄酥脆', '锅中油热，爆香花椒、干辣椒', '放入鸡丁快速翻炒至变色', '加入葱姜蒜炒香', '倒入碗汁翻炒均匀', '最后加入花生米翻匀出锅'],
    comments: []
  },
  {
    id: '5',
    name: '凯撒沙拉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=caesar%20salad%20with%20croutons%20parmesan%20healthy%20food%20photography&image_size=square',
    description: '清爽健康的经典沙拉，配酥脆面包丁',
    cuisine: 'western',
    difficulty: 'easy',
    tags: ['沙拉', '轻食', '健康'],
    rating: 4.0,
    cookTime: 15,
    ingredients: ['生菜 1颗', '面包丁 50g', '帕玛森芝士 30g', '凯撒酱 适量', '橄榄油 适量', '盐 适量', '黑胡椒 适量', '柠檬 半个'],
    steps: ['生菜洗净撕成小块，沥干水分', '面包切丁，平底锅加橄榄油煎至金黄酥脆', '生菜放入大碗中', '淋上凯撒酱拌匀', '撒上面包丁和帕玛森芝士碎', '挤上柠檬汁，撒黑胡椒调味', '立即享用口感最佳'],
    comments: []
  },
  {
    id: '6',
    name: '味噌汤',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20miso%20soup%20with%20tofu%20wakame%20delicious%20food%20photography&image_size=square',
    description: '日式传统味噌汤，温暖滋补',
    cuisine: 'japanese',
    difficulty: 'easy',
    tags: ['汤品', '日料', '快手'],
    rating: 4.3,
    cookTime: 20,
    ingredients: ['味噌 3勺', '豆腐 1块', '裙带菜 10g', '葱花 适量', '昆布 1小块', '柴鱼片 10g', '水 500ml'],
    steps: ['裙带菜用温水泡发', '昆布加水浸泡30分钟，小火煮开', '捞出昆布，加入柴鱼片，煮2分钟后过滤', '豆腐切小块放入高汤中', '转小火，将味噌用少量汤汁化开后加入', '加入泡发好的裙带菜', '出锅前撒上葱花即可'],
    comments: []
  },
  {
    id: '7',
    name: '麻婆豆腐',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mapo%20tofu%20chinese%20sichuan%20spicy%20delicious%20food%20photography&image_size=square',
    description: '四川名菜，麻辣鲜香，豆腐嫩滑',
    cuisine: 'chinese',
    difficulty: 'easy',
    tags: ['川菜', '豆腐', '下饭'],
    rating: 4.4,
    cookTime: 20,
    ingredients: ['嫩豆腐 1块', '牛肉馅 100g', '郫县豆瓣酱 2勺', '花椒粉 1勺', '蒜末 1勺', '姜末 半勺', '葱花 适量', '生抽 1勺', '淀粉 适量'],
    steps: ['豆腐切小块，开水焯烫后捞出备用', '锅中油热，炒香牛肉馅', '加入豆瓣酱炒出红油', '加入蒜末、姜末炒香', '加入适量水烧开，放入豆腐', '小火煮5分钟让豆腐入味', '水淀粉勾芡，撒花椒粉和葱花'],
    comments: []
  },
  {
    id: '8',
    name: '牛排',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grilled%20ribeye%20steak%20with%20vegetables%20fine%20dining%20food%20photography&image_size=square',
    description: '香煎西冷牛排，外焦里嫩',
    cuisine: 'western',
    difficulty: 'medium',
    tags: ['牛排', '西式', '正餐'],
    rating: 4.7,
    cookTime: 25,
    ingredients: ['西冷牛排 250g', '黄油 20g', '大蒜 3瓣', '迷迭香 2枝', '盐 适量', '黑胡椒 适量', '橄榄油 适量', '配菜 适量'],
    steps: ['牛排提前取出室温回温，用厨房纸吸干水分', '两面撒盐和黑胡椒腌制10分钟', '平底锅加橄榄油，大火烧热', '放入牛排，每面煎2-3分钟', '加入黄油、大蒜、迷迭香', '将黄油不断淋在牛排上', '取出醒肉5分钟后切片装盘'],
    comments: [
      { id: 'c3', text: '第一次做牛排就成功了，火候掌握得很好', timestamp: Date.now() - 259200000 }
    ]
  },
  {
    id: '9',
    name: '天妇罗',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20tempura%20shrimp%20vegetables%20delicious%20food%20photography&image_size=square',
    description: '酥脆日式天妇罗，虾和时蔬',
    cuisine: 'japanese',
    difficulty: 'medium',
    tags: ['炸物', '日料', '海鲜'],
    rating: 4.5,
    cookTime: 30,
    ingredients: ['大虾 6只', '南瓜 100g', '茄子 1根', '青椒 2个', '低筋面粉 100g', '鸡蛋 1个', '冰水 100ml', '天妇罗蘸酱 适量', '白萝卜泥 适量'],
    steps: ['大虾去壳留尾，开背去虾线', '蔬菜切适当大小', '低筋面粉过筛，加入冰水和蛋黄调成面糊', '油锅烧热至170度', '食材沾上面糊，放入油锅炸至金黄', '捞出沥油，摆盘', '配天妇罗蘸酱和白萝卜泥食用'],
    comments: []
  },
  {
    id: '10',
    name: '蛋炒饭',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20egg%20fried%20rice%20delicious%20food%20photography&image_size=square',
    description: '粒粒分明的黄金蛋炒饭',
    cuisine: 'chinese',
    difficulty: 'easy',
    tags: ['主食', '快手', '家常'],
    rating: 4.1,
    cookTime: 10,
    ingredients: ['隔夜米饭 2碗', '鸡蛋 2个', '葱花 适量', '盐 适量', '生抽 半勺', '油 适量'],
    steps: ['鸡蛋打散，加少许盐', '米饭提前拨散', '锅中油热，倒入蛋液', '蛋液半凝固时加入米饭', '大火快速翻炒，让每粒米饭都裹上蛋液', '加少许生抽和盐调味', '最后撒上葱花翻匀出锅'],
    comments: []
  },
  {
    id: '11',
    name: '提拉米苏',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=italian%20tiramisu%20dessert%20delicious%20food%20photography&image_size=square',
    description: '意式经典甜品，浓郁咖啡香',
    cuisine: 'western',
    difficulty: 'hard',
    tags: ['甜点', '意式', '下午茶'],
    rating: 4.9,
    cookTime: 40,
    ingredients: ['马斯卡彭奶酪 250g', '手指饼干 200g', '浓缩咖啡 200ml', '蛋黄 3个', '细砂糖 80g', '淡奶油 200ml', '可可粉 适量', '朗姆酒 1勺'],
    steps: ['蛋黄加糖隔水加热打发至颜色变浅', '马斯卡彭奶酪打匀', '淡奶油打发至七分发', '将蛋黄糊与奶酪混合，再拌入奶油', '咖啡加朗姆酒调匀', '手指饼干快速沾取咖啡，铺一层', '抹一层奶酪糊，重复铺层', '冷藏4小时以上，食用前筛可可粉'],
    comments: [
      { id: 'c4', text: '太棒了！口感丝滑，咖啡香浓', timestamp: Date.now() - 432000000 }
    ]
  },
  {
    id: '12',
    name: '日式咖喱饭',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20curry%20rice%20katsu%20delicious%20food%20photography&image_size=square',
    description: '浓郁日式咖喱，配香酥猪排',
    cuisine: 'japanese',
    difficulty: 'medium',
    tags: ['咖喱', '日料', '主食'],
    rating: 4.6,
    cookTime: 50,
    ingredients: ['猪排 2块', '咖喱块 1盒', '土豆 2个', '胡萝卜 1根', '洋葱 半个', '米饭 2碗', '面包糠 适量', '鸡蛋 1个', '面粉 适量'],
    steps: ['土豆、胡萝卜切块，洋葱切片', '锅中炒香洋葱，加入土豆胡萝卜翻炒', '加水煮开后转小火煮15分钟', '加入咖喱块搅拌至融化', '猪排拍松，依次沾面粉、蛋液、面包糠', '油锅烧热，炸至金黄酥脆', '米饭装盘，淋上咖喱，放上切好的猪排'],
    comments: []
  }
];
