export interface PipeNode {
  id: string
  position: [number, number, number]
  pressure: number
}

export interface PipeSegment {
  id: string
  type: 'main' | 'branch'
  start: [number, number, number]
  end: [number, number, number]
  diameter: number
  color: string
  controlType: 'valve' | 'pump' | 'none'
  controlId: string | null
  nodeStart: string
  nodeEnd: string
  baseVelocity: number
}

export interface ControlPoint {
  id: string
  type: 'valve' | 'pump'
  position: [number, number, number]
  pipeId: string
  name: string
}

const GRID_SIZE = 200
const HALF_GRID = GRID_SIZE / 2
const DEPTH = -1
const MAIN_LINES = 5

function generateGridNodes(): PipeNode[] {
  const nodes: PipeNode[] = []
  const spacing = GRID_SIZE / (MAIN_LINES - 1)
  
  for (let i = 0; i < MAIN_LINES; i++) {
    for (let j = 0; j < MAIN_LINES; j++) {
      const x = -HALF_GRID + i * spacing
      const z = -HALF_GRID + j * spacing
      nodes.push({
        id: `node-${i}-${j}`,
        position: [x, DEPTH, z],
        pressure: 3.0 + Math.random() * 2.0
      })
    }
  }
  return nodes
}

function generateMainPipes(nodes: PipeNode[]): { pipes: PipeSegment[]; controls: ControlPoint[] } {
  const pipes: PipeSegment[] = []
  const controls: ControlPoint[] = []
  let valveCount = 0
  let pumpCount = 0

  for (let i = 0; i < MAIN_LINES; i++) {
    for (let j = 0; j < MAIN_LINES - 1; j++) {
      const startNode = nodes[i * MAIN_LINES + j]
      const endNode = nodes[i * MAIN_LINES + j + 1]
      const pipeId = `pipe-main-x-${i}-${j}`
      
      let controlType: 'valve' | 'pump' | 'none' = 'none'
      let controlId: string | null = null
      
      if (valveCount < 3 && (i + j) % 2 === 0 && j === 1) {
        controlType = 'valve'
        controlId = `valve-${valveCount}`
        controls.push({
          id: controlId,
          type: 'valve',
          position: [
            (startNode.position[0] + endNode.position[0]) / 2,
            DEPTH,
            (startNode.position[2] + endNode.position[2]) / 2
          ],
          pipeId,
          name: `阀门 ${valveCount + 1}`
        })
        valveCount++
      } else if (pumpCount < 2 && (i + j) % 3 === 0 && j === 2) {
        controlType = 'pump'
        controlId = `pump-${pumpCount}`
        controls.push({
          id: controlId,
          type: 'pump',
          position: [
            (startNode.position[0] + endNode.position[0]) / 2,
            DEPTH,
            (startNode.position[2] + endNode.position[2]) / 2
          ],
          pipeId,
          name: `泵站 ${pumpCount + 1}`
        })
        pumpCount++
      }

      pipes.push({
        id: pipeId,
        type: 'main',
        start: startNode.position,
        end: endNode.position,
        diameter: 0.4,
        color: '#4A90D9',
        controlType,
        controlId,
        nodeStart: startNode.id,
        nodeEnd: endNode.id,
        baseVelocity: 2.0 + Math.random() * 1.0
      })
    }
  }

  for (let j = 0; j < MAIN_LINES; j++) {
    for (let i = 0; i < MAIN_LINES - 1; i++) {
      const startNode = nodes[i * MAIN_LINES + j]
      const endNode = nodes[(i + 1) * MAIN_LINES + j]
      const pipeId = `pipe-main-z-${i}-${j}`
      
      let controlType: 'valve' | 'pump' | 'none' = 'none'
      let controlId: string | null = null
      
      if (valveCount < 6 && (i + j) % 2 === 1 && i === 1) {
        controlType = 'valve'
        controlId = `valve-${valveCount}`
        controls.push({
          id: controlId,
          type: 'valve',
          position: [
            (startNode.position[0] + endNode.position[0]) / 2,
            DEPTH,
            (startNode.position[2] + endNode.position[2]) / 2
          ],
          pipeId,
          name: `阀门 ${valveCount + 1}`
        })
        valveCount++
      } else if (pumpCount < 4 && (i + j) % 3 === 1 && i === 2) {
        controlType = 'pump'
        controlId = `pump-${pumpCount}`
        controls.push({
          id: controlId,
          type: 'pump',
          position: [
            (startNode.position[0] + endNode.position[0]) / 2,
            DEPTH,
            (startNode.position[2] + endNode.position[2]) / 2
          ],
          pipeId,
          name: `泵站 ${pumpCount + 1}`
        })
        pumpCount++
      }

      pipes.push({
        id: pipeId,
        type: 'main',
        start: startNode.position,
        end: endNode.position,
        diameter: 0.4,
        color: '#4A90D9',
        controlType,
        controlId,
        nodeStart: startNode.id,
        nodeEnd: endNode.id,
        baseVelocity: 2.0 + Math.random() * 1.0
      })
    }
  }

  return { pipes, controls }
}

function generateBranchPipes(nodes: PipeNode[]): { pipes: PipeSegment[]; controls: ControlPoint[] } {
  const pipes: PipeSegment[] = []
  const controls: ControlPoint[] = []
  const branchLength = 25

  const cornerIndices = [0, MAIN_LINES - 1, MAIN_LINES * (MAIN_LINES - 1), MAIN_LINES * MAIN_LINES - 1]
  const edgeIndices: number[] = []
  
  for (let i = 1; i < MAIN_LINES - 1; i++) {
    edgeIndices.push(i)
    edgeIndices.push(MAIN_LINES * (MAIN_LINES - 1) + i)
    edgeIndices.push(i * MAIN_LINES)
    edgeIndices.push(i * MAIN_LINES + MAIN_LINES - 1)
  }

  const selectedIndices = [...cornerIndices, ...edgeIndices.slice(0, 6)]

  selectedIndices.forEach((nodeIdx, idx) => {
    const node = nodes[nodeIdx]
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ]
    const dir = directions[idx % 4]

    const endX = node.position[0] + dir[0] * branchLength
    const endZ = node.position[2] + dir[1] * branchLength

    if (Math.abs(endX) > HALF_GRID || Math.abs(endZ) > HALF_GRID) return

    const branchNodeId = `branch-node-${idx}`
    const pipeId = `pipe-branch-${idx}`

    pipes.push({
      id: pipeId,
      type: 'branch',
      start: node.position,
      end: [endX, DEPTH, endZ],
      diameter: 0.2,
      color: '#50E3C2',
      controlType: 'none',
      controlId: null,
      nodeStart: node.id,
      nodeEnd: branchNodeId,
      baseVelocity: 1.0 + Math.random() * 0.5
    })
  })

  return { pipes, controls }
}

function buildNetwork() {
  const nodes = generateGridNodes()
  const { pipes: mainPipes, controls: mainControls } = generateMainPipes(nodes)
  const { pipes: branchPipes, controls: branchControls } = generateBranchPipes(nodes)

  const allPipes = [...mainPipes, ...branchPipes]
  const allControls = [...mainControls, ...branchControls]

  const branchNodes: PipeNode[] = branchPipes.map((pipe, idx) => ({
    id: pipe.nodeEnd,
    position: pipe.end,
    pressure: 2.0 + Math.random() * 1.0
  }))

  const allNodes = [...nodes, ...branchNodes]

  return { pipes: allPipes, nodes: allNodes, controls: allControls }
}

export const { pipes: pipeNetwork, nodes: pipeNodes, controls: controlPoints } = buildNetwork()
