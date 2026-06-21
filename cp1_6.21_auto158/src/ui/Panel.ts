import * as THREE from 'three';
import { eventBus, EVENTS } from '../utils/EventBus';
import { NodeData } from '../network/NodeManager';
import { LinkData } from '../network/LinkManager';

interface SearchResult {
  id: string;
  label: string;
}

export class Panel {
  private searchInput: HTMLInputElement;
  private searchResults: HTMLDivElement;
  private toggleSimulationBtn: HTMLButtonElement;
  private simulationText: HTMLSpanElement;
  private resetLayoutBtn: HTMLButtonElement;
  private nodeCountEl: HTMLDivElement;
  private nodeDetailBubble: HTMLDivElement;
  private bubbleTitle: HTMLDivElement;
  private bubbleConnections: HTMLSpanElement;
  private bubbleTime: HTMLSpanElement;
  private nodes: Map<string, NodeData>;
  private getConnectionCount: (nodeId: string) => number;
  private camera: THREE.Camera;
  private searchHighlightNodes: Set<string> = new Set();

  constructor(
    nodes: Map<string, NodeData>,
    camera: THREE.Camera,
    getConnectionCount: (nodeId: string) => number
  ) {
    this.nodes = nodes;
    this.camera = camera;
    this.getConnectionCount = getConnectionCount;

    this.searchInput = document.getElementById('searchInput') as HTMLInputElement;
    this.searchResults = document.getElementById('searchResults') as HTMLDivElement;
    this.toggleSimulationBtn = document.getElementById('toggleSimulation') as HTMLButtonElement;
    this.simulationText = document.getElementById('simulationText') as HTMLSpanElement;
    this.resetLayoutBtn = document.getElementById('resetLayout') as HTMLButtonElement;
    this.nodeCountEl = document.getElementById('nodeCount') as HTMLDivElement;
    this.nodeDetailBubble = document.getElementById('nodeDetailBubble') as HTMLDivElement;
    this.bubbleTitle = document.getElementById('bubbleTitle') as HTMLDivElement;
    this.bubbleConnections = document.getElementById('bubbleConnections') as HTMLSpanElement;
    this.bubbleTime = document.getElementById('bubbleTime') as HTMLSpanElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.handleSearch(query);
    });

    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value) {
        this.searchResults.classList.add('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target as Node) && 
          !this.searchResults.contains(e.target as Node)) {
        this.searchResults.classList.remove('active');
      }
    });

    this.toggleSimulationBtn.addEventListener('click', () => {
      eventBus.emit(EVENTS.SIMULATION_TOGGLE, null);
    });

    this.resetLayoutBtn.addEventListener('click', () => {
      eventBus.emit(EVENTS.SIMULATION_RESET);
    });

    eventBus.on(EVENTS.SIMULATION_TOGGLE, (isRunning: boolean) => {
      this.updateSimulationButton(isRunning);
    });

    eventBus.on(EVENTS.NODE_COUNT_CHANGE, (count: number) => {
      this.updateNodeCount(count);
    });

    eventBus.on(EVENTS.SEARCH_FOCUS, (nodeId: string) => {
      this.showNodeDetail(nodeId);
    });

    eventBus.on(EVENTS.NODE_HIGHLIGHT, (nodeId: string) => {
      this.showNodeDetail(nodeId);
    });

    eventBus.on(EVENTS.NODE_UNHIGHLIGHT, () => {
      this.hideNodeDetail();
    });
  }

  private handleSearch(query: string): void {
    eventBus.emit(EVENTS.SEARCH_QUERY, query);

    if (!query.trim()) {
      this.searchResults.classList.remove('active');
      this.clearSearchHighlights();
      return;
    }

    const results = this.searchNodes(query);
    this.renderSearchResults(results, query);

    this.highlightSearchResults(results);
  }

  private searchNodes(query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    this.nodes.forEach((node, id) => {
      if (node.label.toLowerCase().includes(lowerQuery)) {
        results.push({ id, label: node.label });
      }
    });

    return results.slice(0, 5);
  }

  private renderSearchResults(results: SearchResult[], query: string): void {
    this.searchResults.innerHTML = '';

    if (results.length === 0) {
      this.searchResults.innerHTML = '<div class="search-result-item" style="color: #64748B;">未找到匹配节点</div>';
      this.searchResults.classList.add('active');
      return;
    }

    results.forEach(result => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      
      const highlightedLabel = this.highlightText(result.label, query);
      item.innerHTML = highlightedLabel;
      
      item.addEventListener('click', () => {
        eventBus.emit(EVENTS.SEARCH_FOCUS, result.id);
        this.searchResults.classList.remove('active');
        this.searchInput.value = result.label;
        this.clearSearchHighlights();
      });

      this.searchResults.appendChild(item);
    });

    this.searchResults.classList.add('active');
  }

  private highlightText(text: string, query: string): string {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  private highlightSearchResults(results: SearchResult[]): void {
    this.clearSearchHighlights();
    
    results.forEach(result => {
      this.searchHighlightNodes.add(result.id);
      const node = this.nodes.get(result.id);
      if (node && node.glowMesh) {
        const glowMaterial = node.glowMesh.material as THREE.MeshBasicMaterial;
        glowMaterial.opacity = 0.7;
        node.mesh.scale.set(1.1, 1.1, 1.1);
      }
    });
  }

  private clearSearchHighlights(): void {
    this.searchHighlightNodes.forEach(nodeId => {
      const node = this.nodes.get(nodeId);
      if (node && node.glowMesh && !node.isHighlighted) {
        const glowMaterial = node.glowMesh.material as THREE.MeshBasicMaterial;
        glowMaterial.opacity = 0.3;
        node.mesh.scale.set(1, 1, 1);
      }
    });
    this.searchHighlightNodes.clear();
  }

  private updateSimulationButton(isRunning: boolean): void {
    if (isRunning) {
      this.toggleSimulationBtn.classList.add('active');
      this.simulationText.textContent = '运行中';
      (this.toggleSimulationBtn.querySelector('span:first-child') as HTMLElement).textContent = '●';
    } else {
      this.toggleSimulationBtn.classList.remove('active');
      this.simulationText.textContent = '已暂停';
      (this.toggleSimulationBtn.querySelector('span:first-child') as HTMLElement).textContent = '❚❚';
    }
  }

  private updateNodeCount(count: number): void {
    this.nodeCountEl.classList.add('change');
    this.nodeCountEl.textContent = count.toString();
    
    setTimeout(() => {
      this.nodeCountEl.classList.remove('change');
    }, 300);
  }

  private showNodeDetail(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const connections = this.getConnectionCount(nodeId);
    const date = new Date(node.createdAt);
    const timeStr = date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    this.bubbleTitle.textContent = node.label;
    this.bubbleConnections.textContent = connections.toString();
    this.bubbleTime.textContent = timeStr;

    this.updateBubblePosition(node);
    this.nodeDetailBubble.classList.add('visible');
  }

  private hideNodeDetail(): void {
    this.nodeDetailBubble.classList.remove('visible');
  }

  private updateBubblePosition(node: NodeData): void {
    const vector = node.position.clone();
    vector.project(this.camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

    this.nodeDetailBubble.style.left = `${x}px`;
    this.nodeDetailBubble.style.top = `${y - 100}px`;
    this.nodeDetailBubble.style.transform = 'translateX(-50%)';
  }

  update(): void {
    const highlightedNode = Array.from(this.nodes.values()).find(n => n.isHighlighted);
    if (highlightedNode) {
      this.updateBubblePosition(highlightedNode);
    }
  }

  setNodes(nodes: Map<string, NodeData>): void {
    this.nodes = nodes;
  }
}
