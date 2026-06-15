import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Property, CalendarDay, Message, BookingStatus } from './types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const guestNames = ['张先生', '李女士', '王先生', '陈小姐', '刘先生', '赵女士', '孙先生', '周小姐'];

const properties: Property[] = [
  {
    id: 'prop-1',
    name: '西湖畔温馨一居室',
    platform: 'airbnb',
    pricePerNight: 399,
    maxGuests: 2,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20modern%20apartment%20near%20west%20lake%20hangzhou%20with%20large%20windows&image_size=square_hd',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prop-2',
    name: '胡同里的北京四合院',
    platform: 'xiaozhu',
    pricePerNight: 688,
    maxGuests: 4,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20beijing%20siheyuan%20courtyard%20house%20with%20red%20doors&image_size=square_hd',
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prop-3',
    name: '上海滩夜景豪华公寓',
    platform: 'airbnb',
    pricePerNight: 888,
    maxGuests: 3,
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20apartment%20shanghai%20bund%20night%20view%20modern%20interior&image_size=square_hd',
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function generateCalendarDays(): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    properties.forEach((prop) => {
      const rand = Math.random();
      let status: BookingStatus = 'available';
      let guestName: string | undefined;

      if (rand < 0.3) {
        status = 'booked';
        guestName = guestNames[Math.floor(Math.random() * guestNames.length)];
      } else if (rand < 0.45) {
        status = 'pending';
        guestName = guestNames[Math.floor(Math.random() * guestNames.length)];
      } else if (rand < 0.5) {
        status = 'maintenance';
      }

      days.push({
        propertyId: prop.id,
        date: dateStr,
        status,
        guestName,
        bookingId: status === 'booked' || status === 'pending' ? uuidv4() : undefined,
      });
    });
  }

  return days;
}

let calendarDays = generateCalendarDays();

const messages: Message[] = [
  {
    id: 'msg-1',
    propertyId: 'prop-1',
    propertyName: '西湖畔温馨一居室',
    platform: 'airbnb',
    guestName: '张先生',
    content: '您好，我想预订下周末的房间，请问还有空房吗？我们是夫妻两人。',
    isReplied: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-2',
    propertyId: 'prop-2',
    propertyName: '胡同里的北京四合院',
    platform: 'xiaozhu',
    guestName: '李女士',
    content: '请问可以带宠物入住吗？我们有一只很乖的金毛犬。',
    isReplied: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-3',
    propertyId: 'prop-3',
    propertyName: '上海滩夜景豪华公寓',
    platform: 'airbnb',
    guestName: '王先生',
    content: '请问退房时间可以延迟到下午2点吗？我们的航班比较晚。',
    isReplied: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-4',
    propertyId: 'prop-1',
    propertyName: '西湖畔温馨一居室',
    platform: 'xiaozhu',
    guestName: '陈小姐',
    content: '房间有提供早餐吗？或者附近有什么推荐的餐厅？',
    isReplied: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-5',
    propertyId: 'prop-2',
    propertyName: '胡同里的北京四合院',
    platform: 'airbnb',
    guestName: '刘先生',
    content: '我们一行4人，想要预订国庆期间的房间，请问价格有优惠吗？',
    isReplied: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-6',
    propertyId: 'prop-3',
    propertyName: '上海滩夜景豪华公寓',
    platform: 'xiaozhu',
    guestName: '赵女士',
    content: '感谢您的热情接待，房间非常棒，夜景太美了！下次还会再来。',
    reply: '非常感谢您的好评！期待您再次光临，祝您旅途愉快！',
    isReplied: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    repliedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-7',
    propertyId: 'prop-1',
    propertyName: '西湖畔温馨一居室',
    platform: 'airbnb',
    guestName: '孙先生',
    content: '请问如何办理入住？需要带什么证件吗？',
    reply: '您好，入住时请携带所有入住人的身份证原件，我们会在您到达前发送详细的入住指引。',
    isReplied: true,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    repliedAt: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-8',
    propertyId: 'prop-2',
    propertyName: '胡同里的北京四合院',
    platform: 'xiaozhu',
    guestName: '周小姐',
    content: '周边交通方便吗？最近的地铁站步行需要多久？',
    reply: '交通很便利，步行5分钟就到南锣鼓巷地铁站，去哪里都很方便。',
    isReplied: true,
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    repliedAt: new Date(Date.now() - 95 * 60 * 60 * 1000).toISOString(),
  },
];

app.get('/api/properties', (_req: Request, res: Response<Property[]>) => {
  res.json(properties);
});

app.post('/api/properties', (req: Request<{}, Property, Omit<Property, 'id' | 'isActive' | 'createdAt'>>, res: Response<Property>) => {
  const newProperty: Property = {
    ...req.body,
    id: uuidv4(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  properties.push(newProperty);
  res.json(newProperty);
});

app.delete('/api/properties/:id', (req: Request<{ id: string }>, res: Response<{ success: boolean }>) => {
  const index = properties.findIndex((p) => p.id === req.params.id);
  if (index !== -1) {
    properties[index].isActive = false;
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false });
  }
});

app.get('/api/calendar', (req: Request<{}, CalendarDay[], {}, { startDate?: string; endDate?: string }>, res: Response<CalendarDay[]>) => {
  let result = [...calendarDays];
  if (req.query.startDate) {
    result = result.filter((d) => d.date >= req.query.startDate!);
  }
  if (req.query.endDate) {
    result = result.filter((d) => d.date <= req.query.endDate!);
  }
  res.json(result);
});

app.post('/api/calendar', (req: Request<{}, CalendarDay, { propertyId: string; date: string; status: BookingStatus; guestName?: string }>, res: Response<CalendarDay>) => {
  const { propertyId, date, status, guestName } = req.body;
  const index = calendarDays.findIndex((d) => d.propertyId === propertyId && d.date === date);
  if (index !== -1) {
    calendarDays[index] = {
      ...calendarDays[index],
      status,
      guestName,
      bookingId: status === 'booked' || status === 'pending' ? uuidv4() : undefined,
    };
    res.json(calendarDays[index]);
  } else {
    const newDay: CalendarDay = {
      propertyId,
      date,
      status,
      guestName,
      bookingId: status === 'booked' || status === 'pending' ? uuidv4() : undefined,
    };
    calendarDays.push(newDay);
    res.json(newDay);
  }
});

app.get('/api/messages', (req: Request<{}, Message[], {}, { isReplied?: string; search?: string }>, res: Response<Message[]>) => {
  let result = [...messages];
  if (req.query.isReplied !== undefined) {
    const isReplied = req.query.isReplied === 'true';
    result = result.filter((m) => m.isReplied === isReplied);
  }
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    result = result.filter(
      (m) =>
        m.content.toLowerCase().includes(search) ||
        m.guestName.toLowerCase().includes(search) ||
        m.propertyName.toLowerCase().includes(search)
    );
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result);
});

app.post('/api/messages/:id/reply', (req: Request<{ id: string }, Message, { reply: string }>, res: Response<Message>) => {
  const index = messages.findIndex((m) => m.id === req.params.id);
  if (index !== -1) {
    messages[index] = {
      ...messages[index],
      reply: req.body.reply,
      isReplied: true,
      repliedAt: new Date().toISOString(),
    };
    res.json(messages[index]);
  } else {
    res.status(404).end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
