import { v4 as uuidv4 } from 'uuid';
import type { User, Project, TaskUpdate, TaskStatus, SafeUser } from './types';

export type UserWithPassword = User;

export interface DataStore {
  users: UserWithPassword[];
  projects: Project[];
  taskUpdates: TaskUpdate[];
}

const store: DataStore = {
  users: [],
  projects: [],
  taskUpdates: [],
};

export const createUser = (username: string, passwordHash: string): UserWithPassword => {
  const user: UserWithPassword = {
    id: uuidv4(),
    username,
    passwordHash,
  };
  store.users.push(user);
  return user;
};

export const findUserByUsername = (username: string): UserWithPassword | undefined => {
  return store.users.find(u => u.username === username);
};

export const findUserById = (id: string): UserWithPassword | undefined => {
  return store.users.find(u => u.id === id);
};

export const getAllUsers = (): SafeUser[] => {
  return store.users.map(({ passwordHash, ...user }) => user);
};

export const getProjectsByUserId = (userId: string): Project[] => {
  return store.projects.filter(p => p.memberIds.includes(userId));
};

export const findProjectById = (id: string): Project | undefined => {
  return store.projects.find(p => p.id === id);
};

export const createProject = (name: string, description: string, ownerId: string): Project => {
  const now = new Date().toISOString();
  const project: Project = {
    id: uuidv4(),
    name,
    description,
    ownerId,
    memberIds: [ownerId],
    createdAt: now,
    updatedAt: now,
  };
  store.projects.push(project);
  return project;
};

export const addProjectMember = (projectId: string, userId: string): Project | null => {
  const project = findProjectById(projectId);
  if (!project) return null;
  if (!project.memberIds.includes(userId)) {
    project.memberIds.push(userId);
    project.updatedAt = new Date().toISOString();
  }
  return project;
};

export const getTaskUpdatesByProjectId = (projectId: string): TaskUpdate[] => {
  return store.taskUpdates.filter(t => t.projectId === projectId);
};

export const createTaskUpdate = (
  projectId: string,
  userId: string,
  targetUserId: string,
  status: TaskStatus,
  note: string,
  tags: string[]
): TaskUpdate => {
  const taskUpdate: TaskUpdate = {
    id: uuidv4(),
    projectId,
    userId,
    targetUserId,
    status,
    note,
    tags,
    createdAt: new Date().toISOString(),
  };
  store.taskUpdates.push(taskUpdate);
  return taskUpdate;
};

export const sanitizeUser = (user: UserWithPassword): SafeUser => {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
};
