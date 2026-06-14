import { randomUUID } from 'crypto'

export interface Book {
  id: string
  title: string
  author: string
  coverUrl: string
  description: string
  isbn: string
  addedAt: string
  totalChapters: number
}

export interface Member {
  id: string
  name: string
  avatar: string
}

export interface ReadingProgress {
  id: string
  memberId: string
  bookId: string
  currentChapter: number
  totalChapters: number
  status: 'not_started' | 'reading' | 'completed'
  updatedAt: string
}

export interface CheckIn {
  id: string
  memberId: string
  bookId: string
  chapter: number
  thought: string
  createdAt: string
}

export interface Topic {
  id: string
  bookId: string
  title: string
  creatorId: string
  createdAt: string
}

export interface Reply {
  id: string
  topicId: string
  memberId: string
  content: string
  mentionIds: string[]
  createdAt: string
}

export interface BookEvent {
  id: string
  bookId: string
  chapterRange: string
  suggestedTime: string
  adjustedTime: string
  status: 'suggested' | 'scheduled' | 'completed'
  createdAt: string
}

export interface Vote {
  id: string
  eventId: string
  memberId: string
  timeOption: string
  createdAt: string
}

const bookTitles = [
  '百年孤独', '活着', '红楼梦', '三体', '围城',
  '平凡的世界', '白夜行', '小王子', '追风筝的人', '挪威的森林',
  '人类简史', '时间简史', '1984', '动物农场', '了不起的盖茨比',
  '杀死一只知更鸟', '霍乱时期的爱情', '飘', '傲慢与偏见', '简爱',
  '呼啸山庄', '巴黎圣母院', '悲惨世界', '老人与海', '麦田里的守望者',
  '瓦尔登湖', '苏菲的世界', '月亮与六便士', '局外人', '变形记',
  '战争与和平', '安娜·卡列尼娜', '罪与罚', '卡拉马佐夫兄弟', '堂吉诃德',
  '神曲', '哈姆雷特', '浮士德', '沉思录', '理想国',
  '乡土中国', '万历十五年', '明朝那些事儿', '丝绸之路', '枪炮、病菌与钢铁',
  '乌合之众', '自私的基因', '思考，快与慢', '黑天鹅', '反脆弱',
  '原则', '穷查理宝典', '富爸爸穷爸爸', '从零到一', '创新者的窘境',
  '经济学原理', '国富论', '资本论', '博弈论与经济行为', '非暴力沟通',
  '影响力', '刻意练习', '心流', '少有人走的路', '被讨厌的勇气',
  '当下的力量', '禅与摩托车维修艺术', '崩溃', '基业长青', '高效能人士的七个习惯',
  '深度工作', '原子习惯', '终身成长', '刻意练习', '动机与人格',
  '社会心理学', '亲密关系', '爱的艺术', '存在与时间', '西西弗神话',
  '查拉图斯特拉如是说', '存在与虚无', '纯粹理性批判', '现象学导论', '逻辑哲学论',
  '道德经', '论语', '庄子', '孟子', '史记',
  '唐诗三百首', '宋词三百首', '古文观止', '聊斋志异', '儒林外史',
]

