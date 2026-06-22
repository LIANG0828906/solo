export interface Photo {
  id: string;
  title: string;
  thumbnail: string;
  location: {
    lat: number;
    lng: number;
    name: string;
    city: string;
  };
  params: {
    aperture: number;
    shutter: string;
    iso: number;
  };
  uploadedAt: string;
}

export interface FilterState {
  keyword: string;
  apertureRange: [number, number];
  shutterMinIdx: number;
  shutterMaxIdx: number;
  isoRange: [number, number];
}

export interface StatsData {
  totalPhotos: number;
  coveredCities: number;
  apertureDistribution: { label: string; value: number }[];
  shutterDistribution: { label: string; value: number }[];
}

export type { Photo as PhotoType };
