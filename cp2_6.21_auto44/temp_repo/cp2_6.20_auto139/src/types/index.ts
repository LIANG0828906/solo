export interface Point {
  id: string;
  name: string;
  type: 'supply' | 'camp';
  lat: number;
  lng: number;
  altitude: number;
  estimatedArrival: string;
  hasWater?: boolean;
  hasShelter?: boolean;
}

export interface RouteData {
  id: string;
  code: string;
  name: string;
  points: Point[];
  totalDistance: number;
  estimatedDuration: number;
  createdAt: string;
}

export type TeamMemberStatus = 'moving' | 'resting' | 'trouble';

export interface TeamMember {
  id: string;
  routeId: string;
  name: string;
  lat: number;
  lng: number;
  status: TeamMemberStatus;
  lastUpdate: string;
  nearestPointId?: string;
}

export interface TeamData {
  routeId: string;
  members: TeamMember[];
  heatmapData: [number, number, number][];
  stats: {
    totalMembers: number;
    arrivedSupply: number;
    averageProgress: number;
  };
}

export interface UpdatePositionRequest {
  memberId: string;
  routeId: string;
  name: string;
  lat: number;
  lng: number;
  status: TeamMemberStatus;
}
