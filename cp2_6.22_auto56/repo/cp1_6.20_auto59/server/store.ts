import * as fs from 'fs';
import * as path from 'path';

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Version {
  id: string;
  version: number;
  content: string;
  editor: string;
  createdAt: string;
}

export interface VersionRecord {
  docId: string;
  versions: Version[];
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  lastEditor: string;
  versions: number;
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const DOCS_FILE = path.join(DATA_DIR, 'docs.json');
const VERSIONS_FILE = path.join(DATA_DIR, 'versions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('创建data目录失败:', err);
    throw err;
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  ensureDataDir();
  try {
    if (!fs.existsSync(filePath)) {
      writeJsonFile(filePath, defaultValue);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`读取文件 ${filePath} 失败:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`写入文件 ${filePath} 失败:`, err);
    throw err;
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getDocs(): Doc[] {
  return readJsonFile<Doc[]>(DOCS_FILE, []);
}

export function saveDocs(docs: Doc[]): void {
  writeJsonFile(DOCS_FILE, docs);
}

export function getDocById(id: string): Doc | undefined {
  const docs = getDocs();
  return docs.find((doc) => doc.id === id);
}

export function createDoc(doc: Omit<Doc, 'id' | 'createdAt' | 'updatedAt' | 'versions'>): Doc {
  const docs = getDocs();
  const now = new Date().toISOString();
  const newDoc: Doc = {
    ...doc,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    versions: 1,
  };
  docs.push(newDoc);
  saveDocs(docs);

  const versions = readJsonFile<VersionRecord[]>(VERSIONS_FILE, []);
  let record = versions.find((v) => v.docId === newDoc.id);
  const initialVersion: Version = {
    id: generateId(),
    version: 1,
    content: newDoc.content,
    editor: newDoc.lastEditor,
    createdAt: now,
  };
  if (record) {
    record.versions.push(initialVersion);
  } else {
    versions.push({ docId: newDoc.id, versions: [initialVersion] });
  }
  writeJsonFile(VERSIONS_FILE, versions);

  return newDoc;
}

export function updateDoc(id: string, updates: Partial<Omit<Doc, 'id' | 'createdAt' | 'versions'>>): Doc | undefined {
  const docs = getDocs();
  const index = docs.findIndex((doc) => doc.id === id);
  if (index === -1) return undefined;

  const now = new Date().toISOString();
  const newVersionNum = docs[index].versions + 1;
  const updatedDoc: Doc = {
    ...docs[index],
    ...updates,
    updatedAt: now,
    versions: newVersionNum,
  };
  docs[index] = updatedDoc;
  saveDocs(docs);

  if (updates.content !== undefined || updates.title !== undefined) {
    const versions = readJsonFile<VersionRecord[]>(VERSIONS_FILE, []);
    let record = versions.find((v) => v.docId === id);
    const newVersion: Version = {
      id: generateId(),
      version: newVersionNum,
      content: updates.content ?? docs[index].content,
      editor: updates.lastEditor ?? docs[index].lastEditor,
      createdAt: now,
    };
    if (record) {
      record.versions.push(newVersion);
    } else {
      versions.push({ docId: id, versions: [newVersion] });
    }
    writeJsonFile(VERSIONS_FILE, versions);
  }

  return updatedDoc;
}

export function deleteDoc(id: string): boolean {
  const docs = getDocs();
  const index = docs.findIndex((doc) => doc.id === id);
  if (index === -1) return false;
  docs.splice(index, 1);
  saveDocs(docs);

  const versions = readJsonFile<VersionRecord[]>(VERSIONS_FILE, []);
  const vIndex = versions.findIndex((v) => v.docId === id);
  if (vIndex !== -1) {
    versions.splice(vIndex, 1);
    writeJsonFile(VERSIONS_FILE, versions);
  }

  return true;
}

export function getVersions(docId: string): Version[] {
  const records = readJsonFile<VersionRecord[]>(VERSIONS_FILE, []);
  const record = records.find((r) => r.docId === docId);
  return record ? [...record.versions] : [];
}

export function createVersion(docId: string, version: Omit<Version, 'id' | 'createdAt'>): Version | undefined {
  const records = readJsonFile<VersionRecord[]>(VERSIONS_FILE, []);
  let record = records.find((r) => r.docId === docId);
  const newVersion: Version = {
    ...version,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  if (record) {
    record.versions.push(newVersion);
  } else {
    records.push({ docId, versions: [newVersion] });
  }
  writeJsonFile(VERSIONS_FILE, records);
  return newVersion;
}

export function getVersion(docId: string, versionId: string): Version | undefined {
  const versions = getVersions(docId);
  return versions.find((v) => v.id === versionId);
}

export function getUsers(): User[] {
  const defaultUsers: User[] = [
    { id: 'user-1', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan' },
    { id: 'user-2', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi' },
    { id: 'user-3', name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu' },
  ];
  const users = readJsonFile<User[]>(USERS_FILE, []);
  if (users.length === 0) {
    writeJsonFile(USERS_FILE, defaultUsers);
    return defaultUsers;
  }
  return users;
}
