import express from 'express';
import cors from 'cors';
import { questionRouter } from './QuestionService';
import { gradeRouter } from './GradeService';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/questions', questionRouter);
app.use('/api/grade', gradeRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
