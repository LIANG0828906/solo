export type Tone = 'ping' | 'ze' | 'unknown'
export type AntithesisType = 'strict' | 'wide' | 'borrowed' | 'none'

export interface CharInfo {
  char: string
  tone: Tone
  isRhyme: boolean
  rhymeGroup: number
  lineIdx: number
  charIdx: number
}

export interface LineInfo {
  text: string
  chars: CharInfo[]
  pattern: Tone[]
}

export interface CoupletInfo {
  idx: number
  lineA: LineInfo
  lineB: LineInfo
  antithesis: AntithesisType
  antithesisScore: number
  pingzeMatch: number
}

export interface RhymeGroup {
  group: number
  chars: string[]
  count: number
  color: string
}

export interface PoemAnalysis {
  title: string
  lines: LineInfo[]
  couplets: CoupletInfo[]
  rhymeGroups: RhymeGroup[]
  totalChars: number
  pingCount: number
  zeCount: number
  formType: string
  rhymeDensity: number
  overallScore: number
}

const pingChars = new Set([
  '东','冬','江','支','微','齐','鱼','虞','灰','真','文','元','寒','删','先','萧','肴','豪','歌','麻','阳','庚','青','蒸','尤','侵','覃','盐','咸',
  '风','中','空','红','同','东','通','蒙','笼','丛','翁','公','功','工','攻','宫','弓','穷','雄','熊','融','荣','容','隆','峰','锋','逢','缝','终','钟','冲','崇','嵩','松','从','淞',
  '春','人','新','尘','身','真','神','亲','臣','邻','宾','滨','贫','民','频','陈','伦','轮','匀','旬','驯','巡','唇','津','秦','薪','晨','辰','宸','麟','鳞','珍','嗔',
  '山','关','还','颜','安','难','闲','寒','前','年','天','连','烟','莲','怜','然','泉','轩','船','眠','圆','缘','原','元','言','传','千','钱','田','玄','悬','边','编','仙','鲜',
  '江','窗','双','降','邦','降','腔','撞','桩','幢','幢','缸','杠','矼','泷','扛','讧','艭',
  '阳','光','王','长','黄','方','香','堂','章','张','常','霜','量','忘','郎','浪','茫','苍','仓','昌','创','装','妆','庄','床','觞','强','娘','良','凉','梁','粮','翔','祥','羊','扬','杨','洋','佯',
  '庚','更','羹','坑','盲','萌','宏','红','虹','洪','鸿','泓','轰','亨','英','瑛','明','鸣','荣','莹','盈','莹','萤','营','迎','婴','缨','樱','贞','桢','祯','京','惊','精','菁','清','晴','情','擎','卿','轻','生','声','笙','甥','牲','平','评','萍','苹','枰','兵','丙','秉','炳','柄','饼','禀','并','明','盟','名','铭','茗','冥','溟','暝',
  '诗','时','知','之','池','迟','期','棋','奇','宜','仪','移','披','疲','离','儿','为','随','垂','谁','遗','斯','兹','芝','姿','词','辞','枝','肢','移','疲','眉','悲','肌','皮','碑','嬉','熙','欺','基','畿','羁','稽','梯','题','提','啼','蹄','醍',
  '书','鱼','初','居','裾','车','除','余','如','虚','嘘','徐','舒','蔬','疏','渠','徐','闾','驴','胥','裾','琚','蕖','蘧',
  '开','来','台','杯','梅','才','材','财','猜','栽','哉','哀','埃','皑','催','摧','堆','陪','培','裴','徘','骸','孩','槐','回','徊','雷','嵬','崔','摧','颓','醅','胚','衃',
  '云','分','文','闻','君','群','军','勋','薰','熏','氛','芬','荤','焚','坟','群','裙','耘','纭','筠','殷','欣','忻','昕','氲','氤','殷','熏','醺','纡',
  '萧','调','朝','霄','摇','遥','姚','桥','乔','侨','娇','骄','焦','椒','樵','谯','蕉','标','飙','瓢','苗','描','秒','渺','妙','庙','寥','辽','聊','撩','僚','寥','镣','鹩','貂','凋','雕','碉','鲷',
  '家','花','华','霞','茶','蛇','瑕','芽','牙','邪','斜','嗟','车','遮','奢','赊','叉','沙','纱','瓜','爬','琶','杷','骅','衙','呀','丫','娃','洼',
  '尤','侯','秋','周','州','洲','舟','鸥','楼','愁','谋','眸','求','球','囚','丘','牛','浮','谋','矛','柔','揉','蹂','搜','飕','修','羞','馐','貅','收','鸠','赳','啾','阄','勾','钩','沟','篝','缑',
  '青','听','亭','庭','廷','停','婷','霆','烃','汀','程','成','城','诚','承','乘','丞','惩','澄','征','峥','蒸','烝','凝','宁','屏','萍','苹','灵','龄','零','铃','玲','伶','苓','聆','囹','翎','瓴','蜓','丁','钉','仃','叮','町','厅','汀','庭','婷',
  '深','心','林','金','琴','寻','音','阴','吟','今','襟','侵','针','斟','沉','岑','禽','擒','淋','霖','临','壬','妊','任','歆','森','禁','簪','愔'
])

