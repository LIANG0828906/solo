type Fortune = 'supreme' | 'neutral' | 'dire'

interface DivinationRule {
  name: string
  check: (lons: number[]) => boolean
  text: string
  fortune: Fortune
}

function angleDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % 360
  if (d > 180) d = 360 - d
  return d
}

function isConjuction(a: number, b: number, threshold: number = 15): boolean {
  return angleDiff(a, b) < threshold
}

function isOpposition(a: number, b: number): boolean {
  const d = angleDiff(a, b)
  return d >= 165 && d <= 195
}

const RULES: DivinationRule[] = [
  {
    name: '火土合相',
    check: (l) => isConjuction(l[2], l[5]),
    text: '荧惑与镇星相合于天，主兵乱之兆。《开元占经》云："火星与土星合，其国有兵革之忧，边疆不宁，烽烟四起。"观此星象，宜固守城防，勿轻启战端，谨防变故生于肘腋之间。',
    fortune: 'dire'
  },
  {
    name: '木日合相',
    check: (l) => isConjuction(l[4], l[0]),
    text: '岁星与日同躔，此乃大吉之兆。《开元占经》云："木星与太阳合，天下太平，五谷丰登，君明臣良。"祥瑞降临，国泰民安，百业兴旺，宜行大事，万事亨通。',
    fortune: 'supreme'
  },
  {
    name: '金月合相',
    check: (l) => isConjuction(l[3], l[1]),
    text: '太白与太阴相会，风调雨顺之象。《开元占经》云："金星与月同度，阴阳和合，甘露降而百谷成。"此兆主丰年，百姓安居，物产丰饶，天下晏然。',
    fortune: 'supreme'
  },
  {
    name: '火金冲相',
    check: (l) => isOpposition(l[2], l[3]),
    text: '荧惑冲太白，刑伐之象昭然。《开元占经》云："火星与金星冲，主刀兵刑狱，刑罚失中。"当慎行事，谨言慎行，免遭口舌之祸，忌远行涉险。',
    fortune: 'dire'
  },
  {
    name: '木土合相',
    check: (l) => isConjuction(l[4], l[5]),
    text: '岁星与镇星相合，土木兴作之象。《开元占经》云："木星与土星合，主营造修筑，基建大利。"宜修城筑舍，兴工动土，凡土木之事皆有所成，然需量力而行。',
    fortune: 'neutral'
  },
  {
    name: '日月冲相',
    check: (l) => isOpposition(l[0], l[1]),
    text: '日月相冲，阴阳失序之象。《开元占经》云："日与月冲，主君臣不和，朝野猜忌，上下离心。"此兆示人心离散，宜调和阴阳，修身养德，以安天下。',
    fortune: 'dire'
  },
  {
    name: '水日合相',
    check: (l) => isConjuction(l[6], l[0], 10),
    text: '辰星入日，文运亨通之兆。《开元占经》云："水星与太阳合，主文教昌盛，科考有利，士子成名。"宜攻书修文，进取功名，文思泉涌，下笔有神。',
    fortune: 'supreme'
  },
  {
    name: '火日合相',
    check: (l) => isConjuction(l[2], l[0]),
    text: '荧惑犯日，天火之象。《开元占经》云："火星入日，主火灾旱灾，当防灾厄。"然火亦主革新，危中有机，宜谨防灾患，亦宜除旧布新，化险为夷。',
    fortune: 'neutral'
  },
  {
    name: '金木合相',
    check: (l) => isConjuction(l[3], l[4]),
    text: '太白与岁星相合，仁德之兆。《开元占经》云："金星与木星合，主和气致祥，君子道长。"此象大吉，人际关系和谐，宜结善缘、行仁义，福报自至。',
    fortune: 'supreme'
  },
  {
    name: '土月冲相',
    check: (l) => isOpposition(l[5], l[1]),
    text: '镇星冲太阴，民怨之象。《开元占经》云："土星与月冲，主民心生怨，施政当宽。"宜施仁政，轻徭薄赋，安抚民心，勿以苛政驱民。',
    fortune: 'dire'
  }
]

const DEFAULT_DIVINATION: { text: string; fortune: Fortune } = {
  text: '诸星各行其道，无特殊会合冲犯之象。《开元占经》云："七政不犯，天下无事。"星象平和，宜静守以待时变，顺天应人，不妄动则吉。守常待时，徐图进取，方为上策。',
  fortune: 'neutral'
}

const FORTUNE_LABELS: Record<Fortune, string> = {
  supreme: '上上签',
  neutral: '中平签',
  dire: '下下签'
}

let readingArea: HTMLElement
let fortuneSign: HTMLElement
let currentAnimationTimer: number | null = null

function clearAnimation(): void {
  if (currentAnimationTimer !== null) {
    clearInterval(currentAnimationTimer)
    currentAnimationTimer = null
  }
}

function animateText(text: string): void {
  clearAnimation()
  readingArea.innerHTML = ''

  const chars: HTMLSpanElement[] = []
  for (const ch of text) {
    const span = document.createElement('span')
    span.className = 'char'
    span.textContent = ch
    readingArea.appendChild(span)
    chars.push(span)
  }

  let idx = 0
  currentAnimationTimer = window.setInterval(() => {
    if (idx >= chars.length) {
      clearAnimation()
      return
    }
    chars[idx].classList.add('visible')
    if (idx + 1 < chars.length) {
      chars[idx + 1].classList.add('visible')
    }
    idx += 2
  }, 200)
}

function updateFortuneSign(fortune: Fortune): void {
  fortuneSign.className = `fortune-sign ${fortune}`
  fortuneSign.textContent = FORTUNE_LABELS[fortune]
}

export function initDivination(panel: HTMLElement, sign: HTMLElement): void {
  readingArea = panel
  fortuneSign = sign
}

export function performDivination(longitudes: number[]): void {
  const matched: DivinationRule[] = []

  for (const rule of RULES) {
    if (rule.check(longitudes)) {
      matched.push(rule)
    }
  }

  let text: string
  let fortune: Fortune

  if (matched.length === 0) {
    text = DEFAULT_DIVINATION.text
    fortune = DEFAULT_DIVINATION.fortune
  } else {
    const parts: string[] = []
    let worst: Fortune = 'neutral'

    const fortuneRank: Record<Fortune, number> = { supreme: 0, neutral: 1, dire: 2 }

    for (const rule of matched) {
      parts.push(`【${rule.name}】${rule.text}`)
      if (fortuneRank[rule.fortune] > fortuneRank[worst]) {
        worst = rule.fortune
      }
    }

    text = parts.join('\n\n')
    fortune = worst
  }

  updateFortuneSign(fortune)
  animateText(text)
}
