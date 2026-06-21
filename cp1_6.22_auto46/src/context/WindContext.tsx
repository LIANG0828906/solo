import { createContext, useContext } from 'react';

export interface WindParams {
  windSpeed: number;
  windAngle: number;
  setWindSpeed: (v: number) => void;
  setWindAngle: (v: number) => void;
}

export const WindContext = createContext<WindParams>({
  windSpeed: 5,
  windAngle: 0,
  setWindSpeed: () => {},
  setWindAngle: () => {},
});

export function useWindParams() {
  return useContext(WindContext);
}
