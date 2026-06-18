import React, { memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useEmotionStore } from '@/store/emotionStore';
import {
  EMOTION_COLORS,
  SUGGESTION_ACTIVITIES,
  ALL_EMOTIONS,
  EmotionType,
} from '@/data/colors';

const MemoBarChart = memo(BarChart);

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { dominantEmotion, emotionWeights, resetSelection, selectedColors } = useEmotionStore();

  useEffect(() => {
    if (selectedColors.length === 0) {
      navigate('/');
    }
  }, [selectedColors.length, navigate]);

  const handleReset = () => {
    resetSelection();
    navigate('/');
  };

  const chartData = ALL_EMOTIONS.map((emo) => ({
    name: emo,
    value: emotionWeights[emo],
    fill: EMOTION_COLORS[emo],
  }));

  const gradientId = `ring-gradient-${Math.random().toString(36).slice(2, 8)}`;
  const dominantColor = dominantEmotion ? EMOTION_COLORS[dominantEmotion] : '#888';
  const suggestions = dominantEmotion ? SUGGESTION_ACTIVITIES[dominantEmotion] : [];

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 40,
        gap: 24,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <h2
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: '#E0E0E0',
          marginBottom: 8,
          marginTop: 16,
        }}
      >
        你的情绪报告
      </h2>

      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `conic-gradient(${dominantColor}, ${adjustBrightness(dominantColor, 40)}, ${adjustBrightness(dominantColor, -20)}, ${dominantColor})`,
          padding: 6,
        }}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={dominantColor} stopOpacity={1} />
              <stop offset="50%" stopColor={adjustBrightness(dominantColor, 35)} stopOpacity={1} />
              <stop offset="100%" stopColor={adjustBrightness(dominantColor, -25)} stopOpacity={1} />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="94" fill="none" stroke={`url(#${gradientId})`} strokeWidth="12" />
        </svg>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: 160,
            height: 160,
            borderRadius: '50%',
            backgroundColor: '#1A1A2E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: dominantColor,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {dominantEmotion ?? '未知'}
          </span>
          <span style={{ fontSize: 12, color: '#9E9E9E' }}>主导情绪</span>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 640,
          backgroundColor: '#F0F4F8',
          borderRadius: 12,
          padding: 20,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <MemoBarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              isAnimationActive={true}
              animationDuration={500}
              animationBegin={0}
              animationEasing="ease-out"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D6D8DC" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#555', fontSize: 14, fontFamily: 'Inter, sans-serif' }}
                axisLine={{ stroke: '#D6D8DC' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: '#555', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                axisLine={{ stroke: '#D6D8DC' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26,26,46,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#E0E0E0',
                  fontFamily: 'Inter, sans-serif',
                }}
                labelStyle={{ color: '#E0E0E0' }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)} 能量值`, name]}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                maxBarSize={50}
                isAnimationActive={true}
                animationDuration={500}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </MemoBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {suggestions.map((s, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            style={{
              width: 200,
              height: 'auto',
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#333',
              fontSize: 16,
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.2s ease',
              cursor: 'default',
            }}
          >
            <span style={{ fontSize: 40, lineHeight: 1 }}>{s.emoji}</span>
            <span
              style={{
                color: '#E0E0E0',
                textAlign: 'center',
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {s.text}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.button
        onClick={handleReset}
        whileHover={{ filter: 'brightness(1.15)', scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 16px rgba(102,126,234,0.35)',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
      >
        再测一次
      </motion.button>
    </motion.div>
  );
};

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const amt = Math.round(2.55 * percent);
  const nr = Math.max(0, Math.min(255, r + amt));
  const ng = Math.max(0, Math.min(255, g + amt));
  const nb = Math.max(0, Math.min(255, b + amt));
  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
}

export default ResultPage;

type _Emotion = EmotionType;
