import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store';
import { Bouquet } from '../types';

const Catalog: React.FC = () => {
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [selected, setSelected] = useState<Bouquet | null>(null);
  const addToCart = useStore((s) => s.addToCart);

  useEffect(() => {
    axios.get<Bouquet[]>('/api/bouquets').then((res) => setBouquets(res.data));
  }, []);

  const handleAddToCart = (b: Bouquet, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(b);
  };

  return (
    <div>
      <h1 className="page-title">🌸 精选花束</h1>
      <p className="page-subtitle">每一束花，都是一份心意</p>

      <div className="bouquet-grid">
        {bouquets.map((b) => (
          <div className="bouquet-card" key={b.id} onClick={() => setSelected(b)}>
            <div className="card-emoji-block" style={{ background: b.color + '18' }}>
              {b.emoji}
            </div>
            <div className="card-body">
              <div className="card-title">{b.name}</div>
              <div className="card-price">{b.price}</div>
              <button
                className="btn btn-primary btn-sm"
                onClick={(e) => handleAddToCart(b, e)}
              >
                加入购物车
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji-block" style={{ background: selected.color + '18' }}>
              {selected.emoji}
            </div>
            <div className="modal-body">
              <h2>{selected.name}</h2>
              <div className="price">{selected.price}</div>

              <div className="section-title">📝 花束介绍</div>
              <div className="section-text">{selected.description}</div>

              <div className="section-title">💝 花语寓意</div>
              <div className="section-text">{selected.meaning}</div>

              <div className="section-title">🎁 推荐搭配</div>
              <div className="section-text">{selected.pairing}</div>

              <div style={{ marginTop: 20 }}>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => {
                    addToCart(selected);
                    setSelected(null);
                  }}
                >
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
