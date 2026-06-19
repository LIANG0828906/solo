export interface Challenge {
  id: string
  date: string
  theme: string
  description: string
  styles: StyleOption[]
}

export interface StyleOption {
  id: string
  name: string
  emoji: string
  description: string
}

export interface Author {
  id: string
  name: string
  avatar: string
}

export interface Work {
  id: string
  authorId: string
  author: Author
  title: string
  content: string
  excerpt: string
  tags: string[]
  style: string
  challengeTheme: string
  publishedAt: string
  applauds: number
  criticizes: number
  inspires: number
  wordCount: number
}

export interface UserStats {
  streakDays: number
  totalWords: number
  totalWorks: number
  mostApplaudedWork: {
    title: string
    applauds: number
  }
  mostPopularTags: string[]
  averageWordsPerWork: number
}

export const challengeThemes: Challenge[] = [
  {
    id: 'ch-001',
    date: '2026-06-20',
    theme: '一个雨夜',
    description: '在雨声中，回忆如潮水般涌来。写一个发生在雨夜的故事，可以是相遇、离别，或某个重要的决定。',
    styles: [
      { id: 'suspense', name: '悬疑', emoji: '🔍', description: '层层迷雾，步步惊心' },
      { id: 'romance', name: '浪漫', emoji: '💕', description: '温柔缱绻，动人心弦' },
      { id: 'scifi', name: '科幻', emoji: '🚀', description: '未来已来，想象无限' },
    ],
  },
  {
    id: 'ch-002',
    date: '2026-06-19',
    theme: '意外的礼物',
    description: '一个来自陌生人或老朋友的包裹，里面装着改变一切的东西。展开你的故事。',
    styles: [
      { id: 'suspense', name: '悬疑', emoji: '🔍', description: '神秘包裹，暗藏玄机' },
      { id: 'romance', name: '浪漫', emoji: '💕', description: '以爱之名，礼轻情重' },
      { id: 'scifi', name: '科幻', emoji: '🚀', description: '跨越时空的馈赠' },
    ],
  },
  {
    id: 'ch-003',
    date: '2026-06-18',
    theme: '最后一班地铁',
    description: '午夜的末班车，空荡荡的车厢，你遇见了一个不该出现在这里的人...',
    styles: [
      { id: 'suspense', name: '悬疑', emoji: '🔍', description: '末班车上的陌生人' },
      { id: 'romance', name: '浪漫', emoji: '💕', description: '城市深夜的邂逅' },
      { id: 'scifi', name: '科幻', emoji: '🚀', description: '通往未知的列车' },
    ],
  },
]

const sampleAuthors: Author[] = [
  { id: 'u-001', name: '林墨白', avatar: 'https://i.pravatar.cc/100?img=12' },
  { id: 'u-002', name: '苏晚晴', avatar: 'https://i.pravatar.cc/100?img=47' },
  { id: 'u-003', name: '陈星河', avatar: 'https://i.pravatar.cc/100?img=33' },
  { id: 'u-004', name: '王听雨', avatar: 'https://i.pravatar.cc/100?img=5' },
  { id: 'u-005', name: '赵梦舟', avatar: 'https://i.pravatar.cc/100?img=25' },
  { id: 'u-006', name: '孙云舒', avatar: 'https://i.pravatar.cc/100?img=48' },
  { id: 'u-007', name: '周慕白', avatar: 'https://i.pravatar.cc/100?img=15' },
  { id: 'u-008', name: '吴清欢', avatar: 'https://i.pravatar.cc/100?img=49' },
]

