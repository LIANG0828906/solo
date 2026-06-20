import { create } from 'zustand'
import { HistoricalEvent, CivilizationId, EventTypeId, CIVILIZATIONS, EVENT_TYPES } from '../types'
import { presetEvents } from '../data/presetEvents'

interface TimelineState {
  events: HistoricalEvent[]
  filteredEvents: HistoricalEvent[]
  selectedCivilizations: CivilizationId[]
  timeRangeStart: number
  timeRangeEnd: number
  selectedEventTypes: EventTypeId[]
  zoom: number
  offsetX: number
  focusEventId: string | null

  setCivilizations: (civilizations: CivilizationId[]) => void
  setTimeRange: (start: number, end: number) => void
  setEventTypes: (types: EventTypeId[]) => void
  toggleCivilization: (civ: CivilizationId) => void
  toggleEventType: (type: EventTypeId) => void
  setZoom: (zoom: number) => void
  setOffsetX: (offsetX: number) => void
  setFocusEvent: (id: string | null) => void
}

function filterEvents(
  events: HistoricalEvent[],
  selectedCivilizations: CivilizationId[],
  timeRangeStart: number,
  timeRangeEnd: number,
  selectedEventTypes: EventTypeId[]
): HistoricalEvent[] {
  return events.filter(
    (event) =>
      selectedCivilizations.includes(event.civilization) &&
      event.startYear <= timeRangeEnd &&
      event.endYear >= timeRangeStart &&
      selectedEventTypes.includes(event.eventType)
  )
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: presetEvents,
  filteredEvents: filterEvents(presetEvents, CIVILIZATIONS.map((c) => c.id), -3000, 2000, EVENT_TYPES.map((t) => t.id)),
  selectedCivilizations: CIVILIZATIONS.map((c) => c.id),
  timeRangeStart: -3000,
  timeRangeEnd: 2000,
  selectedEventTypes: EVENT_TYPES.map((t) => t.id),
  zoom: 1,
  offsetX: 0,
  focusEventId: null,

  setCivilizations: (civilizations) => {
    const { events, timeRangeStart, timeRangeEnd, selectedEventTypes } = get()
    set({
      selectedCivilizations: civilizations,
      filteredEvents: filterEvents(events, civilizations, timeRangeStart, timeRangeEnd, selectedEventTypes),
    })
  },

  setTimeRange: (start, end) => {
    const { events, selectedCivilizations, selectedEventTypes } = get()
    set({
      timeRangeStart: start,
      timeRangeEnd: end,
      filteredEvents: filterEvents(events, selectedCivilizations, start, end, selectedEventTypes),
    })
  },

  setEventTypes: (types) => {
    const { events, selectedCivilizations, timeRangeStart, timeRangeEnd } = get()
    set({
      selectedEventTypes: types,
      filteredEvents: filterEvents(events, selectedCivilizations, timeRangeStart, timeRangeEnd, types),
    })
  },

  toggleCivilization: (civ) => {
    const { selectedCivilizations } = get()
    const next = selectedCivilizations.includes(civ)
      ? selectedCivilizations.filter((id) => id !== civ)
      : [...selectedCivilizations, civ]
    get().setCivilizations(next)
  },

  toggleEventType: (type) => {
    const { selectedEventTypes } = get()
    const next = selectedEventTypes.includes(type)
      ? selectedEventTypes.filter((id) => id !== type)
      : [...selectedEventTypes, type]
    get().setEventTypes(next)
  },

  setZoom: (zoom) => set({ zoom }),

  setOffsetX: (offsetX) => set({ offsetX }),

  setFocusEvent: (id) => set({ focusEventId: id }),
}))
