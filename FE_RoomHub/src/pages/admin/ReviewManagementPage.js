import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/admin/AdminLayout";
import { getReviews } from "../../api/review";

export default function ReviewManagementPage() {
  const [reviews, setReviews] = useState([]);

useEffect(() => {
  console.log("TOKEN:", localStorage.getItem("token"));

  getReviews()
    .then((res) => {
      console.log("REVIEWS DATA:", res);

      if (res?.success && Array.isArray(res.data)) {
        setReviews(res.data);
      } else {
        setReviews([]);
      }
    })
    .catch((err) => {
      console.error("Get reviews failed:", err);
      setReviews([]);
    });
}, []);

  return (
    <AdminLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
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

        <button
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
            {reviews.length > 0 ? (
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
                      <div

                      >

                      </div>
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
                      ? new Date(review.createdAt).toLocaleDateString("en-GB")
                      : "N/A"}
                  </td>

                  <td style={tdStyle}>
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