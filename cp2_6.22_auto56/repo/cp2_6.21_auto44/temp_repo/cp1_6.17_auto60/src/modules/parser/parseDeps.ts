import { v4 as uuid } from 'uuid';
import type { DepGraph, DepEdge, FileNode, ImportInfo, ImportType } from '../../types';
import { extractImports, classifyImport } from './extractImports';

function pathToName(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || p;
}

function buildFileTree(paths: string[]): Map<string, FileNode> {
  const nodeMap = new Map<string, FileNode>();
  const dirSet = new Set<string>();

  paths.forEach((p) => {
    const norm = p.replace(/\\/g, '/');
    const segs = norm.split('/');
    for (let i = 1; i < segs.length; i++) {
      dirSet.add(segs.slice(0, i).join('/'));
    }
  });

  const dirs = Array.from(dirSet).sort();
  dirs.forEach((d) => {
    const id = uuid();
    nodeMap.set(d, {
      id,
      path: d,
      name: pathToName(d),
      isDirectory: true,
      imports: [],
      importedBy: [],
      children: [],
    });
  });

  paths.forEach((p) => {
    const norm = p.replace(/\\/g, '/');
    const id = uuid();
    const lastSlash = norm.lastIndexOf('/');
    const parentPath = lastSlash > 0 ? norm.slice(0, lastSlash) : undefined;
    const fileNode: FileNode = {
      id,
      path: norm,
      name: pathToName(norm),
      isDirectory: false,
      imports: [],
      importedBy: [],
      parentId: parentPath ? nodeMap.get(parentPath)?.id : undefined,
    };
    nodeMap.set(norm, fileNode);
    if (parentPath) {
      const parent = nodeMap.get(parentPath);
      if (parent && parent.children) parent.children.push(fileNode);
    }
  });

  nodeMap.forEach((n) => {
    if (n.isDirectory && n.children) {
      n.children.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }
  });

  return nodeMap;
}

function resolveRelative(from: string, imp: string): string {
  const fromDir = from.slice(0, Math.max(0, from.lastIndexOf('/')));
  let cur = imp.startsWith('/') ? imp : fromDir + '/' + imp;
  const parts: string[] = [];
  cur.split('/').forEach((seg) => {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  });
  return parts.join('/');
}

function detectCycles(nodes: FileNode[], edges: DepEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    const list = adj.get(e.source);
    if (list) list.push(e.target);
  });

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Map<string, number>();
  const path: string[] = [];
  const seen = new Set<string>();

  function dfs(id: string) {
    if (recStack.has(id)) {
      const start = recStack.get(id)!;
      const cycle = path.slice(start);
      const key = [...cycle].sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        cycles.push([...cycle, cycle[0]]);
      }
      return;
    }
    if (visited.has(id)) return;
    visited.add(id);
    recStack.set(id, path.length);
    path.push(id);
    (adj.get(id) || []).forEach(dfs);
    path.pop();
    recStack.delete(id);
  }

  nodes.forEach((n) => {
    if (!visited.has(n.id)) dfs(n.id);
  });

  return cycles;
}

interface RawFile {
  path: string;
  content: string;
}

export async function parseDeps(rootPath: string, files?: RawFile[]): Promise<DepGraph> {
  const filePaths: string[] = [];
  const contents = new Map<string, string>();

  if (files && files.length) {
    files.forEach((f) => {
      filePaths.push(f.path);
      contents.set(f.path.replace(/\\/g, '/'), f.content);
    });
  }

  const nodeMap = buildFileTree(filePaths);
  const idToPath = new Map<string, string>();
  nodeMap.forEach((n, p) => idToPath.set(n.id, p));

  const edges: DepEdge[] = [];
  const edgeDedup = new Set<string>();

  nodeMap.forEach((node, filePath) => {
    if (node.isDirectory) return;
    const src = contents.get(filePath);
    if (!src) return;
    const imports: ImportInfo[] = extractImports(src, filePath);
    node.imports = imports;

    imports.forEach((imp) => {
      let targetPath: string | undefined;
      if (imp.type === 'internal') {
        const resolved = resolveRelative(filePath, imp.path);
        const cands = [
          resolved,
          resolved + '.ts',
          resolved + '.tsx',
          resolved + '.js',
          resolved + '.jsx',
          resolved + '/index.ts',
          resolved + '/index.tsx',
          resolved + '/index.js',
        ];
        targetPath = cands.find((c) => nodeMap.has(c));
        if (targetPath) imp.resolvedPath = targetPath;
      }

      if (targetPath) {
        const targetNode = nodeMap.get(targetPath);
        if (targetNode) {
          const key = node.id + '->' + targetNode.id;
          if (!edgeDedup.has(key)) {
            edgeDedup.add(key);
            edges.push({
              id: uuid(),
              source: node.id,
              target: targetNode.id,
              type: imp.type,
            });
            if (!targetNode.importedBy.includes(node.id)) {
              targetNode.importedBy.push(node.id);
            }
          }
        }
      }
    });
  });

  const nodes = Array.from(nodeMap.values());
  const cycles = detectCycles(nodes, edges);

  return {
    nodes,
    edges,
    cycles,
    rootPath,
  };
}

