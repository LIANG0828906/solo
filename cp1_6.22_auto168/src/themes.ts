export interface Theme {
  name: string;
  background: string;
  keyword: string;
  string: string;
  comment: string;
  text: string;
  number: string;
  function: string;
}

export const presetThemes: Theme[] = [
  {
    name: 'Monokai',
    background: '#272822',
    keyword: '#F92672',
    string: '#E6DB74',
    comment: '#75715E',
    text: '#F8F8F2',
    number: '#AE81FF',
    function: '#A6E22E'
  },
  {
    name: 'Dracula',
    background: '#282A36',
    keyword: '#FF79C6',
    string: '#F1FA8C',
    comment: '#6272A4',
    text: '#F8F8F2',
    number: '#BD93F9',
    function: '#50FA7B'
  },
  {
    name: 'Solarized Light',
    background: '#FDF6E3',
    keyword: '#859900',
    string: '#2AA198',
    comment: '#93A1A1',
    text: '#657B83',
    number: '#D33682',
    function: '#268BD2'
  },
  {
    name: 'One Dark',
    background: '#282C34',
    keyword: '#C678DD',
    string: '#98C379',
    comment: '#5C6370',
    text: '#ABB2BF',
    number: '#D19A66',
    function: '#61AFEF'
  },
  {
    name: 'GitHub Light',
    background: '#FFFFFF',
    keyword: '#D73A49',
    string: '#032F62',
    comment: '#6A737D',
    text: '#24292E',
    number: '#005CC5',
    function: '#6F42C1'
  },
  {
    name: 'Nord',
    background: '#2E3440',
    keyword: '#81A1C1',
    string: '#A3BE8C',
    comment: '#4C566A',
    text: '#D8DEE9',
    number: '#B48EAD',
    function: '#88C0D0'
  }
];

export function createCustomTheme(baseTheme: Theme, overrides: Partial<Theme>): Theme {
  return {
    ...baseTheme,
    ...overrides
  };
}

export function exportThemeToJSON(theme: Theme): string {
  const exportData = {
    name: theme.name,
    colors: {
      background: theme.background,
      keyword: theme.keyword,
      string: theme.string,
      comment: theme.comment,
      text: theme.text,
      number: theme.number,
      function: theme.function
    }
  };
  return JSON.stringify(exportData, null, 2);
}

export const defaultCode = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>示例页面</title>
  <style>
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* 标题样式 */
    h1 {
      color: #333;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>欢迎使用代码高亮工具</h1>
    <script>
      // 计算斐波那契数列
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
      
      const result = fibonacci(10);
      console.log("斐波那契第10项:", result);
      
      // 循环示例
      for (let i = 0; i < 5; i++) {
        console.log(\`当前索引: \${i}\`);
      }
    </script>
  </div>
</body>
</html>`;
