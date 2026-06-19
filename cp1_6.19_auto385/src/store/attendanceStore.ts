import { create } from 'zustand';
import axios from 'axios';
import type { AttendanceStore, PunchRecord, DailyStats, AttendanceStatus } from '../types';

const getStatus = (hour: number, minute: number): AttendanceStatus => {
  if (hour < 9) return 'normal';
  if (hour === 9 && minute === 0) return 'normal';
  if (hour === 9 && minute <= 30) return 'late';
  if (hour > 9 || (hour === 9 && minute > 30)) return 'absent';
  return 'normal';
};

const calculateDailyStats = (records: PunchRecord[]): DailyStats[] => {
  const statsMap = new Map<string, DailyStats>();
  
  records.forEach(record => {
    const date = record.date;
    if (!statsMap.has(date)) {
      statsMap.set(date, { date, totalHours: 0, lateCount: 0 });
    }
    const dayStats = statsMap.get(date)!;
    dayStats.totalHours += 1;
    if (record.status === 'late') {
      dayStats.lateCount += 1;
    }
  });

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (statsMap.has(dateStr)) {
      last7Days.push(statsMap.get(dateStr)!);
    } else {
      last7Days.push({ date: dateStr, totalHours: 0, lateCount: 0 });
    }
  }
  
  return last7Days;
};

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  records: [],
  balances: [],
  dailyStats: [],
  message: null,
  messageVisible: false,
  isPunching: false,
  currentEmployee: { id: 'emp001', name: '张三' },

  actions: {
    punchIn: async () => {
      if (get().isPunching) return;
      set({ isPunching: true });

      try {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const status = getStatus(hour, minute);
        
        const response = await axios.post('/api/punch', {
          employeeId: get().currentEmployee.id,
          employeeName: get().currentEmployee.name,
          timestamp: now.getTime(),
        });

        const newRecord = response.data as PunchRecord;
        const records = [...get().records, newRecord];
        
        const messages = {
          normal: { text: `打卡成功！${get().currentEmployee.name}，正常出勤`, type: 'normal' as const },
          late: { text: `打卡成功！${get().currentEmployee.name}，迟到${minute}分钟`, type: 'late' as const },
          absent: { text: `打卡成功！${get().currentEmployee.name}，按缺勤处理`, type: 'absent' as const },
        };

        set({
          records,
          dailyStats: calculateDailyStats(records),
          message: messages[status],
          messageVisible: true,
        });

        setTimeout(() => {
          set({ messageVisible: false });
        }, 2000);
      } catch (error) {
        console.error('打卡失败:', error);
      } finally {
        setTimeout(() => {
          set({ isPunching: false });
        }, 300);
      }
    },

    fetchRecords: async () => {
      try {
        const [recordsRes, balancesRes] = await Promise.all([
          axios.get('/api/records'),
          axios.get('/api/balances'),
        ]);

        const records = recordsRes.data as PunchRecord[];
        const balances = balancesRes.data;

        set({
          records,
          balances,
          dailyStats: calculateDailyStats(records),
        });
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    },

    applyLeave: async (employeeId: string, hours: number) => {
      try {
        const response = await axios.post('/api/leave', {
          employeeId,
          hours,
        });

        const updatedBalance = response.data;
        set(state => ({
          balances: state.balances.map(b =>
            b.employeeId === employeeId ? updatedBalance : b
          ),
          message: { text: `调休申请成功！已扣除${hours}小时`, type: 'leave' },
          messageVisible: true,
        }));

        setTimeout(() => {
          set({ messageVisible: false });
        }, 2000);
      } catch (error) {
        console.error('调休申请失败:', error);
      }
    },

    setMessage: (msg) => set({ message: msg }),
    setMessageVisible: (visible) => set({ messageVisible: visible }),
  },
}));
