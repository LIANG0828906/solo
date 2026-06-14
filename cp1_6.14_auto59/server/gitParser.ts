import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FileChange {
  filename: string;
  additions: number;
  deletions: number;
}

export interface CommitData {
  sha: string;
  author: string;
  date: string;
  message: string;
  files: FileChange[];
  additions: number;
  deletions: number;
}

interface RawCommit {
  sha: string;
  author: string;
  date: string;
  message: string;
  files: FileChange[];
}

export async function parseGitLog(repoPath: string): Promise<CommitData[]> {
  try {
    const format = '%H|%an|%ai|%s';
    const command = `git log --since=30.days --format="${format}" --numstat`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: repoPath,
      maxBuffer: 1024 * 1024 * 10,
      windowsHide: true,
    });

    if (stderr && !stderr.includes('warning')) {
      console.warn('Git warning:', stderr);
    }

    return parseGitLogOutput(stdout);
  } catch (error) {
    console.error('Git log error:', error);
    throw error;
  }
}

function parseGitLogOutput(output: string): CommitData[] {
  const lines = output.split('\n');
  const commits: CommitData[] = [];
  let currentCommit: RawCommit | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const commitMatch = trimmed.match(/^"?([0-9a-f]{40})\|([^|]+)\|([^|]+)\|(.+)"?$/);
    if (commitMatch) {
      if (currentCommit) {
        commits.push(finalizeCommit(currentCommit));
      }
      currentCommit = {
        sha: commitMatch[1],
        author: commitMatch[2].trim(),
        date: commitMatch[3].trim(),
        message: commitMatch[4].trim(),
        files: [],
      };
    } else {
      const numstatMatch = trimmed.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
      if (numstatMatch && currentCommit) {
        const additions = numstatMatch[1] === '-' ? 0 : parseInt(numstatMatch[1], 10);
        const deletions = numstatMatch[2] === '-' ? 0 : parseInt(numstatMatch[2], 10);
        const filename = numstatMatch[3].trim();
        currentCommit.files.push({ filename, additions, deletions });
      }
    }
  }

  if (currentCommit) {
    commits.push(finalizeCommit(currentCommit));
  }

  return commits;
}

function finalizeCommit(raw: RawCommit): CommitData {
  const additions = raw.files.reduce((sum, f) => sum + f.additions, 0);
  const deletions = raw.files.reduce((sum, f) => sum + f.deletions, 0);
  return { ...raw, additions, deletions };
}

export function getMockCommits(): CommitData[] {
  const authors = ['张伟', '李娜', '王强', '刘芳', '陈明'];
  const fileTypes = ['.ts', '.tsx', '.js', '.css', '.json', '.md', '.py'];
  const messages = [
    '修复用户登录bug', '添加新功能模块', '重构代码结构', '优化性能', '修复样式问题',
    '添加单元测试', '更新依赖版本', '完善文档', '修复内存泄漏', '优化数据库查询',
    '添加API接口', '改进错误处理', '优化构建配置', '修复安全漏洞', '添加国际化支持',
  ];
  const commits: CommitData[] = [];
  const now = new Date();

  for (let i = 0; i < 85; i++) {
    const date = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
    const fileCount = Math.floor(Math.random() * 8) + 1;
    const files: FileChange[] = [];
    let totalAdd = 0;
    let totalDel = 0;

    for (let j = 0; j < fileCount; j++) {
      const adds = Math.floor(Math.random() * 100);
      const dels = Math.floor(Math.random() * 50);
      totalAdd += adds;
      totalDel += dels;
      files.push({
        filename: `src/components/Component${i}_${j}${fileTypes[Math.floor(Math.random() * fileTypes.length)]}`,
        additions: adds,
        deletions: dels,
      });
    }

    const sha = Array.from({ length: 40 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');

    commits.push({
      sha,
      author: authors[Math.floor(Math.random() * authors.length)],
      date: date.toISOString(),
      message: messages[Math.floor(Math.random() * messages.length)],
      files,
      additions: totalAdd,
      deletions: totalDel,
    });
  }

  return commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
