import { useEffect, useRef, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  Simulation,
  SimulationNodeDatum,
} from 'd3-force';
import { GraphNode, GraphLink } from '@/context/GraphContext';

interface SimulationNode extends GraphNode, SimulationNodeDatum {}

interface SimulationLink {
  source: SimulationNode | string;
  target: SimulationNode | string;
}

interface DragEvent {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

const PHYSICAL_PROPS = new Set(['x', 'y', 'vx', 'vy', 'fx', 'fy', 'index']);

export function useForceLayout(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number = 800,
  height: number = 600
) {
  const simulationRef = useRef<Simulation<SimulationNode, SimulationLink> | null>(null);
  const nodeMapRef = useRef<Map<string, SimulationNode>>(new Map());
  const isDraggingRef = useRef<boolean>(false);
  const [nodePositions, setNodePositions] = useState<Map<string, [number, number]>>(new Map());

  const getNodePosition = useCallback(
    (nodeId: string): [number, number] => {
      return nodePositions.get(nodeId) ?? [width / 2, height / 2];
    },
    [nodePositions, width, height]
  );

  const getSimNode = useCallback((nodeId: string): SimulationNode | undefined => {
    return nodeMapRef.current.get(nodeId);
  }, []);

  const dragStart = useCallback(
    (event: DragEvent, nodeId: string) => {
      if (!simulationRef.current) return;
      const node = getSimNode(nodeId);
      if (node) {
        isDraggingRef.current = true;
        node.fx = event.x;
        node.fy = event.y;
        simulationRef.current.alphaTarget(0.3).restart();
      }
    },
    [getSimNode]
  );

  const drag = useCallback(
    (event: DragEvent, nodeId: string) => {
      if (!simulationRef.current) return;
      const node = getSimNode(nodeId);
      if (node) {
        node.fx = event.x;
        node.fy = event.y;
      }
    },
    [getSimNode]
  );

  const dragEnd = useCallback(
    (_event: DragEvent, nodeId: string) => {
      if (!simulationRef.current) return;
      const node = getSimNode(nodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
        isDraggingRef.current = false;
        simulationRef.current.alphaTarget(0);
        simulationRef.current.alpha(0.3).restart();
      }
    },
    [getSimNode]
  );

  useEffect(() => {
    if (!simulationRef.current) return;

    const newNodeMap = new Map(nodes.map((n) => [n.id, n]));
    const currentNodes = simulationRef.current.nodes();

    const nodesToRemove: string[] = [];
    nodeMapRef.current.forEach((_, id) => {
      if (!newNodeMap.has(id)) {
        nodesToRemove.push(id);
      }
    });

    nodesToRemove.forEach((id) => {
      nodeMapRef.current.delete(id);
    });

    nodes.forEach((node) => {
      const existing = nodeMapRef.current.get(node.id);
      if (existing) {
        (Object.keys(node) as Array<keyof GraphNode>).forEach((key) => {
          if (!PHYSICAL_PROPS.has(key as string)) {
            (existing as any)[key] = node[key];
          }
        });
      } else {
        const newNode: SimulationNode = {
          ...node,
          x: node.x ?? width / 2,
          y: node.y ?? height / 2,
        };
        nodeMapRef.current.set(node.id, newNode);
      }
    });

    const updatedNodes = Array.from(nodeMapRef.current.values());
    simulationRef.current.nodes(updatedNodes);

    const simLinks: SimulationLink[] = links.map((link) => ({
      ...link,
      source: link.source,
      target: link.target,
    }));

    const linkForce = simulationRef.current.force<
      ReturnType<typeof forceLink<SimulationNode, SimulationLink>>
    >('link');
    if (linkForce) {
      linkForce.links(simLinks);
    }

    simulationRef.current.force('center', forceCenter(width / 2, height / 2));

    if (!isDraggingRef.current && nodesToRemove.length > 0) {
      simulationRef.current.alpha(0.3).restart();
    }
  }, [nodes, links, width, height]);

  useEffect(() => {
    const initialNodes: SimulationNode[] = nodes.map((node) => ({
      ...node,
      x: node.x ?? width / 2,
      y: node.y ?? height / 2,
    }));

    initialNodes.forEach((node) => {
      nodeMapRef.current.set(node.id, node);
    });

    const simLinks: SimulationLink[] = links.map((link) => ({
      ...link,
      source: link.source,
      target: link.target,
    }));

    simulationRef.current = forceSimulation<SimulationNode, SimulationLink>(initialNodes)
      .force(
        'link',
        forceLink<SimulationNode, SimulationLink>(simLinks)
          .id((d) => d.id)
          .distance(120)
          .strength(0.5)
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide().radius(45))
      .on('tick', () => {
        if (!simulationRef.current) return;
        const positions = new Map<string, [number, number]>();
        simulationRef.current.nodes().forEach((node) => {
          positions.set(node.id, [node.x ?? 0, node.y ?? 0]);
        });
        setNodePositions(positions);
      });

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  return {
    getNodePosition,
    simulation: simulationRef.current,
    dragStart,
    drag,
    dragEnd,
  };
}
