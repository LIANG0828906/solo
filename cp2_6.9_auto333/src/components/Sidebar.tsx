import React from 'react'
import styled from '@emotion/styled'
import { useGame } from '../App'

const SidebarContainer = styled.nav`
  width: 240px;
  height: 100vh;
  background: linear-gradient(180deg, #8b5a2b 0%, #6b4420 100%);
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.2);
  z-index: 100;

  @media (max-width: 900px) {
    width: 100%;
    height: 60px;
    top: auto;
    bottom: 0;
    flex-direction: row;
    padding: 0;
    justify-content: space-around;
    align-items: center;
  }
`

const Logo = styled.div`
  padding: 20px 20px 30px;
  text-align: center;
  border-bottom: 2px solid rgba(200, 150, 62, 0.3);
  margin-bottom: 20px;

  @media (max-width: 900px) {
    display: none;
  }
`

const LogoText = styled.h1`
  font-size: 24px;
  color: #f4e8c1;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 4px;
`

const LogoSubtitle = styled.p`
  font-size: 12px;
  color: #c8963e;
  margin-top: 8px;
  letter-spacing: 2px;
`

const NavItem = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 25px;
  background: ${({ active }) => active ? 'rgba(200, 150, 62, 0.3)' : 'transparent'};
  border: none;
  border-left: ${({ active }) => active ? '4px solid #c8963e' : '4px solid transparent'};
  color: ${({ active }) => active ? '#f4e8c1' : '#d4c4a0'};
  cursor: pointer;
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(200, 150, 62, 0.2);
    color: #f4e8c1;
  }

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 5px;
    padding: 8px 15px;
    border-left: none;
    border-top: ${({ active }) => active ? '3px solid #c8963e' : '3px solid transparent'};
    font-size: 12px;
  }
`

const Icon = styled.svg`
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;

  @media (max-width: 900px) {
    width: 20px;
    height: 20px;
  }
`

const UserInfo = styled.div`
  margin-top: auto;
  padding: 20px;
  border-top: 2px solid rgba(200, 150, 62, 0.3);
  text-align: center;

  @media (max-width: 900px) {
    display: none;
  }
`

const UserAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c8963e, #8b5a2b);
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #f4e8c1;
  border: 3px solid #c8963e;
`

const UserName = styled.div`
  color: #f4e8c1;
  font-weight: 600;
  font-size: 14px;
`

const UserTitle = styled.div`
  color: #c8963e;
  font-size: 12px;
  margin-top: 4px;
`

const Sidebar: React.FC = () => {
  const { state, setState } = useGame()

  const tabs = [
    { id: 'trade' as const, label: '交易市集', icon: 'teapot' },
    { id: 'convoy' as const, label: '商队编组', icon: 'horse' },
    { id: 'route' as const, label: '运输路线', icon: 'flag' },
  ]

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'teapot':
        return (
          <Icon viewBox="0 0 24 24">
            <path d="M12 3c-3.866 0-7 3.134-7 7v5h14v-5c0-3.866-3.134-7-7-7z" />
            <path d="M5 10h14" />
            <path d="M19 10c2.21 0 4 1.79 4 4s-1.79 4-4 4" />
            <path d="M7 18v2" />
            <path d="M17 18v2" />
          </Icon>
        )
      case 'horse':
        return (
          <Icon viewBox="0 0 24 24">
            <path d="M2 17l3-8 4-1 2-4h4l2 3 4 1-1 5-3 1-2 4H9l-2-3-5-1z" />
            <circle cx="7" cy="8" r="1" />
          </Icon>
        )
      case 'flag':
        return (
          <Icon viewBox="0 0 24 24">
            <path d="M4 22V4" />
            <path d="M4 4h13l-2 4 2 4H4" />
          </Icon>
        )
      default:
        return null
    }
  }

  return (
    <SidebarContainer>
      <Logo>
        <LogoText>茶马司</LogoText>
        <LogoSubtitle>TEA HORSE BUREAU</LogoSubtitle>
      </Logo>

      {tabs.map((tab) => (
        <NavItem
          key={tab.id}
          active={state.currentTab === tab.id}
          onClick={() => setState((prev) => ({ ...prev, currentTab: tab.id }))}
        >
          {renderIcon(tab.icon)}
          <span>{tab.label}</span>
        </NavItem>
      ))}

      <UserInfo>
        <UserAvatar>官</UserAvatar>
        <UserName>王大人</UserName>
        <UserTitle>茶马司提举</UserTitle>
      </UserInfo>
    </SidebarContainer>
  )
}

export default Sidebar
