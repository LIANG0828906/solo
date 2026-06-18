import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { useAppContext } from './App';
import type { Profile, PersonalityDimension, MatchResult } from '../engine/types';

const DIMENSION_LABELS: Record<PersonalityDimension, string> = {
  Melody: '旋律感',
  Rhythm: '节奏感',
  Lyric: '歌词力',
  Mood: '氛围控',
  Complexity: '复杂度',
};

function RadarChartView({ profile, size = 320 }: { profile: Profile; size?: number }) {
  const data = useMemo(() => {
    return (Object.keys(profile.dimensions) as PersonalityDimension[]).map((dim) => ({
      dimension: DIMENSION_LABELS[dim],
      score: profile.dimensions[dim],
      fullMark: 100,
    }));
  }, [profile]);

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="80%">
          <PolarGrid stroke="#E0E0E0" strokeOpacity={0.3} />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#fff', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="得分"
            dataKey="score"
            stroke="#6C63FF"
            fill="url(#radarGradient)"
            fillOpacity={0.6}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6C63FF" />
              <stop offset="100%" stopColor="#FF6584" />
            </linearGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CompareRadarChart({
  profileA,
  profileB,
  size = 280,
}: {
  profileA: Profile;
  profileB: Profile;
  size?: number;
}) {
  const data = useMemo(() => {
    return (Object.keys(profileA.dimensions) as PersonalityDimension[]).map((dim) => ({
      dimension: DIMENSION_LABELS[dim],
      你: profileA.dimensions[dim],
      对方: profileB.dimensions[dim],
      fullMark: 100,
    }));
  }, [profileA, profileB]);

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="80%">
          <PolarGrid stroke="#E0E0E0" strokeOpacity={0.3} />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#fff', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="你"
            dataKey="你"
            stroke="#6C63FF"
            fill="#6C63FF"
            fillOpacity={0.4}
            isAnimationActive={true}
            animationDuration={600}
          />
          <Radar
            name="对方"
            dataKey="对方"
            stroke="#FF6584"
            fill="#FF6584"
            fillOpacity={0.4}
            isAnimationActive={true}
            animationDuration={600}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MatchCard({
  match,
  isExpanded,
  onClick,
  userProfile,
}: {
  match: MatchResult;
  isExpanded: boolean;
  onClick: () => void;
  userProfile: Profile;
}) {
  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: '#1E1E2E',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        width: isExpanded ? 350 : 240,
        height: isExpanded ? 'auto' : 160,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #6C63FF 0%, #FF6584 100%)',
        }}
      />
      <div style={{ padding: '20px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {match.profile.nickname?.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
              {match.profile.nickname}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
              {match.profile.primaryType} 型
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #FF6584 0%, #6C63FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {match.similarity}%
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
          匹配度
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 16px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <CompareRadarChart profileA={userProfile} profileB={match.profile} size={240} />
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 8,
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#6C63FF',
                    }}
                  />
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>你</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#FF6584',
                    }}
                  />
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>对方</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SaveShareSection() {
  const { userProfile, saveProfile } = useAppContext();
  const [nickname, setNickname] = useState('');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    if (!nickname.trim()) return;
    const hash = saveProfile(nickname.trim());
    if (hash) {
      setShareLink(`app.test/result/${hash}`);
    }
  };

  const handleCopy = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!userProfile) return null;

  return (
    <div
      style={{
        background: 'rgba(42, 42, 58, 0.6)',
        borderRadius: 16,
        padding: 24,
        marginTop: 40,
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 16,
          color: '#fff',
        }}
      >
        保存与分享
      </h3>

      {!shareLink ? (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 12))}
            placeholder="输入你的昵称（最多12字）"
            maxLength={12}
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              background: '#2D3436',
              borderRadius: 6,
              color: '#fff',
              fontSize: 14,
            }}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={!nickname.trim()}
            style={{
              padding: '10px 24px',
              background: nickname.trim()
                ? 'linear-gradient(90deg, #6C63FF 0%, #FF6584 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: nickname.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            生成链接
          </motion.button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              background: '#2D3436',
              borderRadius: 6,
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          >
            {shareLink}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            style={{
              padding: '10px 20px',
              background: 'rgba(108, 99, 255, 0.3)',
              borderRadius: 6,
              color: '#fff',
              fontSize: 14,
              border: '1px solid rgba(108, 99, 255, 0.5)',
            }}
          >
            {copied ? '已复制!' : '复制链接'}
          </motion.button>
        </div>
      )}
    </div>
  );
}

function Leaderboard() {
  const { savedProfiles, userProfile } = useAppContext();

  if (savedProfiles.length === 0 || !userProfile) return null;

  const sortedProfiles = [...savedProfiles]
    .map((p) => ({
      profile: p,
      score: Object.values(p.dimensions).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div
      style={{
        background: 'rgba(42, 42, 58, 0.6)',
        borderRadius: 16,
        padding: 24,
        marginTop: 24,
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 16,
          color: '#fff',
        }}
      >
        公开画像排行榜
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedProfiles.map((item, index) => (
          <motion.div
            key={item.profile.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background:
                item.profile.id === userProfile.id
                  ? 'rgba(108, 99, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.04)',
            }}
          >
            <span
              style={{
                width: 24,
                fontSize: 14,
                fontWeight: 600,
                color:
                  index === 0
                    ? '#FFD700'
                    : index === 1
                    ? '#C0C0C0'
                    : index === 2
                    ? '#CD7F32'
                    : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {index + 1}
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {item.profile.nickname?.charAt(0)}
            </div>
            <span style={{ flex: 1, fontSize: 14, color: '#fff' }}>
              {item.profile.nickname}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
              {item.profile.primaryType}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ResultDashboard() {
  const { userProfile, matches, goToTest } = useAppContext();
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  if (!userProfile) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        <h1
          className="gradient-text"
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          你的音乐性格画像
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 16 }}>
          主导类型：{userProfile.primaryType} · 副类型：{userProfile.secondaryType}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 40,
        }}
      >
        <RadarChartView profile={userProfile} size={360} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 20,
            textAlign: 'center',
            color: '#fff',
          }}
        >
          最匹配的创作伙伴
        </h2>

        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {matches.map((match, index) => (
            <motion.div
              key={match.profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            >
              <MatchCard
                match={match}
                isExpanded={expandedMatch === (match.profile.id ?? null)}
                onClick={() => {
                  const id = match.profile.id ?? null
                  setExpandedMatch(expandedMatch === id ? null : id)
                }}
                userProfile={userProfile}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <SaveShareSection />
      <Leaderboard />

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={goToTest}
          style={{
            padding: '12px 32px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          重新测试
        </motion.button>
      </div>
    </div>
  );
}
