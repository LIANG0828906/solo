import React from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { Notification } from '../types'

interface NotificationBarProps {
  notifications: Notification[]
}

const NotificationContainer = styled.aside`
  width: 280px;
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  background: linear-gradient(180deg, rgba(244, 232, 193, 0.95) 0%, rgba(232, 217, 168, 0.95) 100%);
  border-left: 3px solid #8b5a2b;
  padding: 20px 15px;
  overflow-y: auto;
  z-index: 90;
  backdrop-filter: blur(10px);

  @media (max-width: 1200px) {
    width: 240px;
  }

  @media (max-width: 900px) {
    display: none;
  }
`

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 15px;
  border-bottom: 2px solid #8b5a2b;
  margin-bottom: 15px;
`

const BellIcon = styled.svg`
  width: 24px;
  height: 24px;
  stroke: #8b5a2b;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
`

const HeaderTitle = styled.h3`
  font-size: 18px;
  color: #2d5016;
  font-weight: 700;
  font-family: 'Noto Serif SC', serif;
`

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const NotificationItem = styled(motion.div)<{ type: 'urgent' | 'warning' | 'info' }>`
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 4px solid;
  border-color: ${({ type }) => {
    switch (type) {
      case 'urgent': return '#c0392b'
      case 'warning': return '#f39c12'
      case 'info': return '#2980b9'
    }
  }};
  background: ${({ type }) => {
    switch (type) {
      case 'urgent': return 'rgba(192, 57, 43, 0.15)'
      case 'warning': return 'rgba(243, 156, 18, 0.15)'
      case 'info': return 'rgba(41, 128, 185, 0.15)'
    }
  }};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

const NotificationMessage = styled.p`
  font-size: 13px;
  color: #3d2914;
  line-height: 1.5;
  margin-bottom: 6px;
  font-family: 'Noto Serif SC', serif;
`

const NotificationTime = styled.span`
  font-size: 11px;
  color: #8b5a2b;
  opacity: 0.8;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #8b5a2b;
  opacity: 0.6;
  font-size: 14px;
`

const NotificationBar: React.FC<NotificationBarProps> = ({ notifications }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: -20, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' },
    exit: { opacity: 0, x: 100, height: 0 },
  }

  return (
    <NotificationContainer>
      <NotificationHeader>
        <BellIcon viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </BellIcon>
        <HeaderTitle>官方通报</HeaderTitle>
      </NotificationHeader>

      <NotificationList>
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <EmptyState>暂无消息</EmptyState>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                type={notification.type}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <NotificationMessage>{notification.message}</NotificationMessage>
                <NotificationTime>{notification.time}</NotificationTime>
              </NotificationItem>
            ))
          )}
        </AnimatePresence>
      </NotificationList>
    </NotificationContainer>
  )
}

export default NotificationBar
