import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Row,
  Col,
  Button,
  Typography,
  Slider,
  InputNumber,
  Card,
  Tag,
  Divider,
  Space,
  Modal,
  Checkbox,
  Empty,
  Tooltip,
  FloatButton,
  Statistic,
  Progress,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  SwapOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  PrinterOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  BgColorsOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  RestOutlined,
  HomeOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  ScheduleOutlined,
  EditOutlined,
  FireOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { useGlobalState } from '../App';
import { Recipe, Ingredient, Step, MenuRecipe } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const TIMELINE_BASE_HUES = [
  25, 30, 20, 35, 15, 40, 45, 10, 50, 5,
];

function getTimelineColor(totalTime: number, hueIndex: number): string {
  const hue = TIMELINE_BASE_HUES[hueIndex % TIMELINE_BASE_HUES.length];
  let saturation = 60;
  let lightness: number;
  if (totalTime <= 15) lightness = 78;
  else if (totalTime <= 30) lightness = 68;
  else if (totalTime <= 60) lightness = 55;
  else if (totalTime <= 120) lightness = 45;
  else lightness = 35;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipes, updateRecipe, showNotification } = useGlobalState();

  const recipe = recipes.find(r => r.id === id);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [displayIngredients, setDisplayIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [prevValues, setPrevValues] = useState({ cost: 0, moisture: 0, softness: 0, calories: 0 });
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'menu'>('ingredients');

  const [alertStepId, setAlertStepId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
  const dragGhostRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedMenuRecipes, setSelectedMenuRecipes] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState<'image' | 'pdf' | null>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recipe) {
      const initIng = recipe.ingredients.map(i => ({ ...i, adjustment: 0 }));
      setIngredients(initIng);
      setDisplayIngredients(initIng);
      setSteps(recipe.steps.map(s => ({
        ...s,
        timerActive: false,
        timerPaused: false,
        timeRemaining: s.duration * 60,
      })));
    }
  }, [recipe?.id]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const calculated = useMemo(() => {
    if (!recipe) return { cost: 0, moisture: 0, softness: 0, calories: 0 };

    let totalCost = 0;
    let totalWeightedMoisture = 0;
    let totalCalories = 0;
    let totalAmount = 0;
    let flourEffect = 0;
    let fatEffect = 0;
    let sugarEffect = 0;

    ingredients.forEach(ing => {
      const factor = 1 + ing.adjustment / 100;
      const adjustedAmount = ing.baseAmount * factor;
      const adjustedPrice = ing.price * factor;
      const adjustedCalories = ing.calories * factor;

      totalCost += adjustedPrice;
      totalCalories += adjustedCalories;
      totalWeightedMoisture += adjustedAmount * ing.moisture;
      totalAmount += adjustedAmount;

      const name = ing.name.toLowerCase();
      if (name.includes('面粉') || name.includes('淀粉')) flourEffect += factor - 1;
      if (name.includes('黄油') || name.includes('油') || name.includes('奶酪') || name.includes('奶油')) fatEffect += factor - 1;
      if (name.includes('糖') || name.includes('蜂蜜')) sugarEffect += factor - 1;
    });

    const avgMoisture = totalAmount > 0 ? totalWeightedMoisture / totalAmount : 0;
    let softness = recipe.baseSoftness;
    softness += flourEffect * -15;
    softness += fatEffect * 12;
    softness += sugarEffect * 8;
    softness = Math.max(0, Math.min(100, softness));

    return {
      cost: Math.round(totalCost * 100) / 100,
      moisture: Math.round(avgMoisture * 10) / 10,
      softness: Math.round(softness),
      calories: Math.round(totalCalories),
    };
  }, [ingredients, recipe]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPrevValues(calculated);
    }, 700);
    return () => clearTimeout(timer);
  }, [calculated]);

  const handleIngredientAdjust = useCallback((ingId: string, value: number | null, immediate = false) => {
    if (value === null) return;

    const newDisplay = displayIngredients.map(i =>
      i.id === ingId ? { ...i, adjustment: value } : i
    );
    setDisplayIngredients(newDisplay);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (immediate) {
      setIngredients(newDisplay);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        setIngredients(newDisplay);
      }, 300);
    }
  }, [displayIngredients]);

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];
    steps.forEach((step, idx) => {
      if (step.timerActive && !step.timerPaused) {
        const interval = setInterval(() => {
          setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            const s = newSteps[idx];
            if (s.timeRemaining <= 1) {
              s.timerActive = false;
              s.timeRemaining = 0;
              setAlertStepId(s.id);
              showNotification(`⏰ 「${s.title}」时间到！`);
              setTimeout(() => setAlertStepId(null), 5000);
            } else {
              s.timeRemaining -= 1;
            }
            return newSteps;
          });
        }, 1000);
        intervals.push(interval);
      }
    });
    return () => intervals.forEach(i => clearInterval(i));
  }, [steps.map(s => `${s.timerActive}-${s.timerPaused}-${s.id}`).join(','), showNotification]);

  const startTimer = (stepId: string) => {
    setSteps(prev => prev.map(s =>
      s.id === stepId ? {
        ...s,
        timerActive: true,
        timerPaused: false,
        timeRemaining: s.timeRemaining > 0 ? s.timeRemaining : s.duration * 60,
      } : s
    ));
  };

  const pauseTimer = (stepId: string) => {
    setSteps(prev => prev.map(s =>
      s.id === stepId ? { ...s, timerPaused: true } : s
    ));
  };

  const resetTimer = (stepId: string) => {
    setSteps(prev => prev.map(s =>
      s.id === stepId ? {
        ...s,
        timerActive: false,
        timerPaused: false,
        timeRemaining: s.duration * 60,
      } : s
    ));
  };

  const updateStepDuration = (stepId: string, mins: number) => {
    setSteps(prev => prev.map(s =>
      s.id === stepId ? {
        ...s,
        duration: mins,
        timeRemaining: mins * 60,
      } : s
    ));
  };

  const formatTimeDisplay = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setGhostPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index && draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
    if (dragGhostRef.current) {
      dragGhostRef.current.style.left = `${e.clientX - ghostPosition.x}px`;
      dragGhostRef.current.style.top = `${e.clientY - ghostPosition.y}px`;
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newSteps = [...steps];
    const [moved] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(dragOverIndex, 0, moved);
    setSteps(newSteps);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const menuRecipes = useMemo<MenuRecipe[]>(() => {
    return selectedMenuRecipes.map((rid, idx) => {
      const r = recipes.find(x => x.id === rid);
      const totalTime = r?.totalTime || 0;
      return {
        recipeId: rid,
        recipeName: r?.name || '',
        order: idx,
        totalTime,
        color: getTimelineColor(totalTime, idx),
      };
    });
  }, [selectedMenuRecipes, recipes]);

  const menuTotalTime = useMemo(() => {
    return menuRecipes.reduce((sum, r) => sum + r.totalTime, 0);
  }, [menuRecipes]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}小时` : `${h}小时${m}分钟`;
  };

  const handleExportImage = async () => {
    if (!exportCardRef.current) return;
    setExportLoading('image');
    try {
      const canvas = await html2canvas(exportCardRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${recipe?.name || '食谱'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      message.success('食谱卡片图片已导出');
    } catch (err) {
      message.error('导出失败，请重试');
    }
    setExportLoading(null);
  };

  const handleExportPDF = async () => {
    if (!exportCardRef.current) return;
    setExportLoading('pdf');
    try {
      const canvas = await html2canvas(exportCardRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, (297 - imgHeight) / 2, imgWidth, imgHeight);
      pdf.save(`${recipe?.name || '食谱'}.pdf`);
      message.success('食谱卡片PDF已导出');
    } catch (err) {
      message.error('导出失败，请重试');
    }
    setExportLoading(null);
  };

  if (!recipe) {
    return (
      <Layout style={{ background: 'transparent', minHeight: '100vh' }}>
        <Content style={{ padding: 100 }}>
          <Empty description="配方不存在" />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        </Content>
      </Layout>
    );
  }

  const caloriePercent = Math.min(100, (calculated.calories / (recipe.baseCalories * 1.5)) * 100);
  const calorieCircumference = 2 * Math.PI * 45;

  return (
    <Layout style={{ background: 'transparent', minHeight: '100vh' }}>
      <Header
        style={{
          background: 'linear-gradient(135deg, #FFF8F0 0%, #FDF2E4 100%)',
          borderBottom: '1px solid #F5E6D3',
          padding: '0 40px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          className="btn-press"
        >
          返回
        </Button>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0, color: '#8B5A2B', fontFamily: "'Noto Serif SC', serif" }}>
            {recipe.name}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {recipe.description}
          </Text>
        </div>
        <Space>
          <Tag icon={<ScheduleOutlined />} color="default" style={{ padding: '4px 12px' }}>
            {formatTime(recipe.totalTime)}
          </Tag>
          <Button
            type="primary"
            icon={<AppstoreOutlined />}
            onClick={() => {
              setSelectedMenuRecipes([recipe.id]);
              setShowMenuModal(true);
            }}
            className="btn-press"
          >
            组合菜单
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => setShowExportModal(true)}
            className="btn-press"
          >
            导出食谱
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '28px 40px', maxWidth: 1600, margin: '0 auto' }}>
        <div className="page-enter">
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 24,
              background: '#FFFFFF',
              padding: 6,
              borderRadius: 14,
              width: 'fit-content',
              border: '1px solid #F5E6D3',
            }}
          >
            {[
              { key: 'ingredients', label: '🧪 原料实验室', icon: <BgColorsOutlined /> },
              { key: 'steps', label: '📝 制作步骤', icon: <EditOutlined /> },
              { key: 'menu', label: '📅 菜单编排', icon: <AppstoreOutlined /> },
            ].map(tab => (
              <Button
                key={tab.key}
                type={activeTab === tab.key ? 'primary' : 'text'}
                icon={tab.icon}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  borderRadius: 10,
                  height: 44,
                  padding: '0 20px',
                }}
                className="btn-press"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'ingredients' && (
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={15}>
                <Card
                  title={<span><BgColorsOutlined style={{ color: '#DE944A', marginRight: 8 }} />原料清单 · 拖动滑块调整配比</span>}
                  style={{ borderRadius: 16, border: '1px solid #F5E6D3' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {displayIngredients.map(ing => {
                      const factor = 1 + ing.adjustment / 100;
                      const adjusted = (ing.baseAmount * factor);
                      return (
                        <div key={ing.id} className="ingredient-row">
                          <div style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ fontWeight: 600, color: '#3D2914', fontSize: 15 }}>
                              {ing.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#8B7355', marginTop: 2 }}>
                              基础: {ing.baseAmount}{ing.unit}
                              {ing.adjustment !== 0 && (
                                <span style={{
                                  color: ing.adjustment > 0 ? '#22c55e' : '#ef4444',
                                  marginLeft: 8,
                                  fontWeight: 500,
                                }}>
                                  {ing.adjustment > 0 ? '↑' : '↓'}
                                  {Math.abs(ing.adjustment)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ width: 90, textAlign: 'right' }}>
                            <Text strong style={{
                              color: ing.adjustment === 0 ? '#3D2914' : ing.adjustment > 0 ? '#22c55e' : '#ef4444',
                              fontSize: 15,
                            }}>
                              {adjusted.toFixed(ing.baseAmount % 1 === 0 ? 0 : 1)}
                              <Text type="secondary" style={{ fontSize: 12, marginLeft: 2 }}>{ing.unit}</Text>
                            </Text>
                          </div>
                          <div style={{ width: 260, flexShrink: 0 }}>
                            <Slider
                              className="gradient-slider"
                              min={-50}
                              max={50}
                              step={1}
                              value={ing.adjustment}
                              onChange={(v) => handleIngredientAdjust(ing.id, v as number, false)}
                              onChangeComplete={(v) => handleIngredientAdjust(ing.id, v as number, true)}
                              tooltip={{
                                formatter: (v) => `${v! >= 0 ? '+' : ''}${v}%`,
                              }}
                            />
                          </div>
                          <div style={{ width: 90 }}>
                            <InputNumber
                              size="small"
                              min={-50}
                              max={50}
                              step={1}
                              value={ing.adjustment}
                              onChange={(v) => handleIngredientAdjust(ing.id, v as number, true)}
                              style={{ width: '100%', borderRadius: 8 }}
                              formatter={v => `${v! >= 0 ? '+' : ''}${v}%`}
                              parser={v => Number(v!.replace('%', ''))}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={9}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card
                    style={{ borderRadius: 16, border: '1px solid #F5E6D3' }}
                    bodyStyle={{ padding: 24 }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Statistic
                          title={<span style={{ fontSize: 12 }}><DollarOutlined /> 原料总成本</span>}
                          value={calculated.cost}
                          precision={2}
                          prefix="¥"
                          formatter={(value) => (
                            <AnimatedNumber
                              value={value as number}
                              oldValue={prevValues.cost}
                            />
                          )}
                          valueStyle={{ color: '#DE944A', fontSize: 28, fontWeight: 700 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title={<span style={{ fontSize: 12 }}><CloudOutlined /> 预估水分</span>}
                          value={calculated.moisture}
                          precision={1}
                          suffix="%"
                          formatter={(value) => (
                            <AnimatedNumber
                              value={value as number}
                              oldValue={prevValues.moisture}
                              precision={1}
                            />
                          )}
                          valueStyle={{ color: '#4DABF7', fontSize: 28, fontWeight: 700 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title={<span style={{ fontSize: 12 }}><RestOutlined /> 预估松软度</span>}
                          value={calculated.softness}
                          suffix="分"
                          formatter={(value) => (
                            <AnimatedNumber
                              value={value as number}
                              oldValue={prevValues.softness}
                            />
                          )}
                          valueStyle={{
                            color: calculated.softness > recipe.baseSoftness ? '#22c55e' :
                              calculated.softness < recipe.baseSoftness ? '#ef4444' : '#F59F00',
                            fontSize: 28,
                            fontWeight: 700,
                          }}
                        />
                      </Col>
                      <Col span={12}>
                        <div>
                          <div style={{ fontSize: 12, color: '#8B7355', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FireOutlined style={{ color: '#FF6B6B' }} />
                            热量计算器
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="circular-progress-container">
                              <svg width="110" height="110" className="circular-progress-svg">
                                <defs>
                                  <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FF8C00" />
                                    <stop offset="50%" stopColor="#FF6B6B" />
                                    <stop offset="100%" stopColor="#EE5A6F" />
                                  </linearGradient>
                                </defs>
                                <circle
                                  className="circular-progress-track"
                                  cx="55"
                                  cy="55"
                                  r="45"
                                  strokeWidth="8"
                                />
                                <circle
                                  className="circular-progress-indicator"
                                  cx="55"
                                  cy="55"
                                  r="45"
                                  strokeWidth="8"
                                  strokeDasharray={calorieCircumference}
                                  strokeDashoffset={calorieCircumference * (1 - caloriePercent / 100)}
                                />
                              </svg>
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexDirection: 'column',
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#EE5A6F' }}>
                                  <AnimatedNumber value={calculated.calories} oldValue={prevValues.calories} />
                                </div>
                                <div style={{ fontSize: 10, color: '#8B7355' }}>kcal</div>
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, color: '#8B7355', marginBottom: 4 }}>
                                基准值：{recipe.baseCalories} kcal
                              </div>
                              <Progress
                                percent={Math.round((calculated.calories / recipe.baseCalories) * 100) - 100}
                                showInfo={false}
                                strokeColor={calculated.calories >= recipe.baseCalories ? '#FF6B6B' : '#51CF66'}
                                size="small"
                                style={{ marginBottom: 8 }}
                              />
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: 11,
                                  color: calculated.calories >= recipe.baseCalories ? '#FF6B6B' : '#51CF66',
                                }}
                              >
                                {calculated.calories >= recipe.baseCalories ? '⚠️' : '✓'} 较基准{' '}
                                {calculated.calories >= recipe.baseCalories ? '+' : ''}
                                {Math.round((calculated.calories / recipe.baseCalories) * 100) - 100}%
                              </Text>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  <Card
                    title={<span><ThunderboltOutlined style={{ color: '#FFD43B', marginRight: 8 }} />调整影响分析</span>}
                    style={{ borderRadius: 16, border: '1px solid #F5E6D3' }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <Paragraph style={{ margin: 0, fontSize: 13, color: '#3D2914', lineHeight: 1.9 }}>
                      {(() => {
                        const tips: string[] = [];
                        const flourAdj = ingredients.find(i => i.name.includes('面粉'))?.adjustment || 0;
                        const fatAdj = (
                          (ingredients.find(i => i.name.includes('黄油'))?.adjustment || 0) +
                          (ingredients.find(i => i.name.includes('油'))?.adjustment || 0)
                        ) / 2;
                        const sugarAdj = (
                          (ingredients.find(i => i.name.includes('糖'))?.adjustment || 0) +
                          (ingredients.find(i => i.name.includes('蜂蜜'))?.adjustment || 0)
                        ) / 2;

                        if (flourAdj > 5) tips.push(`面粉增加 ${flourAdj}%，成品会更紧实，松软度⬇`);
                        if (flourAdj < -5) tips.push(`面粉减少 ${Math.abs(flourAdj)}%，成品会更松软易碎`);
                        if (fatAdj > 5) tips.push(`油脂增加 ${Math.round(fatAdj)}%，口感更滋润，保质期延长`);
                        if (fatAdj < -5) tips.push(`油脂减少 ${Math.round(Math.abs(fatAdj))}%，成品偏干，注意保湿`);
                        if (sugarAdj > 5) tips.push(`糖分增加 ${Math.round(sugarAdj)}%，甜度上升，上色会更快`);
                        if (sugarAdj < -5) tips.push(`糖分减少 ${Math.round(Math.abs(sugarAdj))}%，风味更清淡，注意调整烘焙时间`);
                        if (tips.length === 0) tips.push('配比在正常范围内，预计成品符合配方预期 ✨');
                        return tips.map((t, i) => (
                          <div key={i} style={{ marginBottom: i < tips.length - 1 ? 8 : 0 }}>• {t}</div>
                        ));
                      })()}
                    </Paragraph>
                  </Card>
                </Space>
              </Col>
            </Row>
          )}

          {activeTab === 'steps' && (
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card
                  title={
                    <span>
                      <EditOutlined style={{ color: '#DE944A', marginRight: 8 }} />
                      制作步骤 · 拖拽左侧手柄调整顺序 · 共 {steps.length} 步
                    </span>
                  }
                  extra={
                    <Tooltip title="添加新步骤">
                      <Button icon={<PlusOutlined />} size="small" className="btn-press">
                        添加步骤
                      </Button>
                    </Tooltip>
                  }
                  style={{ borderRadius: 16, border: '1px solid #F5E6D3' }}
                  bodyStyle={{ padding: 20 }}
                >
                  {draggedIndex !== null && (
                    <div
                      ref={dragGhostRef}
                      className="step-drag-ghost"
                      style={{
                        padding: '16px 20px',
                        width: Math.min(600, window.innerWidth - 100),
                      }}
                    >
                      <Text strong style={{ color: '#8B5A2B' }}>
                        步骤 {draggedIndex + 1}: {steps[draggedIndex]?.title}
                      </Text>
                    </div>
                  )}

                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className={`step-card ${draggedIndex === idx ? 'dragging' : ''} ${dragOverIndex === idx ? 'drag-over' : ''} ${alertStepId === step.id ? 'timer-alert' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, idx)}
                        onDragOver={(e) => onDragOver(e, idx)}
                        onDrop={onDrop}
                        onDragEnd={onDragEnd}
                        style={{
                          padding: '18px 20px',
                          background: '#FFFFFF',
                          border: '2px solid',
                          borderColor: dragOverIndex === idx ? '#DE944A' : '#F5E6D3',
                          borderRadius: 14,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div
                            className="drag-handle"
                            style={{
                              padding: '8px 4px',
                              marginTop: 4,
                            }}
                          >
                            <HolderOutlined style={{ fontSize: 18 }} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                              <Tag
                                color="orange"
                                style={{
                                  margin: 0,
                                  padding: '4px 12px',
                                  fontWeight: 600,
                                  borderRadius: 8,
                                  fontSize: 13,
                                }}
                              >
                                步骤 {idx + 1}
                              </Tag>
                              <Text strong style={{ fontSize: 16, color: '#3D2914' }}>
                                {step.title}
                              </Text>
                              {step.duration > 0 && (
                                <Tag icon={<ScheduleOutlined />} color="blue" style={{ borderRadius: 8 }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    预设
                                    <InputNumber
                                      size="small"
                                      min={1}
                                      max={600}
                                      value={step.duration}
                                      onChange={(v) => v !== null && updateStepDuration(step.id, v)}
                                      controls={false}
                                      style={{
                                        width: 60,
                                        margin: '0 4px',
                                        borderRadius: 6,
                                        borderColor: '#D0EBFF',
                                      }}
                                    />
                                    分钟
                                  </span>
                                </Tag>
                              )}
                            </div>

                            <Paragraph
                              style={{
                                margin: '0 0 12px',
                                color: '#5A4830',
                                fontSize: 14,
                                lineHeight: 1.7,
                              }}
                            >
                              {step.description}
                            </Paragraph>

                            {step.notes && (
                              <div
                                style={{
                                  background: '#FFF9DB',
                                  padding: '8px 14px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  color: '#8B7355',
                                  marginBottom: 12,
                                  borderLeft: '3px solid #FFD43B',
                                }}
                              >
                                💡 {step.notes}
                              </div>
                            )}

                            {step.duration > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 16,
                                  background: step.timerActive ? 'linear-gradient(135deg, #FFF2E2 0%, #FFECD1 100%)' : '#FDF8F2',
                                  padding: '12px 16px',
                                  borderRadius: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 32,
                                    fontWeight: 700,
                                    fontFamily: 'monospace',
                                    color: step.timeRemaining === 0 ? '#FF6B6B' : '#DE944A',
                                    fontVariantNumeric: 'tabular-nums',
                                    letterSpacing: 2,
                                    minWidth: 110,
                                  }}
                                >
                                  {formatTimeDisplay(step.timeRemaining)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <Progress
                                    percent={Math.round(((step.duration * 60 - step.timeRemaining) / (step.duration * 60)) * 100)}
                                    showInfo={false}
                                    strokeColor={{ from: '#DE944A', to: '#FF8C00' }}
                                    size="small"
                                    style={{ marginBottom: 4 }}
                                  />
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    进度 {Math.round(((step.duration * 60 - step.timeRemaining) / (step.duration * 60)) * 100)}%
                                  </Text>
                                </div>
                                <Space>
                                  {(!step.timerActive || step.timerPaused) && (
                                    <Button
                                      type="primary"
                                      size="large"
                                      icon={<PlayCircleOutlined />}
                                      onClick={() => startTimer(step.id)}
                                      className="btn-press"
                                      style={{
                                        minWidth: 100,
                                        borderRadius: 10,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {step.timeRemaining > 0 && step.timeRemaining < step.duration * 60 ? '继续' : '开始'}
                                    </Button>
                                  )}
                                  {step.timerActive && !step.timerPaused && (
                                    <Button
                                      size="large"
                                      icon={<PauseCircleOutlined />}
                                      onClick={() => pauseTimer(step.id)}
                                      className="btn-press"
                                      style={{
                                        minWidth: 100,
                                        borderRadius: 10,
                                        background: '#FFD43B',
                                        color: '#3D2914',
                                        border: 'none',
                                        fontWeight: 600,
                                      }}
                                    >
                                      暂停
                                    </Button>
                                  )}
                                  <Button
                                    size="large"
                                    icon={<ReloadOutlined />}
                                    onClick={() => resetTimer(step.id)}
                                    className="btn-press"
                                    danger
                                    style={{
                                      minWidth: 100,
                                      borderRadius: 10,
                                      fontWeight: 500,
                                    }}
                                  >
                                    重置
                                  </Button>
                                </Space>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>
          )}

          {activeTab === 'menu' && (
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={14}>
                <Card
                  title={<span><AppstoreOutlined style={{ color: '#DE944A', marginRight: 8 }} />配方库 · 选择要组合的配方</span>}
                  style={{ borderRadius: 16, border: '1px solid #F5E6D3' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {recipes.map(r => (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: selectedMenuRecipes.includes(r.id)
                            ? '2px solid #DE944A'
                            : '2px solid transparent',
                          background: selectedMenuRecipes.includes(r.id)
                            ? 'linear-gradient(135deg, #FFF2E2 0%, #FFF8F0 100%)'
                            : '#FDF8F2',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                        }}
                        onClick={() => {
                          setSelectedMenuRecipes(prev =>
                            prev.includes(r.id)
                              ? prev.filter(id => id !== r.id)
                              : [...prev, r.id]
                          );
                        }}
                      >
                        <Checkbox checked={selectedMenuRecipes.includes(r.id)} />
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #3D3D3D, #5A5A5A)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <HomeOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#3D2914' }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: '#8B7355', marginTop: 2 }}>
                            难度 {'⭐'.repeat(r.difficulty)} · {formatTime(r.totalTime)}
                          </div>
                        </div>
                        {selectedMenuRecipes.includes(r.id) && (
                          <Tag color="orange" style={{ margin: 0 }}>
                            第 {selectedMenuRecipes.indexOf(r.id) + 1} 步
                          </Tag>
                        )}
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={10}>
                <Card
                  title={<span><ScheduleOutlined style={{ color: '#DE944A', marginRight: 8 }} />时间轴概览</span>}
                  style={{ borderRadius: 16, border: '1px solid #F5E6D3' }}
                  bodyStyle={{ padding: 20 }}
                >
                  {menuRecipes.length === 0 ? (
                    <Empty
                      description={<span style={{ color: '#B8A389' }}>请从左侧选择配方组合菜单</span>}
                      style={{ padding: '40px 20px' }}
                    />
                  ) : (
                    <>
                      <div className="timeline-track" style={{ marginBottom: 24 }}>
                        {menuRecipes.map((m) => {
                          const percent = (m.totalTime / menuTotalTime) * 100;
                          return (
                            <Tooltip
                              key={m.recipeId}
                              title={
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                    步骤 {m.order + 1}: {m.recipeName}
                                  </div>
                                  <div style={{ opacity: 0.85 }}>预计用时 {formatTime(m.totalTime)}</div>
                                </div>
                              }
                              placement="top"
                              mouseEnterDelay={0.1}
                              color="rgba(61, 41, 20, 0.95)"
                            >
                              <div
                                className="timeline-block"
                                style={{
                                  width: `${percent}%`,
                                  background: m.color,
                                }}
                              >
                                {percent > 8 && formatTime(m.totalTime)}
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          textAlign: 'center',
                          padding: '16px 20px',
                          background: 'linear-gradient(135deg, #FFF2E2 0%, #FFECD1 100%)',
                          borderRadius: 12,
                          marginBottom: 20,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>总预估时长</Text>
                        <div style={{ fontSize: 28, fontWeight: 700, color: '#8B5A2B', marginTop: 4 }}>
                          {formatTime(menuTotalTime)}
                        </div>
                      </div>

                      <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 20 }}>
                        {menuRecipes.map((m) => (
                          <div
                            key={m.recipeId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              borderRadius: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                background: m.color,
                                flexShrink: 0,
                              }}
                            />
                            <Text style={{ flex: 1, fontSize: 13 }}>{m.recipeName}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(m.totalTime)}</Text>
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              danger
                              onClick={() => setSelectedMenuRecipes(prev => prev.filter(id => id !== m.recipeId))}
                            />
                          </div>
                        ))}
                      </Space>

                      <Space style={{ width: '100%' }}>
                        <Button
                          block
                          icon={<PrinterOutlined />}
                          type="primary"
                          size="large"
                          onClick={() => setShowExportModal(true)}
                          className="btn-press"
                          style={{ borderRadius: 10, fontWeight: 600 }}
                        >
                          导出生成食谱
                        </Button>
                      </Space>
                    </>
                  )}
                </Card>
              </Col>
            </Row>
          )}
        </div>
      </Content>

      <FloatButton.BackTop
        type="primary"
        style={{ right: 30, bottom: 30 }}
      />

      <Modal
        title={<span><AppstoreOutlined style={{ color: '#DE944A', marginRight: 8 }} />菜单创作中心</span>}
        open={showMenuModal}
        onCancel={() => setShowMenuModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowMenuModal(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              setShowMenuModal(false);
              setShowExportModal(true);
            }}
            disabled={selectedMenuRecipes.length === 0}
          >
            去导出食谱
          </Button>,
        ]}
        width={900}
      >
        <div style={{ padding: '16px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            从配方库中多选，组合为完整菜单（当前已选 {selectedMenuRecipes.length} 个）
          </Text>
          <Divider style={{ margin: '16px 0' }} />
          <Row gutter={[16, 16]}>
            {recipes.map(r => {
              const selected = selectedMenuRecipes.includes(r.id);
              return (
                <Col xs={24} sm={12} md={8} key={r.id}>
                  <div
                    onClick={() => {
                      setSelectedMenuRecipes(prev =>
                        prev.includes(r.id)
                          ? prev.filter(id => id !== r.id)
                          : [...prev, r.id]
                      );
                    }}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: selected ? '2px solid #DE944A' : '2px solid transparent',
                      background: selected ? '#FFF2E2' : '#FDF8F2',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 14 }}>{r.name}</Text>
                      <Checkbox checked={selected} />
                    </div>
                    <div style={{ fontSize: 11, color: '#8B7355' }}>
                      {'⭐'.repeat(r.difficulty)} · {formatTime(r.totalTime)}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </Modal>

      <Modal
        title={<span><PrinterOutlined style={{ color: '#DE944A', marginRight: 8 }} />导出食谱卡片</span>}
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        footer={[
          <Button
            key="image"
            icon={<FileImageOutlined />}
            size="large"
            onClick={handleExportImage}
            loading={exportLoading === 'image'}
            style={{
              minWidth: 160,
              background: exportLoading === 'image' ? undefined : 'linear-gradient(135deg, #DE944A, #CD853F)',
              color: '#FFF',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
            }}
            className="btn-press"
          >
            {exportLoading === 'image' ? (
              <><span className="loading-spinner" style={{ marginRight: 8 }} />导出中...</>
            ) : '导出为图片'}
          </Button>,
          <Button
            key="pdf"
            type="primary"
            icon={<FilePdfOutlined />}
            size="large"
            onClick={handleExportPDF}
            loading={exportLoading === 'pdf'}
            style={{
              minWidth: 160,
              borderRadius: 10,
              fontWeight: 600,
            }}
            className="btn-press"
          >
            {exportLoading === 'pdf' ? (
              <><span className="loading-spinner" style={{ marginRight: 8 }} />导出中...</>
            ) : '导出为PDF'}
          </Button>,
        ]}
        width={700}
        styles={{ body: { background: '#F5F5F5', padding: 24 } }}
      >
        <div
          style={{
            background: '#E8E8E8',
            padding: 24,
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <div
            className="export-card"
            ref={exportCardRef}
            style={{
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '18mm 16mm',
              position: 'relative',
              background: '#FFFFFF',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              borderRadius: 2,
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            <div className="export-oven-icon" style={{ position: 'absolute', top: '12mm', left: '12mm' }}>
              <svg viewBox="64 64 896 896" width="36" height="36" fill="currentColor">
                <path d="M832 384h-64V192H256v192h-64a32 32 0 0 0-32 32v448a32 32 0 0 0 32 32h640a32 32 0 0 0 32-32V416a32 32 0 0 0-32-32zM320 256h384v128H320V256zm448 480H256V480h512v256zm-240-80a48 48 0 1 0 0-96 48 48 0 0 0 0 96z" />
              </svg>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 4, width: '100%' }}>
              <div style={{ fontSize: 11, color: '#B8A389', letterSpacing: 4, marginBottom: 8 }}>
                BAKING LAB RECIPE
              </div>
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: '#8B5A2B',
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 30,
                  letterSpacing: 2,
                }}
              >
                {(menuRecipes.length > 0 ? '专属烘焙菜单' : recipe.name)}
              </Title>
              <div style={{ marginTop: 10, color: '#8B7355', fontSize: 12 }}>
                {menuRecipes.length > 0
                  ? `共 ${menuRecipes.length} 道 · 总时长 ${formatTime(menuTotalTime)}`
                  : recipe.description}
              </div>
            </div>

            <Divider style={{ borderColor: '#F5E6D3', margin: '0 0 20px 0', width: '100%' }} />

            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
            {menuRecipes.length > 0 ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#8B5A2B', marginBottom: 16, textAlign: 'center' }}>
                  📋 菜单组成
                </div>
                {menuRecipes.map((m, i) => {
                  const subRecipe = recipes.find(r => r.id === m.recipeId);
                  return (
                    <div key={m.recipeId} style={{ marginBottom: i < menuRecipes.length - 1 ? 20 : 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          paddingBottom: 8,
                          borderBottom: '1px dashed #F5E6D3',
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: m.color,
                            color: '#FFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </div>
                        <Text strong style={{ fontSize: 15, color: '#3D2914', flex: 1 }}>
                          {m.recipeName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatTime(m.totalTime)}
                        </Text>
                      </div>
                      <div style={{ paddingLeft: 38 }}>
                        <div style={{ fontSize: 11, color: '#8B7355', fontWeight: 600, marginBottom: 4 }}>
                          原料（基础量）
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 8 }}>
                          {subRecipe?.ingredients.slice(0, 6).map(ing => (
                            <span key={ing.id} style={{ fontSize: 11, color: '#5A4830' }}>
                              {ing.name} {ing.baseAmount}{ing.unit}
                            </span>
                          ))}
                          {subRecipe && subRecipe.ingredients.length > 6 && (
                            <span style={{ fontSize: 11, color: '#B8A389' }}>
                              +{subRecipe.ingredients.length - 6} 项
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#8B7355', fontWeight: 600, marginBottom: 4 }}>
                          步骤
                        </div>
                        <div style={{ fontSize: 11, color: '#5A4830' }}>
                          {subRecipe?.steps.map((s, j) => `步骤${j + 1}: ${s.title}`).join(' · ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Row gutter={32}>
                <Col span={10}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#8B5A2B', marginBottom: 16 }}>
                    🧪 原料清单
                  </div>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {ingredients.map(ing => {
                      const factor = 1 + ing.adjustment / 100;
                      return (
                        <div
                          key={ing.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            padding: '4px 0',
                            borderBottom: '1px dashed #F5E6D3',
                          }}
                        >
                          <span style={{ color: '#3D2914' }}>{ing.name}</span>
                          <span style={{ color: '#8B5A2B', fontWeight: 600 }}>
                            {(ing.baseAmount * factor).toFixed(ing.baseAmount % 1 === 0 ? 0 : 1)} {ing.unit}
                            {ing.adjustment !== 0 && (
                              <span style={{
                                color: ing.adjustment > 0 ? '#22c55e' : '#ef4444',
                                fontSize: 10,
                                marginLeft: 4,
                              }}>
                                ({ing.adjustment > 0 ? '+' : ''}{ing.adjustment}%)
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </Space>

                  <div style={{ marginTop: 20, padding: 14, background: '#FFF8F0', borderRadius: 8 }}>
                    <Row gutter={8}>
                      <Col span={12}>
                        <div style={{ fontSize: 10, color: '#8B7355' }}>总成本</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#DE944A' }}>¥{calculated.cost}</div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 10, color: '#8B7355' }}>总热量</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#FF6B6B' }}>{calculated.calories} kcal</div>
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col span={14}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#8B5A2B', marginBottom: 16 }}>
                    📝 制作步骤
                  </div>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {steps.map((step, idx) => (
                      <div
                        key={step.id}
                        style={{
                          padding: '10px 12px',
                          background: idx % 2 === 0 ? '#FFFCF8' : '#FFFFFF',
                          borderRadius: 6,
                          borderLeft: '3px solid #DE944A',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#3D2914', marginBottom: 2 }}>
                          <Tag color="orange" style={{ marginRight: 8, fontSize: 10, padding: '0 6px' }}>
                            步骤{idx + 1}
                          </Tag>
                          {step.title}
                          <Text type="secondary" style={{ fontSize: 10, marginLeft: 8, fontWeight: 400 }}>
                            {step.duration > 0 && `· ${step.duration}分钟`}
                          </Text>
                        </div>
                        <div style={{ fontSize: 11, color: '#5A4830', lineHeight: 1.6, paddingLeft: 2 }}>
                          {step.description}
                        </div>
                        {step.notes && (
                          <div style={{ fontSize: 10, color: '#B8860B', marginTop: 4, paddingLeft: 2 }}>
                            💡 {step.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </Space>
                </Col>
              </Row>
            )}
            </div>

            <Divider style={{ borderColor: '#F5E6D3', margin: '16px 0', width: '100%' }} />

            <div style={{ textAlign: 'center', color: '#B8A389', fontSize: 10 }}>
              <SwapOutlined style={{ marginRight: 6 }} />
              由 Baking Lab 烘焙实验室生成 · {new Date().toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

interface AnimatedNumberProps {
  value: number;
  oldValue: number;
  precision?: number;
}

function AnimatedNumber({ value, oldValue, precision = 0 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(oldValue || value);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (value === oldValue || oldValue === 0 && value === 0) {
      setDisplay(value);
      setDirection(null);
      return;
    }

    const start = display;
    const end = value;
    const duration = 500;
    const startTime = performance.now();
    const diff = end - start;

    setDirection(diff > 0 ? 'up' : 'down');

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * easeProgress;
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(end);
        setTimeout(() => setDirection(null), 300);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span className={`number-roll ${direction === 'up' ? 'change-up' : direction === 'down' ? 'change-down' : ''}`}>
      {display.toFixed(precision)}
    </span>
  );
}
