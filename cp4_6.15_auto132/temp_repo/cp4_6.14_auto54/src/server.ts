import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import type {
  Trip,
  TripEvent,
  TripDay,
  TeamMember,
  OperationRecord,
  EventTag,
  ApiResponse,
} from './types';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

const trips = new Map<string, Trip>();

const calculateDayTotalCost = (events: TripEvent[]): number => {
  return events.reduce((sum, event) => sum + (event.cost || 0), 0);
};

const createDefaultTrip = (): Trip => {
  const members: TeamMember[] = [
    {
      id: 'member-001',
      name: '张明',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ZhangMing',
      online: false,
    },
    {
      id: 'member-002',
      name: '李华',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LiHua',
      online: false,
    },
    {
      id: 'member-003',
      name: '王芳',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WangFang',
      online: false,
    },
  ];

  const day1Events: TripEvent[] = [
    {
      id: 'event-001',
      title: '浅草寺参拜',
      location: '东京都台东区浅草2-3-1',
      locationThumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      startTime: '2026-07-01T09:00:00',
      endTime: '2026-07-01T11:00:00',
      notes: '穿舒适的鞋子，准备好香火钱',
      tags: ['景点' as EventTag],
      createdAt: '2026-06-01T00:00:00',
      updatedAt: '2026-06-01T00:00:00',
      order: 0,
      cost: 0,
    },
    {
      id: 'event-002',
      title: '浅草附近午餐',
      location: '东京都台东区浅草1-1-1',
      locationThumbnail: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
      startTime: '2026-07-01T12:00:00',
      endTime: '2026-07-01T13:30:00',
      notes: '品尝传统日式定食',
      tags: ['美食' as EventTag],
      createdAt: '2026-06-01T00:00:00',
      updatedAt: '2026-06-01T00:00:00',
      order: 1,
      cost: 800,
    },
    {
      id: 'event-003',
      title: '前往秋叶原',
      location: '东京都千代田区外神田',
      startTime: '2026-07-01T14:00:00',
      endTime: '2026-07-01T14:30:00',
      notes: '乘坐银座线，3站约15分钟',
      tags: ['交通' as EventTag],
      createdAt: '2026-06-01T00:00:00',
      updatedAt: '2026-06-01T00:00:00',
      order: 2,
      cost: 200,
    },
  ];

  const day2Events: TripEvent[] = [
    {
      id: 'event-004',
      title: '东京迪士尼乐园',
      location: '千叶县浦安市舞滨1-1',
      locationThumbnail: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=400',
      startTime: '2026-07-02T08:00:00',
      endTime: '2026-07-02T20:00:00',
      notes: '提前下载官方APP，购买快速通行证',
      tags: ['景点' as EventTag],
      createdAt: '2026-06-01T00:00:00',
      updatedAt: '2026-06-01T00:00:00',
      order: 0,
      cost: 4500,
    },
  ];

  const day3Events: TripEvent[] = [
    {
      id: 'event-005',
      title: '明治神宫',
      location: '东京都涩谷区代代木神园町1-1',
      locationThumbnail: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400',
      startTime: '2026-07-03T10:00:00',
      endTime: '2026-07-03T12:00:00',
      notes: '参观神宫博物馆，走参道',
      tags: ['景点' as EventTag],
      createdAt: '2026-06-01T00:00:00',
      updatedAt: '2026-06-01T00:00:00',
      order: 0,
      cost: 0,
    },
    {
      id: 'event-006',
      title: '原宿午餐',
      location: '东京都涩谷区神宫前1-6-10',
      locationThumbnail: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400',
      startTime: '2026-07-03T12:30:00',
      endTime: '2026-07-03T14:00:00',
      notes: '尝试原宿特色可丽饼和拉面',
      tags: ['美食' as EventTag],
      createdAt: '2026-06-01T00:00:00',
      updatedAt: '2026-06-01T00:00:00',
      order: 1,
      cost: 600,
    },
    {
      id: 'event-007',
      title: '新宿购物',
      location: '东京都新宿区新宿',
      locationThumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      startTime: '2026-07-03T15:00:00',
      endTime: '2026-07-03T19:00:00',
      notes: '伊势丹、Lumine、友都八喜',
      tags: ['景点' as EventTag],
      createdAt: '2026-06-01T00:00:00',
      updatedAt: '2026-06-01T00:00:00',
      order: 2,
      cost: 700,
    },
  ];

  const days: TripDay[] = [
    {
      date: '2026-07-01',
      events: day1Events,
      totalCost: calculateDayTotalCost(day1Events),
    },
    {
      date: '2026-07-02',
      events: day2Events,
      totalCost: calculateDayTotalCost(day2Events),
    },
    {
      date: '2026-07-03',
      events: day3Events,
      totalCost: calculateDayTotalCost(day3Events),
    },
    {
      date: '2026-07-04',
      events: [],
      totalCost: 0,
    },
    {
      date: '2026-07-05',
      events: [],
      totalCost: 0,
    },
  ];

  const totalSpent = days.reduce((sum, day) => sum + day.totalCost, 0);

  return {
    id: 'demo-trip-001',
    name: '东京5日深度游',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    budget: 10000,
    totalSpent,
    days,
    members,
    history: [],
  };
};

