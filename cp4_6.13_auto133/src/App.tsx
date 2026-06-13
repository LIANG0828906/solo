import { useState, useEffect, useCallback, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import PostList from './components/PostList';
import FilterPanel from './components/FilterPanel';
import { Post, TimeRange } from './types';
import { analyzeSentiment } from './utils/sentimentAnalyzer';
import './App.css';

const AVAILABLE_TAGS = ['品牌提及', '竞争对手', '用户反馈', '产品问题', '建议', '好评', '投诉'];

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [keyword, setKeyword] = useState('环保咖啡杯');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [searchInput, setSearchInput] = useState('环保咖啡杯');
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<Record<string, string[]>>({});
  const [sentimentFilter, setSentimentFilter] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('postTags');
    if (saved) {
      try {
        setCustomTags(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved tags:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('postTags', JSON.stringify(customTags));
  }, [customTags]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts?keyword=${encodeURIComponent(keyword)}&timeRange=${timeRange}`);
      const result = await response.json();
      if (result.success) {
        setPosts(result.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      const mockPosts = generateMockPosts(keyword, timeRange);
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  }, [keyword, timeRange]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:3001');
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'newPost') {
          setPosts(prev => [data.post, ...prev].slice(0, 50));
        }
      };
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (e) {
      console.log('WebSocket not available');
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const handleSearch = () => {
    setKeyword(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTagToggle = (postId: string, tag: string) => {
    setCustomTags(prev => {
      const postTags = prev[postId] || [];
      const hasTag = postTags.includes(tag);
      const newTags = hasTag
        ? postTags.filter(t => t !== tag)
        : [...postTags, tag];
      return {
        ...prev,
        [postId]: newTags
      };
    });
  };

  const handleSentimentFilterChange = (sentiment: string) => {
    setSentimentFilter(prev =>
      prev.includes(sentiment)
        ? prev.filter(s => s !== sentiment)
        : [...prev, sentiment]
    );
  };

  const handleTagFilterChange = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (sentimentFilter.length > 0) {
      result = result.filter(post => {
        const sentiment = analyzeSentiment(post.content + ' ' + post.comments.map(c => c.content).join(' '));
        return sentimentFilter.includes(sentiment.label);
      });
    }

    if (selectedTags.length > 0) {
      result = result.filter(post => {
        const postTags = customTags[post.id] || [];
        return selectedTags.some(tag => postTags.includes(tag));
      });
    }

    return result;
  }, [posts, sentimentFilter, selectedTags, customTags]);

  const postsWithTags = useMemo(() => {
    return filteredPosts.map(post => ({
      ...post,
      tags: customTags[post.id] || []
    }));
  }, [filteredPosts, customTags]);

  return (
    <div className="app-container">
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button
            className="menu-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="切换侧边栏"
          >
            <span className="hamburger-icon"></span>
          </button>
          {!sidebarCollapsed && <h2 className="sidebar-title">筛选面板</h2>}
        </div>
        {!sidebarCollapsed && (
          <FilterPanel
            keyword={searchInput}
            setKeyword={setSearchInput}
            onSearch={handleSearch}
            onKeyPress={handleKeyPress}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            selectedTags={selectedTags}
            onTagFilterChange={handleTagFilterChange}
            sentimentFilter={sentimentFilter}
            onSentimentFilterChange={handleSentimentFilterChange}
            availableTags={AVAILABLE_TAGS}
            onRefresh={fetchPosts}
            loading={loading}
          />
        )}
      </div>

      <div className="main-content">
        <Dashboard posts={posts} keyword={keyword} />
        
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">
              帖子列表
              <span className="post-count">({filteredPosts.length}条)</span>
            </h2>
          </div>
          <PostList
            posts={postsWithTags}
            loading={loading}
            onTagToggle={handleTagToggle}
            availableTags={AVAILABLE_TAGS}
          />
        </div>
      </div>
    </div>
  );
}

function generateMockPosts(keyword: string, timeRange: string = '24h'): Post[] {
  const usernames = [
    '咖啡爱好者小王', '环保达人Lisa', '美食探店家', '科技先锋', '生活记录者',
    '旅行者阿杰', '读书爱好者', '健身达人Mike', '摄影师小雨', '设计师张三',
    '产品经理老李', '程序员大刘', '运营小姐姐', '市场分析师', '创意总监',
    '数码爱好者', '时尚博主', '美食家', '旅行达人', '职场达人'
  ];

  const posts: Post[] = [];
  const now = Date.now();

  let hoursBack = 24;
  switch (timeRange) {
    case '24h':
      hoursBack = 24;
      break;
    case '7d':
      hoursBack = 24 * 7;
      break;
    case '30d':
      hoursBack = 24 * 30;
      break;
    default:
      hoursBack = 24;
  }

  for (let i = 0; i < 25; i++) {
    const timestamp = new Date(now - Math.random() * hoursBack * 60 * 60 * 1000);
    const sentimentRandom = Math.random();
    let sentiment: string;
    if (sentimentRandom < 0.4) sentiment = 'positive';
    else if (sentimentRandom < 0.75) sentiment = 'neutral';
    else sentiment = 'negative';

    const contents: Record<string, string[]> = {
      positive: [
        `这个${keyword}真的太棒了，用了之后感觉生活品质都提升了！强烈推荐给大家。`,
        `刚入手的${keyword}，颜值超高，用起来也特别顺手，满意！`,
        `用了一周${keyword}，体验感满分，是最近买过最满意的东西了。`,
        `这款${keyword}设计很用心，细节处理得很好，值得入手。`,
        `朋友们，这个${keyword}真的很赞，功能强大而且外观漂亮。`,
        `收到${keyword}很惊喜，比想象中还要好，必须给好评！`,
        `用了${keyword}之后，工作效率都提高了，太喜欢了！`,
        `这款${keyword}性价比超高，用了都说好，推荐购买。`
      ],
      neutral: [
        `刚收到${keyword}，先试用几天看看效果再说吧。`,
        `这个${keyword}中规中矩吧，没有特别惊艳的感觉。`,
        `${keyword}整体还行，就是价格稍微有点贵，观望的朋友可以再等等。`,
        `关于${keyword}，网上评价褒贬不一，我也来分享一下使用感受。`,
        `用了一段时间${keyword}，感觉和普通产品差不多，没什么特别的。`,
        `这款${keyword}功能基本够用，但没什么特别的亮点。`,
        `看到很多人讨论${keyword}，我也入手了一个，先试试水。`,
        `${keyword}到货了，包装一般，质量待验证，先用用看。`
      ],
      negative: [
        `这个${keyword}太让我失望了，质量很差，不推荐购买。`,
        `买了${keyword}之后后悔了，价格贵还不好用，踩雷了家人们。`,
        `这款${keyword}名不副实，宣传和实物差太远了。`,
        `${keyword}用了几天就出问题，客服态度也不好，差评！`,
        `不建议买这个${keyword}，性价比太低，浪费钱。`,
        `${keyword}的做工很粗糙，和图片上完全不一样，被骗了。`,
        `买了这个${keyword}真的很后悔，难用还占地方。`,
        `${keyword}太坑了，不值这个价，大家别上当！`
      ]
    };

    const commentCount = Math.floor(Math.random() * 6) + 3;
    const comments = [];
    const commentSentiments = ['positive', 'neutral', 'negative'];

    for (let j = 0; j < commentCount; j++) {
      const commentSentiment = commentSentiments[Math.floor(Math.random() * commentSentiments.length)];
      const commentContents: Record<string, string[]> = {
        positive: [
          `同意楼主，这个${keyword}确实好用！`,
          `我也在用这款${keyword}，体验很不错~`,
          `${keyword}的质量确实没话说，点赞！`,
          `看完帖子我也想买一个${keyword}了。`,
          `这款${keyword}我用了半年，依然很满意。`
        ],
        neutral: [
          `观望中，不知道到底值不值得买。`,
          `请问${keyword}适合新手使用吗？`,
          `有其他品牌的${keyword}推荐吗？`,
          `想知道${keyword}的具体尺寸是多少。`,
          `这个${keyword}一般能用多久啊？`
        ],
        negative: [
          `我也觉得这个${keyword}不太行...`,
          `还好没买这个${keyword}，谢谢避雷。`,
          `${keyword}的售后确实很差，我也遇到过。`,
          `同感，这个${keyword}性价比真的不高。`,
          `我买的${keyword}也出问题了，太坑了。`
        ]
      };

      comments.push({
        id: `comment-${i}-${j}`,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        content: commentContents[commentSentiment][Math.floor(Math.random() * commentContents[commentSentiment].length)],
        timestamp: new Date(timestamp.getTime() + Math.random() * 60 * 60 * 1000).toISOString(),
        likes: Math.floor(Math.random() * 100),
        sentiment: commentSentiment
      });
    }

    posts.push({
      id: `post-${i}`,
      username: usernames[Math.floor(Math.random() * usernames.length)],
      content: contents[sentiment][Math.floor(Math.random() * contents[sentiment].length)],
      timestamp: timestamp.toISOString(),
      likes: Math.floor(Math.random() * 5000) + 10,
      comments
    });
  }

  posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return posts;
}

export default App;
