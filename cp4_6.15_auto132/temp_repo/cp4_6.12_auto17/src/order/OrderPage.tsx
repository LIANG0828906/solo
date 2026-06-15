import { Routes, Route } from 'react-router-dom';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';

export default function OrderPage() {
  return (
    <Routes>
      <Route path="/" element={<OrderList />} />
      <Route path=":id" element={<OrderDetail />} />
    </Routes>
  );
}
