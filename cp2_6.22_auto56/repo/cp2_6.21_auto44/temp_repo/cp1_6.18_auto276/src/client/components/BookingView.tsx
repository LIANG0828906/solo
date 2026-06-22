import { useState, useEffect } from 'react';
import axios from 'axios';

interface Seat {
  id: number;
  row: number;
  col: number;
  isBooked: boolean;
  customerName?: string;
  phone?: string;
  partySize?: number;
}

function BookingView() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    partySize: 2
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      const response = await axios.get('/api/seatings');
      setSeats(response.data);
    } catch (error) {
      console.error('获取座位数据失败:', error);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.isBooked) return;
    setSelectedSeat(seat);
    setFormData({ customerName: '', phone: '', partySize: 2 });
    setErrors({});
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = '请输入姓名';
    }

    if (!/^\d{11}$/.test(formData.phone)) {
      newErrors.phone = '请输入11位手机号码';
    }

    if (formData.partySize < 1 || formData.partySize > 6) {
      newErrors.partySize = '人数需在1-6人之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedSeat) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/booking', {
        seatId: selectedSeat.id,
        customerName: formData.customerName,
        phone: formData.phone,
        partySize: formData.partySize
      });

      setSeats((prevSeats) =>
        prevSeats.map((seat) =>
          seat.id === selectedSeat.id ? response.data : seat
        )
      );

      setShowModal(false);
      setSelectedSeat(null);
    } catch (error) {
      console.error('预订失败:', error);
      setErrors({ submit: '预订失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const getSurname = (name: string): string => {
    return name.charAt(0);
  };

  const renderSeatGrid = () => {
    const rows = [];
    for (let row = 0; row < 10; row++) {
      const cols = [];
      for (let col = 0; col < 10; col++) {
        const seat = seats.find((s) => s.row === row && s.col === col);
        if (seat) {
          cols.push(
            <div
              key={seat.id}
              style={{
                ...styles.seat,
                ...(seat.isBooked ? styles.seatBooked : styles.seatFree),
                cursor: seat.isBooked ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handleSeatClick(seat)}
              onMouseEnter={(e) => {
                if (!seat.isBooked) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={
                seat.isBooked
                  ? `座位 ${seat.id} - ${seat.customerName}（${seat.partySize}人）`
                  : `座位 ${seat.id} - 空闲`
              }
            >
              {seat.isBooked && seat.customerName && (
                <span style={styles.seatText}>
                  {getSurname(seat.customerName)}
                </span>
              )}
            </div>
          );
        }
      }
      rows.push(
        <div key={row} style={styles.seatRow}>
          {cols}
        </div>
      );
    }
    return rows;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>选择座位</h2>
      <p style={styles.subtitle}>点击空闲座位进行预订</p>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, backgroundColor: '#48C9B0' }} />
          <span>空闲</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, backgroundColor: '#FF6B6B' }} />
          <span>已预订</span>
        </div>
      </div>

      <div style={styles.gridWrapper}>
        <div style={styles.seatGrid}>{renderSeatGrid()}</div>
      </div>

      {showModal && selectedSeat && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>预订座位 {selectedSeat.id}</h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>姓名</label>
              <input
                type="text"
                style={{
                  ...styles.input,
                  ...(errors.customerName ? styles.inputError : {})
                }}
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                placeholder="请输入姓名"
              />
              {errors.customerName && (
                <span style={styles.errorText}>{errors.customerName}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>电话</label>
              <input
                type="tel"
                style={{
                  ...styles.input,
                  ...(errors.phone ? styles.inputError : {})
                }}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="请输入11位手机号"
              />
              {errors.phone && (
                <span style={styles.errorText}>{errors.phone}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>用餐人数</label>
              <select
                style={styles.select}
                value={formData.partySize}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    partySize: parseInt(e.target.value)
                  })
                }
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} 人
                  </option>
                ))}
              </select>
              {errors.partySize && (
                <span style={styles.errorText}>{errors.partySize}</span>
              )}
            </div>

            {errors.submit && (
              <div style={styles.submitError}>{errors.submit}</div>
            )}

            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                style={styles.confirmButton}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '提交中...' : '确认预订'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0 20px',
    textAlign: 'center' as const
  },
  title: {
    fontSize: '24px',
    marginBottom: '8px',
    color: '#ECF0F1'
  },
  subtitle: {
    fontSize: '14px',
    color: '#BDC3C7',
    marginBottom: '20px'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '20px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  legendColor: {
    width: '20px',
    height: '20px',
    borderRadius: '4px'
  },
  gridWrapper: {
    display: 'flex',
    justifyContent: 'center',
    overflowX: 'auto'
  },
  seatGrid: {
    display: 'inline-block',
    backgroundColor: '#34495E',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #ECF0F1'
  },
  seatRow: {
    display: 'flex',
    gap: '2px',
    marginBottom: '2px'
  },
  seat: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.3s ease-out',
    userSelect: 'none' as const
  },
  seatFree: {
    backgroundColor: '#48C9B0'
  },
  seatBooked: {
    backgroundColor: '#FF6B6B'
  },
  seatText: {
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: 'bold' as const
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '32px',
    width: '90%',
    maxWidth: '400px',
    color: '#2C3E50'
  },
  modalTitle: {
    fontSize: '20px',
    marginBottom: '24px',
    color: '#2C3E50',
    textAlign: 'center' as const
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    marginBottom: '6px',
    color: '#2C3E50',
    fontWeight: '500' as const
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #BDC3C7',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  inputError: {
    borderColor: '#E74C3C'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #BDC3C7',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer'
  },
  errorText: {
    display: 'block',
    fontSize: '12px',
    color: '#E74C3C',
    marginTop: '4px'
  },
  submitError: {
    backgroundColor: '#FADBD8',
    color: '#E74C3C',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center' as const
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    borderRadius: '8px',
    backgroundColor: '#ECF0F1',
    color: '#2C3E50',
    transition: 'background-color 0.2s ease'
  },
  confirmButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    borderRadius: '8px',
    backgroundColor: '#E67E22',
    color: '#FFFFFF',
    fontWeight: 'bold' as const,
    transition: 'background-color 0.2s ease'
  }
};

export default BookingView;
