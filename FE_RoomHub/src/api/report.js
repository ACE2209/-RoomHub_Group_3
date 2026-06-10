const API_URL = "http://localhost:3000";

const getToken = () => localStorage.getItem("token");

// ==========================
// 1. GET ALL REPORTS
// ==========================
export const getReports = async () => {
  const res = await fetch(`${API_URL}/dashboard/review-reports`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
};

// ==========================
// 2. GET REPORT DETAIL
// ==========================
export const getReportDetail = async (reportId) => {
  const res = await fetch(
    `${API_URL}/dashboard/reportReview/${reportId}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return res.json();
};

// ==========================
// 3. DELETE REPORT
// ==========================
export const deleteReport = async (reportId) => {
  const res = await fetch(
    `${API_URL}/dashboard/reports/${reportId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return res.json();
};
