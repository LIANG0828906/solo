import { Node, LayoutNodePosition } from './model';

const VERTICAL_SPACING = 60;
const SIBLING_SPACING = 20;
const SUBTREE_SPACING = 40;
const HORIZONTAL_SPACING = 180;

interface LayoutTree {
  node: Node;
  children: LayoutTree[];
  x: number;
  y: number;
  preliminary: number;
  mod: number;
  thread: LayoutTree | null;
  ancestor: LayoutTree;
  change: number;
  shift: number;
  leftSibling: LayoutTree | null;
  rightSibling: LayoutTree | null;
  number: number;
}

const leftmost = (v: LayoutTree, m: number, depth: number, maxDepth: number): LayoutTree | null => {
  if (depth >= maxDepth) return v;
  if (v.children.length === 0) return null;
  let n = v.children[v.children.length - 1];
  let m2 = m;
  let lmost: LayoutTree | null = null;
  let rmost: LayoutTree | null = null;
  let d = depth;
  do {
    if (d + m2 > maxDepth) {
      if (n.thread) {
        n = n.thread;
        d++;
      } else {
        return null;
      }
    } else {
      if (n.children.length > 0) {
        if (!lmost) lmost = n.children[0];
        rmost = n;
      }
      if (n.thread) {
        n = n.thread;
        d++;
      } else {
        n = n.children[0];
        d++;
      }
    }
  } while (n && d < maxDepth);
  if (!lmost || !rmost) return null;
  if (rmost === n) return null;
  return lmost;
};

export class TreeLayout {
  private buildTree(
    nodes: Node[],
    parentId: string | null,
    visibleSet: Set<string>
  ): LayoutTree[] {
    const children = nodes
      .filter(n => n.parentId === parentId && visibleSet.has(n.id))
      .sort((a, b) => {
        const p = nodes.find(n => n.id === parentId);
        if (!p) return 0;
        return p.children.indexOf(a.id) - p.children.indexOf(b.id);
      });
    return children.map((node, idx) => {
      const childTrees = this.buildTree(nodes, node.id, visibleSet);
      return {
        node,
        children: childTrees,
        x: 0,
        y: 0,
        preliminary: 0,
        mod: 0,
        thread: null,
        ancestor: null as unknown as LayoutTree,
        change: 0,
        shift: 0,
        leftSibling: null,
        rightSibling: null,
        number: idx,
      };
    });
  }

  private linkSiblings(trees: LayoutTree[]): void {
    trees.forEach((t, i) => {
      if (i > 0) t.leftSibling = trees[i - 1];
      if (i < trees.length - 1) t.rightSibling = trees[i + 1];
    });
    trees.forEach(t => {
      if (t.children.length > 0) this.linkSiblings(t.children);
    });
  }

  private firstWalk(v: LayoutTree, level: number): void {
    v.preliminary = 0;
    v.mod = 0;
    if (v.children.length === 0 || level === 100) {
      if (v.leftSibling) {
        v.preliminary =
          v.leftSibling.preliminary +
          this.getWidth(v.leftSibling.node) / 2 +
          this.getWidth(v.node) / 2 +
          SIBLING_SPACING;
      } else {
        v.preliminary = 0;
      }
    } else {
      v.children.forEach(child => {
        this.firstWalk(child, level + 1);
      });
      let midpoint =
        (v.children[0].preliminary + v.children[v.children.length - 1].preliminary) / 2;
      if (v.leftSibling) {
        v.preliminary =
          v.leftSibling.preliminary +
          this.getWidth(v.leftSibling.node) / 2 +
          this.getWidth(v.node) / 2 +
          SIBLING_SPACING;
        v.mod = v.preliminary - midpoint;
        this.apportion(v, level);
      } else {
        v.preliminary = midpoint;
      }
    }
  }

