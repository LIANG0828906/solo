import type { Recipe, IngredientDetail, Comment } from '../types';

const cuisines = ['chinese', 'western', 'japanese', 'korean', 'italian', 'french', 'other'] as const;
const difficulties = ['easy', 'medium', 'hard'] as const;

const descriptions = [
  '这是一道经典的家常菜，口感丰富，色香味俱全，是家庭聚餐的首选。',
  '简单易做的美味料理，适合新手尝试，食材常见，做法简单。',
  '地道的传统美食，传承百年的独特风味，让你体验正宗的味道。',
  '健康营养的低脂美食，富含蛋白质和维生素，是健身人士的最爱。',
  '宴客必备的招牌菜，色香味俱佳，一定会让你的客人赞不绝口。',
  '快手料理，15分钟就能搞定，适合忙碌的上班族。',
  '孩子最爱的美食，酸甜可口，营养丰富，让孩子爱上吃饭。',
  '暖胃暖心的冬日美食，热气腾腾，一口下去满满的幸福感。'
];

const ingredientPool = [
  { name: '鸡胸肉', amount: '300g' },
  { name: '牛肉', amount: '400g' },
  { name: '猪肉', amount: '350g' },
  { name: '鸡蛋', amount: '3个' },
  { name: '豆腐', amount: '1块' },
  { name: '西红柿', amount: '2个' },
  { name: '土豆', amount: '2个' },
  { name: '青椒', amount: '2个' },
  { name: '洋葱', amount: '1个' },
  { name: '大蒜', amount: '5瓣' },
  { name: '生姜', amount: '1块' },
  { name: '葱', amount: '2根' },
  { name: '胡萝卜', amount: '1根' },
  { name: '西兰花', amount: '1颗' },
  { name: '蘑菇', amount: '200g' },
  { name: '米饭', amount: '2碗' },
  { name: '面条', amount: '200g' },
  { name: '白菜', amount: '半颗' },
  { name: '黄瓜', amount: '1根' },
  { name: '茄子', amount: '2根' }
];

const stepsTemplate = [
  '将所有食材洗净备用。',
  '主料切成适当大小的块状或丝状。',
  '热锅下油，加入葱姜蒜爆香。',
  '放入主料翻炒至变色。',
  '加入调味料和适量清水。',
  '大火烧开后转小火炖煮。',
  '收汁后撒上葱花即可出锅。'
];

const tagsPool = ['家常', '快手', '下饭', '营养', '低脂', '宴客', '孩子爱吃', '暖胃', '经典', '传统', '健康', '素食', '高蛋白', '清淡', '重口味'];

const usernames = ['美食达人小王', '厨房新手小李', '吃货老张', '健身达人阿强', '宝妈小芳', '留学生Tom', '料理爱好者', '上班族大刘', '退休厨师老陈', '甜蜜情侣小美', '美食博主', '家庭煮夫'];
const avatarColors = ['#FFD700', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#FF5722', '#607D8B', '#795548'];
const commentContents = [
  '跟着做了，味道超棒！家人都很喜欢。',
  '第一次做就成功了，感谢详细的步骤。',
  '稍微调整了一下调料，更符合我们家的口味。',
  '食材很好买，超市都能找到。',
  '配米饭吃绝了，连吃了两碗！',
  '下次准备多做点，带饭去公司。',
  '图片看起来就很有食欲，实际做出来也一样。',
  '孩子说比外面饭店的还好吃！',
  '这个做法很正宗，收藏了。',
  '作为厨房小白也能轻松上手，赞！'
];

function randomFrom<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSteps(seed: number): { step: number; description: string }[] {
  const count = 4 + (seed % 4);
  const steps: { step: number; description: string }[] = [];
  for (let i = 0; i < count; i++) {
    steps.push({ step: i + 1, description: stepsTemplate[(i + seed) % stepsTemplate.length] });
  }
  return steps;
}

function generateIngredients(seed: number): { name: string; amount: string }[] {
  const count = 4 + (seed % 5);
  const shuffled = [...ingredientPool].sort(() => (seed % 3) - 1);
  return shuffled.slice(0, count);
}

function generateTags(seed: number): string[] {
  const count = 2 + (seed % 3);
  const shuffled = [...tagsPool].sort(() => (seed % 2) - 1);
  return shuffled.slice(0, count);
}

function generateComments(recipeId: string, seed: number): Comment[] {
  const count = 3 + (seed % 3);
  const comments: Comment[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 3) % 1000;
    comments.push({
      id: `c-${recipeId}-${i}`,
      recipeId,
      username: usernames[idx % usernames.length],
      avatarColor: avatarColors[idx % avatarColors.length],
      content: commentContents[idx % commentContents.length],
      createdAt: new Date(Date.now() - (i + 1) * 86400000 - idx * 1000).toISOString()
    });
  }
  return comments;
}

