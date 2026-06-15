import React, { useState, useEffect } from 'react';
const DeckManager = React.lazy(() => import('./components/DeckManager'));
const FlashCardStudy = React.lazy(() => import('./components/FlashCardStudy'));
const StatsPanel = React.lazy(() => import('./components/StatsPanel'));
type View = 'manager' | 'study';
const App: React.FC = () => {
 const [currentView, setCurrentView] = useState<View>('manager');
 const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [isMobile, setIsMobile] = useState(false);
 useEffect(() => {
 const checkMobile = () => {
 setIsMobile(window.innerWidth < 768);
 setMobileMenuOpen(false);
 };
 checkMobile();
 window.addEventListener('resize', checkMobile);
 return () => window.removeEventListener('resize', checkMobile);
 }, []);
 const handleSelectDeck = (deckId: string) => {
 setSelectedDeckId(deckId);
 setCurrentView('study');
 if (isMobile) {
 setMobileMenuOpen(false);
 }
 };
 const handleBackToManager = () => {
 setCurrentView('manager');
 setSelectedDeckId(null);
 };
 return (<div className="app">
 {isMobile && (<header className="mobile-header">
 <div className="mobile-logo">EchoCard</div>
 <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
 ☰
 </button>
 </header>)}

 {!isMobile && currentView === 'manager' && (<aside className="sidebar">
 <div className="sidebar-logo">
 <h1>EchoCard</h1>
 <p>AI-Powered Flashcards</p>
 </div>
 <React.Suspense fallback={<div className="stats-loading">Loading stats...</div>}>
 <StatsPanel />
 </React.Suspense>
 </aside>)}

 {mobileMenuOpen && (<div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
 <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
 <React.Suspense fallback={<div className="stats-loading">Loading stats...</div>}>
 <StatsPanel />
 </React.Suspense>
 <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>
 Close
 </button>
 </div>
 </div>)}

 <main className="main-content">
 {currentView === 'manager' ? (<React.Suspense fallback={<div className="main-loading">
 <div className="loading-spinner"></div>
 <p>Loading decks...</p>
 </div>}>
 <DeckManager onSelectDeck={handleSelectDeck}/>
 </React.Suspense>) : selectedDeckId ? (<React.Suspense fallback={<div className="main-loading">
 <div className="loading-spinner"></div>
 <p>Loading study mode...</p>
 </div>}>
 <FlashCardStudy deckId={selectedDeckId} onBack={handleBackToManager}/>
 </React.Suspense>) : null}
 </main>

 <style>{`
 * {
 margin: 0;
 padding: 0;
 box-sizing: border-box;
 }

 body {
 font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
 background: #F9FAFB;
 min-height: 100vh;
 }

 .app {
 display: flex;
 min-height: 100vh;
 }

 .mobile-header {
 display: none;
 position: fixed;
 top: 0;
 left: 0;
 right: 0;
 background: #4F46E5;
 color: white;
 padding: 15px 20px;
 display: flex;
 justify-content: space-between;
 align-items: center;
 z-index: 100;
 }

 .mobile-logo {
 font-size: 20px;
 font-weight: 700;
 }

 .mobile-menu-btn {
 background: none;
 border: none;
 color: white;
 font-size: 24px;
 cursor: pointer;
 }

 .sidebar {
 width: 280px;
 background: white;
 padding: 20px;
 position: fixed;
 left: 0;
 top: 0;
 bottom: 0;
 overflow-y: auto;
 box-shadow: 2px 0 8px rgba(0,0,0,0.06);
 }

 .sidebar-logo {
 margin-bottom: 20px;
 padding-bottom: 20px;
 border-bottom: 1px solid #E5E7EB;
 }

 .sidebar-logo h1 {
 color: #4F46E5;
 font-size: 24px;
 margin-bottom: 4px;
 }

 .sidebar-logo p {
 color: #6B7280;
 font-size: 14px;
 }

 .main-content {
 flex: 1;
 padding-left: ${isMobile ? '0' : '300px'};
 padding-top: ${isMobile ? '60px' : '0'};
 min-height: 100vh;
 }

 .mobile-menu-overlay {
 position: fixed;
 top: 0;
 left: 0;
 right: 0;
 bottom: 0;
 background: rgba(0,0,0,0.5);
 z-index: 200;
 }

 .mobile-menu {
 position: absolute;
 top: 60px;
 left: 0;
 right: 0;
 background: white;
 padding: 20px;
 border-bottom-left-radius: 16px;
 border-bottom-right-radius: 16px;
 }

 .mobile-menu-close {
 width: 100%;
 padding: 12px;
 margin-top: 20px;
 background: #E5E7EB;
 color: #374151;
 border: none;
 border-radius: 8px;
 font-size: 16px;
 font-weight: 600;
 cursor: pointer;
 }

 .main-loading {
 display: flex;
 flex-direction: column;
 justify-content: center;
 align-items: center;
 min-height: 60vh;
 }

 .loading-spinner {
 width: 48px;
 height: 48px;
 border: 4px solid #E5E7EB;
 border-top-color: #4F46E5;
 border-radius: 50%;
 animation: spin 1s linear infinite;
 margin-bottom: 16px;
 }

 .stats-loading {
 padding: 20px;
 text-align: center;
 color: #6B7280;
 }

 @keyframes spin {
 to { transform: rotate(360deg); }
 }

 @media (max-width: 768px) {
 .sidebar {
 display: none;
 }

 .main-content {
 padding-left: 0;
 padding-top: 60px;
 }

 .mobile-header {
 display: flex;
 }
 }
 `}</style>
 </div>);
};
export default App;