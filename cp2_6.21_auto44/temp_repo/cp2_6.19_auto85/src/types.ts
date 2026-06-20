export type PropType = 'color' | 'slider' | 'select' | 'text' | 'boolean';

export interface PropDefinition {
  key: string;
  label: string;
  type: PropType;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  unit?: string;
  category?: string;
}

export interface ComponentPreset {
  name: string;
  props: Record<string, any>;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  icon: string;
  props: PropDefinition[];
  defaultProps: Record<string, any>;
  presets: ComponentPreset[];
}
