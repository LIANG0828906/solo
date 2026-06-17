import { v4 as uuidv4 } from 'uuid';
import { useBoardStore } from '@/store/boardStore';
import { calculateNodeHeight, getResponsiveNodeWidth } from '@/shared/utils';
import type {
  IdeaNode,
  Connection,
  CreateNodeInput,
  UpdateNodeInput,
  VoteInput,
} from '@/shared/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateMockData = (): { nodes: IdeaNode[]; connections: Connection[] } => {
  const nodeWidth = getResponsiveNodeWidth();
  const nodes: IdeaNode[] = [];
  const connections: Connection[] = [];

  const mockNodes = [
    {
      title: '产品核心目标',
      content: '提升用户活跃度30%，优化核心流程体验',
      x: 400,
      y: 100,
    },
    {
      title: '用户调研',
      content: '访谈20位核心用户，收集痛点和需求',
      x: 100,
      y: 300,
    },
    {
      title: '竞品分析',
      content: '分析Top3竞品的优劣势，寻找差异化机会',
      x: 400,
      y: 300,
    },
    {
      title: '技术方案',
      content: '微服务架构改造，支持高并发场景',
      x: 700,
      y: 300,
    },
    {
      title: '设计优化',
      content: '简化注册流程，减少50%填写步骤',
      x: 100,
      y: 500,
    },
    {
      title: '营销策略',
      content: '社交媒体推广+KOL合作，扩大品牌影响力',
      x: 700,
      y: 500,
    },
  ];

  mockNodes.forEach((item, index) => {
    const height = calculateNodeHeight(item.content, nodeWidth);
    nodes.push({
      id: uuidv4(),
      title: item.title,
      content: item.content,
      x: item.x,
      y: item.y,
      width: nodeWidth,
      height,
      votes: {
        up: Math.floor(Math.random() * 20),
        down: Math.floor(Math.random() * 5),
      },
      createdAt: Date.now() - index * 1000,
    });
  });

  if (nodes.length >= 3) {
    connections.push({
      id: uuidv4(),
      fromNodeId: nodes[0].id,
      toNodeId: nodes[1].id,
      createdAt: Date.now(),
    });
    connections.push({
      id: uuidv4(),
      fromNodeId: nodes[0].id,
      toNodeId: nodes[2].id,
      createdAt: Date.now(),
    });
    connections.push({
      id: uuidv4(),
      fromNodeId: nodes[0].id,
      toNodeId: nodes[3].id,
      createdAt: Date.now(),
    });
    connections.push({
      id: uuidv4(),
      fromNodeId: nodes[1].id,
      toNodeId: nodes[4].id,
      createdAt: Date.now(),
    });
    connections.push({
      id: uuidv4(),
      fromNodeId: nodes[3].id,
      toNodeId: nodes[5].id,
      createdAt: Date.now(),
    });
  }

  return { nodes, connections };
};

export const ideaService = {
  async initializeData(): Promise<void> {
    await delay(100);
    const { nodes, connections } = generateMockData();
    useBoardStore.getState().setNodes(nodes);
    useBoardStore.getState().setConnections(connections);
  },

  async getNodes(): Promise<IdeaNode[]> {
    await delay(50);
    return useBoardStore.getState().nodes;
  },

  async createNode(input: CreateNodeInput): Promise<IdeaNode> {
    await delay(100);
    const nodeWidth = getResponsiveNodeWidth();
    const height = calculateNodeHeight(input.content, nodeWidth);
    const node: IdeaNode = {
      id: uuidv4(),
      title: input.title,
      content: input.content,
      x: input.x,
      y: input.y,
      width: nodeWidth,
      height,
      votes: { up: 0, down: 0 },
      createdAt: Date.now(),
    };
    useBoardStore.getState().addNode(node);
    return node;
  },

  async updateNode(input: UpdateNodeInput): Promise<IdeaNode> {
    await delay(50);
    const state = useBoardStore.getState();
    const node = state.nodes.find((n) => n.id === input.id);
    if (!node) {
      throw new Error('Node not found');
    }
    const updates: Partial<IdeaNode> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.content !== undefined) {
      updates.content = input.content;
      updates.height = calculateNodeHeight(input.content, node.width);
    }
    if (input.x !== undefined) updates.x = input.x;
    if (input.y !== undefined) updates.y = input.y;
    if (input.width !== undefined) updates.width = input.width;
    if (input.height !== undefined) updates.height = input.height;

    state.updateNode(input.id, updates);
    return { ...node, ...updates };
  },

  async deleteNode(id: string): Promise<void> {
    await delay(100);
    useBoardStore.getState().removeNode(id);
  },

  async getConnections(): Promise<Connection[]> {
    await delay(50);
    return useBoardStore.getState().connections;
  },

  async createConnection(
    fromNodeId: string,
    toNodeId: string
  ): Promise<Connection> {
    await delay(100);
    const state = useBoardStore.getState();
    const exists = state.connections.some(
      (c) =>
        (c.fromNodeId === fromNodeId && c.toNodeId === toNodeId) ||
        (c.fromNodeId === toNodeId && c.toNodeId === fromNodeId)
    );
    if (exists) {
      throw new Error('Connection already exists');
    }
    const connection: Connection = {
      id: uuidv4(),
      fromNodeId,
      toNodeId,
      createdAt: Date.now(),
    };
    state.addConnection(connection);
    return connection;
  },

  async deleteConnection(id: string): Promise<void> {
    await delay(50);
    useBoardStore.getState().removeConnection(id);
  },

  async vote(input: VoteInput): Promise<IdeaNode> {
    await delay(50);
    const state = useBoardStore.getState();
    const node = state.nodes.find((n) => n.id === input.nodeId);
    if (!node) {
      throw new Error('Node not found');
    }
    const newVotes = { ...node.votes };
    if (input.type === 'up') {
      newVotes.up += 1;
    } else {
      newVotes.down += 1;
    }
    state.updateNode(input.nodeId, { votes: newVotes });
    return { ...node, votes: newVotes };
  },
};
