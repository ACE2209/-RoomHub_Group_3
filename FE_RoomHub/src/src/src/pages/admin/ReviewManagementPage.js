import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/admin/AdminLayout";

import {
  getReviews,
  filterReviews,
  deleteReview,
} from "../../api/review";

export default function ReviewManagementPage() {
  const [reviews, setReviews] = useState([]);
  const [ratingFilter, setRatingFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getReviews()
      .then((res) => {
        console.log("REVIEWS DATA:", res);

        if (res?.success && Array.isArray(res.data)) {
          setReviews(res.data);
          setError("");
        } else {
          setReviews([]);
          setError(res?.message || res?.error || "Unable to load reviews");
        }
      })
      .catch((err) => {
        console.error("Get reviews failed:", err);
        setReviews([]);
        setError(err.message || "Unable to load reviews");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFilter = async () => {
    try {
      if (!ratingFilter) {
        const res = await getReviews();

        if (res?.success && Array.isArray(res.data)) {
          setReviews(res.data);
          setError("");
        }

        return;
      }

      const res = await filterReviews({
        ratings: ratingFilter,
      });

      console.log("FILTER RESULT:", res);

      if (res?.success && Array.isArray(res.data)) {
        setReviews(res.data);
        setError("");
      } else {
        setReviews([]);
        setError(res?.message || res?.error || "Filter failed");
      }
    } catch (error) {
      console.error("Filter failed:", error);
      setReviews([]);
      setError(error.message || "Filter failed");
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmDelete) return;

    try {
      const res = await deleteReview(reviewId);

      if (res?.success) {
        alert("Review deleted successfully");

        setReviews((prev) =>
          prev.filter((item) => item._id !== reviewId)
        );
      } else {
        alert(res?.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };

  return (
    <AdminLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            fontWeight: "700",
            color: "#27364a",
          }}
        >
          Review Management
        </h2>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(e.target.value)
            }
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d0d5dd",
            }}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <button
            onClick={handleFilter}
            style={{
              background: "#12b76a",
              color: "white",
              border: "none",
              padding: "10px 24px",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Filter
          </button>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <th style={thStyle}>No.</th>
              <th style={thStyle}>Avatar</th>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Content</th>
              <th style={thStyle}>Rating</th>
              <th style={thStyle}>Created At</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#667085",
                  }}
                >
                  Loading reviews...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#d92d20",
                  }}
                >
                  {error}
                </td>
              </tr>
            ) : reviews.length > 0 ? (
              reviews.map((review, index) => (
                <tr
                  key={review._id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <td style={tdStyle}>{index + 1}</td>

                  <td style={tdStyle}>
                    {review.accountId?.avatarImage?.url ? (
                      <img
                        src={review.accountId.avatarImage.url}
                        alt=""
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div>N/A</div>
                    )}
                  </td>

                  <td style={tdStyle}>
                    {review.accountId?.fullname ||
                      review.accountId?.username ||
                      "N/A"}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      maxWidth: "350px",
                    }}
                  >
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {review.content || "N/A"}
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        background: "#fff7e6",
                        color: "#b54708",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontWeight: "600",
                      }}
                    >
                      ⭐ {review.rating || "N/A"}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString(
                          "en-GB"
                        )
                      : "N/A"}
                  </td>

                  <td style={tdStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      <Link
                        to={`/admin/reviews/${review._id}`}
                        style={{
                          background: "#2f80ed",
                          color: "white",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          textDecoration: "none",
                        }}
                      >
                        View Detail
                      </Link>

                      <button
                        onClick={() =>
                          handleDelete(review._id)
                        }
                        style={{
                          background: "#d92d20",
                          color: "white",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#667085",
                  }}
                >
                  No review data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const thStyle = {
  padding: "18px",
  textAlign: "left",
  color: "#344054",
  fontWeight: "700",
};

const tdStyle = {
  padding: "18px",
  color: "#344054",
};
