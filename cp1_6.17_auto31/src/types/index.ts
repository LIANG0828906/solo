export interface Checkin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdAt: string;
  photoUrl?: string;
}

export interface Travelog {
  id: string;
  title: string;
  content: string;
  checkinIds: string[];
  coverPhotoUrl?: string;
  photos: string[];
  createdAt: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}
