import { WeatherType } from './weatherMock'

export interface LuggageItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  packed: boolean
  note?: string
  weight?: number
}

export interface LuggageTemplate {
  id: string
  name: string
  icon: string
  description: string
  type: 'business' | 'beach' | 'hiking' | 'city' | 'winter'
  categories: TemplateCategory[]
}

export interface TemplateCategory {
  name: string
  icon: string
  items: Omit<LuggageItem, 'id' | 'packed'>[]
}

export const categoryIcons: Record<string, string> = {
  '证件': '🆔',
  '衣物': '👕',
  '电子设备': '📱',
  '洗漱用品': '🧴',
  '医疗用品': '💊',
  '旅行配件': '🎒',
  '工作用品': '💼',
  '运动装备': '🎽',
  '海滩装备': '🏖️',
  '保暖装备': '🧣',
  '雨具': '☔',
  '防晒用品': '🧴'
}

const businessTemplate: LuggageTemplate = {
  id: 'business',
  name: '商务出行',
  icon: '💼',
  description: '适合商务会议、客户拜访等正式场合',
  type: 'business',
  categories: [
    {
      name: '证件',
      icon: '🆔',
      items: [
        { name: '身份证', category: '证件', quantity: 1, unit: '张', weight: 0.01 },
        { name: '名片', category: '证件', quantity: 30, unit: '张', weight: 0.1 },
        { name: '公司工牌', category: '证件', quantity: 1, unit: '个', weight: 0.02 }
      ]
    },
    {
      name: '衣物',
      icon: '👕',
      items: [
        { name: '正装西装', category: '衣物', quantity: 2, unit: '套', weight: 2, note: '深色系' },
        { name: '商务衬衫', category: '衣物', quantity: 4, unit: '件', weight: 0.8 },
        { name: '领带', category: '衣物', quantity: 3, unit: '条', weight: 0.15 },
        { name: '正装皮鞋', category: '衣物', quantity: 1, unit: '双', weight: 1.2 },
        { name: '腰带', category: '衣物', quantity: 1, unit: '条', weight: 0.15 }
      ]
    },
    {
      name: '电子设备',
      icon: '📱',
      items: [
        { name: '笔记本电脑', category: '电子设备', quantity: 1, unit: '台', weight: 1.5, note: '带充电器' },
        { name: '手机', category: '电子设备', quantity: 1, unit: '部', weight: 0.2, note: '带充电器' },
        { name: '移动电源', category: '电子设备', quantity: 1, unit: '个', weight: 0.3, note: '10000mAh以上' },
        { name: 'U盘', category: '电子设备', quantity: 2, unit: '个', weight: 0.02, note: '备份重要资料' },
        { name: '蓝牙耳机', category: '电子设备', quantity: 1, unit: '副', weight: 0.05 }
      ]
    },
    {
      name: '工作用品',
      icon: '💼',
      items: [
        { name: '笔记本', category: '工作用品', quantity: 1, unit: '本', weight: 0.2 },
        { name: '签字笔', category: '工作用品', quantity: 3, unit: '支', weight: 0.03 },
        { name: '便携公文包', category: '工作用品', quantity: 1, unit: '个', weight: 0.8 }
      ]
    },
    {
      name: '洗漱用品',
      icon: '🧴',
      items: [
        { name: '牙刷牙膏套装', category: '洗漱用品', quantity: 1, unit: '套', weight: 0.1 },
        { name: '旅行装洗发水', category: '洗漱用品', quantity: 1, unit: '瓶', weight: 0.1 },
        { name: '旅行装沐浴露', category: '洗漱用品', quantity: 1, unit: '瓶', weight: 0.1 },
        { name: '剃须刀', category: '洗漱用品', quantity: 1, unit: '个', weight: 0.15, note: '男士' },
        { name: '护肤套装', category: '洗漱用品', quantity: 1, unit: '套', weight: 0.3 }
      ]
    }
  ]
}

