import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { templates } from '../data/templates';
import { generatePDFBase64, generateHTMLPreview } from '../utils/pdfGenerator';
import { ContractTemplate, ContractHistory, GenerateRequest, ValidationError } from '../types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let contractHistory: ContractHistory[] = [];
const MAX_HISTORY = 50;

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function validateVariables(templateId: string, variables: Record<string, string>): ValidationError[] {
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    return [{ field: 'templateId', message: '模板不存在' }];
  }

  const errors: ValidationError[] = [];

  template.variables.forEach(variable => {
    const value = variables[variable.name];
    
    if (variable.required && (!value || value.trim() === '')) {
      errors.push({ field: variable.name, message: `${variable.label}为必填项` });
      return;
    }

    if (value && value.trim() !== '') {
      if (variable.type === 'number') {
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors.push({ field: variable.name, message: `${variable.label}必须为有效数字` });
        } else if (variable.validation?.min !== undefined && num < variable.validation.min) {
          errors.push({ field: variable.name, message: `${variable.label}必须大于${variable.validation.min}` });
        } else if (variable.validation?.max !== undefined && num > variable.validation.max) {
          errors.push({ field: variable.name, message: `${variable.label}必须小于${variable.validation.max}` });
        } else if (num <= 0) {
          errors.push({ field: variable.name, message: `${variable.label}必须为正浮点数` });
        }
      }

      if (variable.type === 'date') {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isNaN(inputDate.getTime())) {
          errors.push({ field: variable.name, message: `${variable.label}日期格式无效` });
        } else if (variable.validation?.minDate === 'today' && inputDate < today) {
          errors.push({ field: variable.name, message: `${variable.label}不能早于当前日期` });
        }
      }

      if (variable.validation?.pattern) {
        const regex = new RegExp(variable.validation.pattern);
        if (!regex.test(value)) {
          errors.push({ field: variable.name, message: `${variable.label}格式不正确` });
        }
      }
    }
  });

  return errors;
}

app.get('/api/templates', (_req: Request, res: Response) => {
  const templateList: ContractTemplate[] = templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    variables: t.variables,
    content: t.content
  }));
  res.json(templateList);
});

app.get('/api/templates/:id', (req: Request, res: Response) => {
  const template = templates.find(t => t.id === req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json(template);
});

app.get('/api/history', (_req: Request, res: Response) => {
  const sortedHistory = [...contractHistory].sort((a, b) => 
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
  res.json(sortedHistory);
});

app.get('/api/history/:id', (req: Request, res: Response) => {
  const record = contractHistory.find(h => h.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.json(record);
});

app.post('/api/generate', (req: Request, res: Response) => {
  const { templateId, variables }: GenerateRequest = req.body;

  const errors = validateVariables(templateId, variables);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const pdfBase64 = generatePDFBase64(templateId, variables);
    const htmlPreview = generateHTMLPreview(templateId, variables);
    const template = templates.find(t => t.id === templateId)!;
    
    const historyRecord: ContractHistory = {
      id: uuidv4(),
      templateId: templateId,
      templateName: template.name,
      generatedAt: new Date().toISOString(),
      partyAName: variables['partyA'] || '',
      variables: variables,
      pdfBase64: pdfBase64,
      htmlPreview: htmlPreview
    };

    contractHistory.unshift(historyRecord);
    if (contractHistory.length > MAX_HISTORY) {
      contractHistory = contractHistory.slice(0, MAX_HISTORY);
    }

    res.json({
      success: true,
      pdfBase64: pdfBase64,
      htmlPreview: htmlPreview,
      historyId: historyRecord.id
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF生成失败' });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Today's date for validation: ${getTodayString()}`);
});
