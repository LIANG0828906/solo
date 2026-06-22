import React from 'react';
import SearchBar from '../components/SearchBar';
import WatchList from '../components/WatchList';

const Home: React.FC = () => {
  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">追剧小本本</h1>
        <p className="text-gray-400">记录你的每一次观剧历程</p>
      </div>

      <SearchBar />
      <WatchList />
    </div>
  );
};

export default Home;
