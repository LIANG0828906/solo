import type { Project, IdeaCard, ColorInfo } from '@/types';

interface ExportedCard {
  id: string;
  imageName: string;
  position: { x: number; y: number };
  colors: ColorInfo[];
  note: string;
  createdAt: number;
}

interface ExportedProject {
  projectName: string;
  exportDate: string;
  cards: ExportedCard[];
}

export const exportProjectToJson = (project: Project): void => {
  const exportedCards: ExportedCard[] = project.cards.map((card: IdeaCard) => ({
    id: card.id,
    imageName: card.imageName,
    position: card.position,
    colors: card.colors,
    note: card.note,
    createdAt: card.createdAt,
  }));

  const exportData: ExportedProject = {
    projectName: project.name,
    exportDate: new Date().toISOString(),
    cards: exportedCards,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date();
  const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const fileName = `${project.name}-灵感板-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '仅支持 JPG 和 PNG 格式的图片' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '图片大小不能超过 5MB' };
  }

  return { valid: true };
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
};
