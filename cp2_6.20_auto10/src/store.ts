import { create } from 'zustand';
import type { Meeting, AgendaItem, Task, User, Comment, Vote, AgendaStatus } from './types';

const mockUsers: User[] = [
  { id: 'u1', name: '张三', avatar: 'ZS', color: '#6c63ff' },
  { id: 'u2', name: '李四', avatar: 'LS', color: '#f59e0b' },
  { id: 'u3', name: '王五', avatar: 'WW', color: '#10b981' },
  { id: 'u4', name: '赵六', avatar: 'ZL', color: '#ef4444' },
  { id: 'u5', name: '钱七', avatar: 'QQ', color: '#8b5cf6' },
  { id: 'u6', name: '孙八', avatar: 'SB', color: '#06b6d4' },
  { id: 'u7', name: '周九', avatar: 'ZJ', color: '#ec4899' },
  { id: 'u8', name: '吴十', avatar: 'WS', color: '#84cc16' },
  { id: 'u9', name: '郑十一', avatar: 'ZS1', color: '#f97316' },
  { id: 'u10', name: '王十二', avatar: 'WS2', color: '#14b8a6' },
];

function generateMockMeetings(count: number): Meeting[] {
  const meetings: Meeting[] = [];
  const statuses: Array<'upcoming' | 'ongoing' | 'ended'> = ['upcoming', 'ongoing', 'ended'];
  const agendaStatuses: AgendaStatus[] = ['pending', 'discussing', 'resolved', 'postponed'];
  const titles = [
    '产品需求评审会', '技术方案研讨会', '周例会', '月度总结会', '项目启动会',
    '设计评审会', '代码审查会', '客户沟通会', '战略规划会', '团队建设会',
    '性能优化讨论会', '安全评审会', '迭代复盘会', '需求澄清会', '架构评审会',
  ];
  const locations = ['会议室A', '会议室B', '线上-腾讯会议', '线上-飞书', '大会议室', '小会议室'];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    const dateStr = date.toISOString().split('T')[0];
    const hours = 9 + Math.floor(Math.random() * 8);
    const minutes = Math.random() > 0.5 ? '00' : '30';

    const agendaCount = 3 + Math.floor(Math.random() * 5);
    const agendaItems: AgendaItem[] = [];
    for (let j = 0; j < agendaCount; j++) {
      const durations = [5, 10, 15, 20, 30, 45, 60];
      const duration = durations[Math.floor(Math.random() * durations.length)];
      const responsibleUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];

      const comments: Comment[] = [];
      const commentCount = Math.floor(Math.random() * 5);
      for (let k = 0; k < commentCount; k++) {
        const commentUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        comments.push({
          id: `c-${i}-${j}-${k}`,
          userId: commentUser.id,
          userName: commentUser.name,
          userAvatar: commentUser.avatar,
          userColor: commentUser.color,
          content: `这是第${k + 1}条评论，关于议程项的讨论内容。`,
          timestamp: date.getTime() + k * 60000,
        });
      }

      const votes: Vote[] = [];
      if (Math.random() > 0.5) {
        const voteTypes: Array<'agree' | 'disagree' | 'abstain'> = ['agree', 'disagree', 'abstain'];
        for (let v = 0; v < 3; v++) {
          votes.push({
            userId: mockUsers[v].id,
            type: voteTypes[Math.floor(Math.random() * voteTypes.length)],
          });
        }
      }

      const status = agendaStatuses[Math.floor(Math.random() * agendaStatuses.length)];
      let todo = undefined;
      let todoPriority: 'high' | 'medium' | 'low' | undefined = undefined;
      if (status === 'resolved' && Math.random() > 0.5) {
        todo = `完成${j + 1}号议题的后续工作`;
        const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
        todoPriority = priorities[Math.floor(Math.random() * priorities.length)];
      }

      agendaItems.push({
        id: `a-${i}-${j}`,
        title: `议程项 ${j + 1}：讨论${titles[Math.floor(Math.random() * titles.length)]}相关问题`,
        description: '这是议程项的详细描述，说明本次讨论的具体内容和目标。',
        responsible: responsibleUser.name,
        duration,
        status,
        order: j,
        comments,
        votes,
        resolution: status === 'resolved' ? '已达成共识，按照方案执行。' : undefined,
        todo,
        todoPriority,
        todoDueDate: todo ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      });
    }

    const participantCount = 3 + Math.floor(Math.random() * 7);
    const participants = [...mockUsers].sort(() => Math.random() - 0.5).slice(0, participantCount);

    meetings.push({
      id: `m-${i}`,
      title: titles[i % titles.length] + ` #${i + 1}`,
      date: dateStr,
      time: `${hours.toString().padStart(2, '0')}:${minutes}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      participants,
      agendaItems,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: date.getTime(),
    });
  }

  return meetings.sort((a, b) => b.createdAt - a.createdAt);
}

const initialMeetings = generateMockMeetings(50);

class MeetingSearchIndex {
  private index: Map<string, Set<number>> = new Map();
  private meetings: Meeting[] = [];

  rebuild(meetings: Meeting[]) {
    this.meetings = meetings;
    this.index.clear();
    for (let i = 0; i < meetings.length; i++) {
      const chars = new Set(meetings[i].title.toLowerCase().split(''));
      chars.forEach((ch) => {
        if (!this.index.has(ch)) {
          this.index.set(ch, new Set());
        }
        this.index.get(ch)!.add(i);
      });
    }
  }

  search(query: string): Meeting[] {
    if (!query.trim()) return this.meetings;
    const q = query.toLowerCase();
    const chars = q.split('');
    if (chars.length === 0) return this.meetings;

    let candidateIndices: Set<number> | null = null;
    for (const ch of chars) {
      const charSet = this.index.get(ch);
      if (!charSet) return [];
      if (candidateIndices === null) {
        candidateIndices = new Set(charSet);
      } else {
        const next = new Set<number>();
        for (const idx of candidateIndices) {
          if (charSet.has(idx)) {
            next.add(idx);
          }
        }
        candidateIndices = next;
      }
      if (candidateIndices.size === 0) return [];
    }

    const result: Meeting[] = [];
    if (candidateIndices) {
      for (const idx of candidateIndices) {
        if (this.meetings[idx] && this.meetings[idx].title.toLowerCase().includes(q)) {
          result.push(this.meetings[idx]);
        }
      }
    }
    return result;
  }
}

const searchIndex = new MeetingSearchIndex();
searchIndex.rebuild(initialMeetings);

function generateTasksFromMeetings(meetings: Meeting[]): Task[] {
  const tasks: Task[] = [];
  let taskId = 0;

  meetings.forEach((meeting) => {
    meeting.agendaItems.forEach((item) => {
      if (item.todo && item.status === 'resolved') {
        const statuses: Task['status'][] = ['todo', 'in-progress', 'done'];
        tasks.push({
          id: `t-${taskId++}`,
          title: item.todo,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          agendaItemId: item.id,
          responsible: item.responsible,
          dueDate: item.todoDueDate,
          priority: item.todoPriority || 'medium',
          status: statuses[Math.floor(Math.random() * statuses.length)],
          createdAt: meeting.createdAt,
        });
      }
    });
  });

  return tasks;
}

interface AppState {
  meetings: Meeting[];
  tasks: Task[];
  currentUser: User;
  searchQuery: string;
  sidebarOpen: boolean;
  selectedMeetingId: string | null;
  createModalOpen: boolean;

  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  selectMeeting: (id: string | null) => void;
  setCreateModalOpen: (open: boolean) => void;

  getFilteredMeetings: () => Meeting[];
  getMeeting: (id: string) => Meeting | undefined;
  getTasks: () => Task[];

  createMeeting: (data: Omit<Meeting, 'id' | 'createdAt'> & { agendaItems: Omit<AgendaItem, 'id' | 'comments' | 'votes'>[] }) => void;
  addAgendaItem: (meetingId: string, item: Omit<AgendaItem, 'id' | 'comments' | 'votes'>) => void;
  updateAgendaOrder: (meetingId: string, itemIds: string[]) => void;
  addComment: (meetingId: string, itemId: string, content: string) => void;
  castVote: (meetingId: string, itemId: string, voteType: 'agree' | 'disagree' | 'abstain') => void;
  updateAgendaStatus: (meetingId: string, itemId: string, status: AgendaStatus) => void;

  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  generateTasksFromMeeting: (meetingId: string) => Task[];
}

export const useAppStore = create<AppState>((set, get) => ({
  meetings: initialMeetings,
  tasks: generateTasksFromMeetings(initialMeetings),
  currentUser: mockUsers[0],
  searchQuery: '',
  sidebarOpen: true,
  selectedMeetingId: null,
  createModalOpen: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  selectMeeting: (id) => set({ selectedMeetingId: id }),
  setCreateModalOpen: (open) => set({ createModalOpen: open }),

  getFilteredMeetings: () => {
    const { meetings, searchQuery } = get();
    if (!searchQuery.trim()) return meetings;
    return searchIndex.search(searchQuery);
  },

  getMeeting: (id) => get().meetings.find((m) => m.id === id),

  getTasks: () => get().tasks,

  createMeeting: (data) => {
    const agendaItems: AgendaItem[] = data.agendaItems.map((item, index) => ({
      ...item,
      id: `a-${Date.now()}-${index}`,
      comments: [],
      votes: [],
    }));
    const newMeeting: Meeting = {
      ...data,
      agendaItems,
      id: `m-${Date.now()}`,
      createdAt: Date.now(),
    };
    set((state) => ({
      meetings: [newMeeting, ...state.meetings],
    }));
    searchIndex.rebuild(get().meetings);
  },

  addAgendaItem: (meetingId, item) => {
    const newItem: AgendaItem = {
      ...item,
      id: `a-${Date.now()}`,
      comments: [],
      votes: [],
    };
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === meetingId
          ? { ...m, agendaItems: [...m.agendaItems, newItem] }
          : m
      ),
    }));
  },

  updateAgendaOrder: (meetingId, itemIds) => {
    set((state) => ({
      meetings: state.meetings.map((m) => {
        if (m.id !== meetingId) return m;
        const sortedItems = itemIds
          .map((id) => m.agendaItems.find((item) => item.id === id))
          .filter((item): item is AgendaItem => !!item)
          .map((item, index) => ({ ...item, order: index }));
        return { ...m, agendaItems: sortedItems };
      }),
    }));
  },

  addComment: (meetingId, itemId, content) => {
    const { currentUser } = get();
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userColor: currentUser.color,
      content,
      timestamp: Date.now(),
    };
    set((state) => ({
      meetings: state.meetings.map((m) => {
        if (m.id !== meetingId) return m;
        return {
          ...m,
          agendaItems: m.agendaItems.map((item) =>
            item.id === itemId
              ? { ...item, comments: [...item.comments, newComment] }
              : item
          ),
        };
      }),
    }));
  },

  castVote: (meetingId, itemId, voteType) => {
    const { currentUser } = get();
    set((state) => ({
      meetings: state.meetings.map((m) => {
        if (m.id !== meetingId) return m;
        return {
          ...m,
          agendaItems: m.agendaItems.map((item) => {
            if (item.id !== itemId) return item;
            const existingVoteIndex = item.votes.findIndex((v) => v.userId === currentUser.id);
            let newVotes = [...item.votes];
            if (existingVoteIndex >= 0) {
              newVotes[existingVoteIndex] = { userId: currentUser.id, type: voteType };
            } else {
              newVotes.push({ userId: currentUser.id, type: voteType });
            }
            return { ...item, votes: newVotes };
          }),
        };
      }),
    }));
  },

  updateAgendaStatus: (meetingId, itemId, status) => {
    set((state) => ({
      meetings: state.meetings.map((m) => {
        if (m.id !== meetingId) return m;
        return {
          ...m,
          agendaItems: m.agendaItems.map((item) =>
            item.id === itemId ? { ...item, status } : item
          ),
        };
      }),
    }));
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status } : t
      ),
    }));
  },

  generateTasksFromMeeting: (meetingId) => {
    const meeting = get().getMeeting(meetingId);
    if (!meeting) return [];

    const newTasks: Task[] = [];
    meeting.agendaItems.forEach((item) => {
      if (item.todo && item.status === 'resolved') {
        newTasks.push({
          id: `t-${Date.now()}-${item.id}`,
          title: item.todo,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          agendaItemId: item.id,
          responsible: item.responsible,
          dueDate: item.todoDueDate,
          priority: item.todoPriority || 'medium',
          status: 'todo',
          createdAt: Date.now(),
        });
      }
    });

    set((state) => ({
      tasks: [...newTasks, ...state.tasks],
    }));

    return newTasks;
  },
}));
