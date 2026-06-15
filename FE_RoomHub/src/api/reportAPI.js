import axios from 'axios';

const API_URL = 'http://localhost:3000';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// User APIs
export const createReportAPI = async (data) => {
  const res = await axios.post(`${API_URL}/reports`, data, {
    ...authHeader(),
  });
  return res.data;
};

// Admin APIs
export const getReportsAPI = async () => {
  const res = await axios.get(`${API_URL}/dashboard/reports`, {
    ...authHeader(),
  });
  return res.data;
};

export const getReportDetailAPI = async (reportId) => {
  const res = await axios.get(`${API_URL}/dashboard/reports/${reportId}`, {
    ...authHeader(),
  });
  return res.data;
};

export const sendReportReplyByEmailAPI = async (reportId, data) => {
  const res = await axios.put(
    `${API_URL}/dashboard/reports/${reportId}/send-email`,
    data,
    {
      ...authHeader(),
    }
  );
  return res.data;
};

export const deleteReportAPI = async (reportId) => {
  const res = await axios.delete(`${API_URL}/dashboard/reports/${reportId}`, {
    ...authHeader(),
  });
  return res.data;
};