const bookAuthors = [
  '加西亚·马尔克斯', '余华', '曹雪芹', '刘慈欣', '钱锺书',
  '路遥', '东野圭吾', '圣埃克苏佩里', '卡勒德·胡赛尼', '村上春树',
  '尤瓦尔·赫拉利', '斯蒂芬·霍金', '乔治·奥威尔', '乔治·奥威尔', 'F·S·菲茨杰拉德',
  '哈珀·李', '加西亚·马尔克斯', '玛格丽特·米切尔', '简·奥斯汀', '夏洛蒂·勃朗特',
  '艾米莉·勃朗特', '维克多·雨果', '维克多·雨果', '欧内斯特·海明威', 'J·D·塞林格',
  '亨利·梭罗', '乔斯坦·贾德', '毛姆', '阿尔贝·加缪', '弗兰兹·卡夫卡',
  '列夫·托尔斯泰', '列夫·托尔斯泰', '陀思妥耶夫斯基', '陀思妥耶夫斯基', '塞万提斯',
  '但丁', '莎士比亚', '歌德', '马可·奥勒留', '柏拉图',
  '费孝通', '黄仁宇', '当年明月', '彼得·弗兰科潘', '贾雷德·戴蒙德',
  '古斯塔夫·勒庞', '理查德·道金斯', '丹尼尔·卡尼曼', '纳西姆·塔勒布', '纳西姆·塔勒布',
  '瑞·达利欧', '彼得·考夫曼', '罗伯特·清崎', '彼得·蒂尔', '克莱顿·克里斯坦森',
  '曼昆', '亚当·斯密', '卡尔·马克思', '冯·诺依曼', '马歇尔·卢森堡',
  '罗伯特·西奥迪尼', '安德斯·艾利克森', '米哈里', 'M·斯科特·派克', '岸见一郎',
  '埃克哈特·托利', '罗伯特·波西格', '贾雷德·戴蒙德', '吉姆·柯林斯', '史蒂芬·柯维',
  '卡尔·纽波特', '詹姆斯·克利尔', '卡罗尔·德韦克', '安德斯·艾利克森', '马斯洛',
  '戴维·迈尔斯', '罗兰·米勒', '弗洛姆', '海德格尔', '加缪',
  '尼采', '萨特', '康德', '胡塞尔', '维特根斯坦',
  '老子', '孔子', '庄子', '孟子', '司马迁',
  '蘅塘退士', '朱孝臧', '吴楚材', '蒲松龄', '吴敬梓',
]

const descriptions = [
  '一部震撼人心的经典之作，探讨了人类存在的根本问题。',
  '这本书以独特的视角审视了社会与个人的关系，引人深思。',
  '作者用细腻的笔触描绘了一个令人难忘的故事，值得一读。',
  '跨越时空的经典，每一次重读都会有新的感悟。',
  '这本书改变了无数人看待世界的方式，具有深远的影响力。',
  '一部充满智慧与洞察的著作，是每个读者的必读书目。',
  '作者以深刻的人文关怀，书写了动人心弦的篇章。',
  '这本书以其独特的叙事风格和深刻的主题而广受赞誉。',
  '一段关于成长与自我发现的旅程，触动了无数读者的心。',
  '这本书是文学史上的一座丰碑，影响了后世无数作家。',
]

const memberNames = [
  '张三', '李四', '王五', '赵六', '孙七',
  '周八', '吴九', '郑十', '钱一一', '陈二二',
]

const checkInThoughts = [
  '这一章写得真好，引人入胜。',
  '有些地方不太好理解，需要再读一遍。',
  '作者的视角很独特，给我很大启发。',
  '故事情节跌宕起伏，让人欲罢不能。',
  '这段描写太精彩了，忍不住反复品味。',
  '终于理解了前面的伏笔，豁然开朗。',
  '人物塑造非常立体，仿佛就活在眼前。',
  '节奏把握得恰到好处，读起来很舒服。',
  '这里有个细节很有意思，值得深思。',
  '读到这里感觉整个人都被打动了。',
]

function randomDate(start: Date, end: Date): string {
  const ts = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  return new Date(ts).toISOString()
}

function generateISBN(): string {
  const parts = ['978']
  for (let g = 0; g < 3; g++) {
    let seg = ''
    for (let d = 0; d < 4; d++) {
      seg += Math.floor(Math.random() * 10)
    }
    parts.push(seg)
  }
  return parts.join('-')
}

const books: Book[] = Array.from({ length: 100 }, (_, i) => ({
  id: randomUUID(),
  title: bookTitles[i],
  author: bookAuthors[i],
  coverUrl: `https://picsum.photos/seed/book${i}/200/280`,
  description: descriptions[i % descriptions.length],
  isbn: generateISBN(),
  addedAt: randomDate(new Date('2024-01-01'), new Date('2025-06-01')),
  totalChapters: 10 + Math.floor(Math.random() * 30),
}))

const members: Member[] = Array.from({ length: 10 }, (_, i) => ({
  id: randomUUID(),
  name: memberNames[i],
  avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
}))

