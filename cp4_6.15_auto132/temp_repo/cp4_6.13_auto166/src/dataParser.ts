export interface CommitRecord {
  sha: string;
  author: string;
  timestamp: number;
  linesAdded: number;
  linesDeleted: number;
  branch: string;
  message: string;
  files?: string[];
}

export interface ParseResult {
  success: boolean;
  data?: CommitRecord[];
  error?: string;
}

const REQUIRED_FIELDS: { field: keyof CommitRecord; type: string; allowEmpty?: boolean }[] = [
  { field: 'sha', type: 'string' },
  { field: 'author', type: 'string' },
  { field: 'timestamp', type: 'number' },
  { field: 'linesAdded', type: 'number' },
  { field: 'linesDeleted', type: 'number' },
  { field: 'branch', type: 'string' },
  { field: 'message', type: 'string' },
];

function validateRecord(record: unknown, index: number): string | null {
  if (record === null || record === undefined || typeof record !== 'object') {
    return `第 ${index + 1} 条记录不是有效对象`;
  }

  const obj = record as Record<string, unknown>;

  for (const { field, type, allowEmpty } of REQUIRED_FIELDS) {
    if (!(field in obj)) {
      return `第 ${index + 1} 条记录缺少必填字段 "${field}"`;
    }

    const value = obj[field];

    if (typeof value !== type) {
      return `第 ${index + 1} 条记录字段 "${field}" 类型错误，期望 ${type}，实际 ${typeof value}`;
    }

    if (type === 'string' && !allowEmpty && (value as string).trim() === '') {
      return `第 ${index + 1} 条记录字段 "${field}" 不能为空字符串`;
    }

    if (type === 'number') {
      if (field === 'timestamp' && (value as number) <= 0) {
        return `第 ${index + 1} 条记录字段 "${field}" 必须大于 0`;
      }
      if ((field === 'linesAdded' || field === 'linesDeleted') && (value as number) < 0) {
        return `第 ${index + 1} 条记录字段 "${field}" 不能为负数`;
      }
    }
  }

  return null;
}

export function parseCommitLog(raw: unknown): ParseResult {
  if (!Array.isArray(raw)) {
    return { success: false, error: '数据必须是数组格式' };
  }

  if (raw.length === 0) {
    return { success: false, error: '提交记录为空' };
  }

  for (let i = 0; i < raw.length; i++) {
    const error = validateRecord(raw[i], i);
    if (error) {
      return { success: false, error };
    }
  }

  const data: CommitRecord[] = raw.map((item: Record<string, unknown>) => ({
    sha: String(item.sha),
    author: String(item.author),
    timestamp: Number(item.timestamp),
    linesAdded: Number(item.linesAdded),
    linesDeleted: Number(item.linesDeleted),
    branch: String(item.branch),
    message: String(item.message),
    files: Array.isArray(item.files) ? (item.files as string[]) : [],
  }));

  data.sort((a, b) => a.timestamp - b.timestamp);

  return { success: true, data };
}

export function parseJSONString(jsonStr: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { success: false, error: 'JSON 解析失败，请检查格式' };
  }
  return parseCommitLog(parsed);
}
