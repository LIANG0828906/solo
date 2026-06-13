import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserRole, User, WSMessage, Teacher, Student, Booking } from './types';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import StudentDashboard from './components/StudentDashboard';
import TeacherSchedule from './components/TeacherSchedule';
import SearchTeachers from './components/SearchTeachers';
import BookingDetail from './components/BookingDetail';
import RightSidebar from './components/RightSidebar';
import './styles/global.css';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  ws: WebSocket | null;
  teachers: Teacher[];
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  refreshBookings: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  selectedBooking: Booking | null;
  setSelectedBooking: (b: Booking | null) => void;
}

export const AppContext = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppContext);

const sampleTeachers: Teacher[] = [
  {
    id: 't1', name: '李明老师', role: 'teacher',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20male%20music%20teacher%20portrait%20headshot%20warm%20lighting&image_size=square',
    bio: '中央音乐学院钢琴系毕业，15年教学经验，擅长古典与爵士钢琴',
    courses: [
      { id: 'c1', teacherId: 't1', type: '钢琴', duration: 30, price: 150 },
      { id: 'c2', teacherId: 't1', type: '钢琴', duration: 45, price: 200 },
      { id: 'c3', teacherId: 't1', type: '钢琴', duration: 60, price: 260 },
    ],
  },
  {
    id: 't2', name: '王芳老师', role: 'teacher',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20guitar%20teacher%20portrait%20headshot%20warm%20lighting&image_size=square',
    bio: '吉他演奏硕士，8年教学经验，精通民谣吉他与指弹',
    courses: [
      { id: 'c4', teacherId: 't2', type: '吉他', duration: 30, price: 120 },
      { id: 'c5', teacherId: 't2', type: '吉他', duration: 45, price: 170 },
      { id: 'c6', teacherId: 't2', type: '吉他', duration: 60, price: 220 },
    ],
  },
  {
    id: 't3', name: '张华老师', role: 'teacher',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20vocal%20teacher%20portrait%20headshot%20warm%20lighting&image_size=square',
    bio: '声乐博士，10年舞台经验，专攻美声与流行唱法',
    courses: [
      { id: 'c7', teacherId: 't3', type: '声乐', duration: 30, price: 130 },
      { id: 'c8', teacherId: 't3', type: '声乐', duration: 45, price: 180 },
      { id: 'c9', teacherId: 't3', type: '声乐', duration: 60, price: 240 },
    ],
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 's1',
    name: '小明同学',
    role: 'student',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20male%20student%20portrait%20headshot%20warm%20lighting&image_size=square',
  });
  const [teachers, setTeachers] = useState<Teacher[]>(sampleTeachers);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const refreshBookings = useCallback(() => {
    const endpoint = currentUser.role === 'student'
      ? `/api/students/${currentUser.id}/bookings`
      : `/api/teachers/${currentUser.id}/bookings`;
    fetch(endpoint)
      .then(r => r.json())
      .then(data => setBookings(data))
      .catch(() => {});
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    fetch('/api/teachers')
      .then(r => r.json())
      .then(data => setTeachers(data))
      .catch(() => {});

    refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let websocket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      websocket = new WebSocket(wsUrl);
      websocket.onopen = () => {
        setWs(websocket);
        websocket!.send(JSON.stringify({ type: 'identify', userId: currentUser.id }));
      };
      websocket.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          if (msg.type === 'booking_created' || msg.type === 'booking_updated' || msg.type === 'booking_cancelled' || msg.type === 'review_added' || msg.type === 'task_completed') {
            refreshBookings();
          }
        } catch {}
      };
      websocket.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    }
    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (websocket) websocket.close();
    };
  }, [currentUser.id, refreshBookings]);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'identify', userId: currentUser.id }));
    }
  }, [currentUser.id, ws]);

  const location = useLocation();

  const contextValue: AppContextType = {
    currentUser, setCurrentUser, ws, teachers, bookings, setBookings,
    refreshBookings, mobileMenuOpen, setMobileMenuOpen,
    selectedBooking, setSelectedBooking,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-layout">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`} />
        </button>
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to={currentUser.role === 'student' ? '/dashboard' : '/schedule'} replace />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/schedule" element={<TeacherSchedule />} />
            <Route path="/search" element={<SearchTeachers />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/booking/:id" element={<BookingDetail />} />
          </Routes>
        </main>
        <RightSidebar />
        {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
      </div>
    </AppContext.Provider>
  );
}
