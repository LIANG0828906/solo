import re
import math
from typing import List, Dict, Any, Optional, Set, Tuple, TypedDict
from collections import Counter, defaultdict

try:
    import jieba
    JIEBA_AVAILABLE = True
except ImportError:
    JIEBA_AVAILABLE = False


class NodeItem(TypedDict):
    id: str
    title: str


class GroupResult(TypedDict):
    groupId: str
    keyword: str
    nodeIds: List[str]


class SemanticService:
    STOPWORDS: Set[str] = {
        '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
        '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有',
        '看', '好', '自己', '这', '那', '他', '她', '它', '们', '什么', '怎么',
        '这个', '那个', '但是', '因为', '所以', '如果', '可以', '可能', '应该',
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
        'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'about',
        'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
        'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
        'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
        '和', '与', '及', '或', '等', '等等', '呢', '吧', '啊', '呀', '哦', '嗯'
    }

    SYNONYMS: Dict[str, str] = {
        '用户': '用户', '客户': '用户', '使用者': '用户',
        '功能': '功能', '特性': '功能', '能力': '功能',
        '界面': '界面', 'UI': '界面', '接口': '界面',
        '设计': '设计', '规划': '设计', '布局': '设计',
        '数据': '数据', '信息': '数据', '资料': '数据',
        '优化': '优化', '改进': '优化', '提升': '优化',
        '问题': '问题', 'bug': '问题', '缺陷': '问题', '错误': '问题',
        '测试': '测试', '验证': '测试', '检验': '测试',
        '开发': '开发', '编码': '开发', '编写': '开发',
        '需求': '需求', '要求': '需求', '需要': '需求',
        '登录': '登录', '登陆': '登录', '登入': '登录',
        '注册': '注册', 'signup': '注册', 'sign up': '注册',
        '首页': '首页', '主页': '首页', 'home': '首页',
        '按钮': '按钮', '按键': '按钮', 'button': '按钮',
        '页面': '页面', '页': '页面', 'page': '页面',
        'performance': '性能', '性能': '性能',
        'database': '数据库', '数据库': '数据库', 'db': '数据库',
        'api': '接口', '接口': '接口',
        'server': '服务器', '服务器': '服务器', '后端': '服务器',
        'client': '客户端', '客户端': '客户端', '前端': '客户端',
    }

    PUNCTUATION_PATTERN = re.compile(
        r'[，。！？、；：""''（）《》【】…—\-\.\,\!\?\;\:\"\'\(\)\[\]\<\>\/\\\|\@\#\$\%\^\&\*\+\=\_\~\`\s]'
    )

    DEFAULT_THRESHOLD = 0.3

    def __init__(self, similarity_threshold: float = DEFAULT_THRESHOLD):
        self.similarity_threshold = similarity_threshold
        if JIEBA_AVAILABLE:
            jieba.setLogLevel(60)

    def _normalize_word(self, word: str) -> str:
        word = word.strip().lower()
        if word in self.SYNONYMS:
            return self.SYNONYMS[word]
        return word

    def _tokenize(self, text: str) -> List[str]:
        if not text:
            return []

        text_clean = self.PUNCTUATION_PATTERN.sub(' ', text).strip()

        if JIEBA_AVAILABLE:
            tokens = list(jieba.cut_for_search(text_clean))
        else:
            tokens = re.findall(r'[\u4e00-\u9fff]+|[a-zA-Z]+|\d+', text_clean)

        result: List[str] = []
        seen = set()
        for t in tokens:
            t_clean = t.strip()
            if not t_clean or t_clean in self.STOPWORDS or len(t_clean) < 1:
                continue
            normalized = self._normalize_word(t_clean)
            if normalized not in seen:
                result.append(normalized)
                seen.add(normalized)

            if len(t_clean) > 1 and re.match(r'^[\u4e00-\u9fff]+$', t_clean):
                for i in range(len(t_clean)):
                    for j in range(i + 1, len(t_clean) + 1):
                        sub = t_clean[i:j]
                        if len(sub) >= 1 and sub in self.SYNONYMS:
                            sub_normalized = self._normalize_word(sub)
                            if sub_normalized not in seen:
                                result.append(sub_normalized)
                                seen.add(sub_normalized)

        return result

    def _build_tfidf_vectors(
        self, all_documents: List[List[str]]
    ) -> List[Dict[str, float]]:
        N = len(all_documents)
        if N == 0:
            return []

        df: Dict[str, int] = defaultdict(int)
        for doc in all_documents:
            unique_terms = set(doc)
            for term in unique_terms:
                df[term] += 1

        vectors: List[Dict[str, float]] = []
        for doc in all_documents:
            tf = Counter(doc)
            total_terms = len(doc) if len(doc) > 0 else 1
            tfidf: Dict[str, float] = {}
            for term, count in tf.items():
                tf_val = count / total_terms
                idf_val = math.log((N + 1) / (df.get(term, 0) + 1)) + 1
                tfidf[term] = tf_val * idf_val
            vectors.append(tfidf)

        return vectors

    def _cosine_similarity(
        self, vec1: Dict[str, float], vec2: Dict[str, float]
    ) -> float:
        if not vec1 or not vec2:
            return 0.0

        common_terms = set(vec1.keys()) & set(vec2.keys())
        if not common_terms:
            return 0.0

        dot_product = sum(vec1[term] * vec2[term] for term in common_terms)

        norm1 = math.sqrt(sum(v * v for v in vec1.values()))
        norm2 = math.sqrt(sum(v * v for v in vec2.values()))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def calculate_similarity(self, text1: str, text2: str) -> float:
        if not text1 or not text2:
            return 0.0

        text1_stripped = text1.strip()
        text2_stripped = text2.strip()

        if not text1_stripped or not text2_stripped:
            return 0.0

        if text1_stripped == text2_stripped:
            return 1.0

        tokens1 = self._tokenize(text1_stripped)
        tokens2 = self._tokenize(text2_stripped)

        if not tokens1 or not tokens2:
            return 0.0

        vectors = self._build_tfidf_vectors([tokens1, tokens2])
        return self._cosine_similarity(vectors[0], vectors[1])

    def _find_connected_components(
        self, pairs: List[Tuple[int, int]], n_items: int
    ) -> List[List[int]]:
        parent = list(range(n_items))

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(x: int, y: int) -> None:
            px, py = find(x), find(y)
            if px != py:
                parent[py] = px

        for i, j in pairs:
            union(i, j)

        groups: Dict[int, List[int]] = defaultdict(list)
        for idx in range(n_items):
            root = find(idx)
            groups[root].append(idx)

        return list(groups.values())

    def _get_group_keyword(
        self, group_indices: List[int], items: List[NodeItem]
    ) -> str:
        all_tokens: List[str] = []
        for idx in group_indices:
            title = items[idx].get('title', '')
            tokens = self._tokenize(title)
            all_tokens.extend(tokens)

        if not all_tokens:
            return '未命名组'

        counter = Counter(all_tokens)
        most_common = counter.most_common(1)
        return most_common[0][0] if most_common else '未命名组'

    def group_items(
        self,
        items: List[NodeItem],
        threshold: Optional[float] = None,
    ) -> List[GroupResult]:
        if not items:
            return []

        if threshold is None:
            threshold = self.similarity_threshold

        n = len(items)
        if n == 1:
            return [{
                'groupId': 'group_0',
                'keyword': self._get_group_keyword([0], items),
                'nodeIds': [items[0].get('id', '')],
            }]

        connected_pairs: List[Tuple[int, int]] = []
        for i in range(n):
            for j in range(i + 1, n):
                if i == j:
                    continue
                title_i = items[i].get('title', '')
                title_j = items[j].get('title', '')
                sim = self.calculate_similarity(title_i, title_j)
                if sim >= threshold:
                    connected_pairs.append((i, j))

        components = self._find_connected_components(connected_pairs, n)

        result: List[GroupResult] = []
        for g_idx, component in enumerate(components):
            keyword = self._get_group_keyword(component, items)
            node_ids = [
                items[idx].get('id', '')
                for idx in component
                if items[idx].get('id')
            ]
            result.append({
                'groupId': f'group_{g_idx}',
                'keyword': keyword,
                'nodeIds': node_ids,
            })

        return result
