import { Photo } from '@/types'

interface GeoJsonFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: number[] | number[][]
  }
  properties: Record<string, unknown>
}

interface GeoJsonCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export function exportToGeoJSON(photos: Photo[]): void {
  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
  )

  const features: GeoJsonFeature[] = []

  sortedPhotos.forEach((photo) => {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [photo.longitude, photo.latitude]
      },
      properties: {
        id: photo.id,
        fileName: photo.fileName,
        dominantColor: photo.dominantColor,
        takenAt: new Date(photo.takenAt).toISOString(),
        cameraModel: photo.cameraModel,
        isManual: photo.isManual,
        name: photo.name || null,
        description: photo.description || null,
        thumbnailUrl: photo.thumbnailUrl
      }
    })
  })

  if (sortedPhotos.length >= 2) {
    const routeCoords: number[][] = sortedPhotos.map((p) => [p.longitude, p.latitude])
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routeCoords
      },
      properties: {
        type: 'travel_route',
        photoCount: sortedPhotos.length
      }
    })
  }

  const geoJson: GeoJsonCollection = {
    type: 'FeatureCollection',
    features
  }

  const jsonStr = JSON.stringify(geoJson, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/geo+json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `travel-route-${Date.now()}.geojson`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
