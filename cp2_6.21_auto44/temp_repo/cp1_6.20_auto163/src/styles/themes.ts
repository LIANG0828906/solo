export interface Theme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
}

export const themes: Theme[] = [
  {
    name: 'classic',
    primaryColor: '#1a365d',
    secondaryColor: '#4a5568',
    backgroundColor: '#ffffff',
    textColor: '#2d3748',
    accentColor: '#2c5282',
    headingFont: "'Georgia', 'Times New Roman', serif",
    bodyFont: "'Georgia', 'Times New Roman', serif"
  },
  {
    name: 'modern',
    primaryColor: '#065f46',
    secondaryColor: '#6b7280',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#10b981',
    headingFont: "'Helvetica Neue', 'Arial', sans-serif",
    bodyFont: "'Helvetica Neue', 'Arial', sans-serif"
  },
  {
    name: 'creative',
    primaryColor: '#7c3aed',
    secondaryColor: '#ea580c',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#f97316',
    headingFont: "'Segoe UI', 'Roboto', sans-serif",
    bodyFont: "'Segoe UI', 'Roboto', sans-serif"
  },
  {
    name: 'vintage',
    primaryColor: '#92400e',
    secondaryColor: '#78350f',
    backgroundColor: '#fef3c7',
    textColor: '#451a03',
    accentColor: '#b45309',
    headingFont: "'Palatino', 'Georgia', serif",
    bodyFont: "'Palatino', 'Georgia', serif"
  }
];

export const getThemeByName = (name: string): Theme => {
  return themes.find(t => t.name === name) || themes[0];
};
