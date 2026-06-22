import { v4 as uuidv4 } from 'uuid';
import type { Topic, Decision, TodoItem, MeetingSummary, ParticipantEngagement } from '../src/types';

const TOPIC_PATTERNS = [
  /^今天讨论/,
  /^首先/,
  /^接下来/,
  /^我们来讨论/,
  /^现在讨论/,
  /^关于/,
  /^下面讨论/,
  /^第一个议题/,
  /^第二个议题/,
  /^最后一个议题/,
  /^议题/,
];

const DECISION_KEYWORDS = ['决定', '同意', '确定', '达成共识', '决议', '结论是', '最终决定', '一致同意'];

const TODO_PATTERNS = [
  /(.+?)[：:]\s*(.+?)[待办|需要做|负责|跟进|完成]/,
  /[待办|TODO|todo]\s*[：:]\s*(.+)/,
  /(.+?)负责\s*[：:]\s*(.+)/,
  /需要做\s*[：:]\s*(.+)/,
];

const TODO_KEYWORDS = ['待办', '需要做', '负责', '跟进', '完成', 'TODO', 'todo'];

const splitTextByLines = (text: string): string[] => {
  return text.split(/[\n\r]+/).filter(line => line.trim().length > 0);
};

const splitTextIntoSegments = (text: string, segmentSize: number = 500): string[] => {
  const segments: string[] = [];
  let current = '';
  const sentences = text.split(/(?<=[。！？.!?])/);
  
  for (const sentence of sentences) {
    if (current.length + sentence.length <= segmentSize) {
      current += sentence;
    } else {
      if (current.length > 0) {
        segments.push(current);
      }
      current = sentence;
    }
  }
  
  if (current.length > 0) {
    segments.push(current);
  }
  
  return segments;
};

const extractTopics = (lines: string[]): Topic[] => {
  const topics: Topic[] = [];
  const seen = new Set<string>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    for (const pattern of TOPIC_PATTERNS) {
      if (pattern.test(trimmed) && !seen.has(trimmed)) {
        seen.add(trimmed);
        topics.push({
          id: uuidv4(),
          content: trimmed
        });
        break;
      }
    }
  }
  
  return topics;
};

const extractDecisions = (lines: string[]): Decision[] => {
  const decisions: Decision[] = [];
  const seen = new Set<string>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    for (const keyword of DECISION_KEYWORDS) {
      if (trimmed.includes(keyword) && trimmed.length > keyword.length + 5 && !seen.has(trimmed)) {
        seen.add(trimmed);
        decisions.push({
          id: uuidv4(),
          content: trimmed
        });
        break;
      }
    }
  }
  
  return decisions;
};

const extractTodos = (lines: string[]): TodoItem[] => {
  const todos: TodoItem[] = [];
  const seen = new Set<string>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    let matched = false;
    
    for (const pattern of TODO_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match && !seen.has(trimmed)) {
        seen.add(trimmed);
        matched = true;
        
        let assignee = '未指定';
        let content = trimmed;
        
        if (match.length >= 3) {
          assignee = match[1].trim();
          content = match[2].trim();
        } else if (match.length >= 2) {
          content = match[1].trim();
        }
        
        const colonMatch = content.match(/(.+?)[：:]\s*(.+)/);
        if (colonMatch) {
          assignee = colonMatch[1].trim();
          content = colonMatch[2].trim();
        }
        
        todos.push({
          id: uuidv4(),
          content,
          assignee,
          completed: false
        });
        break;
      }
    }
    
    if (!matched) {
      for (const keyword of TODO_KEYWORDS) {
        if (trimmed.includes(keyword) && !seen.has(trimmed)) {
          seen.add(trimmed);
          
          let assignee = '未指定';
          let content = trimmed;
          
          const colonMatch = trimmed.match(/(.+?)[：:]\s*(.+)/);
          if (colonMatch) {
            assignee = colonMatch[1].trim();
            content = colonMatch[2].trim();
          }
          
          todos.push({
            id: uuidv4(),
            content,
            assignee,
            completed: false
          });
          break;
        }
      }
    }
  }
  
  return todos;
};

const extractParticipantEngagement = (text: string, participants: string[]): ParticipantEngagement[] => {
  const totalLength = text.length || 1;
  const engagement: ParticipantEngagement[] = [];
  
  for (const participant of participants) {
    const regex = new RegExp(participant, 'g');
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    const percentage = Math.round((count / Math.max(totalLength / 50, 1)) * 100);
    
    engagement.push({
      name: participant,
      speakingTime: Math.max(percentage, 5)
    });
  }
  
  const total = engagement.reduce((sum, e) => sum + e.speakingTime, 0) || 1;
  return engagement.map(e => ({
    ...e,
    speakingTime: Math.round((e.speakingTime / total) * 100)
  }));
};

export const extractSummaryFromSegment = (
  segment: string,
  existingSummary: MeetingSummary,
  participants: string[],
  meetingName: string
): MeetingSummary => {
  const lines = splitTextByLines(segment);
  
  const newTopics = extractTopics(lines);
  const newDecisions = extractDecisions(lines);
  const newTodos = extractTodos(lines);
  
  const existingTopicContents = new Set(existingSummary.topics.map(t => t.content));
  const existingDecisionContents = new Set(existingSummary.decisions.map(d => d.content));
  const existingTodoContents = new Set(existingSummary.todos.map(t => t.content));
  
  const mergedTopics = [
    ...existingSummary.topics,
    ...newTopics.filter(t => !existingTopicContents.has(t.content))
  ];
  
  const mergedDecisions = [
    ...existingSummary.decisions,
    ...newDecisions.filter(d => !existingDecisionContents.has(d.content))
  ];
  
  const mergedTodos = [
    ...existingSummary.todos,
    ...newTodos.filter(t => !existingTodoContents.has(t.content))
  ];
  
  return {
    title: existingSummary.title || `${meetingName}纪要`,
    topics: mergedTopics,
    decisions: mergedDecisions,
    todos: mergedTodos,
    participantEngagement: existingSummary.participantEngagement
  };
};

export const analyzeFullText = (
  text: string,
  participants: string[],
  meetingName: string
): MeetingSummary => {
  const lines = splitTextByLines(text);
  
  const topics = extractTopics(lines);
  const decisions = extractDecisions(lines);
  const todos = extractTodos(lines);
  const engagement = extractParticipantEngagement(text, participants);
  
  return {
    title: `${meetingName}纪要`,
    topics,
    decisions,
    todos,
    participantEngagement: engagement
  };
};

export const getSegments = (text: string): string[] => {
  return splitTextIntoSegments(text, 500);
};
