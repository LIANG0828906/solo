export interface GraphNode {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  scale: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  custom: boolean;
  opacity: number;
}

const COLORS = ['#4A90D9', '#E5734A', '#50C878', '#9B59B6', '#F1C40F', '#E74C8B'];

const SEMANTIC_PAIRS: Record<string, string[]> = {
  '架构': ['设计', '结构', '系统'],
  '性能': ['优化', '速度', '效率'],
  '安全': ['加密', '认证', '防护'],
  '测试': ['验证', '质量', '检查'],
  '部署': ['发布', '上线', '运维'],
  '数据': ['信息', '存储', '数据库'],
  '接口': ['API', '服务', '协议'],
  '算法': ['逻辑', '计算', '方法'],
  '前端': ['界面', 'UI', '交互'],
  '后端': ['服务端', '服务器', '后台'],
  '开发': ['编程', '编码', '实现'],
  '框架': ['库', '工具', '平台'],
  '微服务': ['服务', '分布式', '架构'],
  '容器': ['Docker', '虚拟化', '隔离'],
  '监控': ['日志', '追踪', '告警'],
  '设计模式': ['模式', '最佳实践', '原则'],
  '文档': ['说明', '规范', '手册'],
  '需求': ['功能', '特性', '目标'],
  '团队': ['协作', '沟通', '管理'],
  '版本': ['迭代', '发布', '更新'],
};

export class GraphEngine {
  nodes: Map<string, GraphNode> = new Map();
  edges: GraphEdge[] = [];
  private width = 800;
  private height = 600;
  private alpha = 1;
  private alphaDecay = 0.005;
  private alphaMin = 0.001;
  private colorUsage: number[] = new Array(COLORS.length).fill(0);

  setDimensions(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  addNode(doc: { id: string; title: string; summary: string; keywords: string[] }) {
    const charCount = doc.title.length + doc.summary.length;
    const size = Math.max(30, Math.min(80, 30 + (charCount / 200) * 50));

    let colorIdx = 0;
    if (this.nodes.size > 0) {
      const minUsage = Math.min(...this.colorUsage);
      const candidates = this.colorUsage.reduce<number[]>((acc, u, i) => {
        if (u === minUsage) acc.push(i);
        return acc;
      }, []);
      colorIdx = candidates[Math.floor(Math.random() * candidates.length)];
    }
    this.colorUsage[colorIdx]++;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const angle = Math.random() * Math.PI * 2;
    const radius = 50 + Math.random() * 150;

    const node: GraphNode = {
      id: doc.id,
      title: doc.title,
      summary: doc.summary,
      keywords: doc.keywords,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      color: COLORS[colorIdx],
      size,
      opacity: 0,
      scale: 0.3,
    };
    this.nodes.set(doc.id, node);
    this.alpha = 1;
    this.rebuildAutoEdges();
    return node;
  }

  removeNode(id: string) {
    const node = this.nodes.get(id);
    if (node) {
      const colorIdx = COLORS.indexOf(node.color);
      if (colorIdx >= 0) this.colorUsage[colorIdx]--;
    }
    this.nodes.delete(id);
    this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
  }

  addCustomEdge(source: string, target: string) {
    const exists = this.edges.some(
      e =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
    );
    if (!exists && this.nodes.has(source) && this.nodes.has(target)) {
      this.edges.push({ source, target, strength: 1, custom: true, opacity: 0 });
      this.alpha = 0.5;
    }
  }

  private isSemanticMatch(kw1: string, kw2: string): boolean {
    if (kw1 === kw2) return true;
    for (const [, values] of Object.entries(SEMANTIC_PAIRS)) {
      const group = values;
      if (group.includes(kw1) && group.includes(kw2)) return true;
    }
    return false;
  }

  rebuildAutoEdges() {
    const customEdges = this.edges.filter(e => e.custom);
    const autoEdges: GraphEdge[] = [];
    const nodeIds = Array.from(this.nodes.keys());

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const n1 = this.nodes.get(nodeIds[i])!;
        const n2 = this.nodes.get(nodeIds[j])!;
        let matchCount = 0;
        for (const kw1 of n1.keywords) {
          for (const kw2 of n2.keywords) {
            if (this.isSemanticMatch(kw1, kw2)) {
              matchCount++;
              break;
            }
          }
        }
        if (matchCount > 0) {
          const hasCustom = customEdges.some(
            e =>
              (e.source === n1.id && e.target === n2.id) ||
              (e.source === n2.id && e.target === n1.id)
          );
          if (!hasCustom) {
            autoEdges.push({
              source: n1.id,
              target: n2.id,
              strength: Math.min(5, matchCount),
              custom: false,
              opacity: 0.4,
            });
          }
        }
      }
    }
    this.edges = [...autoEdges, ...customEdges];
  }

  tick(): boolean {
    if (this.alpha < this.alphaMin) return false;

    const nodes = Array.from(this.nodes.values());
    const n = nodes.length;
    if (n === 0) return false;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist2 = dx * dx + dy * dy;
        const dist = Math.sqrt(dist2) || 1;
        const force = (300 * this.alpha) / (dist2 || 1);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    for (const edge of this.edges) {
      const source = this.nodes.get(edge.source);
      const target = this.nodes.get(edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 150) * 0.05 * this.alpha * edge.strength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    for (const node of nodes) {
      node.vx += (this.width / 2 - node.x) * 0.01 * this.alpha;
      node.vy += (this.height / 2 - node.y) * 0.01 * this.alpha;
    }

    for (const node of nodes) {
      node.vx *= 0.6;
      node.vy *= 0.6;
      node.x += node.vx;
      node.y += node.vy;
      const half = node.size / 2;
      node.x = Math.max(half, Math.min(this.width - half, node.x));
      node.y = Math.max(half, Math.min(this.height - half, node.y));
    }

    this.alpha -= this.alphaDecay;
    return true;
  }

  animateOpacities(dt: number) {
    for (const node of this.nodes.values()) {
      if (node.opacity < 1) {
        node.opacity = Math.min(1, node.opacity + dt * 4);
      }
      if (node.scale < 1) {
        node.scale = Math.min(1, node.scale + dt * 4);
      }
    }
    for (const edge of this.edges) {
      const target = edge.custom ? 0.6 : 0.4;
      if (edge.opacity < target) {
        edge.opacity = Math.min(target, edge.opacity + dt * 3);
      }
    }
  }

  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): GraphEdge[] {
    return this.edges;
  }

  findNodeAt(x: number, y: number, nodeScale?: Map<string, number>): GraphNode | null {
    const nodes = this.getNodes();
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const s = nodeScale?.get(node.id) ?? 1;
      const r = (node.size / 2) * s;
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy <= r * r) {
        return node;
      }
    }
    return null;
  }

  reheat() {
    this.alpha = 1;
  }
}
