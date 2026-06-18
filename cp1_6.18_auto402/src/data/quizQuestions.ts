import type { QuizQuestion } from '../types'

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'NFT 技术的全称是什么？',
    options: ['非同质化代币', '网络文件传输', '新型金融工具', '数字版权协议'],
    correctAnswer: 0,
  },
  {
    id: 2,
    question: '以下哪个是最著名的 NFT 艺术集合？',
    options: ['CryptoPunks', 'PixelArt', 'DigitalPaint', 'NFTGallery'],
    correctAnswer: 0,
  },
  {
    id: 3,
    question: '数字艺术中，"元宇宙"的概念是指？',
    options: ['一个虚拟的3D互联网空间', '一种加密货币', '一个游戏平台', '一种绘画风格'],
    correctAnswer: 0,
  },
  {
    id: 4,
    question: '以下哪种技术是 NFT 的底层支撑？',
    options: ['区块链', '人工智能', '云计算', '量子计算'],
    correctAnswer: 0,
  },
  {
    id: 5,
    question: '生成艺术 (Generative Art) 主要使用什么方式创作？',
    options: ['算法和代码', '手工绘画', '摄影合成', '3D建模'],
    correctAnswer: 0,
  },
  {
    id: 6,
    question: 'Beeple 的 NFT 作品《每一天：前5000天》以多少价格售出？',
    options: ['约6900万美元', '约100万美元', '约1亿美元', '约500万美元'],
    correctAnswer: 0,
  },
  {
    id: 7,
    question: '数字艺术中的"稀缺性"是如何实现的？',
    options: ['通过智能合约限制发行量', '通过加密存储', '通过限量打印', '通过艺术家签名'],
    correctAnswer: 0,
  },
  {
    id: 8,
    question: '以下哪个不是 NFT 的常见应用场景？',
    options: ['实体商品生产', '数字收藏品', '游戏道具', '虚拟房地产'],
    correctAnswer: 0,
  },
  {
    id: 9,
    question: '以太坊网络中，NFT 主要遵循哪个标准？',
    options: ['ERC-721', 'ERC-20', 'ERC-1155', 'ERC-4626'],
    correctAnswer: 0,
  },
  {
    id: 10,
    question: '像素艺术 (Pixel Art) 在 NFT 领域流行的原因是？',
    options: ['以上都是', '怀旧感', '易于创作', '独特的美学风格'],
    correctAnswer: 0,
  },
  {
    id: 11,
    question: 'DAO 在数字艺术领域的作用是？',
    options: ['去中心化自治组织，集体决策', '数字资产管理平台', '艺术创作工具', '加密货币钱包'],
    correctAnswer: 0,
  },
  {
    id: 12,
    question: '以下哪个概念与数字艺术收藏关系最密切？',
    options: ['所有权证明', '文件大小', '分辨率', '色彩模式'],
    correctAnswer: 0,
  },
]

export function getDailyQuestions(count: number = 3): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
