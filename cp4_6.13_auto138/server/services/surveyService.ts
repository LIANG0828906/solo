import { surveyRepository } from '../repositories/surveyRepository.js';
import type { Survey, Dimension, CreateSurveyRequest } from '../types.js';

function generateSurveyCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function generateUniqueSurveyCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = generateSurveyCode();
    attempts++;
    if (attempts > 100) {
      throw new Error('Failed to generate unique survey code');
    }
  } while (surveyRepository.findByCode(code) !== null);
  return code;
}

export const surveyService = {
  createSurvey(data: CreateSurveyRequest): Survey & { dimensions: Dimension[] } {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (!data.dimensions || data.dimensions.length === 0) {
      throw new Error('At least one dimension is required');
    }
    if (data.dimensions.length > 5) {
      throw new Error('Maximum 5 dimensions allowed');
    }

    const code = generateUniqueSurveyCode();
    const survey = surveyRepository.create(data.title, data.description, code);

    const dimensions: Dimension[] = data.dimensions.map((dim, index) => {
      return surveyRepository.createDimension(
        survey.id,
        dim.emoji,
        dim.label,
        dim.allowText,
        index
      );
    });

    return { ...survey, dimensions };
  },

  getSurveyById(id: string): (Survey & { dimensions: Dimension[] }) | null {
    return surveyRepository.findByIdWithDimensions(id);
  },

  getSurveyByCode(code: string): (Survey & { dimensions: Dimension[] }) | null {
    return surveyRepository.findByCodeWithDimensions(code);
  },
};
