import React, { useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { InfoPanel } from './components/InfoPanel';
import { SeatGrid } from './renderer/SeatGrid';
import { BookingModal } from './components/BookingModal';
import { BookingSidebar } from './components/BookingSidebar';
import { NotificationToast } from './components/NotificationToast';
import { useSeatStore } from './stores/seatStore';
import { notificationScheduler } from './scheduler/NotificationScheduler';
import type { NotificationItem } from './types';

const CURRENT_USER_ID = 'user-001';

const App: React.FC = () => {
  const openBooking