import { CodeAnalyzer } from '../analyzer/CodeAnalyzer';
import { useAppStore } from '../../store/useAppStore';
import type { CodeNode, CodeEdge } from '../../types';

export class GitHubFetcher {
  private analyzer: CodeAnalyzer;

  constructor() {
    this.analyzer = new CodeAnalyzer();
  }

  async fetchRepo(repoUrl: string): Promise<void> {
    const setIsLoading = useAppStore.getState().setIsLoading;
    const setNodes = useAppStore.getState().setNodes;
    const setEdges = useAppStore.getState().setEdges;

    setIsLoading(true);

    try {
      const { owner, repo } = this.parseRepoUrl(repoUrl);
      const files = await this.fetchFileList(owner, repo);
      const allCode = await this.fetchAllFiles(owner, repo, files);
      const { nodes, edges } = this.analyzer.analyze(allCode);

      setNodes(nodes);
      setEdges(edges);
    } catch (error) {
      console.error('Failed to fetch GitHub repo:', error);
      this.loadDemoData();
    } finally {
      setIsLoading(false);
    }
  }

  private parseRepoUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL');
    }
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }

  private async fetchFileList(owner: string, repo: string): Promise<string[]> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const files: string[] = [];

      if (data.tree && Array.isArray(data.tree)) {
        for (const item of data.tree) {
          if (item.type === 'blob' && this.isCodeFile(item.path)) {
            files.push(item.path);
          }
        }
      }

      return files.slice(0, 20);
    } catch (error) {
      console.error('Failed to fetch file list:', error);
      return [];
    }
  }

  private async fetchAllFiles(owner: string, repo: string, files: string[]): Promise<string> {
    let allCode = '';

    for (const filePath of files.slice(0, 10)) {
      try {
        const content = await this.fetchFileContent(owner, repo, filePath);
        allCode += `\n// File: ${filePath}\n${content}\n`;
      } catch (error) {
        console.error(`Failed to fetch ${filePath}:`, error);
      }
    }

    return allCode;
  }

  private async fetchFileContent(owner: string, repo: string, filePath: string): Promise<string> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const data = await response.json();
    if (data.content) {
      return atob(data.content);
    }

    return '';
  }

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h'];
    return codeExtensions.some((ext) => filePath.endsWith(ext));
  }

  private loadDemoData(): void {
    const demoCode = `
// 工具函数模块
function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year + '-' + month + '-' + day;
}

function parseNumber(str) {
  return parseInt(str, 10);
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function validateEmail(email) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

// 业务逻辑模块
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

function processOrder(order) {
  const total = calculateTotal(order.items);
  const orderId = generateId();
  return {
    id: orderId,
    total: total,
    status: 'processed'
  };
}

function getUserProfile(userId) {
  return {
    id: userId,
    name: 'User ' + userId,
    email: 'user' + userId + '@example.com'
  };
}

function updateUserSettings(userId, settings) {
  const profile = getUserProfile(userId);
  return { ...profile, settings };
}

// UI组件模块
class ButtonComponent {
  constructor(label, onClick) {
    this.label = label;
    this.onClick = onClick;
  }

  render() {
    return '<button>' + this.label + '</button>';
  }

  handleClick() {
    if (this.onClick) {
      this.onClick();
    }
  }
}

class ModalComponent {
  constructor(title, content) {
    this.title = title;
    this.content = content;
    this.isOpen = false;
  }

  open() {
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
  }

  render() {
    if (!this.isOpen) return '';
    return '<div class="modal"><h2>' + this.title + '</h2><div>' + this.content + '</div></div>';
  }
}

class FormComponent {
  constructor(fields) {
    this.fields = fields;
    this.values = {};
  }

  setValue(fieldName, value) {
    this.values[fieldName] = value;
  }

  getValue(fieldName) {
    return this.values[fieldName];
  }

  validate() {
    let isValid = true;
    for (const field of this.fields) {
      if (field.required && !this.values[field.name]) {
        isValid = false;
      }
    }
    return isValid;
  }

  handleSubmit() {
    if (this.validate()) {
      return this.values;
    }
    return null;
  }
}

// 主程序
function main() {
  const order = {
    items: [
      { name: 'Item 1', price: 10, quantity: 2 },
      { name: 'Item 2', price: 20, quantity: 1 }
    ]
  };

  const processed = processOrder(order);
  const today = formatDate(new Date());
  const id = generateId();

  const submitBtn = new ButtonComponent('Submit', () => {
    console.log('Submitted');
  });

  console.log('Order processed:', processed);
  console.log('Today:', today);
  console.log('Generated ID:', id);
}

main();
`;

    const { nodes, edges } = this.analyzer.analyze(demoCode);
    useAppStore.getState().setNodes(nodes);
    useAppStore.getState().setEdges(edges);
  }
}
