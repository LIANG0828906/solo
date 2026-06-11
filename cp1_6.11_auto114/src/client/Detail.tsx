import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import {
  Instrument,
  Review,
  conditionLabels,
  categoryLabels,
  bookingStatusLabels,
} from './types';
import { useAuth } from './context/AuthContext';

const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const carouselRef = useRef<number | null>(null);

  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const timeSlots = ['10:00-12:00', '14:00-16:00', '16:00-18:00', '19:00-21:00'];

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [instResponse, reviewsResponse] = await Promise.all([
          axios.get(`/api/instruments/${id}`),
          axios.get(`/api/instruments/${id}/reviews`),
        ]);
        setInstrument(instResponse.data);
        setReviews(reviewsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (instrument && instrument.images.length > 1) {
      carouselRef.current = window.setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % instrument.images.length);
      }, 4000);
    }

    return () => {
      if (carouselRef.current) {
        clearInterval(carouselRef.current);
      }
    };
  }, [instrument]);

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      setBookingError('请选择日期和时段');
      return;
    }

    try {
      setBookingError('');
      await axios.post(
        '/api/bookings',
        {
          instrumentId: instrument?.id,
          instrumentName: instrument?.name,
          bookingDate: selectedDate,
          timeSlot: selectedTimeSlot,
          requesterId: user.id,
          requesterNickname: user.nickname,
          publisherId: instrument?.publisherId,
          publisherNickname: instrument?.publisherNickname,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        setSelectedDate('');
        setSelectedTimeSlot('');
      }, 2000);
    } catch (err: any) {
      setBookingError(err.response?.data?.error || '预约失败，请重试');
    }
  };

  const toggleFavorite = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsFavorite(!isFavorite);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#FF8C00' : '#D2A679', fontSize: '16px' }}>
        {i < rating ? '★' : '☆'}
      </span>
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split('')
      .filter((char) => char.match(/[a-zA-Z\u4e00-\u9fa5]/))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="skeleton" style={{ width: '100%', height: '500px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (!instrument) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#5C3317' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎸</div>
        <h2 style={{ marginBottom: '12px' }}>乐器不存在</h2>
        <Link to="/" style={{ color: '#FF8C00', textDecoration: 'underline' }}>
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginBottom: '48px',
          animation: 'fadeIn 0.5s ease-out',
        }}
        className="detail-grid"
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '2px solid #8B4513',
              boxShadow: '0 8px 32px rgba(92, 51, 23, 0.2)',
            }}
          >
            {instrument.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${instrument.name} - ${index + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: currentImageIndex === index ? 1 : 0,
                  transition: 'opacity 0.5s ease-out',
                }}
              />
            ))}

            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
              }}
            >
              {instrument.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: currentImageIndex === index ? '#FF8C00' : 'rgba(255, 255, 255, 0.6)',
                    border: 'none',
                    transition: 'all 0.2s ease-out',
                    transform: currentImageIndex === index ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + instrument.images.length) % instrument.images.length)}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(92, 51, 23, 0.7)',
                color: 'white',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % instrument.images.length)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(92, 51, 23, 0.7)',
                color: 'white',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ›
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: categoryLabels[instrument.category] ? '#5C3317' : '#8B4513',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {categoryLabels[instrument.category]}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: instrument.condition === 'new' ? '#4CAF50' : instrument.condition === 'minor-flaw' ? '#FF9800' : '#795548',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {conditionLabels[instrument.condition]}
              </span>
            </div>
            <h1 style={{ fontSize: '32px', color: '#5C3317', marginBottom: '8px', lineHeight: '1.2' }}>
              {instrument.name}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '24px', padding: '20px', background: '#FFE4B5', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#8B4513', marginBottom: '4px' }}>日租金</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF8C00' }}>
                ¥{instrument.rentPerDay}
              </div>
            </div>
            <div style={{ width: '1px', background: '#DEB887' }} />
            <div>
              <div style={{ fontSize: '14px', color: '#8B4513', marginBottom: '4px' }}>售价</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#5C3317' }}>
                ¥{instrument.salePrice}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', color: '#5C3317', marginBottom: '8px' }}>成色描述</h3>
            <p style={{ color: '#8B4513', lineHeight: '1.6', fontSize: '14px' }}>
              {instrument.conditionDescription || '暂无详细描述'}
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', color: '#5C3317', marginBottom: '8px' }}>发布者</h3>
            <Link
              to={`/profile/${instrument.publisherId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#FFF8DC',
                borderRadius: '8px',
                border: '1px solid #DEB887',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: '2px solid #8B4513',
                }}
              >
                {getInitials(instrument.publisherNickname)}
              </div>
              <div>
                <div style={{ color: '#5C3317', fontWeight: '500' }}>{instrument.publisherNickname}</div>
                <div style={{ fontSize: '12px', color: '#8B4513' }}>
                  发布于 {format(new Date(instrument.createdAt), 'yyyy-MM-dd')}
                </div>
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            <button
              onClick={toggleFavorite}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: '#FFF8DC',
                border: '1px solid #8B4513',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isFavorite ? '#E53935' : '#8B4513',
              }}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
            <button
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                setShowBookingModal(true);
              }}
              style={{
                flex: 1,
                background: '#FF8C00',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                height: '56px',
                boxShadow: '0 6px 20px rgba(255, 140, 0, 0.4)',
              }}
            >
              📅 预约试音
            </button>
          </div>
        </div>
      </div>

      <div style={{ animation: 'fadeIn 0.5s ease-out 0.2s both' }}>
        <h2 style={{ fontSize: '24px', color: '#5C3317', marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid #DEB887' }}>
          用户评价 ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8B4513' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
            <p>暂无评价，快来成为第一个评价的人吧！</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.map((review, index) => (
              <div
                key={review.id}
                style={{
                  background: '#FFF8DC',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #DEB887',
                  animation: `fadeIn 0.4s ease-out ${index * 0.1}s both`,
                }}
              >
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #DEB887 0%, #D2A679 100%)',
                      color: '#5C3317',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      border: '1px solid #8B4513',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(review.userNickname)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500', color: '#5C3317' }}>{review.userNickname}</span>
                      <span style={{ fontSize: '12px', color: '#8B4513' }}>
                        {format(new Date(review.createdAt), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    <div style={{ marginTop: '4px' }}>{renderStars(review.rating)}</div>
                  </div>
                </div>
                <p style={{ color: '#5C3317', lineHeight: '1.6', fontSize: '14px', paddingLeft: '52px' }}>
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBookingModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(92, 51, 23, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.3s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBookingModal(false);
          }}
        >
          <div
            style={{
              background: '#FFF8DC',
              borderRadius: '16px',
              border: '2px solid #8B4513',
              boxShadow: '0 12px 48px rgba(92, 51, 23, 0.3)',
              padding: '32px',
              width: '100%',
              maxWidth: '500px',
              animation: 'slideIn 0.3s ease-out',
              position: 'relative',
            }}
          >
            {bookingSuccess && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(76, 175, 80, 0.95)',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  zIndex: 10,
                  animation: 'fadeIn 0.3s ease-out',
                }}
              >
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
                <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>预约成功！</h2>
                <p>已向 {instrument.publisherNickname} 发送预约请求</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', color: '#5C3317' }}>预约试音</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{
                  background: 'transparent',
                  color: '#8B4513',
                  fontSize: '24px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#5C3317', marginBottom: '12px' }}>选择日期</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {availableDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      background: selectedDate === date ? '#FF8C00' : '#FFE4B5',
                      color: selectedDate === date ? 'white' : '#5C3317',
                      border: '1px solid #DEB887',
                      fontSize: '13px',
                      height: '48px',
                      transition: 'all 0.2s ease-out',
                    }}
                  >
                    {format(new Date(date), 'MM-dd')}
                    <br />
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>
                      {format(new Date(date), 'EEE')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#5C3317', marginBottom: '12px' }}>选择时段</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTimeSlot(slot)}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: selectedTimeSlot === slot ? '#FF8C00' : '#FFE4B5',
                      color: selectedTimeSlot === slot ? 'white' : '#5C3317',
                      border: '1px solid #DEB887',
                      fontSize: '14px',
                      height: '48px',
                      transition: 'all 0.2s ease-out',
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {bookingError && (
              <div
                style={{
                  background: '#FFEBEB',
                  border: '1px solid #E53935',
                  color: '#C62828',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {bookingError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: '#5C3317',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  height: '48px',
                  border: '1px solid #8B4513',
                }}
              >
                取消
              </button>
              <button
                onClick={handleBooking}
                style={{
                  flex: 2,
                  background: '#FF8C00',
                  color: 'white',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  height: '48px',
                  boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)',
                }}
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Detail;
