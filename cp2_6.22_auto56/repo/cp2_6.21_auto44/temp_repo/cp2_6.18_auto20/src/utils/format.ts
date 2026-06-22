function padZero(num: number): string {
  return num.toString().padStart(2, '0')
}

export function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  const nowDate = new Date(now)
  const targetDate = new Date(timestamp)

  const isYesterday =
    nowDate.getFullYear() === targetDate.getFullYear() &&
    nowDate.getMonth() === targetDate.getMonth() &&
    nowDate.getDate() - targetDate.getDate() === 1

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute)
    return `${minutes}分钟前`
  } else if (diff < day) {
    const hours = Math.floor(diff / hour)
    return `${hours}小时前`
  } else if (isYesterday && diff < 2 * day) {
    const hours = padZero(targetDate.getHours())
    const minutes = padZero(targetDate.getMinutes())
    return `昨天 ${hours}:${minutes}`
  } else if (diff < week) {
    const days = Math.floor(diff / day)
    return `${days}天前`
  } else {
    const year = targetDate.getFullYear()
    const month = padZero(targetDate.getMonth() + 1)
    const date = padZero(targetDate.getDate())
    return `${year}-${month}-${date}`
  }
}
