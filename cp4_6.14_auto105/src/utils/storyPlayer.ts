import type { StoryNode, Connection } from '../stores/storyStore'

export interface StoryOption {
  label: string
  targetNodeId: string
}

export interface StoryState {
  currentNodeId: string
  currentNode: StoryNode | null
  options: StoryOption[]
  isEnd: boolean
  history: string[]
}

export class StoryPlayer {
  private nodes: StoryNode[]
  private connections: Connection[]
  private currentNodeId: string
  private visitHistory: string[]

  constructor(nodes: StoryNode[], connections: Connection[], startNodeId = 'start') {
    this.nodes = nodes
    this.connections = connections
    this.currentNodeId = startNodeId
    this.visitHistory = [startNodeId]
  }

  getState(): StoryState {
    const currentNode = this.nodes.find((n) => n.id === this.currentNodeId) || null
    const outgoing = this.connections.filter(
      (c) => c.fromNodeId === this.currentNodeId
    )
    const options: StoryOption[] = outgoing.map((c) => ({
      label: c.label,
      targetNodeId: c.toNodeId,
    }))

    return {
      currentNodeId: this.currentNodeId,
      currentNode,
      options,
      isEnd: options.length === 0,
      history: [...this.visitHistory],
    }
  }

  choose(optionIndex: number): StoryState | null {
    const state = this.getState()
    if (optionIndex < 0 || optionIndex >= state.options.length) {
      return null
    }
    const targetId = state.options[optionIndex].targetNodeId
    this.currentNodeId = targetId
    this.visitHistory.push(targetId)
    return this.getState()
  }

  restart(): StoryState {
    this.currentNodeId = 'start'
    this.visitHistory = ['start']
    return this.getState()
  }

  goBack(): StoryState | null {
    if (this.visitHistory.length <= 1) return null
    this.visitHistory.pop()
    this.currentNodeId = this.visitHistory[this.visitHistory.length - 1]
    return this.getState()
  }
}
