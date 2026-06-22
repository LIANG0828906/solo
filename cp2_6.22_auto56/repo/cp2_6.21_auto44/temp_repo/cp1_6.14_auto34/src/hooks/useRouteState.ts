import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LocationNode, Connection, DayItinerary, ReportDayData } from '@/types';
import { calculateHaversineDistance } from '@/utils/canvasHelpers';

const DAY_GRADIENTS = [
  { start: '#E67E22', end: '#F39C12' },
  { start: '#3498DB', end: '#2980B9' },
  { start: '#E74C3C', end: '#C0392B' },
  { start: '#27AE60', end: '#229954' },
  { start: '#9B59B6', end: '#8E44AD' },
  { start: '#E91E63', end: '#C2185B' },
  { start: '#FF9800', end: '#F57C00' },
];

const createInitialItineraries = (): DayItinerary[] => {
  return Array.from({ length: 7 }, (_, i) => ({
    dayNumber: i + 1,
    nodeIds: [],
    gradientStart: DAY_GRADIENTS[i].start,
    gradientEnd: DAY_GRADIENTS[i].end,
  }));
};

const createDemoData = (): { nodes: LocationNode[]; connections: Connection[] } => {
  const baseLat = 39.9042;
  const baseLng = 116.4074;

  const nodes: LocationNode[] = [
    {
      id: uuidv4(),
      name: '故宫博物院',
      lat: baseLat + 0.012,
      lng: baseLng + 0.008,
      description: '中国明清两代皇家宫殿',
      x: 150,
      y: 200,
      estimatedDuration: 180,
    },
    {
      id: uuidv4(),
      name: '天安门广场',
      lat: baseLat + 0.005,
      lng: baseLng + 0.002,
      description: '世界上最大的城市广场',
      x: 350,
      y: 250,
      estimatedDuration: 60,
    },
    {
      id: uuidv4(),
      name: '颐和园',
      lat: baseLat + 0.08,
      lng: baseLng - 0.05,
      description: '皇家园林博物馆',
      x: 200,
      y: 400,
      estimatedDuration: 150,
    },
    {
      id: uuidv4(),
      name: '长城',
      lat: baseLat + 0.15,
      lng: baseLng - 0.12,
      description: '世界文化遗产',
      x: 450,
      y: 150,
      estimatedDuration: 240,
    },
    {
      id: uuidv4(),
      name: '天坛',
      lat: baseLat - 0.02,
      lng: baseLng + 0.03,
      description: '明清皇帝祭天场所',
      x: 550,
      y: 350,
      estimatedDuration: 90,
    },
  ];

  const connections: Connection[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const fromNode = nodes[i];
    const toNode = nodes[i + 1];
    connections.push({
      id: uuidv4(),
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      distance: calculateHaversineDistance(
        fromNode.lat,
        fromNode.lng,
        toNode.lat,
        toNode.lng
      ),
      isHighlighted: false,
      highlightColor: '',
    });
  }

  return { nodes, connections };
};

