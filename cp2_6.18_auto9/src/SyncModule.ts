import { create } from 'zustand';

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  online: boolean;
}

export interface ActionLog {
  id: string;
  memberId: string;
  memberName: string;
  action: string;
  timestamp: number;
}

interface SyncState {
  members: Member[];
  actionLogs: ActionLog[];
  pollingInterval: number | null;

  addActionLog: (memberId: string, action: string) => void;
  generateRandomActivity: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  clearLogs: () => void;
}

const DEFAULT_MEMBERS: Member[] = [
  { id: 'alice', name: 'Alice', avatarColor: '#FF6B6B', online: true },
  { id: 'bob', name: 'Bob', avatarColor: '#4ECDC4', online: true },
  { id: 'charlie', name: 'Charlie', avatarColor: '#FFE66D', online: true }
];

const RANDOM_ACTIONS = [
  '画了一条线',
  '添加了便利贴',
  '移动了元素',
  '修改了文字',
  '绘制了矩形',
  '擦除了内容',
  '调整了大小'
];

const MAX_LOGS = 20;

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

let lastMemberId = '';
let lastActionKey = '';
let repeatCount = 0;

export const useSyncStore = create<SyncState>((set, get) => ({
  members: DEFAULT_MEMBERS,
  actionLogs: [],
  pollingInterval: null,

  addActionLog: (memberId, action) => {
    const member = get().members.find((m) => m.id === memberId);
    if (!member) return;

    const newLog: ActionLog = {
      id: generateId(),
      memberId,
      memberName: member.name,
      action,
      timestamp: Date.now()
    };

    set((state) => {
      const logs = [...state.actionLogs, newLog];
      const merged = mergeConsecutiveSameMemberLogs(logs);
      return {
        actionLogs: merged.length > MAX_LOGS ? merged.slice(merged.length - MAX_LOGS) : merged
      };
    });
  },

  generateRandomActivity: () => {
    const members = get().members.filter((m) => m.online);
    if (members.length === 0) return;

    const member = members[Math.floor(Math.random() * members.length)];
    const action = RANDOM_ACTIONS[Math.floor(Math.random() * RANDOM_ACTIONS.length)];
    const actionKey = `${member.id}-${action}`;

    if (lastMemberId === member.id && lastActionKey === actionKey) {
      repeatCount++;
      if (repeatCount < 2) return;
      repeatCount = 0;
    } else {
      repeatCount = 0;
    }
    lastMemberId = member.id;
    lastActionKey = actionKey;

    get().addActionLog(member.id, action);
  },

  startPolling: () => {
    if (get().pollingInterval !== null) return;
    const interval = window.setInterval(() => {
      get().generateRandomActivity();
    }, 3000);
    set({ pollingInterval: interval });

    get().addActionLog('alice', '加入了画布');
    setTimeout(() => get().addActionLog('bob', '加入了画布'), 500);
    setTimeout(() => get().addActionLog('charlie', '加入了画布'), 1000);
  },

  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval !== null) {
      window.clearInterval(interval);
      set({ pollingInterval: null });
    }
  },

  clearLogs: () => set({ actionLogs: [] })
}));

function mergeConsecutiveSameMemberLogs(logs: ActionLog[]): ActionLog[] {
  if (logs.length < 2) return logs;

  const merged: ActionLog[] = [];
  let last: ActionLog | null = null;

  for (const log of logs) {
    if (last && last.memberId === log.memberId && last.action === log.action) {
      continue;
    }
    merged.push(log);
    last = log;
  }

  return merged;
}

export function getLastActionByMember(memberId: string, logs: ActionLog[]): ActionLog | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].memberId === memberId) return logs[i];
  }
  return null;
}
