const ERROR_LIBRARY: Record<string, Array<{ wrong: string; correct: string; message: string }>> = {
  spelling: [
    { wrong: '做为', correct: '作为', message: '应为"作为"' },
    { wrong: '既使', correct: '即使', message: '应为"即使"' },
    { wrong: '必需', correct: '必须', message: '副词用"必须"' },
    { wrong: '便倢', correct: '便捷', message: '错别字' },
    { wrong: '幅副', correct: '幅', message: '量词错误' },
  ],
  punctuation: [
    { wrong: '。。', correct: '。', message: '重复句号' },
    { wrong: '，，', correct: '，', message: '重复逗号' },
    { wrong: '！！', correct: '！', message: '重复感叹号' },
    { wrong: '？？', correct: '？', message: '重复问号' },
  ],
};

interface PrecheckError {
  id: string;
  type: 'spelling' | 'punctuation';
  text: string;
  offset: number;
  length: number;
  suggestion: string;
  message: string;
}

function performPrecheck(content: string): PrecheckError[] {
  const errors: PrecheckError[] = [];
  let errorCounter = 0;

  for (const [type, rules] of Object.entries(ERROR_LIBRARY)) {
    for (const rule of rules) {
      let searchFrom = 0;
      while (true) {
        const pos = content.indexOf(rule.wrong, searchFrom);
        if (pos === -1) break;
        errors.push({
          id: `wk-${type}-${errorCounter++}`,
          type: type as 'spelling' | 'punctuation',
          text: rule.wrong,
          offset: pos,
          length: rule.wrong.length,
          suggestion: rule.correct,
          message: rule.message,
        });
        searchFrom = pos + rule.wrong.length;
      }
    }
  }

  errors.sort((a, b) => a.offset - b.offset);
  return errors;
}

self.onmessage = (e: MessageEvent) => {
  const { content } = e.data;
  const errors = performPrecheck(content);
  self.postMessage({ errors });
};