  private apportion(v: LayoutTree, level: number): void {
    let w = v.leftSibling;
    if (!w) return;
    let vip: LayoutTree | null = v;
    let vop: LayoutTree | null = v;
    let vim: LayoutTree | null = w;
    let vom: LayoutTree | null = v.leftSibling;
    let sip = v.mod;
    let sop = v.mod;
    let sim = w.mod;
    let som = w.mod;
    let nextVim: LayoutTree | null;
    let nextVip: LayoutTree | null;
    while (
      (nextVim = this.nextRight(vim!)) &&
      (nextVip = this.nextLeft(vip!))
    ) {
      vim = nextVim;
      vip = nextVip;
      vom = this.nextLeft(vom!)!;
      vop = this.nextRight(vop!)!;
      if (vop) vop.ancestor = v;
      const shift =
        vim.preliminary +
        sim -
        (vip.preliminary + sip) +
        SUBTREE_SPACING +
        this.getWidth(vim.node) / 2 +
        this.getWidth(vip.node) / 2;
      if (shift > 0) {
        let ancestor = vim.ancestor || v;
        const a = ancestor;
        let moveSubtree = shift;
        let changeSubtree = moveSubtree;
        let b: LayoutTree | null = a.leftSibling;
        while (b && b !== vom) {
          a.shift += moveSubtree;
          a.change -= changeSubtree;
          if (b === vim) break;
          b = b.leftSibling;
        }
        this.executeShifts(ancestor, moveSubtree);
        sip += shift;
        sop += shift;
      }
      sim += vim.mod;
      sip += vip.mod;
      som += vom.mod;
      sop += vop.mod;
    }
    if (vim && !this.nextRight(vop!)) {
      vop!.thread = vim;
      vop!.mod += sim - sop;
    }
    if (vip && !this.nextLeft(vom!)) {
      vom!.thread = vip;
      vom!.mod += sip - som;
      v.ancestor = v;
    }
  }

  private nextRight(v: LayoutTree): LayoutTree | null {
    if (v.children.length > 0) return v.children[v.children.length - 1];
    return v.thread;
  }

  private nextLeft(v: LayoutTree): LayoutTree | null {
    if (v.children.length > 0) return v.children[0];
    return v.thread;
  }

  private executeShifts(v: LayoutTree, shift: number): void {
    v.preliminary += shift;
    v.mod += shift;
    v.children.forEach(c => this.executeShifts(c, shift));
  }

  private getWidth(node: Node): number {
    return node.width;
  }

  private secondWalk(v: LayoutTree, m: number, level: number): void {
    v.x = v.preliminary + m;
    v.y = level * (VERTICAL_SPACING + v.node.height);
    v.children.forEach(child => {
      this.secondWalk(child, m + v.mod, level + 1);
    });
  }

  private normalizePositions(trees: LayoutTree[]): LayoutNodePosition[] {
    const positions: LayoutNodePosition[] = [];
    let minX = Infinity;
    let minY = Infinity;
    const collect = (t: LayoutTree) => {
      minX = Math.min(minX, t.x - t.node.width / 2);
      minY = Math.min(minY, t.y);
      positions.push({
        id: t.node.id,
        x: t.x - t.node.width / 2,
        y: t.y,
      });
      t.children.forEach(collect);
    };
    trees.forEach(collect);
    const offsetX = 100 - minX;
    const offsetY = 100 - minY;
    positions.forEach(p => {
      p.x += offsetX;
      p.y += offsetY;
    });
    return positions;
  }

