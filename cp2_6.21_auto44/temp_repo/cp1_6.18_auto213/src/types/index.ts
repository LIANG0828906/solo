export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  civilization: string;
  color: string;
  icon: string;
}

export interface Artifact {
  id: string;
  name: string;
  era: string;
  civilization: string;
  modelPath: string;
  description: string;
  relatedEvents: string[];
  modelType: 'pyramid' | 'parthenon' | 'wall' | 'colosseum' | 'pagoda' | 'temple' | 'mosque' | 'cathedral';
}
