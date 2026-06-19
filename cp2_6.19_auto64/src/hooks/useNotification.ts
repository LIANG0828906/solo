import { useEffect, useCallback, useRef } from 'react';
import { useStore, useProducts, useSettings } from '@/store/useStore';
import { getProductStatus } from '@/utils/productUtils';
import { getTodayString } from '@/utils/dateUtils';

export const useNotification = () => {
  const products = useProducts();
  const settings = useSettings();
  const updateSettings = useStore((state) => state.updateSettings);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateSettings({ notificationEnabled: true });
    }
    return permission;
  }, [updateSettings]);

  const showNotification = useCallback((title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    try {
      new Notification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'skincare-reminder',
        requireInteraction: false,
      });
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  }, []);

  const checkAndSendReminder = useCallback((): boolean => {
    if (!settings.notificationEnabled) return false;
    if (!settings.reminderTime) return false;
    
    const today = getTodayString();
    if (settings.lastReminderDate === today) return false;
    
    const now = new Date();
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    if (now >= reminderTime) {
      const activeProducts = products.filter(
        (p) => getProductStatus(p) === '进行中'
      );
      
      if (activeProducts.length > 0) {
        showNotification(
          '护肤提醒',
          `今天有${activeProducts.length}件产品待记录使用进度`
        );
        updateSettings({ lastReminderDate: today });
        return true;
      }
    }
    return false;
  }, [settings, products, showNotification, updateSettings]);

  const scheduleNextReminder = useCallback(() => {
    if (!settings.notificationEnabled || !settings.reminderTime) return;

    clearTimers();

    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    const now = new Date();
    const nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    if (now >= nextReminder) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const delay = nextReminder.getTime() - now.getTime();

    timeoutRef.current = setTimeout(() => {
      const sent = checkAndSendReminder();
      if (!sent) {
        scheduleNextReminder();
      } else {
        intervalRef.current = setInterval(checkAndSendReminder, 60000);
      }
    }, Math.min(delay, 2147483647));

    intervalRef.current = setInterval(checkAndSendReminder, 60000);
  }, [settings.notificationEnabled, settings.reminderTime, checkAndSendReminder, clearTimers]);

  useEffect(() => {
    if (!settings.notificationEnabled) {
      clearTimers();
      return;
    }

    checkAndSendReminder();
    scheduleNextReminder();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndSendReminder();
        scheduleNextReminder();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimers();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings.notificationEnabled, settings.reminderTime, checkAndSendReminder, scheduleNextReminder, clearTimers]);

  return {
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
  };
};
