import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { User, ClassItem, Task, Review, FileItem } from '../types';
import { mockUsers, mockClasses, mockTasks, generateId } from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  classes: ClassItem[];
  tasks: Task[];
  login: (userId: string) => void;
  logout: () => void;
  createClass: (name: string) => void;
  joinClass: (classId: string) => void;
  createTask: (classId: string, data: Omit<Task, 'id' | 'classId' | 'groups' | 'status'>) => void;
  submitTask: (taskId: string, groupId: string, files: FileItem[]) => void;
  submitReview: (taskId: string, reviewId: string, data: Omit<Review, 'id' | 'taskId' | 'reviewerGroupId' | 'revieweeGroupId' | 'completed'>) => void;
  getClassById: (id: string) => ClassItem | undefined;
  getTaskById: (id: string) => Task | undefined;
  getUserById: (id: string) => User | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users] = useState<User[]>(mockUsers);
  const [classes, setClasses] = useState<ClassItem[]>(mockClasses);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const login = useCallback((userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const createClass = useCallback((name: string) => {
    if (!currentUser) return;
    const newClass: ClassItem = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString().split('T')[0],
      creatorId: currentUser.id,
      memberCount: 1,
      members: [currentUser.id],
    };
    setClasses((prev) => [...prev, newClass]);
  }, [currentUser]);

  const joinClass = useCallback((classId: string) => {
    if (!currentUser) return;
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id === classId && !cls.members.includes(currentUser.id)) {
          return {
            ...cls,
            members: [...cls.members, currentUser.id],
            memberCount: cls.memberCount + 1,
          };
        }
        return cls;
      })
    );
  }, [currentUser]);

  const createTask = useCallback((classId: string, data: Omit<Task, 'id' | 'classId' | 'groups' | 'status'>) => {
    const newTask: Task = {
      id: generateId(),
      classId,
      status: 'pending',
      groups: [],
      ...data,
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const submitTask = useCallback((taskId: string, groupId: string, files: FileItem[]) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          groups: task.groups.map((group) => {
            if (group.id !== groupId) return group;
            return {
              ...group,
              submission: {
                id: generateId(),
                groupId,
                submittedAt: new Date().toISOString(),
                files,
              },
            };
          }),
        };
      })
    );
  }, []);

  const submitReview = useCallback((taskId: string, reviewId: string, data: Omit<Review, 'id' | 'taskId' | 'reviewerGroupId' | 'revieweeGroupId' | 'completed'>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          groups: task.groups.map((group) => ({
            ...group,
            reviews: group.reviews.map((review) => {
              if (review.id !== reviewId) return review;
              return { ...review, ...data, completed: true };
            }),
          })),
        };
      })
    );
  }, []);

  const getClassById = useCallback((id: string) => {
    return classes.find((c) => c.id === id);
  }, [classes]);

  const getTaskById = useCallback((id: string) => {
    return tasks.find((t) => t.id === id);
  }, [tasks]);

  const getUserById = useCallback((id: string) => {
    return users.find((u) => u.id === id);
  }, [users]);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      classes,
      tasks,
      login,
      logout,
      createClass,
      joinClass,
      createTask,
      submitTask,
      submitReview,
      getClassById,
      getTaskById,
      getUserById,
    }),
    [currentUser, users, classes, tasks, login, logout, createClass, joinClass, createTask, submitTask, submitReview, getClassById, getTaskById, getUserById]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
