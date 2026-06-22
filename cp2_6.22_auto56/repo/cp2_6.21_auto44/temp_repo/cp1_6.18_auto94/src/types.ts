export type ZoneType = 'vegetable' | 'flower' | 'fruit';

export type PlantStatus = 'healthy' | 'thirsty' | 'pest';

export type TaskStatus = 'pending' | 'completed';

export interface Plant {
  id: string;
  name: string;
}

export interface GardenZone {
  id: string;
  name: string;
  type: ZoneType;
  status: PlantStatus;
  plants: Plant[];
  createdAt: number;
}

export interface Task {
  id: string;
  zoneId: string;
  name: string;
  deadline: number;
  assignee: string;
  status: TaskStatus;
  priority: number;
  createdAt: number;
}

export interface WateringLog {
  id: string;
  zoneId: string;
  timestamp: number;
}

export interface GardenState {
  zones: GardenZone[];
  wateringLogs: WateringLog[];
}

export interface TaskState {
  tasks: Task[];
}
