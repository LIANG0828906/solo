import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NotificationSetting } from '@/types';
import {
  getSettings,
  updateSettings,
  addNotification,
  markAsRead,
  markAllAsRead,
  getSnapshot,
  subscribe,
  checkExpiringSubscriptions,
  startExpiryCheck,
  stopExpiryCheck,
} from '@/utils/notification';

vi.useFakeTimers();

describe('notification utils', () => {
  beforeEach(() => {
    markAllAsRead();
    updateSettings({
      enabled: true,
      soundEnabled: false,
      volume: 0.3,
    });
  });

  it('should get default settings', () => {
    const settings = getSettings();
    expect(settings).toEqual({
      enabled: true,
      soundEnabled: false,
      volume: 0.3,
    });
  });

  it('should update settings', () => {
    updateSettings({ enabled: false, volume: 0.5 });
    const settings = getSettings();
    expect(settings.enabled).toBe(false);
    expect(settings.volume).toBe(0.5);
    expect(settings.soundEnabled).toBe(false);
  });

  it('should add and mark notifications as read', () => {
    expect(getSnapshot()).toHaveLength(0);

    addNotification({
      id: 'test-1',
      subscriptionId: 'sub-1',
      message: 'Test notification',
      read: false,
      createdAt: new Date().toISOString(),
    });

    expect(getSnapshot()).toHaveLength(1);
    expect(getSnapshot()[0].id).toBe('test-1');

    markAsRead('test-1');
    expect(getSnapshot()).toHaveLength(0);
  });

  it('should mark all notifications as read', () => {
    addNotification({
      id: 'test-1',
      subscriptionId: 'sub-1',
      message: 'Test 1',
      read: false,
      createdAt: new Date().toISOString(),
    });
    addNotification({
      id: 'test-2',
      subscriptionId: 'sub-2',
      message: 'Test 2',
      read: false,
      createdAt: new Date().toISOString(),
    });

    expect(getSnapshot()).toHaveLength(2);
    markAllAsRead();
    expect(getSnapshot()).toHaveLength(0);
  });

  it('should not add duplicate notifications for same subscription', () => {
    addNotification({
      id: 'test-1',
      subscriptionId: 'sub-1',
      message: 'Test 1',
      read: false,
      createdAt: new Date().toISOString(),
    });
    addNotification({
      id: 'test-2',
      subscriptionId: 'sub-1',
      message: 'Test 2',
      read: false,
      createdAt: new Date().toISOString(),
    });

    expect(getSnapshot()).toHaveLength(1);
  });

  it('should not add notifications when disabled', () => {
    updateSettings({ enabled: false });
    addNotification({
      id: 'test-1',
      subscriptionId: 'sub-1',
      message: 'Test',
      read: false,
      createdAt: new Date().toISOString(),
    });
    expect(getSnapshot()).toHaveLength(0);
  });

  it('should auto dismiss notifications after 5 seconds', () => {
    addNotification({
      id: 'test-1',
      subscriptionId: 'sub-1',
      message: 'Test',
      read: false,
      createdAt: new Date().toISOString(),
    });

    expect(getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    expect(getSnapshot()).toHaveLength(0);
  });

  it('should call subscribers on change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    addNotification({
      id: 'test-1',
      subscriptionId: 'sub-1',
      message: 'Test',
      read: false,
      createdAt: new Date().toISOString(),
    });

    expect(listener).toHaveBeenCalledTimes(1);
    markAsRead('test-1');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    markAllAsRead();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should detect expiring subscriptions within 3 days', () => {
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const subscriptions = [
      { id: 'sub-1', name: 'Netflix', nextBillingDate: twoDaysLater.toISOString() },
      { id: 'sub-2', name: 'Spotify', nextBillingDate: fiveDaysLater.toISOString() },
    ];

    checkExpiringSubscriptions(subscriptions);
    const result = getSnapshot();

    expect(result).toHaveLength(1);
    expect(result[0].subscriptionId).toBe('sub-1');
    expect(result[0].message).toContain('Netflix');
    expect(result[0].message).toContain('2天');
  });

  it('should start and stop expiry check interval', () => {
    const getSubs = vi.fn().mockReturnValue([]);
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    startExpiryCheck(getSubs);
    expect(setIntervalSpy).toHaveBeenCalled();
    expect(getSubs).toHaveBeenCalled();

    stopExpiryCheck();
    expect(clearIntervalSpy).toHaveBeenCalled();

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
