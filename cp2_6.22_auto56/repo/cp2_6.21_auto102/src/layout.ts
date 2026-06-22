import { Node, LayoutNodePosition } from './model';

const VERTICAL_SPACING = 60;
const SIBLING_SPACING = 20;
const SUBTREE_SPACING = 40;
const HORIZONTAL_SPACING = 180;

interface LayoutTreeNode {
  node: Node;
  children: LayoutTreeNode[];
  x: number;
  y: number;
  preliminary: number;
  mod: number;
  thread: LayoutTreeNode | null;
  ancestor: LayoutTreeNode;
  change: number;
  shift: number;
  leftSibling: LayoutTreeNode | null;
  rightSibling: LayoutTreeNode | null;
  number: number;
  parent: LayoutTreeNode | null;
  subtreeHeight: number;
  subtreeTop: number;
  subtreeBottom: number;
}

interface Contour {
  top: number;
  bottom: number;
}

export class TreeLayout {
  private buildTree(
    nodes: Node[],
    parentId: string | null,
    parentNode: LayoutTreeNode | null,
    visibleSet: Set<string>
  ): LayoutTreeNode[] {
    const parentData = parentId ? nodes.find(n => n.id === parentId) : null;
    const children = nodes
      .filter(n => n.parentId === parentId && visibleSet.has(n.id))
      .sort((a, b) => {
        if (!parentData) return 0;
        return parentData.children.indexOf(a.id) - parentData.children.indexOf(b.id);
      });
    return children.map((node, idx) => {
      const newNode: LayoutTreeNode = {
        node,
        children: [],
        x: 0,
        y: 0,
        preliminary: 0,
        mod: 0,
        thread: null,
        ancestor: null as unknown as LayoutTreeNode,
        change: 0,
        shift: 0,
        leftSibling: null,
        rightSibling: null,
        number: idx,
        parent: parentNode,
        subtreeHeight: 0,
        subtreeTop: 0,
        subtreeBottom: 0,
      };
      newNode.children = this.buildTree(nodes, node.id, newNode, visibleSet);
      newNode.ancestor = newNode;
      return newNode;
    });
  }

  private linkSiblings(trees: LayoutTreeNode[]): void {
    trees.forEach((t, i) => {
      if (i > 0) t.leftSibling = trees[i - 1];
      if (i < trees.length - 1) t.rightSibling = trees[i + 1];
    });
    trees.forEach(t => {
      if (t.children.length > 0) this.linkSiblings(t.children);
    });
  }

  private getWidth(node: Node): number {
    return node.width;
  }

  private nextRight(v: LayoutTreeNode): LayoutTreeNode | null {
    if (v.children.length > 0 && !v.node.collapsed) {
      return v.children[v.children.length - 1];
    }
    return v.thread;
  }

  private nextLeft(v: LayoutTreeNode): LayoutTreeNode | null {
    if (v.children.length > 0 && !v.node.collapsed) {
      return v.children[0];
    }
    return v.thread;
  }

  private getLeftContour(
    v: LayoutTreeNode,
    modSum: number,
    depth: number,
    contour: Map<number, Contour>
  ): void {
    const y = v.y + modSum;
    const top = y - v.node.height / 2;
    const bottom = y + v.node.height / 2;
    if (!contour.has(depth) || top < contour.get(depth)!.top) {
      contour.set(depth, { top, bottom: Math.max(contour.get(depth)?.bottom || 0, bottom) });
    } else {
      const existing = contour.get(depth)!;
      existing.bottom = Math.max(existing.bottom, bottom);
    }
    if (!v.node.collapsed && v.children.length > 0) {
      v.children.forEach(child => {
        this.getLeftContour(child, modSum + v.mod, depth + 1, contour);
      });
    }
  }

