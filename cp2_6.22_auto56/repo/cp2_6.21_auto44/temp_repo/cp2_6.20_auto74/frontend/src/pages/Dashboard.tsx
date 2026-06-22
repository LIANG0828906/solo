import React from 'react';
import IngredientPanel from '../components/IngredientPanel';
import RecipeList from '../components/RecipeList';

const Dashboard: React.FC = () => {
  return (
    <div
      className="dashboard-layout"
      style={{
        display: 'flex',
        gap: '24px',
        padding: '24px',
        height: 'calc(100vh - 64px)',
        boxSizing: 'border-box',
      }}
    >
      <IngredientPanel />
      <RecipeList />
    </div>
  );
};

export default Dashboard;
