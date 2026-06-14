const crypto = require('crypto');

const events = new Map();
const registrations = new Map();

function generateId() {
  return crypto.randomUUID();
}

function createEvent(data) {
  const id = generateId();
  const now = new Date().toISOString();
  const event = {
    id,
    title: data.title,
    description: data.description || '',
    dateTime: data.dateTime,
    location: data.location,
    maxParticipants: data.maxParticipants,
    currentParticipants: 0,
    qrCode: data.qrCode || '',
    createdAt: now,
    updatedAt: now
  };
  events.set(id, event);
  return event;
}

function getEvent(id) {
  return events.get(id) || null;
}

function getEvents() {
  return Array.from(events.values());
}

function updateEvent(id, data) {
  const event = events.get(id);
  if (!event) return null;
  
  const updated = {
    ...event,
    title: data.title !== undefined ? data.title : event.title,
    description: data.description !== undefined ? data.description : event.description,
    dateTime: data.dateTime !== undefined ? data.dateTime : event.dateTime,
    location: data.location !== undefined ? data.location : event.location,
    maxParticipants: data.maxParticipants !== undefined ? data.maxParticipants : event.maxParticipants,
    qrCode: data.qrCode !== undefined ? data.qrCode : event.qrCode,
    updatedAt: new Date().toISOString()
  };
  events.set(id, updated);
  return updated;
}

function deleteEvent(id) {
  return events.delete(id);
}

function registerEvent(eventId, data) {
  const event = events.get(eventId);
  if (!event) {
    throw new Error('活动不存在');
  }
  
  if (event.currentParticipants >= event.maxParticipants) {
    throw new Error('活动名额已满');
  }
  
  const existing = Array.from(registrations.values()).find(
    r => r.eventId === eventId && r.email === data.email
  );
  if (existing) {
    throw new Error('该邮箱已报名此活动');
  }
  
  const id = generateId();
  const now = new Date().toISOString();
  const registration = {
    id,
    eventId,
    name: data.name,
    email: data.email,
    qrCode: data.qrCode || '',
    signedIn: false,
    signedInAt: null,
    registeredAt: now
  };
  
  registrations.set(id, registration);
  
  event.currentParticipants += 1;
  events.set(eventId, event);
  
  return registration;
}

function getRegistrationsByEventId(eventId) {
  return Array.from(registrations.values()).filter(r => r.eventId === eventId);
}

function signIn(eventId, identifier) {
  const event = events.get(eventId);
  if (!event) {
    throw new Error('活动不存在');
  }
  
  let registration = null;
  
  if (identifier.registrationId) {
    registration = registrations.get(identifier.registrationId);
  } else if (identifier.email) {
    registration = Array.from(registrations.values()).find(
      r => r.eventId === eventId && r.email === identifier.email
    );
  }
  
  if (!registration) {
    throw new Error('未找到报名记录');
  }
  
  if (registration.eventId !== eventId) {
    throw new Error('报名记录不属于此活动');
  }
  
  if (registration.signedIn) {
    throw new Error('已签到，请勿重复签到');
  }
  
  const updated = {
    ...registration,
    signedIn: true,
    signedInAt: new Date().toISOString()
  };
  registrations.set(registration.id, updated);
  
  return updated;
}

function getEventStats(eventId) {
  const event = events.get(eventId);
  if (!event) {
    throw new Error('活动不存在');
  }
  
  const eventRegistrations = getRegistrationsByEventId(eventId);
  const total = eventRegistrations.length;
  const signedIn = eventRegistrations.filter(r => r.signedIn).length;
  const rate = total > 0 ? Number(((signedIn / total) * 100).toFixed(2)) : 0;
  
  return {
    total,
    signedIn,
    rate
  };
}

function seedMockData() {
  const mockEvents = [
    {
      title: '2025前端技术大会',
      description: '探讨最新前端技术趋势，包括React、Vue、WebAssembly等',
      dateTime: '2025-07-15T09:00:00.000Z',
      location: '北京国际会议中心',
      maxParticipants: 200,
      qrCode: ''
    },
    {
      title: 'AI应用开发实战工作坊',
      description: '从零开始构建AI驱动的Web应用',
      dateTime: '2025-07-20T13:00:00.000Z',
      location: '上海科技园区A座',
      maxParticipants: 50,
      qrCode: ''
    },
    {
      title: '产品经理交流沙龙',
      description: '分享产品设计与用户增长经验',
      dateTime: '2025-07-25T19:00:00.000Z',
      location: '深圳南山创业咖啡',
      maxParticipants: 30,
      qrCode: ''
    }
  ];
  
  mockEvents.forEach(event => {
    createEvent(event);
  });
  
  const createdEvents = getEvents();
  if (createdEvents.length > 0) {
    const firstEventId = createdEvents[0].id;
    const mockRegistrations = [
      { name: '张三', email: 'zhangsan@example.com' },
      { name: '李四', email: 'lisi@example.com' },
      { name: '王五', email: 'wangwu@example.com' }
    ];
    mockRegistrations.forEach(reg => {
      registerEvent(firstEventId, { ...reg, qrCode: '' });
    });
  }
}

seedMockData();

module.exports = {
  createEvent,
  getEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  registerEvent,
  getRegistrationsByEventId,
  signIn,
  getEventStats
};
