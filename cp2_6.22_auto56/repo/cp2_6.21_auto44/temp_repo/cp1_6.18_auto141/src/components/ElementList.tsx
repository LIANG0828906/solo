import { useAnimationStore } from '@/stores/animationStore';

export default function ElementList() {
  const {
    elements,
    selectedElementId,
    addElement,
    selectElement,
  } = useAnimationStore();

  return (
    <div className="element-list">
      <button
        className="btn-add-element"
        onClick={addElement}
        disabled={elements.length >= 5}
        style={{ opacity: elements.length >= 5 ? 0.5 : 1 }}
        title={
          elements.length >= 5 ? '最多添加5个元素' : '添加新元素'
        }
      >
        <span style={{ fontSize: 16 }}>+</span> Add Element
      </button>

      <div className="element-list-title">元素列表</div>

      {elements.map((el) => (
        <div
          key={el.id}
          className={`element-item ${el.id === selectedElementId ? 'active' : ''}`}
          onClick={() => selectElement(el.id)}
        >
          <div
            className="element-dot"
            style={{ background: el.color, color: el.color }}
          />
          <span className="element-name">{el.name}</span>
        </div>
      ))}
    </div>
  );
}
