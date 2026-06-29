import API_URL, { authHeaders, parseJsonResponse } from "./config";

const getRolePrefix = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || localStorage.getItem("role");

  if (role === "owner") return "/owner";
  if (role === "staff") return "/staff";

  return "/owner";
};

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

// Xem review của boarding house
export const getBoardingHouseReviews = async (
  boardingHouseId,
  page = 1,
  limit = 10
) => {
  const res = await fetch(
    `${API_URL}/boardinghouse/reviews/${boardingHouseId}?page=${page}&limit=${limit}`
  );

  return parseJsonResponse(res);
};

export const getManagedBoardingHouseReviews = async (
  boardingHouseId,
  page = 1,
  limit = 10
) => {
  const res = await fetch(
    `${API_URL}${getRolePrefix()}/boardinghouse/reviews/${boardingHouseId}?page=${page}&limit=${limit}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const getManagedReviews = async ({ page = 1, limit = 10 } = {}) => {
  const res = await fetch(
    `${API_URL}${getRolePrefix()}/reviews?page=${page}&limit=${limit}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const replyManagedReview = async ({ parentId, content }) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/reviews/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ parentId, content }),
  });

  return parseJsonResponse(res);
};

export const updateManagedReviewReply = async (replyId, { content }) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/reviews/reply/${replyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ content }),
  });

  return parseJsonResponse(res);
};

export const deleteManagedReviewReply = async (replyId) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/reviews/reply/${replyId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

// Thêm review
export const addReview = async (data) => {
  const res = await fetch(
    `${API_URL}/auth/reviews`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        boardingHouseId: data.boardingHouseId,
        rating: data.rating,
        content: data.content,
      }),
    }
  );

  return parseJsonResponse(res);
};

// Update review
export const updateReview = async (
  reviewId,
  data
) => {
  const formData = new FormData();

  formData.append("content", data.content);
  formData.append("rating", data.rating);

  if (data.images?.length) {
    data.images.forEach((file) => {
      formData.append("images", file);
    });
  }

  const res = await fetch(
    `${API_URL}/auth/reviews/${reviewId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem(
          "token"
        )}`,
      },
      body: formData,
    }
  );

  return parseJsonResponse(res);
};
