import axios from 'axios'

export interface TranslationResult {
  text: string
  original: string
  sourceLang: string
  targetLang: string
}

const LOCAL_DICTIONARY: Record<string, Record<string, string>> = {
  zh: {
    en: ' ',
    '将': 'Put',
    '锅中': 'in a pot',
    '加入': 'add',
    '倒入': 'pour in',
    '放入': 'place into',
    '翻炒': 'stir-fry',
    '炒至': 'stir-fry until',
    '煮': 'boil',
    '煮至': 'boil until',
    '蒸': 'steam',
    '炖': 'simmer',
    '小火': 'low heat',
    '大火': 'high heat',
    '中火': 'medium heat',
    '分钟': 'minutes',
    '小时': 'hours',
    '秒': 'seconds',
    '适量': 'appropriate amount',
    '少许': 'a pinch of',
    '汤匙': 'tablespoons',
    '茶匙': 'teaspoons',
    '克': 'grams',
    '毫升': 'milliliters',
    '备用': 'set aside',
    '洗净': 'wash thoroughly',
    '切片': 'slice',
    '切块': 'cut into pieces',
    '切丝': 'shred into strips',
    '切末': 'mince',
    '切段': 'cut into segments',
    '去皮': 'peel',
    '去骨': 'bone out / debone',
    '去腥': 'remove the fishy smell',
    '腌制': 'marinate',
    '混合均匀': 'mix evenly',
    '搅拌均匀': 'stir well',
    '勾芡': 'thicken with starch slurry',
    '淋上': 'drizzle over',
    '撒上': 'sprinkle with',
    '捞出': 'fish out / remove from the liquid',
    '沥干': 'drain well',
    '装盘': 'plate / transfer to a serving dish',
    '出锅': 'transfer out of the wok',
    '盛出': 'scoop out / serve',
    '晾凉': 'let cool',
    '预热': 'preheat',
    '盖上锅盖': 'cover with a lid',
    '冒泡': 'bubbling',
    '金黄': 'golden brown',
    '熟透': 'fully cooked / cooked through',
    '变软': 'turn soft',
    '出汁': 'release the juice',
    '香味四溢': 'fragrant aroma fills the air',
    '上色': 'develop color / caramelize',
    '入味': 'absorb the flavor',
    '收汁': 'reduce the sauce',
    '起锅': 'remove from heat',
    '主料': 'Main Ingredients',
    '辅料': 'Auxiliary Ingredients',
    '调料': 'Seasonings',
    '步骤': 'Steps',
    '食材': 'Ingredients',
    '菜品名称': 'Dish Name',
    '红烧': 'Braised in Soy Sauce',
    '麻婆豆腐': 'Mapo Tofu',
    '宫保鸡丁': 'Kung Pao Chicken',
    '鱼香肉丝': 'Fish-flavored Shredded Pork',
    '糖醋里脊': 'Sweet and Sour Pork Tenderloin',
    '番茄炒蛋': 'Scrambled Eggs with Tomatoes',
    '红烧肉': 'Red-braised Pork Belly',
    '糖醋排骨': 'Sweet and Sour Spareribs',
    '青椒肉丝': 'Shredded Pork with Green Peppers',
    '蒜蓉西兰花': 'Broccoli with Garlic Sauce',
    '可乐鸡翅': 'Cola Chicken Wings',
    '回锅肉': 'Twice-cooked Pork',
    '水煮鱼': 'Sichuan Boiled Fish',
    '干煸四季豆': 'Dry-fried Green Beans',
    '口水鸡': 'Steamed Chicken with Chili Sauce',
    '东坡肉': 'Dongpo Pork',
    '西湖醋鱼': 'West Lake Vinegar Fish',
    '北京烤鸭': 'Peking Duck',
    '小笼包': 'Xiaolongbao (Soup Dumplings)',
    '饺子': 'Dumplings',
    '包子': 'Steamed Buns',
    '葱油饼': 'Scallion Pancakes',
    '春卷': 'Spring Rolls',
    '白切鸡': 'Sliced Boiled Chicken',
    '皮蛋瘦肉粥': 'Congee with Preserved Egg and Lean Pork',
    '扬州炒饭': 'Yangzhou Fried Rice',
    '酱油': 'soy sauce',
    '盐': 'salt',
    '糖': 'sugar',
    '醋': 'vinegar',
    '油': 'oil',
    '料酒': 'cooking wine',
    '淀粉': 'starch',
    '玉米淀粉': 'cornstarch',
    '土豆淀粉': 'potato starch',
    '葱': 'scallion',
    '姜': 'ginger',
    '蒜': 'garlic',
    '辣椒': 'chili pepper',
    '干辣椒': 'dried chili pepper',
    '八角': 'star anise',
    '桂皮': 'cinnamon stick',
    '香叶': 'bay leaf',
    '冰糖': 'rock sugar',
    '红糖': 'brown sugar',
    '味精': 'MSG / monosodium glutamate',
    '鸡精': 'chicken bouillon powder',
    '胡椒粉': 'pepper powder',
    '白胡椒粉': 'white pepper powder',
    '黑胡椒粉': 'black pepper powder',
    '葱花': 'chopped scallions',
    '姜丝': 'shredded ginger',
    '蒜末': 'minced garlic',
    '豆瓣酱': 'doubanjiang (spicy bean paste)',
    '甜面酱': 'sweet bean paste',
    '沙茶酱': 'satay sauce',
    '芝麻酱': 'sesame paste',
    '花生酱': 'peanut butter',
    '番茄酱': 'ketchup / tomato sauce',
    '蛋黄酱': 'mayonnaise',
    '芥末': 'mustard',
    '咖喱': 'curry',
    '豆腐': 'tofu',
    '鸡蛋': 'eggs',
    '番茄': 'tomato',
    '西红柿': 'tomato',
    '土豆': 'potato',
    '马铃薯': 'potato',
    '胡萝卜': 'carrot',
    '黄瓜': 'cucumber',
    '茄子': 'eggplant / aubergine',
    '青椒': 'green bell pepper',
    '洋葱': 'onion',
    '芹菜': 'celery',
    '韭菜': 'chives',
    '菠菜': 'spinach',
    '生菜': 'lettuce',
    '卷心菜': 'cabbage',
    '花椰菜': 'cauliflower',
    '西兰花': 'broccoli',
    '芦笋': 'asparagus',
    '玉米': 'corn',
    '香菇': 'shiitake mushroom',
    '蘑菇': 'mushroom',
    '金针菇': 'enoki mushroom',
    '杏鲍菇': 'king oyster mushroom',
    '木耳': 'wood ear mushroom',
    '银耳': 'snow fungus',
    '海带': 'kelp',
    '紫菜': 'dried seaweed',
    '猪肉': 'pork',
    '五花肉': 'pork belly',
    '瘦肉': 'lean pork',
    '肥肉': 'fatty pork',
    '里脊肉': 'pork tenderloin',
    '排骨': 'spareribs / pork ribs',
    '猪蹄': 'pig trotters',
    '猪肝': 'pork liver',
    '猪腰': 'pork kidneys',
    '牛肉': 'beef',
    '牛腩': 'beef brisket',
    '牛排': 'steak',
    '牛里脊': 'beef tenderloin',
    '牛肉末': 'ground beef',
    '鸡肉': 'chicken',
    '鸡胸肉': 'chicken breast',
    '鸡腿': 'chicken leg / drumstick',
    '鸡翅': 'chicken wing',
    '鸡爪': 'chicken feet',
    '鸡肉末': 'ground chicken',
    '鸭肉': 'duck',
    '鹅肉': 'goose',
    '羊肉': 'lamb',
    '鱼片': 'fish fillet',
    '草鱼': 'grass carp',
    '鲈鱼': 'sea bass',
    '三文鱼': 'salmon',
    '金枪鱼': 'tuna',
    '虾': 'shrimp / prawn',
    '虾仁': 'peeled shrimp',
    '螃蟹': 'crab',
    '蟹肉': 'crab meat',
    '鱿鱼': 'squid',
    '章鱼': 'octopus',
    '扇贝': 'scallop',
    '蛤蜊': 'clam',
    '牡蛎': 'oyster',
    '海参': 'sea cucumber',
    '鲍鱼': 'abalone',
    '鱼翅': 'shark fin',
    '米饭': 'rice',
    '糯米': 'glutinous rice',
    '糙米': 'brown rice',
    '面条': 'noodles',
    '挂面': 'dried noodles',
    '拉面': 'ramen / hand-pulled noodles',
    '刀削面': 'sliced noodles',
    '意大利面': 'pasta / spaghetti',
    '乌冬面': 'udon noodles',
    '荞麦面': 'soba noodles',
    '面粉': 'flour',
    '高筋面粉': 'bread flour',
    '低筋面粉': 'cake flour',
    '面包糠': 'bread crumbs',
    '苏打粉': 'baking soda',
    '泡打粉': 'baking powder',
    '酵母': 'yeast',
    '牛奶': 'milk',
    '酸奶': 'yogurt',
    '奶油': 'cream',
    '黄油': 'butter',
    '芝士': 'cheese',
    '奶酪': 'cheese',
    '蜂蜜': 'honey',
    '巧克力': 'chocolate',
    '可可粉': 'cocoa powder',
    '香草精': 'vanilla extract',
    '柠檬汁': 'lemon juice',
    '椰子汁': 'coconut milk',
    '花生': 'peanuts',
    '核桃': 'walnuts',
    '杏仁': 'almonds',
    '腰果': 'cashews',
    '芝麻': 'sesame seeds',
    '白芝麻': 'white sesame seeds',
    '黑芝麻': 'black sesame seeds',
    '松子': 'pine nuts',
    '栗子': 'chestnuts',
    '莲子': 'lotus seeds',
    '枸杞': 'goji berries',
    '红枣': 'red dates / jujubes',
    '桂圆': 'longan',
    '山楂': 'hawthorn',
    '陈皮': 'dried tangerine peel',
    '罗汉果': 'monk fruit',
    '菊花': 'chrysanthemum',
    '龙井': 'Longjing tea',
    '普洱': "Pu'er tea",
    '铁观音': 'Tieguanyin tea',
    '茉莉花茶': 'jasmine tea',
    '红茶': 'black tea',
    '绿茶': 'green tea',
    '乌龙茶': 'oolong tea',
    '花茶': 'flower-scented tea',
    '水': 'water',
    '清水': 'clean water',
    '温水': 'warm water',
    '开水': 'boiling water',
    '凉水': 'cold water',
    '冰水': 'ice water',
    '高汤': 'stock / broth',
    '鸡汤': 'chicken stock',
    '猪骨汤': 'pork bone broth',
    '鱼汤': 'fish stock',
    '蔬菜汤': 'vegetable stock',
  },
  en: {
    zh: ' '
  }
}

