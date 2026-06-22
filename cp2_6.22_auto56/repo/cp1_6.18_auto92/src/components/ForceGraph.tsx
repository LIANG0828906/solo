import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { GraphRenderer } from '../renderer/graphRenderer';
import {
  createForceSimulation,
  updateSimulationData,
  dragNode,
  releaseNode,
  SimNode,
  SimLink,
} from '../utils/forceGraph';
import { GraphNode, GraphLink, FACTION_COLORS } from '../types';
import { Simulation } from 'd3-force';

interface ForceGraphProps {
  width: number;
  height: number;
}

export const ForceGraph: React.FC<ForceGraphProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GraphRenderer | null>(null);
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const animationRef = useRef<number | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState<number | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const characters = useCharacterStore((s) => s.characters);
  const relations = useCharacterStore((s) => s.relations);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new GraphRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.resize(width, height);

    const { simulation, nodes, links } = createForceSimulation(
      characters,
      relations,
      width,
      height
    );
    simulationRef.current = simulation;
    nodesRef.current = nodes as GraphNode[];
    linksRef.current = links as GraphLink[];

    simulation.on('tick', () => {
      nodesRef.current = nodes as GraphNode[];
      linksRef.current = links as GraphLink[];
    });

    const animate = () => {
      if (rendererRef.current) {
        rendererRef.current.render(
          nodesRef.current,
          linksRef.current,
          {
            width,
            height,
            scale,
            offsetX: offset.x,
            offsetY: offset.y,
          },
          hoveredNodeId,
          hoveredLinkIndex,
          focusedNodeId
        );
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      simulation.stop();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!simulationRef.current || !rendererRef.current) return;

    const { nodes, links } = updateSimulationData(
      simulationRef.current,
      characters,
      relations
    );
    nodesRef.current = nodes as GraphNode[];
    linksRef.current = links as GraphLink[];
  }, [characters, relations]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
    if (simulationRef.current) {
      simulationRef.current.force('center', null);
    }
  }, [width, height]);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const node = rendererRef.current?.getNodeAtPosition(
      coords.x,
      coords.y,
      nodesRef.current,
      { width, height, scale, offsetX: offset.x, offsetY: offset.y }
    );

    if (node) {
      setDraggedNodeId(node.id);
      const simX = (coords.x - offset.x) / scale;
      const simY = (coords.y - offset.y) / scale;
      if (simulationRef.current) {
        dragNode(simulationRef.current, node.id, simX, simY);
      }
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    if (draggedNodeId && simulationRef.current) {
      const simX = (coords.x - offset.x) / scale;
      const simY = (coords.y - offset.y) / scale;
      dragNode(simulationRef.current, draggedNodeId, simX, simY);
      return;
    }

    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const node = rendererRef.current?.getNodeAtPosition(
      coords.x,
      coords.y,
      nodesRef.current,
      { width, height, scale, offsetX: offset.x, offsetY: offset.y }
    );

    if (node) {
      setHoveredNodeId(node.id);
      setTooltip({ x: coords.x, y: coords.y - 10, text: node.character.name });
      setHoveredLinkIndex(null);
    } else {
      const linkIndex = rendererRef.current?.getLinkAtPosition(
        coords.x,
        coords.y,
        linksRef.current,
        { width, height, scale, offsetX: offset.x, offsetY: offset.y }
      );
      if (linkIndex !== undefined && linkIndex >= 0) {
        setHoveredLinkIndex(linkIndex);
        const link = linksRef.current[linkIndex];
        setTooltip({ x: coords.x, y: coords.y - 10, text: link.relation.type });
      } else {
        setHoveredNodeId(null);
        setHoveredLinkIndex(null);
        setTooltip(null);
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeId && simulationRef.current) {
      releaseNode(simulationRef.current, draggedNodeId);
      setDraggedNodeId(null);
    }
    setIsPanning(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const node = rendererRef.current?.getNodeAtPosition(
      coords.x,
      coords.y,
      nodesRef.current,
      { width, height, scale, offsetX: offset.x, offsetY: offset.y }
    );
    if (node) {
      selectCharacter(node.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const node = rendererRef.current?.getNodeAtPosition(
      coords.x,
      coords.y,
      nodesRef.current,
      { width, height, scale, offsetX: offset.x, offsetY: offset.y }
    );
    if (node) {
      setFocusedNodeId(node.id);
      selectCharacter(node.id);
      setTimeout(() => setFocusedNodeId(null), 2000);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, 0.3), 3);
    const coords = getCanvasCoords(e);

    const simX = (coords.x - offset.x) / scale;
    const simY = (coords.y - offset.y) / scale;

    setScale(newScale);
    setOffset({
      x: coords.x - simX * newScale,
      y: coords.y - simY * newScale,
    });
  };

  useEffect(() => {
    if (selectedCharacterId && simulationRef.current) {
      const node = nodesRef.current.find((n) => n.id === selectedCharacterId);
      if (node) {
        setFocusedNodeId(selectedCharacterId);
        setTimeout(() => setFocusedNodeId(null), 1000);
      }
    }
  }, [selectedCharacterId]);

  return (
    <div className="force-graph-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        style={{ cursor: draggedNodeId ? 'grabbing' : isPanning ? 'move' : 'grab' }}
      />
      {tooltip && (
        <div
          className="graph-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: FACTION_COLORS.protagonist }} />
          <span>主角</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: FACTION_COLORS.deuteragonist }} />
          <span>副角</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: FACTION_COLORS.antagonist }} />
          <span>反派</span>
        </div>
      </div>
    </div>
  );
};

export default ForceGraph;
