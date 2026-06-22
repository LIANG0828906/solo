import {
  getInstruments as apiGetInstruments,
  getInstrument as apiGetInstrument,
  createInstrument as apiCreateInstrument,
  getOffers as apiGetOffers,
  createOffer as apiCreateOffer,
  acceptOffer as apiAcceptOffer,
  rejectOffer as apiRejectOffer,
  buildCreateInstrumentFormData,
} from '../../shared/api/apiClient';
import { useStore } from '../../shared/store/useStore';
import type {
  Instrument,
  Offer,
  CreateInstrumentDto,
  FilterState,
} from '../../shared/types';

export class InventoryModule {
  static async fetchInstruments(filter?: FilterState): Promise<Instrument[]> {
    const { setLoading, setInstruments, showNotification } = useStore.getState();
    setLoading(true);
    try {
      const data = await apiGetInstruments(filter);
      setInstruments(data);
      return data;
    } catch (err) {
      showNotification('error', '获取乐器列表失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  static async fetchInstrument(id: string): Promise<Instrument> {
    const { setLoading, setSelectedInstrument, showNotification } = useStore.getState();
    setLoading(true);
    try {
      const data = await apiGetInstrument(id);
      setSelectedInstrument(data);
      return data;
    } catch (err) {
      showNotification('error', '获取乐器详情失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  static async publishInstrument(dto: CreateInstrumentDto): Promise<Instrument> {
    const { setLoading, addInstrument, showNotification } = useStore.getState();
    setLoading(true);
    try {
      const formData = buildCreateInstrumentFormData(dto);
      const data = await apiCreateInstrument(formData);
      addInstrument(data);
      showNotification('success', '发布成功');
      return data;
    } catch (err) {
      showNotification('error', '发布失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  static async submitOffer(
    instrumentId: string,
    buyerName: string,
    price: number
  ): Promise<Offer> {
    const { addOffer, showNotification } = useStore.getState();

    if (!buyerName || buyerName.trim().length === 0) {
      showNotification('error', '请输入姓名');
      throw new Error('买家姓名不能为空');
    }
    if (buyerName.trim().length > 50) {
      showNotification('error', '姓名过长（最多50字符）');
      throw new Error('买家姓名过长');
    }
    if (!price || price <= 0) {
      showNotification('error', '请输入有效价格');
      throw new Error('价格必须大于0');
    }
    if (!isFinite(price)) {
      showNotification('error', '价格格式错误');
      throw new Error('价格格式错误');
    }

    try {
      const offer = await apiCreateOffer(instrumentId, {
        buyerName: buyerName.trim(),
        price: Number(price),
      });
      addOffer(offer);
      showNotification('success', '出价成功');
      return offer;
    } catch (err) {
      showNotification('error', '出价失败，请重试');
      throw err;
    }
  }

  static async fetchOffers(instrumentId: string): Promise<Offer[]> {
    const { setOffers, showNotification } = useStore.getState();
    try {
      const data = await apiGetOffers(instrumentId);
      setOffers(data);
      return data;
    } catch (err) {
      showNotification('error', '获取出价列表失败');
      throw err;
    }
  }

  static async acceptOffer(offerId: string): Promise<Offer> {
    const { updateOfferStatus, showNotification } = useStore.getState();
    try {
      const offer = await apiAcceptOffer(offerId);
      updateOfferStatus(offerId, 'accepted');
      showNotification('success', '已接受出价');
      return offer;
    } catch (err) {
      showNotification('error', '接受出价失败');
      throw err;
    }
  }

  static async rejectOffer(offerId: string): Promise<Offer> {
    const { updateOfferStatus, showNotification } = useStore.getState();
    try {
      const offer = await apiRejectOffer(offerId);
      updateOfferStatus(offerId, 'rejected');
      showNotification('success', '已拒绝出价');
      return offer;
    } catch (err) {
      showNotification('error', '拒绝出价失败');
      throw err;
    }
  }
}

export default InventoryModule;
