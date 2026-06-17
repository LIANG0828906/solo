import type { StoryNode } from '@/types';

export async function fetchStoryNode(nodeId: string): Promise<StoryNode> {
  const response = await fetch(`/api/story/${nodeId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch story node: ${nodeId}`);
  }
  return response.json();
}

export async function getInitialNode(): Promise<StoryNode> {
  return fetchStoryNode('node_1_1');
}
