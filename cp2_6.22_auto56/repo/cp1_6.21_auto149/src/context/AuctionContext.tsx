import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import axios from 'axios';
import { Product, Bid } from '../types';

interface AuctionState {
  products: Product[];
  selectedProductId: string;
  bids: Bid[];
  currentProduct: Product | null;
  selectProduct: (id: string) => void;
  placeBid: (amount: number) => Promise<void>;
  loading: boolean;
  highestBid: number;
}

const AuctionContext = createContext<AuctionState | null>(null);

export function useAuction(): AuctionState {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used within AuctionProvider');
  return ctx;
}

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const currentProduct =
    products.find((p) => p.id === selectedProductId) || null;

  const highestBid =
    bids.length > 0
      ? Math.max(...bids.map((b) => b.amount))
      : currentProduct?.startingPrice || 0;

  const fetchBids = useCallback(async () => {
    if (!selectedProductId) return;
    try {
      const res = await axios.get(`/api/products/${selectedProductId}/bids`);
      if (mountedRef.current) {
        setBids(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch bids', e);
    }
  }, [selectedProductId]);

  useEffect(() => {
    mountedRef.current = true;
    axios.get('/api/products').then((res) => {
      if (mountedRef.current) {
        setProducts(res.data);
        if (res.data.length > 0) {
          setSelectedProductId(res.data[0].id);
        }
        setLoading(false);
      }
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProductId) return;
    fetchBids();
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(fetchBids, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedProductId, fetchBids]);

  const selectProduct = useCallback((id: string) => {
    setSelectedProductId(id);
    setBids([]);
  }, []);

  const placeBid = useCallback(
    async (amount: number) => {
      if (!selectedProductId) return;
      try {
        await axios.post(`/api/products/${selectedProductId}/bids`, { amount });
        await fetchBids();
      } catch (e) {
        console.error('Failed to place bid', e);
        throw e;
      }
    },
    [selectedProductId, fetchBids]
  );

  return (
    <AuctionContext.Provider
      value={{
        products,
        selectedProductId,
        bids,
        currentProduct,
        selectProduct,
        placeBid,
        loading,
        highestBid,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}
