import API_URL, { authHeaders, parseJsonResponse } from "./config";

// ==========================
// 1. GET ALL REPORTS
// ==========================
export const getReports = async () => {
  const res = await fetch(`${API_URL}/dashboard/review-reports`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getBoardingHouseReports = async () => {
  const res = await fetch(`${API_URL}/dashboard/boarding-house-reports`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const filterBoardingHouseReports = async (params = {}) => {
  const query = new URLSearchParams(params).toString();

  const res = await fetch(
    `${API_URL}/dashboard/boarding-house-reports/filter?${query}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// ==========================
// 2. GET REPORT DETAIL
// ==========================
export const getReportDetail = async (reportId) => {
  const res = await fetch(
    `${API_URL}/dashboard/reportReview/${reportId}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// ==========================
// 3. DELETE REPORT
// ==========================
export const deleteReport = async (reportId) => {
  const res = await fetch(
    `${API_URL}/dashboard/reports/${reportId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// Filter multiple report reviews
export const filterReports = async (params = {}) => {
  const query = new URLSearchParams(params).toString();

  const res = await fetch(
    `${API_URL}/dashboard/review-reports/filter?${query}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};
