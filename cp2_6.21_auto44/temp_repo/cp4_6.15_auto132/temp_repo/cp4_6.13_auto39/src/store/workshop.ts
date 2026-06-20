import { create } from "zustand";

export type WorkshopStatus = "brainstorm" | "voting" | "task";
export type IdeaCategory = "tech" | "design" | "operation" | "other";
export type TaskPriority = "P0" | "P1" | "P2" | "P3";
export type TaskStatus = "todo" | "inProgress" | "done";

export interface WorkshopListItem {
  id: string;
  name: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  status: WorkshopStatus;
  createdAt: string;
}

export interface WorkshopDetail extends WorkshopListItem {
  inviteCode: string;
  shareLink: string;
  isCreator: boolean;
}

export interface IdeaResponse {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  participantName: string;
  likes: number;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  subtasks: SubTask[];
  ideaId: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface VoteResult {
  ideaId: string;
  title: string;
  approveCount: number;
  rejectCount: number;
  weightedScore: number;
  rank: number;
}

interface WorkshopState {
  workshops: WorkshopListItem[];
  currentWorkshop: WorkshopDetail | null;
  ideas: IdeaResponse[];
  tasks: TaskItem[];
  voteResults: VoteResult[];
  loading: boolean;

  fetchWorkshops: () => Promise<void>;
  createWorkshop: (data: { name: string; description: string; maxParticipants: number }) => Promise<WorkshopDetail>;
  joinWorkshop: (inviteCode: string, participantName: string) => Promise<{ workshopId: string; participantId: string }>;
  fetchWorkshopDetail: (id: string) => Promise<void>;
  fetchIdeas: (workshopId: string) => Promise<void>;
  submitIdea: (workshopId: string, data: { title: string; description: string; category: IdeaCategory; participantId: string }) => Promise<void>;
  likeIdea: (ideaId: string, participantId: string) => Promise<{ likes: number; remainingLikes: number }>;
  startVote: (workshopId: string) => Promise<void>;
  submitVotes: (workshopId: string, participantId: string, votes: { ideaId: string; vote: "approve" | "reject" }[]) => Promise<VoteResult[]>;
  fetchTasks: (workshopId: string) => Promise<void>;
  generateTasks: (workshopId: string, topN: number) => Promise<void>;
  updateTask: (taskId: string, data: { status?: TaskStatus; dueDate?: string; subtasks?: SubTask[] }) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
}

function getParticipantId(workshopId: string): string | null {
  return localStorage.getItem(`participant_${workshopId}`);
}

export function setParticipantId(workshopId: string, participantId: string) {
  localStorage.setItem(`participant_${workshopId}`, participantId);
}

export { getParticipantId };

const api = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  workshops: [],
  currentWorkshop: null,
  ideas: [],
  tasks: [],
  voteResults: [],
  loading: false,

  fetchWorkshops: async () => {
    const data = await api<{ workshops: WorkshopListItem[] }>("/api/workshops");
    set({ workshops: data.workshops });
  },

  createWorkshop: async (data) => {
    const result = await api<WorkshopDetail>("/api/workshops", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result;
  },

  joinWorkshop: async (inviteCode, participantName) => {
    const result = await api<{ workshopId: string; participantId: string }>("/api/workshops/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode, participantName }),
    });
    setParticipantId(result.workshopId, result.participantId);
    return result;
  },

  fetchWorkshopDetail: async (id) => {
    set({ loading: true });
    try {
      const data = await api<WorkshopDetail>(`/api/workshops/${id}`);
      set({ currentWorkshop: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchIdeas: async (workshopId) => {
    const data = await api<{ ideas: IdeaResponse[] }>(`/api/workshops/${workshopId}/ideas`);
    set({ ideas: data.ideas });
  },

  submitIdea: async (workshopId, data) => {
    await api(`/api/workshops/${workshopId}/ideas`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    await get().fetchIdeas(workshopId);
  },

  likeIdea: async (ideaId, participantId) => {
    const result = await api<{ likes: number; remainingLikes: number }>(`/api/ideas/${ideaId}/like`, {
      method: "POST",
      body: JSON.stringify({ participantId }),
    });
    const workshopId = get().currentWorkshop?.id;
    if (workshopId) await get().fetchIdeas(workshopId);
    return result;
  },

  startVote: async (workshopId) => {
    await api(`/api/workshops/${workshopId}/start-vote`, { method: "POST" });
    await get().fetchWorkshopDetail(workshopId);
  },

  submitVotes: async (workshopId, participantId, votes) => {
    const data = await api<{ results: VoteResult[] }>(`/api/workshops/${workshopId}/vote`, {
      method: "POST",
      body: JSON.stringify({ participantId, votes }),
    });
    set({ voteResults: data.results });
    return data.results;
  },

  fetchTasks: async (workshopId) => {
    const data = await api<{ tasks: TaskItem[] }>(`/api/workshops/${workshopId}/tasks`);
    set({ tasks: data.tasks });
  },

  generateTasks: async (workshopId, topN) => {
    const data = await api<{ tasks: TaskItem[] }>(`/api/workshops/${workshopId}/generate-tasks`, {
      method: "POST",
      body: JSON.stringify({ topN }),
    });
    set({ tasks: data.tasks });
  },

  updateTask: async (taskId, data) => {
    await api(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    const workshopId = get().currentWorkshop?.id;
    if (workshopId) await get().fetchTasks(workshopId);
  },

  addSubtask: async (taskId, title) => {
    await api(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    const workshopId = get().currentWorkshop?.id;
    if (workshopId) await get().fetchTasks(workshopId);
  },
}));
