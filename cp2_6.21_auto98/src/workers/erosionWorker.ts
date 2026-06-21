import { processErosion, ErosionParams } from '../utils/erosionModel'

interface ErosionMessage {
  type: 'start' | 'step' | 'reset'
  heightMap?: Float32Array
  params?: ErosionParams
  steps?: number
}

interface ErosionResponse {
  type: 'update'
  heightMap: Float32Array
}

let currentHeightMap: Float32Array | null = null
let currentParams: ErosionParams | null = null

self.onmessage = (e: MessageEvent<ErosionMessage>) => {
  const { type, heightMap, params, steps } = e.data
  
  switch (type) {
    case 'start':
    case 'reset':
      if (heightMap && params) {
        currentHeightMap = new Float32Array(heightMap)
        currentParams = params
      }
      break
      
    case 'step':
      if (currentHeightMap && currentParams) {
        const numSteps = steps || 1
        
        for (let i = 0; i < numSteps; i++) {
          currentHeightMap = processErosion(currentHeightMap, currentParams, 1)
        }
        
        const response: ErosionResponse = {
          type: 'update',
          heightMap: new Float32Array(currentHeightMap)
        }
        
        self.postMessage(response, [response.heightMap.buffer])
      }
      break
  }
}

export {}
