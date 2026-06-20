import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Users, Calendar, ShoppingCart, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';

const Hero = styled.div`
  text-align: center;
  padding: 48px 20px 40px;
  background: linear-gradient(135deg, #ffebc9 0%, #fff3dc 100%);
  border-radius: 20px;
  margin-bottom: 32px;
`;

const HeroTitle = styled.h1`
  font-size: 42px;
  color: #5c3a1e;
  margin-bottom: 14px;
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 16px;
  color: #8b6a45;
  max-width: 560px;
  margin: 0 auto 28px;
  line-height: 1.7;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Btn = styled.button<{ $primary?: boolean }>`
  padding: 14px 26px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  background: ${(p) => (p.$primary ? '#f4a460' : '#ffffff')};
  color: ${(p) => (p.$primary ? '#fff8e7' : '#5c3a1e')};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 200ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
`;

const FeatureCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 200ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
`;

const IconWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #fff3dc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f4a460;
  margin-bottom: 14px;
`;

const FeatureTitle = styled.h3`
  font-size: 17px;
  margin-bottom: 8px;
  color: #5c3a1e;
`;

const FeatureDesc = styled.p`
  font-size: 14px;
  color: #8b6a45;
  line-height: 1.6;
`;

export default function HomePage() {
  const navigate = useNavigate();
  const { members, mealPlan } = useAppStore();
  const filledCount = mealPlan.flat().filter(Boolean).length;

  return (
    <div>
      <Hero>
        <HeroTitle>🍽️ 家味编排</HeroTitle>
        <HeroSubtitle>
          根据每位家人的口味偏好、饮食禁忌与可用时间，智能编排一周三餐，
          自动生成采购清单，让家庭用餐省时省心更美味。
        </HeroSubtitle>
        <ActionRow>
          <Btn $primary onClick={() => navigate('/members')}>
            <Users size={18} /> 管理家庭成员
          </Btn>
          <Btn onClick={() => navigate('/plan')}>
            <Calendar size={18} /> 生成本周菜谱
          </Btn>
          <Btn onClick={() => navigate('/shopping')}>
            <ShoppingCart size={18} /> 查看采购清单
          </Btn>
        </ActionRow>
      </Hero>

      <FeatureGrid>
        <FeatureCard>
          <IconWrap><Users size={24} /></IconWrap>
          <FeatureTitle>个性化偏好</FeatureTitle>
          <FeatureDesc>
            支持 4+ 位家庭成员，每人独立设置最多 5 项忌口、3 项偏好菜系与每周餐段可用性。
          </FeatureDesc>
        </FeatureCard>
        <FeatureCard>
          <IconWrap><Calendar size={24} /></IconWrap>
          <FeatureTitle>智能周视图</FeatureTitle>
          <FeatureDesc>
            7×3 菜谱网格，拖拽交换餐段带 3D 翻转动画，点击查看完整食材与步骤。
          </FeatureDesc>
        </FeatureCard>
        <FeatureCard>
          <IconWrap><Sparkles size={24} /></IconWrap>
          <FeatureTitle>自动编排</FeatureTitle>
          <FeatureDesc>
            贪心 + 局部搜索算法，兼顾全家偏好，100 种组合下 500ms 内生成结果。
          </FeatureDesc>
        </FeatureCard>
        <FeatureCard>
          <IconWrap><ShoppingCart size={24} /></IconWrap>
          <FeatureTitle>采购清单</FeatureTitle>
          <FeatureDesc>
            按食材类别分组，同名自动合并数量，勾选时带涟漪动画反馈。
          </FeatureDesc>
        </FeatureCard>
      </FeatureGrid>

      <div style={{ marginTop: 32, textAlign: 'center', color: '#8b6a45', fontSize: 14 }}>
        当前已添加 {members.length} 位成员 · 本周已编排 {filledCount} / 21 餐
      </div>
    </div>
  );
}
