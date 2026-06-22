import { v4 as uuidv4 } from 'uuid'

export const pets = [
  {
    id: uuidv4(),
    name: '豆豆',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20golden%20retriever%20puppy%20portrait%20warm%20lighting&image_size=square',
    breed: '金毛寻回犬',
    type: 'dog',
    age: 2,
    ownerId: 'owner1',
    description: '温顺友好，喜欢户外活动'
  },
  {
    id: uuidv4(),
    name: '咪咪',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20orange%20tabby%20cat%20portrait%20cozy%20home&image_size=square',
    breed: '橘猫',
    type: 'cat',
    age: 3,
    ownerId: 'owner2',
    description: '安静粘人，爱吃小鱼干'
  },
  {
    id: uuidv4(),
    name: '旺财',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20shiba%20inu%20dog%20smiling%20outdoor&image_size=square',
    breed: '柴犬',
    type: 'dog',
    age: 1,
    ownerId: 'owner3',
    description: '活泼好动，表情包担当'
  },
  {
    id: uuidv4(),
    name: '雪球',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fluffy%20white%20persian%20cat%20elegant%20portrait&image_size=square',
    breed: '波斯猫',
    type: 'cat',
    age: 4,
    ownerId: 'owner4',
    description: '优雅高贵，喜欢安静的环境'
  },
  {
    id: uuidv4(),
    name: '皮皮',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20cute%20hamster%20eating%20sunflower%20seed&image_size=square',
    breed: '仓鼠',
    type: 'other',
    age: 1,
    ownerId: 'owner5',
    description: '小巧可爱，喜欢跑轮'
  }
]

export const hosts = [
  {
    id: uuidv4(),
    name: '王阿姨',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20middle%20aged%20chinese%20woman%20smiling%20warm%20portrait&image_size=square',
    rating: 4.9,
    reviewCount: 128,
    city: '北京',
    price: 88,
    petTypes: ['dog', 'cat'],
    description: '退休在家，有20年养宠经验，家里有院子，每天遛狗3次',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20living%20room%20with%20pet%20beds%20warm%20light&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sunny%20backyard%20garden%20with%20green%20grass&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20feeding%20area%20clean%20organized%20bowls&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-06-20', '2026-06-21', '2026-06-25']
  },
  {
    id: uuidv4(),
    name: '李先生',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20chinese%20man%20professional%20smile%20portrait&image_size=square',
    rating: 4.8,
    reviewCount: 96,
    city: '上海',
    price: 128,
    petTypes: ['dog'],
    description: '自由职业者，专业训犬师，提供上门遛狗和训练服务',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20apartment%20living%20room%20minimalist&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dog%20training%20session%20outdoor%20park&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=comfortable%20dog%20crate%20bed%20soft%20blankets&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-06-18', '2026-06-19', '2026-06-22']
  },
  {
    id: uuidv4(),
    name: '张小姐',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20chinese%20woman%20gentle%20smile%20cat%20lover&image_size=square',
    rating: 5.0,
    reviewCount: 75,
    city: '广州',
    price: 68,
    petTypes: ['cat', 'other'],
    description: '猫咪爱好者，家里有2只猫，经验丰富，会给猫梳毛剪指甲',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cat%20tree%20tower%20by%20window%20sunlight&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20cat%20bed%20on%20sofa%20soft&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cat%20grooming%20supplies%20brushes%20tidy&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-06-23', '2026-06-24']
  },
  {
    id: uuidv4(),
    name: '陈大叔',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kind%20elderly%20chinese%20man%20smiling%20garden&image_size=square',
    rating: 4.7,
    reviewCount: 52,
    city: '北京',
    price: 58,
    petTypes: ['dog', 'cat', 'other'],
    description: '住郊区别墅，有超大院子，适合活泼的狗狗，会做宠物营养餐',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=large%20countryside%20villa%20garden%20spacious&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dog%20running%20happy%20green%20meadow&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=homemade%20pet%20food%20healthy%20ingredients&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-06-26', '2026-06-27', '2026-06-28']
  },
  {
    id: uuidv4(),
    name: '林姐姐',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20woman%20warm%20friendly%20portrait&image_size=square',
    rating: 4.9,
    reviewCount: 110,
    city: '深圳',
    price: 98,
    petTypes: ['dog', 'cat'],
    description: '兽医专业毕业，能处理简单医疗问题，24小时视频监控',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20bright%20pet%20boarding%20room%20cages&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20medical%20kit%20supplies%20organized&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=security%20camera%20monitoring%20pet%20room&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22']
  },
  {
    id: uuidv4(),
    name: '赵妈妈',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=warm%20chinese%20mother%20figure%20kind%20smile&image_size=square',
    rating: 4.8,
    reviewCount: 88,
    city: '上海',
    price: 78,
    petTypes: ['cat'],
    description: '全职家庭主妇，家里干净整洁，每天给猫拍照发视频给主人',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tidy%20home%20interior%20cat%20friendly%20warm&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cat%20window%20perch%20view%20city&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cat%20playing%20with%20toy%20happy%20indoor&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-06-25', '2026-06-26']
  },
  {
    id: uuidv4(),
    name: '孙小哥',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=energetic%20young%20chinese%20man%20sporty%20smile&image_size=square',
    rating: 4.6,
    reviewCount: 45,
    city: '广州',
    price: 108,
    petTypes: ['dog'],
    description: '健身教练，每天带狗跑步5公里，适合精力旺盛的大型犬',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dog%20jogging%20with%20owner%20park%20sunrise&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spacious%20balcony%20pet%20friendly%20apartment&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dog%20playing%20fetch%20outdoor%20happy&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-06-29', '2026-06-30']
  },
  {
    id: uuidv4(),
    name: '周奶奶',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lovely%20elderly%20chinese%20woman%20grandmother%20warm&image_size=square',
    rating: 5.0,
    reviewCount: 62,
    city: '杭州',
    price: 50,
    petTypes: ['cat', 'other'],
    description: '爱心奶奶，特别喜欢小动物，价格实惠，照顾细致入微',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20traditional%20chinese%20home%20warm%20decor&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cat%20curled%20up%20sleeping%20peaceful&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20pets%20cage%20hamster%20rabbit%20clean&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-07-01', '2026-07-02']
  },
  {
    id: uuidv4(),
    name: '吴老师',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chinese%20woman%20teacher%20glasses%20kind&image_size=square',
    rating: 4.9,
    reviewCount: 134,
    city: '深圳',
    price: 118,
    petTypes: ['dog', 'cat', 'other'],
    description: '宠物行为学专家，可纠正不良习惯，提供专业寄养咨询',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20pet%20training%20facility%20clean&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dog%20obedience%20training%20indoor&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20consultation%20room%20comfortable%20modern&image_size=landscape_16_9'
    ],
    bookedDates: ['2026-06-28', '2026-06-29', '2026-06-30']
  }
]

