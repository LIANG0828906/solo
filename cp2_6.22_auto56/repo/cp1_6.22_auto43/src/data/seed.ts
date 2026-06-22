import { LibrarySpot } from '../types'

export const spotLibrary: LibrarySpot[] = [
  { id: '1', name: '故宫博物院', city: '北京', lat: 39.9163, lng: 116.3972, description: '中国明清两代的皇家宫殿' },
  { id: '2', name: '天安门广场', city: '北京', lat: 39.9055, lng: 116.3976, description: '世界上最大的城市广场' },
  { id: '3', name: '长城（八达岭）', city: '北京', lat: 40.3576, lng: 116.0204, description: '世界文化遗产' },
  { id: '4', name: '颐和园', city: '北京', lat: 39.9999, lng: 116.2755, description: '中国现存最大的皇家园林' },
  { id: '5', name: '天坛', city: '北京', lat: 39.8882, lng: 116.4171, description: '明清皇帝祭天之所' },
  { id: '6', name: '外滩', city: '上海', lat: 31.2304, lng: 121.4998, description: '上海的标志性景观' },
  { id: '7', name: '东方明珠', city: '上海', lat: 31.2397, lng: 121.4998, description: '上海地标性建筑' },
  { id: '8', name: '豫园', city: '上海', lat: 31.2272, lng: 121.4925, description: '江南古典园林' },
  { id: '9', name: '西湖', city: '杭州', lat: 30.2741, lng: 120.1551, description: '世界文化遗产' },
  { id: '10', name: '灵隐寺', city: '杭州', lat: 30.2418, lng: 120.101, description: '中国佛教著名寺院' },
  { id: '11', name: '千岛湖', city: '杭州', lat: 29.6092, lng: 119.0376, description: '国家5A级旅游景区' },
  { id: '12', name: '成都大熊猫基地', city: '成都', lat: 30.7323, lng: 104.1365, description: '大熊猫繁育研究基地' },
  { id: '13', name: '锦里古街', city: '成都', lat: 30.6476, lng: 104.0563, description: '成都著名的商业步行街' },
  { id: '14', name: '宽窄巷子', city: '成都', lat: 30.6739, lng: 104.0629, description: '成都历史文化保护区' },
  { id: '15', name: '鼓浪屿', city: '厦门', lat: 24.4473, lng: 118.0665, description: '世界文化遗产' },
  { id: '16', name: '南普陀寺', city: '厦门', lat: 24.4453, lng: 118.0894, description: '闽南佛教胜地' },
]

export const cityCenterCoords: Record<string, [number, number]> = {
  '北京': [39.9042, 116.4074],
  '上海': [31.2304, 121.4737],
  '杭州': [30.2741, 120.1551],
  '成都': [30.5728, 104.0668],
  '厦门': [24.4798, 118.0894],
}

export const cityIcons = ['🏯', '🗼', '🏰', '🌆', '🏙️', '🌃', '⛩️', '🏛️', '🕌', '🕍', '🌇', '🎑']