const recipeDataList: { name: string; cuisine: typeof cuisines[number]; seed: number }[] = [
  { name: '麻婆豆腐', cuisine: 'chinese', seed: 1 },
  { name: '宫保鸡丁', cuisine: 'chinese', seed: 2 },
  { name: '鱼香肉丝', cuisine: 'chinese', seed: 3 },
  { name: '红烧肉', cuisine: 'chinese', seed: 4 },
  { name: '糖醋里脊', cuisine: 'chinese', seed: 5 },
  { name: '回锅肉', cuisine: 'chinese', seed: 6 },
  { name: '水煮鱼', cuisine: 'chinese', seed: 7 },
  { name: '番茄炒蛋', cuisine: 'chinese', seed: 8 },
  { name: '牛排', cuisine: 'western', seed: 9 },
  { name: '汉堡', cuisine: 'western', seed: 10 },
  { name: '披萨', cuisine: 'western', seed: 11 },
  { name: '意面', cuisine: 'western', seed: 12 },
  { name: '烤鸡', cuisine: 'western', seed: 13 },
  { name: '沙拉', cuisine: 'western', seed: 14 },
  { name: '三明治', cuisine: 'western', seed: 15 },
  { name: '炸鱼薯条', cuisine: 'western', seed: 16 },
  { name: '寿司', cuisine: 'japanese', seed: 17 },
  { name: '拉面', cuisine: 'japanese', seed: 18 },
  { name: '天妇罗', cuisine: 'japanese', seed: 19 },
  { name: '日式咖喱', cuisine: 'japanese', seed: 20 },
  { name: '刺身', cuisine: 'japanese', seed: 21 },
  { name: '烤鳗鱼', cuisine: 'japanese', seed: 22 },
  { name: '亲子丼', cuisine: 'japanese', seed: 23 },
  { name: '日式煎饺', cuisine: 'japanese', seed: 24 },
  { name: '石锅拌饭', cuisine: 'korean', seed: 25 },
  { name: '辣白菜', cuisine: 'korean', seed: 26 },
  { name: '部队锅', cuisine: 'korean', seed: 27 },
  { name: '韩式炸鸡', cuisine: 'korean', seed: 28 },
  { name: '烤肉', cuisine: 'korean', seed: 29 },
  { name: '大酱汤', cuisine: 'korean', seed: 30 },
  { name: '泡菜汤', cuisine: 'korean', seed: 31 },
  { name: '冷面', cuisine: 'korean', seed: 32 },
  { name: '意大利面', cuisine: 'italian', seed: 33 },
  { name: '披萨玛格丽特', cuisine: 'italian', seed: 34 },
  { name: '千层面', cuisine: 'italian', seed: 35 },
  { name: '意式烩饭', cuisine: 'italian', seed: 36 },
  { name: '提拉米苏', cuisine: 'italian', seed: 37 },
  { name: '卡邦尼意面', cuisine: 'italian', seed: 38 },
  { name: '意式饺子', cuisine: 'italian', seed: 39 },
  { name: '意式烤面包', cuisine: 'italian', seed: 40 },
  { name: '法式洋葱汤', cuisine: 'french', seed: 41 },
  { name: '鹅肝', cuisine: 'french', seed: 42 },
  { name: '可颂', cuisine: 'french', seed: 43 },
  { name: '法式蜗牛', cuisine: 'french', seed: 44 },
  { name: '马赛鱼汤', cuisine: 'french', seed: 45 },
  { name: '可丽饼', cuisine: 'french', seed: 46 },
  { name: '泰式冬阴功', cuisine: 'other', seed: 47 },
  { name: '印度咖喱', cuisine: 'other', seed: 48 },
  { name: '墨西哥卷饼', cuisine: 'other', seed: 49 },
  { name: '越南河粉', cuisine: 'other', seed: 50 }
];

function imageHeight(seed: number): number {
  return 300 + (seed * 17) % 100;
}

