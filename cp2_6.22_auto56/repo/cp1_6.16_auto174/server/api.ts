import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

interface ScoreProject {
  id: string;
  name: string;
  voices: any[];
  timeSignature: string;
  keySignature: string;
  tempo: number;
  totalMeasures: number;
  createdAt: number;
  updatedAt: number;
}

const storage: Map<string, ScoreProject> = new Map();

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Music Score Editor API is running' });
});

app.post('/api/save', (req, res) => {
  try {
    const project: ScoreProject = req.body;

    if (!project || !project.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project data: missing id'
      });
    }

    storage.set(project.id, {
      ...project,
      updatedAt: Date.now()
    });

    console.log(`[SAVE] Project saved: ${project.id} (${project.name || 'Untitled'})`);
    console.log(`[STATS] Total projects in storage: ${storage.size}`);

    res.json({
      success: true,
      id: project.id,
      message: 'Project saved successfully'
    });
  } catch (error) {
    console.error('[SAVE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save project'
    });
  }
});

app.get('/api/load/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    const project = storage.get(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with id '${id}' not found`
      });
    }

    console.log(`[LOAD] Project loaded: ${project.id} (${project.name || 'Untitled'})`);

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('[LOAD ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load project'
    });
  }
});

app.get('/api/list', (req, res) => {
  try {
    const projects = Array.from(storage.values()).map(p => ({
      id: p.id,
      name: p.name,
      totalMeasures: p.totalMeasures,
      tempo: p.tempo,
      timeSignature: p.timeSignature,
      keySignature: p.keySignature,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('[LIST ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list projects'
    });
  }
});

app.delete('/api/delete/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!storage.has(id)) {
      return res.status(404).json({
        success: false,
        message: `Project with id '${id}' not found`
      });
    }

    storage.delete(id);
    console.log(`[DELETE] Project deleted: ${id}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('[DELETE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     Music Score Editor API Server                        ║
╠══════════════════════════════════════════════════════════╣
║  Server running on:  http://localhost:${PORT}             ║
║                                                          ║
║  Available endpoints:                                    ║
║    GET    /api/health       - Health check               ║
║    POST   /api/save         - Save a project             ║
║    GET    /api/load/:id     - Load a project by ID       ║
║    GET    /api/list         - List all projects          ║
║    DELETE /api/delete/:id   - Delete a project by ID     ║
╚══════════════════════════════════════════════════════════╝
  `);
});
