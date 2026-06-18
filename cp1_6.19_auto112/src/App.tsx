import { useMemo, useState, useCallback } from 'react';
import {
  ReadingRecord,
  ReadingContextValue,
  MoodType,
  MOOD_CONFIG,
  extractKeywords,
  generateId,
} from './types';
import ReadingContext from './context/ReadingContext';
import ReadingForm from './components/ReadingForm';
import StarCanvas from './components/StarCanvas';
import RecordList from './components/RecordList';

const SAMPLE_RECORDS: Omit<ReadingRecord, 'id' | 'timestamp' | 'keywords'>[] = [
  {
    bookName: '三体',
    page: 128,
    mood: 'shocked',
    thought: '黑暗森林法则的揭示让我震撼不已，宇宙的真相竟然如此冷酷，每一个文明都在小心翼翼地隐藏自己。',
  },
  {
    bookName: '活着',
    page: 89,
    mood: 'moved',
    thought: '福贵的人生让我泪流满面，苦难层层叠叠，但生命本身的韧性如此动人，活着本身就是最大的意义。',
  },
  {
    bookName: '原则',
    page: 256,
    mood: 'thinking',
    thought: '达利欧的极度坦诚理念值得深思，用算法和原则来管理决策，将复杂问题拆解为可量化的步骤。',
  },
  {
    bookName: '小王子',
    page: 45,
    mood: 'calm',
    thought: '"真正重要的东西，眼睛是看不见的"，这句话让我在喧嚣中找回内心的宁静，用心去感受世界的本质。',
  },
  {
    bookName: '人类简史',
    page: 312,
    mood: 'happy',
    thought: '从认知革命到科学革命的宏大叙事令人振奋，我们智人如何从普通动物一跃成为地球的主宰，故事太精彩了！',
  },
  {
    bookName: '三体',
    page: 342,
    mood: 'thinking',
    thought: '降维打击的设定让我思考了很久，如果维度武器真的存在，我们三维生物该如何面对更高等的文明？',
  },
  {
    bookName: '百年孤独',
    page: 178,
    mood: 'moved',
    thought: '布恩迪亚家族七代人的命运交织，孤独是贯穿始终的宿命主题，魔幻现实主义的文字美得令人心碎。',
  },
  {
    bookName: '原则',
    page: 410,
    mood: 'calm',
    thought: '关于如何面对失败和错误的章节让我平静，痛苦+反思=进步，这个公式简洁却深刻，值得反复咀嚼。',
  },
];

function createRecord(
  data: Omit<ReadingRecord, 'id' | 'timestamp' | 'keywords'>
): ReadingRecord {
  return {
    ...data,
    id: generateId(),
    timestamp: Date.now(),
    keywords: extractKeywords(data.thought),
  };
}

export default function App() {
  const [records, setRecords] = useState<ReadingRecord[]>(() => {
    const now = Date.now();
    return SAMPLE_RECORDS.map((r, i) => ({
      ...createRecord(r),
      timestamp: now - (SAMPLE_RECORDS.length - i) * 60000,
    }));
  });

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const addRecord = useCallback(
    (data: Omit<ReadingRecord, 'id' | 'timestamp' | 'keywords'>) => {
      const record = createRecord(data);
      setRecords((prev) => [...prev, record]);
    },
    []
  );

  const contextValue = useMemo<ReadingContextValue>(
    () => ({
      records,
      addRecord,
      highlightId,
      setHighlightId,
      selectedId,
      setSelectedId,
      pinnedId,
      setPinnedId,
    }),
    [records, addRecord, highlightId, selectedId, pinnedId]
  );

  const activeId = pinnedId ?? highlightId;
  const activeRecord = activeId ? records.find((r) => r.id === activeId) ?? null : null;

  return (
    <ReadingContext.Provider value={contextValue}>
      <div className="app-container">
        <section className="galaxy-section">
          <ReadingForm />
          <StarCanvas
            records={records.slice(-200)}
            highlightId={highlightId}
            selectedId={selectedId}
            pinnedId={pinnedId}
            activeRecord={activeRecord}
            onSetPinned={setPinnedId}
            onSelect={(id) => {
              setSelectedId(id);
              setHighlightId(id);
            }}
          />
        </section>
        <div className="divider" />
        <RecordList
          records={records}
          highlightId={highlightId}
          selectedId={selectedId}
          onHover={setHighlightId}
          onSelect={(id) => {
            setSelectedId(id);
            setHighlightId(id);
          }}
        />
      </div>
    </ReadingContext.Provider>
  );
}

export { MOOD_CONFIG };
export type { ReadingRecord, MoodType };
