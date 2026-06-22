import React, { useState, useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { addTasting } from '../../api/tea';

const COLORS = [
  { name: '浅黄', value: '#F5DEB3' },
  { name: '金黄', value: '#DAA520' },
  { name: '橙黄', value: '#FFA500' },
  { name: '橙红', value: '#FF6347' },
  { name: '红褐', value: '#A0522D' },
  { name: '深褐', value: '#5C4033' },
  { name: '浅绿', value: '#90EE90' },
  { name: '碧绿', value: '#228B22' },
  { name: '黄绿', value: '#9ACD32' },
  { name: '浅红', value: '#FA8072' },
  { name: '深红', value: '#DC143C' },
  { name: '栗色', value: '#8B4513' },
];

const AROMA_TAGS = ['花香', '果香', '蜜香', '炒豆香', '栗香', '兰香', '药香', '陈香', '烟熏', '松烟'];

const VARIETY_OPTIONS = ['龙井', '碧螺春', '铁观音', '普洱生茶', '普洱熟茶', '大红袍', '正山小种', '白毫银针'];

const MOUTHFEEL_LEVELS = ['清淡', '柔和', '饱满', '浓烈', '厚重'];
const MOUTHFEEL_VALUES = [2, 4, 6, 8, 10];

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#121212',
    minHeight: '100vh',
    padding: '24px 16px',
    color: '#E0E0E0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#E0E0E0',
  },
  label: {
    fontSize: '14px',
    color: '#AAAAAA',
    marginBottom: '8px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#2A2A2A',
    border: '1px solid #3A3A3A',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#2A2A2A',
    border: '1px solid #3A3A3A',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    resize: 'vertical',
    minHeight: '100px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#2A2A2A',
    border: '1px solid #3A3A3A',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    appearance: 'none',
    cursor: 'pointer',
  },
  sliderContainer: {
    width: '100%',
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 600,
    color: '#6B8E23',
    marginBottom: '8px',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#3A3A3A',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '12px',
    justifyItems: 'center',
  },
  colorCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
    boxSizing: 'content-box',
  },
  colorCircleSelected: {
    border: '2px solid #6B8E23',
    transform: 'scale(1.02)',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    padding: '12px',
    backgroundColor: '#F0F0F0',
    color: '#333',
    borderRadius: '20px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    userSelect: 'none',
  },
  tagSelected: {
    backgroundColor: '#6B8E23',
    color: '#FFFFFF',
  },
  mouthfeelContainer: {
    width: '100%',
  },
  mouthfeelLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
  mouthfeelLabel: {
    fontSize: '12px',
    color: '#AAAAAA',
    textAlign: 'center',
    flex: 1,
  },
  mouthfeelBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#3A3A3A',
    borderRadius: '4px',
    position: 'relative',
    cursor: 'pointer',
  },
  mouthfeelFill: {
    height: '100%',
    backgroundColor: '#6B8E23',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  mouthfeelMarkers: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: 'translateY(-50%)',
    display: 'flex',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  mouthfeelMarker: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#1E1E1E',
    border: '2px solid #6B8E23',
    pointerEvents: 'auto',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  mouthfeelMarkerActive: {
    transform: 'scale(1.02)',
    backgroundColor: '#6B8E23',
  },
  radarContainer: {
    width: '100%',
    height: '280px',
    marginBottom: '16px',
  },
  overallRating: {
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 600,
    color: '#6B8E23',
    marginBottom: '16px',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '12px',
  },
  sliderLabel: {
    fontSize: '13px',
    color: '#AAAAAA',
    minWidth: '90px',
  },
  sliderRowSlider: {
    flex: 1,
  },
  sliderRowValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#6B8E23',
    minWidth: '30px',
    textAlign: 'right',
  },
  photoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  photoPreview: {
    width: '100%',
    height: '160px',
    backgroundColor: '#2A2A2A',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    color: '#666',
    fontSize: '13px',
  },
  fileInput: {
    display: 'none',
  },
  fileInputLabel: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#2A2A2A',
    color: '#E0E0E0',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    fontSize: '13px',
    border: '1px dashed #3A3A3A',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#6B8E23',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '24px',
  },
  submitButtonDisabled: {
    backgroundColor: '#3A3A3A',
    cursor: 'not-allowed',
    color: '#666',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: '12px',
    marginTop: '4px',
  },
  customVarietyInput: {
    marginTop: '8px',
  },
};