const beachTemplate: LuggageTemplate = {
  id: 'beach',
  name: '海滩度假',
  icon: '🏖️',
  description: '享受阳光沙滩的完美装备组合',
  type: 'beach',
  categories: [
    {
      name: '证件',
      icon: '🆔',
      items: [
        { name: '身份证/护照', category: '证件', quantity: 1, unit: '张', weight: 0.01 },
        { name: '机票/车票', category: '证件', quantity: 1, unit: '张', weight: 0.01 },
        { name: '酒店预订确认单', category: '证件', quantity: 1, unit: '份', weight: 0.02 }
      ]
    },
    {
      name: '衣物',
      icon: '👕',
      items: [
        { name: '短袖T恤', category: '衣物', quantity: 5, unit: '件', weight: 0.5 },
        { name: '短裤', category: '衣物', quantity: 3, unit: '条', weight: 0.3 },
        { name: '凉鞋', category: '衣物', quantity: 1, unit: '双', weight: 0.4 },
        { name: '遮阳帽', category: '衣物', quantity: 1, unit: '顶', weight: 0.1 },
        { name: '薄外套', category: '衣物', quantity: 1, unit: '件', weight: 0.3, note: '空调房用' }
      ]
    },
    {
      name: '海滩装备',
      icon: '🏖️',
      items: [
        { name: '泳衣', category: '海滩装备', quantity: 2, unit: '套', weight: 0.2 },
        { name: '沙滩巾', category: '海滩装备', quantity: 1, unit: '条', weight: 0.4 },
        { name: '浮潜装备', category: '海滩装备', quantity: 1, unit: '套', weight: 0.5, note: '可选' },
        { name: '防水手机袋', category: '海滩装备', quantity: 1, unit: '个', weight: 0.05 }
      ]
    },
    {
      name: '防晒用品',
      icon: '🧴',
      items: [
        { name: '防晒霜SPF50+', category: '防晒用品', quantity: 1, unit: '瓶', weight: 0.2, note: '面部专用' },
        { name: '身体防晒霜', category: '防晒用品', quantity: 1, unit: '瓶', weight: 0.3 },
        { name: '太阳镜', category: '防晒用品', quantity: 1, unit: '副', weight: 0.05, note: 'UV400防护' },
        { name: '晒后修复霜', category: '防晒用品', quantity: 1, unit: '瓶', weight: 0.2 },
        { name: '润唇膏带防晒', category: '防晒用品', quantity: 1, unit: '支', weight: 0.01 }
      ]
    },
    {
      name: '洗漱用品',
      icon: '🧴',
      items: [
        { name: '旅行洗漱套装', category: '洗漱用品', quantity: 1, unit: '套', weight: 0.4 },
        { name: '驱蚊液', category: '洗漱用品', quantity: 1, unit: '瓶', weight: 0.1 }
      ]
    }
  ]
}

const hikingTemplate: LuggageTemplate = {
  id: 'hiking',
  name: '徒步装备',
  icon: '🥾',
  description: '户外徒步登山的专业装备',
  type: 'hiking',
  categories: [
    {
      name: '证件',
      icon: '🆔',
      items: [
        { name: '身份证', category: '证件', quantity: 1, unit: '张', weight: 0.01 },
        { name: '保险单', category: '证件', quantity: 1, unit: '份', weight: 0.02 },
        { name: '紧急联系卡', category: '证件', quantity: 1, unit: '张', weight: 0.01 }
      ]
    },
    {
      name: '运动装备',
      icon: '🎽',
      items: [
        { name: '登山杖', category: '运动装备', quantity: 2, unit: '根', weight: 0.6 },
        { name: '登山包60L', category: '运动装备', quantity: 1, unit: '个', weight: 2, note: '带防雨罩' },
        { name: '头灯', category: '运动装备', quantity: 1, unit: '个', weight: 0.1, note: '带备用电池' },
        { name: '登山绳', category: '运动装备', quantity: 1, unit: '根', weight: 0.8, note: '根据路线选择' }
      ]
    },
    {
      name: '衣物',
      icon: '👕',
      items: [
        { name: '速干T恤', category: '衣物', quantity: 3, unit: '件', weight: 0.45 },
        { name: '冲锋衣', category: '衣物', quantity: 1, unit: '件', weight: 0.8, note: '防水透气' },
        { name: '抓绒衣', category: '衣物', quantity: 1, unit: '件', weight: 0.5 },
        { name: '速干裤', category: '衣物', quantity: 2, unit: '条', weight: 0.5 },
        { name: '登山袜', category: '衣物', quantity: 4, unit: '双', weight: 0.2 },
        { name: '登山鞋', category: '衣物', quantity: 1, unit: '双', weight: 1.5, note: '高帮防水' }
      ]
    },
    {
      name: '医疗用品',
      icon: '💊',
      items: [
        { name: '创可贴', category: '医疗用品', quantity: 10, unit: '片', weight: 0.05 },
        { name: '碘伏棉签', category: '医疗用品', quantity: 20, unit: '支', weight: 0.1 },
        { name: '止痛药', category: '医疗用品', quantity: 1, unit: '盒', weight: 0.05 },
        { name: '肠胃药', category: '医疗用品', quantity: 1, unit: '盒', weight: 0.05 },
        { name: '弹性绷带', category: '医疗用品', quantity: 2, unit: '卷', weight: 0.1 }
      ]
    },
    {
      name: '电子设备',
      icon: '📱',
      items: [
        { name: '手机', category: '电子设备', quantity: 1, unit: '部', weight: 0.2 },
        { name: 'GPS导航仪', category: '电子设备', quantity: 1, unit: '台', weight: 0.2 },
        { name: '对讲机', category: '电子设备', quantity: 1, unit: '台', weight: 0.25, note: '团队出行必备' },
        { name: '大容量移动电源', category: '电子设备', quantity: 1, unit: '个', weight: 0.5, note: '20000mAh' }
      ]
    }
  ]
}

