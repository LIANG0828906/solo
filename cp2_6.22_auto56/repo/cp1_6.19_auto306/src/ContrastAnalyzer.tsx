import React, { useMemo } from 'react';
import tinycolor from 'tinycolor2';
import type { ContrastResult } from './store';

interface ContrastAnalyzerProps {
  foreground: string;
  background: string;
  result: ContrastResult;
}

const LEVEL_COLORS = {
  AAA: '#2ECC71',
  AA: '#F1C40F',
  FAIL: '#E74C3C'
};

const LEVEL_ICONS = {
  AAA: '✅',
  AA: '✅',
  FAIL: '❌'
};

const ContrastAnalyzer: React.FC<ContrastAnalyzerProps> = ({ foreground, background, result }) => {
  const levelColor = LEVEL_COLORS[result.level];
  const levelIcon = LEVEL_ICONS[result.level];

  return (
    <div style={styles.container}>
      <div style={styles.sampleGroup}>
        <div style={styles.sampleHeader}>
          <span style={styles.sampleTitle}>纯色预览</span>
        </div>
        <div style={styles.swatchesRow}>
          <div
            style={{
              ...styles.bigSwatch,
              backgroundColor: foreground,
              transition: 'background-color 0.3s ease-in-out'
            }}
          />
          <div
            style={{
              ...styles.bigSwatch,
              backgroundColor: background,
              transition: 'background-color 0.3s ease-in-out',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />
        </div>
        <LevelBadge result={result} />
      </div>

      <div style={styles.sampleGroup}>
        <div style={styles.sampleHeader}>
          <span style={styles.sampleTitle}>文本示例</span>
        </div>
        <div
          style={{
            ...styles.textPreview,
            backgroundColor: background,
            transition: 'background-color 0.3s ease-in-out'
          }}
        >
          <p
            style={{
              ...styles.textSmall,
              color: foreground,
              transition: 'color 0.3s ease-in-out'
            }}
          >
            设计不仅仅是外表和感觉。设计是它如何工作的。 — Steve Jobs (12px)
          </p>
          <p
            style={{
              ...styles.textLarge,
              color: foreground,
              transition: 'color 0.3s ease-in-out'
            }}
          >
            The best way to predict the future is to invent it. — Alan Kay (16px)
          </p>
        </div>
        <div style={styles.subBadges}>
          <div style={styles.subBadgeRow}>
            <span style={styles.subBadgeLabel}>小字 (12px)</span>
            <MiniBadge pass={result.aa} label="AA" />
            <MiniBadge pass={result.aaa} label="AAA" />
          </div>
          <div style={styles.subBadgeRow}>
            <span style={styles.subBadgeLabel}>大字 (16px)</span>
            <MiniBadge pass={result.aaLarge} label="AA" />
            <MiniBadge pass={result.aaaLarge} label="AAA" />
          </div>
        </div>
      </div>

      <div style={styles.sampleGroup}>
        <div style={styles.sampleHeader}>
          <span style={styles.sampleTitle}>渐变过渡 (45°)</span>
        </div>
        <div
          style={{
            ...styles.gradientBar,
            background: `linear-gradient(45deg, ${foreground}, ${background})`,
            transition: 'background 0.3s ease-in-out'
          }}
        />
        <LevelBadge result={result} />
      </div>

      <div style={styles.ratioDisplay}>
        <div style={styles.ratioLabel}>对比度比率</div>
        <div
          style={{
            ...styles.ratioValue,
            color: levelColor,
            textShadow: `0 0 20px ${tinycolor(levelColor).setAlpha(0.4).toRgbString()}`,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          {result.ratio.toFixed(2)}:1
        </div>
      </div>
    </div>
  );
};

const LevelBadge: React.FC<{ result: ContrastResult }> = ({ result }) => {
  const color = LEVEL_COLORS[result.level];
  const icon = LEVEL_ICONS[result.level];

  return (
    <div style={styles.badgeWrap}>
      <div
        style={{
          ...styles.badge,
          backgroundColor: `${color}1A`,
          borderColor: `${color}4D`,
          color,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <span style={styles.badgeIcon}>{icon}</span>
        <span style={styles.badgeText}>WCAG {result.level}</span>
        <span style={styles.badgeRatio}>{result.ratio.toFixed(2)}</span>
      </div>
    </div>
  );
};

const MiniBadge: React.FC<{ pass: boolean; label: string }> = ({ pass, label }) => {
  const color = pass ? LEVEL_COLORS.AAA : LEVEL_COLORS.FAIL;
  return (
    <div
      style={{
        ...styles.miniBadge,
        backgroundColor: pass ? `${color}1A` : 'rgba(231, 76, 60, 0.1)',
        borderColor: `${color}4D`,
        color,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <span style={{ fontSize: 10 }}>{pass ? '✓' : '✗'}</span>
      <span style={styles.miniBadgeLabel}>{label}</span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    width: '100%'
  },
  sampleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center'
  },
  sampleHeader: {
    alignSelf: 'flex-start',
    width: '100%'
  },
  sampleTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  swatchesRow: {
    display: 'flex',
    gap: 20,
    justifyContent: 'center'
  },
  bigSwatch: {
    width: 120,
    height: 120,
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  },
  badgeWrap: {
    display: 'flex',
    justifyContent: 'center'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid',
    fontSize: 13,
    fontWeight: 600
  },
  badgeIcon: {
    fontSize: 13
  },
  badgeText: {
    fontSize: 12,
    letterSpacing: '0.5px'
  },
  badgeRatio: {
    fontSize: 11,
    opacity: 0.8,
    fontFamily: "'Fira Code', monospace"
  },
  textPreview: {
    width: '100%',
    padding: '20px 24px',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  textSmall: {
    fontSize: 12,
    lineHeight: 1.5,
    fontWeight: 400
  },
  textLarge: {
    fontSize: 16,
    lineHeight: 1.5,
    fontWeight: 500
  },
  subBadges: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
    maxWidth: 320
  },
  subBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  subBadgeLabel: {
    width: 84,
    fontSize: 11,
    color: '#71717A',
    fontWeight: 500
  },
  miniBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 8,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 600,
    minWidth: 46,
    justifyContent: 'center'
  },
  miniBadgeLabel: {
    fontSize: 10,
    letterSpacing: '0.5px'
  },
  gradientBar: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  ratioDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0',
    borderTop: '1px solid #3A3A4E',
    marginTop: 4
  },
  ratioLabel: {
    fontSize: 11,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginBottom: 8
  },
  ratioValue: {
    fontSize: 42,
    fontWeight: 700,
    fontFamily: "'Fira Code', monospace",
    letterSpacing: '-1px'
  }
};

export default ContrastAnalyzer;
