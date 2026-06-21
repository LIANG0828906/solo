export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}

export function getUsername(): string | null {
  return localStorage.getItem('story_username');
}

export function setUsername(username: string): void {
  localStorage.setItem('story_username', username);
}

export function getBranchParagraphs(
  paragraphs: Array<{ id: string; parentParagraphId: string | null; branchId: string }>,
  branchId: string
): Array<{ id: string; parentParagraphId: string | null; branchId: string }> {
  const branchParagraphs = paragraphs.filter(p => p.branchId === branchId);
  
  const ordered: Array<{ id: string; parentParagraphId: string | null; branchId: string }> = [];
  let currentId: string | null = null;
  
  while (true) {
    const next = branchParagraphs.find(p => p.parentParagraphId === currentId);
    if (!next) break;
    ordered.push(next);
    currentId = next.id;
  }
  
  return ordered;
}

export function buildBranchTree(
  branches: Array<{ id: string; parentBranchId: string | null }>
): Array<{ 
  id: string; 
  parentBranchId: string | null; 
  children: Array<{ id: string; parentBranchId: string | null; children: unknown[] }> 
}> {
  const map = new Map<string, { 
    id: string; 
    parentBranchId: string | null; 
    children: Array<{ id: string; parentBranchId: string | null; children: unknown[] }> 
  }>();
  const roots: Array<{ 
    id: string; 
    parentBranchId: string | null; 
    children: Array<{ id: string; parentBranchId: string | null; children: unknown[] }> 
  }> = [];
  
  for (const branch of branches) {
    map.set(branch.id, { ...branch, children: [] });
  }
  
  for (const branch of branches) {
    const node = map.get(branch.id)!;
    if (branch.parentBranchId === null) {
      roots.push(node);
    } else {
      const parent = map.get(branch.parentBranchId);
      if (parent) {
        parent.children.push(node);
      }
    }
  }
  
  return roots;
}