const zeChars = new Set([
  '屋','沃','烛','觉','质','物','月','曷','末','黠','屑','薛','药','铎','陌','麦','昔','锡','职','德','缉','合','叶','洽',
  '月','雪','别','夜','色','白','客','客','北','黑','百','国','策','册','隔','革','格','核','劾','获','惑','或','迫','拍','魄','默','墨','没','莫','漠','寞','蓦','秣',
  '雨','语','古','苦','土','五','鼓','武','虎','户','府','父','甫','脯','斧','俯','釜','腐','辅','组','主','柱','住','注','驻','铸','蛀','炷','麈','拄',
  '去','处','路','树','暮','雾','露','度','渡','步','步','具','惧','聚','趣','娶','铸','布','部','簿','附','赴','赋','付','阜','副','富','傅','付','咐',
  '上','望','向','象','相','样','丈','仗','杖','障','嶂','瘴','让','壤','攘','穰','放','访','纺','仿','舫','舫','况','矿','旷','贶','纩',
  '是','事','市','示','士','世','势','试','视','氏','似','祀','寺','侍','驶','史','使','始','矢','豕','屎','弛','豕',
  '地','弟','第','帝','递','棣','睇','娣','缔','蒂','谛','逮','隶','荔','俐','俪','莅','莉',
  '不','入','出','术','述','秫','率','帅','蟀','兀','卒','猝','猝','蹙','蹴','鳟','蒻',
  '一','七','八','漆','膝','七','柒','沏','缉','葺','辑','戢','楫','辑','蒺','嫉',
  '十','石','拾','食','蚀','识','实','式','室','释','适','饰','拭','弑','轼','贳','谥',
  '竹','菊','足','族','粟','速','宿','缩','肃','夙','簌','蔌','菽','孰','塾','熟','淑','叔','督','毒','读','牍','犊','渎','椟','黩','髑','笃',
  '绿','六','曲','局','狱','欲','浴','玉','狱','旭','蓄','畜','祝','逐','轴','舳','粥','妯','杼','伫','苎','纻',
  '骨','兀','窟','堀','讷','卒','猝','滑','猾','搰','鹘',
  '雪','血','穴','说','悦','阅','越','粤','月','钺','刖','樾',
  '落','薄','着','错','阁','各','壑','鹤','涸','昨','作','酢','祚','阼','胙','怍',
  '断','短','管','馆','缓','款','盥','盌','碗','莞','浣','涣','焕','换','唤','幻','宦','豢','患','痪',
  '大','太','下','夏','夏','暇','瑕','假','价','驾','架','嫁','稼','化','画','华','话','桦',
  '小','少','表','秒','妙','庙','了','瞭','料','潦','蓼','獠','缭','燎','镣',
  '久','九','有','友','酒','柳','手','首','守','寿','受','授','售','兽','狩','臭','丑','臭','肘','帚','纣','酎','胄','呪','味',
  '得','德','特','忒','慝','黑','墨','默','塞','刻','克','剋','客','恪','劾','核','覈',
  '三','衫','衫','叁','参','渗','惨','掺','毵','糁','髟','錾','暂','錾'
])

