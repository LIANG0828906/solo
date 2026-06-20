import { EventItem, Participant, CheckInRecord, PointsLog } from './types';

const EVENTS_KEY = 'acp_events';
const PARTICIPANTS_KEY = 'acp_participants';
const CHECKIN_RECORDS_KEY = 'acp_checkin_records';
const POINTS_LOGS_KEY = 'acp_points_logs';

const sampleNames = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六',
  '蒋十七', '沈十八', '韩十九', '杨二十', '朱二十一', '秦二十二',
  '尤二十三', '许二十四', '何二十五', '吕二十六', '施二十七',
  '张二十八', '孔二十九', '曹三十', '严三十一', '华三十二',
  '金三十三', '魏三十四', '陶三十五', '姜三十六', '戚三十七',
  '谢三十八', '邹三十九', '喻四十', '柏四十一', '水四十二',
  '窦四十三', '章四十四', '云四十五', '苏四十六', '潘四十七',
  '葛四十八', '奚四十九', '范五十', '彭五十一', '郎五十二',
  '鲁五十三', '韦五十四', '昌五十五', '马五十六', '苗五十七',
  '凤五十八', '花五十九', '方六十', '俞六十一', '任六十二',
  '袁六十三', '柳六十四', '酆六十五', '鲍六十六', '史六十七',
  '唐六十八', '费六十九', '廉七十', '岑七十一', '薛七十二',
  '雷七十三', '贺七十四', '倪七十五', '汤七十六', '滕七十七',
  '殷七十八', '罗七十九', '毕八十', '郝八十一', '邬八十二',
  '安八十三', '常八十四', '乐八十五', '于八十六', '时八十七',
  '傅八十八', '皮八十九', '卞九十', '齐九十一', '康九十二',
  '伍九十三', '余九十四', '元九十五', '卜九十六', '顾九十七',
  '孟九十八', '平九十九', '黄一百'
];

export const generateCheckInCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const generateMockParticipants = (): Participant[] => {
  return sampleNames.map((name, idx) => ({
    id: generateId() + idx,
    name,
    checkInCode: generateCheckInCode(),
    points: Math.floor(Math.random() * 50),
  }));
};

const generateMockEvents = (participants: Participant[]): EventItem[] => {
  const now = Date.now();
  const events: EventItem[] = [
    {
      id: generateId(),
      name: '2026年度技术分享大会',
      time: '2026-06-20 09:00 - 18:00',
      location: '国际会议中心A厅',
      maxParticipants: 200,
      checkInCode: generateCheckInCode(),
      participantIds: participants.slice(0, 45).map(p => p.id),
      checkedInIds: participants.slice(0, 28).map(p => p.id),
      createdAt: now - 86400000 * 7,
    },
    {
      id: generateId(),
      name: '产品设计思维工作坊',
      time: '2026-06-25 14:00 - 17:00',
      location: '创新空间3楼多功能厅',
      maxParticipants: 50,
      checkInCode: generateCheckInCode(),
      participantIds: participants.slice(10, 50).map(p => p.id),
      checkedInIds: participants.slice(10, 35).map(p => p.id),
      createdAt: now - 86400000 * 5,
    },
    {
      id: generateId(),
      name: '新员工入职培训',
      time: '2026-07-01 09:00 - 12:00',
      location: '总部大厦12楼培训室',
      maxParticipants: 30,
      checkInCode: generateCheckInCode(),
      participantIds: participants.slice(30, 55).map(p => p.id),
      checkedInIds: participants.slice(30, 40).map(p => p.id),
      createdAt: now - 86400000 * 3,
    },
    {
      id: generateId(),
      name: '夏季团建活动',
      time: '2026-07-15 08:00 - 20:00',
      location: '青山湖度假村',
      maxParticipants: 100,
      checkInCode: generateCheckInCode(),
      participantIds: participants.slice(0, 80).map(p => p.id),
      checkedInIds: participants.slice(0, 10).map(p => p.id),
      createdAt: now - 86400000 * 1,
    },
  ];
  return events;
};

