export interface TemplateVariable {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'number';
  required: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minDate?: string;
  };
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  variables: TemplateVariable[];
  content: string[];
}

export interface ContractHistory {
  id: string;
  templateId: string;
  templateName: string;
  generatedAt: string;
  partyAName: string;
  variables: Record<string, string>;
  pdfBase64: string;
  htmlPreview: string;
}

export interface GenerateRequest {
  templateId: string;
  variables: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
}
