export enum TransportStatus {
  PENDING = 'pending',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived'
}

export enum ExhibitionStatus {
  PREPARING = 'preparing',
  ONGOING = 'ongoing',
  ENDED = 'ended'
}

export enum TransportMode {
  LAND = 'land',
  AIR = 'air',
  SEA = 'sea'
}

export const TransportModeLabels: Record<TransportMode, string> = {
  [TransportMode.LAND]: '陆运',
  [TransportMode.AIR]: '空运',
  [TransportMode.SEA]: '海运'
};

export const TransportStatusLabels: Record<TransportStatus, string> = {
  [TransportStatus.PENDING]: '待出库',
  [TransportStatus.OUT_FOR_DELIVERY]: '已出库',
  [TransportStatus.IN_TRANSIT]: '运输中',
  [TransportStatus.ARRIVED]: '已抵达'
};

export const ExhibitionStatusLabels: Record<ExhibitionStatus, string> = {
  [ExhibitionStatus.PREPARING]: '筹备中',
  [ExhibitionStatus.ONGOING]: '进行中',
  [ExhibitionStatus.ENDED]: '已结束'
};

export interface Artwork {
  id: string;
  name: string;
  code: string;
  thumbnail: string;
  description?: string;
}

export interface TransportTimelineNode {
  status: TransportStatus;
  timestamp: number;
  description: string;
}

export interface ExhibitionArtwork extends Artwork {
  borrower: string;
  transportMode: TransportMode;
  insuranceAmount: number;
  transportStatus: TransportStatus;
  transportTimeline: TransportTimelineNode[];
}

export interface Exhibition {
  id: string;
  name: string;
  description: string;
  status: ExhibitionStatus;
  startDate: string;
  endDate: string;
  artworks: ExhibitionArtwork[];
  createdAt: number;
}

export interface ExhibitionSummary {
  id: string;
  name: string;
  description: string;
  status: ExhibitionStatus;
  startDate: string;
  endDate: string;
  artworkCount: number;
  createdAt: number;
}

export interface TransportUpdate {
  exhibitionId: string;
  artworkId: string;
  newStatus: TransportStatus;
  artworkName: string;
  timeline: TransportTimelineNode[];
  timestamp: number;
}
