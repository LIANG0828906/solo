import { create } from 'zustand'
import type { Seat, Viewport } from '../engine/layoutEngine'
import { generateRectangularSeats } from '../engine/layoutEngine'
import type { TicketData, BookingPopupState } from '../engine/bookingEngine'
import { closeBookingPopup } from '../engine/bookingEngine'

export type AppMode = 'editor' | 'viewer'

interface TheaterState {
  seats: Seat[]
  selectedSeatId: string | null
  multiSelectedIds: string[]
  viewport: Viewport
  mode: AppMode
  currentTicket: TicketData | null
  showTicketModal: boolean
  bookingPopup: BookingPopupState
  animatedSeatId: string | null
  addSeat: (seat: Seat) => void
  removeSeat: (id: string) => void
  batchAddSeats: (newSeats: Seat[]) => void
  setViewport: (viewport: Viewport) => void
  selectSeat: (id: string | null) => void
  toggleMultiSelect: (id: string) => void
  clearMultiSelect: () => void
  updateSeatStatus: (id: string, status: Seat['status']) => void
  setMode: (mode: AppMode) => void
  setCurrentTicket: (ticket: TicketData | null) => void
  setShowTicketModal: (show: boolean) => void
  setBookingPopup: (popup: BookingPopupState) => void
  setAnimatedSeatId: (id: string | null) => void
  resetLayout: () => void
  initDefaultLayout: () => void
}

function createDefaultSeats(): Seat[] {
  return generateRectangularSeats(0, 0, 8, 12, 100, 80, 50)
}

export const useTheaterStore = create<TheaterState>((set) => ({
  seats: createDefaultSeats(),
  selectedSeatId: null,
  multiSelectedIds: [],
  viewport: { offsetX: 0, offsetY: 0, scale: 1 },
  mode: 'viewer',
  currentTicket: null,
  showTicketModal: false,
  bookingPopup: closeBookingPopup(),
  animatedSeatId: null,

  addSeat: (seat) =>
    set((state) => ({ seats: [...state.seats, seat] })),

  removeSeat: (id) =>
    set((state) => ({
      seats: state.seats.filter((s) => s.id !== id),
      selectedSeatId: state.selectedSeatId === id ? null : state.selectedSeatId,
    })),

  batchAddSeats: (newSeats) =>
    set((state) => ({ seats: [...state.seats, ...newSeats] })),

  setViewport: (viewport) => set({ viewport }),

  selectSeat: (id) => set({ selectedSeatId: id }),

  toggleMultiSelect: (id) =>
    set((state) => ({
      multiSelectedIds: state.multiSelectedIds.includes(id)
        ? state.multiSelectedIds.filter((s) => s !== id)
        : [...state.multiSelectedIds, id],
    })),

  clearMultiSelect: () => set({ multiSelectedIds: [] }),

  updateSeatStatus: (id, status) =>
    set((state) => ({
      seats: state.seats.map((s) =>
        s.id === id ? { ...s, status } : s
      ),
    })),

  setMode: (mode) => set({ mode }),

  setCurrentTicket: (ticket) => set({ currentTicket: ticket }),

  setShowTicketModal: (show) => set({ showTicketModal: show }),

  setBookingPopup: (popup) => set({ bookingPopup: popup }),

  setAnimatedSeatId: (id) => set({ animatedSeatId: id }),

  resetLayout: () => set({ seats: [], selectedSeatId: null, multiSelectedIds: [] }),

  initDefaultLayout: () => set({ seats: createDefaultSeats() }),
}))
