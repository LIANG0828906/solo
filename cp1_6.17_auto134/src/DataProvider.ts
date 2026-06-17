import type { Season } from './utils'

export interface SolarTerm {
  id: string
  name: string
  month: number
  day: number
  season: Season
  phenology: string
  illustrationType: string
}

const SOLAR_TERMS: SolarTerm[] = [
  { id: '1', name: '立春', month: 2, day: 4, season: 'spring', phenology: '东风解冻，蛰虫始振，鱼陟负冰。春日初临，柳条抽芽，万物复苏，大地渐次苏醒，一派生机盎然之象。', illustrationType: 'willow' },
  { id: '2', name: '雨水', month: 2, day: 19, season: 'spring', phenology: '獭祭鱼，鸿雁来，草木萌动。细雨绵绵，润物无声，桃花含苞待放，山野渐染新绿。', illustrationType: 'rain' },
  { id: '3', name: '惊蛰', month: 3, day: 6, season: 'spring', phenology: '桃始华，仓庚鸣，鹰化为鸠。春雷乍响，蛰伏之虫惊醒，桃花灼灼盛开，莺啼燕舞。', illustrationType: 'peach' },
  { id: '4', name: '春分', month: 3, day: 21, season: 'spring', phenology: '玄鸟至，雷乃发声，始电。昼夜均分，燕飞草长，油菜花海金黄，杨柳依依拂岸。', illustrationType: 'swallow' },
  { id: '5', name: '清明', month: 4, day: 5, season: 'spring', phenology: '桐始华，田鼠化为鴽，虹始见。气清景明，万物皆显，梨花风起正清明，游子寻春半出城。', illustrationType: 'pear' },
  { id: '6', name: '谷雨', month: 4, day: 20, season: 'spring', phenology: '萍始生，鸣鸠拂其羽，戴胜降于桑。雨生百谷，牡丹吐蕊，采茶正当时，柳絮飞落杜鹃啼。', illustrationType: 'peony' },
  { id: '7', name: '立夏', month: 5, day: 6, season: 'summer', phenology: '蝼蝈鸣，蚯蚓出，王瓜生。初夏伊始，万物繁茂，绿荫遍野，蛙声蝉鸣渐起。', illustrationType: 'lotus' },
  { id: '8', name: '小满', month: 5, day: 21, season: 'summer', phenology: '苦菜秀，靡草死，麦秋至。麦粒渐满，尚未成熟，桑叶正肥，油菜籽熟，一派丰收在望。', illustrationType: 'wheat' },
  { id: '9', name: '芒种', month: 6, day: 6, season: 'summer', phenology: '螳螂生，鵙始鸣，反舌无声。麦类成熟，稻秧新插，栀子花开，黄梅时节家家雨。', illustrationType: 'ear' },
  { id: '10', name: '夏至', month: 6, day: 21, season: 'summer', phenology: '鹿角解，蝉始鸣，半夏生。日长之至，荷花映日，蛙声满塘，荔枝红透岭南。', illustrationType: 'lotus2' },
  { id: '11', name: '小暑', month: 7, day: 7, season: 'summer', phenology: '温风至，蟋蟀居宇，鹰始鸷。盛夏初伏，热浪袭人，向日葵朵朵向阳，萤火虫夜舞。', illustrationType: 'sunflower' },
  { id: '12', name: '大暑', month: 7, day: 23, season: 'summer', phenology: '腐草为萤，土润溽暑，大雨时行。酷热至极，茉莉飘香，西瓜清甜，骤雨频降消暑气。', illustrationType: 'jasmine' },
  { id: '13', name: '立秋', month: 8, day: 8, season: 'autumn', phenology: '凉风至，白露降，寒蝉鸣。秋意初临，暑气渐消，梧桐叶落，稻穗金黄低头。', illustrationType: 'maple' },
  { id: '14', name: '处暑', month: 8, day: 23, season: 'autumn', phenology: '鹰乃祭鸟，天地始肃，禾乃登。暑气尽消，秋高气爽，桂花暗香浮动，棉花吐絮如云。', illustrationType: 'osmanthus' },
  { id: '15', name: '白露', month: 9, day: 8, season: 'autumn', phenology: '鸿雁来，玄鸟归，群鸟养羞。露凝而白，秋意渐浓，芦花飞雪，石榴笑口常开。', illustrationType: 'reed' },
  { id: '16', name: '秋分', month: 9, day: 23, season: 'autumn', phenology: '雷始收声，蛰虫坯户，水始涸。昼夜均而寒暑平，金风送爽，蟹肥菊黄，丹桂飘香。', illustrationType: 'chrysanthemum' },
  { id: '17', name: '寒露', month: 10, day: 8, season: 'autumn', phenology: '鸿雁来宾，雀入大水为蛤，菊有黄华。露气寒冷，将欲凝霜，枫叶染红层林尽染，银杏金辉。', illustrationType: 'ginkgo' },
  { id: '18', name: '霜降', month: 10, day: 24, season: 'autumn', phenology: '豺乃祭兽，草木黄落，蛰虫咸俯。霜落大地，柿红如火，枫树叶尽，秋意阑珊冬将至。', illustrationType: 'persimmon' },
  { id: '19', name: '立冬', month: 11, day: 8, season: 'winter', phenology: '水始冰，地始冻，雉入大水为蜃。冬之伊始，万物收藏，银杏叶落满阶，寒梅含苞。', illustrationType: 'plum' },
  { id: '20', name: '小雪', month: 11, day: 22, season: 'winter', phenology: '虹藏不见，天气上升地气下降，闭塞而成冬。初雪飘飘，叶落枝枯，山茶始开，围炉煮茶正当时。', illustrationType: 'snow' },
  { id: '21', name: '大雪', month: 12, day: 7, season: 'winter', phenology: '鹖鴠不鸣，虎始交，荔挺出。大雪纷飞，银装素裹，蜡梅暗香浮动，冰棱挂檐如玉。', illustrationType: 'snowflake' },
  { id: '22', name: '冬至', month: 12, day: 22, season: 'winter', phenology: '蚯蚓结，麋角解，水泉动。日短之至，数九寒天，梅开五福，汤圆暖心，阴极阳生。', illustrationType: 'wintersweet' },
  { id: '23', name: '小寒', month: 1, day: 6, season: 'winter', phenology: '雁北乡，鹊始巢，雉始雊。三九严寒，滴水成冰，蜡梅怒放，松竹挺立，岁寒三友。', illustrationType: 'pine' },
  { id: '24', name: '大寒', month: 1, day: 20, season: 'winter', phenology: '鸡乳，征鸟厉疾，水泽腹坚。寒气之逆极，岁末迎新，水仙凌波，爆竹声中一岁除。', illustrationType: 'narcissus' }
]

export const getSolarTerms = (): SolarTerm[] => {
  return SOLAR_TERMS
}

export const getSolarTermByName = (name: string): SolarTerm | undefined => {
  return SOLAR_TERMS.find(st => st.name === name)
}

export const getSolarTermsByMonth = (month: number): SolarTerm[] => {
  return SOLAR_TERMS.filter(st => st.month === month)
}

export const getSolarTermsBySeason = (season: Season): SolarTerm[] => {
  return SOLAR_TERMS.filter(st => st.season === season)
}

export const getSolarTermById = (id: string): SolarTerm | undefined => {
  return SOLAR_TERMS.find(st => st.id === id)
}
