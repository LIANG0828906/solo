import React, { useState, useCallback, useRef } from 'react'
import PhotoUploader from '@/modules/upload/PhotoUploader'
import MapRenderer, { MapRendererHandle } from '@/modules/map/MapRenderer'
import ControlPanel from '@/modules/control/ControlPanel'
import { Photo, FilterState } from '@/types'

const initialFilterState: FilterState = {
  startTime: null,
  endTime: null,
  startDate: '',
  endDate: '',
  keyword: ''
}

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filterState, setFilterState] = useState<FilterState>(initialFilterState)
  const mapRef = useRef<MapRendererHandle>(null)

  const handlePhotosAdded = useCallback((newPhotos: Photo[]) => {
    setPhotos((prev) => [...prev, ...newPhotos])
  }, [])

  const handleFilterChange = useCallback((partial: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }))
  }, [])

  const handleAddManualMarkerRequest = useCallback((lat: number, lng: number) => {
    mapRef.current?.addManualMarker(lat, lng, '', '')
  }, [])

  return (
    <div className="app-container">
      <PhotoUploader photos={photos} onPhotosAdded={handlePhotosAdded} />
      <MapRenderer
        ref={mapRef}
        photos={photos}
        filterState={filterState}
        onAddManualMarkerRequest={handleAddManualMarkerRequest}
      />
      <ControlPanel
        photos={photos}
        filterState={filterState}
        onFilterChange={handleFilterChange}
      />
    </div>
  )
}

export default App
