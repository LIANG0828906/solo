import { Earthquake } from '../types/earthquake';

export const filterByTimeRange = (
  data: Earthquake[],
  startTime: string,
  endTime: string
): Earthquake[] => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  return data.filter((item) => {
    const time = new Date(item.time).getTime();
    return time >= start && time <= end;
  });
};

export const filterByEndTime = (
  data: Earthquake[],
  endTime: string
): Earthquake[] => {
  const end = new Date(endTime).getTime();
  return data.filter((item) => new Date(item.time).getTime() <= end);
};

export const sortByTimeDesc = (data: Earthquake[]): Earthquake[] => {
  return [...data].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );
};
