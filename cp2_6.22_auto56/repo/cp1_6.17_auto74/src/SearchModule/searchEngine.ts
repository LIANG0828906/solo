import type { Note } from '../types';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function searchNotes(keyword: string, notes: Note[]): string[] {
  if (!keyword.trim()) {
    return notes.map(note => note.id);
  }

  const lowerKeyword = keyword.toLowerCase().trim();

  return notes
    .filter(note => {
      const titleMatch = note.title.toLowerCase().includes(lowerKeyword);
      const content = stripHtml(note.content);
      const contentMatch = content.toLowerCase().includes(lowerKeyword);
      const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(lowerKeyword));
      return titleMatch || contentMatch || tagMatch;
    })
    .map(note => note.id);
}

export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword.trim()) return text;
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  return text.replace(regex, '<mark style="background-color: #FFFF00;">$1</mark>');
}