const generateMockCheckInRecords = (
  events: EventItem[],
  participants: Participant[]
): CheckInRecord[] => {
  const records: CheckInRecord[] = [];
  const participantMap = new Map(participants.map(p => [p.id, p]));

  events.forEach(event => {
    event.checkedInIds.forEach((pid, idx) => {
      const p = participantMap.get(pid);
      if (p) {
        records.push({
          id: generateId(),
          eventId: event.id,
          participantId: pid,
          participantName: p.name,
          timestamp: event.createdAt + 3600000 * (idx + 1),
        });
      }
    });
  });

  return records.sort((a, b) => b.timestamp - a.timestamp);
};

const generateMockPointsLogs = (
  events: EventItem[],
  participants: Participant[],
  records: CheckInRecord[]
): PointsLog[] => {
  const logs: PointsLog[] = [];
  const eventMap = new Map(events.map(e => [e.id, e]));
  const participantMap = new Map(participants.map(p => [p.id, p]));

  records.forEach(record => {
    const p = participantMap.get(record.participantId);
    const e = eventMap.get(record.eventId);
    if (p && e) {
      logs.push({
        id: generateId(),
        participantId: record.participantId,
        participantName: p.name,
        eventId: record.eventId,
        eventName: e.name,
        change: 10,
        reason: '活动签到',
        timestamp: record.timestamp,
      });
    }
  });

  participants.forEach(p => {
    if (p.points > 0) {
      const basePoints = p.points - (logs.filter(l => l.participantId === p.id).length * 10);
      if (basePoints > 0) {
        logs.push({
          id: generateId(),
          participantId: p.id,
          participantName: p.name,
          change: basePoints,
          reason: '初始积分奖励',
          timestamp: Date.now() - 86400000 * 30,
        });
      } else if (basePoints < 0) {
        logs.push({
          id: generateId(),
          participantId: p.id,
          participantName: p.name,
          change: basePoints,
          reason: '积分扣减',
          timestamp: Date.now() - 86400000 * 15,
        });
      }
    }
  });

  return logs.sort((a, b) => b.timestamp - a.timestamp);
};

const initMockData = () => {
  if (localStorage.getItem(EVENTS_KEY)) return;

  const participants = generateMockParticipants();
  const events = generateMockEvents(participants);
  const checkInRecords = generateMockCheckInRecords(events, participants);
  const pointsLogs = generateMockPointsLogs(events, participants, checkInRecords);

  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
  localStorage.setItem(CHECKIN_RECORDS_KEY, JSON.stringify(checkInRecords));
  localStorage.setItem(POINTS_LOGS_KEY, JSON.stringify(pointsLogs));
};

export const initData = (): void => {
  try {
    initMockData();
  } catch (e) {
    console.error('Failed to init data:', e);
  }
};

export const getEvents = (): EventItem[] => {
  try {
    const data = localStorage.getItem(EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveEvents = (events: EventItem[]): void => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

export const getParticipants = (): Participant[] => {
  try {
    const data = localStorage.getItem(PARTICIPANTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveParticipants = (participants: Participant[]): void => {
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
};

export const getCheckInRecords = (): CheckInRecord[] => {
  try {
    const data = localStorage.getItem(CHECKIN_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCheckInRecords = (records: CheckInRecord[]): void => {
  localStorage.setItem(CHECKIN_RECORDS_KEY, JSON.stringify(records));
};

export const getPointsLogs = (): PointsLog[] => {
  try {
    const data = localStorage.getItem(POINTS_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const savePointsLogs = (logs: PointsLog[]): void => {
  localStorage.setItem(POINTS_LOGS_KEY, JSON.stringify(logs));
};

export interface ExportData {
  events: EventItem[];
  participants: Participant[];
  checkInRecords: CheckInRecord[];
  pointsLogs: PointsLog[];
  exportedAt: number;
  version: string;
}

export const exportAllData = (): ExportData => {
  return {
    events: getEvents(),
    participants: getParticipants(),
    checkInRecords: getCheckInRecords(),
    pointsLogs: getPointsLogs(),
    exportedAt: Date.now(),
    version: '1.0.0',
  };
};

export const importAllData = (data: ExportData): boolean => {
  try {
    if (!data.events || !data.participants || !data.checkInRecords || !data.pointsLogs) {
      return false;
    }
    saveEvents(data.events);
    saveParticipants(data.participants);
    saveCheckInRecords(data.checkInRecords);
    savePointsLogs(data.pointsLogs);
    return true;
  } catch {
    return false;
  }
};

export const exportAsJSON = (): void => {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-checkin-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const success = importAllData(data);
        resolve(success);
      } catch {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
};
