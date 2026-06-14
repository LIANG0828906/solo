import { useState, useEffect, useCallback } from 'react';
import CalendarView from './components/CalendarView';
import DevicePanel from './components/DevicePanel';
import BookingModal from './components/BookingModal';
import HistoryModal from './components/HistoryModal';
import DateDetailModal from './components/DateDetailModal';
import AddDeviceModal from './components/AddDeviceModal';
import { Device, Booking } from './types';
import { formatDate } from './utils/dateUtils';
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

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
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
      const res = await fetch(`/api/bookings?${params.toString()}`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchDevices(),
      fetchBookings(currentMonth.getFullYear(), currentMonth.getMonth()),
    ]);
    setTimeout(() => setIsLoading(false), 200);
  }, [fetchDevices, fetchBookings, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMonthChange = (direction: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDateDetail(true);
  };

  const handleBookDevice = (device: Device) => {
    setSelectedDevice(device);
    setShowBookingModal(true);
  };

  const handleViewHistory = (device: Device) => {
    setSelectedDevice(device);
    setShowHistoryModal(true);
  };

  const handleBookingCreated = () => {
    setShowBookingModal(false);
    setSelectedDevice(null);
    fetchDevices();
    fetchBookings(currentMonth.getFullYear(), currentMonth.getMonth());
  };

  const handleBookingDeleted = () => {
    fetchDevices();
    fetchBookings(currentMonth.getFullYear(), currentMonth.getMonth());
  };

  const handleDeviceAdded = () => {
    setShowAddDeviceModal(false);
    fetchDevices();
  };

  const getBookingsForDate = (date: Date): Booking[] => {
    const dateStr = formatDate(date);
    return bookings.filter((b) => b.date === dateStr);
  };

  const getDeviceById = (id: string): Device | undefined => {
    return devices.find((d) => d.id === id);
  };

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
          bookings={getBookingsForDate(selectedDate)}
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
