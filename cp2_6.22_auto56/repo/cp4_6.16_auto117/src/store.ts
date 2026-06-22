import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import type { Team, Room, Booking, Event, Seat, SeatSwapRequest, Stats } from './types';
import { generateTeamColor } from './utils/colorUtils';
import { formatDate, getTodayString, getWeekDates } from './utils/dateUtils';
import {
  calculateRoomUtilizationRate,
  calculateTeamSeatUtilization,
  calculateWeeklyEventRegistrations,
  calculateOverallSpaceUtilization,
} from './utils/statsUtils';

interface HubDeskState {
  teams: Team[];
  rooms: Room[];
  bookings: Booking[];
  events: Event[];
  seats: Seat[];
  seatSwapRequests: SeatSwapRequest[];
  stats: Stats;
  isLoading: boolean;
  
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
  
  addTeam: (team: Omit<Team, 'id' | 'createdAt' | 'color'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  getBookingsForRoom: (roomId: string, date: string) => Booking[];
  isTimeSlotAvailable: (roomId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string) => boolean;
  
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'registeredTeamIds'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  registerForEvent: (eventId: string, teamId: string) => boolean;
  
  assignSeat: (seatId: string, teamId: string) => void;
  requestSeatSwap: (fromSeatId: string, toSeatId: string, teamId: string) => void;
  approveSeatSwap: (requestId: string) => void;
  rejectSeatSwap: (requestId: string) => void;
  
  calculateStats: () => void;
  initializeMockData: () => void;
}

const DB_KEYS = {
  TEAMS: 'hubdesk_teams',
  ROOMS: 'hubdesk_rooms',
  BOOKINGS: 'hubdesk_bookings',
  EVENTS: 'hubdesk_events',
  SEATS: 'hubdesk_seats',
  SEAT_SWAP_REQUESTS: 'hubdesk_seat_swap_requests',
  INITIALIZED: 'hubdesk_initialized',
};

const TOTAL_SEATS = 60;

const generateSeats = (): Seat[] => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const columns = 10;
  const seats: Seat[] = [];
  
  rows.forEach((row, rowIndex) => {
    for (let col = 1; col <= columns; col++) {
      seats.push({
        id: `${row}${col}`,
        row,
        column: col,
        teamId: null,
        status: 'available',
        tempTeamId: null,
      });
    }
  });
  
  return seats;
};