  private collectHierarchical(
    nodes: Node[],
    roots: Node[],
    visibleSet: Set<string>
  ): LayoutNodePosition[] {
    const positions: LayoutNodePosition[] = [];
    let globalOffsetX = 100;
    const layRoot = (root: Node, offsetX: number): number => {
      const subtreePositions: LayoutNodePosition[] = [];
      const buildSubtree = (
        node: Node,
        depth: number,
        verticalOffset: number,
        assignedX: number
      ): number => {
        subtreePositions.push({
          id: node.id,
          x: assignedX,
          y: verticalOffset,
        });
        const children = nodes
          .filter(
            n =>
              n.parentId === node.id &&
              visibleSet.has(n.id) &&
              node.children.includes(n.id)
          )
          .sort(
            (a, b) => node.children.indexOf(a.id) - node.children.indexOf(b.id)
          );
        if (children.length === 0 || node.collapsed) {
          return verticalOffset + node.height;
        }
        let childVertical = verticalOffset + node.height + VERTICAL_SPACING;
        const maxChildHeights: number[] = [];
        let totalChildrenHeight = 0;
        children.forEach((child, idx) => {
          const result = this.measureSubtreeHeight(nodes, child, visibleSet);
          maxChildHeights.push(result);
          totalChildrenHeight += result;
          if (idx > 0) totalChildrenHeight += SIBLING_SPACING;
        });
        const firstChildY =
          childVertical -
          totalChildrenHeight / 2 +
          maxChildHeights[0] / 2 +
          (totalChildrenHeight - maxChildHeights[0]) / 2 -
          maxChildHeights[0] / 2;
        let currentY = firstChildY - totalChildrenHeight / 2 + maxChildHeights[0] / 2;
        currentY = verticalOffset + node.height / 2 - totalChildrenHeight / 2 + maxChildHeights[0] / 2;
        let runningY = verticalOffset + node.height + VERTICAL_SPACING;
        const centerY = verticalOffset + node.height / 2;
        runningY = centerY - totalChildrenHeight / 2;
        children.forEach(child => {
          const h = this.measureSubtreeHeight(nodes, child, visibleSet);
          const childCenterY = runningY + h / 2;
          runningY = buildSubtree(
            child,
            depth + 1,
            childCenterY - child.height / 2,
            assignedX + node.width + HORIZONTAL_SPACING
          );
          runningY += SIBLING_SPACING;
        });
        const subtreesBottom = Math.max(
          ...subtreePositions
            .filter(p => p.id !== node.id)
            .map(p => {
              const n = nodes.find(nn => nn.id === p.id);
              return n ? p.y + n.height : 0;
            })
        );
        return Math.max(subtreesBottom, verticalOffset + node.height);
      };
      const result = buildSubtree(root, 0, 200, offsetX);
      let maxWidth = 0;
      subtreePositions.forEach(p => {
        const n = nodes.find(nn => nn.id === p.id);
        if (n) maxWidth = Math.max(maxWidth, p.x + n.width);
      });
      positions.push(...subtreePositions);
      return maxWidth;
    };
    roots.forEach(root => {
      globalOffsetX = layRoot(root, globalOffsetX) + SUBTREE_SPACING * 2;
    });
    return positions;
  }

  private measureSubtreeHeight(
    nodes: Node[],
    node: Node,
    visibleSet: Set<string>
  ): number {
    if (!visibleSet.has(node.id)) return 0;
    const fullNode = nodes.find(n => n.id === node.id) || node;
    if (fullNode.collapsed || fullNode.children.length === 0) {
      return fullNode.height;
    }
    const children = nodes.filter(
      n =>
        n.parentId === node.id &&
        visibleSet.has(n.id) &&
        fullNode.children.includes(n.id)
    );
    if (children.length === 0) return fullNode.height;
    let total = 0;
    children.forEach((child, idx) => {
      total += this.measureSubtreeHeight(nodes, child, visibleSet);
      if (idx > 0) total += SIBLING_SPACING;
    });
    return Math.max(fullNode.height + VERTICAL_SPACING, total);
  }

  public calculate(nodes: Node[]): LayoutNodePosition[] {
    if (nodes.length === 0) return [];
    const visibleSet = new Set(nodes.map(n => n.id));
    const roots = nodes.filter(n => n.parentId === null);
    if (roots.length === 0) return [];
    const positions = this.collectHierarchical(nodes, roots, visibleSet);
    if (positions.length === 0) {
      return nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
    }
    return positions;
  }

  public calculateWithAnimation(
    nodes: Node[],
    onProgress: (positions: LayoutNodePosition[]) => void,
    onComplete: (positions: LayoutNodePosition[]) => void
  ): void {
    const start = performance.now();
    const result = this.calculate(nodes);
    const elapsed = performance.now() - start;
    if (elapsed > 100 && nodes.length > 100) {
      const currentPositions = nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
      const duration = 300;
      const startTime = performance.now();
      const animate = () => {
        const now = performance.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const interpolated = currentPositions.map((cp, i) => {
          const target = result[i] || cp;
          return {
            id: cp.id,
            x: cp.x + (target.x - cp.x) * eased,
            y: cp.y + (target.y - cp.y) * eased,
          };
        });
        onProgress(interpolated);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          onComplete(result);
        }
      };
      requestAnimationFrame(animate);
    } else {
      onProgress(result);
      onComplete(result);
    }
  }
}

export const walkerLayout = new TreeLayout();
