import React, { useEffect, useState } from 'react';
import { createReport, checkReportExist } from '../api/reportAPI.js';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, targetId, reportType, onSubmitted }) => {
  const [formData, setFormData] = useState({
    reason: '',
    details: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAlreadyReported, setIsAlreadyReported] = useState(false);

  const reasons = [
    'Inappropriate content',
    'Misleading information',
    'Spam',
    'Privacy violation',
    'Offensive language',
    'Other',
  ];

  useEffect(() => {
    if (!isOpen || !targetId) return;

    const runCheck = async () => {
      try {
        const res = await checkReportExist({
          reviewIds: reportType === 'review' ? [targetId] : [],
          boardingHouseId: reportType === 'boardingHouse' ? targetId : undefined,
        });

        const alreadyReported = reportType === 'review'
          ? (res?.reportedReviews || []).map(String).includes(String(targetId))
          : Boolean(res?.reportedBoardingHouse);

        setIsAlreadyReported(alreadyReported);
        if (alreadyReported) {
          setError(res?.message || 'You already reported this item.');
        } else {
          setError('');
        }
      } catch (err) {
        setIsAlreadyReported(false);
        setError('');
      }
    };

    runCheck();
  }, [isOpen, targetId, reportType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason || !formData.details) {
      setError('Please fill in all fields');
      return;
    }

    if (isAlreadyReported) {
      setError('You already reported this item. Please wait for admin review.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await createReport({
        reportType,
        targetId,
        reason: formData.reason,
        details: formData.details,
      });

      const message = res?.message || 'Report submitted successfully. Thank you!';
      setSuccessMessage(message);
      setFormData({ reason: '', details: '' });
      setIsAlreadyReported(true);
      onSubmitted?.({ targetId, reportType, message });
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      const message = err?.message || 'Failed to submit report';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  };

  const modalStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    border: '1px solid #f3f4f6',
  };

  const formGroupStyle = {
    marginBottom: 16,
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 8,
    fontWeight: 600,
    color: '#27364a',
    fontSize: 14,
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: 'white',
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    minHeight: 120,
    boxSizing: 'border-box',
    resize: 'vertical',
    background: 'white',
  };

  const buttonStyle = {
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
  };

  const submitBtnStyle = {
    ...buttonStyle,
    background: '#ff6b00',
    color: 'white',
    marginRight: 8,
  };

  const cancelBtnStyle = {
    ...buttonStyle,
    background: '#f3f4f6',
    color: '#374151',
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const successStyle = {
    color: '#067647',
    fontSize: 13,
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ margin: 0, color: '#27364a', fontSize: 18 }}>
              Report {reportType === 'review' ? 'Review' : 'Boarding House'}
            </h3>
            <p style={{ margin: '4px 0 0', color: '#667085', fontSize: 13 }}>
              Help us review inappropriate content safely.
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#667085' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Reason *</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              style={selectStyle}
            >
              <option value="">Select a reason</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Details *</label>
            <textarea
              placeholder="Provide detailed information about your report..."
              value={formData.details}
              onChange={(e) =>
                setFormData({ ...formData, details: e.target.value })
              }
              style={textareaStyle}
            />
          </div>

          {error && <div style={errorStyle}><AlertTriangle size={14} />{error}</div>}
          {successMessage && <div style={successStyle}><CheckCircle2 size={14} />{successMessage}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle} disabled={loading}>
              Cancel
            </button>
            <button type="submit" style={submitBtnStyle} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
