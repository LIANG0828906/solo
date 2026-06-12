import { useMemo } from 'react'
import { useStore, PlantParams } from '../store/useStore'
import Plant from './Plant'

function PlantScene() {
  const { plants, growthTime, lightIntensity, humidity, soilType } = useStore()

  const adjustedGrowth = useMemo(() => {
    const lightFactor = 1 + ((lightIntensity - 50) / 10) * 0.15
    
    let soilFactor = 1
    switch (soilType) {
      case 'sand':
        soilFactor = 0.7
        break
      case 'clay':
        soilFactor = 0.9
        break
      case 'humus':
        soilFactor = 1.2
        break
    }
    
    return Math.min(100, growthTime * lightFactor * soilFactor)
  }, [growthTime, lightIntensity, soilType])

  return (
    <group>
      {plants.map((plant: PlantParams) => (
        <Plant
          key={plant.id}
          plant={plant}
          growthProgress={adjustedGrowth / 100}
          lightIntensity={lightIntensity}
          humidity={humidity}
          soilType={soilType}
        />
      ))}
    </group>
  )
}

export default PlantScene
