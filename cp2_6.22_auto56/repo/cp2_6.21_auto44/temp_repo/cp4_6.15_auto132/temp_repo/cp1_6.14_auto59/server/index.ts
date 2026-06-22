import express from 'express';
import cors from 'cors';
import { parseGitLog, getMockCommits, type CommitData } from './gitParser';
import { saveRun, getRunByRepo, type RunRecord } from './dataStore';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/runs', async (req, res) => {
  try {
    const { repoPath, useMock = false } = req.body as { repoPath: string; useMock?: boolean };

    if (!repoPath) {
      res.status(400).json({ error: '仓库路径不能为空' });
      return;
    }

    let commits: CommitData[];
    if (useMock || true) {
      commits = getMockCommits();
      await new Promise((resolve) => setTimeout(resolve, 2500));
    } else {
      commits = await parseGitLog(repoPath);
    }

    const run: RunRecord = await saveRun(repoPath, commits);

    res.json({
      success: true,
      data: {
        id: run.id,
        repoPath: run.repoPath,
        commits: run.commits,
        totalCommits: run.commits.length,
        updatedAt: run.updatedAt,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '解析Git仓库失败',
    });
  }
});

app.get('/api/runs', async (req, res) => {
  try {
    const { repoPath } = req.query;
    if (typeof repoPath !== 'string') {
      res.status(400).json({ error: '仓库路径不能为空' });
      return;
    }

    const run = await getRunByRepo(repoPath);
    if (!run) {
      res.status(404).json({ error: '未找到该仓库的数据' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: run.id,
        repoPath: run.repoPath,
        commits: run.commits,
        totalCommits: run.commits.length,
        updatedAt: run.updatedAt,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Git 看板后端服务已启动: http://localhost:${PORT}`);
});
