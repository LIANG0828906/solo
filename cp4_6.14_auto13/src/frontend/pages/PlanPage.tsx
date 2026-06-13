import styled from 'styled-components';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store';
import CalendarView from '../components/CalendarView';

const Wrap = styled.div``;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`;

const Title = styled.h2`
  font-size: 24px;
`;

const SubTitle = styled.p`
  color: #8b6a45;
  font-size: 14px;
`;

const Btn = styled.button<{ $primary?: boolean }>`
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  background: ${(p) => (p.$primary ? '#f4a460' : '#ffffff')};
  color: ${(p) => (p.$primary ? '#fff8e7' : '#5c3a1e')};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 200ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const Tip = styled.div`
  background: #fff3dc;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 18px;
  font-size: 13px;
  color: #8b6a45;
`;

export default function PlanPage() {
  const { mealPlan, generatePlan, swapMeals, members } = useAppStore();

  return (
    <Wrap>
      <Header>
        <div>
          <Title>本周用餐计划</Title>
          <SubTitle>拖拽交换任意两个餐段，点击卡片查看详情</SubTitle>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={generatePlan}>
            <RefreshCw size={16} /> 重新生成
          </Btn>
          <Btn $primary onClick={generatePlan}>
            <Sparkles size={16} /> 一键编排
          </Btn>
        </div>
      </Header>

      {members.length === 0 && (
        <Tip>请先在「成员」页面添加家庭成员及其偏好设置。</Tip>
      )}

      <CalendarView meals={mealPlan} onSwap={swapMeals} />
    </Wrap>
  );
}
