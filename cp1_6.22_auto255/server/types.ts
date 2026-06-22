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

export interface Artwork {
  id: string;
  name: string;
  code: string;
  thumbnail: string;
  description?: string;
}

export interface ExhibitionArtwork extends Artwork {
  borrower: string;
  transportMode: TransportMode;
  insuranceAmount: number;
  transportStatus: TransportStatus;
  transportTimeline: TransportTimelineNode[];
}

export interface TransportTimelineNode {
  status: TransportStatus;
  timestamp: number;
  description: string;
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

export interface TransportUpdate {
  exhibitionId: string;
  artworkId: string;
  newStatus: TransportStatus;
  artworkName: string;
  timeline: TransportTimelineNode[];
  timestamp: number;
}