const readingProgress: ReadingProgress[] = []
for (const member of members) {
  const bookIndices = new Set<number>()
  while (bookIndices.size < 8 + Math.floor(Math.random() * 10)) {
    bookIndices.add(Math.floor(Math.random() * books.length))
  }
  for (const bi of bookIndices) {
    const book = books[bi]
    const currentChapter = Math.floor(Math.random() * (book.totalChapters + 1))
    let status: ReadingProgress['status'] = 'not_started'
    if (currentChapter > 0 && currentChapter < book.totalChapters) status = 'reading'
    else if (currentChapter >= book.totalChapters) status = 'completed'
    readingProgress.push({
      id: randomUUID(),
      memberId: member.id,
      bookId: book.id,
      currentChapter,
      totalChapters: book.totalChapters,
      status,
      updatedAt: randomDate(new Date('2025-01-01'), new Date('2025-06-01')),
    })
  }
}

const checkIns: CheckIn[] = []
for (let i = 0; i < 60; i++) {
  const member = members[Math.floor(Math.random() * members.length)]
  const book = books[Math.floor(Math.random() * books.length)]
  checkIns.push({
    id: randomUUID(),
    memberId: member.id,
    bookId: book.id,
    chapter: 1 + Math.floor(Math.random() * book.totalChapters),
    thought: checkInThoughts[Math.floor(Math.random() * checkInThoughts.length)],
    createdAt: randomDate(new Date('2025-01-01'), new Date('2025-06-01')),
  })
}
checkIns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

const topics: Topic[] = []
for (let i = 0; i < 25; i++) {
  const book = books[Math.floor(Math.random() * books.length)]
  const creator = members[Math.floor(Math.random() * members.length)]
  topics.push({
    id: randomUUID(),
    bookId: book.id,
    title: `关于《${book.title}》的讨论：${['人物分析', '主题探讨', '情节讨论', '读后感悟', '精彩摘录'][i % 5]}`,
    creatorId: creator.id,
    createdAt: randomDate(new Date('2025-01-01'), new Date('2025-06-01')),
  })
}

const replies: Reply[] = []
for (const topic of topics) {
  const replyCount = 1 + Math.floor(Math.random() * 5)
  for (let r = 0; r < replyCount; r++) {
    const replier = members[Math.floor(Math.random() * members.length)]
    const mentionCount = Math.random() > 0.5 ? 1 : 0
    const mentionIds: string[] = []
    for (let m = 0; m < mentionCount; m++) {
      const mentioned = members[Math.floor(Math.random() * members.length)]
      if (mentioned.id !== replier.id) mentionIds.push(mentioned.id)
    }
    replies.push({
      id: randomUUID(),
      topicId: topic.id,
      memberId: replier.id,
      content: ['说得太好了，深有同感！', '我有不同的看法，觉得还可以这样理解。', '这个角度很新颖，学到了。', '补充一点，书中还有类似的情节。', '完全同意，这段确实很精彩。'][r % 5],
      mentionIds,
      createdAt: randomDate(new Date(topic.createdAt), new Date('2025-06-15')),
    })
  }
}

const events: BookEvent[] = []
for (let i = 0; i < 12; i++) {
  const book = books[Math.floor(Math.random() * books.length)]
  const startCh = 1 + Math.floor(Math.random() * (book.totalChapters - 3))
  const endCh = startCh + 2 + Math.floor(Math.random() * 3)
  const statusOpts: BookEvent['status'][] = ['suggested', 'scheduled', 'completed']
  events.push({
    id: randomUUID(),
    bookId: book.id,
    chapterRange: `第${startCh}-${Math.min(endCh, book.totalChapters)}章`,
    suggestedTime: randomDate(new Date('2025-06-10'), new Date('2025-06-20')),
    adjustedTime: randomDate(new Date('2025-06-15'), new Date('2025-06-30')),
    status: statusOpts[i % 3],
    createdAt: randomDate(new Date('2025-05-01'), new Date('2025-06-01')),
  })
}

const votes: Vote[] = []
for (const ev of events) {
  const voterCount = 2 + Math.floor(Math.random() * 6)
  const timeOptions = ['周六上午', '周六下午', '周日上午', '周日下午', '工作日晚上']
  for (let v = 0; v < voterCount; v++) {
    const voter = members[Math.floor(Math.random() * members.length)]
    votes.push({
      id: randomUUID(),
      eventId: ev.id,
      memberId: voter.id,
      timeOption: timeOptions[Math.floor(Math.random() * timeOptions.length)],
      createdAt: randomDate(new Date(ev.createdAt), new Date('2025-06-15')),
    })
  }
}

