import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Avatar,
  Text,
  HStack,
  Wrap,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Checkbox,
  CheckboxGroup,
  Button,
  Input,
  Stack,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import RecommendationPage from './pages/RecommendationPage';
import ExchangeRequestPage from './pages/ExchangeRequestPage';
import { Book, ExchangeRequest, User, Notification } from './hooks/useRecommendation';

const ALL_TAGS = ['科幻', '文学', '编程', '历史', '哲学', '经济', '艺术', '心理学', '传记', '悬疑'];

export default function App() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotif, setVisibleNotif] = useState<Notification | null>(null);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [tempPrefs, setTempPrefs] = useState<string[]>([]);
  const [tempBooks, setTempBooks] = useState(['', '']);
  const prefsDisclosure = useDisclosure();

  useEffect(() => {
    axios.get<{ user: User }>('/api/user').then((res) => {
      setUser(res.data.user);
      if (!res.data.user.preferences.length) {
        setShowPrefModal(true);
      }
    });
    fetchRequests();
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && !visibleNotif) {
      const notif = notifications[0];
      setVisibleNotif(notif);
      setNotifications((prev) => prev.slice(1));
      axios.put(`/api/notifications/${notif.id}/read`);
      setTimeout(() => setVisibleNotif(null), 2000);
    }
  }, [notifications, visibleNotif]);

  const pollNotifications = useCallback(() => {
    axios.get<{ notifications: Notification[] }>('/api/notifications').then((res) => {
      if (res.data.notifications.length > 0) {
        setNotifications((prev) => [...prev, ...res.data.notifications]);
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(pollNotifications, 1000);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  const fetchRequests = useCallback(() => {
    axios.get<{ requests: ExchangeRequest[] }>('/api/exchange-requests').then((res) => {
      setExchangeRequests(res.data.requests);
    });
  }, []);

  const savePreferences = async () => {
    if (tempPrefs.length === 0) return;
    const readBooks = tempBooks.filter((b) => b.trim().length > 0);
    const res = await axios.put<{ user: User }>('/api/user/preferences', {
      preferences: tempPrefs,
      recentlyRead: readBooks,
    });
    setUser(res.data.user);
    setShowPrefModal(false);
  };

  const openPrefs = () => {
    if (user) {
      setTempPrefs([...user.preferences]);
      setTempBooks(user.recentlyRead.length >= 2 ? [...user.recentlyRead] : [...user.recentlyRead, '']);
    }
    setShowPrefModal(true);
  };

  return (
    <Box minH="100vh">
      <AnimatePresence>
        {visibleNotif && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1400,
              padding: '12px 24px',
              borderRadius: 12,
              background: 'linear-gradient(90deg, #48BB78 0%, rgba(72,187,120,0.6) 50%, white 100%)',
              color: 'white',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Flex align="center" gap={2}>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{ fontSize: 20 }}
              >
                ✓
              </motion.span>
              {visibleNotif.message}
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>

      <Box
        position="sticky"
        top={0}
        zIndex={100}
        backdropFilter="blur(12px)"
        bg="rgba(255, 245, 238, 0.75)"
        borderBottom="1px solid rgba(212, 163, 115, 0.3)"
      >
        <Flex maxW="1400px" mx="auto" px={6} py={3} align="center">
          <Link to="/">
            <HStack spacing={2}>
              <Box
                as="span"
                fontSize="2xl"
                fontWeight="bold"
                bgGradient="linear(to-r, #D4A373, #A66B3A)"
                bgClip="text"
              >
                📚 书缘
              </Box>
              <Text fontSize="sm" color="#A66B3A" fontWeight={500}>
                智能书籍交换
              </Text>
            </HStack>
          </Link>
          <Spacer />
          <HStack spacing={6}>
            <Link
              to="/"
              style={{
                fontWeight: location.pathname === '/' ? 700 : 500,
                color: location.pathname === '/' ? '#A66B3A' : '#6B5344',
                paddingBottom: 2,
                borderBottom: location.pathname === '/' ? '2px solid #D4A373' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              推荐
            </Link>
            <Link
              to="/requests"
              style={{
                fontWeight: location.pathname === '/requests' ? 700 : 500,
                color: location.pathname === '/requests' ? '#A66B3A' : '#6B5344',
                paddingBottom: 2,
                borderBottom:
                  location.pathname === '/requests' ? '2px solid #D4A373' : '2px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              交换请求
              {exchangeRequests.filter((r) => r.toUserId === user?.id && r.status === 'pending').length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    background: '#E53E3E',
                    color: 'white',
                    borderRadius: 999,
                    fontSize: 11,
                    padding: '1px 7px',
                    fontWeight: 700,
                  }}
                >
                  {exchangeRequests.filter((r) => r.toUserId === user?.id && r.status === 'pending').length}
                </motion.span>
              )}
            </Link>
            <Button
              size="sm"
              bg="brand.100"
              color="brand.500"
              _hover={{ bg: 'brand.200' }}
              _active={{ transform: 'scale(0.96)' }}
              transition="all 0.2s ease"
              onClick={openPrefs}
            >
              设置偏好
            </Button>
            {user && (
              <HStack spacing={2}>
                <Avatar
                  size="sm"
                  name={user.name}
                  bg={user.avatar || '#D4A373'}
                  color="white"
                />
                <Text fontSize="sm" fontWeight={600} color="#4A3728">
                  {user.name}
                </Text>
              </HStack>
            )}
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1400px" mx="auto" px={6} py={8}>
        <Routes>
          <Route
            path="/"
            element={
              <RecommendationPage
                user={user}
                onRequestsChange={fetchRequests}
              />
            }
          />
          <Route
            path="/requests"
            element={
              <ExchangeRequestPage
                user={user}
                requests={exchangeRequests}
                onRequestsChange={fetchRequests}
              />
            }
          />
        </Routes>
      </Box>

      <Modal isOpen={showPrefModal} onClose={() => {}} closeOnOverlayClick={false} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius={16} bg="#FFF5EE" maxW="520px">
          <ModalHeader fontWeight={700} color="#4A3728">
            👋 设置你的阅读偏好
          </ModalHeader>
          <ModalCloseButton isDisabled={!user?.preferences.length} />
          <ModalBody pb={6}>
            <VStack spacing={5} align="stretch">
              <Box>
                <Text mb={3} fontWeight={600} color="#4A3728">
                  选择你感兴趣的书籍类型（至少选择1个）：
                </Text>
                <CheckboxGroup value={tempPrefs} onChange={(v) => setTempPrefs(v as string[])}>
                  <Wrap shouldWrapChildren spacing={2}>
                    {ALL_TAGS.map((tag) => (
                      <Checkbox
                        key={tag}
                        value={tag}
                        colorScheme="orange"
                        bg="white"
                        borderColor="#E2C9AD"
                        borderRadius={8}
                        px={3}
                        py={1}
                        _checked={{ bg: '#F7E7CE', borderColor: '#D4A373' }}
                      >
                        {tag}
                      </Checkbox>
                    ))}
                  </Wrap>
                </CheckboxGroup>
              </Box>
              <Box>
                <Text mb={3} fontWeight={600} color="#4A3728">
                  最近读过的书籍（至少1本）：
                </Text>
                <Stack spacing={2}>
                  <Input
                    placeholder="书名 1"
                    bg="white"
                    borderColor="#E2C9AD"
                    value={tempBooks[0] || ''}
                    onChange={(e) => setTempBooks([e.target.value, tempBooks[1]])}
                  />
                  <Input
                    placeholder="书名 2"
                    bg="white"
                    borderColor="#E2C9AD"
                    value={tempBooks[1] || ''}
                    onChange={(e) => setTempBooks([tempBooks[0], e.target.value])}
                  />
                </Stack>
              </Box>
              <Button
                bg="brand.300"
                color="white"
                _hover={{ bg: 'brand.400' }}
                _active={{ transform: 'scale(0.97)' }}
                transition="all 0.2s ease"
                onClick={savePreferences}
                isDisabled={tempPrefs.length === 0}
                size="lg"
                mt={2}
              >
                开始探索 🔍
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
