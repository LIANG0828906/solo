import CardWall from './components/CardWall';

export default function App() {
  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <CardWall />
    </div>
  );
}