export const reviews = [
  {
    id: uuidv4(),
    hostId: null,
    petId: null,
    userName: '小刘',
    userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20chinese%20woman%20casual%20portrait%20smile&image_size=square',
    rating: 5,
    content: '王阿姨照顾得特别好，每天都给我发狗狗的视频，回来胖了一圈！',
    date: '2026-06-10'
  },
  {
    id: uuidv4(),
    hostId: null,
    petId: null,
    userName: '陈先生',
    userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20chinese%20business%20man%20professional&image_size=square',
    rating: 5,
    content: '李先生非常专业，我家狗狗以前胆小，回来后活泼多了，强烈推荐！',
    date: '2026-06-08'
  },
  {
    id: uuidv4(),
    hostId: null,
    petId: null,
    userName: '小美',
    userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pretty%20chinese%20girl%20casual%20smile%20portrait&image_size=square',
    rating: 4,
    content: '张小姐人很好，对猫咪特别有耐心，下次还会选择！',
    date: '2026-06-05'
  }
]

function initReviews() {
  const hostReviews = []
  hosts.forEach((host, hostIdx) => {
    for (let i = 0; i < 5; i++) {
      hostReviews.push({
        id: uuidv4(),
        hostId: host.id,
        userName: ['小明', '小红', '阿强', '小芳', '大伟'][i],
        userAvatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20chinese%20person%20${i}%20portrait%20casual&image_size=square`,
        rating: Math.floor(Math.random() * 2) + 4,
        content: [
          `${host.name}照顾宠物非常细心，每天都有反馈！`,
          `强烈推荐！我家宝贝回来状态很好。`,
          `服务很专业，家里也很干净。`,
          `沟通很顺畅，让人很放心。`,
          `性价比很高，下次还会再来！`
        ][i],
        date: `2026-06-${String(Math.max(1, 15 - hostIdx * 2 - i)).padStart(2, '0')}`
      })
    }
  })
  return hostReviews
}

export const allReviews = initReviews()

export let bookings = []

export function addBooking(booking) {
  const newBooking = {
    id: uuidv4(),
    ...booking,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  }
  bookings.push(newBooking)
  return newBooking
}

export function getBookingsByHostAndDate(hostId, date) {
  return bookings.filter(b => b.hostId === hostId && b.date === date)
}
