import { useState, useMemo } from 'react';
import {
  Box,
  Text,
  Button,
  Flex,
  HStack,
  VStack,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Center,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ExchangeRequest, User } from '../hooks/useRecommendation';

interface Props {
  user: User | null;
  requests: ExchangeRequest[];
  onRequestsChange: () => void;
}

const AVATAR_LIGHT_COLORS = [
  '#FFB6C1', '#FFC3A0', '#FFDAB9', '#FFE4B5', '#F0E68C',
  '#B0E0E6', '#ADD8E6', '#87CEEB', '#B0C4DE', '#C8A2C8',
  '#DDA0DD', '#D8BFD8', '#E6E6FA', '#98FB98', '#90EE90',
];

function getRandomLightColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_LIGHT_COLORS[Math.abs(hash) % AVATAR_LIGHT_COLORS.length];
}

function AvatarPlaceholder({ name }: { name: string }) {
  const bgColor = useMemo(() => getRandomLightColor(name), [name]);
  return (
    <Box
      w="40px"
      h="40px"
      borderRadius="50%"
      bg={bgColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="#4A3728"
      fontWeight={700}
      fontSize="16px"
      flexShrink={0}
    >
      {name.charAt(0)}
    </Box>
  );
}

export default function ExchangeRequestPage({ user, requests, onRequestsChange }: Props) {
  const [animatingId, setAnimatingId] = useState<{ [key: string]: 'accepted' | 'rejected' | 'cancelled' | null }>({});

  const receivedRequests = requests.filter((r) => r.toUserId === user?.id);
  const sentRequests = requests.filter((r) => r.fromUserId === user?.id);

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    setAnimatingId((prev) => ({ ...prev, [requestId]: status }));
    await new Promise((r) => setTimeout(r, status === 'accepted' ? 500 : 400));
    await axios.put(`/api/exchange-requests/${requestId}/status`, { status });
    setAnimatingId((prev) => ({ ...prev, [requestId]: null }));
    onRequestsChange();
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge bg="#C6F6D5" color="#276749" borderRadius={8} px={2}>已成交</Badge>;
      case 'rejected':
        return <Badge bg="#FED7D7" color="#C53030" borderRadius={8} px={2}>已拒绝</Badge>;
      case 'cancelled':
        return <Badge bg="#E2E8F0" color="#4A5568" borderRadius={8} px={2}>已取消</Badge>;
      default:
        return <Badge bg="#FEFCBF" color="#975A16" borderRadius={8} px={2}>待处理</Badge>;
    }
  };

  const renderRequestItem = (req: ExchangeRequest, isReceived: boolean) => {
    const animType = animatingId[req.id];

    return (
      <AnimatePresence mode="wait" key={req.id}>
        <motion.div
          key={animType || 'normal'}
          initial={{ opacity: 1, x: 0 }}
          animate={
            animType === 'rejected'
              ? { opacity: 0, x: -20 }
              : animType === 'accepted'
              ? { opacity: 1, x: 0 }
              : { opacity: 1, x: 0 }
          }
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            bg="white"
            borderRadius={12}
            p={4}
            mb={3}
            boxShadow="0 2px 8px rgba(0,0,0,0.08)"
          >
            <Flex gap={4} align="center">
              <AvatarPlaceholder name={isReceived ? req.fromUserName : user?.name || ''} />
              <Box flex="1" minW={0}>
                <Flex justify="space-between" align="center" mb={1}>
                  <HStack spacing={2}>
                    <Text fontWeight={700} color="#4A3728">
                      {isReceived ? req.fromUserName : user?.name}
                    </Text>
                    <Text fontSize="xs" color="#8B6F47">
                      {isReceived ? '想和你交换' : '向 ' + (requests.find((r) => r.id === req.id)?.fromUserName || '') + ' 发起'}
                    </Text>
                    {getStatusBadge(req.status)}
                  </HStack>
                  <Text fontSize="xs" color="#8B6F47">
                    {formatTime(req.createdAt)}
                  </Text>
                </Flex>
                <VStack spacing={1} align="stretch">
                  <Text fontSize="sm" color="#4A3728">
                    {isReceived ? '📥 你收到：' : '📤 你送出：'}
                    <Box as="span" fontWeight={600} ml={1}>
                      《{isReceived ? req.requestedBookTitle : req.offeredBookTitle}》
                    </Box>
                  </Text>
                  <Text fontSize="sm" color="#4A3728">
                    {isReceived ? '📤 对方送出：' : '📥 你获得：'}
                    <Box as="span" fontWeight={600} ml={1}>
                      《{isReceived ? req.offeredBookTitle : req.requestedBookTitle}》
                    </Box>
                  </Text>
                </VStack>
                {isReceived && req.status === 'pending' && (
                  <HStack spacing={3} mt={4} justify="flex-end">
                    <motion.div
                      whileHover={animType !== 'rejected' ? { scale: 1.05 } : {}}
                      animate={animType === 'rejected' ? { opacity: 0, x: -10 } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="#E2C9AD"
                        color="#8B6F47"
                        _hover={{ bg: '#F7E7CE', borderColor: '#D4A373' }}
                        _active={{ transform: 'scale(0.96)' }}
                        onClick={() => handleAction(req.id, 'rejected')}
                        isLoading={animType === 'rejected'}
                      >
                        拒绝
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      animate={
                        animType === 'accepted'
                          ? { scale: [1, 1.2, 1], transition: { duration: 0.4 } }
                          : {}
                      }
                    >
                      <Button
                        size="sm"
                        bg="#48BB78"
                        color="white"
                        _hover={{ bg: '#38A169' }}
                        _active={{ transform: 'scale(0.96)' }}
                        onClick={() => handleAction(req.id, 'accepted')}
                        isLoading={animType === 'accepted'}
                      >
                        ✓ 接受
                      </Button>
                    </motion.div>
                  </HStack>
                )}
                {!isReceived && req.status === 'pending' && (
                  <HStack spacing={3} mt={4} justify="flex-end">
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="#E2C9AD"
                      color="#8B6F47"
                      _hover={{ bg: '#F7E7CE', borderColor: '#D4A373' }}
                      _active={{ transform: 'scale(0.96)' }}
                      onClick={() => handleAction(req.id, 'cancelled')}
                    >
                      取消请求
                    </Button>
                  </HStack>
                )}
              </Box>
            </Flex>
          </Box>
        </motion.div>
      </AnimatePresence>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Center py={16}>
      <VStack spacing={3}>
        <Text fontSize="64px">📭</Text>
        <Text color="#8B6F47">{message}</Text>
      </VStack>
    </Center>
  );

  return (
    <Box>
      <Text fontSize="2xl" fontWeight={700} color="#4A3728" mb={6}>
        📬 交换请求管理
      </Text>

      <Tabs variant="soft-rounded" colorScheme="orange" size="md" mb={6}>
        <TabList bg="white" p={1} borderRadius={12} w="fit-content" boxShadow="0 2px 8px rgba(0,0,0,0.06)">
          <Tab
            _selected={{ bg: '#D4A373', color: 'white' }}
            color="#8B6F47"
            fontWeight={600}
            borderRadius={10}
            mx={1}
          >
            收到的请求
            {receivedRequests.filter((r) => r.status === 'pending').length > 0 && (
              <Badge
                ml={2}
                bg="#E53E3E"
                color="white"
                borderRadius={999}
                fontSize="10px"
              >
                {receivedRequests.filter((r) => r.status === 'pending').length}
              </Badge>
            )}
          </Tab>
          <Tab
            _selected={{ bg: '#D4A373', color: 'white' }}
            color="#8B6F47"
            fontWeight={600}
            borderRadius={10}
            mx={1}
          >
            发出的请求
          </Tab>
        </TabList>

        <TabPanels mt={4}>
          <TabPanel px={0}>
            {receivedRequests.length === 0 ? (
              <EmptyState message="暂无收到的交换请求" />
            ) : (
              receivedRequests.map((req) => renderRequestItem(req, true))
            )}
          </TabPanel>
          <TabPanel px={0}>
            {sentRequests.length === 0 ? (
              <EmptyState message="暂无发出的交换请求，去推荐页看看吧～" />
            ) : (
              sentRequests.map((req) => renderRequestItem(req, false))
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
