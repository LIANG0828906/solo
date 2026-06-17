import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Idea, Cluster, THEME_COLORS } from '../shared/types';
import { kmeansClustering, incrementalCluster, textToVector } from '../cluster/clusterEngine';

interface AppState {
  ideas: Idea[];
  clusters: Cluster[];
  selectedClusterId: string | null;
  isExporting: boolean;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  canvasSize: { width: number; height: number };
  
  addIdea: (text: string) => void;
  removeIdea: (id: string) => void;
  updateIdeaPosition: (id: string, x: number, y: number) => void;
  updateClusterName: (clusterId: string, name: string) => void;
  selectCluster: (clusterId: string | null) => void;
  triggerRecluster: () => void;
  setIsExporting: (exporting: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setCanvasSize: (width: number, height: number) => void;
  clearAll: () => void;
  exportWhitepaper: () => string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ideas: [],
      clusters: [],
      selectedClusterId: null,
      isExporting: false,
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      canvasSize: { width: 800, height: 600 },

      addIdea: (text: string) => {
        const state = get();
        const { width, height } = state.canvasSize;
        
        const newIdea: Idea = {
          id: uuidv4(),
          text,
          clusterId: null,
          x: width / 2,
          y: height / 2,
          radius: 10 + Math.random() * 15,
          color: THEME_COLORS[0],
          createdAt: Date.now(),
          vector: textToVector(text)
        };

        if (state.ideas.length > 50) {
          const result = incrementalCluster(newIdea, state.ideas, state.clusters, width, height);
          set({ ideas: result.ideas, clusters: result.clusters });
        } else {
          const allIdeas = [...state.ideas, newIdea];
          const result = kmeansClustering(allIdeas, width, height, state.clusters);
          set({ ideas: result.ideas, clusters: result.clusters });
        }
      },

      removeIdea: (id: string) => {
        const state = get();
        const newIdeas = state.ideas.filter(i => i.id !== id);
        const { width, height } = state.canvasSize;
        const result = kmeansClustering(newIdeas, width, height);
        set({ ideas: result.ideas, clusters: result.clusters });
      },

      updateIdeaPosition: (id: string, x: number, y: number) => {
        set(state => ({
          ideas: state.ideas.map(idea =>
            idea.id === id ? { ...idea, x, y } : idea
          )
        }));
      },

      updateClusterName: (clusterId: string, name: string) => {
        set(state => ({
          clusters: state.clusters.map(cluster =>
            cluster.id === clusterId ? { ...cluster, name } : cluster
          )
        }));
      },

      selectCluster: (clusterId: string | null) => {
        set({ selectedClusterId: clusterId });
      },

      triggerRecluster: () => {
        const state = get();
        const { width, height } = state.canvasSize;
        const result = kmeansClustering(state.ideas, width, height);
        set({ ideas: result.ideas, clusters: result.clusters });
      },

      setIsExporting: (exporting: boolean) => {
        set({ isExporting: exporting });
      },

      toggleLeftPanel: () => {
        set(state => ({ leftPanelCollapsed: !state.leftPanelCollapsed }));
      },

      toggleRightPanel: () => {
        set(state => ({ rightPanelCollapsed: !state.rightPanelCollapsed }));
      },

      setCanvasSize: (width: number, height: number) => {
        set({ canvasSize: { width, height } });
      },

      clearAll: () => {
        set({ ideas: [], clusters: [], selectedClusterId: null });
      },

      exportWhitepaper: () => {
        const state = get();
        let content = '=== 灵感白皮书 ===\n\n';
        content += `生成时间: ${new Date().toLocaleString()}\n`;
        content += `灵感总数: ${state.ideas.length}\n`;
        content += `星群数量: ${state.clusters.length}\n\n`;
        content += '====================\n\n';

        state.clusters.forEach(cluster => {
          content += `【${cluster.name}】\n`;
          const clusterIdeas = state.ideas.filter(i => i.clusterId === cluster.id);
          clusterIdeas.forEach((idea, idx) => {
            content += `  ${idx + 1}. ${idea.text}\n`;
          });
          content += '\n';
        });

        const unassigned = state.ideas.filter(i => !i.clusterId);
        if (unassigned.length > 0) {
          content += '【未分类】\n';
          unassigned.forEach((idea, idx) => {
            content += `  ${idx + 1}. ${idea.text}\n`;
          });
        }

        return content;
      }
    }),
    {
      name: 'inspiration-galaxy-storage',
      partialize: (state) => ({
        ideas: state.ideas,
        clusters: state.clusters
      })
    }
  )
);
