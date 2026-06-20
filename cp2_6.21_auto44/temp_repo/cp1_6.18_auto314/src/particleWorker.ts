import { updateParticles, generateInitialParticles, type Building } from './particleSystem'

interface WorkerMessage {
  type: 'init' | 'update'
  positions?: Float32Array
  season?: string
  time?: number
  intensity?: number
  deltaTime?: number
  buildings?: Building[]
}

interface WorkerResponse {
  type: 'initResult' | 'updateResult'
  positions?: Float32Array
  colors?: Float32Array
  sizes?: Float32Array
  averageSpeed?: number
  activeRatio?: number
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data

  if (type === 'init') {
    const { positions, colors, sizes } = generateInitialParticles()

    const response: WorkerResponse = {
      type: 'initResult',
      positions,
      colors,
      sizes,
    }

    const transferList: ArrayBuffer[] = []
    if (positions?.buffer) transferList.push(positions.buffer)
    if (colors?.buffer) transferList.push(colors.buffer)
    if (sizes?.buffer) transferList.push(sizes.buffer)

    self.postMessage(response, transferList)
    return
  }

  if (type === 'update') {
    const { positions, season, time, intensity, deltaTime, buildings } = event.data

    const currentPosition = positions?.buffer.byteLength
      ? positions
      : undefined

    const result = updateParticles({
      positions: currentPosition,
      season,
      time,
      intensity,
      deltaTime,
      buildings,
    })

    const response: WorkerResponse = {
      type: 'updateResult',
      positions: result.positions,
      colors: result.colors,
      sizes: result.sizes,
      averageSpeed: result.averageSpeed,
      activeRatio: result.activeRatio,
    }

    const transferList: ArrayBuffer[] = []
    if (result.positions?.buffer) transferList.push(result.positions.buffer)
    if (result.colors?.buffer) transferList.push(result.colors.buffer)
    if (result.sizes?.buffer) transferList.push(result.sizes.buffer)

    self.postMessage(response, transferList)
  }
}
