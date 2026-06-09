import React, { useState } from 'react';

interface BorrowFormProps {
  bookId: string;
  bookTitle: string;
  isBorrowed: boolean;
  onSubmit: (readerName: string, borrowDate: string, returnDate: string) => void;
}

const BorrowForm: React.FC<BorrowFormProps> = ({ bookId, bookTitle, isBorrowed, onSubmit }) => {
  const [readerName, setReaderName] = useState('');
  const [borrowDate, setBorrowDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readerName || !borrowDate || !returnDate) return;

    setIsSubmitting(true);
    try {
      onSubmit(readerName, borrowDate, returnDate);
      setSuccess(true);
      setReaderName('');
      setBorrowDate('');
      setReturnDate('');
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="borrow-form-container">
      <h3 className="borrow-form-title">
        {isBorrowed ? '该书已被借出' : `借阅登记 · ${bookTitle}`}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">读者姓名</label>
          <input
            type="text"
            className="form-input"
            value={readerName}
            onChange={(e) => setReaderName(e.target.value)}
            disabled={isBorrowed || isSubmitting}
            placeholder="请输入读者姓名"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">借阅日期</label>
          <input
            type="date"
            className="form-input"
            value={borrowDate}
            onChange={(e) => setBorrowDate(e.target.value)}
            disabled={isBorrowed || isSubmitting}
            min={today}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">归还日期</label>
          <input
            type="date"
            className="form-input"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            disabled={isBorrowed || isSubmitting}
            min={borrowDate || today}
            required
          />
        </div>
        <button
          type="submit"
          className="submit-btn"
          disabled={isBorrowed || isSubmitting}
        >
          {isSubmitting ? '登记中...' : isBorrowed ? '暂不可借' : '登记借阅'}
        </button>
        {success && (
          <div className="success-message">
            借阅登记成功！该书已借出。
          </div>
        )}
      </form>
    </div>
  );
};

export default BorrowForm;
