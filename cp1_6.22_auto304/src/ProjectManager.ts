import type { Project, Invoice } from './types';

export class ProjectManager {
  private projects: Project[] = [];
  private invoices: Invoice[] = [];

  constructor(initialProjects: Project[] = [], initialInvoices: Invoice[] = []) {
    this.projects = initialProjects;
    this.invoices = initialInvoices;
  }

  setInvoices(invoices: Invoice[]): void {
    this.invoices = invoices;
  }

  addProject(data: Omit<Project, 'id' | 'spent' | 'createdAt'>): Project {
    const newProject: Project = {
      ...data,
      id: crypto.randomUUID(),
      spent: 0,
      createdAt: new Date().toISOString(),
    };
    this.projects.push(newProject);
    return newProject;
  }

  updateProject(id: string, data: Partial<Project>): Project | null {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.projects[index] = { ...this.projects[index], ...data };
    return this.projects[index];
  }

  deleteProject(id: string): boolean {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.projects.splice(index, 1);
    return true;
  }

  getProjects(): Project[] {
    return this.projects.map((p) => ({
      ...p,
      spent: this.getTotalSpentByProject(p.id),
    }));
  }

  getProjectById(id: string): Project | null {
    const project = this.projects.find((p) => p.id === id);
    if (!project) return null;
    return {
      ...project,
      spent: this.getTotalSpentByProject(project.id),
    };
  }

  getBudgetExecutionRate(projectId: string): number {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project || project.budget === 0) return 0;
    const spent = this.getTotalSpentByProject(projectId);
    return (spent / project.budget) * 100;
  }

  getTotalSpentByProject(projectId: string): number {
    return this.invoices
      .filter((inv) => inv.projectId === projectId)
      .reduce((sum, inv) => sum + inv.paidAmount, 0);
  }

  searchProjects(keyword: string): Project[] {
    if (!keyword.trim()) return this.getProjects();
    const lowerKeyword = keyword.toLowerCase();
    return this.getProjects().filter(
      (p) =>
        p.name.toLowerCase().includes(lowerKeyword) ||
        p.customerName.toLowerCase().includes(lowerKeyword)
    );
  }

  getBudgetProgressColor(rate: number): string {
    if (rate < 80) return '#4CAF50';
    if (rate <= 100) return '#FF9800';
    return '#F44336';
  }
}
