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

export function useForceLayout(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number = 800,
  height: number = 600
) {
  const simulationRef = useRef<Simulation<SimulationNode, SimulationLink> | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, [number, number]>>(new Map());

  const getNodePosition = useCallback(
    (nodeId: string): [number, number] => {
      return nodePositions.get(nodeId) ?? [width / 2, height / 2];
    },
    [nodePositions, width, height]
  );

  const dragStart = useCallback(
    (event: DragEvent, nodeId: string) => {
      if (!simulationRef.current) return;
      const simNodes = simulationRef.current.nodes();
      const node = simNodes.find((n) => n.id === nodeId);
      if (node) {
        node.fx = event.x;
        node.fy = event.y;
        simulationRef.current.alphaTarget(0.3).restart();
      }
    },
    []
  );

  const drag = useCallback(
    (event: DragEvent, nodeId: string) => {
      if (!simulationRef.current) return;
      const simNodes = simulationRef.current.nodes();
      const node = simNodes.find((n) => n.id === nodeId);
      if (node) {
        node.fx = event.x;
        node.fy = event.y;
      }
    },
    []
  );

  const dragEnd = useCallback(
    (_event: DragEvent, nodeId: string) => {
      if (!simulationRef.current) return;
      const simNodes = simulationRef.current.nodes();
      const node = simNodes.find((n) => n.id === nodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
        simulationRef.current.alphaTarget(0);
      }
    },
    []
  );

  useEffect(() => {
    const simNodes: SimulationNode[] = nodes.map((node) => ({
      ...node,
      x: node.x ?? width / 2,
      y: node.y ?? height / 2,
    }));

    const simLinks: SimulationLink[] = links.map((link) => ({
      ...link,
      source: link.source,
      target: link.target,
    }));

    if (!simulationRef.current) {
      simulationRef.current = forceSimulation<SimulationNode, SimulationLink>(simNodes)
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
    } else {
      simulationRef.current.nodes(simNodes);
      const linkForce = simulationRef.current.force<
        ReturnType<typeof forceLink<SimulationNode, SimulationLink>>
      >('link');
      if (linkForce) {
        linkForce.links(simLinks);
      }
      simulationRef.current.force('center', forceCenter(width / 2, height / 2));
      simulationRef.current.alpha(1).restart();
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [nodes, links, width, height]);

  return {
    getNodePosition,
    simulation: simulationRef.current,
    dragStart,
    drag,
    dragEnd,
  };
}