trips.set('demo-trip-001', createDefaultTrip());

const calculateTotalSpent = (trip: Trip): number => {
  return trip.days.reduce((sum, day) => {
    return sum + day.events.reduce((daySum, event) => daySum + (event.cost || 0), 0);
  }, 0);
};

const checkTimeOverlap = (
  events: TripEvent[],
  newEvent: TripEvent,
  excludeEventId?: string
): boolean => {
  const newStart = new Date(newEvent.startTime).getTime();
  const newEnd = new Date(newEvent.endTime).getTime();

  return events.some((event) => {
    if (excludeEventId && event.id === excludeEventId) return false;
    const eventStart = new Date(event.startTime).getTime();
    const eventEnd = new Date(event.endTime).getTime();
    return newStart < eventEnd && newEnd > eventStart;
  });
};

const addHistoryRecord = (
  trip: Trip,
  action: OperationRecord['action'],
  eventTitle: string,
  operatorId: string
) => {
  const member = trip.members.find((m) => m.id === operatorId) || trip.members[0];
  const record: OperationRecord = {
    id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    operatorId: member.id,
    operatorName: member.name,
    operatorAvatar: member.avatar,
    action,
    eventTitle,
    timestamp: new Date().toISOString(),
  };
  trip.history.unshift(record);
  if (trip.history.length > 50) {
    trip.history = trip.history.slice(0, 50);
  }
};

const getDateFromTime = (time: string): string => {
  return time.split('T')[0];
};

app.get('/api/trips/:id', (req: Request, res: Response<ApiResponse<Trip>>) => {
  const trip = trips.get(req.params.id);
  if (!trip) {
    return res.json({ success: false, error: '行程不存在' });
  }
  res.json({ success: true, data: trip });
});

app.post(
  '/api/trips/:id/events',
  (
    req: Request<
      { id: string },
      ApiResponse<Trip>,
      Omit<TripEvent, 'id' | 'createdAt' | 'updatedAt' | 'order'> & { operatorId: string; socketId?: string }
    >,
    res: Response<ApiResponse<Trip>>
  ) => {
    const trip = trips.get(req.params.id);
    if (!trip) {
      return res.json({ success: false, error: '行程不存在' });
    }

    const { operatorId, ...eventData } = req.body;

    const newEvent: TripEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    };

    const eventDate = getDateFromTime(newEvent.startTime);
    let day = trip.days.find((d) => d.date === eventDate);

    if (!day) {
      day = {
        date: eventDate,
        events: [],
        totalCost: 0,
      };
      trip.days.push(day);
      trip.days.sort((a, b) => a.date.localeCompare(b.date));
    }

    if (checkTimeOverlap(day.events, newEvent)) {
      return res.json({ success: false, error: '时间与现有事件冲突' });
    }

    newEvent.order = day.events.length;
    day.events.push(newEvent);
    day.events.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    day.events.forEach((e, idx) => (e.order = idx));
    day.totalCost = calculateDayTotalCost(day.events);
    trip.totalSpent = calculateTotalSpent(trip);

    addHistoryRecord(trip, 'add', newEvent.title, operatorId || trip.members[0].id);

    const broadcastData = {
      tripId: trip.id,
      event: newEvent,
      day,
      operatorId: operatorId || trip.members[0].id,
      timestamp: new Date().toISOString(),
    };

    if (req.body.socketId) {
      io.to(trip.id).except(req.body.socketId).emit('eventAdded', broadcastData);
    } else {
      io.to(trip.id).emit('eventAdded', broadcastData);
    }

    res.json({ success: true, data: trip });
  }
);

