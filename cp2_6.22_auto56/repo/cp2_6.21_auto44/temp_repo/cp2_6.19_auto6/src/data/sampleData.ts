import { v4 as uuidv4 } from 'uuid'

export interface Memory {
  id: string
  date: string
  year: number
  month: number
  imageUrl: string
  title: string
  description: string
}

export const sampleMemories: Memory[] = [
  {
    id: uuidv4(),
    date: '2024-03-15',
    year: 2024,
    month: 3,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cherry%20blossom%20in%20spring%20park%20sunny%20day&image_size=square',
    title: '春日樱花',
    description: '和家人一起去公园赏樱，春风拂面，花瓣飘落，那一刻的幸福定格在照片里。'
  },
  {
    id: uuidv4(),
    date: '2024-07-22',
    year: 2024,
    month: 7,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sunset%20beach%20ocean%20waves%20summer%20vacation&image_size=square',
    title: '海边落日',
    description: '三亚的夏天，沙滩上看着太阳慢慢沉入海平线，金色的光芒洒满整片海面。'
  },
  {
    id: uuidv4(),
    date: '2024-12-25',
    year: 2024,
    month: 12,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=christmas%20tree%20with%20lights%20cozy%20room%20winter&image_size=square',
    title: '温暖圣诞',
    description: '家里的圣诞树亮起来了，孩子们围在树下拆礼物，笑声充满了整个房间。'
  },
  {
    id: uuidv4(),
    date: '2023-01-01',
    year: 2023,
    month: 1,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fireworks%20new%20year%20night%20sky%20celebration&image_size=square',
    title: '新年烟火',
    description: '跨年之夜，绚丽的烟花在夜空中绽放，新的一年充满希望与期待。'
  },
  {
    id: uuidv4(),
    date: '2023-05-20',
    year: 2023,
    month: 5,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20ring%20romantic%20roses%20love&image_size=square',
    title: '求婚成功',
    description: '在我们相识的地方，单膝跪地，她说出了"我愿意"，人生最美好的时刻。'
  },
  {
    id: uuidv4(),
    date: '2023-09-10',
    year: 2023,
    month: 9,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=graduation%20cap%20diploma%20university%20celebration&image_size=square',
    title: '毕业快乐',
    description: '穿着学士服，接过毕业证书，四年的青春画上了圆满的句号。'
  },
  {
    id: uuidv4(),
    date: '2022-02-14',
    year: 2022,
    month: 2,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=roses%20bouquet%20valentine%20day%20romantic&image_size=square',
    title: '情人节',
    description: '第一次送她玫瑰花，她脸红的样子比花还美，我们的故事从这里开始。'
  },
  {
    id: uuidv4(),
    date: '2022-08-08',
    year: 2022,
    month: 8,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mountain%20hiking%20adventure%20nature%20landscape&image_size=square',
    title: '征服高山',
    description: '历经6小时的攀登，终于站在山顶，云海翻涌，所有的疲惫都值得。'
  },
  {
    id: uuidv4(),
    date: '2021-04-01',
    year: 2021,
    month: 4,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=first%20job%20office%20desk%20computer%20coffee&image_size=square',
    title: '入职第一天',
    description: '怀揣着紧张与兴奋，开始了人生第一份正式工作，新的旅程就此启航。'
  },
  {
    id: uuidv4(),
    date: '2020-06-18',
    year: 2020,
    month: 6,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=birthday%20cake%20candles%20celebration%20friends&image_size=square',
    title: '生日派对',
    description: '疫情期间的云生日派对，朋友们通过视频送来祝福，特别又温暖。'
  },
  {
    id: uuidv4(),
    date: '2019-10-01',
    year: 2019,
    month: 10,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=autumn%20leaves%20forest%20path%20golden%20season&image_size=square',
    title: '金秋漫步',
    description: '国庆假期走在铺满落叶的林间小道，阳光透过树叶洒下斑驳的光影。'
  },
  {
    id: uuidv4(),
    date: '2018-07-15',
    year: 2018,
    month: 7,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20festival%20concert%20crowd%20lights&image_size=square',
    title: '音乐节',
    description: '和朋友们一起去音乐节，在人群中挥舞着荧光棒，汗水与音乐交织。'
  }
]

export const generateYearList = (memories: Memory[]): number[] => {
  const years = new Set(memories.map(m => m.year))
  const minYear = Math.min(...years) - 2
  const maxYear = Math.max(...years) + 2
  const yearList: number[] = []
  for (let y = minYear; y <= maxYear; y++) {
    yearList.push(y)
  }
  return yearList
}
