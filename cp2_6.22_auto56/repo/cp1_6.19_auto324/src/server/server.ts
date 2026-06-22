
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import substitutionRules from './substitutionRules'

interface Ingredient {
  id: string
  name: string
  amount: string
}

interface RecipeStep {
  order: number
  description: string
}

interface Comment {
  id: string
  recipeId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: number
}

interface Rating {
  userId: string
  value: 1 | 2 | 3 | 4 | 5
}

interface Recipe {
  id: string
  title: string
  authorId: string
  authorName: string
  authorAvatar: string
  coverColor: string
  tags: string[]
  ingredients: Ingredient[]
  steps: RecipeStep[]
  ratings: Rating[]
  averageRating: number
  comments: Comment[]
  createdAt: number
}

const coverColors = ['#FFD54F', '#81C784', '#64B5F6', '#E57373']

const tagColors: Record<string, string> = {
  '家常菜': '#FF8A65',
  '烘焙': '#AB47BC',
  '甜品': '#FFD54F',
  '汤羹': '#4DB6AC',
  '快手菜': '#7986CB',
}

export { tagColors, coverColors }

function calcAvgRating(ratings: Rating[]): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, r) => acc + r.value, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

const recipes: Recipe[] = [
  {
    id: 'r1',
    title: '番茄牛腩煲',
    authorId: 'u1',
    authorName: '厨神小王',
    authorAvatar: '👨‍🍳',
    coverColor: '#E57373',
    tags: ['家常菜', '汤羹'],
    ingredients: [
      { id: 'i1', name: '牛肉', amount: '500克' },
      { id: 'i2', name: '西红柿', amount: '3个' },
      { id: 'i3', name: '土豆', amount: '2个' },
      { id: 'i4', name: '洋葱', amount: '半个' },
      { id: 'i5', name: '大蒜', amount: '4瓣' },
      { id: 'i6', name: '生姜', amount: '3片' },
      { id: 'i7', name: '料酒', amount: '2勺' },
      { id: 'i8', name: '酱油', amount: '2勺' },
      { id: 'i9', name: '盐', amount: '适量' },
      { id: 'i10', name: '白砂糖', amount: '1勺' },
    ],
    steps: [
      { order: 1, description: '牛腩切块，冷水下锅，加姜片和料酒焯水，撇去浮沫后捞出洗净备用。' },
      { order: 2, description: '西红柿顶部划十字刀，用开水烫一下去皮，切成小丁备用。' },
      { order: 3, description: '热锅冷油，下洋葱蒜末炒香，加入西红柿丁炒出红油。' },
      { order: 4, description: '放入牛腩翻炒均匀，加酱油、糖调味。' },
      { order: 5, description: '倒入开水没过牛腩，大火烧开后转小火炖1小时。' },
      { order: 6, description: '加入土豆块继续炖30分钟，最后加盐调味，大火收汁即可。' },
    ],
    ratings: [
      { userId: 'u2', value: 5 },
      { userId: 'u3', value: 4 },
      { userId: 'u4', value: 5 },
      { userId: 'u5', value: 5 },
    ],
    averageRating: 4.8,
    comments: [
      {
        id: 'c1', recipeId: 'r1', userId: 'u2', userName: '吃货小张', userAvatar: '😋',
        content: '太香了！跟着做成功了，家人都爱吃~', timestamp: Date.now() - 86400000,
      },
      {
        id: 'c2', recipeId: 'r1', userId: 'u3', userName: '美食达人', userAvatar: '🥘',
        content: '建议加点番茄酱味道更浓郁哦', timestamp: Date.now() - 3600000,
      },
    ],
    createdAt: Date.now() - 7 * 86400000,
  },
  {
    id: 'r2',
    title: '抹茶红豆蛋糕卷',
    authorId: 'u2',
    authorName: '甜品小美',
    authorAvatar: '👩‍🍳',
    coverColor: '#81C784',
    tags: ['烘焙', '甜品'],
    ingredients: [
      { id: 'i11', name: '鸡蛋', amount: '4个' },
      { id: 'i12', name: '面粉', amount: '60克' },
      { id: 'i13', name: '抹茶粉', amount: '8克' },
      { id: 'i14', name: '白砂糖', amount: '60克' },
      { id: 'i15', name: '牛奶', amount: '50克' },
      { id: 'i16', name: '黄油', amount: '40克' },
      { id: 'i17', name: '奶油', amount: '200克' },
      { id: 'i18', name: '红豆沙', amount: '150克' },
    ],
    steps: [
      { order: 1, description: '蛋黄蛋白分离，蛋黄加20克糖、牛奶、融化的黄油搅拌均匀。' },
      { order: 2, description: '筛入面粉和抹茶粉，翻拌成细腻蛋黄糊。' },
      { order: 3, description: '蛋白分三次加40克糖打至湿性发泡。' },
      { order: 4, description: '取1/3蛋白霜加入蛋黄糊翻拌，再倒回剩余蛋白霜中翻拌均匀。' },
      { order: 5, description: '倒入铺油纸的烤盘，180度烤18分钟。' },
      { order: 6, description: '出炉稍凉后抹上奶油和红豆沙，卷成卷冷藏定型即可。' },
    ],
    ratings: [
      { userId: 'u1', value: 5 },
      { userId: 'u4', value: 5 },
      { userId: 'u5', value: 4 },
    ],
    averageRating: 4.7,
    comments: [
      {
        id: 'c3', recipeId: 'r2', userId: 'u1', userName: '厨神小王', userAvatar: '👨‍🍳',
        content: '颜值超高！抹茶香很浓郁~', timestamp: Date.now() - 2 * 86400000,
      },
    ],
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'r3',
    title: '凉拌木耳黄瓜',
    authorId: 'u3',
    authorName: '养生老李',
    authorAvatar: '🧑‍🌾',
    coverColor: '#64B5F6',
    tags: ['家常菜', '快手菜'],
    ingredients: [
      { id: 'i19', name: '木耳', amount: '50克（干）' },
      { id: 'i20', name: '黄瓜', amount: '2根' },
      { id: 'i21', name: '大蒜', amount: '3瓣' },
      { id: 'i22', name: '小葱', amount: '2根' },
      { id: 'i23', name: '香菜', amount: '少许' },
      { id: 'i24', name: '生抽', amount: '2勺' },
      { id: 'i25', name: '醋', amount: '2勺' },
      { id: 'i26', name: '盐', amount: '适量' },
      { id: 'i27', name: '辣椒油', amount: '1勺' },
    ],
    steps: [
      { order: 1, description: '木耳提前泡发，开水焯1分钟后捞出过凉。' },
      { order: 2, description: '黄瓜拍碎切段，撒少许盐腌5分钟杀出水分。' },
      { order: 3, description: '木耳和黄瓜放碗中，加蒜末、葱花。' },
      { order: 4, description: '淋入生抽、醋、辣椒油，加香菜拌匀即可。' },
    ],
    ratings: [
      { userId: 'u1', value: 4 },
      { userId: 'u2', value: 5 },
      { userId: 'u4', value: 4 },
    ],
    averageRating: 4.3,
    comments: [],
    createdAt: Date.now() - 3 * 86400000,
  },
  {
    id: 'r4',
    title: '香菇滑鸡粥',
    authorId: 'u4',
    authorName: '暖胃大叔',
    authorAvatar: '👴',
    coverColor: '#FFD54F',
    tags: ['汤羹', '快手菜'],
    ingredients: [
      { id: 'i28', name: '大米', amount: '1杯' },
      { id: 'i29', name: '鸡肉', amount: '200克' },
      { id: 'i30', name: '香菇', amount: '6朵' },
      { id: 'i31', name: '生姜', amount: '3片' },
      { id: 'i32', name: '小葱', amount: '2根' },
      { id: 'i33', name: '料酒', amount: '1勺' },
      { id: 'i34', name: '盐', amount: '适量' },
      { id: 'i35', name: '鸡精', amount: '少许' },
      { id: 'i36', name: '淀粉', amount: '1勺' },
    ],
    steps: [
      { order: 1, description: '大米淘洗后加水烧开，转小火熬30分钟。' },
      { order: 2, description: '鸡肉切丝，加料酒、淀粉、少许盐抓匀腌制。' },
      { order: 3, description: '香菇泡发后切丝备用。' },
      { order: 4, description: '粥熬稠后加入香菇丝和姜丝煮5分钟。' },
      { order: 5, description: '下鸡丝滑散，煮至变色后加盐和鸡精调味。' },
      { order: 6, description: '出锅前撒葱花即可。' },
    ],
    ratings: [
      { userId: 'u1', value: 5 },
      { userId: 'u2', value: 5 },
      { userId: 'u3', value: 4 },
      { userId: 'u5', value: 5 },
    ],
    averageRating: 4.8,
    comments: [
      {
        id: 'c4', recipeId: 'r4', userId: 'u5', userName: '加班狗', userAvatar: '🐶',
        content: '熬夜后来一碗太治愈了！', timestamp: Date.now() - 7200000,
      },
    ],
    createdAt: Date.now() - 6 * 86400000,
  },
  {
    id: 'r5',
    title: '蒜蓉芝士虾仁意面',
    authorId: 'u5',
    authorName: '加班狗',
    authorAvatar: '🐶',
    coverColor: '#E57373',
    tags: ['快手菜', '家常菜'],
    ingredients: [
      { id: 'i37', name: '面条', amount: '200克' },
      { id: 'i38', name: '虾仁', amount: '150克' },
      { id: 'i39', name: '大蒜', amount: '6瓣' },
      { id: 'i40', name: '黄油', amount: '20克' },
      { id: 'i41', name: '橄榄油', amount: '1勺' },
      { id: 'i42', name: '奶酪', amount: '30克' },
      { id: 'i43', name: '牛奶', amount: '30毫升' },
      { id: 'i44', name: '黑胡椒', amount: '适量' },
      { id: 'i45', name: '盐', amount: '适量' },
      { id: 'i46', name: '香菜', amount: '少许' },
    ],
    steps: [
      { order: 1, description: '烧开水加盐，煮意面至8成熟，留半碗煮面水备用。' },
      { order: 2, description: '虾仁开背去虾线，大蒜切末备用。' },
      { order: 3, description: '平底锅放黄油和橄榄油，爆香蒜末。' },
      { order: 4, description: '下虾仁煎至两面变红卷起。' },
      { order: 5, description: '加入牛奶和奶酪碎小火融化，加黑胡椒和盐。' },
      { order: 6, description: '倒入意面和少量煮面水翻拌均匀，收汁撒香菜即可。' },
    ],
    ratings: [
      { userId: 'u1', value: 5 },
      { userId: 'u2', value: 4 },
      { userId: 'u3', value: 5 },
      { userId: 'u4', value: 4 },
    ],
    averageRating: 4.5,
    comments: [],
    createdAt: Date.now() - 4 * 86400000,
  },
  {
    id: 'r6',
    title: '核桃红枣燕麦粥',
    authorId: 'u1',
    authorName: '厨神小王',
    authorAvatar: '👨‍🍳',
    coverColor: '#FFD54F',
    tags: ['甜品', '快手菜'],
    ingredients: [
      { id: 'i47', name: '燕麦片', amount: '50克' },
      { id: 'i48', name: '牛奶', amount: '300毫升' },
      { id: 'i49', name: '红枣', amount: '6颗' },
      { id: 'i50', name: '核桃', amount: '4颗' },
      { id: 'i51', name: '枸杞', amount: '10粒' },
      { id: 'i52', name: '蜂蜜', amount: '1勺' },
    ],
    steps: [
      { order: 1, description: '红枣去核切块，核桃掰碎备用。' },
      { order: 2, description: '燕麦和牛奶倒入锅中，小火煮5分钟。' },
      { order: 3, description: '加入红枣和核桃继续煮3分钟。' },
      { order: 4, description: '出锅前撒枸杞，晾至温热加蜂蜜拌匀即可。' },
    ],
    ratings: [
      { userId: 'u2', value: 4 },
      { userId: 'u3', value: 5 },
      { userId: 'u4', value: 4 },
      { userId: 'u5', value: 4 },
    ],
    averageRating: 4.3,
    comments: [
      {
        id: 'c5', recipeId: 'r6', userId: 'u4', userName: '暖胃大叔', userAvatar: '👴',
        content: '早餐必备！营养又健康', timestamp: Date.now() - 4 * 3600000,
      },
    ],
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'r7',
    title: '土豆咖喱牛肉饭',
    authorId: 'u2',
    authorName: '甜品小美',
    authorAvatar: '👩‍🍳',
    coverColor: '#FFD54F',
    tags: ['家常菜', '快手菜'],
    ingredients: [
      { id: 'i53', name: '牛肉', amount: '300克' },
      { id: 'i54', name: '土豆', amount: '2个' },
      { id: 'i55', name: '胡萝卜', amount: '1根' },
      { id: 'i56', name: '洋葱', amount: '1个' },
      { id: 'i57', name: '咖喱块', amount: '2块' },
      { id: 'i58', name: '大米', amount: '2碗' },
      { id: 'i59', name: '橄榄油', amount: '2勺' },
      { id: 'i60', name: '盐', amount: '适量' },
    ],
    steps: [
      { order: 1, description: '牛肉切丁焯水，土豆胡萝卜洋葱切块备用。' },
      { order: 2, description: '热油炒香洋葱，加入牛肉翻炒至变色。' },
      { order: 3, description: '加入土豆和胡萝卜，加水没过食材。' },
      { order: 4, description: '大火烧开转小火炖20分钟。' },
      { order: 5, description: '放入咖喱块搅拌融化，再煮5分钟至浓稠。' },
      { order: 6, description: '盛上米饭，淋上咖喱即可开吃。' },
    ],
    ratings: [
      { userId: 'u1', value: 4 },
      { userId: 'u3', value: 5 },
      { userId: 'u5', value: 5 },
    ],
    averageRating: 4.7,
    comments: [],
    createdAt: Date.now() - 1 * 86400000,
  },
  {
    id: 'r8',
    title: '可可杏仁曲奇',
    authorId: 'u3',
    authorName: '养生老李',
    authorAvatar: '🧑‍🌾',
    coverColor: '#81C784',
    tags: ['烘焙', '甜品'],
    ingredients: [
      { id: 'i61', name: '黄油', amount: '150克' },
      { id: 'i62', name: '白砂糖', amount: '60克' },
      { id: 'i63', name: '鸡蛋', amount: '1个' },
      { id: 'i64', name: '面粉', amount: '200克' },
      { id: 'i65', name: '可可粉', amount: '20克' },
      { id: 'i66', name: '杏仁', amount: '50克' },
      { id: 'i67', name: '巧克力', amount: '50克' },
    ],
    steps: [
      { order: 1, description: '黄油室温软化，加糖打发至发白。' },
      { order: 2, description: '分次加入蛋液，每次打匀后再加。' },
      { order: 3, description: '筛入面粉和可可粉，加入杏仁碎翻拌成团。' },
      { order: 4, description: '搓成圆柱状，冷藏30分钟定型。' },
      { order: 5, description: '切成5毫米厚的片，放在烤盘上。' },
      { order: 6, description: '170度烤15分钟，趁热淋上融化的巧克力即可。' },
    ],
    ratings: [
      { userId: 'u1', value: 5 },
      { userId: 'u2', value: 5 },
      { userId: 'u4', value: 4 },
      { userId: 'u5', value: 5 },
    ],
    averageRating: 4.8,
    comments: [
      {
        id: 'c6', recipeId: 'r8', userId: 'u2', userName: '甜品小美', userAvatar: '👩‍🍳',
        content: '酥到掉渣！巧克力和杏仁太搭了', timestamp: Date.now() - 1 * 3600000,
      },
    ],
    createdAt: Date.now() - 10 * 86400000,
  },
  {
    id: 'r9',
    title: '金针菇豆腐汤',
    authorId: 'u4',
    authorName: '暖胃大叔',
    authorAvatar: '👴',
    coverColor: '#64B5F6',
    tags: ['汤羹', '快手菜'],
    ingredients: [
      { id: 'i68', name: '金针菇', amount: '1把' },
      { id: 'i69', name: '豆腐', amount: '1块' },
      { id: 'i70', name: '鸡蛋', amount: '2个' },
      { id: 'i71', name: '小葱', amount: '2根' },
      { id: 'i72', name: '生姜', amount: '2片' },
      { id: 'i73', name: '盐', amount: '适量' },
      { id: 'i74', name: '鸡精', amount: '少许' },
      { id: 'i75', name: '淀粉', amount: '1勺' },
    ],
    steps: [
      { order: 1, description: '金针菇去根撕小朵，豆腐切小块，鸡蛋打散备用。' },
      { order: 2, description: '锅中加水煮开，放入姜丝和金针菇煮3分钟。' },
      { order: 3, description: '加入豆腐块继续煮5分钟。' },
      { order: 4, description: '淋入蛋液形成蛋花，加盐和鸡精调味。' },
      { order: 5, description: '淀粉加水勾芡，出锅撒葱花即可。' },
    ],
    ratings: [
      { userId: 'u1', value: 4 },
      { userId: 'u2', value: 4 },
      { userId: 'u3', value: 4 },
      { userId: 'u5', value: 3 },
    ],
    averageRating: 3.8,
    comments: [],
    createdAt: Date.now() - 8 * 86400000,
  },
  {
    id: 'r10',
    title: '麻婆茄子',
    authorId: 'u5',
    authorName: '加班狗',
    authorAvatar: '🐶',
    coverColor: '#E57373',
    tags: ['家常菜'],
    ingredients: [
      { id: 'i76', name: '茄子', amount: '2根' },
      { id: 'i77', name: '猪肉', amount: '100克' },
      { id: 'i78', name: '大蒜', amount: '4瓣' },
      { id: 'i79', name: '小葱', amount: '2根' },
      { id: 'i80', name: '豆瓣酱', amount: '1勺' },
      { id: 'i81', name: '酱油', amount: '1勺' },
      { id: 'i82', name: '醋', amount: '半勺' },
      { id: 'i83', name: '白砂糖', amount: '半勺' },
      { id: 'i84', name: '淀粉', amount: '1勺' },
      { id: 'i85', name: '花椒粉', amount: '少许' },
    ],
    steps: [
      { order: 1, description: '茄子切滚刀块，撒盐腌10分钟挤干水分。' },
      { order: 2, description: '热油下茄子煎至变软盛出备用。' },
      { order: 3, description: '留底油炒香肉末，加豆瓣酱炒出红油。' },
      { order: 4, description: '下蒜末爆香，加酱油、醋、糖和少许水。' },
      { order: 5, description: '倒入茄子翻炒入味，水淀粉勾芡。' },
      { order: 6, description: '出锅撒葱花和花椒粉即可。' },
    ],
    ratings: [
      { userId: 'u1', value: 5 },
      { userId: 'u2', value: 5 },
      { userId: 'u3', value: 4 },
      { userId: 'u4', value: 4 },
      { userId: 'u5', value: 5 },
    ],
    averageRating: 4.6,
    comments: [],
    createdAt: Date.now() - 12 * 86400000,
  },
]

