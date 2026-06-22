import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { useCommentStore } from './modules/comment/CommentStore';

const Root = () => {
  React.useEffect(() => {
    useCommentStore.getState().initSocket();
    return () => useCommentStore.getState().disconnectSocket();
  }, []);

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
