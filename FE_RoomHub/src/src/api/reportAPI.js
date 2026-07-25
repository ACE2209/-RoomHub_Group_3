import axios from 'axios';
import API_URL, { authHeaders, parseJsonResponse } from './config';

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

export const createReport = async (data) => {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_URL}/auth/reports`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: isFormData ? data : JSON.stringify(data),
  });

  return parseJsonResponse(res);
};

export const getMyReports = async ({ page = 1, limit = 10 } = {}) => {
  const query = new URLSearchParams({ page, limit }).toString();
  const res = await fetch(`${API_URL}/auth/reports?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getMyReportDetail = async (reportId) => {
  const res = await fetch(`${API_URL}/auth/reports/${reportId}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const checkReportExist = async ({ reviewIds = [], boardingHouseId }) => {
  const query = new URLSearchParams();

  if (reviewIds.length) {
    query.set('reviewIds', reviewIds.join(','));
  }

  if (boardingHouseId) {
    query.set('boardingHouseId', boardingHouseId);
  }

  const res = await fetch(`${API_URL}/auth/reports/exist?${query.toString()}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};
