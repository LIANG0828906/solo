export interface Civilization {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  region: string;
  color: string;
}

export interface Event {
  id: string;
  name: string;
  year: number;
  civilizationId: string;
  region: string;
  description: string;
  influenceWeight: number;
  relatedEventIds: string[];
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  year: number;
  civilizationId: string;
  region: string;
  influenceWeight: number;
  color: string;
  radius: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface AppState {
  selectedCivilizationId: string | null;
  selectedCivilizationIds: string[];
  selectedEventId: string | null;
  highlightedEventId: string | null;
  isDetailPanelOpen: boolean;
  searchQuery: string;
  searchResults: Event[];
}

export interface AppContextType extends AppState {
  selectCivilization: (id: string | null) => void;
  toggleComparisonCivilization: (id: string) => void;
  selectEvent: (id: string | null) => void;
  highlightEvent: (id: string | null) => void;
  closeDetailPanel: () => void;
  setSearchQuery: (query: string) => void;
  clearComparisonCivilizations: () => void;
}
