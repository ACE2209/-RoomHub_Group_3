// src/api/review.js

import API_URL, { authHeaders, parseJsonResponse } from "./config";

// Get all reviews
export const getReviews = async () => {
  const res = await fetch(`${API_URL}/dashboard/reviews`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

// Get review detail
export const getReviewDetail = async (reviewId) => {
  const res = await fetch(
    `${API_URL}/dashboard/reviews/${reviewId}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
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
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// Delete review
export const deleteReview = async (reviewId) => {
  const res = await fetch(
    `${API_URL}/dashboard/reviews/${reviewId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};