const createMockData = () => {
  const teams: Team[] = [
    { id: uuidv4(), name: '科技创新团队', memberCount: 8, seatDemand: 10, color: generateTeamColor(0), createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '产品设计组', memberCount: 6, seatDemand: 8, color: generateTeamColor(1), createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '市场运营部', memberCount: 12, seatDemand: 15, color: generateTeamColor(2), createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '前端开发组', memberCount: 5, seatDemand: 6, color: generateTeamColor(3), createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '后端架构组', memberCount: 4, seatDemand: 5, color: generateTeamColor(4), createdAt: new Date().toISOString() },
  ];

  const rooms: Room[] = [
    { id: uuidv4(), name: '星辰会议室', capacity: 10, facilities: ['投影仪', '白板', '视频会议系统'], imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20conference%20room%20with%20glass%20walls%20and%20wooden%20table&image_size=square', status: 'available', floor: 1 },
    { id: uuidv4(), name: '云海洽谈室', capacity: 6, facilities: ['电视', '白板'], imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20meeting%20room%20with%20comfortable%20sofa%20and%20coffee%20table&image_size=square', status: 'available', floor: 1 },
    { id: uuidv4(), name: '创想培训室', capacity: 30, facilities: ['投影仪', '音响系统', '白板', '视频会议'], imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=large%20training%20room%20with%20rows%20of%20chairs%20and%20projector%20screen&image_size=square', status: 'available', floor: 2 },
    { id: uuidv4(), name: '静思小会议室', capacity: 4, facilities: ['白板'], imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20small%20meeting%20room%20with%20round%20table&image_size=square', status: 'available', floor: 2 },
    { id: uuidv4(), name: '宏图董事厅', capacity: 20, facilities: ['投影仪', '视频会议系统', '电子白板', '茶水服务'], imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20boardroom%20with%20long%20conference%20table%20and%20leather%20chairs&image_size=square', status: 'maintenance', floor: 3 },
    { id: uuidv4(), name: '灵动多功能厅', capacity: 50, facilities: ['投影仪', '专业音响', '灯光系统', '可移动桌椅'], imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spacious%20multi-purpose%20hall%20with%20modern%20lighting&image_size=square', status: 'available', floor: 3 },
  ];

  const today = getTodayString();
  const tomorrow = formatDate(new Date(Date.now() + 86400000));
  const bookings: Booking[] = [
    { id: uuidv4(), roomId: rooms[0].id, teamId: teams[0].id, date: today, startTime: '09:00', endTime: '10:30', purpose: '产品需求评审会', createdAt: new Date().toISOString() },
    { id: uuidv4(), roomId: rooms[0].id, teamId: teams[1].id, date: today, startTime: '14:00', endTime: '15:00', purpose: '设计方案讨论', createdAt: new Date().toISOString() },
    { id: uuidv4(), roomId: rooms[1].id, teamId: teams[2].id, date: today, startTime: '10:00', endTime: '11:00', purpose: '客户洽谈', createdAt: new Date().toISOString() },
    { id: uuidv4(), roomId: rooms[2].id, teamId: teams[3].id, date: today, startTime: '15:30', endTime: '17:30', purpose: '技术培训分享', createdAt: new Date().toISOString() },
    { id: uuidv4(), roomId: rooms[0].id, teamId: teams[4].id, date: tomorrow, startTime: '09:00', endTime: '12:00', purpose: '架构设计评审', createdAt: new Date().toISOString() },
  ];

  const nextWeek = getWeekDates();
  const events: Event[] = [
    { id: uuidv4(), title: '人工智能技术分享会', description: '邀请行业专家分享AI最新技术趋势和应用案例', date: nextWeek[1], time: '14:00', location: '创想培训室', maxParticipants: 30, registeredTeamIds: [teams[0].id, teams[3].id], createdAt: new Date().toISOString() },
    { id: uuidv4(), title: '创业者早餐会', description: '入驻团队创始人交流分享，拓展人脉资源', date: nextWeek[2], time: '08:30', location: '一楼休闲区', maxParticipants: 20, registeredTeamIds: [teams[0].id, teams[1].id, teams[2].id], createdAt: new Date().toISOString() },
    { id: uuidv4(), title: '产品设计工作坊', description: 'UX/UI设计方法论与实践案例分享', date: nextWeek[3], time: '13:30', location: '星辰会议室', maxParticipants: 15, registeredTeamIds: [teams[1].id], createdAt: new Date().toISOString() },
    { id: uuidv4(), title: '季度团建活动', description: '全体入驻团队户外拓展活动', date: nextWeek[5], time: '09:00', location: '户外基地', maxParticipants: 100, registeredTeamIds: [teams[0].id, teams[1].id, teams[2].id, teams[3].id, teams[4].id], createdAt: new Date().toISOString() },
    { id: uuidv4(), title: '融资路演对接会', description: '优质项目与投资机构面对面交流', date: nextWeek[4], time: '14:00', location: '宏图董事厅', maxParticipants: 40, registeredTeamIds: [teams[0].id, teams[2].id], createdAt: new Date().toISOString() },
  ];

  const seats = generateSeats();
  
  let seatIndex = 0;
  teams.forEach(team => {
    for (let i = 0; i < team.seatDemand && seatIndex < seats.length; i++) {
      seats[seatIndex].teamId = team.id;
      seats[seatIndex].status = 'occupied';
      seatIndex++;
    }
  });

  return { teams, rooms, bookings, events, seats };
};

export const useHubDeskStore = create<HubDeskState>((set, get) => ({
  teams: [],
  rooms: [],
  bookings: [],
  events: [],
  seats: [],
  seatSwapRequests: [],
  stats: {
    roomUtilizationRate: 0,
    teamSeatUtilization: {},
    weeklyEventRegistrations: [],
    overallSpaceUtilization: 0,
  },
  isLoading: true,

  loadFromDB: async () => {
    try {
      const initialized = await get<boolean>(DB_KEYS.INITIALIZED);
      
      if (!initialized) {
        const mockData = createMockData();
        set({
          teams: mockData.teams,
          rooms: mockData.rooms,
          bookings: mockData.bookings,
          events: mockData.events,
          seats: mockData.seats,
          isLoading: false,
        });
        get().calculateStats();
        await get().saveToDB();
        await set(DB_KEYS.INITIALIZED, true);
      } else {
        const [teams, rooms, bookings, events, seats, seatSwapRequests] = await Promise.all([
          get<Team[]>(DB_KEYS.TEAMS),
          get<Room[]>(DB_KEYS.ROOMS),
          get<Booking[]>(DB_KEYS.BOOKINGS),
          get<Event[]>(DB_KEYS.EVENTS),
          get<Seat[]>(DB_KEYS.SEATS),
          get<SeatSwapRequest[]>(DB_KEYS.SEAT_SWAP_REQUESTS),
        ]);

        set({
          teams: teams || [],
          rooms: rooms || [],
          bookings: bookings || [],
          events: events || [],
          seats: seats || generateSeats(),
          seatSwapRequests: seatSwapRequests || [],
          isLoading: false,
        });
        get().calculateStats();
      }
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      const mockData = createMockData();
      set({
        teams: mockData.teams,
        rooms: mockData.rooms,
        bookings: mockData.bookings,
        events: mockData.events,
        seats: mockData.seats,
        isLoading: false,
      });
      get().calculateStats();
    }
  },

  saveToDB: async () => {
    const state = get();
    try {
      await Promise.all([
        set(DB_KEYS.TEAMS, state.teams),
        set(DB_KEYS.ROOMS, state.rooms),
        set(DB_KEYS.BOOKINGS, state.bookings),
        set(DB_KEYS.EVENTS, state.events),
        set(DB_KEYS.SEATS, state.seats),
        set(DB_KEYS.SEAT_SWAP_REQUESTS, state.seatSwapRequests),
      ]);
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
  },

  addTeam: (teamData) => {
    const newTeam: Team = {
      ...teamData,
      id: uuidv4(),
      color: generateTeamColor(get().teams.length),
      createdAt: new Date().toISOString(),
    };
    set(state => ({ teams: [...state.teams, newTeam] }));
    get().calculateStats();
    get().saveToDB();
  },

  updateTeam: (id, updates) => {
    set(state => ({
      teams: state.teams.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  deleteTeam: (id) => {
    set(state => ({
      teams: state.teams.filter(t => t.id !== id),
      bookings: state.bookings.filter(b => b.teamId !== id),
      events: state.events.map(e => ({
        ...e,
        registeredTeamIds: e.registeredTeamIds.filter(tid => tid !== id),
      })),
      seats: state.seats.map(s => s.teamId === id ? { ...s, teamId: null, status: 'available' } : s),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  addRoom: (roomData) => {
    const newRoom: Room = {
      ...roomData,
      id: uuidv4(),
    };
    set(state => ({ rooms: [...state.rooms, newRoom] }));
    get().saveToDB();
  },

  updateRoom: (id, updates) => {
    set(state => ({
      rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r),
    }));
    get().saveToDB();
  },

  deleteRoom: (id) => {
    set(state => ({
      rooms: state.rooms.filter(r => r.id !== id),
      bookings: state.bookings.filter(b => b.roomId !== id),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  addBooking: (bookingData) => {
    const newBooking: Booking = {
      ...bookingData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    set(state => ({ bookings: [...state.bookings, newBooking] }));
    get().calculateStats();
    get().saveToDB();
  },

  updateBooking: (id, updates) => {
    set(state => ({
      bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  deleteBooking: (id) => {
    set(state => ({
      bookings: state.bookings.filter(b => b.id !== id),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  getBookingsForRoom: (roomId, date) => {
    return get().bookings.filter(b => b.roomId === roomId && b.date === date);
  },

  isTimeSlotAvailable: (roomId, date, startTime, endTime, excludeBookingId) => {
    const bookings = get().bookings.filter(
      b => b.roomId === roomId && b.date === date && b.id !== excludeBookingId
    );
    
    const start = parseInt(startTime.replace(':', ''));
    const end = parseInt(endTime.replace(':', ''));
    
    return !bookings.some(booking => {
      const bStart = parseInt(booking.startTime.replace(':', ''));
      const bEnd = parseInt(booking.endTime.replace(':', ''));
      return (start < bEnd && end > bStart);
    });
  },

  addEvent: (eventData) => {
    const newEvent: Event = {
      ...eventData,
      id: uuidv4(),
      registeredTeamIds: [],
      createdAt: new Date().toISOString(),
    };
    set(state => ({ events: [...state.events, newEvent] }));
    get().calculateStats();
    get().saveToDB();
  },

  updateEvent: (id, updates) => {
    set(state => ({
      events: state.events.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  deleteEvent: (id) => {
    set(state => ({
      events: state.events.filter(e => e.id !== id),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  registerForEvent: (eventId, teamId) => {
    const event = get().events.find(e => e.id === eventId);
    if (!event) return false;
    if (event.registeredTeamIds.includes(teamId)) return false;
    if (event.registeredTeamIds.length >= event.maxParticipants) return false;
    
    set(state => ({
      events: state.events.map(e =>
        e.id === eventId
          ? { ...e, registeredTeamIds: [...e.registeredTeamIds, teamId] }
          : e
      ),
    }));
    get().calculateStats();
    get().saveToDB();
    return true;
  },

  assignSeat: (seatId, teamId) => {
    set(state => ({
      seats: state.seats.map(s =>
        s.id === seatId ? { ...s, teamId, status: 'occupied' } : s
      ),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  requestSeatSwap: (fromSeatId, toSeatId, teamId) => {
    const newRequest: SeatSwapRequest = {
      id: uuidv4(),
      fromSeatId,
      toSeatId,
      teamId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      seatSwapRequests: [...state.seatSwapRequests, newRequest],
      seats: state.seats.map(s =>
        s.id === toSeatId ? { ...s, status: 'pending', tempTeamId: teamId } : s
      ),
    }));
    get().saveToDB();
  },

  approveSeatSwap: (requestId) => {
    const request = get().seatSwapRequests.find(r => r.id === requestId);
    if (!request) return;
    
    const fromSeat = get().seats.find(s => s.id === request.fromSeatId);
    const toSeat = get().seats.find(s => s.id === request.toSeatId);
    
    set(state => ({
      seatSwapRequests: state.seatSwapRequests.map(r =>
        r.id === requestId ? { ...r, status: 'approved' } : r
      ),
      seats: state.seats.map(s => {
        if (s.id === request.fromSeatId) {
          return { ...s, teamId: toSeat?.teamId || null, status: toSeat?.teamId ? 'occupied' : 'available', tempTeamId: null };
        }
        if (s.id === request.toSeatId) {
          return { ...s, teamId: fromSeat?.teamId || null, status: fromSeat?.teamId ? 'occupied' : 'available', tempTeamId: null };
        }
        return s;
      }),
    }));
    get().calculateStats();
    get().saveToDB();
  },

  rejectSeatSwap: (requestId) => {
    const request = get().seatSwapRequests.find(r => r.id === requestId);
    if (!request) return;
    
    set(state => ({
      seatSwapRequests: state.seatSwapRequests.map(r =>
        r.id === requestId ? { ...r, status: 'rejected' } : r
      ),
      seats: state.seats.map(s =>
        s.id === request.toSeatId ? { ...s, status: s.teamId ? 'occupied' : 'available', tempTeamId: null } : s
      ),
    }));
    get().saveToDB();
  },

  calculateStats: () => {
    const { teams, rooms, bookings, events, seats } = get();
    
    const roomUtilizationRate = calculateRoomUtilizationRate(bookings, getTodayString());
    const teamSeatUtilization = calculateTeamSeatUtilization(teams, seats);
    const weeklyEventRegistrations = calculateWeeklyEventRegistrations(events);
    const overallSpaceUtilization = calculateOverallSpaceUtilization(seats, TOTAL_SEATS);
    
    set({
      stats: {
        roomUtilizationRate,
        teamSeatUtilization,
        weeklyEventRegistrations,
        overallSpaceUtilization,
      },
    });
  },

  initializeMockData: () => {
    const mockData = createMockData();
    set({
      teams: mockData.teams,
      rooms: mockData.rooms,
      bookings: mockData.bookings,
      events: mockData.events,
      seats: mockData.seats,
      seatSwapRequests: [],
    });
    get().calculateStats();
    get().saveToDB();
  },
}));
