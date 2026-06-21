export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#FFE066',
  green: '#75D701',
  blue: '#7EC8E3',
  pink: '#FFB7B2',
  purple: '#C3AED6',
};

export const HIGHLIGHT_COLOR_LIST: HighlightColor[] = [
  'yellow',
  'green',
  'blue',
  'pink',
  'purple',
];

export interface User {
  id: string;
  nickname: string;
  color: string;
  avatarIndex: number;
}

export interface HighlightRange {
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface Highlight {
  id: string;
  userId: string;
  color: HighlightColor;
  range: HighlightRange;
  createdAt: number;
}

export interface Comment {
  id: string;
  highlightId: string;
  userId: string;
  content: string;
  timestamp: number;
}

export type SyncMessageType =
  | 'highlight:add'
  | 'highlight:remove'
  | 'comment:add'
  | 'user:join'
  | 'user:leave';

export interface SyncMessage {
  type: SyncMessageType;
  payload: Highlight | Comment | User;
  roomId: string;
  senderId: string;
  timestamp: number;
}

export interface SelectionPosition {
  x: number;
  y: number;
}

export const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];

export const RANDOM_NICKNAMES = [
  '晨曦',
  '墨白',
  '清风',
  '明月',
  '星河',
  '流云',
  '青山',
  '绿水',
  '紫烟',
  '红霞',
];

export const DEFAULT_DOCUMENT = `# 在线协作文档标注系统

## 项目介绍

欢迎使用在线交互式文档高亮标注与协作批注应用。这是一个专为远程办公和在线教学场景设计的轻量级协作工具。

## 主要功能

### 1. 高亮标注

您可以使用鼠标在文档上拖拽选择任意文本段落，选择后会弹出颜色选择面板，提供五种预设高亮颜色：黄色、绿色、蓝色、粉色和紫色。点击任意颜色即可为所选文本添加半透明高亮背景。

### 2. 批注讨论

点击已高亮的文本区域，会弹出批注输入框。您可以在这里输入您的评论、想法或问题，按回车键或点击发送按钮即可提交。批注会以气泡形式显示在高亮区域旁边，包含您的昵称、批注内容和时间戳。

### 3. 实时协作

创建或加入一个房间后，您和团队成员可以在同一文档上同时进行标注和批注。所有操作都会实时同步（延迟<200ms），您可以看到其他用户的高亮区域（带有虚线边框标识），悬停时还会显示对方的昵称。

### 4. PDF导出

完成标注后，点击右上角的导出按钮，可以将文档内容、所有高亮区域和批注合并生成一个PDF文件并自动下载。高亮以底纹形式呈现，批注以脚注形式附在文档末尾。

## 使用场景

本系统适用于多种协作场景：

- **远程团队评审**：产品文档、设计文档、技术方案的协作评审
- **在线教学**：教师与学生在教材或论文上进行标注讨论
- **会议记录**：团队成员在会议纪要上实时添加重点和意见
- **合同审核**：法律团队在合同文档上标记需要修改的条款

## 开始使用

现在就尝试选择这段文字，体验高亮标注功能吧！您也可以点击已有的高亮区域添加批注，与团队成员展开讨论。

祝您使用愉快！
`;
