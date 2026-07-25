import React, { useState, useCallback, useEffect } from 'react';
import AdminLayout from '../layout/admin/AdminLayout.js';
import { getReportsAPI, sendReportReplyByEmailAPI, deleteReportAPI } from '../../api/reportAPI.js';

const ReportManagementPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [replyData, setReplyData] = useState({ status: 'pending', detailReport: '' });
  const [sending, setSending] = useState(false);

  const fetchReports = useCallback(() => {
    setLoading(true);
    getReportsAPI()
      .then((res) => setReports(res?.data || []))
      .catch((err) => {
        console.error('Error fetching reports:', err);
        alert('Failed to load reports');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSendReply = async () => {
    if (!selectedReport || !replyData.detailReport) {
      alert('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await sendReportReplyByEmailAPI(selectedReport._id, replyData);
      alert('Email sent successfully!');
      setSelectedReport(null);
      setReplyData({ status: 'pending', detailReport: '' });
      fetchReports();
    } catch (err) {
      console.error('Error sending reply:', err);
      alert(err?.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReportAPI(reportId);
      alert('Report deleted successfully');
      fetchReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Failed to delete report');
    }
  };

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#27364a',
    fontSize: 13,
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  };

  const tdStyle = {
    padding: '12px 16px',
    fontSize: 14,
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
  };

  const statusBadgeStyle = (status) => {
    const statusColors = {
      pending: { bg: '#fef3c7', color: '#b45309' },
      processing: { bg: '#dbeafe', color: '#0369a1' },
      resolved: { bg: '#dcfce7', color: '#166534' },
      rejected: { bg: '#fee2e2', color: '#991b1b' },
    };
    const colors = statusColors[status] || { bg: '#f3f4f6', color: '#6b7280' };
    return {
      background: colors.bg,
      color: colors.color,
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      display: 'inline-block',
    };
  };

  const btnStyle = {
    padding: '8px 16px',
    marginRight: 8,
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    background: '#3b82f6',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  };

  const deleteBtnStyle = {
    ...btnStyle,
    background: '#ef4444',
    border: 'none',
  };

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
    maxWidth: 600,
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 8,
    fontWeight: 600,
    color: '#27364a',
    fontSize: 14,
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    marginBottom: 16,
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
    marginBottom: 16,
    resize: 'vertical',
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, color: '#27364a', margin: 0 }}>Report Management</h2>
      </div>

      <div style={{ background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              {['No.', 'Reporter', 'Reason', 'Type', 'Status', 'Submitted', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '24px' }}>No reports found</td></tr>
            ) : (
              reports.map((report, i) => (
                <tr key={report._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>{report.reporter?.fullname || 'N/A'}</td>
                  <td style={tdStyle}>{report.reason || 'N/A'}</td>
                  <td style={tdStyle}>{formatReportType(report.reportType)}</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(report.status)}>{report.status}</span>
                  </td>
                  <td style={tdStyle}>{new Date(report.createdAt).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <button onClick={() => setSelectedReport(report)} style={btnStyle}>
                      Details
                    </button>
                    <button onClick={() => handleDeleteReport(report._id)} style={deleteBtnStyle}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div style={overlayStyle} onClick={() => setSelectedReport(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', color: '#27364a', fontSize: 18 }}>
              Report Details - #{selectedReport._id}
            </h3>

            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 20 }}>
              <p style={{ margin: '8px 0', color: '#374151', fontSize: 13 }}>
                <strong>Reporter:</strong> {selectedReport.reporter?.fullname || 'N/A'}
              </p>
              <p style={{ margin: '8px 0', color: '#374151', fontSize: 13 }}>
                <strong>Email:</strong> {selectedReport.reporter?.email || 'N/A'}
              </p>
              <p style={{ margin: '8px 0', color: '#374151', fontSize: 13 }}>
                <strong>Reason:</strong> {selectedReport.reason}
              </p>
              <p style={{ margin: '8px 0', color: '#374151', fontSize: 13 }}>
                <strong>Type:</strong> {formatReportType(selectedReport.reportType)}
              </p>
              <p style={{ margin: '8px 0', color: '#374151', fontSize: 13 }}>
                <strong>Status:</strong> <span style={statusBadgeStyle(selectedReport.status)}>{selectedReport.status}</span>
              </p>
              <p style={{ margin: '8px 0', color: '#374151', fontSize: 13 }}>
                <strong>Submitted:</strong> {new Date(selectedReport.createdAt).toLocaleString()}
              </p>
            </div>

            <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#166534', fontSize: 13 }}>Report Details:</p>
              <p style={{ margin: 0, color: '#374151', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                {selectedReport.details}
              </p>
            </div>

            <h4 style={{ margin: '20px 0 16px 0', color: '#27364a', fontSize: 16 }}>Send Reply Email</h4>

            <div>
              <label style={labelStyle}>Status *</label>
              <select
                value={replyData.status}
                onChange={(e) => setReplyData({ ...replyData, status: e.target.value })}
                style={inputStyle}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>

              <label style={labelStyle}>Reply Message *</label>
              <textarea
                placeholder="Enter your response to the user..."
                value={replyData.detailReport}
                onChange={(e) => setReplyData({ ...replyData, detailReport: e.target.value })}
                style={textareaStyle}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => setSelectedReport(null)}
                  style={{ ...inputStyle, padding: '10px 20px', background: '#e5e7eb', color: '#374151', width: 'auto', cursor: 'pointer', border: 'none', borderRadius: 6, marginBottom: 0 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sending}
                  style={{ ...inputStyle, padding: '10px 20px', background: '#3b82f6', color: 'white', width: 'auto', cursor: 'pointer', border: 'none', borderRadius: 6, marginBottom: 0, fontWeight: 600 }}
                >
                  {sending ? 'Sending...' : 'Send Email & Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ReportManagementPage;

const formatReportType = (type) => {
  if (type === 'review') return 'Review';
  if (type === 'boardingHouse') return 'Boarding House';
  if (type === 'room') return 'Room';
  return 'N/A';
};
