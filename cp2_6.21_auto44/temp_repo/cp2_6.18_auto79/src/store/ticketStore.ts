import { create } from 'zustand';

export type TicketStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';

export interface Ticket {
  id: string;
  orderId: string;
  itemName: string;
  amount: number;
  reason: string;
  status: TicketStatus;
  createdAt: Date;
}

interface TicketStore {
  tickets: Ticket[];
  statusFilter: TicketStatus | 'all';
  createTicket: (data: Omit<Ticket, 'id' | 'status' | 'createdAt'>) => void;
  updateStatus: (id: string, status: TicketStatus) => void;
  updateFilter: (filter: TicketStatus | 'all') => void;
  approve: (id: string) => void;
  reject: (id: string) => void;
  filteredTickets: Ticket[];
}

const generateTicketId = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `RF${timestamp}${random}`;
};

const isValidTransition = (from: TicketStatus, to: TicketStatus): boolean => {
  const transitions: Record<TicketStatus, TicketStatus[]> = {
    pending: ['reviewing'],
    reviewing: ['approved', 'rejected'],
    approved: ['completed'],
    rejected: [],
    completed: [],
  };
  return transitions[from].includes(to);
};

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  statusFilter: 'all',

  createTicket: (data) => {
    const newTicket: Ticket = {
      ...data,
      id: generateTicketId(),
      status: 'pending',
      createdAt: new Date(),
    };
    set((state) => ({ tickets: [newTicket, ...state.tickets] }));
  },

  updateStatus: (id, status) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id === id && isValidTransition(ticket.status, status)) {
          return { ...ticket, status };
        }
        return ticket;
      }),
    }));
  },

  updateFilter: (filter) => {
    set({ statusFilter: filter });
  },

  approve: (id) => {
    get().updateStatus(id, 'approved');
  },

  reject: (id) => {
    get().updateStatus(id, 'rejected');
  },

  get filteredTickets() {
    const { tickets, statusFilter } = get();
    if (statusFilter === 'all') return tickets;
    return tickets.filter((ticket) => ticket.status === statusFilter);
  },
}));
