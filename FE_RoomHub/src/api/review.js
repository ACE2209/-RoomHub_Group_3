// src/api/review.js

const API_URL = "http://localhost:3000";

const getToken = () => localStorage.getItem("token");

// Get all reviews
export const getReviews = async () => {
  const res = await fetch(`${API_URL}/dashboard/reviews`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
};

// Get review detail
export const getReviewDetail = async (reviewId) => {
  const res = await fetch(
    `${API_URL}/dashboard/reviews/${reviewId}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return res.json();
};

// Filter reviews
export const filterReviews = async ({
  ratings,
  startDate,
  endDate,
  page,
  limit,
}) => {
  const params = new URLSearchParams();

  if (ratings) {
    if (Array.isArray(ratings)) {
      ratings.forEach((rating) =>
        params.append("ratings", rating)
      );
    } else {
      params.append("ratings", ratings);
    }
  }

  if (startDate) {
    params.append("startDate", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
  }

  if (page) {
    params.append("page", page);
  }

  if (limit) {
    params.append("limit", limit);
  }

  const res = await fetch(
    `${API_URL}/dashboard/reviews/filter?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return res.json();
};

// Delete review
export const deleteReview = async (reviewId) => {
  const res = await fetch(
    `${API_URL}/dashboard/reviews/${reviewId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return res.json();
};