const TasteRecorder: React.FC = () => {
  const navigate = useNavigate();

  const [teaName, setTeaName] = useState('');
  const [variety, setVariety] = useState('');
  const [customVariety, setCustomVariety] = useState('');
  const [showCustomVariety, setShowCustomVariety] = useState(false);
  const [brewTemperature, setBrewTemperature] = useState(85);
  const [colorCode, setColorCode] = useState('');
  const [aromaTags, setAromaTags] = useState<string[]>([]);
  const [mouthfeelLevel, setMouthfeelLevel] = useState(3);
  const [soupClarity, setSoupClarity] = useState(5);
  const [aromaIntensity, setAromaIntensity] = useState(5);
  const [aftertasteDuration, setAftertasteDuration] = useState(5);
  const [leafIntegrity, setLeafIntegrity] = useState(5);
  const [dryLeafPhotoUrl, setDryLeafPhotoUrl] = useState('');
  const [dryLeafFileName, setDryLeafFileName] = useState('');
  const [infusedLeafPhotoUrl, setInfusedLeafPhotoUrl] = useState('');
  const [infusedLeafFileName, setInfusedLeafFileName] = useState('');
  const [tasteNotes, setTasteNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const mouthfeelRichness = MOUTHFEEL_VALUES[mouthfeelLevel - 1];

  const overallRating = useMemo(() => {
    const sum = soupClarity + aromaIntensity + mouthfeelRichness + aftertasteDuration + leafIntegrity;
    return Math.round((sum / 5) * 10) / 10;
  }, [soupClarity, aromaIntensity, mouthfeelRichness, aftertasteDuration, leafIntegrity]);

  const radarData = [
    { subject: '汤色清澈度', value: soupClarity, fullMark: 10 },
    { subject: '香气浓郁度', value: aromaIntensity, fullMark: 10 },
    { subject: '口感饱满度', value: mouthfeelRichness, fullMark: 10 },
    { subject: '回甘持久度', value: aftertasteDuration, fullMark: 10 },
    { subject: '叶底完整度', value: leafIntegrity, fullMark: 10 },
  ];

  const handleVarietyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomVariety(true);
      setVariety('');
    } else {
      setShowCustomVariety(false);
      setVariety(value);
    }
  };

  const handleColorClick = (color: string) => {
    setColorCode(color);
  };

  const handleTagClick = (tag: string) => {
    if (aromaTags.includes(tag)) {
      setAromaTags(aromaTags.filter((t) => t !== tag));
    } else {
      setAromaTags([...aromaTags, tag]);
    }
  };

  const handleMouthfeelClick = (level: number) => {
    setMouthfeelLevel(level);
  };

  const handleDryLeafPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDryLeafPhotoUrl(url);
      setDryLeafFileName(file.name);
    }
  };

  const handleInfusedLeafPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setInfusedLeafPhotoUrl(url);
      setInfusedLeafFileName(file.name);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!teaName.trim()) {
      newErrors.teaName = '请输入茶叶名称';
    }

    const finalVariety = showCustomVariety ? customVariety : variety;
    if (!finalVariety.trim()) {
      newErrors.variety = '请选择或输入品种';
    }

    if (!colorCode) {
      newErrors.colorCode = '请选择汤色';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const finalVariety = showCustomVariety ? customVariety : variety;
      const tasteNotesArray = tasteNotes.trim() ? tasteNotes.split('\n').filter((n) => n.trim()) : [];

      await addTasting({
        teaName: teaName.trim(),
        variety: finalVariety.trim(),
        brewTemperature,
        rating: overallRating,
        tasteNotes: tasteNotesArray,
        aromaTags,
        colorCode,
        dryLeafPhotoUrl: dryLeafFileName || '',
        infusedLeafPhotoUrl: infusedLeafFileName || '',
        soupClarity,
        aromaIntensity,
        mouthfeelRichness,
        aftertasteDuration,
        leafIntegrity,
      });

      navigate('/history');
    } catch (error) {
      console.error('Failed to submit tasting:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActiveStyle = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1.02)';
  };

  const handleInactiveStyle = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  const getSliderThumbStyle = (): React.CSSProperties => ({
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#6B8E23',
    cursor: 'pointer',
    appearance: 'none',
  });

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>茶叶品鉴记录</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>茶叶名称 *</label>
          <input
            type="text"
            value={teaName}
            onChange={(e) => setTeaName(e.target.value)}
            placeholder="请输入茶叶名称"
            style={{
              ...styles.input,
              borderColor: errors.teaName ? '#FF6B6B' : undefined,
            }}
            onMouseDown={handleActiveStyle}
            onMouseUp={handleInactiveStyle}
            onMouseLeave={handleInactiveStyle}
          />
          {errors.teaName && <span style={styles.errorText}>{errors.teaName}</span>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>品种 *</label>
          <select
            value={showCustomVariety ? 'custom' : variety}
            onChange={handleVarietyChange}
            style={{
              ...styles.select,
              borderColor: errors.variety ? '#FF6B6B' : undefined,
            }}
            onMouseDown={handleActiveStyle}
            onMouseUp={handleInactiveStyle}
            onMouseLeave={handleInactiveStyle}
          >
            <option value="">请选择品种</option>
            {VARIETY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="custom">自定义</option>
          </select>
          {showCustomVariety && (
            <input
              type="text"
              value={customVariety}
              onChange={(e) => setCustomVariety(e.target.value)}
              placeholder="请输入自定义品种"
              style={{ ...styles.input, ...styles.customVarietyInput }}
              onMouseDown={handleActiveStyle}
              onMouseUp={handleInactiveStyle}
              onMouseLeave={handleInactiveStyle}
            />
          )}
          {errors.variety && <span style={styles.errorText}>{errors.variety}</span>}
        </div>

        <div>
          <label style={styles.label}>冲泡水温</label>
          <div style={styles.sliderContainer}>
            <div style={styles.sliderValue}>{brewTemperature}°C</div>
            <input
              type="range"
              min={60}
              max={100}
              step={1}
              value={brewTemperature}
              onChange={(e) => setBrewTemperature(Number(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>汤色选择 *</h3>
        <div style={styles.colorGrid}>
          {COLORS.map((color) => (
            <div
              key={color.value}
              title={color.name}
              onClick={() => handleColorClick(color.value)}
              style={{
                ...styles.colorCircle,
                backgroundColor: color.value,
                ...(colorCode === color.value ? styles.colorCircleSelected : {}),
              }}
              onMouseDown={handleActiveStyle}
              onMouseUp={handleInactiveStyle}
              onMouseLeave={handleInactiveStyle}
            />
          ))}
        </div>
        {errors.colorCode && (
          <span style={{ ...styles.errorText, display: 'block', marginTop: '12px' }}>
            {errors.colorCode}
          </span>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>香气标签</h3>
        <div style={styles.tagsContainer}>
          {AROMA_TAGS.map((tag) => (
            <div
              key={tag}
              onClick={() => handleTagClick(tag)}
              style={{
                ...styles.tag,
                ...(aromaTags.includes(tag) ? styles.tagSelected : {}),
              }}
              onMouseDown={handleActiveStyle}
              onMouseUp={handleInactiveStyle}
              onMouseLeave={handleInactiveStyle}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>口感评分</h3>
        <div style={styles.mouthfeelContainer}>
          <div style={styles.sliderValue}>
            {MOUTHFEEL_LEVELS[mouthfeelLevel - 1]} ({mouthfeelRichness}/10)
          </div>
          <div
            style={styles.mouthfeelBar}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              const level = Math.min(5, Math.max(1, Math.round(percentage * 4) + 1));
              setMouthfeelLevel(level);
            }}
          >
            <div
              style={{
                ...styles.mouthfeelFill,
                width: `${((mouthfeelLevel - 1) / 4) * 100}%`,
              }}
            />
            <div style={styles.mouthfeelMarkers}>
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMouthfeelLevel(level);
                  }}
                  style={{
                    ...styles.mouthfeelMarker,
                    ...(level <= mouthfeelLevel ? styles.mouthfeelMarkerActive : {}),
                  }}
                  onMouseDown={handleActiveStyle}
                  onMouseUp={handleInactiveStyle}
                  onMouseLeave={handleInactiveStyle}
                />
              ))}
            </div>
          </div>
          <div style={styles.mouthfeelLabels}>
            {MOUTHFEEL_LEVELS.map((level, index) => (
              <div
                key={index}
                style={{
                  ...styles.mouthfeelLabel,
                  color: index + 1 === mouthfeelLevel ? '#6B8E23' : '#AAAAAA',
                  fontWeight: index + 1 === mouthfeelLevel ? 600 : 400,
                }}
              >
                {level}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>综合评分</h3>
        <div style={styles.overallRating}>总评分: {overallRating}/10</div>
        <div style={styles.radarContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#3A3A3A" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#AAAAAA', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#666', fontSize: 10 }} />
              <Radar
                name="评分"
                dataKey="value"
                stroke="#6B8E23"
                fill="#6B8E23"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>汤色清澈度</span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={soupClarity}
            onChange={(e) => setSoupClarity(Number(e.target.value))}
            style={{ ...styles.slider, ...styles.sliderRowSlider }}
          />
          <span style={styles.sliderRowValue}>{soupClarity}</span>
        </div>

        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>香气浓郁度</span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={aromaIntensity}
            onChange={(e) => setAromaIntensity(Number(e.target.value))}
            style={{ ...styles.slider, ...styles.sliderRowSlider }}
          />
          <span style={styles.sliderRowValue}>{aromaIntensity}</span>
        </div>

        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>回甘持久度</span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={aftertasteDuration}
            onChange={(e) => setAftertasteDuration(Number(e.target.value))}
            style={{ ...styles.slider, ...styles.sliderRowSlider }}
          />
          <span style={styles.sliderRowValue}>{aftertasteDuration}</span>
        </div>

        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>叶底完整度</span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={leafIntegrity}
            onChange={(e) => setLeafIntegrity(Number(e.target.value))}
            style={{ ...styles.slider, ...styles.sliderRowSlider }}
          />
          <span style={styles.sliderRowValue}>{leafIntegrity}</span>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>干茶照片</h3>
        <div style={styles.photoSection}>
          <div style={styles.photoPreview}>
            {dryLeafPhotoUrl ? (
              <img src={dryLeafPhotoUrl} alt="干茶" style={styles.photoPreviewImg} />
            ) : (
              <span style={styles.photoPlaceholder}>暂无照片</span>
            )}
          </div>
          <input
            type="file"
            id="dryLeafPhoto"
            accept="image/*"
            onChange={handleDryLeafPhoto}
            style={styles.fileInput}
          />
          <label htmlFor="dryLeafPhoto" style={styles.fileInputLabel}>
            {dryLeafPhotoUrl ? '重新上传' : '上传干茶照片'}
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>叶底照片</h3>
        <div style={styles.photoSection}>
          <div style={styles.photoPreview}>
            {infusedLeafPhotoUrl ? (
              <img src={infusedLeafPhotoUrl} alt="叶底" style={styles.photoPreviewImg} />
            ) : (
              <span style={styles.photoPlaceholder}>暂无照片</span>
            )}
          </div>
          <input
            type="file"
            id="infusedLeafPhoto"
            accept="image/*"
            onChange={handleInfusedLeafPhoto}
            style={styles.fileInput}
          />
          <label htmlFor="infusedLeafPhoto" style={styles.fileInputLabel}>
            {infusedLeafPhotoUrl ? '重新上传' : '上传叶底照片'}
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>品鉴笔记</h3>
        <textarea
          value={tasteNotes}
          onChange={(e) => setTasteNotes(e.target.value)}
          placeholder="记录您的品鉴感受..."
          style={styles.textarea}
          onMouseDown={handleActiveStyle}
          onMouseUp={handleInactiveStyle}
          onMouseLeave={handleInactiveStyle}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          ...styles.submitButton,
          ...(submitting ? styles.submitButtonDisabled : {}),
        }}
        onMouseDown={!submitting ? handleActiveStyle : undefined}
        onMouseUp={!submitting ? handleInactiveStyle : undefined}
        onMouseLeave={!submitting ? handleInactiveStyle : undefined}
      >
        {submitting ? '提交中...' : '保存品鉴记录'}
      </button>
    </div>
  );
};

export default TasteRecorder;