app.put(
  '/api/trips/:id/events/:eventId',
  (
    req: Request<
      { id: string; eventId: string },
      ApiResponse<Trip>,
      Partial<TripEvent> & { operatorId: string; socketId?: string }
    >,
    res: Response<ApiResponse<Trip>>
  ) => {
    const trip = trips.get(req.params.id);
    if (!trip) {
      return res.json({ success: false, error: '行程不存在' });
    }

    const { operatorId, ...updateData } = req.body;
    const eventId = req.params.eventId;

    let foundEvent: TripEvent | null = null;
    let originalDay: TripDay | null = null;

    for (const day of trip.days) {
      const event = day.events.find((e) => e.id === eventId);
      if (event) {
        foundEvent = event;
        originalDay = day;
        break;
      }
    }

    if (!foundEvent || !originalDay) {
      return res.json({ success: false, error: '事件不存在' });
    }

    const originalTitle = foundEvent.title;
    const updatedEvent: TripEvent = {
      ...foundEvent,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const newEventDate = getDateFromTime(updatedEvent.startTime);

    if (newEventDate !== originalDay.date) {
      originalDay.events = originalDay.events.filter((e) => e.id !== eventId);
      originalDay.events.forEach((e, idx) => (e.order = idx));
      originalDay.totalCost = calculateDayTotalCost(originalDay.events);

      let newDay = trip.days.find((d) => d.date === newEventDate);
      if (!newDay) {
        newDay = {
          date: newEventDate,
          events: [],
          totalCost: 0,
        };
        trip.days.push(newDay);
        trip.days.sort((a, b) => a.date.localeCompare(b.date));
      }

      if (checkTimeOverlap(newDay.events, updatedEvent)) {
        originalDay.events.push(foundEvent);
        originalDay.events.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        originalDay.events.forEach((e, idx) => (e.order = idx));
        originalDay.totalCost = calculateDayTotalCost(originalDay.events);
        return res.json({ success: false, error: '时间与现有事件冲突' });
      }

      newDay.events.push(updatedEvent);
      newDay.events.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      newDay.events.forEach((e, idx) => (e.order = idx));
      newDay.totalCost = calculateDayTotalCost(newDay.events);
    } else {
      if (checkTimeOverlap(originalDay.events, updatedEvent, eventId)) {
        return res.json({ success: false, error: '时间与现有事件冲突' });
      }

      const eventIndex = originalDay.events.findIndex((e) => e.id === eventId);
      originalDay.events[eventIndex] = updatedEvent;
      originalDay.events.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      originalDay.events.forEach((e, idx) => (e.order = idx));
      originalDay.totalCost = calculateDayTotalCost(originalDay.events);
    }

    trip.totalSpent = calculateTotalSpent(trip);

    addHistoryRecord(trip, 'update', originalTitle, operatorId || trip.members[0].id);

    const broadcastData = {
      tripId: trip.id,
      event: updatedEvent,
      operatorId: operatorId || trip.members[0].id,
      timestamp: new Date().toISOString(),
    };

    if (req.body.socketId) {
      io.to(trip.id).except(req.body.socketId).emit('eventUpdated', broadcastData);
    } else {
      io.to(trip.id).emit('eventUpdated', broadcastData);
    }

    res.json({ success: true, data: trip });
  }
);

app.delete(
  '/api/trips/:id/events/:eventId',
  (
    req: Request<{ id: string; eventId: string }, ApiResponse<Trip>, { operatorId: string; socketId?: string }>,
    res: Response<ApiResponse<Trip>>
  ) => {
    const trip = trips.get(req.params.id);
    if (!trip) {
      return res.json({ success: false, error: '行程不存在' });
    }

    const { operatorId } = req.body;
    const eventId = req.params.eventId;

    let deletedEvent: TripEvent | null = null;
    let dayIndex = -1;

    for (let i = 0; i < trip.days.length; i++) {
      const day = trip.days[i];
      const eventIndex = day.events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        deletedEvent = day.events[eventIndex];
        day.events.splice(eventIndex, 1);
        day.events.forEach((e, idx) => (e.order = idx));
        day.totalCost = calculateDayTotalCost(day.events);
        dayIndex = i;
        break;
      }
    }

    if (!deletedEvent) {
      return res.json({ success: false, error: '事件不存在' });
    }

    trip.totalSpent = calculateTotalSpent(trip);

    addHistoryRecord(trip, 'delete', deletedEvent.title, operatorId || trip.members[0].id);

    const broadcastData = {
      tripId: trip.id,
      eventId,
      dayDate: trip.days[dayIndex]?.date,
      operatorId: operatorId || trip.members[0].id,
      timestamp: new Date().toISOString(),
    };

    if (req.body.socketId) {
      io.to(trip.id).except(req.body.socketId).emit('eventDeleted', broadcastData);
    } else {
      io.to(trip.id).emit('eventDeleted', broadcastData);
    }

    res.json({ success: true, data: trip });
  }
);

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('syncRequest', (data: { tripId: string; memberId?: string }) => {
    const { tripId, memberId } = data;
    const trip = trips.get(tripId);

    if (!trip) {
      socket.emit('error', { message: '行程不存在' });
      return;
    }

    socket.join(tripId);

    if (memberId) {
      const member = trip.members.find((m) => m.id === memberId);
      if (member) {
        member.online = true;
      }
      io.to(tripId).emit('memberStatusChanged', {
        tripId,
        memberId,
        online: true,
      });
    }

    socket.emit('syncResponse', { trip });
    console.log(`Client ${socket.id} joined trip room: ${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    for (const [, trip] of trips) {
      for (const member of trip.members) {
        if (member.online) {
          member.online = false;
          io.to(trip.id).emit('memberStatusChanged', {
            tripId: trip.id,
            memberId: member.id,
            online: false,
          });
        }
      }
    }
  });
});

const PORT = 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready on port ${PORT}`);
  console.log(`📍 Demo trip: demo-trip-001`);
});

export { app, server };
