import { useState, useEffect, useCallback, useMemo } from 'react';
import CalendarView from './components/CalendarView';
import DevicePanel from './components/DevicePanel';
import BookingModal from './components/BookingModal';
import HistoryModal from './components/HistoryModal';
import DateDetailModal from './components/DateDetailModal';
import AddDeviceModal from './components/AddDeviceModal';
import { Device, Booking } from './types';
import { formatDate } from './utils/dateUtils';
import { fetchWithCache, invalidateCacheByPrefix } from './utils/apiCache';
import './styles/App.css';

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateDetail, setShowDateDetail] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [renderTime, setRenderTime] = useState<number>(0);

  const fetchDevices = useCallback(async () => {
    try {
      const data = await fetchWithCache<Device[]>('/api/devices', undefined, 60 * 1000);
      setDevices(data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  }, []);

  const fetchBookings = useCallback(async (year?: number, month?: number) => {
    try {
      const params = new URLSearchParams();
      if (year !== undefined) params.set('year', String(year));
      if (month !== undefined) params.set('month', String(month));
      const url = `/api/bookings?${params.toString()}`;
      const data = await fetchWithCache<Booking[]>(url, undefined, 30 * 1000);
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    const renderStart = performance.now();
    setIsLoading(true);
    await Promise.all([
      fetchDevices(),
      fetchBookings(currentMonth.getFullYear(), currentMonth.getMonth()),
    ]);
    setTimeout(() => {
      setIsLoading(false);
      setRenderTime(performance.now() - renderStart);
      if (renderTime > 200) {
        console.warn(`[Performance] Data render took ${renderTime.toFixed(0)}ms (>200ms threshold)`);
      }
    }, 0);
  }, [fetchDevices, fetchBookings, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMonthChange = useCallback((direction: number) => {
    const startTime = performance.now();
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
    requestAnimationFrame(() => {
      const elapsed = performance.now() - startTime;
      if (elapsed > 500) {
        console.warn(`[Performance] Month switch animation took ${elapsed.toFixed(0)}ms (>500ms threshold)`);
      }
    });
  }, [currentMonth]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowDateDetail(true);
  }, []);

  const handleBookDevice = useCallback((device: Device) => {
    setSelectedDevice(device);
    setShowBookingModal(true);
  }, []);

  const handleViewHistory = useCallback((device: Device) => {
    setSelectedDevice(device);
    setShowHistoryModal(true);
  }, []);

  const handleBookingCreated = useCallback(() => {
    setShowBookingModal(false);
    setSelectedDevice(null);
    invalidateCacheByPrefix('GET:/api');
    Promise.all([
      fetchDevices(),
      fetchBookings(currentMonth.getFullYear(), currentMonth.getMonth()),
    ]);
  }, [fetchDevices, fetchBookings, currentMonth]);

  const handleBookingDeleted = useCallback(() => {
    invalidateCacheByPrefix('GET:/api');
    Promise.all([
      fetchDevices(),
      fetchBookings(currentMonth.getFullYear(), currentMonth.getMonth()),
    ]);
  }, [fetchDevices, fetchBookings, currentMonth]);

  const handleDeviceAdded = useCallback(() => {
    setShowAddDeviceModal(false);
    invalidateCacheByPrefix('GET:/api/devices');
    fetchDevices();
  }, [fetchDevices]);

  const getBookingsForDate = useCallback((date: Date): Booking[] => {
    const dateStr = formatDate(date);
    return bookings.filter((b) => b.date === dateStr);
  }, [bookings]);

  const getDeviceById = useCallback((id: string): Device | undefined => {
    return devices.find((d) => d.id === id);
  }, [devices]);

  const memoizedBookingsForDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    });
    return map;
  }, [bookings]);

  const getCachedBookingsForDate = useCallback((date: Date): Booking[] => {
    return memoizedBookingsForDate.get(formatDate(date)) || [];
  }, [memoizedBookingsForDate]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="title-icon">🏠</span>
            家庭设备共享日历
          </h1>
          <p className="app-subtitle">温馨家庭，有序共享</p>
        </div>
        <button
          className="mobile-panel-toggle"
          onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
        >
          <span>📋</span>
          <span>设备列表</span>
        </button>
      </header>

      <main className="app-main">
        <section className="calendar-section">
          <CalendarView
            currentMonth={currentMonth}
            bookings={bookings}
            devices={devices}
            onMonthChange={handleMonthChange}
            onDateClick={handleDateClick}
            isLoading={isLoading}
          />
        </section>

        <aside className={`device-panel-section ${isMobilePanelOpen ? 'open' : ''}`}>
          <DevicePanel
            devices={devices}
            bookings={bookings}
            onBookDevice={handleBookDevice}
            onViewHistory={handleViewHistory}
            onAddDevice={() => setShowAddDeviceModal(true)}
            onCloseMobile={() => setIsMobilePanelOpen(false)}
          />
        </aside>
      </main>

      {showBookingModal && selectedDevice && (
        <BookingModal
          device={selectedDevice}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDevice(null);
          }}
          onSuccess={handleBookingCreated}
        />
      )}

      {showHistoryModal && selectedDevice && (
        <HistoryModal
          device={selectedDevice}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedDevice(null);
          }}
          onDeleted={handleBookingDeleted}
        />
      )}

      {showDateDetail && selectedDate && (
        <DateDetailModal
          date={selectedDate}
          bookings={getCachedBookingsForDate(selectedDate)}
          getDeviceById={getDeviceById}
          onClose={() => {
            setShowDateDetail(false);
            setSelectedDate(null);
          }}
        />
      )}

      {showAddDeviceModal && (
        <AddDeviceModal
          onClose={() => setShowAddDeviceModal(false)}
          onSuccess={handleDeviceAdded}
        />
      )}
    </div>
  );
}

export default App;