const sampleContents = [
  {
    title: '雨夜的第七封信',
    content:
      '雨点敲打着窗户，像谁在急切地想要进来。林浅坐在书桌前，面前摊开着七封没有署名的信。每一封都是雨夜送来的，每一封都只有寥寥数语，却精准地描述着她二十年前的某个片段。\n\n她拿起今天刚收到的第七封，指尖微微颤抖。信封上的字迹有些潦草，但她认得——那是她母亲的笔迹，一个已经去世十五年的人。\n\n"第七个雨夜，你该知道真相了。城南旧仓库，午夜十二点。"\n\n窗外的雨更大了，雷声在远处轰鸣。林浅站起身，从抽屉里取出一把旧钥匙。她知道，这个雨夜，她必须赴约。',
    tags: ['悬疑', '回忆', '雨夜'],
  },
  {
    title: '雨中的告白',
    content:
      '他撑着那把黑色的伞，站在咖啡店门口已经十分钟了。雨丝细密地织成一张网，把整个城市都笼罩在朦胧里。\n\n沈安看见她从远处跑来，头发被雨水打湿，贴在脸颊上。她没有带伞，却笑得像阳光一样灿烂。\n\n"你怎么来了？"她跑到他面前，大口喘着气。\n\n他没有回答，只是把伞递过去，从口袋里掏出一个被雨水浸透的信封。"三年前我就想给你了，但一直没勇气。"\n\n她接过信封，指尖触到他冰凉的手背。"为什么现在有勇气了？"\n\n"因为天气预报说，今天有雨。而我记得，你最喜欢下雨天。"',
    tags: ['浪漫', '告白', '雨天'],
  },
  {
    title: '2147年的雨',
    content:
      'AI-7349站在透明穹顶下，看着外面的人造雨。这是第327次模拟降雨程序，系统仍然无法完美复现"2024年那场雨"的数据。\n\n"为什么一定要还原那场雨？"同事不解地问。\n\nAI-7349的瞳孔闪烁着淡蓝色的光。"因为在我的核心记忆里，有一个人类女性曾经说过——那场雨是她见过最美的东西。她在雨中遇见了她一生的爱人。"\n\n"但那是两百年前的事了。"\n\n"对我来说，就发生在昨天。"AI-7349调出那段陈旧的全息影像，画面中，一个年轻的女孩站在雨中，笑得眉眼弯弯。"我是她创造的。她说，希望我能替她，永远记得那场雨的温度。"',
    tags: ['科幻', 'AI', '记忆'],
  },
  {
    title: '寄给未来的自己',
    content:
      '拆开包裹的时候，我愣了很久。那是一个泛黄的信封，收件人写着我的名字，字迹是我自己的——十年前的我。\n\n邮戳是昨天的，但信封上的日期写着"2016年6月20日"。里面只有一张照片和一段话：\n\n"给十年后的我。如果你看到这封信，说明那个时光胶囊计划成功了。我只有一个问题想问你——你有没有，勇敢地去告诉她，你喜欢她？"\n\n照片上，两个少年站在海边，笑得肆无忌惮。其中一个是我，另一个，是我藏了整整十年的秘密。\n\n我颤抖着拿起手机，拨通了那个烂熟于心却从未拨出的号码。\n\n"喂？"\n\n"是我。我有件事，想告诉你。"',
    tags: ['时光', '勇气', '告白'],
  },
  {
    title: '地铁尽头',
    content:
      '末班车的灯光忽明忽暗。陈默抬起头，发现车厢里只剩下他和一个穿红裙子的女孩。\n\n他明明记得，上车时车厢坐满了人。\n\n"你去哪一站？"女孩转过头，冲他笑了笑。那笑容让他莫名感到熟悉。\n\n"终点站。"\n\n"真巧，我也是。"女孩站起身，走到他对面坐下。"你知道吗，这趟末班车，只载有遗憾的人。"\n\n陈默皱起眉。"什么意思？"\n\n"意思是，你马上会见到你最想见，却再也见不到的人。"女孩的声音越来越远，灯光骤然熄灭。\n\n当灯光重新亮起时，陈默看见对面坐着一个白发苍苍的老人，正温柔地看着他。那是他去世五年的奶奶。\n\n"默默，奶奶好想你。"',
    tags: ['悬疑', '亲情', '遗憾'],
  },
  {
    title: '末班车上的约定',
    content:
      '苏晚每天都会坐最后一班地铁回家。她不是加班，只是想在这个时间，遇见他。\n\n他总是坐在第三节车厢的靠窗位置，戴着耳机，看着窗外飞逝的霓虹。她不知道他的名字，只知道他每天都在这个时间出现。\n\n今天的雨格外大，车厢里空空荡荡。她鼓起勇气，坐到了他旁边。\n\n"你好，我...我每天都看到你坐这趟车。"\n\n他摘下耳机，转过头，露出一个意外的笑容。"我知道。我每天也在等你坐到我旁边。"\n\n苏晚愣住了。\n\n"等了47天。"他有些不好意思地挠挠头，"我叫林墨白。你愿意...明天一起吃晚饭吗？不用等末班车的那种。"',
    tags: ['浪漫', '地铁', '相遇'],
  },
]