function applyLocalDictionary(text: string, sourceLang: string, targetLang: string): string {
  const dict = LOCAL_DICTIONARY[sourceLang]?.[targetLang === 'zh' ? 'zh' : targetLang]
  if (!dict) return text

  let result = text
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    const value = (LOCAL_DICTIONARY[sourceLang] as Record<string, string>)[key]
    if (value) {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      result = result.replace(regex, value)
    }
  }
  return result
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  if (!text.trim()) {
    return {
      text: '',
      original: text,
      sourceLang,
      targetLang,
    }
  }

  if (sourceLang === targetLang) {
    return {
      text,
      original: text,
      sourceLang,
      targetLang,
    }
  }

  try {
    const langPair = `${sourceLang.toLowerCase()}|${targetLang.toLowerCase()}`
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`

    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
      },
    })

    if (
      response.data &&
      response.data.responseStatus === 200 &&
      response.data.responseData
    ) {
      let translated = response.data.responseData.translatedText as string

      if (sourceLang === 'zh' && (targetLang === 'en' || targetLang === 'EN')) {
        translated = applyLocalDictionary(translated, 'zh', 'en')
      }

      return {
        text: translated,
        original: text,
        sourceLang,
        targetLang,
      }
    }

    throw new Error('API returned non-200 status')
  } catch (error) {
    console.warn('[Translator] MyMemory API failed, falling back to local dictionary:', error instanceof Error ? error.message : error)

    if (sourceLang === 'zh' && targetLang.toLowerCase() === 'en') {
      const translated = applyLocalDictionary(text, 'zh', 'en')
      return {
        text: translated,
        original: text,
        sourceLang,
        targetLang,
      }
    }

    return {
      text: text,
      original: text,
      sourceLang,
      targetLang,
    }
  }
}

export async function translateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult[]> {
  const results = await Promise.all(
    texts.map((t) => translateText(t, sourceLang, targetLang))
  )
  return results
}
