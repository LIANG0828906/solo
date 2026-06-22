import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import PollScreen from './components/PollScreen';
import StudentPanel from './components/StudentPanel';
import { TopicData, Question } from './types';

const TOPICS = [
  '变量声明',
  '类型系统',
  '函数与闭包',
  '异步编程',
  '模块化开发',
  '面向对象编程',
  '错误处理',
  '泛型编程',
  '设计模式',
  '性能优化',
];

function createEmptyTopicData(): TopicData {
  return {
    votes: { understood: 0, confused: 0, lost: 0 },
    questions: [],
    studentVotes: {},
  };
}

export default function App() {
  const [isPresenter, setIsPresenter] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [topicDataMap, setTopicDataMap] = useState<TopicData[]>(TOPICS.map(() => createEmptyTopicData()));
  const [myVote, setMyVote] = useState<'understood' | 'confused' | 'lost' | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const studentIdRef = useRef<string>(`student-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsPresenter(params.get('role') === 'presenter');
  }, []);

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('init', (data: { topics: string[]; currentTopicIndex: number; topicDataMap: TopicData[] }) => {
      setCurrentTopicIndex(data.currentTopicIndex);
      setTopicDataMap(data.topicDataMap);
    });

    socket.on('topic-switched', (idx: number) => {
      setCurrentTopicIndex(idx);
      setMyVote(null);
    });

    socket.on('feedback-updated', (data: { topicIndex: number; votes: TopicData['votes']; studentVote: { studentId: string; type: 'understood' | 'confused' | 'lost' | null } }) => {
      setTopicDataMap((prev) => {
        const next = [...prev];
        next[data.topicIndex] = { ...next[data.topicIndex], votes: data.votes, studentVotes: { ...next[data.topicIndex].studentVotes, [data.studentVote.studentId]: data.studentVote.type } };
        return next;
      });
      if (data.studentVote.studentId === studentIdRef.current) {
        setMyVote(data.studentVote.type);
      }
    });

    socket.on('question-added', (q: Question) => {
      setTopicDataMap((prev) => {
        const next = [...prev];
        next[q.topicIndex] = { ...next[q.topicIndex], questions: [q, ...next[q.topicIndex].questions] };
        return next;
      });
    });

    socket.on('export-data', (data: unknown) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'classroom-feedback-export.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSwitchTopic = useCallback((idx: number) => {
    socketRef.current?.emit('switch-topic', idx);
  }, []);

  const handleSubmitFeedback = useCallback((type: 'understood' | 'confused' | 'lost') => {
    socketRef.current?.emit('submit-feedback', {
      type,
      studentId: studentIdRef.current,
      topicIndex: currentTopicIndex,
    });
  }, [currentTopicIndex]);

  const handleSubmitQuestion = useCallback((text: string) => {
    socketRef.current?.emit('submit-question', {
      text,
      studentId: studentIdRef.current,
      topicIndex: currentTopicIndex,
    });
  }, [currentTopicIndex]);

  const handleExport = useCallback(() => {
    socketRef.current?.emit('request-export');
  }, []);

  if (isPresenter) {
    return (
      <PollScreen
        topics={TOPICS}
        currentTopicIndex={currentTopicIndex}
        topicDataMap={topicDataMap}
        onSwitchTopic={handleSwitchTopic}
        onExport={handleExport}
      />
    );
  }

  return (
    <StudentPanel
      topics={TOPICS}
      currentTopicIndex={currentTopicIndex}
      myVote={myVote}
      onSubmitFeedback={handleSubmitFeedback}
      onSubmitQuestion={handleSubmitQuestion}
    />
  );
}
