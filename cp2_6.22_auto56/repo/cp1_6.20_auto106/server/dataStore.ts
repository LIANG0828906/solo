import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  customQuestions: string[];
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  customAnswers: string[];
  checkedIn: boolean;
  checkinTime?: string;
  checkinSequence?: number;
  createdAt: string;
}

interface EventsData {
  events: Event[];
}

interface RegistrationsData {
  registrations: Registration[];
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readEvents(): Event[] {
  ensureDataDir();
  if (!fs.existsSync(EVENTS_FILE)) {
    const defaultEvents: Event[] = [
      {
        id: 'evt-001',
        name: '2026前端技术分享大会',
        description: '汇集国内外顶尖前端技术专家，分享最新的Web技术趋势、框架演进和最佳实践。涵盖React 19新特性、Vue 4性能优化、WebAssembly应用、AI辅助开发等热门话题。',
        date: '2026-07-15T09:00:00',
        location: '北京国际会议中心',
        capacity: 100,
        customQuestions: ['公司名称', '技术栈', '期望议题'],
        createdAt: '2026-06-01T00:00:00'
      },
      {
        id: 'evt-002',
        name: 'AI产品创新峰会',
        description: '探索AI技术在产品设计和用户体验中的创新应用，了解最新的AI产品案例和方法论。',
        date: '2026-07-20T14:00:00',
        location: '上海科技馆',
        capacity: 50,
        customQuestions: ['所在行业', '对AI的了解程度'],
        createdAt: '2026-06-05T00:00:00'
      },
      {
        id: 'evt-003',
        name: '云原生架构实战工作坊',
        description: '手把手实战演练Kubernetes部署、微服务架构设计、DevOps流水线搭建等云原生核心技能。',
        date: '2026-08-01T10:00:00',
        location: '深圳腾讯滨海大厦',
        capacity: 30,
        customQuestions: ['工作年限', '是否有K8s经验'],
        createdAt: '2026-06-10T00:00:00'
      },
      {
        id: 'evt-004',
        name: '产品经理成长训练营',
        description: '从需求分析到产品上线，系统学习产品经理必备技能，助力职业成长。',
        date: '2026-08-10T09:30:00',
        location: '杭州阿里巴巴园区',
        capacity: 80,
        customQuestions: ['目前职位', '工作年限'],
        createdAt: '2026-06-12T00:00:00'
      },
      {
        id: 'evt-005',
        name: '区块链技术应用论坛',
        description: '探讨区块链技术在金融、供应链、版权保护等领域的实际应用案例。',
        date: '2026-08-15T13:00:00',
        location: '广州国际金融中心',
        capacity: 200,
        customQuestions: ['是否接触过区块链', '感兴趣的应用方向'],
        createdAt: '2026-06-15T00:00:00'
      }
    ];
    writeEvents(defaultEvents);
    return defaultEvents;
  }
  const data: EventsData = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
  return data.events;
}

function writeEvents(events: Event[]): void {
  ensureDataDir();
  const data: EventsData = { events };
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readRegistrations(): Registration[] {
  ensureDataDir();
  if (!fs.existsSync(REGISTRATIONS_FILE)) {
    const data: RegistrationsData = { registrations: [] };
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return [];
  }
  const data: RegistrationsData = JSON.parse(fs.readFileSync(REGISTRATIONS_FILE, 'utf-8'));
  return data.registrations;
}

function writeRegistrations(registrations: Registration[]): void {
  ensureDataDir();
  const data: RegistrationsData = { registrations };
  fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const dataStore = {
  getEvents: (): Event[] => {
    return readEvents();
  },

  getEventById: (id: string): Event | undefined => {
    const events = readEvents();
    return events.find(e => e.id === id);
  },

  createEvent: (eventData: Omit<Event, 'id' | 'createdAt'>): Event => {
    const events = readEvents();
    const newEvent: Event = {
      ...eventData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    events.push(newEvent);
    writeEvents(events);
    return newEvent;
  },

  getRegistrationsByEventId: (eventId: string): Registration[] => {
    const registrations = readRegistrations();
    return registrations.filter(r => r.eventId === eventId);
  },

  getRegistrationById: (eventId: string, registrationId: string): Registration | undefined => {
    const registrations = readRegistrations();
    return registrations.find(r => r.eventId === eventId && r.id === registrationId);
  },

  createRegistration: (eventId: string, regData: Omit<Registration, 'id' | 'eventId' | 'checkedIn' | 'createdAt'>): Registration => {
    const registrations = readRegistrations();
    const newRegistration: Registration = {
      ...regData,
      id: uuidv4(),
      eventId,
      checkedIn: false,
      createdAt: new Date().toISOString()
    };
    registrations.push(newRegistration);
    writeRegistrations(registrations);
    return newRegistration;
  },

  checkIn: (eventId: string, registrationId: string): Registration | null => {
    const registrations = readRegistrations();
    const index = registrations.findIndex(r => r.eventId === eventId && r.id === registrationId);
    
    if (index === -1 || registrations[index].checkedIn) {
      return null;
    }

    const eventRegistrations = registrations.filter(r => r.eventId === eventId && r.checkedIn);
    const checkinSequence = eventRegistrations.length + 1;

    registrations[index] = {
      ...registrations[index],
      checkedIn: true,
      checkinTime: new Date().toISOString(),
      checkinSequence
    };

    writeRegistrations(registrations);
    return registrations[index];
  },

  getEventStats: (eventId: string): { total: number; checkedIn: number } => {
    const registrations = readRegistrations();
    const eventRegs = registrations.filter(r => r.eventId === eventId);
    return {
      total: eventRegs.length,
      checkedIn: eventRegs.filter(r => r.checkedIn).length
    };
  }
};
