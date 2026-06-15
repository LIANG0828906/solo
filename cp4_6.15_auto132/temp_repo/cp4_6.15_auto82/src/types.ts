export type MaterialType = 'textile' | 'wood' | 'paint' | 'other';

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  quantity: number;
  initialQuantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  notified: boolean;
}

export type ProjectStatus = 'pending' | 'in-progress' | 'completed';

export interface ProjectMaterial {
  materialId: string;
  usedQuantity: number;
}

export interface Project {
  id: string;
  name: string;
  estimatedHours: number;
  progress: number;
  status: ProjectStatus;
  coverImage: string;
  description: string;
  materials: ProjectMaterial[];
  createdAt: string;
  completedAt: string | null;
}

export type NavTab = 'home' | 'materials' | 'projects' | 'gallery';

export interface MaterialFormState {
  isOpen: boolean;
  editingId: string | null;
  form: {
    name: string;
    type: MaterialType;
    quantity: number;
    unit: string;
    purchaseDate: string;
    expiryDate: string;
  };
}

export interface ProjectFormState {
  isOpen: boolean;
  uploading: boolean;
  uploadProgress: number;
  form: {
    name: string;
    estimatedHours: number;
    description: string;
    coverImage: string;
    selectedMaterials: Array<{ materialId: string; usedQuantity: number }>;
  };
}
