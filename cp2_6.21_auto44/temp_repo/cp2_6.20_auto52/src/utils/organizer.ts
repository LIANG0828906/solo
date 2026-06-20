import { v4 as uuidv4 } from 'uuid';
import type { DesktopIcon, OrganizeSuggestion } from '@/types';
import { CATEGORIZE_RULES } from '@/types';

export function analyzeIconType(icon: DesktopIcon): string | null {
  const name = icon.name.toLowerCase();
  const label = icon.label.toLowerCase();
  
  const tags: string[] = icon.metadata?.tags ? 
    (icon.metadata.tags as string[]).map(t => t.toLowerCase()) : [];
  
  const metadataStr = icon.metadata ? 
    Object.values(icon.metadata).map(v => String(v).toLowerCase()).join(' ') : '';
  
  const combinedText = `${name} ${label} ${tags.join(' ')} ${metadataStr}`;
  
  for (const rule of CATEGORIZE_RULES) {
    for (const ext of rule.extensions) {
      if (name.endsWith(ext) || label.endsWith(ext)) {
        return rule.name;
      }
    }
    for (const keyword of rule.keywords) {
      if (combinedText.includes(keyword)) {
        return rule.name;
      }
    }
  }
  
  for (const tag of tags) {
    const matched = CATEGORIZE_RULES.find(r => 
      r.name.toLowerCase() === tag ||
      r.keywords.some(k => k.includes(tag) || tag.includes(k))
    );
    if (matched) return matched.name;
  }
  
  if (icon.type === 'document') return '文档';
  if (icon.type === 'app') return '应用';
  if (icon.type === 'link') return '链接';
  if (icon.color) {
    const color = icon.color.toLowerCase();
    if (color.includes('6b9ac4')) return '应用';
    if (color.includes('8fb98f')) return '文件夹';
    if (color.includes('e6b87d')) return '文档';
    if (color.includes('c48fb1')) return '链接';
  }
  
  return null;
}

export function generateSuggestions(icons: DesktopIcon[]): OrganizeSuggestion[] {
  const categoryMap = new Map<string, string[]>();
  
  const desktopIcons = icons.filter(i => i.parentId === null && i.type !== 'folder');
  
  for (const icon of desktopIcons) {
    const category = analyzeIconType(icon);
    if (category) {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(icon.id);
    }
  }
  
  const suggestions: OrganizeSuggestion[] = [];
  
  categoryMap.forEach((iconIds, folderName) => {
    if (iconIds.length >= 2) {
      suggestions.push({
        folderName,
        iconIds,
        reason: `检测到 ${iconIds.length} 个${folderName}类型文件`,
      });
    }
  });
  
  return suggestions;
}

export function applySuggestions(
  suggestions: OrganizeSuggestion[],
  icons: DesktopIcon[],
  existingFolders: Array<{ id: string; name: string }>
): {
  updatedIcons: DesktopIcon[];
  newFolders: Array<{ id: string; name: string; iconIds: string[] }>;
} {
  const updatedIcons = [...icons];
  const newFolders: Array<{ id: string; name: string; iconIds: string[] }> = [];
  const now = Date.now();
  
  for (const suggestion of suggestions) {
    let folder = existingFolders.find(f => f.name === suggestion.folderName);
    let folderId: string;
    
    if (!folder) {
      folderId = uuidv4();
      newFolders.push({
        id: folderId,
        name: suggestion.folderName,
        iconIds: suggestion.iconIds,
      });
    } else {
      folderId = folder.id;
    }
    
    suggestion.iconIds.forEach(iconId => {
      const iconIndex = updatedIcons.findIndex(i => i.id === iconId);
      if (iconIndex !== -1) {
        updatedIcons[iconIndex] = {
          ...updatedIcons[iconIndex],
          parentId: folderId,
          updatedAt: now,
        };
      }
    });
  }
  
  return { updatedIcons, newFolders };
}