export function generateDemoGraph(): DepGraph {
  const root = '/demo-project';
  const rawFiles: RawFile[] = [
    {
      path: root + '/index.ts',
      content: `
        import React from 'react';
        import { App } from './components/App';
        import { store } from './store';
        import { util } from '@scope/utils';
      `,
    },
    {
      path: root + '/components/App.tsx',
      content: `
        import { useState } from 'react';
        import { Header } from './Header';
        import { Sidebar } from './Sidebar';
        import { GraphView } from './GraphView';
        import { useStore } from '../store';
        import classNames from 'classnames';
      `,
    },
    {
      path: root + '/components/Header.tsx',
      content: `
        import React from 'react';
        import { SearchBar } from './SearchBar';
        import { useStore } from '../store';
      `,
    },
    {
      path: root + '/components/Sidebar.tsx',
      content: `
        import React from 'react';
        import { FileTree } from './FileTree';
        import { useStore } from '../store';
      `,
    },
    {
      path: root + '/components/GraphView.tsx',
      content: `
        import React, { useEffect, useRef } from 'react';
        import { GraphRenderer } from '../modules/graph/GraphRenderer';
        import { GraphEvents } from '../modules/graph/GraphEvents';
        import { useStore } from '../store';
      `,
    },
    {
      path: root + '/components/SearchBar.tsx',
      content: `
        import React from 'react';
      `,
    },
    {
      path: root + '/components/FileTree.tsx',
      content: `
        import React from 'react';
        import { useStore } from '../store';
      `,
    },
    {
      path: root + '/store.ts',
      content: `
        import { create } from 'zustand';
        import type { DepGraph } from './types';
        import { parseDeps } from './modules/parser/parseDeps';
      `,
    },
    {
      path: root + '/types.ts',
      content: `
        export type ImportType = 'internal' | 'external';
      `,
    },
    {
      path: root + '/modules/parser/parseDeps.ts',
      content: `
        import { extractImports } from './extractImports';
        import { classifyImport } from './extractImports';
      `,
    },
    {
      path: root + '/modules/parser/extractImports.ts',
      content: `
        export function extractImports(src: string) { return []; }
        export function classifyImport(p: string) { return 'internal' as const; }
      `,
    },
    {
      path: root + '/modules/graph/GraphRenderer.ts',
      content: `
        import * as d3 from 'd3';
        import { GraphEvents } from './GraphEvents';
      `,
    },
    {
      path: root + '/modules/graph/GraphEvents.ts',
      content: `
        export class GraphEvents {
          constructor() {}
        }
      `,
    },
  ];

  return parseDepsSync(root, rawFiles);
}

function parseDepsSync(rootPath: string, files: RawFile[]): DepGraph {
  const filePaths: string[] = files.map((f) => f.path);
  const contents = new Map<string, string>();
  files.forEach((f) => contents.set(f.path.replace(/\\/g, '/'), f.content));

  const nodeMap = buildFileTree(filePaths);
  const edges: DepEdge[] = [];
  const edgeDedup = new Set<string>();

  nodeMap.forEach((node, filePath) => {
    if (node.isDirectory) return;
    const src = contents.get(filePath);
    if (!src) return;
    const imports: ImportInfo[] = extractImports(src, filePath);
    node.imports = imports;

    imports.forEach((imp) => {
      let targetPath: string | undefined;
      if (imp.type === 'internal') {
        const resolved = resolveRelative(filePath, imp.path);
        const cands = [
          resolved,
          resolved + '.ts',
          resolved + '.tsx',
          resolved + '.js',
          resolved + '.jsx',
          resolved + '/index.ts',
          resolved + '/index.tsx',
          resolved + '/index.js',
        ];
        targetPath = cands.find((c) => nodeMap.has(c));
        if (targetPath) imp.resolvedPath = targetPath;
      }

      if (targetPath) {
        const targetNode = nodeMap.get(targetPath);
        if (targetNode) {
          const key = node.id + '->' + targetNode.id;
          if (!edgeDedup.has(key)) {
            edgeDedup.add(key);
            edges.push({
              id: uuid(),
              source: node.id,
              target: targetNode.id,
              type: imp.type,
            });
            if (!targetNode.importedBy.includes(node.id)) {
              targetNode.importedBy.push(node.id);
            }
          }
        }
      }
    });
  });

  const nodes = Array.from(nodeMap.values());
  const cycles = detectCycles(nodes, edges);

  return { nodes, edges, cycles, rootPath };
}

export type { ImportType };
