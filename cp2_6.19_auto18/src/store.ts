import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Person {
  id: string;
  name: string;
  avatar: string;
}

export interface Seat {
  id: string;
  personId: string | null;
  angle: number;
}

export interface Table {
  id: string;
  name: string;
  shape: 'round' | 'rectangle';
  capacity: number;
  x: number;
  y: number;
  seats: Seat[];
}

interface HistoryState {
  past: { tables: Table[]; people: Person[] }[];
  future: { tables: Table[]; people: Person[] }[];
}

interface AppState extends HistoryState {
  tables: Table[];
  people: Person[];
  canvasScale: number;
  canvasOffset: { x: number; y: number };
  isShuffling: boolean;
  draggingTableId: string | null;
  draggingPersonId: string | null;
  hoveredSeatId: string | null;

  addTable: (shape: 'round' | 'rectangle', x: number, y: number) => void;
  removeTable: (id: string) => void;
  updateTablePosition: (id: string, x: number, y: number) => void;
  updateTableName: (id: string, name: string) => void;
  updateTableCapacity: (id: string, capacity: number) => void;

  setDraggingTableId: (id: string | null) => void;
  setDraggingPersonId: (id: string | null) => void;
  setHoveredSeatId: (id: string | null) => void;

  assignPersonToSeat: (personId: string, tableId: string, seatId: string) => void;
  removePersonFromSeat: (tableId: string, seatId: string) => void;
  addPerson: (name: string) => void;
  updatePersonName: (id: string, name: string) => void;

  shuffle: () => Promise<void>;
  reset: () => void;
  undo: () => void;
  redo: () => void;

  setCanvasScale: (scale: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
}

const avatarColors = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9',
  '#BAE1FF', '#E8BAFF', '#FFB3E6', '#B3FFE6',
];

const generateSeats = (capacity: number): Seat[] => {
  const seats: Seat[] = [];
  for (let i = 0; i < capacity; i++) {
    seats.push({
      id: uuidv4(),
      personId: null,
      angle: (i / capacity) * Math.PI * 2 - Math.PI / 2,
    });
  }
  return seats;
};

const initialPeople: Person[] = [
  { id: uuidv4(), name: '张三', avatar: avatarColors[0] },
  { id: uuidv4(), name: '李四', avatar: avatarColors[1] },
  { id: uuidv4(), name: '王五', avatar: avatarColors[2] },
  { id: uuidv4(), name: '赵六', avatar: avatarColors[3] },
  { id: uuidv4(), name: '钱七', avatar: avatarColors[4] },
  { id: uuidv4(), name: '孙八', avatar: avatarColors[5] },
  { id: uuidv4(), name: '周九', avatar: avatarColors[6] },
  { id: uuidv4(), name: '吴十', avatar: avatarColors[7] },
  { id: uuidv4(), name: '郑十一', avatar: avatarColors[0] },
  { id: uuidv4(), name: '王十二', avatar: avatarColors[1] },
  { id: uuidv4(), name: '冯十三', avatar: avatarColors[2] },
  { id: uuidv4(), name: '陈十四', avatar: avatarColors[3] },
];

const initialTables: Table[] = [
  {
    id: uuidv4(),
    name: 'A 桌',
    shape: 'round',
    capacity: 8,
    x: 80,
    y: 80,
    seats: generateSeats(8),
  },
  {
    id: uuidv4(),
    name: 'B 桌',
    shape: 'round',
    capacity: 8,
    x: 400,
    y: 80,
    seats: generateSeats(8),
  },
];

const saveToHistory = (state: AppState): AppState => {
  const snapshot = {
    tables: JSON.parse(JSON.stringify(state.tables)),
    people: JSON.parse(JSON.stringify(state.people)),
  };
  return {
    ...state,
    past: [...state.past, snapshot],
    future: [],
  };
};

