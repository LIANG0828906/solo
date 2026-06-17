export interface Checkin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl: string;
  createdAt: string;
}

export interface Travelog {
  id: string;
  title: string;
  content: string;
  checkinIds: string[];
  checkins: Checkin[];
  coverImage: string;
  images: string[];
  createdAt: string;
}

export interface MapPosition {
  lat: number;
  lng: number;
  zoom: number;
}
