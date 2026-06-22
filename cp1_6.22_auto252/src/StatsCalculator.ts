import type { Photo, StatsData } from './types';

export class StatsCalculator {
  private photos: Photo[] = [];

  constructor(photos: Photo[] = []) {
    this.photos = photos;
  }

  setPhotos(photos: Photo[]) {
    this.photos = photos;
  }

  compute(): StatsData {
    const totalPhotos = this.photos.length;
    const citySet = new Set<string>();
    this.photos.forEach((p) => citySet.add(p.location.city));
    const coveredCities = citySet.size;

    const apertureBucket = new Map<string, number>();
    const shutterBucket = new Map<string, number>();

    this.photos.forEach((p) => {
      const apLabel = `f/${p.params.aperture}`;
      apertureBucket.set(apLabel, (apertureBucket.get(apLabel) ?? 0) + 1);
      shutterBucket.set(p.params.shutter, (shutterBucket.get(p.params.shutter) ?? 0) + 1);
    });

    const apertureLabels = ['f/1.4', 'f/2', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16'];
    const shutterLabels = ['1/30', '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000'];

    const apertureDistribution = apertureLabels.map((label) => ({
      label,
      value: apertureBucket.get(label) ?? 0,
    }));

    const shutterDistribution = shutterLabels.map((label) => ({
      label,
      value: shutterBucket.get(label) ?? 0,
    }));

    return {
      totalPhotos,
      coveredCities,
      apertureDistribution,
      shutterDistribution,
    };
  }
}

export function shutterToIndex(shutter: string, list: string[]): number {
  const idx = list.indexOf(shutter);
  return idx < 0 ? 0 : idx;
}