export const mockRecipes: Recipe[] = recipeDataList.map((r, i) => {
  const h = imageHeight(r.seed);
  return {
    id: `recipe-${i + 1}`,
    name: r.name,
    thumbnail: `https://picsum.photos/seed/${encodeURIComponent(r.name)}/400/${h}`,
    image: `https://picsum.photos/seed/${encodeURIComponent(r.name)}/800/${h * 2}`,
    cuisine: r.cuisine,
    difficulty: difficulties[r.seed % 3],
    rating: Math.round((3.5 + (r.seed % 15) / 10) * 10) / 10,
    ratingCount: 20 + (r.seed * 7) % 200,
    cookTime: 15 + (r.seed * 5) % 90,
    description: descriptions[r.seed % descriptions.length],
    ingredients: generateIngredients(r.seed),
    steps: generateSteps(r.seed),
    tags: generateTags(r.seed),
    createdAt: new Date(Date.now() - r.seed * 86400000 * 5).toISOString()
  };
});

export const ingredientDetails: Record<string, IngredientDetail> = {
  '鸡胸肉': {
    name: '鸡胸肉',
    origin: '中国各地均有养殖，以山东、河南产量最大',
    substitutes: ['鸡腿肉', '火鸡胸肉', '鸭胸肉'],
    description: '鸡胸肉是鸡身上最大的两块肉，肉质细嫩，滋味鲜美，蛋白质含量较高，且易被人体吸收利用，有增强体力、强壮身体的作用。是健身人士和减肥人群的首选肉类食材。'
  },
  '牛肉': {
    name: '牛肉',
    origin: '世界各地均有出产，优质产地包括澳大利亚、阿根廷、日本、中国内蒙古',
    substitutes: ['羊肉', '猪肉', '鹿肉'],
    description: '牛肉是世界第三消耗肉品，富含蛋白质、氨基酸，能提高机体抗病能力，对生长发育及手术后、病后调养的人在补充失血和修复组织等方面特别适宜。'
  },
  '猪肉': {
    name: '猪肉',
    origin: '中国是世界最大的猪肉生产国和消费国',
    substitutes: ['牛肉', '羊肉', '鸡肉'],
    description: '猪肉又名豚肉，是主要家畜之一。其性味甘咸平，含有丰富的蛋白质及脂肪、碳水化合物、钙、磷、铁等成分。是日常生活的主要副食品。'
  },
  '鸡蛋': {
    name: '鸡蛋',
    origin: '世界各地均有生产，中国是最大的鸡蛋生产国',
    substitutes: ['鸭蛋', '鹌鹑蛋', '鹅蛋'],
    description: '鸡蛋是人类最好的营养来源之一，含有大量的维生素、矿物质和高生物价值的蛋白质。对人而言，鸡蛋的蛋白质品质最佳，仅次于母乳。'
  },
  '豆腐': {
    name: '豆腐',
    origin: '中国安徽省淮南市，相传为汉朝淮南王刘安发明',
    substitutes: ['千页豆腐', '豆皮', '腐竹'],
    description: '豆腐是最常见的豆制品，又称水豆腐。主要的生产过程一是制浆，即将大豆制成豆浆；二是凝固成形，即豆浆在热与凝固剂的共同作用下凝固成含有大量水分的凝胶体，即豆腐。'
  },
  '西红柿': {
    name: '西红柿',
    origin: '原产于南美洲，现中国各地广泛种植',
    substitutes: ['番茄罐头', '圣女果', '番茄酱'],
    description: '西红柿，又名番茄。全生境生长，体被粘质腺毛，常为羽状复叶或羽状分裂，黄色花冠，浆果扁球形或近球形，肉质而多汁液，桔黄色或鲜红色，光滑。'
  },
  '土豆': {
    name: '土豆',
    origin: '原产于南美洲安第斯山脉，现全球广泛种植',
    substitutes: ['红薯', '山药', '芋头'],
    description: '土豆学名马铃薯，属茄科，一年生草本植物，块茎可供食用，是全球第四大重要的粮食作物，仅次于小麦、稻谷和玉米。富含膳食纤维，有助于促进胃肠蠕动。'
  },
  '青椒': {
    name: '青椒',
    origin: '原产于中南美洲热带地区，现世界各地普遍栽培',
    substitutes: ['彩椒', '尖椒', '甜椒'],
    description: '青椒为植物界，双子叶植物纲，合瓣花亚纲，茄科。和红色辣椒统称为辣椒。果实为浆果。青椒特有的味道和所含的辣椒素有刺激唾液和胃液分泌的作用，能增进食欲。'
  },
  '洋葱': {
    name: '洋葱',
    origin: '原产于中亚或西亚，现全球广泛种植',
    substitutes: ['大葱', '韭葱', '洋葱粉'],
    description: '洋葱是百合科、葱属多年生草本植物。含有前列腺素A，能降低外周血管阻力，降低血黏度，可用于降低血压、提神醒脑、缓解压力、预防感冒。'
  },
  '大蒜': {
    name: '大蒜',
    origin: '原产于中亚和地中海地区，现中国是最大的大蒜生产国',
    substitutes: ['大蒜粉', '蒜苗', '韭黄'],
    description: '大蒜整棵植株具有强烈辛辣的蒜臭味，蒜头、蒜叶和花薹均可作蔬菜食用，不仅可作调味料，而且可入药，是著名的食药两用植物。'
  },
  '生姜': {
    name: '生姜',
    origin: '原产于东南亚热带地区，现中国中部、东南部及南方各省广泛栽培',
    substitutes: ['姜粉', '鲜姜', '黄姜'],
    description: '生姜是姜科多年生草本植物姜的新鲜根茎。生姜在中医药学里具有发散、止呕、止咳等功效。是日常烹饪中不可或缺的调味品。'
  },
  '葱': {
    name: '葱',
    origin: '原产于中国，现世界各地广泛栽培',
    substitutes: ['大葱', '小葱', '洋葱'],
    description: '葱为百合科葱属多年生草本植物。做调味品的主要是葱的叶鞘和叶片，具有解热、祛痰、促进消化吸收、抗菌、抗病毒的作用。'
  },
  '胡萝卜': {
    name: '胡萝卜',
    origin: '原产于亚洲西南部，阿富汗为最早演化中心',
    substitutes: ['红萝卜', '白萝卜', '红薯'],
    description: '胡萝卜是伞形科、胡萝卜属野胡萝卜的变种，根作蔬菜食用，并含多种维生素甲、乙、丙及胡萝卜素。素有"小人参"之称。'
  },
  '西兰花': {
    name: '西兰花',
    origin: '原产于地中海东部沿岸地区，现全球广泛种植',
    substitutes: ['花椰菜', '菜花', '甘蓝'],
    description: '西兰花，俗称青花菜。营养丰富，含蛋白质、糖、脂肪、维生素和胡萝卜素，营养成份位居同类蔬菜之首，被誉为"蔬菜皇冠"。'
  },
  '蘑菇': {
    name: '蘑菇',
    origin: '广泛分布于地球各处，人工培育品种众多',
    substitutes: ['香菇', '平菇', '杏鲍菇'],
    description: '蘑菇称为双孢蘑菇，是世界上人工栽培较广泛、产量较高、消费量较大的食用菌品种。富含人体必需氨基酸、矿物质、维生素和多糖等营养成分。'
  },
  '米饭': {
    name: '米饭',
    origin: '水稻原产于中国和印度，现亚洲各国为主产区',
    substitutes: ['糙米', '小米', '藜麦'],
    description: '米饭是中国、乃至东亚、东南亚人民喜爱的一种主食，是用大米和适量的水蒸或焖熟而成的食物。是碳水化合物的主要来源。'
  },
  '面条': {
    name: '面条',
    origin: '起源于中国，已有四千多年的制作食用历史',
    substitutes: ['挂面', '意大利面', '米粉'],
    description: '面条是一种制作简单、食用方便、营养丰富的食品，既可作为主食又可作为快餐。种类繁多，如拉面、刀削面、手擀面等。'
  },
  '白菜': {
    name: '白菜',
    origin: '原产于中国北方，现全国各地均有栽培',
    substitutes: ['娃娃菜', '大白菜', '小白菜'],
    description: '白菜是十字花科芸薹属植物，是中国东北及华北冬、春季的主要蔬菜。白菜以柔嫩的叶球、莲座叶或花茎供食用，产量高、耐储藏。'
  },
  '黄瓜': {
    name: '黄瓜',
    origin: '原产于喜马拉雅山南麓的尼泊尔、锡金一带',
    substitutes: ['西葫芦', '丝瓜', '冬瓜'],
    description: '黄瓜是葫芦科一年生蔓生或攀援草本植物。富含蛋白质、糖类、维生素B2、维生素C、维生素E、胡萝卜素、尼克酸、钙、磷、铁等营养成分。'
  },
  '茄子': {
    name: '茄子',
    origin: '原产于亚洲热带地区，现全球广泛种植',
    substitutes: ['番茄', '土豆', '彩椒'],
    description: '茄子是茄科茄属植物，果可供蔬食。根、茎、叶入药，为收敛剂，有利尿之效，叶也可以作麻醉剂。茄子营养丰富，含有多种维生素以及钙、磷、铁等。'
  }
};

export const mockComments: Record<string, Comment[]> = {};
recipeDataList.forEach((r, i) => {
  const recipeId = `recipe-${i + 1}`;
  mockComments[recipeId] = generateComments(recipeId, r.seed);
});
