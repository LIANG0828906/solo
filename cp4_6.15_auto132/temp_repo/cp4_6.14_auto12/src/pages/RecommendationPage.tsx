import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Grid,
  Text,
  Button,
  HStack,
  Flex,
  Badge,
  Progress,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useRecommendation, Book, User, ExchangeRequest } from '../hooks/useRecommendation';

type SortOption = 'score' | 'title' | 'author';

const SORT_STORAGE_KEY = 'bookExchange_sortBy';

interface Props {
  user: User | null;
  onRequestsChange: () => void;
}

export default function RecommendationPage({ user, onRequestsChange }: Props) {
  const userPrefs = user?.preferences || [];
  const recentlyRead = user?.recentlyRead || [];
  const { recommendations, loading, error, refresh } = useRecommendation(userPrefs, recentlyRead);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    return (saved as SortOption) || 'score';
  });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedOfferedBookId, setSelectedOfferedBookId] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const requestModal = useDisclosure();

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortBy);
  }, [sortBy]);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    refresh(newSort);
  };

  const handleRefresh = () => {
    refresh(sortBy);
  };

  const sortedRecommendations = useMemo(() => {
    const list = [...recommendations];
    switch (sortBy) {
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title, 'zh'));
        break;
      case 'author':
        list.sort((a, b) => a.author.localeCompare(b.author, 'zh'));
        break;
      case 'score':
      default:
        list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
    return list;
  }, [recommendations, sortBy]);

  const handleCardClick = async (book: Book) => {
    await axios.post('/api/books/click', { bookId: book.id });
  };

  const handleExchangeClick = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBook(book);
    setSelectedOfferedBookId(user?.books?.[0]?.id || '');
    requestModal.onOpen();
  };

  const handleSendRequest = async () => {
    if (!selectedBook || !selectedOfferedBookId) return;
    await axios.post<{ request: ExchangeRequest }>('/api/exchange-requests', {
      offeredBookId: selectedOfferedBookId,
      requestedBookId: selectedBook.id,
    });
    requestModal.onClose();
    setShowSuccess(true);
    onRequestsChange();
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#48BB78';
    if (score >= 60) return '#ECC94B';
    return '#ED8936';
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Text fontSize="2xl" fontWeight={700} color="#4A3728">
            ✨ 为你推荐
          </Text>
          <Text fontSize="sm" color="#8B6F47" mt={1}>
            基于你的阅读偏好智能匹配，共 {recommendations.length} 本
          </Text>
        </Box>
        <HStack spacing={3}>
          <Select
            w="160px"
            bg="white"
            borderColor="#E2C9AD"
            size="sm"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
          >
            <option value="score">按匹配度</option>
            <option value="title">按书名 A-Z</option>
            <option value="author">按作者</option>
          </Select>
          <Button
            bg="brand.200"
            color="#4A3728"
            _hover={{ bg: 'brand.300', color: 'white' }}
            _active={{ transform: 'scale(0.96)' }}
            transition="all 0.2s ease"
            onClick={handleRefresh}
            isLoading={loading}
            size="sm"
          >
            🔄 刷新推荐
          </Button>
        </HStack>
      </Flex>

      {loading && (
        <Center py={20}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ fontSize: 48, color: '#D4A373' }}
          >
            📖
          </motion.div>
        </Center>
      )}

      {error && (
        <Center py={10}>
          <Text color="red.500">{error}</Text>
        </Center>
      )}

      {!loading && !error && (
        <Grid
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          }}
          gap={5}
        >
          <AnimatePresence>
            {sortedRecommendations.map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                whileHover={{ y: -4 }}
                onClick={() => handleCardClick(book)}
                style={{ cursor: 'pointer' }}
              >
                <Box
                  bg="white"
                  borderRadius={12}
                  p={4}
                  boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                  _hover={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                  transition="all 0.25s ease"
                  height="100%"
                  display="flex"
                  flexDirection="column"
                >
                  <Center
                    bgGradient="linear(135deg, #F7E7CE 0%, #E2C9AD 100%)"
                    borderRadius={10}
                    h="140px"
                    mb={3}
                    fontSize="56px"
                  >
                    📘
                  </Center>
                  <Text fontSize="md" fontWeight={700} color="#4A3728" noOfLines={1} mb={1}>
                    {book.title}
                  </Text>
                  <Text fontSize="sm" color="#8B6F47" mb={2}>
                    {book.author}
                  </Text>
                  <Flex wrap="wrap" gap={1} mb={3}>
                    {book.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} bg="#F7E7CE" color="#A66B3A" borderRadius={6} px={2} py={0.5}>
                        {tag}
                      </Badge>
                    ))}
                  </Flex>
                  <Box mt="auto">
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="xs" color="#8B6F47">
                        匹配度
                      </Text>
                      <Text fontSize="xs" fontWeight={700} color={getScoreColor(book.matchScore || 0)}>
                        {book.matchScore}分
                      </Text>
                    </Flex>
                    <Progress
                      value={book.matchScore || 0}
                      h="6px"
                      borderRadius={4}
                      bg="#F0E0C8"
                      sx={{
                        '& > div': {
                          bg: getScoreColor(book.matchScore || 0),
                          borderRadius: 4,
                        },
                      }}
                      mb={3}
                    />
                    <Text fontSize="xs" color="#A66B3A" mb={2}>
                      持有人：{book.ownerName}
                    </Text>
                    <Button
                      w="100%"
                      size="sm"
                      bg="brand.300"
                      color="white"
                      _hover={{ bg: 'brand.400' }}
                      _active={{ transform: 'scale(0.96)' }}
                      transition="all 0.2s ease"
                      onClick={(e) => handleExchangeClick(book, e)}
                    >
                      🤝 请求交换
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1500,
              background: 'white',
              padding: '24px 40px',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <Center flexDirection="column" gap={3}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                style={{ fontSize: 56, color: '#48BB78' }}
              >
                ✓
              </motion.div>
              <Text fontSize="lg" fontWeight={700} color="#4A3728">
                请求发送成功！
              </Text>
            </Center>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={requestModal.isOpen} onClose={requestModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius={16} bg="#FFF5EE" maxW="480px">
          <ModalHeader fontWeight={700} color="#4A3728">
            选择你要交换的书籍
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box bg="white" borderRadius={12} p={4} border="1px solid #E2C9AD">
                <Text fontSize="xs" color="#8B6F47" mb={1}>
                  你想获得的书：
                </Text>
                <Text fontWeight={700} color="#4A3728">
                  《{selectedBook?.title}》- {selectedBook?.author}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight={600} color="#4A3728" mb={2}>
                  选择你的书籍进行交换：
                </Text>
                <VStack spacing={2} align="stretch">
                  {user?.books
                    ?.filter((b) => !b.isExchanged)
                    .map((book) => (
                      <Box
                        key={book.id}
                        cursor="pointer"
                        onClick={() => setSelectedOfferedBookId(book.id)}
                        p={3}
                        borderRadius={10}
                        bg={selectedOfferedBookId === book.id ? '#F7E7CE' : 'white'}
                        border="2px solid"
                        borderColor={selectedOfferedBookId === book.id ? '#D4A373' : '#E2C9AD'}
                        transition="all 0.2s ease"
                        _hover={{ borderColor: '#D4A373' }}
                      >
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontWeight={600} color="#4A3728">
                              《{book.title}》
                            </Text>
                            <Text fontSize="xs" color="#8B6F47">
                              {book.author}
                            </Text>
                          </Box>
                          {selectedOfferedBookId === book.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={{ color: '#D4A373', fontSize: 20 }}
                            >
                              ✓
                            </motion.div>
                          )}
                        </Flex>
                      </Box>
                    ))}
                </VStack>
              </Box>
              <Button
                bg="brand.300"
                color="white"
                _hover={{ bg: 'brand.400' }}
                _active={{ transform: 'scale(0.97)' }}
                transition="all 0.2s ease"
                onClick={handleSendRequest}
                isDisabled={!selectedOfferedBookId}
                mt={2}
              >
                📨 发送交换请求
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
