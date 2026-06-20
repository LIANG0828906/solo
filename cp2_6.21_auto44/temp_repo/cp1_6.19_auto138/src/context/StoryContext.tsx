import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { eventBus, StoryFragment, GraphNode, GraphLink } from '../eventBus';
import { fragmentManager } from '../storyData/storyFragment';
import { storyGraph } from '../map/storyGraph';

interface StoryContextType {
  fragments: StoryFragment[];
  graphNodes: GraphNode[];
  graphLinks: GraphLink[];
  selectedNodeId: string | null;
  selectedFragment: StoryFragment | null;
  isPlaybackMode: boolean;
  playbackVisibleNodes: string[];
  addFragment: (type: StoryFragment['type'], content: string) => void;
  updateFragment: (id: string, updates: Partial<Pick<StoryFragment, 'content' | 'type'>>) => void;
  dropFragment: (fragmentId: string, x: number, y: number) => void;
  selectNode: (nodeId: string | null) => void;
  deleteLink: (linkId: string) => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  getNodeConnections: (nodeId: string) => GraphLink[];
}

const StoryContext = createContext<StoryContextType | null>(null);

export const useStory = () => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStory must be used within StoryProvider');
  }
  return context;
};

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fragments, setFragments] = useState<StoryFragment[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [playbackVisibleNodes, setPlaybackVisibleNodes] = useState<string[]>([]);
  const playbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setFragments(fragmentManager.getAll());
    storyGraph.setFragments(fragmentManager.getAll());

    const offCreated = eventBus.on('fragment:created', (fragment) => {
      setFragments((prev) => [...prev, fragment]);
      storyGraph.setFragments([...fragmentManager.getAll()]);
    });

    const offUpdated = eventBus.on('fragment:updated', (fragment) => {
      setFragments((prev) =>
        prev.map((f) => (f.id === fragment.id ? fragment : f))
      );
    });

    const offDeleted = eventBus.on('fragment:deleted', (id) => {
      setFragments((prev) => prev.filter((f) => f.id !== id));
      if (selectedNodeId === id) {
        setSelectedNodeId(null);
      }
    });

    const offGraphUpdated = eventBus.on('graph:updated', ({ nodes, links }) => {
      setGraphNodes(nodes);
      setGraphLinks(links);
    });

    const offNodeSelected = eventBus.on('node:selected', (nodeId) => {
      setSelectedNodeId(nodeId);
    });

    return () => {
      offCreated();
      offUpdated();
      offDeleted();
      offGraphUpdated();
      offNodeSelected();
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [selectedNodeId]);

  const addFragment = useCallback((type: StoryFragment['type'], content: string) => {
    fragmentManager.create(type, content);
  }, []);

  const updateFragment = useCallback(
    (id: string, updates: Partial<Pick<StoryFragment, 'content' | 'type'>>) => {
      fragmentManager.update(id, updates);
    },
    []
  );

  const dropFragment = useCallback((fragmentId: string, x: number, y: number) => {
    eventBus.emit('fragment:dropped', fragmentId, x, y);
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    eventBus.emit('node:selected', nodeId);
    setSelectedNodeId(nodeId);
  }, []);

  const deleteLink = useCallback((linkId: string) => {
    eventBus.emit('link:deleted', linkId);
  }, []);

  const startPlayback = useCallback(() => {
    const order = storyGraph.getDroppedOrder();
    if (order.length === 0) return;

    setIsPlaybackMode(true);
    setPlaybackVisibleNodes([]);
    setSelectedNodeId(null);

    let index = 0;
    const interval = 1500;

    const step = () => {
      if (index < order.length) {
        setPlaybackVisibleNodes((prev) => [...prev, order[index]]);
        index++;
        playbackTimerRef.current = window.setTimeout(step, interval);
      }
    };

    step();
  }, []);

  const stopPlayback = useCallback(() => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setIsPlaybackMode(false);
    setPlaybackVisibleNodes([]);
  }, []);

  const getNodeConnections = useCallback(
    (nodeId: string): GraphLink[] => {
      return graphLinks.filter(
        (link) => link.source === nodeId || link.target === nodeId
      );
    },
    [graphLinks]
  );

  const selectedFragment = selectedNodeId
    ? fragments.find((f) => f.id === selectedNodeId) || null
    : null;

  const value: StoryContextType = {
    fragments,
    graphNodes,
    graphLinks,
    selectedNodeId,
    selectedFragment,
    isPlaybackMode,
    playbackVisibleNodes,
    addFragment,
    updateFragment,
    dropFragment,
    selectNode,
    deleteLink,
    startPlayback,
    stopPlayback,
    getNodeConnections,
  };

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
};
