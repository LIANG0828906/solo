import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  avatar: string;
  role: 'member' | 'manager';
  createdAt: string;
}

export interface KeyResult {
  id: string;
  title: string;
  description?: string;
  progress: number;
  ownerId: string;
  deadline: string;
  score?: number;
  feedback?: string;
  priority: number;
  weeklyProgress: { week: number; progress: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  quarter: string;
  ownerId: string;
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

interface Database {
  users: User[];
  objectives: Objective[];
}

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const adapter = new FileSync(path.join(dbDir, 'db.json'));
const db = lowdb(adapter);

db.defaults<Database>({
  users: [
    {
      id: uuidv4(),
      username: 'manager',
      password: bcrypt.hashSync('123456', 10),
      name: '张经理',
      avatar: '👨‍💼',
      role: 'manager',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      username: 'member1',
      password: bcrypt.hashSync('123456', 10),
      name: '李工程师',
      avatar: '👨‍💻',
      role: 'member',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      username: 'member2',
      password: bcrypt.hashSync('123456', 10),
      name: '王设计师',
      avatar: '👩‍🎨',
      role: 'member',
      createdAt: new Date().toISOString(),
    },
  ],
  objectives: [],
}).write();

export const dbInstance = db;

export const UserModel = {
  findByUsername: (username: string): User | undefined => {
    return db.get('users').find({ username }).value();
  },
  findById: (id: string): User | undefined => {
    return db.get('users').find({ id }).value();
  },
  getAll: (): User[] => {
    return db.get('users').value();
  },
  create: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    db.get('users').push(newUser).write();
    return newUser;
  },
};

export const OKRModel = {
  getAll: (): Objective[] => {
    return db.get('objectives').value();
  },
  getById: (id: string): Objective | undefined => {
    return db.get('objectives').find({ id }).value();
  },
  create: (
    data: Omit<Objective, 'id' | 'keyResults' | 'createdAt' | 'updatedAt'> & {
      keyResults: Omit<KeyResult, 'id' | 'progress' | 'priority' | 'weeklyProgress' | 'createdAt' | 'updatedAt'>[];
    }
  ): Objective => {
    const now = new Date().toISOString();
    const newObjective: Objective = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      quarter: data.quarter,
      ownerId: data.ownerId,
      keyResults: data.keyResults.map((kr, idx) => ({
        id: uuidv4(),
        title: kr.title,
        description: kr.description,
        progress: 0,
        ownerId: kr.ownerId,
        deadline: kr.deadline,
        priority: idx + 1,
        weeklyProgress: [],
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    };
    db.get('objectives').push(newObjective).write();
    return newObjective;
  },
  update: (id: string, data: Partial<Omit<Objective, 'id' | 'keyResults' | 'createdAt'>>): Objective | undefined => {
    const obj = db.get('objectives').find({ id });
    if (obj.value()) {
      obj.assign({ ...data, updatedAt: new Date().toISOString() }).write();
    }
    return obj.value();
  },
  delete: (id: string): boolean => {
    const before = db.get('objectives').value().length;
    db.get('objectives').remove({ id }).write();
    const after = db.get('objectives').value().length;
    return before > after;
  },
  updateKeyResult: (
    objectiveId: string,
    krId: string,
    data: Partial<Omit<KeyResult, 'id' | 'createdAt'>>
  ): KeyResult | undefined => {
    const objective = db.get('objectives').find({ id: objectiveId });
    const objectiveVal = objective.value();
    if (!objectiveVal) return undefined;

    const krIndex = objectiveVal.keyResults.findIndex((kr) => kr.id === krId);
    if (krIndex === -1) return undefined;

    const now = new Date().toISOString();
    const updatedKR: KeyResult = {
      ...objectiveVal.keyResults[krIndex],
      ...data,
      updatedAt: now,
    };

    objectiveVal.keyResults[krIndex] = updatedKR;
    objective.assign({ keyResults: objectiveVal.keyResults, updatedAt: now }).write();
    return updatedKR;
  },
  reorderKeyResults: (objectiveId: string, reorderedIds: string[]): KeyResult[] | undefined => {
    const objective = db.get('objectives').find({ id: objectiveId });
    const objectiveVal = objective.value();
    if (!objectiveVal) return undefined;

    const now = new Date().toISOString();
    reorderedIds.forEach((id, idx) => {
      const kr = objectiveVal.keyResults.find((k) => k.id === id);
      if (kr) {
        kr.priority = idx + 1;
        kr.updatedAt = now;
      }
    });

    objectiveVal.keyResults.sort((a, b) => a.priority - b.priority);
    objective.assign({ keyResults: objectiveVal.keyResults, updatedAt: now }).write();
    return objectiveVal.keyResults;
  },
  addKeyResult: (
    objectiveId: string,
    data: Omit<KeyResult, 'id' | 'progress' | 'priority' | 'weeklyProgress' | 'createdAt' | 'updatedAt'>
  ): KeyResult | undefined => {
    const objective = db.get('objectives').find({ id: objectiveId });
    const objectiveVal = objective.value();
    if (!objectiveVal) return undefined;

    const now = new Date().toISOString();
    const newKR: KeyResult = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      progress: 0,
      ownerId: data.ownerId,
      deadline: data.deadline,
      priority: objectiveVal.keyResults.length + 1,
      weeklyProgress: [],
      createdAt: now,
      updatedAt: now,
    };

    objectiveVal.keyResults.push(newKR);
    objective.assign({ keyResults: objectiveVal.keyResults, updatedAt: now }).write();
    return newKR;
  },
  deleteKeyResult: (objectiveId: string, krId: string): boolean => {
    const objective = db.get('objectives').find({ id: objectiveId });
    const objectiveVal = objective.value();
    if (!objectiveVal) return false;

    const before = objectiveVal.keyResults.length;
    objectiveVal.keyResults = objectiveVal.keyResults.filter((kr) => kr.id !== krId);
    objectiveVal.keyResults.forEach((kr, idx) => {
      kr.priority = idx + 1;
    });

    objective.assign({ keyResults: objectiveVal.keyResults, updatedAt: new Date().toISOString() }).write();
    return before > objectiveVal.keyResults.length;
  },
};
