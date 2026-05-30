// src/api/review.js
const API_URL = "http://localhost:3000";

const getToken = () => localStorage.getItem("token");

export const getReviews = async () => {
  const res = await fetch(`${API_URL}/dashboard/reviews`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
};

export const getReviewDetail = async (reviewId) => {
  const res = await fetch(`${API_URL}/dashboard/reviews/${reviewId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
};