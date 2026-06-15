import React, { useState } from 'react';
import { createReportAPI } from '../api/reportAPI.js';

const ReportModal = ({ isOpen, onClose, targetId, reportType }) => {
  const [formData, setFormData] = useState({
    reason: '',
    details: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Inappropriate content',
    'Misleading information',
    'Spam',
    'Offensive language',
    'Other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason || !formData.details) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await createReportAPI({
        reportType,
        targetId,
        reason: formData.reason,
        details: formData.details,
      });
      alert('Report submitted successfully. Thank you!');
      setFormData({ reason: '', details: '' });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit report');
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
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    background: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
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
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    minHeight: 120,
    boxSizing: 'border-box',
    resize: 'vertical',
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
  };

  const submitBtnStyle = {
    ...buttonStyle,
    background: '#3b82f6',
    color: 'white',
    marginRight: 8,
  };

  const cancelBtnStyle = {
    ...buttonStyle,
    background: '#e5e7eb',
    color: '#374151',
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 4,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px 0', color: '#27364a', fontSize: 18 }}>
          Report {reportType === 'review' ? 'Review' : 'Room'}
        </h3>

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

          {error && <div style={errorStyle}>{error}</div>}

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
