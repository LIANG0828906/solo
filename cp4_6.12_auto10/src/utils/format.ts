export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

export function clayTypeName(name: string): string {
  const map: Record<string, string> = {
    porcelain: '瓷泥',
    stoneware: '陶泥',
    red_clay: '紫砂泥',
    white_clay: '白瓷泥',
    black_clay: '黑陶泥',
  }
  return map[name] || name
}

export function vesselTypeName(name: string): string {
  const map: Record<string, string> = {
    teacup: '茶杯',
    teapot: '茶壶',
    bowl: '碗',
    plate: '盘子',
    vase: '花瓶',
    jar: '罐子',
    mug: '马克杯',
    saucer: '茶托',
  }
  return map[name] || name
}

export function statusName(status: string): string {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    preparing: '泥坯准备中',
    throwing: '拉坯成型',
    trimming: '修坯干燥',
    bisque: '素烧',
    glazing: '釉烧',
    finishing: '打磨出窑',
    done: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: '#BDBDBD',
    confirmed: '#BDBDBD',
    preparing: '#42A5F5',
    throwing: '#42A5F5',
    trimming: '#42A5F5',
    bisque: '#FF7043',
    glazing: '#FF7043',
    finishing: '#FF7043',
    done: '#66BB6A',
    cancelled: '#EF5350',
  }
  return map[status] || '#BDBDBD'
}

export function qualityStars(quality: number): string {
  const q = Math.max(0, Math.min(5, Math.floor(quality)))
  return '★'.repeat(q) + '☆'.repeat(5 - q)
}

export function materialName(name: string): string {
  const map: Record<string, string> = {
    feldspar: '长石',
    quartz: '石英',
    kaolin: '高岭土',
    ball_clay: '球土',
    limestone: '石灰石',
    dolomite: '白云石',
    talc: '滑石',
    zinc_oxide: '氧化锌',
    iron_oxide: '氧化铁',
    copper_oxide: '氧化铜',
    cobalt_oxide: '氧化钴',
    manganese_oxide: '氧化锰',
    titanium_dioxide: '二氧化钛',
  }
  return map[name] || name
}
