import { create } from 'zustand';
import axios from 'axios';

let notificationId = 0;

const useCabinetStore = create((set, get) => ({
  cabinets: [],
  selectedCompartment: null,
  notifications: [],
  doorOpen: false,

  fetchCabinets: async () => {
    try {
      const res = await axios.get('/api/cabinets');
      set({ cabinets: res.data });
    } catch (err) {
      console.error('Failed to fetch cabinets:', err);
    }
  },

  selectCompartment: (compartment) => {
    set({ selectedCompartment: compartment, doorOpen: false });
  },

  deselectCompartment: () => {
    set({ selectedCompartment: null, doorOpen: false });
  },

  claimCompartment: async (cabinetId, compartmentId, data) => {
    try {
      const res = await axios.post('/api/locker/claim', {
        cabinetId,
        compartmentId,
        ...data,
      });
      get().addNotification(`寄存成功！取件码: ${res.data.pickupCode}`, 'success');
      get().fetchCabinets();
      set((state) => ({
        selectedCompartment: {
          ...state.selectedCompartment,
          status: 'occupied',
          pickupCode: res.data.pickupCode,
          recipientPhone: data.recipientPhone,
          maxDuration: data.maxDuration,
          storedAt: new Date().toISOString(),
        },
        doorOpen: false,
      }));
      return res.data;
    } catch (err) {
      get().addNotification('寄存失败，请重试', 'error');
      throw err;
    }
  },

  openCompartment: async (cabinetId, compartmentId, pickupCode) => {
    try {
      const res = await axios.post('/api/locker/open', {
        cabinetId,
        compartmentId,
        pickupCode,
      });
      if (res.data.success) {
        set({ doorOpen: true });
        get().addNotification('取件成功！柜门已弹开', 'success');
        setTimeout(() => {
          get().fetchCabinets();
          set({ selectedCompartment: null, doorOpen: false });
        }, 3000);
      } else {
        if (res.data.locked) {
          get().addNotification('取件码错误次数过多，格口已锁定5分钟', 'error');
        } else {
          get().addNotification(`取件码错误，还剩${res.data.remainingAttempts}次机会`, 'warning');
        }
        set((state) => ({
          selectedCompartment: {
            ...state.selectedCompartment,
            failedAttempts: res.data.failedAttempts,
            lockedUntil: res.data.lockedUntil,
          },
        }));
      }
    } catch (err) {
      get().addNotification('取件操作失败', 'error');
    }
  },

  checkOverdue: async () => {
    try {
      await axios.post('/api/locker/overdue');
      get().fetchCabinets();
    } catch (err) {
      console.error('Overdue check failed:', err);
    }
  },

  addNotification: (message, type = 'info') => {
    const id = ++notificationId;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type, timestamp: Date.now() }].slice(-3),
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 2000);
  },
}));

export default useCabinetStore;
