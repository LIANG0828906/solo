import { useDreamStore } from '../stores/dreamStore';

export default function Navbar() {
  const openEditor = useDreamStore(state => state.openEditor);

  return (
    <nav className="navbar">
      <div className="logo">梦境地图</div>
      <button
        className="btn-primary"
        onClick={() => openEditor()}
      >
        记录新梦
      </button>
    </nav>
  );
}
