export interface ParamItem {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  defaultValue: string;
  currentValue: string;
  enumOptions?: string[];
}

export interface Snapshot {
  id: string;
  name: string;
  params: ParamItem[];
}

export interface SerializableConfig {
  params: ParamItem[];
  snapshots: Snapshot[];
  activeSnapshotId: string | null;
}
