import { v4 as uuidv4 } from 'uuid';
import type { CodeNode, CodeEdge, ModuleType } from '../../types';

export class CodeAnalyzer {
  private nodes: CodeNode[] = [];
  private edges: CodeEdge[] = [];
  private functionNames: string[] = [];

  analyze(code: string): { nodes: CodeNode[]; edges: CodeEdge[] } {
    this.nodes = [];
    this.edges = [];
    this.functionNames = [];

    const lines = code.split('\n');

    this.extractFunctions(code);
    this.extractClasses(code);
    this.buildCallGraph(code);
    this.assignPositions();

    return { nodes: this.nodes, edges: this.edges };
  }

  private extractFunctions(code: string): void {
    const functionRegex = /(?:export\s+)?(?:function|const|let|var)\s+(\w+)/g;
    let match;

    while ((match = functionRegex.exec(code)) !== null) {
      const name = match[1];
      if (name && !this.nodes.find((n) => n.name === name)) {
        this.functionNames.push(name);
        const moduleType = this.detectModuleType(name);
        const codeSnippet = this.extractFunctionCode(code, name);
        this.nodes.push({
          id: uuidv4(),
          name,
          type: 'function',
          moduleType,
          code: codeSnippet,
          position: { x: 0, y: 0, z: 0 },
          callCount: 0,
        });
      }
    }

    const methodRegex = /(\w+)\s*\([^)]*\)\s*\{/g;
    while ((match = methodRegex.exec(code)) !== null) {
      const name = match[1];
      if (
        name &&
        !/^(if|for|while|switch|catch|function|return|class|const|let|var|new|typeof|instanceof)$/.test(name) &&
        !this.nodes.find((n) => n.name === name)
      ) {
        this.functionNames.push(name);
        const moduleType = this.detectModuleType(name);
        const codeSnippet = this.extractFunctionCode(code, name);
        this.nodes.push({
          id: uuidv4(),
          name,
          type: 'function',
          moduleType,
          code: codeSnippet,
          position: { x: 0, y: 0, z: 0 },
          callCount: 0,
        });
      }
    }
  }

  private extractClasses(code: string): void {
    const classRegex = /class\s+(\w+)/g;
    let match;

    while ((match = classRegex.exec(code)) !== null) {
      const name = match[1];
      if (name && !this.nodes.find((n) => n.name === name)) {
        const moduleType = this.detectModuleType(name);
        const codeSnippet = this.extractClassCode(code, name);
        this.nodes.push({
          id: uuidv4(),
          name,
          type: 'class',
          moduleType,
          code: codeSnippet,
          position: { x: 0, y: 0, z: 0 },
          callCount: 0,
        });
      }
    }
  }

  private buildCallGraph(code: string): void {
    for (const node of this.nodes) {
      if (node.type !== 'function') continue;

      const funcCode = node.code;
      let callCount = 0;

      for (const otherNode of this.nodes) {
        if (otherNode.id === node.id) continue;

        const callRegex = new RegExp(`\\b${otherNode.name}\\s*\\(`, 'g');
        const matches = funcCode.match(callRegex);

        if (matches && matches.length > 0) {
          callCount += matches.length;
          otherNode.callCount += matches.length;

          const existingEdge = this.edges.find(
            (e) => e.source === node.id && e.target === otherNode.id
          );
          if (!existingEdge) {
            this.edges.push({
              id: uuidv4(),
              source: node.id,
              target: otherNode.id,
              weight: matches.length,
            });
          }
        }
      }
    }
  }

  private assignPositions(): void {
    const nodeCount = this.nodes.length;
    const radius = 8 + nodeCount * 0.3;
    const angleStep = (2 * Math.PI) / nodeCount;

    this.nodes.forEach((node, index) => {
      const angle = index * angleStep;
      const height = (Math.random() - 0.5) * 4;
      node.position = {
        x: Math.cos(angle) * radius,
        y: height,
        z: Math.sin(angle) * radius,
      };
    });
  }

  private detectModuleType(name: string): ModuleType {
    const utilPatterns = [
      'utils',
      'util',
      'helper',
      'helpers',
      'format',
      'parse',
      'convert',
      'validate',
      'check',
      'get',
      'set',
      'calc',
      'generate',
    ];
    const uiPatterns = [
      'component',
      'Component',
      'Button',
      'Modal',
      'Panel',
      'Card',
      'Input',
      'Form',
      'List',
      'Table',
      'Dialog',
      'Menu',
      'Nav',
      'Header',
      'Footer',
      'Sidebar',
      'Page',
      'View',
      'render',
      'Render',
    ];

    const lowerName = name.toLowerCase();

    if (uiPatterns.some((pattern) => lowerName.includes(pattern.toLowerCase()))) {
      return 'ui';
    }
    if (utilPatterns.some((pattern) => lowerName.includes(pattern.toLowerCase()))) {
      return 'util';
    }
    return 'business';
  }

  private extractFunctionCode(code: string, functionName: string): string {
    const lines = code.split('\n');
    let startLine = -1;
    let endLine = -1;
    let braceCount = 0;
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.includes(functionName) &&
        (line.includes('function') || line.includes('=>') || line.includes('{'))
      ) {
        if (startLine === -1) {
          startLine = i;
          found = true;
        }
      }

      if (found) {
        const openBraces = line.match(/\{/g)?.length || 0;
        const closeBraces = line.match(/\}/g)?.length || 0;
        braceCount += openBraces;
        braceCount -= closeBraces;

        if (startLine !== -1 && braceCount === 0 && i > startLine) {
          endLine = i;
          break;
        }
      }
    }

    if (startLine !== -1 && endLine !== -1 && startLine <= endLine) {
      return lines.slice(startLine, endLine + 1).join('\n');
    }

    return `function ${functionName}() {\n  // 代码片段\n}`;
  }

  private extractClassCode(code: string, className: string): string {
    const lines = code.split('\n');
    let startLine = -1;
    let endLine = -1;
    let braceCount = 0;
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(`class ${className}`)) {
        startLine = i;
        found = true;
      }

      if (found) {
        const openBraces = line.match(/\{/g)?.length || 0;
        const closeBraces = line.match(/\}/g)?.length || 0;
        braceCount += openBraces;
        braceCount -= closeBraces;

        if (braceCount === 0 && startLine !== i && found) {
          endLine = i;
          break;
        }
      }
    }

    if (startLine !== -1 && endLine !== -1 && startLine <= endLine) {
      return lines.slice(startLine, endLine + 1).join('\n');
    }

    return `class ${className} {\n  // 类定义\n}`;
  }
}