  private getRightContour(
    v: LayoutTreeNode,
    modSum: number,
    depth: number,
    contour: Map<number, Contour>
  ): void {
    const y = v.y + modSum;
    const top = y - v.node.height / 2;
    const bottom = y + v.node.height / 2;
    if (!contour.has(depth) || bottom > contour.get(depth)!.bottom) {
      contour.set(depth, { bottom, top: Math.min(contour.get(depth)?.top || 0, top) });
    } else {
      const existing = contour.get(depth)!;
      existing.top = Math.min(existing.top, top);
    }
    if (!v.node.collapsed && v.children.length > 0) {
      v.children.forEach(child => {
        this.getRightContour(child, modSum + v.mod, depth + 1, contour);
      });
    }
  }

  private calculateSubtreeBounds(v: LayoutTreeNode, yOffset: number): void {
    v.y = yOffset + v.node.height / 2;
    v.subtreeTop = v.y - v.node.height / 2;
    v.subtreeBottom = v.y + v.node.height / 2;
    v.subtreeHeight = v.node.height;

    if (!v.node.collapsed && v.children.length > 0) {
      let currentY = v.subtreeBottom + VERTICAL_SPACING;
      let totalChildrenHeight = 0;
      v.children.forEach(child => {
        totalChildrenHeight += child.node.height;
      });
      totalChildrenHeight += (v.children.length - 1) * SIBLING_SPACING;

      let subtreesMaxBottom = v.subtreeBottom;
      let childStartY = currentY;
      v.children.forEach(child => {
        this.calculateSubtreeBounds(child, childStartY - child.node.height / 2);
        childStartY = child.subtreeBottom + SIBLING_SPACING;
        subtreesMaxBottom = Math.max(subtreesMaxBottom, child.subtreeBottom);
      });

      v.subtreeBottom = subtreesMaxBottom;
      v.subtreeHeight = v.subtreeBottom - v.subtreeTop;

      const shiftY = v.y - v.node.height / 2 + VERTICAL_SPACING + totalChildrenHeight / 2
        - (v.children[0].y + v.children[v.children.length - 1].y) / 2;

      if (Math.abs(shiftY) > 1) {
        const shiftSubtree = (node: LayoutTreeNode, delta: number) => {
          node.y += delta;
          node.subtreeTop += delta;
          node.subtreeBottom += delta;
          if (!node.node.collapsed) {
            node.children.forEach(c => shiftSubtree(c, delta));
          }
        };
        v.children.forEach(child => shiftSubtree(child, shiftY));
        v.subtreeTop = v.y - v.node.height / 2;
        v.subtreeBottom = Math.max(v.subtreeBottom, v.children[v.children.length - 1].subtreeBottom);
        v.subtreeHeight = v.subtreeBottom - v.subtreeTop;
      }
    }
  }

  private checkAndFixVerticalCollisions(
    v: LayoutTreeNode,
    level: number
  ): number {
    if (v.leftSibling) {
      const leftContour = new Map<number, Contour>();
      const rightContour = new Map<number, Contour>();

      this.getRightContour(v.leftSibling, 0, 0, rightContour);
      this.getLeftContour(v, 0, 0, leftContour);

      let maxShift = 0;
      const depths = new Set([...rightContour.keys(), ...leftContour.keys()]);
      depths.forEach(depth => {
        const right = rightContour.get(depth);
        const left = leftContour.get(depth);
        if (right && left) {
          const gap = left.top - right.bottom;
          const minGap = SIBLING_SPACING;
          if (gap < minGap) {
            const shift = minGap - gap;
            maxShift = Math.max(maxShift, shift);
          }
        }
      });

      if (maxShift > 0) {
        const shiftSubtree = (node: LayoutTreeNode, delta: number) => {
          node.y += delta;
          node.subtreeTop += delta;
          node.subtreeBottom += delta;
          node.preliminary += delta;
          if (!node.node.collapsed) {
            node.children.forEach(c => shiftSubtree(c, delta));
          }
        };
        shiftSubtree(v, maxShift);

        let parent = v.parent;
        while (parent) {
          parent.subtreeBottom = Math.max(parent.subtreeBottom, v.subtreeBottom);
          parent.subtreeHeight = parent.subtreeBottom - parent.subtreeTop;
          parent = parent.parent;
        }
      }
    }

    if (!v.node.collapsed) {
      v.children.forEach(child => {
        this.checkAndFixVerticalCollisions(child, level + 1);
      });
    }

    return v.subtreeHeight;
  }