export const useStore = create<AppState>((set, get) => ({
  tables: initialTables,
  people: initialPeople,
  past: [],
  future: [],
  canvasScale: 1,
  canvasOffset: { x: 0, y: 0 },
  isShuffling: false,
  draggingTableId: null,
  draggingPersonId: null,
  hoveredSeatId: null,

  addTable: (shape, x, y) => {
    set((state) => {
      const newTable: Table = {
        id: uuidv4(),
        name: `${String.fromCharCode(65 + state.tables.length)} 桌`,
        shape,
        capacity: 8,
        x,
        y,
        seats: generateSeats(8),
      };
      return saveToHistory({
        ...state,
        tables: [...state.tables, newTable],
      });
    });
  },

  removeTable: (id) => {
    set((state) =>
      saveToHistory({
        ...state,
        tables: state.tables.filter((t) => t.id !== id),
      })
    );
  },

  updateTablePosition: (id, x, y) => {
    set((state) => ({
      ...state,
      tables: state.tables.map((t) =>
        t.id === id ? { ...t, x, y } : t
      ),
    }));
  },

  updateTableName: (id, name) => {
    set((state) =>
      saveToHistory({
        ...state,
        tables: state.tables.map((t) =>
          t.id === id ? { ...t, name } : t
        ),
      })
    );
  },

  updateTableCapacity: (id, capacity) => {
    set((state) =>
      saveToHistory({
        ...state,
        tables: state.tables.map((t) => {
          if (t.id !== id) return t;
          const newSeats = generateSeats(capacity);
          const minLen = Math.min(t.seats.length, newSeats.length);
          for (let i = 0; i < minLen; i++) {
            newSeats[i].personId = t.seats[i].personId;
          }
          return { ...t, capacity, seats: newSeats };
        }),
      })
    );
  },

  setDraggingTableId: (id) => set({ draggingTableId: id }),
  setDraggingPersonId: (id) => set({ draggingPersonId: id }),
  setHoveredSeatId: (id) => set({ hoveredSeatId: id }),

  assignPersonToSeat: (personId, tableId, seatId) => {
    set((state) => {
      let newTables = state.tables.map((table) => {
        if (table.id !== tableId) {
          const filteredSeats = table.seats.map((s) =>
            s.personId === personId ? { ...s, personId: null } : s
          );
          return { ...table, seats: filteredSeats };
        }
        return {
          ...table,
          seats: table.seats.map((s) =>
            s.id === seatId ? { ...s, personId } : s.personId === personId ? { ...s, personId: null } : s
          ),
        };
      });
      return saveToHistory({ ...state, tables: newTables });
    });
  },

  removePersonFromSeat: (tableId, seatId) => {
    set((state) =>
      saveToHistory({
        ...state,
        tables: state.tables.map((table) =>
          table.id !== tableId
            ? table
            : {
                ...table,
                seats: table.seats.map((s) =>
                  s.id === seatId ? { ...s, personId: null } : s
                ),
              }
        ),
      })
    );
  },

  addPerson: (name) => {
    set((state) =>
      saveToHistory({
        ...state,
        people: [
          ...state.people,
          {
            id: uuidv4(),
            name,
            avatar: avatarColors[state.people.length % avatarColors.length],
          },
        ],
      })
    );
  },

  updatePersonName: (id, name) => {
    set((state) => ({
      ...state,
      people: state.people.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  },

  shuffle: async () => {
    const state = get();
    if (state.isShuffling) return;

    set({ isShuffling: true });

    const unassignedPeople = state.people.filter(
      (p) => !state.tables.some((t) => t.seats.some((s) => s.personId === p.id))
    );

    const emptySeats: { tableId: string; seatId: string }[] = [];
    state.tables.forEach((table) => {
      table.seats.forEach((seat) => {
        if (!seat.personId) {
          emptySeats.push({ tableId: table.id, seatId: seat.id });
        }
      });
    });

    const shuffledPeople = [...unassignedPeople].sort(() => Math.random() - 0.5);
    const minLen = Math.min(shuffledPeople.length, emptySeats.length);

    const snapshot = {
      tables: JSON.parse(JSON.stringify(state.tables)),
      people: JSON.parse(JSON.stringify(state.people)),
    };

    for (let i = 0; i < minLen; i++) {
      const person = shuffledPeople[i];
      const { tableId, seatId } = emptySeats[i];

      await new Promise((resolve) => setTimeout(resolve, 200));

      set((prevState) => ({
        ...prevState,
        tables: prevState.tables.map((table) => {
          if (table.id !== tableId) return table;
          return {
            ...table,
            seats: table.seats.map((s) =>
              s.id === seatId ? { ...s, personId: person.id } : s
            ),
          };
        }),
      }));
    }

    set((prevState) => ({
      ...prevState,
      isShuffling: false,
      past: [...prevState.past, snapshot],
      future: [],
    }));
  },

  reset: () => {
    set((state) =>
      saveToHistory({
        ...state,
        tables: state.tables.map((t) => ({
          ...t,
          seats: t.seats.map((s) => ({ ...s, personId: null })),
        })),
      })
    );
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;
      const newPast = [...state.past];
      const prev = newPast.pop()!;
      const currentSnapshot = {
        tables: JSON.parse(JSON.stringify(state.tables)),
        people: JSON.parse(JSON.stringify(state.people)),
      };
      return {
        ...state,
        tables: prev.tables,
        people: prev.people,
        past: newPast,
        future: [currentSnapshot, ...state.future],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const newFuture = [...state.future];
      const next = newFuture.shift()!;
      const currentSnapshot = {
        tables: JSON.parse(JSON.stringify(state.tables)),
        people: JSON.parse(JSON.stringify(state.people)),
      };
      return {
        ...state,
        tables: next.tables,
        people: next.people,
        past: [...state.past, currentSnapshot],
        future: newFuture,
      };
    });
  },

  setCanvasScale: (scale) => set({ canvasScale: scale }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
}));

export const getUnassignedPeople = (state: { tables: Table[]; people: Person[] }): Person[] => {
  const assignedIds = new Set<string>();
  state.tables.forEach((t) =>
    t.seats.forEach((s) => {
      if (s.personId) assignedIds.add(s.personId);
    })
  );
  return state.people.filter((p) => !assignedIds.has(p.id));
};

export const isTableOverCapacity = (table: Table): boolean => {
  const occupied = table.seats.filter((s) => s.personId).length;
  return occupied > table.capacity;
};
