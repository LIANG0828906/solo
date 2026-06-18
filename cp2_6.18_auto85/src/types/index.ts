export type VenueTemplate = 'white_gallery' | 'industrial_warehouse' | 'outdoor_park';

export interface WorkMaterial {
  id: string;
  exhibitionId: string;
  title: string;
  author: string;
  size: string;
  medium: string;
  price: number;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
}

export interface WallPlacement {
  id: string;
  exhibitionId: string;
  workId: string;
  wallIndex: number;
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
}

export interface Exhibition {
  id: string;
  name: string;
  description: string;
  venueTemplate: VenueTemplate;
  wallLayout: number;
  isPublished: boolean;
  visitCount: number;
  createdAt: number;
}

export interface VenueWall {
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
}

export interface VenueConfig {
  name: string;
  thumbnail: string;
  bgColor: string;
  wallColor: string;
  floorColor: string;
  ambientIntensity: number;
  directionalIntensity: number;
  layouts: VenueWall[][];
}

export interface ExhibitionStoreState {
  exhibitions: Exhibition[];
  currentExhibitionId: string | null;
  workMaterials: WorkMaterial[];
  wallPlacements: WallPlacement[];
  selectedWorkId: string | null;
  isTourMode: boolean;
  tourSpeed: 0.5 | 1 | 1.5;
  tourPaused: boolean;
  currentTourWorkId: string | null;
  draggingWorkId: string | null;
}

export interface ExhibitionStoreActions {
  createExhibition: (data: Partial<Exhibition>) => Exhibition;
  setCurrentExhibition: (id: string | null) => void;
  addWorkMaterial: (work: Omit<WorkMaterial, 'id' | 'exhibitionId'>) => WorkMaterial;
  removeWorkMaterial: (workId: string) => void;
  addWorkToWall: (workId: string, wallIndex: number, posX: number, posY: number) => void;
  removeWorkFromWall: (workId: string) => void;
  updateWorkPlacement: (workId: string, updates: Partial<WallPlacement>) => void;
  setSelectedWork: (workId: string | null) => void;
  toggleTour: () => void;
  setTourSpeed: (speed: 0.5 | 1 | 1.5) => void;
  toggleTourPause: () => void;
  setCurrentTourWork: (workId: string | null) => void;
  setDraggingWork: (workId: string | null) => void;
  publishExhibition: (id: string) => void;
  unpublishExhibition: (id: string) => void;
  incrementVisitCount: (id: string) => void;
  getShareLink: (id: string) => string;
  getExhibitionById: (id: string) => Exhibition | undefined;
  getWorksByExhibition: (exhibitionId: string) => WorkMaterial[];
  getPlacementsByExhibition: (exhibitionId: string) => WallPlacement[];
  getWorkById: (workId: string) => WorkMaterial | undefined;
  getPlacementByWorkId: (workId: string) => WallPlacement | undefined;
}

export type UseExhibitionStore = ExhibitionStoreState & ExhibitionStoreActions;