  private firstWalk(v: LayoutTreeNode, level: number): void {
    if (v.children.length === 0 || v.node.collapsed || level >= 100) {
      if (v.leftSibling) {
        v.preliminary = v.leftSibling.preliminary + this.getWidth(v.leftSibling.node) / 2
          + this.getWidth(v.node) / 2 + SIBLING_SPACING;
      } else {
        v.preliminary = 0;
      }
      return;
    }

    v.children.forEach((child, idx) => {
      this.firstWalk(child, level + 1);
    });

    let midpoint = (v.children[0].preliminary + v.children[v.children.length - 1].preliminary) / 2;

    if (v.leftSibling) {
      v.preliminary = v.leftSibling.preliminary + this.getWidth(v.leftSibling.node) / 2
        + this.getWidth(v.node) / 2 + SIBLING_SPACING;
      v.mod = v.preliminary - midpoint;
    } else {
      v.preliminary = midpoint;
    }
  }

  private apportion(v: LayoutTreeNode, level: number): void {
    let w = v.leftSibling;
    if (!w) return;

    let vip: LayoutTreeNode | null = v;
    let vop: LayoutTreeNode | null = v;
    let vim: LayoutTreeNode | null = w;
    let vom: LayoutTreeNode | null = v.leftSibling;

    let sip = v.mod;
    let sop = v.mod;
    let sim = w.mod;
    let som = w.mod;

    while (vim && vip) {
      vim = this.nextRight(vim);
      vip = this.nextLeft(vip);
      if (vom) vom = this.nextLeft(vom);
      const nextVop = vop ? this.nextRight(vop) : null;
      if (nextVop) {
        vop = nextVop;
        (vop as LayoutTreeNode).ancestor = v;
      }

      if (vim && vip) {
        const shift = vim.preliminary + sim - (vip.preliminary + sip)
          + SUBTREE_SPACING + this.getWidth(vim.node) / 2 + this.getWidth(vip.node) / 2;

        if (shift > 0) {
          let ancestor = vim.ancestor || v;
          if (ancestor === vip.ancestor) ancestor = v;

          this.moveSubtree(ancestor, shift);
          sip += shift;
          sop += shift;
        }
      }

      if (vim) sim += vim.mod;
      if (vip) sip += vip.mod;
      if (vom) som += vom.mod;
      if (vop) sop += vop.mod;
    }

    if (vim && vop && !this.nextRight(vop)) {
      vop.thread = vim;
      vop.mod += sim - sop;
    }

    if (vip && vom && !this.nextLeft(vom)) {
      vom.thread = vip;
      vom.mod += sip - som;
      v.ancestor = v;
    }
  }

  private moveSubtree(w: LayoutTreeNode, shift: number): void {
    w.preliminary += shift;
    w.mod += shift;
  }

  private secondWalk(
    v: LayoutTreeNode,
    m: number,
    level: number,
    positions: Map<string, LayoutNodePosition>,
    parentX: number,
    parentY: number
  ): void {
    const centerY = v.preliminary + m;
    const nodeX = parentX === 0 ? 100 : parentX + HORIZONTAL_SPACING;

    v.x = nodeX;
    v.y = centerY;

    positions.set(v.node.id, {
      id: v.node.id,
      x: v.x - this.getWidth(v.node) / 2,
      y: v.y - v.node.height / 2,
    });

    if (!v.node.collapsed) {
      v.children.forEach(child => {
        this.secondWalk(
          child,
          m + v.mod,
          level + 1,
          positions,
          v.x + this.getWidth(v.node) / 2,
          v.y
        );
      });
    }
  }

