export interface DependencyNode {
  id: string;
  label: string;
  type: 'local' | 'third-party' | 'builtin';
  size: number;
  exports: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  referencedBy: string[];
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: 'local' | 'third-party' | 'builtin';
}

export interface ParseResult {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

const BUILTIN_MODULES = new Set([
  'fs', 'path', 'http', 'https', 'os', 'crypto', 'stream', 'buffer',
  'util', 'events', 'url', 'querystring', 'child_process', 'cluster',
  'dgram', 'dns', 'net', 'readline', 'repl', 'tls', 'tty', 'v8',
  'vm', 'zlib', 'assert', 'async_hooks', 'inspector', 'perf_hooks',
  'punycode', 'string_decoder', 'worker_threads', 'trace_events',
  'wasi', 'diagnostics_channel', 'console', 'process', 'timers', 'promises',
]);

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

function getModuleType(moduleName: string): 'local' | 'third-party' | 'builtin' {
  if (moduleName.startsWith('./') || moduleName.startsWith('../') || moduleName.startsWith('/')) {
    return 'local';
  }
  const baseName = moduleName.split('/')[0];
  if (BUILTIN_MODULES.has(baseName)) {
    return 'builtin';
  }
  return 'third-party';
}

function calcSize(refCount: number): number {
  return Math.min(80, Math.max(30, 30 + refCount * 10));
}

function randomPosition(): { x: number; y: number } {
  return {
    x: CENTER_X + (Math.random() - 0.5) * CANVAS_WIDTH,
    y: CENTER_Y + (Math.random() - 0.5) * CANVAS_HEIGHT,
  };
}

const RE_ES6_IMPORT_FROM = /import\s+(?:[\w*\s,{}]+\s+from\s+)?['"]([^'"]+)['"]/g;
const RE_ES6_SIDE_EFFECT = /import\s+['"]([^'"]+)['"]/g;
const RE_CJS_REQUIRE = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const RE_EXPORT_NAMED = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
const RE_EXPORT_DEFAULT = /export\s+default\s+(?:function\s+(\w+)|class\s+(\w+))?/g;
const RE_EXPORT_LIST = /export\s*\{([^}]+)\}/g;
const RE_EXPORT_ALL_FROM = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;

export function parseCode(code: string, fileName?: string): ParseResult {
  const rootLabel = fileName || 'root';
  const rootNode: DependencyNode = {
    id: rootLabel,
    label: rootLabel,
    type: 'local',
    size: 30,
    exports: [],
    x: CENTER_X,
    y: CENTER_Y,
    vx: 0,
    vy: 0,
    referencedBy: [],
  };

  const nodeMap = new Map<string, DependencyNode>();
  nodeMap.set(rootLabel, rootNode);

  const edges: DependencyEdge[] = [];
  const moduleRefs = new Map<string, number>();

  function ensureNode(moduleName: string): DependencyNode {
    if (nodeMap.has(moduleName)) {
      return nodeMap.get(moduleName)!;
    }
    const type = getModuleType(moduleName);
    const pos = randomPosition();
    const node: DependencyNode = {
      id: moduleName,
      label: moduleName,
      type,
      size: 30,
      exports: [],
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      referencedBy: [],
    };
    nodeMap.set(moduleName, node);
    return node;
  }

  function addImport(moduleName: string) {
    const type = getModuleType(moduleName);
    ensureNode(moduleName);
    const count = (moduleRefs.get(moduleName) || 0) + 1;
    moduleRefs.set(moduleName, count);
    edges.push({ source: rootLabel, target: moduleName, type });
  }

  let match: RegExpExecArray | null;

  RE_ES6_IMPORT_FROM.lastIndex = 0;
  while ((match = RE_ES6_IMPORT_FROM.exec(code)) !== null) {
    addImport(match[1]);
  }

  RE_ES6_SIDE_EFFECT.lastIndex = 0;
  while ((match = RE_ES6_SIDE_EFFECT.exec(code)) !== null) {
    addImport(match[1]);
  }

  RE_CJS_REQUIRE.lastIndex = 0;
  while ((match = RE_CJS_REQUIRE.exec(code)) !== null) {
    addImport(match[1]);
  }

  RE_EXPORT_NAMED.lastIndex = 0;
  while ((match = RE_EXPORT_NAMED.exec(code)) !== null) {
    rootNode.exports.push(match[1]);
  }

  RE_EXPORT_DEFAULT.lastIndex = 0;
  while ((match = RE_EXPORT_DEFAULT.exec(code)) !== null) {
    const name = match[1] || match[2] || 'default';
    rootNode.exports.push(name);
  }

  RE_EXPORT_LIST.lastIndex = 0;
  while ((match = RE_EXPORT_LIST.exec(code)) !== null) {
    const items = match[1].split(',');
    for (const item of items) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+as\s+/);
      const exportedName = parts.length > 1 ? parts[1] : parts[0];
      rootNode.exports.push(exportedName.trim());
    }
  }

  RE_EXPORT_ALL_FROM.lastIndex = 0;
  while ((match = RE_EXPORT_ALL_FROM.exec(code)) !== null) {
    addImport(match[1]);
  }

  for (const [moduleName, count] of moduleRefs) {
    const node = nodeMap.get(moduleName)!;
    node.size = calcSize(count);
  }

  rootNode.size = calcSize(rootNode.exports.length);

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}
