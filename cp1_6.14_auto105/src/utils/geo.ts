const COUNTRY_CONTINENT_MAP: Record<string, string> = {
  CN: 'Asia', JP: 'Asia', KR: 'Asia', IN: 'Asia', TH: 'Asia',
  VN: 'Asia', SG: 'Asia', MY: 'Asia', ID: 'Asia', PH: 'Asia',
  HK: 'Asia', TW: 'Asia', MO: 'Asia', KP: 'Asia', MN: 'Asia',
  KH: 'Asia', LA: 'Asia', MM: 'Asia', BD: 'Asia', NP: 'Asia',
  BT: 'Asia', LK: 'Asia', MV: 'Asia', AF: 'Asia', PK: 'Asia',
  IR: 'Asia', IQ: 'Asia', KW: 'Asia', SA: 'Asia', AE: 'Asia',
  OM: 'Asia', YE: 'Asia', SY: 'Asia', LB: 'Asia', IL: 'Asia',
  PS: 'Asia', JO: 'Asia', TR: 'Asia', CY: 'Asia', GE: 'Asia',
  AM: 'Asia', AZ: 'Asia', KZ: 'Asia', KG: 'Asia', TJ: 'Asia',
  TM: 'Asia', UZ: 'Asia', BN: 'Asia', TL: 'Asia',

  DE: 'Europe', FR: 'Europe', GB: 'Europe', IT: 'Europe', ES: 'Europe',
  PT: 'Europe', NL: 'Europe', BE: 'Europe', CH: 'Europe', AT: 'Europe',
  SE: 'Europe', NO: 'Europe', DK: 'Europe', FI: 'Europe', IS: 'Europe',
  PL: 'Europe', CZ: 'Europe', SK: 'Europe', HU: 'Europe', RO: 'Europe',
  BG: 'Europe', GR: 'Europe', RU: 'Europe', UA: 'Europe', BY: 'Europe',
  LT: 'Europe', LV: 'Europe', EE: 'Europe', IE: 'Europe', LU: 'Europe',
  MC: 'Europe', SM: 'Europe', VA: 'Europe', LI: 'Europe', AD: 'Europe',
  MT: 'Europe', SI: 'Europe', HR: 'Europe', BA: 'Europe', RS: 'Europe',
  MK: 'Europe', AL: 'Europe', ME: 'Europe', XK: 'Europe', MD: 'Europe',

  US: 'North America', CA: 'North America', MX: 'North America',
  CU: 'North America', JM: 'North America', HT: 'North America',
  DO: 'North America', PR: 'North America', CR: 'North America',
  PA: 'North America', GT: 'North America', HN: 'North America',
  SV: 'North America', NI: 'North America', BZ: 'North America',
  BS: 'North America', TT: 'North America', BB: 'North America',
  LC: 'North America', VC: 'North America', GD: 'North America',
  AG: 'North America', DM: 'North America', KN: 'North America',

  BR: 'South America', AR: 'South America', CL: 'South America',
  PE: 'South America', CO: 'South America', VE: 'South America',
  EC: 'South America', BO: 'South America', PY: 'South America',
  UY: 'South America', GY: 'South America', SR: 'South America',
  GF: 'South America', FK: 'South America',

  ZA: 'Africa', EG: 'Africa', NG: 'Africa', KE: 'Africa', MA: 'Africa',
  TN: 'Africa', DZ: 'Africa', LY: 'Africa', ET: 'Africa', GH: 'Africa',
  CI: 'Africa', CM: 'Africa', UG: 'Africa', TZ: 'Africa', ZM: 'Africa',
  ZW: 'Africa', NA: 'Africa', BW: 'Africa', LS: 'Africa', SZ: 'Africa',
  MW: 'Africa', MZ: 'Africa', AO: 'Africa', CD: 'Africa', CG: 'Africa',
  GA: 'Africa', GQ: 'Africa', ST: 'Africa', CV: 'Africa', MR: 'Africa',
  SN: 'Africa', GM: 'Africa', SL: 'Africa', LR: 'Africa', GN: 'Africa',
  GW: 'Africa', BJ: 'Africa', TG: 'Africa', BF: 'Africa', NE: 'Africa',
  ML: 'Africa', TD: 'Africa', SD: 'Africa', ER: 'Africa', DJ: 'Africa',
  SO: 'Africa', RW: 'Africa', BI: 'Africa', BU: 'Africa', SC: 'Africa',
  MU: 'Africa', KM: 'Africa', MG: 'Africa', RE: 'Africa',

  AU: 'Oceania', NZ: 'Oceania', FJ: 'Oceania', PG: 'Oceania',
  WS: 'Oceania', TO: 'Oceania', TV: 'Oceania', KI: 'Oceania',
  MH: 'Oceania', FM: 'Oceania', PW: 'Oceania', NR: 'Oceania',
  VU: 'Oceania', SB: 'Oceania', NC: 'Oceania', PF: 'Oceania',
  AS: 'Oceania', GU: 'Oceania', MP: 'Oceania', UM: 'Oceania',
  VI: 'Oceania',
}

export function getContinentByCountryCode(countryCode: string): string {
  return COUNTRY_CONTINENT_MAP[countryCode] || 'Unknown'
}

export function getContinentByLatLng(lat: number, lng: number): string {
  if (lat > 35 && lng > -10 && lng < 60) return 'Europe'
  if (lat > 0 && lng > 60 && lng < 150) return 'Asia'
  if (lat < 35 && lat > -35 && lng > -20 && lng < 55) return 'Africa'
  if (lat > 15 && lng < -50 && lng > -170) return 'North America'
  if (lat < 15 && lat > -55 && lng < -30 && lng > -85) return 'South America'
  if (lat < 0 && lng > 110 && lng < 180) return 'Oceania'
  if (lat < -60) return 'Antarctica'
  return 'Unknown'
}

export const COUNTRY_NAMES: Record<string, string> = {
  CN: '中国', US: '美国', JP: '日本', DE: '德国', FR: '法国',
  GB: '英国', IT: '意大利', ES: '西班牙', CA: '加拿大', AU: '澳大利亚',
  KR: '韩国', RU: '俄罗斯', BR: '巴西', IN: '印度', MX: '墨西哥',
  ID: '印度尼西亚', TH: '泰国', VN: '越南', PH: '菲律宾', MY: '马来西亚',
  SG: '新加坡', NZ: '新西兰', NL: '荷兰', BE: '比利时', CH: '瑞士',
  AT: '奥地利', SE: '瑞典', NO: '挪威', DK: '丹麦', FI: '芬兰',
  PL: '波兰', CZ: '捷克', HU: '匈牙利', GR: '希腊', PT: '葡萄牙',
  TR: '土耳其', EG: '埃及', ZA: '南非', KE: '肯尼亚', MA: '摩洛哥',
  AR: '阿根廷', CL: '智利', PE: '秘鲁', CO: '哥伦比亚', VE: '委内瑞拉',
  HK: '中国香港', TW: '中国台湾', MO: '中国澳门', CU: '古巴', JM: '牙买加',
  HT: '海地', DO: '多米尼加', PR: '波多黎各', CR: '哥斯达黎加', PA: '巴拿马',
  GT: '危地马拉', HN: '洪都拉斯', SV: '萨尔瓦多', NI: '尼加拉瓜', BZ: '伯利兹',
  BS: '巴哈马', TT: '特立尼达和多巴哥', BB: '巴巴多斯', LC: '圣卢西亚',
  VC: '圣文森特和格林纳丁斯', GD: '格林纳达', AG: '安提瓜和巴布达',
  DM: '多米尼克', KN: '圣基茨和尼维斯',
}
