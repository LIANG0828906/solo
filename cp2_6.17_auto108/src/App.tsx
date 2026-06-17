import { useState, useEffect, useCallback } from 'react';
import { HousePage } from './components/HousePage';
import { VoteDetail } from './components/VoteDetail';
import { useVoteApi } from './hooks/useVoteApi';

type Route =
  | { name: 'home' }
  | { name: 'detail'; id: string };

function parseHashRoute(): Route {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('/vote/')) {
    const id = hash.slice('/vote/'.length);
    if (id) return { name: 'detail', id };
  }
  return { name: 'home' };
}

function routeToHash(route: Route): string {
  if (route.name === 'detail') return `#/vote/${route.id}`;
  return '#/';
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHashRoute());
  const { updateTopicStatuses } = useVoteApi();

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHashRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    updateTopicStatuses();
  }, [updateTopicStatuses]);

  const navigateToHome = useCallback(() => {
    const newRoute: Route = { name: 'home' };
    setRoute(newRoute);
    window.location.hash = routeToHash(newRoute);
  }, []);

  const navigateToDetail = useCallback((id: string) => {
    const newRoute: Route = { name: 'detail', id };
    setRoute(newRoute);
    window.location.hash = routeToHash(newRoute);
  }, []);

  return (
    <div key={route.name === 'detail' ? route.id : 'home'} className="animate-fade-in">
      {route.name === 'home' && (
        <HousePage onNavigateToDetail={navigateToDetail} />
      )}
      {route.name === 'detail' && (
        <VoteDetail topicId={route.id} onBack={navigateToHome} />
      )}
    </div>
  );
}
