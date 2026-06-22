const TIMER_KEY = 'timesheet_timer_state';

export interface TimerStorageState {
  isRunning: boolean;
  currentTask: string;
  clientId: string | null;
  startTime: string | null;
  accumulatedTime: number;
  lastUpdated: number;
}

export function saveTimerState(state: TimerStorageState): void {
  try {
    localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('保存计时器状态失败:', e);
  }
}

export function loadTimerState(): TimerStorageState | null {
  try {
    const data = localStorage.getItem(TIMER_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (e) {
    console.error('加载计时器状态失败:', e);
    return null;
  }
}

export function clearTimerState(): void {
  try {
    localStorage.removeItem(TIMER_KEY);
  } catch (e) {
    console.error('清除计时器状态失败:', e);
  }
}