const cityTemplate: LuggageTemplate = {
  id: 'city',
  name: '城市观光',
  icon: '🏙️',
  description: '城市休闲旅游的基础装备',
  type: 'city',
  categories: [
    {
      name: '证件',
      icon: '🆔',
      items: [
        { name: '身份证', category: '证件', quantity: 1, unit: '张', weight: 0.01 },
        { name: '交通卡', category: '证件', quantity: 1, unit: '张', weight: 0.01 },
        { name: '景点门票', category: '证件', quantity: 1, unit: '份', weight: 0.02 }
      ]
    },
    {
      name: '衣物',
      icon: '👕',
      items: [
        { name: '休闲T恤', category: '衣物', quantity: 3, unit: '件', weight: 0.45 },
        { name: '牛仔裤', category: '衣物', quantity: 2, unit: '条', weight: 0.8 },
        { name: '舒适运动鞋', category: '衣物', quantity: 1, unit: '双', weight: 0.8, note: '适合长时间步行' },
        { name: '休闲外套', category: '衣物', quantity: 1, unit: '件', weight: 0.5 }
      ]
    },
    {
      name: '电子设备',
      icon: '📱',
      items: [
        { name: '手机', category: '电子设备', quantity: 1, unit: '部', weight: 0.2 },
        { name: '相机', category: '电子设备', quantity: 1, unit: '台', weight: 0.5, note: '记录美好瞬间' },
        { name: '移动电源', category: '电子设备', quantity: 1, unit: '个', weight: 0.3 },
        { name: '自拍杆', category: '电子设备', quantity: 1, unit: '根', weight: 0.15 }
      ]
    },
    {
      name: '旅行配件',
      icon: '🎒',
      items: [
        { name: '背包', category: '旅行配件', quantity: 1, unit: '个', weight: 0.6, note: '日常出行用' },
        { name: 'U型枕', category: '旅行配件', quantity: 1, unit: '个', weight: 0.3, note: '旅途休息' },
        { name: '眼罩耳塞', category: '旅行配件', quantity: 1, unit: '套', weight: 0.05 },
        { name: '折叠伞', category: '旅行配件', quantity: 1, unit: '把', weight: 0.3 }
      ]
    },
    {
      name: '洗漱用品',
      icon: '🧴',
      items: [
        { name: '旅行洗漱包', category: '洗漱用品', quantity: 1, unit: '个', weight: 0.5 }
      ]
    }
  ]
}

const winterTemplate: LuggageTemplate = {
  id: 'winter',
  name: '冬日旅行',
  icon: '❄️',
  description: '应对严寒天气的保暖装备',
  type: 'winter',
  categories: [
    {
      name: '证件',
      icon: '🆔',
      items: [
        { name: '身份证', category: '证件', quantity: 1, unit: '张', weight: 0.01 }
      ]
    },
    {
      name: '保暖装备',
      icon: '🧣',
      items: [
        { name: '厚羽绒服', category: '保暖装备', quantity: 1, unit: '件', weight: 1.5, note: '充绒量200g+' },
        { name: '保暖内衣套装', category: '保暖装备', quantity: 2, unit: '套', weight: 0.6 },
        { name: '羊绒毛衣', category: '保暖装备', quantity: 2, unit: '件', weight: 0.6 },
        { name: '加绒裤', category: '保暖装备', quantity: 2, unit: '条', weight: 0.8 },
        { name: '保暖护膝', category: '保暖装备', quantity: 1, unit: '副', weight: 0.2 }
      ]
    },
    {
      name: '衣物',
      icon: '👕',
      items: [
        { name: '厚围巾', category: '衣物', quantity: 1, unit: '条', weight: 0.2 },
        { name: '针织帽子', category: '衣物', quantity: 1, unit: '顶', weight: 0.1 },
        { name: '保暖手套', category: '衣物', quantity: 1, unit: '副', weight: 0.15, note: '触屏款' },
        { name: '雪地靴', category: '衣物', quantity: 1, unit: '双', weight: 1.5, note: '防滑防水' },
        { name: '厚袜子', category: '衣物', quantity: 5, unit: '双', weight: 0.3 }
      ]
    },
    {
      name: '医疗用品',
      icon: '💊',
      items: [
        { name: '暖宝宝', category: '医疗用品', quantity: 10, unit: '片', weight: 0.5, note: '贴腰贴脚' },
        { name: '润唇膏', category: '医疗用品', quantity: 1, unit: '支', weight: 0.01 },
        { name: '保湿面霜', category: '医疗用品', quantity: 1, unit: '瓶', weight: 0.1 },
        { name: '防冻霜', category: '医疗用品', quantity: 1, unit: '支', weight: 0.05 }
      ]
    },
    {
      name: '电子设备',
      icon: '📱',
      items: [
        { name: '手机', category: '电子设备', quantity: 1, unit: '部', weight: 0.2 },
        { name: '充电宝', category: '电子设备', quantity: 1, unit: '个', weight: 0.3, note: '低温下电量消耗快' }
      ]
    }
  ]
}

