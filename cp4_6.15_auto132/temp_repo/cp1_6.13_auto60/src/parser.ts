import { javascriptLanguage } from '@codemirror/lang-javascript'

const parser = javascriptLanguage.parser

export type NodeType =
  | 'VariableDeclaration'
  | 'FunctionDeclaration'
  | 'ArrowFunction'
  | 'IfStatement'
  | 'ForStatement'
  | 'ForInStatement'
  | 'ForOfStatement'
  | 'WhileStatement'
  | 'DoWhileStatement'
  | 'ExpressionStatement'
  | 'Block'
  | 'Other'

export interface SyntaxNode {
  id: string
  type: NodeType
  label: string
  code: string
  start: number
  end: number
  startLine: number
  endLine: number
  parentId: string | null
  childCount: number
}

export interface ParseResult {
  nodes: SyntaxNode[]
  parentMap: Map<string, string[]>
}

const NODE_TYPE_MAP: Record<string, NodeType> = {
  'VariableDeclaration': 'VariableDeclaration',
  'FunctionDeclaration': 'FunctionDeclaration',
  'ArrowFunction': 'ArrowFunction',
  'IfStatement': 'IfStatement',
  'ForStatement': 'ForStatement',
  'ForInStatement': 'ForInStatement',
  'ForOfStatement': 'ForOfStatement',
  'WhileStatement': 'WhileStatement',
  'DoWhileStatement': 'DoWhileStatement',
  'ExpressionStatement': 'ExpressionStatement',
  'Block': 'Block',
}

const TYPE_LABELS: Record<NodeType, string> = {
  VariableDeclaration: '变量声明',
  FunctionDeclaration: '函数声明',
  ArrowFunction: '箭头函数',
  IfStatement: '条件语句',
  ForStatement: 'For循环',
  ForInStatement: 'ForIn循环',
  ForOfStatement: 'ForOf循环',
  WhileStatement: 'While循环',
  DoWhileStatement: 'DoWhile循环',
  ExpressionStatement: '表达式语句',
  Block: '语句块',
  Other: '其他',
}

const CONTAINER_TYPES = new Set([
  'FunctionDeclaration',
  'ArrowFunction',
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'Block',
])

const SUPPORTED_TYPES = new Set([
  'VariableDeclaration',
  'FunctionDeclaration',
  'ArrowFunction',
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'ExpressionStatement',
  'Block',
])

function getLineFromPos(code: string, pos: number): number {
  return code.slice(0, Math.max(0, pos)).split('\n').length
}

function generateNodeLabel(type: NodeType, code: string, start: number, end: number): string {
  const snippet = code.slice(start, end).replace(/\s+/g, ' ').trim()
  const maxLen = 30

  switch (type) {
    case 'VariableDeclaration': {
      const match = snippet.match(/(?:const|let|var)\s+([a-zA-Z_$][\w$]*)/)
      return match ? `变量: ${match[1]}` : snippet.slice(0, maxLen)
    }
    case 'FunctionDeclaration': {
      const match = snippet.match(/function\s+([a-zA-Z_$][\w$]*)/)
      return match ? `函数: ${match[1]}` : '函数声明'
    }
    case 'ArrowFunction': {
      return '箭头函数'
    }
    case 'IfStatement': {
      const match = snippet.match(/if\s*\(([^)]+)\)/)
      return match ? `if (${match[1].trim().slice(0, 20)})` : 'if 语句'
    }
    case 'ForStatement':
      return 'for 循环'
    case 'ForInStatement':
      return 'for...in'
    case 'ForOfStatement':
      return 'for...of'
    case 'WhileStatement':
      return 'while 循环'
    case 'DoWhileStatement':
      return 'do-while 循环'
    case 'Block':
      return '语句块'
    case 'ExpressionStatement': {
      return snippet.length > maxLen ? snippet.slice(0, maxLen) + '…' : snippet
    }
    default:
      return snippet.slice(0, maxLen) || '节点'
  }
}

