import { useEffect, useCallback } from 'react';
import { useStore, useProducts, useSettings } from '@/store/useStore';
import { getProductStatus } from '@/utils/productUtils';
import { getTodayString } from '@/utils/dateUtils';

export const useNotification = () => {
  const products = useProducts();
  const settings = useSettings();
  const updateSettings = useStore((state) => state.updateSettings);

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
    
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    });
  }, []);

  const checkAndSendReminder = useCallback(() => {
    if (!settings.notificationEnabled) return;
    if (!settings.reminderTime) return;
    
    const today = getTodayString();
    if (settings.lastReminderDate === today) return;
    
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
      }
    }
  }, [settings, products, showNotification, updateSettings]);

  useEffect(() => {
    if (!settings.notificationEnabled) return;
    
    const interval = setInterval(checkAndSendReminder, 60000);
    checkAndSendReminder();
    
    return () => clearInterval(interval);
  }, [settings.notificationEnabled, checkAndSendReminder]);

  return {
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
  };
};