export const templates: LuggageTemplate[] = [
  businessTemplate,
  beachTemplate,
  hikingTemplate,
  cityTemplate,
  winterTemplate
]

export function getTemplateById(id: string): LuggageTemplate | undefined {
  return templates.find(t => t.id === id)
}

const weatherAdjustments: Record<WeatherType, Array<{ category: string; item: Omit<LuggageItem, 'id' | 'packed'>; remove?: boolean }>> = {
  tropical: [
    { category: '防晒用品', item: { name: '防晒霜SPF50+', category: '防晒用品', quantity: 1, unit: '瓶', weight: 0.2 } },
    { category: '衣物', item: { name: '透气速干衣', category: '衣物', quantity: 2, unit: '件', weight: 0.2 } },
    { category: '洗漱用品', item: { name: '驱蚊液', category: '洗漱用品', quantity: 1, unit: '瓶', weight: 0.1 } },
    { category: '海滩装备', item: { name: '泳衣', category: '海滩装备', quantity: 1, unit: '套', weight: 0.1 } }
  ],
  cold: [
    { category: '保暖装备', item: { name: '厚羽绒服', category: '保暖装备', quantity: 1, unit: '件', weight: 1.5 } },
    { category: '保暖装备', item: { name: '保暖内衣', category: '保暖装备', quantity: 1, unit: '套', weight: 0.3 } },
    { category: '衣物', item: { name: '厚围巾', category: '衣物', quantity: 1, unit: '条', weight: 0.2 } },
    { category: '衣物', item: { name: '保暖手套', category: '衣物', quantity: 1, unit: '副', weight: 0.15 } },
    { category: '医疗用品', item: { name: '暖宝宝', category: '医疗用品', quantity: 10, unit: '片', weight: 0.5 } }
  ],
  temperate: [],
  desert: [
    { category: '防晒用品', item: { name: '高倍防晒霜', category: '防晒用品', quantity: 2, unit: '瓶', weight: 0.4 } },
    { category: '防晒用品', item: { name: '遮阳面罩', category: '防晒用品', quantity: 1, unit: '个', weight: 0.05 } },
    { category: '衣物', item: { name: '防晒长袖衫', category: '衣物', quantity: 2, unit: '件', weight: 0.3 } },
    { category: '旅行配件', item: { name: '水壶', category: '旅行配件', quantity: 2, unit: '个', weight: 0.5, note: '保持充足水分' } }
  ],
  rainy: [
    { category: '雨具', item: { name: '折叠雨伞', category: '雨具', quantity: 1, unit: '把', weight: 0.3 } },
    { category: '雨具', item: { name: '便携雨衣', category: '雨具', quantity: 1, unit: '件', weight: 0.15 } },
    { category: '雨具', item: { name: '防水鞋套', category: '雨具', quantity: 1, unit: '双', weight: 0.1 } },
    { category: '电子设备', item: { name: '防水袋', category: '电子设备', quantity: 1, unit: '个', weight: 0.05, note: '保护手机等设备' } }
  ]
}

export function generateLuggageList(
  templateId: string,
  weatherType: WeatherType,
  days: number
): LuggageItem[] {
  const template = getTemplateById(templateId)
  if (!template) return []

  const result: LuggageItem[] = []
  const multiplier = Math.ceil(days / 3)

  template.categories.forEach(category => {
    category.items.forEach(item => {
      const isConsumable = ['袜子', '内衣', 'T恤', '衬衫'].some(keyword => item.name.includes(keyword))
      const adjustedQuantity = isConsumable 
        ? Math.max(item.quantity, Math.ceil(item.quantity * multiplier * 0.5))
        : item.quantity

      result.push({
        id: `${template.id}-${category.name}-${item.name}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        category: category.name,
        quantity: adjustedQuantity,
        unit: item.unit,
        packed: false,
        note: item.note,
        weight: (item.weight || 0) * adjustedQuantity
      })
    })
  })

  const adjustments = weatherAdjustments[weatherType]
  adjustments.forEach(adj => {
    const exists = result.some(item => item.name === adj.item.name)
    if (!exists) {
      result.push({
        id: `weather-${adj.category}-${adj.item.name}-${Math.random().toString(36).substr(2, 9)}`,
        ...adj.item
      })
    }
  })

  return result
}
