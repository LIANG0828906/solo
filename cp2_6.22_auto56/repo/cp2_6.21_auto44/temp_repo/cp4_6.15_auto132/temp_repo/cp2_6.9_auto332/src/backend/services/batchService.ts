import { v4 as uuidv4 } from 'uuid';
import { ProductionBatch, FlourType, QualityGrade } from '../types/index.js';
import { FileRepository } from '../repositories/fileRepository.js';

export class BatchService {
  private repository: FileRepository;

  constructor(repository: FileRepository) {
    this.repository = repository;
  }

  async getAllBatches(): Promise<ProductionBatch[]> {
    return await this.repository.read();
  }

  async getBatchById(id: string): Promise<ProductionBatch | null> {
    const batches = await this.repository.read();
    return batches.find(batch => batch.id === id) || null;
  }

  async createBatch(batchData: Omit<ProductionBatch, 'id' | 'timestamp'>): Promise<ProductionBatch> {
    const batches = await this.repository.read();
    const newBatch: ProductionBatch = {
      ...batchData,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    batches.push(newBatch);
    await this.repository.write(batches);
    return newBatch;
  }

  async updateBatch(id: string, updates: Partial<ProductionBatch>): Promise<ProductionBatch | null> {
    const batches = await this.repository.read();
    const index = batches.findIndex(batch => batch.id === id);
    if (index === -1) {
      return null;
    }
    batches[index] = { ...batches[index], ...updates };
    await this.repository.write(batches);
    return batches[index];
  }

  async deleteBatch(id: string): Promise<boolean> {
    const batches = await this.repository.read();
    const index = batches.findIndex(batch => batch.id === id);
    if (index === -1) {
      return false;
    }
    batches.splice(index, 1);
    await this.repository.write(batches);
    return true;
  }

  async getStatistics(): Promise<{
    totalWeight: number;
    countByType: Record<FlourType, number>;
    countByGrade: Record<QualityGrade, number>;
  }> {
    const batches = await this.repository.read();
    
    const totalWeight = batches.reduce((sum, batch) => sum + batch.weight, 0);
    
    const countByType: Record<FlourType, number> = {
      fine: 0,
      medium: 0,
      bran: 0,
    };
    
    const countByGrade: Record<QualityGrade, number> = {
      S: 0,
      A: 0,
      B: 0,
      C: 0,
    };
    
    for (const batch of batches) {
      countByType[batch.flourType]++;
      countByGrade[batch.qualityGrade]++;
    }
    
    return {
      totalWeight,
      countByType,
      countByGrade,
    };
  }
}