  private calculateSubtreeHeights(trees: LayoutTreeNode[]): void {
    const calc = (v: LayoutTreeNode): number => {
      if (v.children.length === 0 || v.node.collapsed) {
        v.subtreeHeight = v.node.height;
        return v.subtreeHeight;
      }
      let total = 0;
      v.children.forEach((child, idx) => {
        total += calc(child);
        if (idx > 0) total += SIBLING_SPACING;
      });
      v.subtreeHeight = Math.max(v.node.height + VERTICAL_SPACING, total);
      return v.subtreeHeight;
    };
    trees.forEach(calc);
  }

  private arrangeYCoordinates(v: LayoutTreeNode, startY: number): number {
    if (v.children.length === 0 || v.node.collapsed) {
      v.y = startY + v.node.height / 2;
      return startY + v.node.height;
    }

    v.y = startY + v.node.height / 2;

    let currentY = startY + v.node.height + VERTICAL_SPACING;
    let maxBottom = startY + v.node.height;

    v.children.forEach(child => {
      const childHeight = child.subtreeHeight;
      const childCenterY = currentY + childHeight / 2;
      const result = this.arrangeYCoordinates(child, childCenterY - child.node.height / 2);
      maxBottom = Math.max(maxBottom, result);
      currentY = result + SIBLING_SPACING;
    });

    return maxBottom;
  }

  private normalizePositions(positions: Map<string, LayoutNodePosition>): LayoutNodePosition[] {
    const result = Array.from(positions.values());
    if (result.length === 0) return [];

    let minX = Infinity;
    let minY = Infinity;

    result.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
    });

    const offsetX = 100 - minX;
    const offsetY = 100 - minY;

    result.forEach(p => {
      p.x += offsetX;
      p.y += offsetY;
    });

    return result;
  }

  public calculate(nodes: Node[]): LayoutNodePosition[] {
    if (nodes.length === 0) return [];

    const visibleSet = new Set(nodes.map(n => n.id));
    const roots = this.buildTree(nodes, null, null, visibleSet);

    if (roots.length === 0) {
      return nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
    }

    this.linkSiblings(roots);
    this.calculateSubtreeHeights(roots);

    let currentX = 0;
    const positions = new Map<string, LayoutNodePosition>();

    roots.forEach((root, rootIdx) => {
      this.calculateSubtreeBounds(root, 100);
      if (rootIdx > 0) {
        this.checkAndFixVerticalCollisions(root, 0);
      }

      const rootPositions = new Map<string, LayoutNodePosition>();

      const layoutSubtree = (
        v: LayoutTreeNode,
        x: number,
        yOffset: number
      ): void => {
        const nodeX = x;
        const nodeY = v.y;

        rootPositions.set(v.node.id, {
          id: v.node.id,
          x: nodeX + currentX - v.node.width / 2,
          y: nodeY - v.node.height / 2,
        });

        if (!v.node.collapsed && v.children.length > 0) {
          v.children.forEach(child => {
            layoutSubtree(
              child,
              x + v.node.width + HORIZONTAL_SPACING,
              0
            );
          });
        }
      };

      layoutSubtree(root, 0, 0);

      let maxRootX = 0;
      rootPositions.forEach(p => {
        const n = nodes.find(nn => nn.id === p.id);
        if (n) maxRootX = Math.max(maxRootX, p.x + n.width);
      });

      rootPositions.forEach((p, id) => {
        positions.set(id, p);
      });

      currentX = maxRootX + SUBTREE_SPACING * 2;
    });

    const posArr = Array.from(positions.values());
    let minY = Infinity;
    posArr.forEach(p => {
      minY = Math.min(minY, p.y);
    });
    if (minY < 100) {
      const offsetY = 100 - minY;
      posArr.forEach(p => {
        p.y += offsetY;
      });
    }

    return this.normalizePositions(positions);
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
      const resultMap = new Map(result.map(p => [p.id, p]));
      const duration = 300;
      const startTime = performance.now();

      const animate = () => {
        const now = performance.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        const interpolated = currentPositions.map(cp => {
          const target = resultMap.get(cp.id) || cp;
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