recipes.forEach((r) => {
  r.averageRating = calcAvgRating(r.ratings)
})

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/recipes', (_req, res) => {
  const list = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    authorId: r.authorId,
    authorName: r.authorName,
    authorAvatar: r.authorAvatar,
    coverColor: r.coverColor,
    tags: r.tags,
    averageRating: calcAvgRating(r.ratings),
    ratingCount: r.ratings.length,
    commentCount: r.comments.length,
    createdAt: r.createdAt,
    ingredientNames: r.ingredients.map((i) => i.name),
  }))
  res.json({ code: 0, data: list })
})

app.get('/api/recipes/:id', (req, res) => {
  const r = recipes.find((x) => x.id === req.params.id)
  if (!r) return res.status(404).json({ code: 404, message: '未找到食谱' })
  res.json({ code: 0, data: { ...r, averageRating: calcAvgRating(r.ratings) } })
})

app.get('/api/substitutions', (_req, res) => {
  res.json({ code: 0, data: substitutionRules })
})

export const appServer = app

export function createServer() {
  const server = http.createServer(app)
  const io = new SocketIOServer(server, { cors: { origin: '*' } })

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    socket.on('recipe:comment', async (payload: { recipeId: string; userId: string; userName: string; userAvatar: string; content: string }) => {
      const recipe = recipes.find((r) => r.id === payload.recipeId)
      if (!recipe) return
      const comment: Comment = {
        id: uuidv4(),
        recipeId: payload.recipeId,
        userId: payload.userId,
        userName: payload.userName,
        userAvatar: payload.userAvatar,
        content: payload.content,
        timestamp: Date.now(),
      }
      recipe.comments.push(comment)
      io.emit('comment:new', { recipeId: payload.recipeId, comment })
    })

    socket.on('recipe:deleteComment', (payload: { recipeId: string; commentId: string; userId: string }) => {
      const recipe = recipes.find((r) => r.id === payload.recipeId)
      if (!recipe) return
      recipe.comments = recipe.comments.filter((c) => c.id !== payload.commentId)
      io.emit('comment:delete', { recipeId: payload.recipeId, commentId: payload.commentId })
    })

    socket.on('recipe:rating', (payload: { recipeId: string; userId: string; value: 1 | 2 | 3 | 4 | 5 }) => {
      const recipe = recipes.find((r) => r.id === payload.recipeId)
      if (!recipe) return
      const existing = recipe.ratings.find((x) => x.userId === payload.userId)
      if (existing) {
        existing.value = payload.value
      } else {
        recipe.ratings.push({ userId: payload.userId, value: payload.value })
      }
      const avg = calcAvgRating(recipe.ratings)
      io.emit('rating:update', { recipeId: payload.recipeId, averageRating: avg, ratingCount: recipe.ratings.length })
    })

    socket.on('recipe:favorite', (payload: { recipeId: string; userId: string; isFavorited: boolean }) => {
      io.emit('favorite:toggle', { ...payload })
    })
  })

  return { server, io }
}

const { server } = createServer()
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🍳 共享食光后端已启动: http://localhost:${PORT}`)
  console.log(`📦 Socket.IO 服务已启用`)
})
