import type { RawGraphData, ParseResult, RawNode, RawEdge } from '../../types';

export function validateGraphData(data: unknown): ParseResult {
  if (data === null || typeof data !== 'object') {
    return { success: false, error: '数据必须是对象格式' };
  }

  const obj = data as Record<string, unknown>;

  if (!('nodes' in obj) || !Array.isArray(obj.nodes)) {
    return { success: false, error: '缺少 nodes 数组字段' };
  }

  if (!('edges' in obj) || !Array.isArray(obj.edges)) {
    return { success: false, error: '缺少 edges 数组字段' };
  }

  const nodes = obj.nodes as unknown[];
  const edges = obj.edges as unknown[];

  if (nodes.length === 0) {
    return { success: false, error: 'nodes 数组不能为空' };
  }

  const nodeIds = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as Record<string, unknown>;
    if (!node || typeof node !== 'object') {
      return { success: false, error: `nodes[${i}] 不是有效对象` };
    }
    if (!('id' in node) || typeof node.id !== 'string' || node.id.trim() === '') {
      return { success: false, error: `nodes[${i}] 缺少有效的 id 字段` };
    }
    if (nodeIds.has(node.id)) {
      return { success: false, error: `存在重复的节点 id: ${node.id}` };
    }
    nodeIds.add(node.id);
  }

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i] as Record<string, unknown>;
    if (!edge || typeof edge !== 'object') {
      return { success: false, error: `edges[${i}] 不是有效对象` };
    }
    if (!('source' in edge) || typeof edge.source !== 'string') {
      return { success: false, error: `edges[${i}] 缺少有效的 source 字段` };
    }
    if (!('target' in edge) || typeof edge.target !== 'string') {
      return { success: false, error: `edges[${i}] 缺少有效的 target 字段` };
    }
    if (!nodeIds.has(edge.source)) {
      return { success: false, error: `edges[${i}] 的 source "${edge.source}" 不存在于节点列表中` };
    }
    if (!nodeIds.has(edge.target)) {
      return { success: false, error: `edges[${i}] 的 target "${edge.target}" 不存在于节点列表中` };
    }
  }

  return {
    success: true,
    data: {
      nodes: nodes as RawNode[],
      edges: edges as RawEdge[],
    },
  };
}

export async function parseJsonFile(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    return validateGraphData(json);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return { success: false, error: `JSON 解析错误: ${e.message}` };
    }
    return { success: false, error: `文件读取失败: ${(e as Error).message}` };
  }
}

export function createEmptyRawData(): RawGraphData {
  return { nodes: [], edges: [] };
}
