import { v4 as uuidv4 } from 'uuid';
import type { Document, Comment, CommentReply, Version, DiffSegment } from './types';

function createInitialContent(text: string): string {
  const lines = text.split('\n');
  const content = {
    entityMap: {},
    blocks: lines.map((line) => ({
      key: uuidv4().slice(0, 8),
      type: line.trim() === '' ? 'unstyled' : 'unstyled',
      text: line,
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    })),
  };
  return JSON.stringify(content);
}

function extractPlainText(content: string): string {
  const parsed = JSON.parse(content);
  return parsed.blocks.map((block: { text: string }) => block.text).join('\n');
}

const initialDocumentId = uuidv4();

const initialText = '欢迎使用协同文档编辑器！\n\n这是一个支持实时批注和版本控制的文档编辑系统。\n\n主要功能：\n1. 富文本编辑\n2. 文本批注和回复\n3. 版本历史管理\n4. 版本差异对比\n\n您可以开始编辑此文档，选中文字添加批注，或保存重要版本。';

const initialContent = createInitialContent(initialText);

const initialDocument: Document = {
  id: initialDocumentId,
  content: initialContent,
  plainText: extractPlainText(initialContent),
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const initialComments: Comment[] = [];

const initialVersionId = uuidv4();
const initialVersions: Version[] = [
  {
    id: initialVersionId,
    version: 1,
    content: initialDocument.content,
    plainText: initialDocument.plainText,
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    description: '初始版本',
  },
];

export const store = {
  document: initialDocument,
  comments: initialComments,
  versions: initialVersions,
  versionCounter: 1,

  getDocument(): Document {
    return this.document;
  },

  getDocumentPlainText(): string {
    return this.document.plainText;
  },

  updateDocument(content: string, updatedBy: string = 'user'): Document {
    const plainText = extractPlainText(content);
    this.document = {
      ...this.document,
      content,
      plainText,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    return this.document;
  },

  getComments(): Comment[] {
    return this.comments;
  },

  addComment(
    text: string,
    startOffset: number,
    endOffset: number,
    content: string,
    author: string = 'user'
  ): Comment {
    const newComment: Comment = {
      id: uuidv4(),
      text,
      startOffset,
      endOffset,
      content,
      author,
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };
    this.comments.push(newComment);
    return newComment;
  },

  addCommentReply(commentId: string, content: string, author: string = 'user'): CommentReply | null {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return null;

    const reply: CommentReply = {
      id: uuidv4(),
      content,
      author,
      createdAt: new Date().toISOString(),
    };
    comment.replies.push(reply);
    return reply;
  },

  resolveComment(commentId: string, resolvedBy: string = 'user'): Comment | null {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return null;

    comment.resolved = true;
    comment.resolvedAt = new Date().toISOString();
    comment.resolvedBy = resolvedBy;
    return comment;
  },

  getVersions(): Version[] {
    return this.versions;
  },

  addVersion(createdBy: string = 'user', description?: string): Version {
    this.versionCounter += 1;
    const newVersion: Version = {
      id: uuidv4(),
      version: this.versionCounter,
      content: this.document.content,
      plainText: this.document.plainText,
      createdAt: new Date().toISOString(),
      createdBy,
      description,
    };
    this.versions.push(newVersion);
    return newVersion;
  },

  getVersionById(id: string): Version | null {
    return this.versions.find(v => v.id === id) || null;
  },

  computeDiff(baseContent: string, targetContent: string): DiffSegment[] {
    const baseLines = baseContent.split('\n');
    const targetLines = targetContent.split('\n');
    const m = baseLines.length;
    const n = targetLines.length;

    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (baseLines[i - 1] === targetLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const segments: DiffSegment[] = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && baseLines[i - 1] === targetLines[j - 1]) {
        segments.unshift({ type: 'unchanged', value: baseLines[i - 1], lineNumber: j });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        segments.unshift({ type: 'added', value: targetLines[j - 1], lineNumber: j });
        j--;
      } else {
        segments.unshift({ type: 'removed', value: baseLines[i - 1], lineNumber: j + 1 });
        i--;
      }
    }

    return segments;
  },
};

export { extractPlainText };
