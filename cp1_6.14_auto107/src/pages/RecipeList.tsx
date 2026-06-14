import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Input,
  Row,
  Col,
  Button,
  Typography,
  Select,
  Space,
  Tooltip,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  HeartFilled,
  PlayCircleOutlined,
  FilterOutlined,
  CoffeeOutlined,
  StarFilled,
  CameraOutlined,
} from '@ant-design/icons';
import { useGlobalState } from '../App';
import { Recipe } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export default function RecipeList() {
  const navigate = useNavigate();
  const { recipes, toggleFavorite } = useGlobalState();
  const [searchText, setSearchText] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<number | undefined>(undefined);
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [particles, setParticles] = useState<HeartParticle[]>([]);
  const particleIdRef = useRef(0);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(searchText.toLowerCase()) ||
        r.description.toLowerCase().includes(searchText.toLowerCase());
      const matchDifficulty = difficultyFilter === undefined || r.difficulty === difficultyFilter;
      const matchFavorite = !favoriteFilter || r.isFavorite;
      return matchSearch && matchDifficulty && matchFavorite;
    });
  }, [recipes, searchText, difficultyFilter, favoriteFilter]);

  const favoriteCounts = useMemo(() => recipes.filter(r => r.isFavorite).length, [recipes]);

  const spawnHeartParticles = useCallback((centerX: number, centerY: number) => {
    const colors = ['#ff6b9d', '#ff85a2', '#ffb3c1', '#ff4757', '#ff6348', '#ffa502', '#ff7f50'];
    const newParticles: HeartParticle[] = [];
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = 35 + Math.random() * 45;
      const vx = Math.cos(angle) * distance;
      const vy = Math.sin(angle) * distance;
      newParticles.push({
        id: ++particleIdRef.current,
        x: centerX,
        y: centerY,
        tx: vx,
        ty: vy,
        vx,
        vy,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.floor(Math.random() * 6),
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);
  }, []);

  const handleFavoriteClick = useCallback((e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    toggleFavorite(recipe.id);
    if (!recipe.isFavorite) {
      spawnHeartParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
    }
  }, [toggleFavorite, spawnHeartParticles]);

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <StarFilled
        key={i}
        className="star-icon"
        style={{
          fontSize: 16,
          opacity: i < difficulty ? 1 : 0.25,
        }}
      />
    ));
  };

  const difficultyText = (d: number) => {
    const map: Record<number, string> = { 1: '简单', 2: '中等', 3: '困难' };
    return map[d] || '';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}小时` : `${h}小时${m}分钟`;
  };

  return (
    <Layout style={{ background: 'transparent', minHeight: '100vh' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="dot-particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle at 30% 30%, ${p.color} 0%, ${p.color} 60%, ${p.color}99 100%)`,
            boxShadow: `0 0 ${p.size}px ${p.color}88`,
            // @ts-ignore CSS custom properties
            '--vx': `${p.vx}px`,
            '--vy': `${p.vy}px`,
          }}
        />
      ))}

      <Header
        style={{
          background: 'linear-gradient(135deg, #FFF8F0 0%, #FDF2E4 100%)',
          borderBottom: '1px solid #F5E6D3',
          padding: '0 40px',
          height: 80,
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #DE944A 0%, #8B5A2B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(222, 148, 74, 0.3)',
            }}
          >
            <CoffeeOutlined style={{ fontSize: 24, color: '#FFF' }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, fontFamily: "'Noto Serif SC', serif", color: '#8B5A2B' }}>
              烘焙实验室
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Baking Lab · 你的专属配方工作室
            </Text>
          </div>
        </div>

        <Space size="large">
          <Badge count={favoriteCounts} offset={[-2, 2]} color="#ff6b9d">
            <Button
              type={favoriteFilter ? 'primary' : 'default'}
              icon={<HeartFilled style={{ color: favoriteFilter ? '#FFF' : '#ff6b9d' }} />}
              onClick={() => setFavoriteFilter(!favoriteFilter)}
              className="btn-press"
            >
              我的收藏
            </Button>
          </Badge>
        </Space>
      </Header>

      <Content style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
        <div className="page-enter">
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 28,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: '#B8A389' }} />}
              placeholder="搜索配方名称或描述..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                maxWidth: 380,
                background: '#FFFFFF',
              }}
              allowClear
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilterOutlined style={{ color: '#8B7355' }} />
              <Text type="secondary">难度：</Text>
              <Select
                size="large"
                style={{ width: 140 }}
                placeholder="全部"
                allowClear
                value={difficultyFilter}
                onChange={(v) => setDifficultyFilter(v)}
                options={[
                  { value: 1, label: '⭐ 简单' },
                  { value: 2, label: '⭐⭐ 中等' },
                  { value: 3, label: '⭐⭐⭐ 困难' },
                ]}
              />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary">
                共找到 <Text strong style={{ color: '#DE944A' }}>{filteredRecipes.length}</Text> 个配方
              </Text>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            {filteredRecipes.map(recipe => (
              <Col key={recipe.id} xs={24} sm={12} md={8} lg={8} xl={6}>
                <div
                  className="recipe-card"
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                >
                  <div className="recipe-card-image">
                    <CameraOutlined className="placeholder-icon" />
                    <div className="recipe-card-difficulty">
                      <Tooltip title={`难度：${difficultyText(recipe.difficulty)}`}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {renderStars(recipe.difficulty)}
                        </div>
                      </Tooltip>
                    </div>
                    {recipe.isFavorite && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          background: 'rgba(255, 107, 157, 0.9)',
                          padding: '4px 10px',
                          borderRadius: 20,
                          color: '#FFF',
                          fontSize: 11,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          zIndex: 2,
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <HeartFilled style={{ fontSize: 11 }} /> 收藏
                      </div>
                    )}
                  </div>

                  <div className="recipe-card-body">
                    <div className="recipe-card-name">{recipe.name}</div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.7,
                        marginBottom: 10,
                        minHeight: 32,
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {recipe.description}
                    </div>
                    <div className="recipe-card-time">
                      <ClockCircleOutlined style={{ fontSize: 14 }} />
                      总时长 {formatTime(recipe.totalTime)}
                    </div>

                    <div className="recipe-card-actions">
                      <Button
                        type="text"
                        size="large"
                        icon={recipe.isFavorite ? (
                          <HeartFilled style={{ color: '#FF6B9D', fontSize: 18 }} />
                        ) : (
                          <HeartOutlined style={{ color: '#FFF', fontSize: 18 }} />
                        )}
                        onClick={(e) => handleFavoriteClick(e, recipe)}
                        className="btn-press"
                        style={{
                          flex: 1,
                          color: '#FFF',
                          border: '1px solid rgba(255,255,255,0.3)',
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: 10,
                          height: 40,
                        }}
                      />
                      <Button
                        type="primary"
                        size="large"
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/recipe/${recipe.id}`);
                        }}
                        className="btn-press"
                        style={{
                          flex: 1.5,
                          background: '#FFFFFF',
                          color: '#8B5A2B',
                          border: 'none',
                          fontWeight: 600,
                          height: 40,
                          borderRadius: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        开始制作
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {filteredRecipes.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#B8A389',
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>🍰</div>
              <Title level={4} style={{ color: '#8B7355', marginBottom: 8 }}>
                没有找到匹配的配方
              </Title>
              <Text type="secondary">尝试修改搜索条件或清除筛选器</Text>
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}
