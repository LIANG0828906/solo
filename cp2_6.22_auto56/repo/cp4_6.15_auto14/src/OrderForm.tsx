import { useState, useCallback, useEffect } from 'react';
import type { Order, FormData, FormErrors } from './types';
import { validateForm, hasErrors, validatePhone, validateQuantity } from './utils/validation';
import './styles/OrderForm.css';

interface OrderFormProps {
  onSubmit: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  existingCommunities: string[];
}

const INITIAL_DATA: FormData = {
  customerName: '',
  phone: '',
  community: '',
  productName: '',
  quantity: '',
};

function OrderForm({ onSubmit, existingCommunities }: OrderFormProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: keyof FormData, value: string) => {
    const tempData = { ...formData, [name]: value };
    const allErrors = validateForm(tempData);
    setErrors((prev) => {
      const next = { ...prev };
      if (allErrors[name]) {
        next[name] = allErrors[name];
      } else {
        delete next[name];
      }
      return next;
    });
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name as keyof FormData, value);
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name as keyof FormData, value);
  }, [validateField]);

  useEffect(() => {
    if (formData.phone.length > 0) {
      const valid = validatePhone(formData.phone);
      setErrors((prev) => {
        const next = { ...prev };
        if (formData.phone.length === 11 && !valid) {
          next.phone = '手机号必须是11位数字';
        } else if (formData.phone.length < 11 && formData.phone.length > 0) {
          next.phone = '手机号必须是11位数字';
        } else if (valid) {
          delete next.phone;
        }
        return next;
      });
    }
  }, [formData.phone]);

  useEffect(() => {
    if (formData.quantity.length > 0) {
      const valid = validateQuantity(formData.quantity);
      setErrors((prev) => {
        const next = { ...prev };
        if (!valid) {
          next.quantity = '数量必须是正整数';
        } else {
          delete next.quantity;
        }
        return next;
      });
    }
  }, [formData.quantity]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const allErrors = validateForm(formData);
    setErrors(allErrors);
    setTouched({
      customerName: true,
      phone: true,
      community: true,
      productName: true,
      quantity: true,
    });

    if (!hasErrors(allErrors)) {
      onSubmit({
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        community: formData.community.trim(),
        productName: formData.productName.trim(),
        quantity: parseInt(formData.quantity, 10),
      });
      setFormData(INITIAL_DATA);
      setErrors({});
      setTouched({});
    }
  }, [formData, onSubmit]);

  const getInputClass = (name: keyof FormData) => {
    return `form-input ${touched[name] && errors[name] ? 'input-error' : ''}`;
  };

  return (
    <div className="order-form-card">
      <h2 className="form-title">订单录入</h2>
      <form onSubmit={handleSubmit} className="order-form" noValidate>
        <div className="form-group">
          <label htmlFor="customerName">客户姓名</label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            className={getInputClass('customerName')}
            value={formData.customerName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请输入客户姓名"
          />
          {touched.customerName && errors.customerName && (
            <span className="error-text">{errors.customerName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone">手机号</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={getInputClass('phone')}
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请输入11位手机号"
            maxLength={11}
          />
          {touched.phone && errors.phone && (
            <span className="error-text">{errors.phone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="community">小区名称</label>
          <select
            id="community"
            name="community"
            className={getInputClass('community')}
            value={formData.community}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="">请选择小区</option>
            {existingCommunities.length > 0 && (
              <optgroup label="已有小区">
                {existingCommunities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="预设小区">
              <option value="阳光花园">阳光花园</option>
              <option value="翠湖小区">翠湖小区</option>
              <option value="绿城家园">绿城家园</option>
              <option value="金色港湾">金色港湾</option>
              <option value="幸福里">幸福里</option>
            </optgroup>
          </select>
          {touched.community && errors.community && (
            <span className="error-text">{errors.community}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="productName">商品名称</label>
          <input
            id="productName"
            name="productName"
            type="text"
            className={getInputClass('productName')}
            value={formData.productName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请输入商品名称"
            list="product-list"
          />
          <datalist id="product-list">
            <option value="有机蔬菜包" />
            <option value="新鲜水果箱" />
            <option value="土鸡蛋" />
            <option value="鲜牛奶" />
            <option value="精品大米" />
          </datalist>
          {touched.productName && errors.productName && (
            <span className="error-text">{errors.productName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="quantity">数量</label>
          <input
            id="quantity"
            name="quantity"
            type="text"
            inputMode="numeric"
            className={getInputClass('quantity')}
            value={formData.quantity}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请输入正整数数量"
          />
          {touched.quantity && errors.quantity && (
            <span className="error-text">{errors.quantity}</span>
          )}
        </div>

        <button type="submit" className="submit-btn">
          添加订单
        </button>
      </form>
    </div>
  );
}

export default OrderForm;