export function useRouteState() {
  const demoData = useMemo(() => createDemoData(), []);

  const [nodes, setNodes] = useState<LocationNode[]>(demoData.nodes);
  const [connections, setConnections] = useState<Connection[]>(demoData.connections);
  const [itineraries, setItineraries] = useState<DayItinerary[]>(createInitialItineraries);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const getNodeById = useCallback(
    (id: string): LocationNode | undefined => {
      return nodes.find((n) => n.id === id);
    },
    [nodes]
  );

  const getDayColorForNode = useCallback(
    (nodeId: string): string | undefined => {
      for (const itinerary of itineraries) {
        if (itinerary.nodeIds.includes(nodeId)) {
          return itinerary.gradientStart;
        }
      }
      return undefined;
    },
    [itineraries]
  );

  const addNode = useCallback(
    (x: number, y: number, name: string, description: string, lat?: number, lng?: number) => {
      const newNode: LocationNode = {
        id: uuidv4(),
        name,
        lat: lat ?? 39.9042 + (Math.random() - 0.5) * 0.2,
        lng: lng ?? 116.4074 + (Math.random() - 0.5) * 0.2,
        description,
        x,
        y,
        estimatedDuration: 60 + Math.floor(Math.random() * 120),
      };
      setNodes((prev) => [...prev, newNode]);
      return newNode;
    },
    []
  );

  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, x, y } : node))
    );
  }, []);

  const updateNode = useCallback(
    (id: string, updates: Partial<LocationNode>) => {
      setNodes((prev) =>
        prev.map((node) => (node.id === id ? { ...node, ...updates } : node))
      );
    },
    []
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== id));
      setConnections((prev) =>
        prev.filter(
          (conn) => conn.fromNodeId !== id && conn.toNodeId !== id
        )
      );
      setItineraries((prev) =>
        prev.map((itinerary) => ({
          ...itinerary,
          nodeIds: itinerary.nodeIds.filter((nodeId) => nodeId !== id),
        }))
      );
      if (selectedNodeId === id) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId]
  );

  const addConnection = useCallback(
    (fromNodeId: string, toNodeId: string) => {
      const exists = connections.some(
        (c) =>
          (c.fromNodeId === fromNodeId && c.toNodeId === toNodeId) ||
          (c.fromNodeId === toNodeId && c.toNodeId === fromNodeId)
      );

      if (exists) return null;

      const fromNode = nodes.find((n) => n.id === fromNodeId);
      const toNode = nodes.find((n) => n.id === toNodeId);

      if (!fromNode || !toNode) return null;

      const distance = calculateHaversineDistance(
        fromNode.lat,
        fromNode.lng,
        toNode.lat,
        toNode.lng
      );

      const newConnection: Connection = {
        id: uuidv4(),
        fromNodeId,
        toNodeId,
        distance,
        isHighlighted: false,
        highlightColor: '',
      };

      setConnections((prev) => [...prev, newConnection]);
      return newConnection;
    },
    [nodes, connections]
  );

  const updateConnectionHighlight = useCallback(() => {
    setConnections((prev) => {
      const newConnections = prev.map((conn) => ({
        ...conn,
        isHighlighted: false,
        highlightColor: '',
      }));

      for (const itinerary of itineraries) {
        for (let i = 0; i < itinerary.nodeIds.length - 1; i++) {
          const fromId = itinerary.nodeIds[i];
          const toId = itinerary.nodeIds[i + 1];

          const connIndex = newConnections.findIndex(
            (c) =>
              (c.fromNodeId === fromId && c.toNodeId === toId) ||
              (c.fromNodeId === toId && c.toNodeId === fromId)
          );

          if (connIndex !== -1) {
            newConnections[connIndex] = {
              ...newConnections[connIndex],
              isHighlighted: true,
              highlightColor: itinerary.gradientStart,
            };
          }
        }
      }

      return newConnections;
    });
  }, [itineraries]);

  const assignNodeToDay = useCallback(
    (nodeId: string, dayNumber: number, targetIndex?: number) => {
      setItineraries((prev) => {
        const newItineraries = prev.map((itinerary) => ({
          ...itinerary,
          nodeIds: itinerary.nodeIds.filter((id) => id !== nodeId),
        }));

        const dayIndex = newItineraries.findIndex(
          (i) => i.dayNumber === dayNumber
        );
        if (dayIndex !== -1) {
          const nodeIds = [...newItineraries[dayIndex].nodeIds];
          const insertIndex = targetIndex ?? nodeIds.length;
          nodeIds.splice(insertIndex, 0, nodeId);
          newItineraries[dayIndex] = {
            ...newItineraries[dayIndex],
            nodeIds,
          };
        }

        return newItineraries;
      });
    },
    []
  );

  const removeNodeFromDay = useCallback(
    (nodeId: string, dayNumber: number) => {
      setItineraries((prev) =>
        prev.map((itinerary) =>
          itinerary.dayNumber === dayNumber
            ? {
                ...itinerary,
                nodeIds: itinerary.nodeIds.filter((id) => id !== nodeId),
              }
            : itinerary
        )
      );
    },
    []
  );

  const reorderNodesInDay = useCallback(
    (dayNumber: number, fromIndex: number, toIndex: number) => {
      setItineraries((prev) =>
        prev.map((itinerary) => {
          if (itinerary.dayNumber !== dayNumber) return itinerary;

          const newNodeIds = [...itinerary.nodeIds];
          const [removed] = newNodeIds.splice(fromIndex, 1);
          newNodeIds.splice(toIndex, 0, removed);

          return { ...itinerary, nodeIds: newNodeIds };
        })
      );
    },
    []
  );

  const calculateDayDistance = useCallback(
    (dayNumber: number): number => {
      const itinerary = itineraries.find((i) => i.dayNumber === dayNumber);
      if (!itinerary || itinerary.nodeIds.length < 2) return 0;

      let totalDistance = 0;
      for (let i = 0; i < itinerary.nodeIds.length - 1; i++) {
        const fromNode = getNodeById(itinerary.nodeIds[i]);
        const toNode = getNodeById(itinerary.nodeIds[i + 1]);
        if (fromNode && toNode) {
          totalDistance += calculateHaversineDistance(
            fromNode.lat,
            fromNode.lng,
            toNode.lat,
            toNode.lng
          );
        }
      }
      return totalDistance;
    },
    [itineraries, getNodeById]
  );

  const calculateDayDuration = useCallback(
    (dayNumber: number): number => {
      const itinerary = itineraries.find((i) => i.dayNumber === dayNumber);
      if (!itinerary) return 0;

      return itinerary.nodeIds.reduce((total, nodeId) => {
        const node = getNodeById(nodeId);
        return total + (node?.estimatedDuration || 0);
      }, 0);
    },
    [itineraries, getNodeById]
  );

  const generateReportData = useCallback((): ReportDayData[] => {
    return itineraries
      .filter((i) => i.nodeIds.length > 0)
      .map((itinerary) => ({
        dayNumber: itinerary.dayNumber,
        gradientStart: itinerary.gradientStart,
        gradientEnd: itinerary.gradientEnd,
        nodes: itinerary.nodeIds
          .map((id) => getNodeById(id))
          .filter((n): n is LocationNode => n !== undefined),
        totalDistance: calculateDayDistance(itinerary.dayNumber),
        totalDuration: calculateDayDuration(itinerary.dayNumber),
      }));
  }, [itineraries, getNodeById, calculateDayDistance, calculateDayDuration]);

  const resetCanvas = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setItineraries(createInitialItineraries());
    setScale(1);
    setPanX(0);
    setPanY(0);
    setSelectedNodeId(null);
  }, []);

  return {
    nodes,
    connections,
    itineraries,
    scale,
    panX,
    panY,
    selectedNodeId,
    setScale,
    setPanX,
    setPanY,
    setSelectedNodeId,
    getNodeById,
    getDayColorForNode,
    addNode,
    updateNodePosition,
    updateNode,
    deleteNode,
    addConnection,
    updateConnectionHighlight,
    assignNodeToDay,
    removeNodeFromDay,
    reorderNodesInDay,
    calculateDayDistance,
    calculateDayDuration,
    generateReportData,
    resetCanvas,
  };
}

export type UseRouteStateReturn = ReturnType<typeof useRouteState>;
