import styled from 'styled-components';
import MemberPanel from '../components/MemberPanel';

const Wrap = styled.div``;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 8px;
`;

const SubTitle = styled.p`
  color: #8b6a45;
  margin-bottom: 24px;
  font-size: 14px;
`;

export default function MembersPage() {
  return (
    <Wrap>
      <Title>家庭成员管理</Title>
      <SubTitle>添加家庭成员并设置其饮食偏好、忌口和每周可用餐时段。</SubTitle>
      <MemberPanel />
    </Wrap>
  );
}
