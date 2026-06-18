import { createContext, useContext, ReactNode } from 'react';
import { useProjectStore } from './useProjectStore';
import type { ProjectContextType } from '@/types';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const store = useProjectStore();

  return (
    <ProjectContext.Provider value={store}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
