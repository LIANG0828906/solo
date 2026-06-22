import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Document } from '../types';

const mockUsers: User[] = [
  { id: '1', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan' },
  { id: '2', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi' },
  { id: '3', name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu' },
];

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const createInitialDocs = (): Document[] => {
  const now = new Date().toISOString();
  return [
    {
      id: generateId(),
      title: '项目需求文档',
      content: '# 项目需求\n\n## 功能概述\n\n这是一个文档协作系统，支持多人实时编辑、版本历史和差异对比。\n\n## 核心功能\n\n1. 文档创建与编辑\n2. 版本历史记录\n3. 差异对比查看\n4. 用户切换模拟\n',
      createdAt: now,
      updatedAt: now,
      lastEditor: mockUsers[0],
      versions: 1,
    },
    {
      id: generateId(),
      title: '技术方案设计',
      content: '# 技术方案\n\n## 技术栈\n\n- React 18 + TypeScript\n- Context API 状态管理\n- CSS Variables 主题系统\n\n## 架构设计\n\n采用组件化设计，分离数据层、业务逻辑层和视图层。\n',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      lastEditor: mockUsers[1],
      versions: 3,
    },
    {
      id: generateId(),
      title: '会议纪要',
      content: '# 周会纪要\n\n**日期**: 2026-06-19\n**参会人员**: 张三、李四、王五\n\n## 讨论事项\n\n1. 进度汇报\n2. 问题讨论\n3. 下周计划\n',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      lastEditor: mockUsers[2],
      versions: 2,
    },
  ];
};

interface AppContextType {
  currentUser: User;
  users: User[];
  documents: Document[];
  loading: boolean;
  error: string | null;
  switchUser: (userId: string) => void;
  fetchDocs: () => Promise<void>;
  createDoc: (title: string, content: string) => Promise<Document>;
  updateDoc: (id: string, title: string, content: string) => Promise<Document | null>;
  deleteDoc: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const switchUser = useCallback((userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (documents.length === 0) {
        setDocuments(createInitialDocs());
      }
    } catch (e) {
      setError('加载文档列表失败');
    } finally {
      setLoading(false);
    }
  }, [documents.length]);

  const createDoc = useCallback(async (title: string, content: string): Promise<Document> => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const now = new Date().toISOString();
      const newDoc: Document = {
        id: generateId(),
        title: title || '无标题文档',
        content: content || '',
        createdAt: now,
        updatedAt: now,
        lastEditor: currentUser,
        versions: 1,
      };
      setDocuments(prev => [newDoc, ...prev]);
      return newDoc;
    } catch (e) {
      setError('创建文档失败');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateDoc = useCallback(async (id: string, title: string, content: string): Promise<Document | null> => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      let updatedDoc: Document | null = null;
      setDocuments(prev =>
        prev.map(doc => {
          if (doc.id === id) {
            updatedDoc = {
              ...doc,
              title: title || doc.title,
              content,
              updatedAt: new Date().toISOString(),
              lastEditor: currentUser,
              versions: doc.versions + 1,
            };
            return updatedDoc;
          }
          return doc;
        })
      );
      return updatedDoc;
    } catch (e) {
      setError('更新文档失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteDoc = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (e) {
      setError('删除文档失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users: mockUsers,
        documents,
        loading,
        error,
        switchUser,
        fetchDocs,
        createDoc,
        updateDoc,
        deleteDoc,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