function stripComments(source: string): string {
  return source
    .replace(/\/\/[^\n]*/g, match => ' '.repeat(match.length))
    .replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length))
}

interface TreeWalkerNode {
  name: string
  from: number
  to: number
  firstChild: TreeWalkerNode | null
  lastChild: TreeWalkerNode | null
  nextSibling: TreeWalkerNode | null
  prevSibling: TreeWalkerNode | null
  parent: TreeWalkerNode | null
}

export function parseCode(sourceCode: string): ParseResult {
  const code = stripComments(sourceCode)

  const tree = parser.parse(code)
  const nodes: SyntaxNode[] = []
  const parentMap = new Map<string, string[]>()
  const idStack: string[] = []
  let idCounter = 0

  function addToParent(childId: string) {
    if (idStack.length > 0) {
      const parentId = idStack[idStack.length - 1]
      if (!parentMap.has(parentId)) {
        parentMap.set(parentId, [])
      }
      parentMap.get(parentId)!.push(childId)
    }
  }

  function walk(node: TreeWalkerNode): void {
    const nodeName = node.name
    const isContainer = CONTAINER_TYPES.has(nodeName)
    const isSupported = SUPPORTED_TYPES.has(nodeName)

    let currentId: string | null = null

    if (isSupported) {
      idCounter++
      currentId = `node_${idCounter}`
      const rawCode = code.slice(node.from, node.to)
      const cleanCode = rawCode.trim()
      const nodeType: NodeType = NODE_TYPE_MAP[nodeName] || 'Other'

      const nodeData: SyntaxNode = {
        id: currentId,
        type: nodeType,
        label: generateNodeLabel(nodeType, code, node.from, node.to),
        code: cleanCode,
        start: node.from,
        end: node.to,
        startLine: getLineFromPos(code, node.from),
        endLine: getLineFromPos(code, Math.max(node.to - 1, node.from)),
        parentId: idStack.length > 0 ? idStack[idStack.length - 1] : null,
        childCount: 0,
      }

      nodes.push(nodeData)
      addToParent(currentId)
      idStack.push(currentId)
    }

    if (node.firstChild) {
      walk(node.firstChild)
    }

    if (currentId) {
      idStack.pop()
      const idx = nodes.findIndex(n => n.id === currentId)
      if (idx !== -1) {
        nodes[idx].childCount = parentMap.get(currentId)?.length || 0
      }
    }

    if (node.nextSibling) {
      walk(node.nextSibling)
    }
  }

  if (tree.topNode) {
    walk(tree.topNode as unknown as TreeWalkerNode)
  }

  if (nodes.length === 0 && code.trim().length > 0) {
    const cleanCode = code.trim()
    nodes.push({
      id: 'node_1',
      type: 'ExpressionStatement',
      label: cleanCode.length > 30 ? cleanCode.slice(0, 30) + '…' : cleanCode,
      code: cleanCode,
      start: 0,
      end: code.length,
      startLine: 1,
      endLine: code.split('\n').length,
      parentId: null,
      childCount: 0,
    })
    parentMap.clear()
  }

  return { nodes, parentMap }
}

export function getNodeColor(type: NodeType): string {
  const colors: Record<NodeType, string> = {
    VariableDeclaration: '#3b82f6',
    FunctionDeclaration: '#10b981',
    ArrowFunction: '#06b6d4',
    IfStatement: '#f97316',
    ForStatement: '#8b5cf6',
    ForInStatement: '#a78bfa',
    ForOfStatement: '#c4b5fd',
    WhileStatement: '#a855f7',
    DoWhileStatement: '#c084fc',
    ExpressionStatement: '#6b7280',
    Block: '#475569',
    Other: '#374151',
  }
  return colors[type] || '#6b7280'
}

export function getTypeLabel(type: NodeType): string {
  return TYPE_LABELS[type] || '未知类型'
}

export function calculateNodeRadius(childCount: number): number {
  const minR = 30
  const maxR = 80
  const maxChildCount = 15
  const normalized = Math.min(childCount / maxChildCount, 1)
  return minR + normalized * (maxR - minR)
}
