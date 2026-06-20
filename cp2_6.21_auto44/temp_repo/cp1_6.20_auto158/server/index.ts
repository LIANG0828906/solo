import express from 'express';
import cors from 'cors';
import { LevelGenerator, RuleConfig } from '../src/core/LevelGenerator';
import { PathFinder } from '../src/core/PathFinder';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/validate', (req, res) => {
  try {
    const ruleConfig: RuleConfig = req.body;
    
    const jumpPowers = [8, 12, 16];
    const results = [];
    let totalSteps = 0;
    let successCount = 0;

    for (const jumpPower of jumpPowers) {
      const generator = new LevelGenerator(ruleConfig);
      const level = generator.generate();
      
      const pathFinder = new PathFinder(level, jumpPower, 3);
      const result = pathFinder.findPath();
      
      results.push({
        jumpPower,
        success: result.success,
        steps: result.steps,
        coinsCollected: result.coinsCollected,
        successRate: result.success ? 100 : 0,
      });
      
      totalSteps += result.steps;
      if (result.success) successCount++;
    }

    const overallSuccessRate = Math.round((successCount / jumpPowers.length) * 100);
    const avgSteps = Math.round(totalSteps / jumpPowers.length);

    res.json({
      success: true,
      results,
      overallSuccessRate,
      avgSteps,
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate level',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
