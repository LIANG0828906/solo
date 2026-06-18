import { ConstellationTemplate } from '@/types'

export const CONSTELLATION_TEMPLATES: Omit<ConstellationTemplate, 'starIds' | 'correctOrder' | 'isUnlocked'>[] = [
  {
    id: 'big-dipper',
    name: '北斗七星',
    themeColor: '#FFD700',
    starCount: 7,
    story: '北斗七星位于大熊座，形如斗勺。古人以此辨方向、定季节。相传北斗注生，南斗注死，掌管人间生死寿夭。'
  },
  {
    id: 'orion',
    name: '猎户座',
    themeColor: '#00BFFF',
    starCount: 7,
    story: '猎户座是冬季最壮观的星座。希腊神话中，俄里翁是海神之子，因傲慢被天蝎杀死，宙斯将其升为星座。'
  },
  {
    id: 'cassiopeia',
    name: '仙后座',
    themeColor: '#FF69B4',
    starCount: 5,
    story: '仙后座呈W形，位于银河之中。仙后卡茜欧佩亚因自夸美貌触怒海神，被钉在天上永远旋转受罚。'
  },
  {
    id: 'leo',
    name: '狮子座',
    themeColor: '#FF8C00',
    starCount: 6,
    story: '狮子座代表尼米亚狮子，其皮毛刀枪不入。赫拉克勒斯完成十二试炼的首项便是将其扼死，升为星座。'
  },
  {
    id: 'scorpius',
    name: '天蝎座',
    themeColor: '#DC143C',
    starCount: 8,
    story: '天蝎座心宿二如燃烧的心脏。天蝎受赫拉派遣刺死俄里翁，二者被置于天空两端，永不相见。'
  },
  {
    id: 'ursa-minor',
    name: '小熊座',
    themeColor: '#E6E6FA',
    starCount: 7,
    story: '小熊座尾部末端是北极星。希腊神话中，宙斯将情人卡利斯托变为熊，其子误射时宙斯将母子升为大小熊座。'
  },
  {
    id: 'taurus',
    name: '金牛座',
    themeColor: '#DDA0DD',
    starCount: 5,
    story: '金牛座最亮星是毕宿五。宙斯化身为白牛掳走腓尼基公主欧罗巴，牛角高悬于夜空纪念这段情缘。'
  },
  {
    id: 'gemini',
    name: '双子座',
    themeColor: '#87CEEB',
    starCount: 6,
    story: '双子座代表卡斯托与波吕克斯兄弟。一人战死，另一人愿与兄弟共享永生，宙斯将他们升为星座。'
  },
  {
    id: 'sagittarius',
    name: '人马座',
    themeColor: '#98FB98',
    starCount: 8,
    story: '人马座呈半人半马弯弓射箭之姿。智者喀戎教导众多希腊英雄，死后被宙斯升为星座，指向银河中心。'
  },
  {
    id: 'virgo',
    name: '室女座',
    themeColor: '#F0E68C',
    starCount: 6,
    story: '室女座是正义女神阿斯特莉亚的化身。黄金时代结束后，众神离去，唯有她坚持到最后，化为处女星座。'
  }
]

export function generateConstellationTemplates(starIds: string[]): ConstellationTemplate[] {
  const shuffled = [...starIds].sort(() => Math.random() - 0.5)
  let index = 0

  return CONSTELLATION_TEMPLATES.map(template => {
    const constellationStarIds: string[] = []
    for (let i = 0; i < template.starCount; i++) {
      if (index < shuffled.length) {
        constellationStarIds.push(shuffled[index++])
      }
    }

    return {
      ...template,
      starIds: constellationStarIds,
      correctOrder: [...constellationStarIds],
      isUnlocked: false
    }
  })
}
