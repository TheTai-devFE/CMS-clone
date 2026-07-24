'use client';

import React, { useState } from 'react';
import { api } from '@/utils/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [purchaseType, setPurchaseType] = useState<'rent' | 'buy'>('rent');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    orderCode: string;
    amount: number;
    checkoutUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const unitPrice = purchaseType === 'rent' ? 99000 : 1500000;
  const totalAmount = quantity * unitPrice;

  const handleCreateCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/payment/create-checkout', {
        licenseQuantity: quantity,
        purchaseType,
      });

      setCheckoutData({
        orderCode: res.orderCode,
        amount: res.amount,
        checkoutUrl: res.checkoutUrl,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Khởi tạo đơn hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCheckoutData(null);
    setError(null);
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <span style={styles.badge}>💳 PayOS VietQR</span>
            <h3 style={styles.title}>Nạp Hạn Mức Màn Hình</h3>
          </div>
          <button style={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>

        {!checkoutData ? (
          <div style={styles.body}>
            <p style={styles.desc}>
              Chọn hình thức sở hữu và số lượng thiết bị bạn muốn mở rộng hệ thống Signage.
            </p>

            {/* Switch Plan Type */}
            <div style={styles.planSelector}>
              <button
                type="button"
                style={{
                  ...styles.planOption,
                  ...(purchaseType === 'rent' ? styles.planOptionActive : {}),
                }}
                onClick={() => setPurchaseType('rent')}
              >
                <div style={styles.planName}>Gói Thuê Bao (Rent)</div>
                <div style={styles.planPrice}>99.000đ / tháng / slot</div>
              </button>
              <button
                type="button"
                style={{
                  ...styles.planOption,
                  ...(purchaseType === 'buy' ? styles.planOptionActive : {}),
                }}
                onClick={() => setPurchaseType('buy')}
              >
                <div style={styles.planName}>Gói Mua Đứt (Buy)</div>
                <div style={styles.planPrice}>1.500.000đ / vĩnh viễn</div>
              </button>
            </div>

            {/* Quantity Slider */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Số lượng màn hình: <strong style={{ color: 'var(--accent)' }}>{quantity} slot</strong>
              </label>
              <input
                type="range"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={styles.rangeInput}
              />
              <div style={styles.quickSelects}>
                {[1, 5, 10, 20, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    style={{
                      ...styles.quickChip,
                      ...(quantity === num ? styles.quickChipActive : {}),
                    }}
                    onClick={() => setQuantity(num)}
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Price Summary */}
            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>Đơn giá:</span>
                <span>{unitPrice.toLocaleString('vi-VN')} đ</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Số lượng:</span>
                <span>{quantity} thiết bị</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.totalRow}>
                <span>Tổng tiền thanh toán:</span>
                <span style={styles.totalPrice}>{totalAmount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <button
              style={styles.submitBtn}
              onClick={handleCreateCheckout}
              disabled={loading}
            >
              {loading ? 'Đang tạo liên kết VietQR...' : '⚡ Thanh Toán Ngay Với PayOS'}
            </button>
          </div>
        ) : (
          /* Payment Link QR State */
          <div style={styles.body}>
            <div style={styles.qrSuccessBox}>
              <div style={styles.orderBadge}>Đơn hàng #{checkoutData.orderCode}</div>
              <p style={styles.qrDesc}>
                Quét mã VietQR dưới đây bằng ứng dụng Ngân hàng để thanh toán tức thì.
              </p>
              
              <div style={styles.amountBox}>
                <span>Số tiền:</span>
                <strong style={styles.amountHighlight}>
                  {checkoutData.amount.toLocaleString('vi-VN')} VNĐ
                </strong>
              </div>

              {/* VietQR Dynamic Iframe or Link */}
              <div style={styles.actionGroup}>
                <a
                  href={checkoutData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.payLinkBtn}
                >
                  🔗 Mở Trang Thanh Toán PayOS (VietQR)
                </a>
              </div>

              <div style={styles.noteBox}>
                💡 <em>Hệ thống sẽ tự động cộng slot màn hình vào tài khoản ngay khi Ngân hàng báo có (từ 1 - 5 giây).</em>
              </div>
            </div>

            <button style={styles.doneBtn} onClick={handleClose}>
              Đã Hoàn Tất / Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: 'var(--surface, #1a1a1e)',
    border: '1px solid var(--border-color, #2c2c30)',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    color: 'var(--ink, #f5f5f7)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color, #2c2c30)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#0d9488',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--ink-secondary)',
    fontSize: '18px',
    cursor: 'pointer',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  desc: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--ink-secondary)',
    lineHeight: '1.5',
  },
  planSelector: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  planOption: {
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid var(--border-color, #2c2c30)',
    backgroundColor: 'var(--surface-elevated, #242429)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  planOptionActive: {
    borderColor: '#0d9488',
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    boxShadow: '0 0 0 1px #0d9488',
  },
  planName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--ink)',
  },
  planPrice: {
    fontSize: '12px',
    color: 'var(--ink-secondary)',
    marginTop: '4px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
  },
  rangeInput: {
    width: '100%',
    accentColor: '#0d9488',
    cursor: 'pointer',
  },
  quickSelects: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  quickChip: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'var(--surface-elevated)',
    color: 'var(--ink)',
    fontSize: '12px',
    cursor: 'pointer',
  },
  quickChipActive: {
    borderColor: '#0d9488',
    color: '#0d9488',
  },
  summaryBox: {
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'var(--surface-elevated, #242429)',
    border: '1px solid var(--border-color)',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--ink-secondary)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '4px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 600,
    fontSize: '15px',
  },
  totalPrice: {
    color: '#0d9488',
    fontSize: '18px',
    fontWeight: 700,
  },
  errorBox: {
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontSize: '13px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#0d9488',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
    transition: 'all 0.2s ease',
  },
  qrSuccessBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center',
  },
  orderBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    color: '#0d9488',
    fontSize: '13px',
    fontWeight: 600,
  },
  qrDesc: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--ink-secondary)',
  },
  amountBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
  },
  amountHighlight: {
    color: '#0d9488',
    fontSize: '20px',
  },
  actionGroup: {
    width: '100%',
    marginTop: '8px',
  },
  payLinkBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: '#0d9488',
    color: '#ffffff',
    textAlign: 'center',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
  },
  noteBox: {
    fontSize: '12px',
    color: 'var(--ink-muted)',
    lineHeight: '1.4',
  },
  doneBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'none',
    color: 'var(--ink)',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
