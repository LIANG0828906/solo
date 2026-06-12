export interface MindNode {
  id: string;
  parent_id: string | null;
  x: number;
  y: number;
  radius: number;
  text: string;
  color: string;
  z_index: number;
}

export interface NodeTree {
  node: MindNode;
  children: NodeTree[];
}

export class GraphEngine {
  private nodes: Map<string, MindNode> = new Map();
  private horizontalSpacing = 180;
  private verticalSpacing = 100;
  private nodeRadius = 40;

  constructor(nodes: MindNode[] = []) {
    this.setNodes(nodes);
  }

  setNodes(nodes: MindNode[]): void {
    this.nodes = new Map(nodes.map(n => [n.id, n]));
  }

  addNode(node: MindNode): void {
    this.nodes.set(node.id, node);
  }

  removeNode(id: string): void {
    this.nodes.delete(id);
  }

  getNode(id: string): MindNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): MindNode[] {
    return Array.from(this.nodes.values());
  }

  getRootNodes(): MindNode[] {
    return Array.from(this.nodes.values()).filter(n => n.parent_id === null);
  }

  getChildren(parentId: string): MindNode[] {
    return Array.from(this.nodes.values()).filter(n => n.parent_id === parentId);
  }

  getDescendants(parentId: string): MindNode[] {
    const descendants: MindNode[] = [];
    const children = this.getChildren(parentId);
    for (const child of children) {
      descendants.push(child);
      descendants.push(...this.getDescendants(child.id));
    }
    return descendants;
  }

  buildTree(rootId: string): NodeTree | null {
    const root = this.nodes.get(rootId);
    if (!root) return null;
    
    const buildNodeTree = (nodeId: string): NodeTree => {
      const node = this.nodes.get(nodeId)!;
      const children = this.getChildren(nodeId);
      return {
        node,
        children: children.map(c => buildNodeTree(c.id)),
      };
    };
    
    return buildNodeTree(rootId);
  }

  calculateSubtreeWidth(nodeId: string): number {
    const children = this.getChildren(nodeId);
    if (children.length === 0) {
      return this.nodeRadius * 2;
    }
    
    let totalWidth = 0;
    for (let i = 0; i < children.length; i++) {
      totalWidth += this.calculateSubtreeWidth(children[i].id);
      if (i > 0) {
        totalWidth += this.horizontalSpacing;
      }
    }
    
    const nodeWidth = this.nodeRadius * 2;
    return Math.max(totalWidth, nodeWidth);
  }

  calculateSubtreeHeight(nodeId: string): number {
    const children = this.getChildren(nodeId);
    if (children.length === 0) {
      return this.nodeRadius * 2;
    }
    
    let maxChildHeight = 0;
    for (const child of children) {
      const childHeight = this.calculateSubtreeHeight(child.id);
      maxChildHeight = Math.max(maxChildHeight, childHeight);
    }
    
    return this.nodeRadius * 2 + this.verticalSpacing + maxChildHeight;
  }

  radialLayout(centerX: number, centerY: number, rootId: string, startAngle: number = 0, endAngle: number = Math.PI * 2): void {
    const root = this.nodes.get(rootId);
    if (!root) return;
    
    root.x = centerX;
    root.y = centerY;
    
    const children = this.getChildren(rootId);
    if (children.length === 0) return;
    
    const angleRange = endAngle - startAngle;
    const angleStep = angleRange / children.length;
    const radius = 150;
    
    for (let i = 0; i < children.length; i++) {
      const angle = startAngle + angleStep * i + angleStep / 2;
      const childX = centerX + Math.cos(angle) * radius;
      const childY = centerY + Math.sin(angle) * radius;
      
      children[i].x = childX;
      children[i].y = childY;
      
      this.radialLayout(childX, childY, children[i].id, angle - Math.PI / 3, angle + Math.PI / 3);
    }
  }

  horizontalTreeLayout(startX: number, startY: number, rootId: string): void {
    const root = this.nodes.get(rootId);
    if (!root) return;
    
    const subtreeWidth = this.calculateSubtreeWidth(rootId);
    root.x = startX + subtreeWidth / 2;
    root.y = startY + this.nodeRadius;
    
    let currentX = startX;
    const children = this.getChildren(rootId);
    
    for (const child of children) {
      const childWidth = this.calculateSubtreeWidth(child.id);
      const childY = startY + this.nodeRadius * 2 + this.verticalSpacing;
      
      this.horizontalTreeLayout(currentX, childY, child.id);
      currentX += childWidth + this.horizontalSpacing;
    }
  }

  autoArrange(centerX: number, centerY: number): void {
    const roots = this.getRootNodes();
    
    if (roots.length === 0) return;
    
    if (roots.length === 1) {
      this.radialLayout(centerX, centerY, roots[0].id);
    } else {
      const angleStep = (Math.PI * 2) / roots.length;
      const radius = 200;
      
      for (let i = 0; i < roots.length; i++) {
        const angle = angleStep * i;
        const rootX = centerX + Math.cos(angle) * radius;
        const rootY = centerY + Math.sin(angle) * radius;
        this.radialLayout(rootX, rootY, roots[i].id);
      }
    }
  }

  moveNodeWithChildren(nodeId: string, dx: number, dy: number): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    node.x += dx;
    node.y += dy;
    
    const children = this.getChildren(nodeId);
    for (const child of children) {
      this.moveNodeWithChildren(child.id, dx, dy);
    }
  }

  addChildNode(parentId: string, childId: string, text: string = ''): MindNode | null {
    const parent = this.nodes.get(parentId);
    if (!parent) return null;
    
    const children = this.getChildren(parentId);
    const childCount = children.length;
    
    let angle: number;
    let radius: number;
    
    if (parent.parent_id === null) {
      angle = (Math.PI * 2 / 8) * childCount - Math.PI / 2;
      radius = 150;
    } else {
      const parentAngle = Math.atan2(parent.y - (this.nodes.get(parent.parent_id)?.y || 0), 
                                      parent.x - (this.nodes.get(parent.parent_id)?.x || 0));
      angle = parentAngle + (childCount % 2 === 0 ? 1 : -1) * Math.PI / 6 * Math.ceil(childCount / 2);
      radius = 140;
    }
    
    const childNode: MindNode = {
      id: childId,
      parent_id: parentId,
      x: parent.x + Math.cos(angle) * radius,
      y: parent.y + Math.sin(angle) * radius,
      radius: this.nodeRadius,
      text: text || '新节点',
      color: '#3A5A8C',
      z_index: 100,
    };
    
    this.nodes.set(childId, childNode);
    return childNode;
  }

  getConnectionPath(fromId: string, toId: string): { x: number; y: number }[] | null {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    
    if (!from || !to) return null;
    
    const points: { x: number; y: number }[] = [];
    
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const startX = from.x + (dx / dist) * from.radius;
    const startY = from.y + (dy / dist) * from.radius;
    const endX = to.x - (dx / dist) * to.radius;
    const endY = to.y - (dy / dist) * to.radius;
    
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      
      const perpX = -dy / dist;
      const perpY = dx / dist;
      const offset = Math.sin(t * Math.PI) * dist * 0.1;
      
      points.push({
        x: x + perpX * offset,
        y: y + perpY * offset,
      });
    }
    
    return points;
  }

  getMaxZIndex(): number {
    let maxZ = 0;
    for (const node of this.nodes.values()) {
      maxZ = Math.max(maxZ, node.z_index);
    }
    return maxZ;
  }

  bringToFront(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.z_index = this.getMaxZIndex() + 1;
    }
  }
}
