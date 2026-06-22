export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface WorkStep {
  id: string;
  timestamp: string;
  type: 'select_bamboo' | 'split' | 'weave' | 'trim' | 'lacquer';
  description: string;
  thumbnail: string;
  patternState: number[][];
}

export interface Artifact {
  id: string;
  userId: string;
  name: string;
  description: string;
  bambooType: 'qing' | 'zi' | 'jin' | 'ban';
  lacquerColor: string;
  pattern: number[][];
  artifactType: 'basket' | 'mat' | 'basketry';
  steps: WorkStep[];
  createdAt: string;
  completedAt: string;
  thumbnail: string;
}

export type BambooType = Artifact['bambooType'];
export type ArtifactType = Artifact['artifactType'];
export type WorkStepType = WorkStep['type'];
