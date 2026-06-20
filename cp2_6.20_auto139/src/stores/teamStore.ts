import { create } from 'zustand';
import { teamApi } from '../api/teamApi';
import type { TeamData, TeamMember, TeamMemberStatus, UpdatePositionRequest } from '../types';

interface TeamState {
  teamData: TeamData | null;
  currentMember: TeamMember | null;
  loading: boolean;
  error: string | null;
  syncErrorCount: number;
  lastSyncTime: string | null;

  fetchTeam: (routeId: string) => Promise<void>;
  startPositionTracking: (memberId: string, routeId: string, name: string) => () => void;
  stopPositionTracking: () => void;
  joinRoute: (routeId: string, name: string) => Promise<TeamMember>;
  updateMemberStatus: (status: TeamMemberStatus) => void;
  setCurrentMember: (member: TeamMember | null) => void;
  resetSyncError: () => void;
}

let positionInterval: ReturnType<typeof setInterval> | null = null;

export const useTeamStore = create<TeamState>((set, get) => ({
  teamData: null,
  currentMember: null,
  loading: false,
  error: null,
  syncErrorCount: 0,
  lastSyncTime: null,

  fetchTeam: async (routeId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await teamApi.getTeam(routeId);
      set({ teamData: data, loading: false });
    } catch (error) {
      set({ error: '加载队伍数据失败', loading: false });
    }
  },

  startPositionTracking: (memberId, routeId, name) => {
    if (positionInterval) {
      clearInterval(positionInterval);
    }

    const getPosition = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const currentStatus = get().currentMember?.status || 'moving';

          const request: UpdatePositionRequest = {
            memberId,
            routeId,
            name,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            status: currentStatus
          };

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500);

            const updated = await teamApi.updatePosition(request);
            clearTimeout(timeoutId);

            set((state) => ({
              currentMember: updated,
              syncErrorCount: 0,
              lastSyncTime: new Date().toISOString(),
              teamData: state.teamData
                ? {
                    ...state.teamData,
                    members: state.teamData.members.map((m) =>
                      m.id === memberId ? updated : m
                    )
                  }
                : state.teamData
            }));
          } catch (error) {
            set((state) => {
              const newErrorCount = state.syncErrorCount + 1;
              return {
                syncErrorCount: newErrorCount,
                error: newErrorCount >= 2 ? '位置同步失败' : null
              };
            });
          }
        },
        (error) => {
          console.error('获取位置失败:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    };

    getPosition();
    positionInterval = setInterval(getPosition, 10000);

    return () => {
      if (positionInterval) {
        clearInterval(positionInterval);
        positionInterval = null;
      }
    };
  },

  stopPositionTracking: () => {
    if (positionInterval) {
      clearInterval(positionInterval);
      positionInterval = null;
    }
  },

  joinRoute: async (routeId, name) => {
    set({ loading: true, error: null });
    try {
      const member = await teamApi.joinRoute(routeId, name);
      set({ currentMember: member, loading: false });
      return member;
    } catch (error) {
      set({ error: '加入路线失败', loading: false });
      throw error;
    }
  },

  updateMemberStatus: (status) => {
    set((state) => {
      if (!state.currentMember) return state;
      return {
        currentMember: { ...state.currentMember, status }
      };
    });
  },

  setCurrentMember: (member) => set({ currentMember: member }),

  resetSyncError: () => set({ syncErrorCount: 0, error: null })
}));