export const dataStore = {
  books: {
    getAll: (): Book[] => [...books],
    getById: (id: string): Book | undefined => books.find(b => b.id === id),
    create: (data: Omit<Book, 'id' | 'addedAt'>): Book => {
      const book: Book = { ...data, id: randomUUID(), addedAt: new Date().toISOString() }
      books.push(book)
      return book
    },
    update: (id: string, data: Partial<Book>): Book | undefined => {
      const idx = books.findIndex(b => b.id === id)
      if (idx === -1) return undefined
      books[idx] = { ...books[idx], ...data }
      return books[idx]
    },
  },
  members: {
    getAll: (): Member[] => [...members],
    getById: (id: string): Member | undefined => members.find(m => m.id === id),
  },
  readingProgress: {
    getByBookId: (bookId: string): ReadingProgress[] => readingProgress.filter(p => p.bookId === bookId),
    getByMemberId: (memberId: string): ReadingProgress[] => readingProgress.filter(p => p.memberId === memberId),
    upsert: (memberId: string, bookId: string, currentChapter: number, totalChapters: number): ReadingProgress => {
      const idx = readingProgress.findIndex(p => p.memberId === memberId && p.bookId === bookId)
      let status: ReadingProgress['status'] = 'reading'
      if (currentChapter <= 0) status = 'not_started'
      else if (currentChapter >= totalChapters) status = 'completed'
      if (idx !== -1) {
        readingProgress[idx] = { ...readingProgress[idx], currentChapter, totalChapters, status, updatedAt: new Date().toISOString() }
        return readingProgress[idx]
      }
      const progress: ReadingProgress = {
        id: randomUUID(), memberId, bookId, currentChapter, totalChapters, status, updatedAt: new Date().toISOString(),
      }
      readingProgress.push(progress)
      return progress
    },
  },
  checkIns: {
    getByBookId: (bookId: string): CheckIn[] => checkIns.filter(c => c.bookId === bookId),
    create: (data: Omit<CheckIn, 'id' | 'createdAt'>): CheckIn => {
      const ci: CheckIn = { ...data, id: randomUUID(), createdAt: new Date().toISOString() }
      checkIns.unshift(ci)
      return ci
    },
  },
  topics: {
    getAll: (bookId?: string): Topic[] => {
      const result = bookId ? topics.filter(t => t.bookId === bookId) : [...topics]
      return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    getById: (id: string): Topic | undefined => topics.find(t => t.id === id),
    create: (data: Omit<Topic, 'id' | 'createdAt'>): Topic => {
      const topic: Topic = { ...data, id: randomUUID(), createdAt: new Date().toISOString() }
      topics.unshift(topic)
      return topic
    },
  },
  replies: {
    getByTopicId: (topicId: string): Reply[] => replies.filter(r => r.topicId === topicId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    create: (data: Omit<Reply, 'id' | 'createdAt'>): Reply => {
      const reply: Reply = { ...data, id: randomUUID(), createdAt: new Date().toISOString() }
      replies.push(reply)
      return reply
    },
  },
  events: {
    getAll: (): BookEvent[] => [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    getById: (id: string): BookEvent | undefined => events.find(e => e.id === id),
    create: (data: Omit<BookEvent, 'id' | 'createdAt'>): BookEvent => {
      const ev: BookEvent = { ...data, id: randomUUID(), createdAt: new Date().toISOString() }
      events.unshift(ev)
      return ev
    },
  },
  votes: {
    getByEventId: (eventId: string): Vote[] => votes.filter(v => v.eventId === eventId),
    create: (data: Omit<Vote, 'id' | 'createdAt'>): Vote => {
      const existing = votes.findIndex(v => v.eventId === data.eventId && v.memberId === data.memberId && v.timeOption === data.timeOption)
      if (existing !== -1) return votes[existing]
      const vote: Vote = { ...data, id: randomUUID(), createdAt: new Date().toISOString() }
      votes.push(vote)
      return vote
    },
  },
}
