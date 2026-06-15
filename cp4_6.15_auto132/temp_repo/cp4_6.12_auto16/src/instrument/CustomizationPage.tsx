import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { instrumentsApi, woodsApi, ordersApi, Wood, Instrument, CreateOrderInput } from '../api';
import InstrumentConfigurator from './InstrumentConfigurator';

const CustomizationPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [allWoods, setAllWoods] = useState<Wood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;
    Promise.all([
      instrumentsApi.getInstrumentByType(type),
      woodsApi.getWoods(),
    ])
      .then(([inst, woods]) => {
        setInstrument(inst);
        setAllWoods(woods);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type]);

  const handleSubmitOrder = useCallback(
    async (config: {
      topWoodId: number;
      backWoodId: number;
      sideWoodId: number;
      fingerboardWoodId: number;
      neckWoodId: number;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      notes: string;
    }) => {
      if (!instrument) return;
      const input: CreateOrderInput = {
        instrumentType: instrument.type,
        instrumentName: instrument.name,
        ...config,
      };
      try {
        const result = await ordersApi.createOrder(input);
        navigate(`/orders/${result.id}`);
      } catch (err) {
        console.error('Failed to create order:', err);
      }
    },
    [instrument, navigate]
  );

  if (loading) return <div className="loading">加载中...</div>;
  if (!instrument) return <div className="error-message">未找到该乐器类型</div>;

  return (
    <div className="customization-page">
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">← 返回乐器列表</Link>
          <h2 className="page-title" style={{ marginTop: '0.5rem' }}>
            定制 {instrument.name}
          </h2>
        </div>
      </div>

      <InstrumentConfigurator
        instrument={instrument}
        allWoods={allWoods}
        onSubmit={handleSubmitOrder}
      />
    </div>
  );
};

export default CustomizationPage;
