import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { dirname } from 'path';
import { ProductionBatch } from '../types/index.js';

export class FileRepository {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private async ensureDirectoryExists(): Promise<void> {
    const dir = dirname(this.filePath);
    try {
      await access(dir);
    } catch {
      await mkdir(dir, { recursive: true });
    }
  }

  async read(): Promise<ProductionBatch[]> {
    await this.ensureDirectoryExists();
    try {
      const data = await readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as ProductionBatch[];
    } catch {
      return [];
    }
  }

  async write(data: ProductionBatch[]): Promise<void> {
    await this.ensureDirectoryExists();
    await writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
