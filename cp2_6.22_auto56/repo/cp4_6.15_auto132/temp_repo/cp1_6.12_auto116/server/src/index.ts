import express, { type Request, type Response } from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer, type Socket } from 'socket.io'
import vm from 'vm'
import * as esprima from 'esprima'

interface ExecutionSnapshot {
  line: number
  variables: Record<string, unknown>
  arrays: Record<string, unknown[]>
  callStack: string[]
  compare?: { i: number; j: number }
  swap?: { i: number; j: number }
  output?: string
}

interface ExecutionState {
  isRunning: boolean
  isPaused: boolean
  currentLine: number
  snapshots: ExecutionSnapshot[]
  code: string
  context: vm.Context
  iterationCount: Map<string, number>
  maxIterations: number
  stepMode: boolean
  stepResolve: (() => void) | null
}

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

let executionState: ExecutionState | null = null
const MAX_ITERATIONS = 1000

function createInitialState(code: string): ExecutionState {
  return {
    isRunning: false,
    isPaused: false,
    currentLine: 0,
    snapshots: [],
    code,
    context: vm.createContext({}),
    iterationCount: new Map(),
    maxIterations: MAX_ITERATIONS,
    stepMode: false,
    stepResolve: null
  }
}

function parseCodeAndInjectHooks(code: string): string {
  const lines = code.split('\n')
  const instrumentedLines: string[] = []
  const loopStarts: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    if (/^\s*(for|while|do)\s*\(/.test(line)) {
      loopStarts.push(lineNum)
    }

    if (/^\s*\}/.test(line) && loopStarts.length > 0) {
      const loopId = `loop_${loopStarts.pop()}`
      instrumentedLines.push(`  __checkIteration("${loopId}");`)
    }

    instrumentedLines.push(`  __lineHook(${lineNum});`)
    instrumentedLines.push(line)
  }

  return instrumentedLines.join('\n')
}

function collectVariables(context: vm.Context): { variables: Record<string, unknown>; arrays: Record<string, unknown[]> } {
  const variables: Record<string, unknown> = {}
  const arrays: Record<string, unknown[]> = {}

  for (const key of Object.keys(context)) {
    if (key.startsWith('__')) continue
    const value = context[key]
    if (Array.isArray(value)) {
      arrays[key] = [...value]
    } else if (typeof value !== 'function') {
      variables[key] = value
    }
  }

  return { variables, arrays }
}

function getCallStack(): string[] {
  const stack = new Error().stack
  if (!stack) return []

  return stack
    .split('\n')
    .slice(1)
    .filter(line => !line.includes('__lineHook') && !line.includes('__checkIteration') && !line.includes('vm.js'))
    .map(line => line.trim())
    .slice(0, 10)
}

