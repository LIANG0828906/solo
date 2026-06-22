export interface FileItem {
  id: string;
  name: string;
  content: string;
  timestamp: number;
  type: 'txt' | 'md';
}

const baseTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;

export const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    name: '项目规划.txt',
    content: '本项目旨在构建一个数字档案柜系统，用于管理和追溯文件的血缘关系。系统支持文件上传、版本管理、相似度分析和血缘图可视化。主要功能包括：文件列表管理、血缘关系自动计算、图形化展示、版本对比等。技术栈采用React和TypeScript，使用Vite作为构建工具。',
    timestamp: baseTimestamp,
    type: 'txt',
  },
  {
    id: 'file-2',
    name: '需求文档.md',
    content: '# 需求文档\n\n## 功能需求\n1. 用户可以上传文件\n2. 系统自动计算文件之间的相似度\n3. 展示文件血缘关系图\n4. 支持版本历史查看\n5. 提供文件详情和追溯功能\n\n## 非功能需求\n- 性能：100个文件以内分析时间小于200ms\n- 交互：节点拖拽保持60FPS\n- 界面：三栏布局，响应式设计',
    timestamp: baseTimestamp + 24 * 60 * 60 * 1000,
    type: 'md',
  },
  {
    id: 'file-3',
    name: '技术方案.txt',
    content: '技术方案概述：前端采用React 18 + TypeScript开发，构建工具使用Vite以获得更快的开发体验。状态管理使用React内置的useState和useContext。图形渲染采用react-flow-renderer库，用于展示血缘关系图。相似度算法使用Levenshtein编辑距离计算。整体架构采用模块化设计，分为FileManager、FileGenealogy和GenealogyGraph三个核心模块。',
    timestamp: baseTimestamp + 2 * 24 * 60 * 60 * 1000,
    type: 'txt',
  },
  {
    id: 'file-4',
    name: '项目规划v2.txt',
    content: '本项目旨在构建一个数字档案柜系统，用于管理和追溯文件的血缘关系。系统支持文件上传、版本管理、相似度分析和血缘图可视化。主要功能包括：文件列表管理、血缘关系自动计算、图形化展示、版本对比、差异高亮等。技术栈采用React和TypeScript，使用Vite作为构建工具。新增功能：支持文件导出、批量上传。',
    timestamp: baseTimestamp + 3 * 24 * 60 * 60 * 1000,
    type: 'txt',
  },
  {
    id: 'file-5',
    name: '需求文档v2.md',
    content: '# 需求文档 v2\n\n## 功能需求\n1. 用户可以上传文件\n2. 系统自动计算文件之间的相似度\n3. 展示文件血缘关系图（支持拖拽）\n4. 支持版本历史查看\n5. 提供文件详情和追溯功能\n6. 版本对比与差异高亮\n\n## 非功能需求\n- 性能：100个文件以内分析时间小于200ms\n- 交互：节点拖拽保持60FPS\n- 界面：三栏布局，响应式设计\n- 可访问性：支持键盘导航',
    timestamp: baseTimestamp + 4 * 24 * 60 * 60 * 1000,
    type: 'md',
  },
  {
    id: 'file-6',
    name: '技术方案v2.txt',
    content: '技术方案v2概述：前端采用React 18 + TypeScript开发，构建工具使用Vite以获得更快的开发体验。状态管理使用React内置的useState和useContext。图形渲染采用react-flow-renderer库，用于展示血缘关系图。相似度算法使用Levenshtein编辑距离计算。整体架构采用模块化设计，分为FileManager、FileGenealogy和GenealogyGraph三个核心模块。新增：性能优化方案、错误处理机制。',
    timestamp: baseTimestamp + 5 * 24 * 60 * 60 * 1000,
    type: 'txt',
  },
  {
    id: 'file-7',
    name: '项目规划最终版.txt',
    content: '本项目旨在构建一个数字档案柜系统，用于管理和追溯文件的血缘关系。系统支持文件上传、版本管理、相似度分析和血缘图可视化。主要功能包括：文件列表管理、血缘关系自动计算、图形化展示、版本对比、差异高亮等。技术栈采用React和TypeScript，使用Vite作为构建工具。新增功能：支持文件导出、批量上传、用户权限管理。',
    timestamp: baseTimestamp + 6 * 24 * 60 * 60 * 1000,
    type: 'txt',
  },
];

export function getRandomMockFile(): FileItem {
  const randomIndex = Math.floor(Math.random() * mockFiles.length);
  const baseFile = mockFiles[randomIndex];
  const newId = `file-${Date.now()}`;
  const versionNum = Math.floor(Math.random() * 10) + 1;
  const newName = baseFile.name.replace(/(\.[^.]+)$/, `_副本${versionNum}$1`);
  
  const modifications = [
    '（修改版）',
    ' Updated',
    ' 修订版',
    ' 新',
  ];
  const modIndex = Math.floor(Math.random() * modifications.length);
  const newContent = baseFile.content + '\n\n' + modifications[modIndex] + ' 新增内容：这是自动生成的派生文件，基于原始文件修改而来。';
  
  return {
    id: newId,
    name: newName,
    content: newContent,
    timestamp: Date.now(),
    type: baseFile.type,
  };
}
