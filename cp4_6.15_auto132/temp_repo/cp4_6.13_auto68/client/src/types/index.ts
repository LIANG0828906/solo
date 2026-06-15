export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
  venue?: string;
  date?: string;
  time?: string;
  posterUrl?: string;
  attendance?: Record<string, 'attend' | 'decline' | 'pending'>;
  setlistId?: string;
  encoreSetlistId?: string;
}

export interface Tour {
  id: string;
  name: string;
  routeColor: string;
  cities: City[];
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  role: '主唱' | '吉他' | '贝斯' | '鼓' | '键盘' | '其他';
  status: '活跃' | '休息中';
  email: string;
}

export interface Song {
  id: string;
  name: string;
  duration: number;
  key: string;
  notes: string;
  order: number;
}

export interface Setlist {
  id: string;
  name: string;
  type: 'main' | 'encore';
  songs: Song[];
}

export type AttendanceStatus = 'attend' | 'decline' | 'pending';
