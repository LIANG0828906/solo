export type ResourceType = 'sprite' | 'background' | 'ui' | 'audio';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Resource {
  id: string;
  userId: string;
  name: string;
  type: ResourceType;
  size: number;
  width: number;
  height: number;
  thumbnailUrl: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  projects: string[];
}

export interface Version {
  id: string;
  resourceId: string;
  versionNumber: number;
  fileUrl: string;
  thumbnailUrl: string;
  size: number;
  width: number;
  height: number;
  note: string;
  createdAt: string;
}

export interface Annotation {
  id: string;
  resourceId: string;
  v1Id: string;
  v2Id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface ResourceProject {
  resourceId: string;
  projectId: string;
}

export interface ResourceDetail extends Resource {
  versions: Version[];
  projectsInfo: Project[];
}

export interface DiffResult {
  diffImageUrl: string;
  changePercent: number;
  changedPixels: number;
  totalPixels: number;
}

export interface ReportStats {
  byType: { type: ResourceType; count: number; totalSize: number }[];
  trend: { date: string; uploads: number; modifications: number }[];
  summary: { totalResources: number; totalSize: number; avgVersions: number };
}

export interface FilterOptions {
  types: ResourceType[];
  minSize?: number;
  maxSize?: number;
  startDate?: string;
  endDate?: string;
}
