import { useMemo } from 'react';
import { scaleTime, scaleBand, extent, timeYear, timeMonth, timeDay } from 'd3';
import type { TimelineEvent, TimeRange } from '@/types';

interface UseTimelineParams {
  events: TimelineEvent[];
  timeRange: TimeRange | null;
  searchKeyword: string;
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface UseTimelineResult {
  filteredEvents: TimelineEvent[];
  xScale: d3.ScaleTime<number, number, never>;
  yScale: d3.ScaleBand<string>;
  xAxisTicks: Date[];
  isInRange: (date: Date) => boolean;
}

export function useTimeline({
  events,
  timeRange,
  searchKeyword,
  width,
  height,
  padding,
}: UseTimelineParams): UseTimelineResult {
  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (timeRange) {
      result = result.filter(
        (event) => event.date >= timeRange.start && event.date <= timeRange.end
      );
    }

    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      result = result.filter((event) => {
        const nameMatch = event.eventName.toLowerCase().includes(keyword);
        const descMatch = event.description?.toLowerCase().includes(keyword);
        const dateMatch = event.dateString.toLowerCase().includes(keyword);
        return nameMatch || descMatch || dateMatch;
      });
    }

    result.sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;
  }, [events, timeRange, searchKeyword]);

  const xScale = useMemo(() => {
    const innerWidth = width - padding.left - padding.right;
    const dates = filteredEvents.map((e) => e.date);
    const [minDate, maxDate] = extent(dates) as [Date, Date];

    if (timeRange) {
      return scaleTime()
        .domain([timeRange.start, timeRange.end])
        .range([0, innerWidth])
        .nice();
    }

    return scaleTime()
      .domain([minDate, maxDate])
      .range([0, innerWidth])
      .nice();
  }, [filteredEvents, width, padding.left, padding.right, timeRange]);

  const yScale = useMemo(() => {
    const innerHeight = height - padding.top - padding.bottom;
    const eventIds = filteredEvents.map((e) => e.id);

    return scaleBand()
      .domain(eventIds)
      .range([0, innerHeight])
      .padding(0.2);
  }, [filteredEvents, height, padding.top, padding.bottom]);

  const xAxisTicks = useMemo(() => {
    const innerWidth = width - padding.left - padding.right;
    const minTickSpacing = 50;
    const maxTicks = Math.floor(innerWidth / minTickSpacing);

    const domain = xScale.domain();
    const start = domain[0];
    const end = domain[1];

    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = yearDiff * 12 + (end.getMonth() - start.getMonth());
    const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    let interval;
    if (yearDiff > 5) {
      interval = timeYear.every(Math.ceil(yearDiff / maxTicks));
    } else if (monthDiff > 12) {
      interval = timeYear.every(Math.ceil(yearDiff / maxTicks)) || timeYear;
    } else if (monthDiff > 1) {
      interval = timeMonth.every(Math.ceil(monthDiff / maxTicks)) || timeMonth;
    } else {
      interval = timeDay.every(Math.max(1, Math.ceil(dayDiff / maxTicks))) || timeDay;
    }

    return interval.range(start, new Date(end.getTime() + 1));
  }, [xScale, width, padding.left, padding.right]);

  const isInRange = useMemo(() => {
    return (date: Date): boolean => {
      const domain = xScale.domain();
      return date >= domain[0] && date <= domain[1];
    };
  }, [xScale]);

  return {
    filteredEvents,
    xScale,
    yScale,
    xAxisTicks,
    isInRange,
  };
}
