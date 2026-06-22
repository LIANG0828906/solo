import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Project, Task, User } from './types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  users: User[];
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (p: Project | null) => void;
  tasks: Task[];
  refreshProjects: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (projectId: string, data: Partial<Task>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const refreshUsers = async () => {
    const { data } = await axios.get('/api/users');
    setUsers(data);
  };

  const refreshProjects = async () => {
    const { data } = await axios.get('/api/projects');
    setProjects(data);
    if (!currentProject && data.length > 0) {
      setCurrentProject(data[0]);
    }
  };

  const refreshTasks = async () => {
    if (!currentProject) return;
    const { data } = await axios.get(`/api/projects/${currentProject.id}/tasks`);
    setTasks(data);
  };

  const createProject = async (data: Partial<Project>) => {
    const res = await axios.post('/api/projects', data);
    setProjects((prev) => [...prev, res.data]);
    setCurrentProject(res.data);
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    const res = await axios.put(`/api/projects/${id}`, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? res.data : p)));
    if (currentProject?.id === id) setCurrentProject(res.data);
  };

  const deleteProject = async (id: string) => {
    await axios.delete(`/api/projects/${id}`);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks([]);
    if (currentProject?.id === id) setCurrentProject(null);
  };

  const createTask = async (projectId: string, data: Partial<Task>) => {
    await axios.post(`/api/projects/${projectId}/tasks`, data);
    await refreshTasks();
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    await axios.put(`/api/projects/tasks/${id}`, data);
    await refreshTasks();
  };

  const deleteTask = async (id: string) => {
    await axios.delete(`/api/projects/tasks/${id}`);
    await refreshTasks();
  };

  useEffect(() => {
    refreshUsers();
    refreshProjects();
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [currentProject]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        projects,
        currentProject,
        setCurrentProject,
        tasks,
        refreshProjects,
        refreshTasks,
        refreshUsers,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
