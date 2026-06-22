import type { LevelState, LevelTemplate, TemplateMeta } from '@/types/shared';

export async function listTemplates(): Promise<TemplateMeta[]> {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function getTemplate(id: string): Promise<LevelTemplate> {
  const res = await fetch(`/api/templates/${id}`);
  if (!res.ok) throw new Error('Failed to fetch template');
  return res.json();
}

export async function saveTemplate(name: string, level: LevelState): Promise<{ id: string; ok: boolean }> {
  const res = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, level }),
  });
  if (!res.ok) throw new Error('Failed to save template');
  return res.json();
}
