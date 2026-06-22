import { useMemo } from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { FlavorProfile } from '../types';

interface RadarChartProps {
  profile: FlavorProfile;
  size?: number;
}

const axisLabels: Record<keyof FlavorProfile, string> = {
  acidity: '酸度',
  bitterness: '苦度',
  sweetness: '甜度',
  body: '醇厚度',
  cleanliness: '干净度',
};

export const RadarChart = ({ profile, size = 140 }: RadarChartProps) => {
  const data = useMemo(
    () =>
      (Object.keys(profile) as Array<keyof FlavorProfile>).map((key) => ({
        subject: axisLabels[key],
        value: profile[key],
        fullMark: 10,
      })),
    [profile]
  );

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#E0D5C7" strokeWidth={0.5} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#6D4C41', fontSize: 10 }}
            axisLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={false}
            axisLine={false}
            tickCount={6}
          />
          <Radar
            name="风味"
            dataKey="value"
            stroke="#6D4C41"
            fill="#8D6E63"
            fillOpacity={0.5}
            strokeWidth={1.5}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};
