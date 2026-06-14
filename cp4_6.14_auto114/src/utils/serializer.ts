import type { ParamItem, Snapshot, SerializableConfig } from '@/store/types';

export function exportConfig(state: {
  params: ParamItem[];
  snapshots: Snapshot[];
  activeSnapshotId: string | null;
}): string {
  const config: SerializableConfig = {
    params: state.params,
    snapshots: state.snapshots,
    activeSnapshotId: state.activeSnapshotId,
  };
  return JSON.stringify(config, null, 2);
}

export function importConfig(jsonString: string): SerializableConfig | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.params)) return null;
    for (const p of parsed.params) {
      if (typeof p.id !== 'string') return null;
      if (typeof p.name !== 'string') return null;
      if (!['string', 'number', 'boolean', 'enum'].includes(p.type)) return null;
      if (typeof p.defaultValue !== 'string') return null;
      if (typeof p.currentValue !== 'string') return null;
      if (p.type === 'enum' && !Array.isArray(p.enumOptions)) return null;
    }
    if (!Array.isArray(parsed.snapshots)) return null;
    for (const s of parsed.snapshots) {
      if (typeof s.id !== 'string') return null;
      if (typeof s.name !== 'string') return null;
      if (!Array.isArray(s.params)) return null;
    }
    if (parsed.activeSnapshotId !== null && typeof parsed.activeSnapshotId !== 'string') return null;
    return parsed as SerializableConfig;
  } catch {
    return null;
  }
}