function detectSpecialCalls(line: string): { compare?: { i: number; j: number }; swap?: { i: number; j: number } } {
  const result: { compare?: { i: number; j: number }; swap?: { i: number; j: number } } = {}

  const compareMatch = line.match(/__compare\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (compareMatch) {
    result.compare = { i: parseInt(compareMatch[1]), j: parseInt(compareMatch[2]) }
  }

  const swapMatch = line.match(/__swap\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (swapMatch) {
    result.swap = { i: parseInt(swapMatch[1]), j: parseInt(swapMatch[2]) }
  }

  return result
}

function createExecutionHooks(state: ExecutionState, socket: Socket): Record<string, unknown> {
  const outputBuffer: string[] = []

  const hooks: Record<string, unknown> = {
    __lineHook: (lineNum: number) => {
      state.currentLine = lineNum

      const { variables, arrays } = collectVariables(state.context)
      const callStack = getCallStack()
      const originalLine = state.code.split('\n')[lineNum - 1] || ''
      const specialCalls = detectSpecialCalls(originalLine)

      const snapshot: ExecutionSnapshot = {
        line: lineNum,
        variables,
        arrays,
        callStack,
        ...specialCalls,
        output: outputBuffer.length > 0 ? outputBuffer.join('\n') : undefined
      }

      outputBuffer.length = 0
      state.snapshots.push(snapshot)

      socket.emit('snapshot', snapshot)

      if (state.stepMode) {
        return new Promise<void>((resolve) => {
          state.stepResolve = resolve
        })
      }
    },

    __checkIteration: (loopId: string) => {
      const count = (state.iterationCount.get(loopId) || 0) + 1
      state.iterationCount.set(loopId, count)

      if (count > state.maxIterations) {
        throw new Error(`Loop exceeded maximum iterations (${state.maxIterations}) at ${loopId}`)
      }
    },

    __compare: (i: number, j: number): number => {
      const arr = state.context.arr as unknown[]
      if (!arr) return 0

      const a = arr[i] as number
      const b = arr[j] as number

      if (a < b) return -1
      if (a > b) return 1
      return 0
    },

    __swap: (i: number, j: number): void => {
      const arr = state.context.arr as unknown[]
      if (!arr) return

      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    },

    console: {
      log: (...args: unknown[]) => {
        outputBuffer.push(args.map(arg => String(arg)).join(' '))
      }
    }
  }

  return hooks
}

async function executeCode(code: string, socket: Socket, stepMode = false): Promise<void> {
  executionState = createInitialState(code)
  executionState.stepMode = stepMode

  try {
    const ast = esprima.parseScript(code, { tolerant: true })
    console.log('Parsed AST with', ast.body.length, 'statements')
  } catch (e) {
    console.log('AST parsing error, using regex instrumentation:', (e as Error).message)
  }

  const instrumentedCode = parseCodeAndInjectHooks(code)
  const hooks = createExecutionHooks(executionState, socket)

  executionState.context = vm.createContext({
    ...hooks,
    arr: []
  })

  executionState.isRunning = true
  socket.emit('execute', { started: true, stepMode })

  try {
    await vm.runInContext(instrumentedCode, executionState.context, {
      timeout: 30000
    })

    executionState.isRunning = false
    socket.emit('complete', {
      success: true,
      totalSnapshots: executionState.snapshots.length,
      snapshots: executionState.snapshots
    })
  } catch (error) {
    executionState.isRunning = false
    socket.emit('error', {
      message: (error as Error).message,
      line: executionState.currentLine,
      stack: (error as Error).stack
    })
  } finally {
    executionState.isRunning = false
  }
}

function stopExecution(socket: Socket): void {
  if (executionState) {
    executionState.isRunning = false
    executionState.isPaused = false
    if (executionState.stepResolve) {
      executionState.stepResolve()
      executionState.stepResolve = null
    }
    socket.emit('complete', {
      success: false,
      stopped: true,
      totalSnapshots: executionState.snapshots.length,
      snapshots: executionState.snapshots
    })
    executionState = null
  }
}

function stepExecution(socket: Socket): void {
  if (executionState && executionState.stepMode && executionState.stepResolve) {
    executionState.stepResolve()
    executionState.stepResolve = null
    socket.emit('step', { next: true })
  }
}

function resetExecution(socket: Socket): void {
  if (executionState) {
    executionState.isRunning = false
    executionState.isPaused = false
    executionState.currentLine = 0
    executionState.snapshots = []
    executionState.iterationCount.clear()
    if (executionState.stepResolve) {
      executionState.stepResolve()
      executionState.stepResolve = null
    }
    socket.emit('reset', { reset: true })
    executionState = null
  }
}

app.post('/api/execute', async (req: Request, res: Response) => {
  try {
    const { code, stepMode = false } = req.body as { code: string; stepMode?: boolean }

    if (!code) {
      res.status(400).json({ success: false, error: 'Code is required' })
      return
    }

    res.json({ success: true, message: 'Execution started' })

    const fakeSocket = {
      emit: (event: string, data: unknown) => {
        console.log(`[${event}]`, JSON.stringify(data).substring(0, 200))
      }
    } as unknown as Socket

    await executeCode(code, fakeSocket, stepMode)
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

app.post('/api/stop', (req: Request, res: Response) => {
  try {
    const fakeSocket = { emit: () => {} } as unknown as Socket
    stopExecution(fakeSocket)
    res.json({ success: true, message: 'Execution stopped' })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

app.post('/api/step', (req: Request, res: Response) => {
  try {
    const fakeSocket = { emit: () => {} } as unknown as Socket
    stepExecution(fakeSocket)
    res.json({ success: true, message: 'Step executed' })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id)

  socket.on('execute', async (data: { code: string; stepMode?: boolean }) => {
    const { code, stepMode = false } = data
    await executeCode(code, socket, stepMode)
  })

  socket.on('step', () => {
    stepExecution(socket)
  })

  socket.on('stop', () => {
    stopExecution(socket)
  })

  socket.on('reset', () => {
    resetExecution(socket)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    if (executionState) {
      stopExecution(socket)
    }
  })
})

const PORT = 3000

server.listen(PORT, () => {
  console.log(`Code execution server running on port ${PORT}`)
  console.log(`WebSocket server ready for connections`)
})

export default app