const rhymeMap: Record<string, number> = {}
const rhymeGroups = [
  ['东','同','童','中','空','公','宫','弓','红','鸿','虫','融','雄','熊','风','枫','丰','峰','锋','隆','窿','崇','嵩','松','聪','葱','丛','翁','嗡','工','攻','功','蒙','朦','咙','笼','聋'],
  ['江','窗','双','腔','撞','邦','降','泷','杠','缸','扛','桩','幢','艭'],
  ['支','时','诗','知','之','池','迟','期','棋','奇','宜','仪','移','疲','离','儿','随','垂','谁','遗','斯','兹','芝','姿','词','辞','枝','眉','悲','肌','皮','碑','嬉','熙','欺','基','羁','梯','题','提','啼','蹄'],
  ['微','机','飞','非','妃','菲','肥','腓','扉','霏','妃','菲','斐','翡','蜚','霏','扉','菲','腓','肥','鲱'],
  ['鱼','初','居','裾','车','除','余','如','虚','嘘','徐','舒','蔬','疏','渠','闾','驴','胥','琚','蕖','蘧','书','舒','枢','殊','珠','朱','株','诛','蛛','诸','厨','躇'],
  ['虞','珠','朱','株','诛','蛛','诸','厨','躇','蹰','刍','锄','雏','殊','珠','铢','蛛','茱','株','洙','邾','侏','诛','铢'],
  ['齐','西','溪','低','题','提','蹄','啼','梯','鸡','迷','泥','犁','黎','妻','栖','嘶','稽','批','兮','蹊','鼷','鞮','折','荑','羝','缇','氐'],
  ['灰','开','来','台','杯','梅','才','材','财','猜','栽','哉','哀','埃','皑','催','摧','堆','陪','培','裴','徘','骸','孩','槐','回','徊','雷','嵬','崔','摧','颓','醅','胚'],
  ['真','春','人','新','尘','身','神','亲','臣','邻','宾','滨','贫','民','频','陈','伦','轮','匀','旬','驯','巡','唇','津','秦','薪','晨','辰','宸','麟','鳞','珍','嗔','彬','斌','筠','氤'],
  ['文','云','分','闻','君','群','军','勋','薰','熏','氛','芬','荤','焚','坟','裙','耘','纭','殷','欣','忻','昕','氲','殷','醺'],
  ['元','言','原','源','园','猿','辕','远','怨','院','愿','苑','鼋','沅','鸳','宛','婉','畹','蜿','菀','惋','菀'],
  ['寒','山','关','还','颜','安','难','闲','寒','弹','丹、餐','滩','坛','檀','弹','殚','瘅','郸','箪','鞍','鞯','残','干','肝','竿','杆','奸','刊','单','阑','栏','兰','拦','澜','斓','兰','谰','镧','谩','瞒','鳗','满','漫','缦','慢','漫','烂','滥','澜'],
  ['删','班','还','关','山','闲','攀','斑','艰','奸','鳏','环','殷','颜','湾','鬟','菅','攀','般','搬','瘢','盘','蟠','磐','胖','瞒','馒','谩','鳗','满','曼','谩','漫'],
  ['先','前','年','天','连','烟','莲','怜','然','泉','轩','船','眠','圆','缘','原','言','传','千','钱','田','玄','悬','边','编','仙','鲜','鲜','绵','眠','颠','巅','滇','肩','坚','煎','笺','鞯','溅','戈','浅','笺','歼','监','缄','蒹','搛','缣','鹣','鲣','鞬'],
  ['萧','调','朝','霄','摇','遥','姚','桥','乔','侨','娇','骄','焦','椒','樵','谯','蕉','标','飙','瓢','苗','描','寥','辽','聊','撩','僚','镣','鹩','貂','凋','雕','碉','鲷','晓','宵','消','销','嚣','枭','骁','鸮','潇','逍','箫','霄','肖','魈','蛸','猇','虓'],
  ['肴','交','郊','茭','蛟','鲛','胶','教','酵','爻','肴','淆','崤','爻','淆','肴','教','狡','绞','佼','姣','皎','铰','挢','侨','峤','桥','荞','翘','窍','翘','愀'],
  ['豪','高','刀','遭','曹','槽','漕','螬','糟','糕','蒿','薅','号','嗥','貉','濠','壕','嚎','毫','嗥','蚝','蒿','薅','皋','羔','糕','槔','睾','篙','膏','刀','叨','忉','舠','鱽','刁','貂','碉','凋','雕','鲷','凋','雕'],
  ['歌','歌','波','河','和','何','荷','阿','哥','歌','戈','柯','珂','科','蝌','轲','疴','牁','磨','摩','魔','谟','摹','馍','膜','么','麽','蛾','鹅','讹','俄','娥','峨','莪','哦','鹕','讹','吪','多','罗','锣','螺','箩','骡','脶','猡','脶','啰','螺'],
  ['麻','家','花','华','霞','茶','蛇','瑕','芽','牙','邪','斜','嗟','车','遮','奢','赊','叉','沙','纱','瓜','爬','琶','杷','骅','衙','呀','丫','娃','洼','巴','疤','笆','芭','捌','粑','吧','拔','跋','魃','把','靶','爸','灞','罢','霸','坝','灞'],
  ['阳','光','王','长','黄','方','香','堂','章','张','常','霜','量','忘','郎','浪','茫','苍','仓','昌','创','装','妆','庄','床','觞','强','娘','良','凉','梁','粮','翔','祥','羊','扬','杨','洋','佯','刚','钢','纲','岗','港','杠','扛','亢','伉','闶','圹','纩','旷','况','矿','邝','贶'],
  ['庚','更','羹','坑','盲','萌','宏','红','虹','洪','鸿','泓','轰','亨','英','瑛','明','鸣','荣','莹','盈','萤','营','迎','婴','缨','樱','贞','桢','祯','京','惊','精','菁','清','晴','情','擎','卿','轻','生','声','笙','甥','牲','平','评','萍','苹','枰','兵','盟','名','铭','茗','冥','溟','暝','烹','澎','彭','膨','棚','蓬','篷','鹏','朋','堋','蟛','怦','抨','烹','砰砰'],
  ['青','听','亭','庭','廷','停','婷','霆','烃','汀','程','成','城','诚','承','乘','丞','惩','澄','征','峥','蒸','烝','凝','宁','屏','萍','苹','灵','龄','零','铃','玲','伶','苓','聆','囹','翎','瓴','蜓','丁','钉','仃','叮','町','厅','汀','庭','婷','馨','腥','星','醒','兴','惺','猩','刑','形','邢','型','硎'],
  ['蒸','蒸','烝','乘','承','丞','惩','澄','升','生','牲','笙','甥','绳','胜','兴','称','冰','凭','陵','凌','绫','菱','崚','鲮','竞','兢','矜','蒸','缯','罾','憎','曾','增','憎','矰','缯','甑','憎','僧','鬙','层','曾','嶒','增','赠'],
  ['尤','侯','秋','周','州','洲','舟','鸥','楼','愁','谋','眸','求','球','囚','丘','牛','浮','谋','矛','柔','揉','蹂','搜','飕','修','羞','馐','貅','收','鸠','赳','啾','阄','勾','钩','沟','篝','缑','楸','鳅','球','逑','遒','赇','巯','泅','仇','绸','稠','筹','酬','踌','畴','俦','惆','雠'],
  ['侵','深','心','林','金','琴','寻','音','阴','吟','今','襟','侵','针','斟','沉','岑','禽','擒','淋','霖','临','壬','妊','任','歆','森','禁','簪','愔','淫','淫','喑','愔','闇','谙','盦','埯','揞','暗','黯'],
  ['覃','潭','谭','覃','昙','谈','痰','探','郯','淡','啖','澹','瞻','詹','粘','沾','蟾','苫','钤','黔','钳','箝','拑','黔','钤','蚙','锓','枕','沈','审','甚','渗','葚','糁','碜','瘆'],
  ['盐','盐','檐','严','炎','淹','阉','恹','崦','腌','阉','压','押','狎','柙','匣','狎','胛','呷','侠','峡','狭','硖','赝','魇','餍','厌','恹','掩','眼','衍','演','淹','淹','焉','鄢','嫣','燕','言','筵','妍','研','岩','盐','檐','严','阎','炎','妍','蜒','颜','檐'],
  ['咸','咸','衔','帆','凡','矾','钒','烦','繁','樊','蕃','藩','璠','燔','蘩','蹯','梵','范','犯','饭','畈','贩','泛','范','梵','范','犯','饭','泛','畈','贩','帆','凡','矾','钒','烦','繁','樊','蕃','藩','璠','燔','蘩','蹯']
]