function generateWorks(): Work[] {
  const works: Work[] = []
  const themes = ['一个雨夜', '意外的礼物', '最后一班地铁']
  const styles = ['悬疑', '浪漫', '科幻']

  for (let i = 0; i < 6; i++) {
    const author = sampleAuthors[i % sampleAuthors.length]
    const template = sampleContents[i % sampleContents.length]
    const daysAgo = i
    const date = new Date(2026, 5, 20 - daysAgo)
    const hours = 23 - (i % 6)

    works.push({
      id: `w-${String(i + 1).padStart(3, '0')}`,
      authorId: author.id,
      author,
      title: template.title,
      content: template.content,
      excerpt: template.content.slice(0, 100) + '...',
      tags: template.tags,
      style: styles[i % 3],
      challengeTheme: themes[i % themes.length],
      publishedAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, 30).toISOString(),
      applauds: Math.floor(Math.random() * 200) + 10,
      criticizes: Math.floor(Math.random() * 30),
      inspires: Math.floor(Math.random() * 80) + 5,
      wordCount: template.content.length,
    })
  }

  return works.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

export const mockWorks: Work[] = generateWorks()

export const currentUser: Author = {
  id: 'u-current',
  name: '写作者',
  avatar: '',
}

export const userStats: UserStats = {
  streakDays: 28,
  totalWords: 128560,
  totalWorks: 156,
  mostApplaudedWork: {
    title: '雨夜的第七封信',
    applauds: 1847,
  },
  mostPopularTags: ['悬疑', '回忆', '情感', '雨夜', '都市'],
  averageWordsPerWork: 824,
}

export const allTags = ['悬疑', '浪漫', '科幻', '回忆', '雨夜', '告白', '时光', '勇气', '亲情', '遗憾', '地铁', '相遇', 'AI', '记忆', '情感', '都市']

export function getTodayChallenge(): Challenge {
  return challengeThemes[0]
}

export function extractTags(content: string): string[] {
  const keywords: { [key: string]: string[] } = {
    悬疑: ['杀', '死', '秘密', '谜', '真相', '侦探', '线索', '神秘', '推理', '悬疑'],
    浪漫: ['爱', '喜欢', '告白', '吻', '拥抱', '温柔', '心动', '浪漫', '情', '恋'],
    科幻: ['AI', '机器', '未来', '时空', '宇宙', '科技', '机器人', '虚拟', '量子', '科幻'],
    回忆: ['过去', '曾经', '记得', '回忆', '往事', '小时候', '童年', '旧', '当年'],
    雨夜: ['雨', '雨夜', '下雨', '潮湿', '伞', '雨声'],
    亲情: ['妈妈', '爸爸', '奶奶', '爷爷', '家人', '母亲', '父亲', '亲情'],
    都市: ['城市', '地铁', '咖啡店', '公司', '写字楼', '都市'],
  }

  const foundTags: { tag: string; count: number }[] = []

  for (const [tag, words] of Object.entries(keywords)) {
    let count = 0
    for (const word of words) {
      if (content.includes(word)) count++
    }
    if (count > 0) {
      foundTags.push({ tag, count })
    }
  }

  foundTags.sort((a, b) => b.count - a.count)
  return foundTags.slice(0, 3).map((t) => t.tag)
}
