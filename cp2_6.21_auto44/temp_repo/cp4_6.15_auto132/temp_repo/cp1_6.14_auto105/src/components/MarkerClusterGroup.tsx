import { useEffect, useMemo, type ReactNode } from 'react'
import { useLeafletContext, LeafletProvider, extendContext } from '@react-leaflet/core'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

interface MarkerClusterGroupProps {
  children?: ReactNode
  options?: L.MarkerClusterGroupOptions
}

function MarkerClusterGroup({ children, options }: MarkerClusterGroupProps) {
  const parentContext = useLeafletContext()

  const clusterGroup = useMemo(() => {
    return L.markerClusterGroup(options)
  }, [options])

  const clusterContext = useMemo(() => {
    return extendContext(parentContext, {
      layerContainer: clusterGroup,
    })
  }, [parentContext, clusterGroup])

  useEffect(() => {
    const container = parentContext.layerContainer || parentContext.map
    container.addLayer(clusterGroup)

    return () => {
      container.removeLayer(clusterGroup)
    }
  }, [parentContext, clusterGroup])

  return (
    <LeafletProvider value={clusterContext}>
      {children}
    </LeafletProvider>
  )
}

export default MarkerClusterGroup
