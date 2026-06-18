import { create } from 'zustand'

export type Category = '文学' | '科学' | '历史' | '艺术' | '技术'
export type ReservationStatus = 'reserved' | 'picked_up' | 'returned'

export interface Book {
  id: string
  title: string
  author: string
  category: Category
  cover: string
  description: string
  totalCopies: number
  reservedCopies: number
}

export interface Reservation {
  id: string
  bookId: string
  userId: string
  status: ReservationStatus
  createdAt: string
}

export interface Review {
  id: string
  bookId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export const CATEGORIES: Category[] = ['文学', '科学', '历史', '艺术', '技术']

const imgBase = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image'

const initialBooks: Book[] = [
  {
    id: 'b1',
    title: '红楼梦',
    author: '曹雪芹',
    category: '文学',
    cover: `${imgBase}?prompt=classic%20Chinese%20novel%20book%20cover%20red%20mansion%20elegant%20traditional%20painting%20style&image_size=portrait_4_3`,
    description: '中国古典四大名著之首，以贾宝玉、林黛玉、薛宝钗的爱情悲剧为主线，展现封建大家族的兴衰史。',
    totalCopies: 5,
    reservedCopies: 2,
  },
  {
    id: 'b2',
    title: '活着',
    author: '余华',
    category: '文学',
    cover: `${imgBase}?prompt=contemporary%20Chinese%20novel%20book%20cover%20farmland%20sunset%20melancholy%20minimalist&image_size=portrait_4_3`,
    description: '讲述了农村人福贵悲惨的人生遭遇，在历史洪流中坚韧地活着的故事。',
    totalCopies: 3,
    reservedCopies: 1,
  },
  {
    id: 'b3',
    title: '围城',
    author: '钱钟书',
    category: '文学',
    cover: `${imgBase}?prompt=satirical%20novel%20book%20cover%20walled%20city%20vintage%20illustration%20warm%20tones&image_size=portrait_4_3`,
    description: '以抗战时期为背景，描写知识分子方鸿渐的婚恋与事业困境，揭示人生围城困境。',
    totalCopies: 4,
    reservedCopies: 3,
  },
  {
    id: 'b4',
    title: '平凡的世界',
    author: '路遥',
    category: '文学',
    cover: `${imgBase}?prompt=epic%20Chinese%20novel%20book%20cover%20loess%20plateau%20landscape%20golden%20wheat&image_size=portrait_4_3`,
    description: '以中国70年代中期到80年代中期为背景，讲述了普通人面对困境不屈不挠的故事。',
    totalCopies: 3,
    reservedCopies: 0,
  },
  {
    id: 'b5',
    title: '白鹿原',
    author: '陈忠实',
    category: '文学',
    cover: `${imgBase}?prompt=Chinese%20literary%20novel%20book%20cover%20white%20deer%20plain%20ink%20painting&image_size=portrait_4_3`,
    description: '以白鹿原上白鹿村为背景，讲述白姓和鹿姓两大家族祖祖辈辈的恩怨纷争。',
    totalCopies: 2,
    reservedCopies: 2,
  },
  {
    id: 'b6',
    title: '边城',
    author: '沈从文',
    category: '文学',
    cover: `${imgBase}?prompt=lyrical%20novel%20book%20cover%20riverside%20town%20misty%20watercolor&image_size=portrait_4_3`,
    description: '以湘西边城茶峒为背景，描写了船家少女翠翠的纯爱故事，展现优美的人性。',
    totalCopies: 4,
    reservedCopies: 1,
  },
  {
    id: 'b7',
    title: '时间简史',
    author: '史蒂芬·霍金',
    category: '科学',
    cover: `${imgBase}?prompt=science%20book%20cover%20universe%20cosmos%20stars%20galaxy%20dark%20blue&image_size=portrait_4_3`,
    description: '霍金用通俗语言解释宇宙的起源、黑洞、时间旅行等深奥的宇宙学问题。',
    totalCopies: 6,
    reservedCopies: 2,
  },
  {
    id: 'b8',
    title: '基因传',
    author: '悉达多·穆克吉',
    category: '科学',
    cover: `${imgBase}?prompt=genetics%20science%20book%20cover%20DNA%20double%20helix%20blue%20glowing&image_size=portrait_4_3`,
    description: '从基因的发现到基因编辑，全面讲述遗传学的发展历程与未来。',
    totalCopies: 3,
    reservedCopies: 0,
  },
  {
    id: 'b9',
    title: '宇宙的琴弦',
    author: '布莱恩·格林',
    category: '科学',
    cover: `${imgBase}?prompt=physics%20book%20cover%20string%20theory%20vibrating%20strings%20cosmic&image_size=portrait_4_3`,
    description: '以生动笔触讲述弦理论如何统一自然界基本力，揭示宇宙深层结构。',
    totalCopies: 2,
    reservedCopies: 1,
  },
  {
    id: 'b10',
    title: '物种起源',
    author: '查尔斯·达尔文',
    category: '科学',
    cover: `${imgBase}?prompt=classic%20science%20book%20cover%20evolution%20tree%20of%20life%20vintage&image_size=portrait_4_3`,
    description: '达尔文阐述自然选择理论的经典著作，奠定了现代进化生物学的基础。',
    totalCopies: 4,
    reservedCopies: 2,
  },
  {
    id: 'b11',
    title: '从一到无穷大',
    author: '乔治·伽莫夫',
    category: '科学',
    cover: `${imgBase}?prompt=mathematics%20science%20book%20cover%20infinity%20numbers%20geometric&image_size=portrait_4_3`,
    description: '用通俗易懂的语言讲述数学、物理学和生物学中令人惊叹的知识。',
    totalCopies: 3,
    reservedCopies: 1,
  },
  {
    id: 'b12',
    title: '费曼物理学讲义',
    author: '理查德·费曼',
    category: '科学',
    cover: `${imgBase}?prompt=physics%20textbook%20cover%20feynman%20diagrams%20chalkboard&image_size=portrait_4_3`,
    description: '费曼在加州理工学院的物理学入门讲义，被誉为物理学教育的经典。',
    totalCopies: 2,
    reservedCopies: 0,
  },
  {
    id: 'b13',
    title: '万历十五年',
    author: '黄仁宇',
    category: '历史',
    cover: `${imgBase}?prompt=history%20book%20cover%20Ming%20dynasty%20palace%20traditional%20Chinese&image_size=portrait_4_3`,
    description: '以1587年为切入点，剖析明朝晚期的政治、经济与文化困境。',
    totalCopies: 5,
    reservedCopies: 3,
  },
  {
    id: 'b14',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    category: '历史',
    cover: `${imgBase}?prompt=history%20book%20cover%20human%20evolution%20silhouette%20modern&image_size=portrait_4_3`,
    description: '从认知革命到科学革命，讲述智人如何登上食物链顶端。',
    totalCopies: 4,
    reservedCopies: 1,
  },
  {
    id: 'b15',
    title: '明朝那些事儿',
    author: '当年明月',
    category: '历史',
    cover: `${imgBase}?prompt=Chinese%20history%20book%20cover%20Ming%20dynasty%20warriors%20dramatic&image_size=portrait_4_3`,
    description: '以幽默生动的笔法讲述明朝三百年的兴亡史，让历史不再枯燥。',
    totalCopies: 6,
    reservedCopies: 4,
  },
  {
    id: 'b16',
    title: '史记',
    author: '司马迁',
    category: '历史',
    cover: `${imgBase}?prompt=ancient%20Chinese%20history%20book%20cover%20bamboo%20slips%20calligraphy&image_size=portrait_4_3`,
    description: '中国第一部纪传体通史，记载了从黄帝到汉武帝约三千年的历史。',
    totalCopies: 3,
    reservedCopies: 2,
  },
  {
    id: 'b17',
    title: '枪炮、病菌与钢铁',
    author: '贾雷德·戴蒙德',
    category: '历史',
    cover: `${imgBase}?prompt=civilization%20history%20book%20cover%20world%20map%20weapons&image_size=portrait_4_3`,
    description: '探讨人类社会发展的不平等根源，解释为何各大洲发展轨迹截然不同。',
    totalCopies: 3,
    reservedCopies: 0,
  },
  {
    id: 'b18',
    title: '中国通史',
    author: '吕思勉',
    category: '历史',
    cover: `${imgBase}?prompt=Chinese%20general%20history%20book%20cover%20scroll%20painting&image_size=portrait_4_3`,
    description: '系统梳理中国从远古到近代的历史脉络，是了解中国历史的经典入门读物。',
    totalCopies: 4,
    reservedCopies: 1,
  },
  {
    id: 'b19',
    title: '艺术的故事',
    author: '贡布里希',
    category: '艺术',
    cover: `${imgBase}?prompt=art%20history%20book%20cover%20painting%20brush%20colorful&image_size=portrait_4_3`,
    description: '西方艺术史入门经典，从史前洞穴壁画到现代艺术，讲述艺术发展脉络。',
    totalCopies: 3,
    reservedCopies: 1,
  },
  {
    id: 'b20',
    title: '美的历程',
    author: '李泽厚',
    category: '艺术',
    cover: `${imgBase}?prompt=Chinese%20aesthetics%20book%20cover%20ink%20landscape%20contemplative&image_size=portrait_4_3`,
    description: '从远古图腾到明清文艺，全面梳理中国美学的演变历程。',
    totalCopies: 2,
    reservedCopies: 0,
  },
  {
    id: 'b21',
    title: '设计中的设计',
    author: '原研哉',
    category: '艺术',
    cover: `${imgBase}?prompt=design%20book%20cover%20minimalist%20white%20space%20Japanese&image_size=portrait_4_3`,
    description: '日本设计大师原研哉对设计本质的深刻思考，探索日常生活中的设计之美。',
    totalCopies: 4,
    reservedCopies: 2,
  },
  {
    id: 'b22',
    title: '写给大家看的设计书',
    author: '威廉姆斯',
    category: '艺术',
    cover: `${imgBase}?prompt=design%20principles%20book%20cover%20colorful%20typography%20layout&image_size=portrait_4_3`,
    description: '以通俗语言讲解设计的四大基本原则：亲密性、对齐、重复和对比。',
    totalCopies: 5,
    reservedCopies: 3,
  },
  {
    id: 'b23',
    title: '配色设计原理',
    author: '伊達千尋',
    category: '艺术',
    cover: `${imgBase}?prompt=color%20theory%20book%20cover%20color%20palette%20swatches%20vibrant&image_size=portrait_4_3`,
    description: '系统讲解色彩搭配的基本原理和实用技巧，帮助提升配色能力。',
    totalCopies: 3,
    reservedCopies: 1,
  },
  {
    id: 'b24',
    title: '艺术与视知觉',
    author: '鲁道夫·阿恩海姆',
    category: '艺术',
    cover: `${imgBase}?prompt=art%20perception%20book%20cover%20visual%20illusion%20optical&image_size=portrait_4_3`,
    description: '从心理学角度分析视觉艺术，探讨人类如何感知和理解艺术作品。',
    totalCopies: 2,
    reservedCopies: 0,
  },
  {
    id: 'b25',
    title: '代码大全',
    author: '史蒂夫·迈克康奈尔',
    category: '技术',
    cover: `${imgBase}?prompt=programming%20book%20cover%20code%20on%20screen%20blue%20digital&image_size=portrait_4_3`,
    description: '软件构建的百科全书，涵盖从设计到编码到测试的全方位实践指南。',
    totalCopies: 4,
    reservedCopies: 2,
  },
  {
    id: 'b26',
    title: '设计模式',
    author: 'GoF',
    category: '技术',
    cover: `${imgBase}?prompt=software%20design%20patterns%20book%20cover%20geometric%20abstract&image_size=portrait_4_3`,
    description: '面向对象设计的经典著作，总结了23种设计模式，是软件工程师必读之书。',
    totalCopies: 3,
    reservedCopies: 1,
  },
  {
    id: 'b27',
    title: '算法导论',
    author: 'CLRS',
    category: '技术',
    cover: `${imgBase}?prompt=algorithms%20textbook%20cover%20sorting%20network%20graph&image_size=portrait_4_3`,
    description: '计算机科学领域最权威的算法教材，系统讲解算法设计与分析。',
    totalCopies: 3,
    reservedCopies: 2,
  },
  {
    id: 'b28',
    title: '人月神话',
    author: '弗雷德里克·布鲁克斯',
    category: '技术',
    cover: `${imgBase}?prompt=software%20engineering%20book%20cover%20project%20management&image_size=portrait_4_3`,
    description: '软件工程管理经典，探讨大型软件项目开发中人与管理的深层问题。',
    totalCopies: 2,
    reservedCopies: 0,
  },
  {
    id: 'b29',
    title: '黑客与画家',
    author: '保罗·格雷厄姆',
    category: '技术',
    cover: `${imgBase}?prompt=hacker%20painter%20book%20cover%20creative%20coding%20artistic&image_size=portrait_4_3`,
    description: '硅谷创业教父的文集，探讨编程、创业与创造力的深层联系。',
    totalCopies: 4,
    reservedCopies: 1,
  },
  {
    id: 'b30',
    title: '深度学习',
    author: '伊恩·古德费洛',
    category: '技术',
    cover: `${imgBase}?prompt=deep%20learning%20AI%20book%20cover%20neural%20network%20glowing&image_size=portrait_4_3`,
    description: '深度学习领域的权威教材，从基础数学到前沿研究全面覆盖。',
    totalCopies: 3,
    reservedCopies: 3,
  },
]

function generatePastDates(days: number): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

const pastDates = generatePastDates(7)

const initialReservations: Reservation[] = [
  { id: 'r1', bookId: 'b1', userId: 'user1', status: 'reserved', createdAt: pastDates[0] },
  { id: 'r2', bookId: 'b3', userId: 'user1', status: 'picked_up', createdAt: pastDates[1] },
  { id: 'r3', bookId: 'b7', userId: 'user1', status: 'returned', createdAt: pastDates[2] },
  { id: 'r4', bookId: 'b13', userId: 'user1', status: 'reserved', createdAt: pastDates[3] },
  { id: 'r5', bookId: 'b2', userId: 'user2', status: 'reserved', createdAt: pastDates[0] },
  { id: 'r6', bookId: 'b15', userId: 'user2', status: 'picked_up', createdAt: pastDates[1] },
  { id: 'r7', bookId: 'b10', userId: 'user2', status: 'returned', createdAt: pastDates[4] },
  { id: 'r8', bookId: 'b22', userId: 'user1', status: 'returned', createdAt: pastDates[5] },
  { id: 'r9', bookId: 'b25', userId: 'user2', status: 'reserved', createdAt: pastDates[6] },
  { id: 'r10', bookId: 'b15', userId: 'user1', status: 'reserved', createdAt: pastDates[6] },
  { id: 'r11', bookId: 'b30', userId: 'user1', status: 'reserved', createdAt: pastDates[2] },
  { id: 'r12', bookId: 'b27', userId: 'user2', status: 'picked_up', createdAt: pastDates[3] },
  { id: 'r13', bookId: 'b3', userId: 'user2', status: 'reserved', createdAt: pastDates[5] },
  { id: 'r14', bookId: 'b22', userId: 'user2', status: 'reserved', createdAt: pastDates[4] },
  { id: 'r15', bookId: 'b13', userId: 'user2', status: 'reserved', createdAt: pastDates[6] },
  { id: 'r16', bookId: 'b25', userId: 'user1', status: 'picked_up', createdAt: pastDates[1] },
  { id: 'r17', bookId: 'b7', userId: 'user2', status: 'reserved', createdAt: pastDates[2] },
  { id: 'r18', bookId: 'b1', userId: 'user2', status: 'reserved', createdAt: pastDates[0] },
]

const initialReviews: Review[] = [
  { id: 'rev1', bookId: 'b1', userId: 'user2', userName: '李明', rating: 5, comment: '中国文学的巅峰之作，每次重读都有新的感悟。曹雪芹对人性的洞察令人叹服。', createdAt: '2026-06-15T10:30:00Z' },
  { id: 'rev2', bookId: 'b1', userId: 'user3', userName: '王芳', rating: 4, comment: '人物塑造细腻入微，情节跌宕起伏，不愧为经典。就是篇幅太长，需要耐心。', createdAt: '2026-06-14T14:20:00Z' },
  { id: 'rev3', bookId: 'b2', userId: 'user2', userName: '李明', rating: 5, comment: '读完久久不能平静，余华用最朴素的语言写出了最深沉的苦难与坚韧。', createdAt: '2026-06-13T09:15:00Z' },
  { id: 'rev4', bookId: 'b7', userId: 'user3', userName: '王芳', rating: 4, comment: '霍金真的很擅长把复杂的物理概念讲得通俗易懂，虽然后半部分还是有点难懂。', createdAt: '2026-06-12T16:45:00Z' },
  { id: 'rev5', bookId: 'b13', userId: 'user1', userName: '张伟', rating: 5, comment: '大历史观的典范之作，从细微处见宏大，令人叹为观止。', createdAt: '2026-06-11T11:00:00Z' },
  { id: 'rev6', bookId: 'b14', userId: 'user2', userName: '李明', rating: 4, comment: '视角独特，发人深省。虽然部分论点有争议，但确实拓宽了思维边界。', createdAt: '2026-06-10T08:30:00Z' },
  { id: 'rev7', bookId: 'b15', userId: 'user3', userName: '王芳', rating: 5, comment: '历史原来可以这么有趣！当年明月让三百年明朝史变成了精彩的故事。', createdAt: '2026-06-09T20:15:00Z' },
  { id: 'rev8', bookId: 'b19', userId: 'user1', userName: '张伟', rating: 4, comment: '艺术史入门的最佳选择，贡布里希的文字优雅而清晰，读起来很享受。', createdAt: '2026-06-08T13:40:00Z' },
  { id: 'rev9', bookId: 'b25', userId: 'user2', userName: '李明', rating: 5, comment: '每个程序员都应该读这本书，写代码的质量会明显提升。', createdAt: '2026-06-07T15:20:00Z' },
  { id: 'rev10', bookId: 'b29', userId: 'user1', userName: '张伟', rating: 4, comment: '格雷厄姆的思维方式很有启发性，编程和创造力的关系讲得很透彻。', createdAt: '2026-06-06T10:10:00Z' },
  { id: 'rev11', bookId: 'b3', userId: 'user3', userName: '王芳', rating: 5, comment: '钱钟书的讽刺入木三分，读完对人生有了更深的理解。', createdAt: '2026-06-05T17:30:00Z' },
  { id: 'rev12', bookId: 'b22', userId: 'user1', userName: '张伟', rating: 4, comment: '设计入门好书，四大原则讲解清晰，案例丰富实用。', createdAt: '2026-06-04T12:00:00Z' },
  { id: 'rev13', bookId: 'b30', userId: 'user2', userName: '李明', rating: 4, comment: '内容很硬核，需要一定的数学基础，但确实是深度学习领域最权威的教材。', createdAt: '2026-06-03T09:45:00Z' },
  { id: 'rev14', bookId: 'b4', userId: 'user3', userName: '王芳', rating: 5, comment: '平凡人的不平凡故事，读后深受感动，路遥的文字朴实却充满力量。', createdAt: '2026-06-02T14:30:00Z' },
  { id: 'rev15', bookId: 'b21', userId: 'user1', userName: '张伟', rating: 5, comment: '原研哉对设计的理解让人豁然开朗，原来设计不只是装饰，更是思考。', createdAt: '2026-06-01T16:20:00Z' },
]

interface LibraryState {
  books: Book[]
  reservations: Reservation[]
  reviews: Review[]
  currentUser: { id: string; name: string; avatar: string }
  getFilteredBooks: (category?: Category, search?: string) => Book[]
  getBookById: (id: string) => Book | undefined
  createReservation: (bookId: string) => Reservation | null
  cancelReservation: (reservationId: string) => boolean
  updateReservationStatus: (reservationId: string, status: ReservationStatus) => boolean
  getUserReservations: () => Reservation[]
  getBookReviews: (bookId: string) => Review[]
  addReview: (bookId: string, rating: number, comment: string) => Review
  getBookAverageRating: (bookId: string) => number
  getReservationStats: () => { date: string; count: number }[]
  getTopBooks: (limit: number) => { bookId: string; title: string; count: number }[]
  isBookReservedByUser: (bookId: string) => boolean
  getAvailableCopies: (bookId: string) => number
  getWaitingCount: (bookId: string) => number
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: initialBooks,
  reservations: initialReservations,
  reviews: initialReviews,
  currentUser: { id: 'user1', name: '张伟', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20Chinese%20librarian%20avatar%20warm%20smile%20illustration&image_size=square_hd' },

  getFilteredBooks: (category?: Category, search?: string) => {
    const { books } = get()
    return books.filter((book) => {
      const matchCategory = !category || book.category === category
      const matchSearch = !search || 
        book.title.toLowerCase().includes(search.toLowerCase()) || 
        book.author.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  },

  getBookById: (id: string) => {
    return get().books.find((b) => b.id === id)
  },

  createReservation: (bookId: string) => {
    const { books, reservations, currentUser } = get()
    const book = books.find((b) => b.id === bookId)
    if (!book) return null

    const available = book.totalCopies - book.reservedCopies
    if (available <= 0) return null

    const alreadyReserved = reservations.some(
      (r) => r.bookId === bookId && r.userId === currentUser.id && r.status === 'reserved'
    )
    if (alreadyReserved) return null

    const newReservation: Reservation = {
      id: `r${Date.now()}`,
      bookId,
      userId: currentUser.id,
      status: 'reserved',
      createdAt: new Date().toISOString().split('T')[0],
    }

    set({
      reservations: [...reservations, newReservation],
      books: books.map((b) =>
        b.id === bookId ? { ...b, reservedCopies: b.reservedCopies + 1 } : b
      ),
    })

    return newReservation
  },

  cancelReservation: (reservationId: string) => {
    const { reservations, books } = get()
    const reservation = reservations.find((r) => r.id === reservationId)
    if (!reservation) return false

    set({
      reservations: reservations.filter((r) => r.id !== reservationId),
      books: books.map((b) =>
        b.id === reservation.bookId ? { ...b, reservedCopies: Math.max(0, b.reservedCopies - 1) } : b
      ),
    })

    return true
  },

  updateReservationStatus: (reservationId: string, status: ReservationStatus) => {
    const { reservations } = get()
    const reservation = reservations.find((r) => r.id === reservationId)
    if (!reservation) return false

    set({
      reservations: reservations.map((r) =>
        r.id === reservationId ? { ...r, status } : r
      ),
    })

    return true
  },

  getUserReservations: () => {
    const { reservations, currentUser } = get()
    return reservations.filter((r) => r.userId === currentUser.id)
  },

  getBookReviews: (bookId: string) => {
    return get().reviews.filter((r) => r.bookId === bookId)
  },

  addReview: (bookId: string, rating: number, comment: string) => {
    const { reviews, currentUser } = get()
    const newReview: Review = {
      id: `rev${Date.now()}`,
      bookId,
      userId: currentUser.id,
      userName: currentUser.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    }

    set({ reviews: [newReview, ...reviews] })
    return newReview
  },

  getBookAverageRating: (bookId: string) => {
    const bookReviews = get().reviews.filter((r) => r.bookId === bookId)
    if (bookReviews.length === 0) return 0
    const sum = bookReviews.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / bookReviews.length) * 10) / 10
  },

  getReservationStats: () => {
    const { reservations } = get()
    const dates = generatePastDates(7)
    return dates.map((date) => ({
      date: `${date.slice(5)}`,
      count: reservations.filter((r) => r.createdAt === date).length,
    }))
  },

  getTopBooks: (limit: number) => {
    const { reservations, books } = get()
    const bookCounts: Record<string, number> = {}
    reservations.forEach((r) => {
      bookCounts[r.bookId] = (bookCounts[r.bookId] || 0) + 1
    })

    return Object.entries(bookCounts)
      .map(([bookId, count]) => {
        const book = books.find((b) => b.id === bookId)
        return { bookId, title: book?.title || '未知', count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  },

  isBookReservedByUser: (bookId: string) => {
    const { reservations, currentUser } = get()
    return reservations.some(
      (r) => r.bookId === bookId && r.userId === currentUser.id && r.status === 'reserved'
    )
  },

  getAvailableCopies: (bookId: string) => {
    const book = get().books.find((b) => b.id === bookId)
    if (!book) return 0
    return book.totalCopies - book.reservedCopies
  },

  getWaitingCount: (bookId: string) => {
    const { reservations, currentUser } = get()
    return reservations.filter(
      (r) => r.bookId === bookId && r.userId !== currentUser.id && r.status === 'reserved'
    ).length
  },
}))
