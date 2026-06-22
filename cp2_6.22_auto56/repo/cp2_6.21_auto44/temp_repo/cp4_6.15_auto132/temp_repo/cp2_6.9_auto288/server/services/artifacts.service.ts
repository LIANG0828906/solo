import { v4 as uuidv4 } from 'uuid';
import { artifactStore } from '../store/memory.store';
import type { Artifact, WorkStep } from '../../src/types';

interface CreateArtifactData {
  userId: string;
  name: string;
  description: string;
  bambooType: string;
  lacquerColor: string;
  pattern: number[][];
  artifactType: string;
  steps: WorkStep[];
  thumbnail: string;
}

export const artifactsService = {
  create: (data: CreateArtifactData): Artifact => {
    const now = new Date().toISOString();
    const artifact: Artifact = {
      id: uuidv4(),
      userId: data.userId,
      name: data.name,
      description: data.description,
      bambooType: data.bambooType as Artifact['bambooType'],
      lacquerColor: data.lacquerColor,
      pattern: data.pattern,
      artifactType: data.artifactType as Artifact['artifactType'],
      steps: data.steps,
      createdAt: now,
      completedAt: now,
      thumbnail: data.thumbnail,
    };
    
    return artifactStore.create(artifact);
  },
  
  getById: (id: string): Artifact | undefined => {
    return artifactStore.findById(id);
  },
  
  getByUserId: (userId: string): Artifact[] => {
    return artifactStore.findByUserId(userId);
  },
  
  update: (id: string, updates: Partial<Artifact>): Artifact | undefined => {
    return artifactStore.update(id, updates);
  },
  
  delete: (id: string): boolean => {
    return artifactStore.delete(id);
  },
};