rhymeGroups.forEach((group, idx) => {
  group.forEach(char => {
    rhymeMap[char] = idx
  })
})

function detectTone(char: string): Tone {
  if (pingChars.has(char)) return 'ping'
  if (zeChars.has(char)) return 'ze'
  const code = char.charCodeAt(0)
  if (code >= 0x4e00 && code <= 0x9fff) {
    return (code % 2 === 0) ? 'ping' : 'ze'
  }
  return 'unknown'
}

function detectRhymeGroup(char: string): number {
  return rhymeMap[char] ?? -1
}

function classifyAntithesis(lineA: LineInfo, lineB: LineInfo): { type: AntithesisType, score: number } {
  let matches = 0
  const total = Math.min(lineA.chars.length, lineB.chars.length)
  
  for (let i = 0; i < total; i++) {
    const a = lineA.chars[i].tone
    const b = lineB.chars[i].tone
    if (a !== 'unknown' && b !== 'unknown' && a !== b) {
      matches++
    }
  }
  
  const ratio = total > 0 ? matches / total : 0
  
  if (ratio >= 0.85) return { type: 'strict', score: 5 }
  if (ratio >= 0.65) return { type: 'wide', score: 4 }
  if (ratio >= 0.45) return { type: 'borrowed', score: 3 }
  return { type: 'none', score: Math.max(1, Math.round(ratio * 4)) }
}

