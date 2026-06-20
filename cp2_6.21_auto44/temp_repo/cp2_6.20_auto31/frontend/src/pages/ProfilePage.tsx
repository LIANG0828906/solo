import { useState, useEffect, useRef, useMemo } from 'react';
import { ResponsiveCalendar } from '@nivo/calendar';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import {
  getUserProfile,
  updateUserProfile,
  getPlayRecords,
  getWeeklyPlayTime,
  getPresetAvatars,
  type HeatmapDataItem,
  type WeeklyPlayTimeItem,
} from '../services/api';
import useAuthStore from '../store/useAuthStore';
import type { User, Vinyl } from '../types';

interface Stats {
  collection_count: number;
  total_plays: number;
  avg_rating: number | null;
  genre_distribution: Record<string, number>;
}

interface CalendarDatum {
  day: string;
  value: number;
  tracks?: Vinyl[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  day: string;
  tracks: Vinyl[];
  value: number;
}

const BACKGROUND_COLOR = '#1a1a2e';
const CARD_COLOR = '#16213e';
const PRIMARY_COLOR = '#e94560';
const TEXT_MUTED = 'rgba(255,255,255,0.5)';
const TEXT_MUTED_6 = 'rgba(255,255,255,0.6)';

const ProfilePage = () => {
  const { user, setUser, ensureDemoUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [presetAvatars, setPresetAvatars] = useState<string[]>([]);
  const [showPresetGrid, setShowPresetGrid] = useState(false);
  const uploadedAvatarFileRef = useRef<File | null>(null);

  const [calendarData, setCalendarData] = useState<CalendarDatum[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarLoading, setCalendarLoading] = useState(true);

  const [weeklyData, setWeeklyData] = useState<WeeklyPlayTimeItem[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    day: '',
    tracks: [],
    value: 0,
  });

  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      await ensureDemoUser();
    };
    init();
  }, [ensureDemoUser]);

  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      try {
        const res = await getUserProfile(user.id);
        setProfileUser(res.user);
        setStats(res.stats);
      } catch (e) {
        console.error('加载用户资料失败', e);
      }
    };

    const loadCalendar = async () => {
      setCalendarLoading(true);
      try {
        const res = await getPlayRecords(user.id, { year: selectedYear });
        const items = res.items || [];
        const mapped: CalendarDatum[] = items.map((item: HeatmapDataItem) => ({
          day: item.date,
          value: item.count,
          tracks: item.tracks,
        }));
        setCalendarData(mapped);
      } catch (e) {
        console.error('加载热力图失败', e);
        setCalendarData([]);
      } finally {
        setCalendarLoading(false);
      }
    };

    const loadWeekly = async () => {
      setWeeklyLoading(true);
      try {
        const res = await getWeeklyPlayTime(user.id);
        setWeeklyData(res || []);
      } catch (e) {
        console.error('加载周数据失败', e);
        setWeeklyData([]);
      } finally {
        setWeeklyLoading(false);
      }
    };

    loadProfile();
    loadCalendar();
    loadWeekly();
  }, [user?.id, selectedYear]);

  useEffect(() => {
    if (!user) return;
    setEditUsername(user.username || '');
    setEditBio(user.bio || '');
    setEditAvatarUrl(user.avatar_url || '');
  }, [user, isEditing]);

  const enterEditMode = async () => {
    setIsEditing(true);
    setAvatarRotation(0);
    setSaveSuccess(false);
    uploadedAvatarFileRef.current = null;
    try {
      const avatars = await getPresetAvatars();
      setPresetAvatars(avatars || []);
    } catch (e) {
      setPresetAvatars([]);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditAvatarUrl(user?.avatar_url || '');
    setEditUsername(user?.username || '');
    setEditBio(user?.bio || '');
    setAvatarRotation(0);
    setShowPresetGrid(false);
    uploadedAvatarFileRef.current = null;
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (value.length > 200) {
      e.preventDefault();
      value = value.slice(0, 200);
    }
    setEditBio(value);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadedAvatarFileRef.current = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditAvatarUrl(ev.target?.result as string);
      setAvatarRotation(0);
      setShowPresetGrid(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.append('username', editUsername.trim());
      formData.append('bio', editBio);

      const isUploadedFile = uploadedAvatarFileRef.current !== null;
      const isDataUrl = editAvatarUrl.startsWith('data:');

      if (isUploadedFile && uploadedAvatarFileRef.current) {
        formData.append('avatar', uploadedAvatarFileRef.current);
      } else if (isDataUrl) {
        try {
          const res = await fetch(editAvatarUrl);
          const blob = await res.blob();
          const mime = blob.type || 'image/png';
          const ext = mime.split('/')[1] || 'png';
          const file = new File([blob], `avatar.${ext}`, { type: mime });
          formData.append('avatar', file);
        } catch (e) {
          console.warn('转换 dataURL 为文件失败，跳过头像上传', e);
        }
      }

      const updated = await updateUserProfile(user.id, formData);
      setUser(updated);
      setProfileUser(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setIsSaving(false);
        setSaveSuccess(false);
        uploadedAvatarFileRef.current = null;
      }, 900);
    } catch (error: any) {
      setIsSaving(false);
      const message =
        (error?.response?.data as any)?.detail ||
        (error?.response?.data as any)?.message ||
        error?.message ||
        '保存失败';
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: { message, type: 'error' },
        });
        window.dispatchEvent(event);
      }
    }
  };

  const handleCalendarClick = (datum: any, e: React.MouseEvent) => {
    const cell = calendarData.find((c) => c.day === datum.day);
    if (!cell || cell.value <= 0) {
      setTooltip((prev) => ({ ...prev, visible: false }));
      return;
    }
    const rect = pageRef.current?.getBoundingClientRect();
    const pageWidth = rect?.width || 0;
    const pageHeight = pageRef.current?.offsetHeight || 0;
    const tooltipWidth = 280;
    const tooltipHeight = 220;

    let x = (e.clientX - (rect?.left || 0)) + 12;
    let y = (e.clientY - (rect?.top || 0)) + 12;

    if (x + tooltipWidth > pageWidth) {
      x = (e.clientX - (rect?.left || 0)) - tooltipWidth - 12;
    }
    if (y + tooltipHeight > pageHeight) {
      y = (e.clientY - (rect?.top || 0)) - tooltipHeight - 12;
    }

    setTooltip({
      visible: true,
      x,
      y,
      day: cell.day,
      tracks: cell.tracks || [],
      value: cell.value,
    });
  };

  const closeTooltip = () => setTooltip((prev) => ({ ...prev, visible: false }));

  const genreTags = useMemo(() => {
    if (!stats?.genre_distribution) return [] as { name: string; count: number }[];
    return Object.entries(stats.genre_distribution)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [stats]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current];
  }, []);

  const displayUser = profileUser || user;

  if (!displayUser) {
    return (
      <div style={styles.page}>
        <div style={styles.profileCard}>
        </div>
      </div>
    );
  }

  const CalendarProps = {
    data: calendarData,
    from: `${selectedYear}-01-01`,
    to: `${selectedYear}-12-31`,
    emptyColor: 'rgba(255,255,255,0.03)',
    colors: ['#1a3a2a', '#22543d', '#2f855a', '#4ade80'],
    yearLegend: (_year: number) => '',
    yearSpacing: 20,
    monthBorderColor: 'transparent',
    dayBorderWidth: 0,
    daySpacing: 3,
    monthLegend: (_year: number, month: number) => {
      const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
      return months[month];
    },
    monthLegendOffset: 10,
    theme: {
      background: 'transparent',
      text: { color: '#ffffff' },
      tooltip: { container: { display: 'none' } },
    },
    legends: [],
    onClick: handleCalendarClick,
  } as any;

  return (
    <div
      ref={pageRef}
      style={styles.page}
      onClick={(e) => {
        if (
          !(e.target as HTMLElement).closest('[data-tooltip]')) {
          closeTooltip();
        }
      }}
    >
      <div style={styles.profileCard} className="animate-slideUp">
        {!isEditing ? (
          <div style={styles.profileInner}>
            <div style={styles.profileLeft}>
              <div style={styles.avatarWrapper}>
                <img
                  src={displayUser.avatar_url}
                  alt={displayUser.username}
                  style={styles.avatar}
                />
              </div>
              <button style={styles.editButton} onClick={enterEditMode}>
                ✏️ 编辑资料
              </button>
            </div>

            <div style={styles.profileCenter}>
              <h1 style={styles.username}>{displayUser.username}</h1>
              <p style={styles.email}>{displayUser.email}</p>
              <p style={styles.bio}>{displayUser.bio || '这个人很懒，还没有简介~'}</p>
            </div>

            <div style={styles.profileRight}>
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{stats?.collection_count ?? 0}</div>
                  <div style={styles.statLabel}>收藏总数</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{stats?.total_plays ?? 0}</div>
                  <div style={styles.statLabel}>总播放次数</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>
                    {stats?.avg_rating != null ? stats.avg_rating.toFixed(1) : '-'}
                  </div>
                  <div style={styles.statLabel}>平均评分</div>
                </div>
                <div style={{ ...styles.statItem, ...styles.genreItem }}>
                  <div style={styles.statLabel} data-no-pointer>
                    流派分布
                  </div>
                  <div style={styles.genreTags}>
                    {genreTags.length === 0 ? (
                      <span style={styles.emptyGenre}>暂无数据</span>
                    ) : (
                      genreTags.map((g) => (
                        <span
                          key={g.name}
                          style={{
                            ...styles.genreTag,
                            fontSize: 10 + Math.min(g.count, 6),
                          }}
                        >
                          {g.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <div style={styles.editForm}>
              <div style={styles.editAvatarSection}>
                <div style={styles.editAvatarPreviewWrapper}>
                  <div
                    style={{
                      ...styles.editAvatarCircle,
                      transform: `rotate(${avatarRotation}deg)`,
                    }}
                  >
                    <img
                      src={editAvatarUrl || displayUser.avatar_url}
                      alt="avatar preview"
                      style={styles.editAvatarImg}
                    />
                  </div>
                </div>

                <div style={styles.avatarControls}>
                  <div style={styles.avatarActions}>
                    <button
                      style={styles.avatarActionBtn}
                      onClick={() => setShowPresetGrid(!showPresetGrid)}
                    >
                      🎨 选择预设头像
                    </button>
                    <button
                      style={styles.avatarActionBtn}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📤 上传图片
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div style={styles.rotationSliderWrap}>
                    <span style={styles.rotationLabel}>旋转: {avatarRotation}°</span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={avatarRotation}
                      onChange={(e) => setAvatarRotation(Number(e.target.value))}
                      style={styles.rotationSlider}
                    />
                  </div>
                </div>

                {showPresetGrid && (
                  <div style={styles.presetGrid} className="animate-slideDown">
                    {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setEditAvatarUrl(url);
                      setAvatarRotation(0);
                      uploadedAvatarFileRef.current = null;
                    }}
                    style={{
                      ...styles.presetAvatar,
                      ...(editAvatarUrl === url ? styles.presetAvatarActive : {}),
                    }}
                  >
                    <img src={url} alt={`preset-${idx}`} style={styles.presetAvatarImg} />
                  </button>
                ))}
                  </div>
                )}
              </div>

              <div style={styles.formFields}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>昵称</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    style={styles.formInput}
                    placeholder="请输入昵称"
                  />
                </div>

                <div style={styles.formGroup}>
                  <div style={styles.formLabelRow}>
                    <label style={styles.formLabel}>个人简介</label>
                    <span
                      style={{
                        ...styles.charCount,
                        color: editBio.length >= 200 ? '#ef4444' : TEXT_MUTED,
                      }}
                    >
                      {editBio.length}/200
                    </span>
                  </div>
                  <textarea
                    value={editBio}
                    maxLength={200}
                    onChange={handleBioChange}
                    style={{
                      ...styles.formTextarea,
                      borderColor: editBio.length >= 200 ? '#ef4444' : '#2a2a4e',
                    }}
                    placeholder="介绍一下自己吧..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div style={styles.editActions}>
              <button style={styles.cancelBtn} onClick={cancelEdit} disabled={isSaving}>
                取消
              </button>
              <button
                style={{
                  ...styles.saveBtn,
                  opacity: isSaving || saveSuccess ? 0.8 : 1,
                }}
                onClick={handleSave}
                disabled={isSaving || saveSuccess}
              >
                {isSaving ? (
                  <span style={styles.spinnerWrapper}>
                    <span style={styles.spinner} className="animate-spin" />
                    <span style={{ marginLeft: 8 }}>保存中...</span>
                  </span>
                ) : saveSuccess ? (
                  <span style={styles.checkmark}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 10L8.5 13.5L15 6.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={{ marginLeft: 8 }}>保存成功</span>
                  </span>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.sectionCard} className="animate-slideUp">
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>🎵 播放记录热力图</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={styles.yearSelect}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        </div>

        {calendarLoading ? (
          <div style={styles.skeletonHeatmap} className="shimmer" />
        ) : (
          <div style={styles.calendarWrapper} onClick={(e) => e.stopPropagation()}>
            <ResponsiveCalendar {...CalendarProps} />
          </div>
        )}

        {tooltip.visible && (
          <div
            data-tooltip
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              zIndex: 100,
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.customTooltip} className="animate-fadeIn">
              <div style={styles.tooltipDate}>{tooltip.day}</div>
              <div style={styles.tooltipCount}>播放 {tooltip.value} 首</div>
              {tooltip.tracks.length > 0 && (
                <div style={styles.tooltipTracks}>
                  {tooltip.tracks.slice(0, 5).map((t, i) => (
                    <div key={i} style={styles.tooltipTrack}>
                      <div style={styles.tooltipTrackTitle}>{t.title}</div>
                      <div style={styles.tooltipTrackArtist}>{t.artist}</div>
                    </div>
                  ))}
                  {tooltip.tracks.length > 5 && (
                    <div style={styles.tooltipMore}>...查看全部</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={styles.sectionCard} className="animate-slideUp">
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>📊 每周播放时长 (小时)</h2>
        </div>

        {weeklyLoading ? (
          <div style={styles.skeletonLinechart} className="shimmer" />
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY_COLOR} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="week"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const hours = payload[0].value as number;
                      const h = Math.floor(hours);
                      const m = Math.round((hours - h) * 60);
                      return (
                        <div style={styles.chartTooltip}>
                          <div style={styles.chartTooltipLabel}>{label}</div>
                          <div style={styles.chartTooltipValue}>
                            <span
                              style={{ color: PRIMARY_COLOR, fontWeight: 600 }}>
                              {h}小时 {m}分钟
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="none"
                  fill="url(#hoursGradient)"
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke={PRIMARY_COLOR}
                  strokeWidth={3}
                  dot={{ r: 4, fill: PRIMARY_COLOR, stroke: BACKGROUND_COLOR, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: PRIMARY_COLOR, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '100px 24px 40px',
    minHeight: '100vh',
    backgroundColor: BACKGROUND_COLOR,
    maxWidth: 1200,
    margin: '0 auto',
    position: 'relative',
  },
  profileCard: {
    backgroundColor: CARD_COLOR,
    borderRadius: 16,
    padding: 32,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    marginBottom: 32,
    position: 'relative',
  },
  profileInner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 32,
  },
  profileLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    gap: 16,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    border: `4px solid ${PRIMARY_COLOR}`,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f3460',
    boxShadow: `0 0 20px rgba(233,69,96,0.3)`,
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(233,69,96,0.15)',
    border: `1px solid rgba(233,69,96,0.4)`,
    borderRadius: 8,
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  profileCenter: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: TEXT_MUTED_6,
    margin: 0,
    marginBottom: 16,
  },
  bio: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 1.7,
    margin: 0,
    opacity: 0.9,
  },
  profileRight: {
    flexShrink: 0,
    width: 360,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 20,
  },
  statItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: '16px',
    minHeight: 80,
  },
  genreItem: {
    gridColumn: 'span 2',
    minHeight: 'auto',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: 500,
  },
  genreTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  genreTag: {
    padding: '4px 10px',
    backgroundColor: 'rgba(233,69,96,0.12)',
    color: PRIMARY_COLOR,
    borderRadius: 12,
    fontWeight: 500,
  },
  emptyGenre: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  editAvatarSection: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  },
  editAvatarPreviewWrapper: {
    flexShrink: 0,
  },
  editAvatarCircle: {
    width: 140,
    height: 140,
    borderRadius: '50%',
    border: `4px solid ${PRIMARY_COLOR}`,
    overflow: 'hidden',
    backgroundColor: '#0f3460',
    transition: 'transform 0.3s ease',
  },
  editAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  avatarControls: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  avatarActions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  avatarActionBtn: {
    padding: '10px 18px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid #2a2a4e',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  rotationSliderWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  rotationLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  rotationSlider: {
    width: '100%',
    accentColor: PRIMARY_COLOR,
  },
  presetGrid: {
    gridColumn: 'span 2',
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 10,
    marginTop: 8,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    border: '1px solid #2a2a4e',
  },
  presetAvatar: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '50%',
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#0f3460',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
  },
  presetAvatarActive: {
    borderColor: PRIMARY_COLOR,
    boxShadow: `0 0 0 2px rgba(233,69,96,0.3)`,
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  formLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formLabel: {
    fontSize: 13,
    color: TEXT_MUTED_6,
    fontWeight: 500,
  },
  charCount: {
    fontSize: 12,
  },
  formInput: {
    padding: '12px 16px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid #2a2a4e',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    transition: 'border-color 0.2s ease',
  },
  formTextarea: {
    padding: '12px 16px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid #2a2a4e',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    resize: 'vertical',
    lineHeight: 1.6,
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit',
  },
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 28,
    paddingTop: 24,
    borderTop: '1px solid #2a2a4e',
  },
  cancelBtn: {
    padding: '10px 28px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a4e',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  saveBtn: {
    padding: '10px 28px',
    backgroundColor: PRIMARY_COLOR,
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    minWidth: 130,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  spinnerWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    display: 'inline-block',
  },
  checkmark: {
    display: 'flex',
    alignItems: 'center',
    color: '#4ade80',
  },
  sectionCard: {
    backgroundColor: CARD_COLOR,
    borderRadius: 16,
    padding: 28,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    marginBottom: 32,
    position: 'relative',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  yearSelect: {
    padding: '8px 14px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    border: '1px solid #2a2a4e',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  },
  skeletonHeatmap: {
    height: 220,
    borderRadius: 8,
    background: 'linear-gradient(90deg, #1a1a3e 25%, #2a2a5e 50%, #1a1a3e 75%)',
    backgroundSize: '200% 100%',
  },
  skeletonLinechart: {
    height: 320,
    borderRadius: 8,
    background: 'linear-gradient(90deg, #1a1a3e 25%, #2a2a5e 50%, #1a1a3e 75%)',
    backgroundSize: '200% 100%',
  },
  calendarWrapper: {
    height: 220,
    position: 'relative',
  },
  customTooltip: {
    backgroundColor: CARD_COLOR,
    padding: 12,
    border: `1px solid ${PRIMARY_COLOR}`,
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    borderRadius: 8,
    maxWidth: 280,
  },
  tooltipDate: {
    fontSize: 13,
    fontWeight: 600,
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  tooltipCount: {
    fontSize: 12,
    color: TEXT_MUTED_6,
    marginBottom: 10,
  },
  tooltipTracks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    borderTop: '1px solid #2a2a4e',
    paddingTop: 8,
  },
  tooltipTrack: {
    overflow: 'hidden',
  },
  tooltipTrackTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tooltipTrackArtist: {
    fontSize: 11,
    color: TEXT_MUTED,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tooltipMore: {
    fontSize: 11,
    color: PRIMARY_COLOR,
    fontStyle: 'italic',
  },
  chartTooltip: {
    backgroundColor: CARD_COLOR,
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  chartTooltipLabel: {
    fontSize: 12,
    color: TEXT_MUTED_6,
    marginBottom: 4,
  },
  chartTooltipValue: {
    fontSize: 14,
    color: '#fff',
  },
};

export default ProfilePage;
