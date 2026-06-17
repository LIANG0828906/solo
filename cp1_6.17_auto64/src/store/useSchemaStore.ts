import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SchemaFile, JSONSchema, DiffResult } from '@/types/schema';
import { diff } from '@/utils/diff';
import { loadMockSchema, getAvailableMockSchemas } from '@/utils/schemaLoader';

interface SchemaState {
  schemas: SchemaFile[];
  selectedOldId: string | null;
  selectedNewId: string | null;
  selectedFieldPath: string[] | null;
  showOnlyDiff: boolean;
  diffResults: DiffResult[];
  addSchema: (name: string, schema: JSONSchema) => void;
  selectOldSchema: (id: string) => void;
  selectNewSchema: (id: string) => void;
  selectField: (path: string[] | null) => void;
  toggleShowOnlyDiff: () => void;
  computeDiff: () => void;
  loadMockSchemas: () => void;
}

export const useSchemaStore = create<SchemaState>((set, get) => ({
  schemas: [],
  selectedOldId: null,
  selectedNewId: null,
  selectedFieldPath: null,
  showOnlyDiff: false,
  diffResults: [],

  addSchema: (name: string, schema: JSONSchema) => {
    const newSchema: SchemaFile = {
      id: uuidv4(),
      name,
      schema,
    };

    set((state) => {
      const schemas = [...state.schemas, newSchema];
      let selectedOldId = state.selectedOldId;
      let selectedNewId = state.selectedNewId;

      if (schemas.length === 1) {
        selectedOldId = newSchema.id;
      } else if (schemas.length === 2) {
        selectedNewId = newSchema.id;
      }

      return { schemas, selectedOldId, selectedNewId };
    });

    get().computeDiff();
  },

  selectOldSchema: (id: string) => {
    set({ selectedOldId: id });
    get().computeDiff();
  },

  selectNewSchema: (id: string) => {
    set({ selectedNewId: id });
    get().computeDiff();
  },

  selectField: (path: string[] | null) => {
    set({ selectedFieldPath: path });
  },

  toggleShowOnlyDiff: () => {
    set((state) => ({ showOnlyDiff: !state.showOnlyDiff }));
  },

  computeDiff: () => {
    const { schemas, selectedOldId, selectedNewId } = get();

    if (!selectedOldId || !selectedNewId) {
      set({ diffResults: [] });
      return;
    }

    const oldSchema = schemas.find((s) => s.id === selectedOldId);
    const newSchema = schemas.find((s) => s.id === selectedNewId);

    if (!oldSchema || !newSchema) {
      set({ diffResults: [] });
      return;
    }

    const results = diff(oldSchema.schema, newSchema.schema);
    set({ diffResults: results });
  },

  loadMockSchemas: () => {
    const mockNames = getAvailableMockSchemas();
    const newSchemas: SchemaFile[] = mockNames.map((name) => ({
      id: uuidv4(),
      name,
      schema: loadMockSchema(name),
    }));

    set({
      schemas: newSchemas,
      selectedOldId: newSchemas[0]?.id || null,
      selectedNewId: newSchemas[1]?.id || null,
    });

    get().computeDiff();
  },
}));
