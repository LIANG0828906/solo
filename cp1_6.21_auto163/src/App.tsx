import React, { useState } from 'react';
import ReportConfig from './ReportConfig';
import ReportPreview from './ReportPreview';
import type { ReportConfig as ReportConfigType } from './types';

const App: React.FC = () => {
  const [config, setConfig] = useState<ReportConfigType>({
    studentId: '',
    startDate: '',
    endDate: '',
    includeChart: true,
    includeRecommendations: true,
  });

  return (
    <div className="app-container">
      <ReportConfig value={config} onChange={setConfig} />
      <ReportPreview config={config} />
    </div>
  );
};

export default App;
