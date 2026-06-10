import { CelestialEvent, XunScore, Weather } from './types';

const API_BASE = '/api';

export async function generateCelestialEvent(weather: Weather): Promise<CelestialEvent> {
  try {
    const response = await fetch(`${API_BASE}/generate-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weather }),
    });
    return await response.json();
  } catch {
    return fallbackGenerateEvent(weather);
  }
}

export async function validateChoice(eventId: string, constellationId: string, inscription: string): Promise<{ isCorrect: boolean; cultivationGain: number }> {
  try {
    const response = await fetch(`${API_BASE}/validate-choice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, constellationId, inscription }),
    });
    return await response.json();
  } catch {
    return fallbackValidateChoice(eventId, constellationId, inscription);
  }
}

export async function calculateXunScore(accuracy: number, cultivation: number, totalEvents: number): Promise<XunScore> {
  try {
    const response = await fetch(`${API_BASE}/calculate-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accuracy, cultivation, totalEvents }),
    });
    return await response.json();
  } catch {
    return fallbackCalculateScore(accuracy, cultivation, totalEvents);
  }
}

let eventStore: Record<string, { constellationId: string; correctInscription: string }> = {};

function fallbackGenerateEvent(weather: Weather): CelestialEvent {
  const eventTypes = [
    { type: 'meteor', name: '流星划过', desc: '西方天际有流星划过，其色赤红，主西方有兵戈之象' },
    { type: 'comet', name: '彗星现世', desc: '彗星见于东方，尾长三丈，主有乱臣贼子欲谋逆' },
    { type: 'eclipse', name: '月食异象', desc: '月食于子夜时分，天地昏暗，主阴盛阳衰' },
  ];
  const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const constellationIds = ['jiao', 'kang', 'di', 'fang', 'xin', 'wei', 'ji', 'dou', 'niu', 'nv', 'xu', 'shi', 'bi', 'kui', 'lou', 'mao', 'bi2', 'shen', 'jing', 'gui', 'liu', 'xing', 'zhang', 'yi', 'zhen'];
  const randomConst = constellationIds[Math.floor(Math.random() * constellationIds.length)];
  
  const inscriptions = ['镇星安位', '辉光普照', '润物无声', '木秀于林', '金刚不坏', '吉星高照', '避邪扶正', '凝神聚气', '清风徐来', '静水流深', '明镜高悬', '偃武修文'];
  const correctInscription = inscriptions[Math.floor(Math.random() * inscriptions.length)];
  
  const otherConsts = constellationIds.filter(c => c !== randomConst);
  const otherInscriptions = inscriptions.filter(i => i !== correctInscription);
  
  const options = [
    { constellationId: randomConst, inscription: correctInscription, isCorrect: true },
    { constellationId: otherConsts[Math.floor(Math.random() * otherConsts.length)], inscription: otherInscriptions[Math.floor(Math.random() * otherInscriptions.length)], isCorrect: false },
    { constellationId: otherConsts[Math.floor(Math.random() * otherConsts.length)], inscription: otherInscriptions[Math.floor(Math.random() * otherInscriptions.length)], isCorrect: false },
  ].sort(() => Math.random() - 0.5);
  
  const eventId = `event-${Date.now()}`;
  eventStore[eventId] = { constellationId: randomConst, correctInscription };
  
  let difficulty = 1 + weather.modifier;
  if (weather.type === 'thunder') difficulty += 0.3;
  if (weather.type === 'rain') difficulty += 0.1;
  
  return {
    id: eventId,
    type: randomType.type as any,
    name: randomType.name,
    description: randomType.desc,
    constellationId: randomConst,
    correctInscription,
    options,
    difficulty: Math.round(difficulty * 10) / 10,
    timeLimit: 15,
  };
}

function fallbackValidateChoice(eventId: string, constellationId: string, inscription: string): { isCorrect: boolean; cultivationGain: number } {
  const event = eventStore[eventId];
  if (!event) {
    return { isCorrect: false, cultivationGain: 0 };
  }
  
  const isCorrect = constellationId === event.constellationId && inscription === event.correctInscription;
  delete eventStore[eventId];
  
  if (isCorrect) {
    return { isCorrect: true, cultivationGain: 20 };
  }
  return { isCorrect: false, cultivationGain: 0 };
}

function fallbackCalculateScore(accuracy: number, cultivation: number, totalEvents: number): XunScore {
  const accuracyScore = Math.round(accuracy * 50);
  const cultivationScore = Math.min(Math.round(cultivation / 10), 30);
  const eventScore = Math.min(totalEvents * 2, 20);
  const totalScore = accuracyScore + cultivationScore + eventScore;
  
  let rank = '铜星官';
  let comment = '继续努力，天道酬勤';
  if (totalScore >= 90) { rank = '紫微星官'; comment = '功参造化，名垂青史'; }
  else if (totalScore >= 80) { rank = '太白金官'; comment = '政绩卓著，万民敬仰'; }
  else if (totalScore >= 70) { rank = '青龙星官'; comment = '勤勉有加，渐入佳境'; }
  else if (totalScore >= 60) { rank = '玄武星官'; comment = '恪尽职守，可堪大任'; }
  
  return { totalScore, accuracyScore, cultivationScore, eventScore, rank, comment };
}