function calcPingzeMatch(lineA: LineInfo, lineB: LineInfo): number {
  let matches = 0
  const total = Math.min(lineA.chars.length, lineB.chars.length)
  
  for (let i = 0; i < total; i++) {
    const a = lineA.chars[i].tone
    const b = lineB.chars[i].tone
    if (a !== 'unknown' && b !== 'unknown' && a !== b) {
      matches++
    }
  }
  
  return total > 0 ? Math.round((matches / total) * 100) : 0
}

function detectForm(lineCount: number, charsPerLine: number[]): string {
  const avgChars = charsPerLine.reduce((a, b) => a + b, 0) / charsPerLine.length
  const is5 = Math.abs(avgChars - 5) < Math.abs(avgChars - 7)
  const chars = is5 ? '五言' : '七言'
  
  if (lineCount === 4) return chars + '绝句'
  if (lineCount === 8) return chars + '律诗'
  if (lineCount > 8) return chars + '排律'
  if (lineCount === 2) return chars + '联句'
  return chars + '诗'
}

function hslToString(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`
}

export function parsePoem(rawText: string, title?: string): PoemAnalysis {
  const lines = rawText
    .split(/[\n\r，。、,.!?！？；;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 12)
  
  const usedTitles = ['春望','登高','静夜思','春晓','登鹳雀楼','江雪','相思','出塞','悯农','咏柳']
  const poemTitle = title || usedTitles[Math.floor(Math.random() * usedTitles.length)]
  
  const rhymeGroupIndices: number[] = []
  const rhymeColorMap: Record<number, string> = {}
  
  const lineInfos: LineInfo[] = lines.map((text, lineIdx) => {
    const chars = text.split('').filter(c => /[\u4e00-\u9fff]/.test(c)).slice(0, 10)
    const lastChar = chars[chars.length - 1] || ''
    const isEvenLine = lineIdx % 2 === 1
    
    const charInfos: CharInfo[] = chars.map((c, charIdx) => {
      const rhymeG = detectRhymeGroup(c)
      let isRhyme = false
      let finalGroup = -1
      
      if (charIdx === chars.length - 1 && isEvenLine && rhymeG !== -1) {
        isRhyme = true
        finalGroup = rhymeG
        if (!rhymeGroupIndices.includes(rhymeG)) {
          rhymeGroupIndices.push(rhymeG)
        }
      }
      
      if (isEvenLine && charIdx === chars.length - 1) {
        isRhyme = true
        if (!rhymeGroupIndices.includes(lineIdx)) {
          rhymeGroupIndices.push(lineIdx)
        }
        finalGroup = lineIdx
      }
      
      return {
        char: c,
        tone: detectTone(c),
        isRhyme,
        rhymeGroup: finalGroup,
        lineIdx,
        charIdx
      }
    })
    
    return {
      text,
      chars: charInfos,
      pattern: charInfos.map(c => c.tone)
    }
  })
  
  const sortedGroups = [...rhymeGroupIndices].sort((a, b) => a - b)
  const baseHue = Math.random() * 60 + 180
  sortedGroups.forEach((g, i) => {
    const hue = (baseHue + i * 35) % 360
    rhymeColorMap[g] = hslToString(hue, 50, 80)
  })
  
  lineInfos.forEach(line => {
    line.chars.forEach(c => {
      if (c.isRhyme && c.rhymeGroup !== -1 && rhymeColorMap[c.rhymeGroup]) {
        c.rhymeGroup = sortedGroups.indexOf(c.rhymeGroup)
      } else if (c.isRhyme) {
        c.rhymeGroup = 0
      }
    })
  })
  
  const couplets: CoupletInfo[] = []
  for (let i = 0; i < lineInfos.length - 1; i += 2) {
    if (lineInfos[i + 1]) {
      const anti = classifyAntithesis(lineInfos[i], lineInfos[i + 1])
      couplets.push({
        idx: Math.floor(i / 2),
        lineA: lineInfos[i],
        lineB: lineInfos[i + 1],
        antithesis: anti.type,
        antithesisScore: anti.score,
        pingzeMatch: calcPingzeMatch(lineInfos[i], lineInfos[i + 1])
      })
    }
  }
  
  const rhymeGroupObjs: RhymeGroup[] = sortedGroups.map((g, i) => {
    const chars: string[] = []
    lineInfos.forEach(line => {
      line.chars.forEach(c => {
        if (c.isRhyme && sortedGroups.indexOf(c.rhymeGroup) === i) {
          chars.push(c.char)
        }
      })
    })
    return {
      group: i,
      chars: Array.from(new Set(chars)),
      count: chars.length,
      color: rhymeColorMap[g] || hslToString(baseHue + i * 35, 50, 80)
    }
  })
  
  let pingCount = 0
  let zeCount = 0
  lineInfos.forEach(line => {
    line.chars.forEach(c => {
      if (c.tone === 'ping') pingCount++
      else if (c.tone === 'ze') zeCount++
    })
  })
  
  const totalChars = pingCount + zeCount
  const rhymeChars = lineInfos.reduce((acc, l) => acc + l.chars.filter(c => c.isRhyme).length, 0)
  const rhymeDensity = totalChars > 0 ? Math.round((rhymeChars / totalChars) * 100) : 0
  
  const avgPingze = couplets.length > 0
    ? couplets.reduce((a, c) => a + c.pingzeMatch, 0) / couplets.length
    : 0
  const avgAnti = couplets.length > 0
    ? couplets.reduce((a, c) => a + c.antithesisScore, 0) / couplets.length
    : 3
  const overallScore = Math.round((avgPingze * 0.4 + rhymeDensity * 2 + avgAnti * 8))
  const clampedScore = Math.max(1, Math.min(5, Math.round(overallScore / 20)))
  
  return {
    title: poemTitle,
    lines: lineInfos,
    couplets,
    rhymeGroups: rhymeGroupObjs,
    totalChars,
    pingCount,
    zeCount,
    formType: detectForm(lines.length, lineInfos.map(l => l.chars.length)),
    rhymeDensity,
    overallScore: clampedScore
  }
}

export function recalcMetrics(analysis: PoemAnalysis): PoemAnalysis {
  let pingCount = 0
  let zeCount = 0
  analysis.lines.forEach(line => {
    line.chars.forEach(c => {
      if (c.tone === 'ping') pingCount++
      else if (c.tone === 'ze') zeCount++
    })
  })
  
  const couplets = analysis.couplets.map(c => ({
    ...c,
    pingzeMatch: calcPingzeMatch(c.lineA, c.lineB),
    ...(c => {
      const anti = classifyAntithesis(c.lineA, c.lineB)
      return { antithesis: anti.type, antithesisScore: anti.score }
    })(c)
  }))
  
  const totalChars = pingCount + zeCount
  const rhymeChars = analysis.lines.reduce((acc, l) => acc + l.chars.filter(cc => cc.isRhyme).length, 0)
  const rhymeDensity = totalChars > 0 ? Math.round((rhymeChars / totalChars) * 100) : 0
  
  const avgPingze = couplets.length > 0
    ? couplets.reduce((a, c) => a + c.pingzeMatch, 0) / couplets.length
    : 0
  const avgAnti = couplets.length > 0
    ? couplets.reduce((a, c) => a + c.antithesisScore, 0) / couplets.length
    : 3
  const overallScore = Math.round((avgPingze * 0.4 + rhymeDensity * 2 + avgAnti * 8))
  const clampedScore = Math.max(1, Math.min(5, Math.round(overallScore / 20)))
  
  return {
    ...analysis,
    lines: analysis.lines,
    couplets,
    pingCount,
    zeCount,
    totalChars,
    rhymeDensity,
    overallScore: clampedScore
  }
}
