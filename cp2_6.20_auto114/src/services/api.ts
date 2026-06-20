import axios from 'axios'
import type { GroomingStyle, Groomer, ServiceItem, Appointment } from '@/store'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

const mockStyles: GroomingStyle[] = [
  {
    id: '1',
    name: '萌系泰迪装',
    breed: '贵宾犬',
    styleTag: '泰迪装',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20poodle%20with%20teddy%20bear%20haircut%20grooming%20style%2C%20fluffy%20round%20face%2C%20professional%20pet%20photography%2C%20warm%20lighting&image_size=square',
    groomerRating: 4.8,
    hairLength: 3.5,
    trimShape: '圆形',
    color: '#f5cba7',
  },
  {
    id: '2',
    name: '霸气狮子装',
    breed: '松狮犬',
    styleTag: '狮子装',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=majestic%20chow%20chow%20with%20lion%20haircut%20grooming%2C%20fluffy%20mane%2C%20regal%20pose%2C%20professional%20pet%20photography&image_size=square',
    groomerRating: 4.9,
    hairLength: 5.0,
    trimShape: '鬃毛形',
    color: '#d4a574',
  },
  {
    id: '3',
    name: '夏威夷热带风',
    breed: '比熊犬',
    styleTag: '夏威夷风',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bichon%20frise%20with%20tropical%20hawaiian%20grooming%20style%2C%20flower%20accessories%2C%20colorful%20ribbons%2C%20beach%20vibe&image_size=square',
    groomerRating: 4.6,
    hairLength: 4.0,
    trimShape: '自然形',
    color: '#82e0aa',
  },
  {
    id: '4',
    name: '韩系小绵羊',
    breed: '贵宾犬',
    styleTag: '韩系装',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20poodle%20with%20korean%20sheep%20haircut%20style%2C%20fluffy%20round%2C%20cute%20pastel%20ribbons%2C%20studio%20photography&image_size=square',
    groomerRating: 4.7,
    hairLength: 4.5,
    trimShape: '绵羊形',
    color: '#d7bde2',
  },
  {
    id: '5',
    name: '日系清爽短毛',
    breed: '柴犬',
    styleTag: '清爽装',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20with%20clean%20neat%20short%20haircut%2C%20well%20groomed%2C%20happy%20expression%2C%20natural%20lighting&image_size=square',
    groomerRating: 4.5,
    hairLength: 1.5,
    trimShape: '自然形',
    color: '#f0b27a',
  },
  {
    id: '6',
    name: '公主蓬蓬裙装',
    breed: '约克夏',
    styleTag: '公主装',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yorkshire%20terrier%20with%20princess%20grooming%20style%2C%20puffy%20skirt%20haircut%2C%20pink%20bow%2C%20elegant%20pose&image_size=square',
    groomerRating: 4.8,
    hairLength: 6.0,
    trimShape: '裙摆形',
    color: '#f1948a',
  },
  {
    id: '7',
    name: '运动酷炫装',
    breed: '雪纳瑞',
    styleTag: '酷炫装',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20schnauzer%20with%20sporty%20cool%20haircut%2C%20trim%20beard%2C%20athletic%20look%2C%20modern%20grooming&image_size=square',
    groomerRating: 4.4,
    hairLength: 2.0,
    trimShape: '方形',
    color: '#85929e',
  },
  {
    id: '8',
    name: '花花公子装',
    breed: '马尔济斯',
    styleTag: '花花装',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=maltese%20dog%20with%20playboy%20style%20grooming%2C%20long%20silky%20hair%2C%20flower%20crown%2C%20luxurious%20look&image_size=square',
    groomerRating: 4.9,
    hairLength: 7.0,
    trimShape: '自然垂坠',
    color: '#aed6f1',
  },
]

const mockGroomers: Groomer[] = [
  {
    id: 'g1',
    name: '小美老师',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20female%20pet%20groomer%20portrait%2C%20warm%20smile%2C%20professional%20uniform%2C%20soft%20lighting&image_size=square_hd',
    specialties: ['泰迪装', '韩系装', '公主装'],
    availableSlots: ['09:00', '10:30', '14:00', '15:30'],
    portfolio: [],
    rating: 4.9,
  },
  {
    id: 'g2',
    name: '阿杰师傅',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=experienced%20male%20pet%20groomer%20portrait%2C%20confident%20smile%2C%20professional%20uniform%2C%20studio%20lighting&image_size=square_hd',
    specialties: ['狮子装', '酷炫装', '清爽装'],
    availableSlots: ['09:30', '11:00', '14:30', '16:00'],
    portfolio: [],
    rating: 4.7,
  },
  {
    id: 'g3',
    name: '甜甜姐姐',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20cheerful%20female%20pet%20groomer%20portrait%2C%20bright%20smile%2C%20cute%20apron%2C%20warm%20lighting&image_size=square_hd',
    specialties: ['夏威夷风', '花花装', '公主装'],
    availableSlots: ['10:00', '13:00', '15:00', '17:00'],
    portfolio: [],
    rating: 4.8,
  },
]

const mockServices: ServiceItem[] = [
  { id: 's1', name: '基础洗护', price: 128, duration: 60, icon: '🛁' },
  { id: 's2', name: '精致造型', price: 268, duration: 90, icon: '✂️' },
  { id: 's3', name: 'SPA护理', price: 358, duration: 120, icon: '💆' },
  { id: 's4', name: '染色造型', price: 398, duration: 150, icon: '🎨' },
  { id: 's5', name: '全身体检+美容', price: 498, duration: 180, icon: '🏥' },
]

export async function fetchStyles(): Promise<GroomingStyle[]> {
  try {
    const res = await api.get('/styles')
    return res.data.data
  } catch {
    return mockStyles
  }
}

export async function fetchGroomers(): Promise<Groomer[]> {
  try {
    const res = await api.get('/groomers')
    return res.data.data
  } catch {
    return mockGroomers
  }
}

export async function fetchServices(): Promise<ServiceItem[]> {
  try {
    const res = await api.get('/services')
    return res.data.data
  } catch {
    return mockServices
  }
}

export async function createAppointment(data: {
  date: string
  groomerId: string
  serviceIds: string[]
  styleId: string
}): Promise<Appointment> {
  try {
    const res = await api.post('/appointments', data)
    return res.data.data
  } catch {
    return {
      id: 'apt_' + Date.now(),
      date: data.date,
      groomerId: data.groomerId,
      serviceIds: data.serviceIds,
      styleId: data.styleId,
      status: 'confirmed',
      progress: 0,
    }
  }
}

export { mockStyles, mockGroomers, mockServices }
