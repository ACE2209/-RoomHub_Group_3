import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../layout/admin/AdminLayout";
import { getReviewDetail } from "../../api/review";

export default function ReviewDetailPage() {
  const { reviewId } = useParams();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getReviewDetail(reviewId).then((data) => {
      console.log("REVIEW DETAIL:", data);
      setDetail(data?.data || null);
    });
  }, [reviewId]);

  if (!detail) {
    return (
      <AdminLayout>
        <div style={cardStyle}>Loading review detail...</div>
      </AdminLayout>
    );
  }

  const { review, replies } = detail;

  return (
    <AdminLayout>
      <div style={topStyle}>
        <div>
          <h2 style={titleStyle}>Review Detail</h2>
          <p style={subTitleStyle}>View review content and replies</p>
        </div>

        <Link to="/admin/reviews" style={backBtnStyle}>
          ← Back
        </Link>
      </div>

      <div style={cardStyle}>
        <div style={userBoxStyle}>
          {review.accountId?.avatarImage?.url ? (
            <img
              src={review.accountId.avatarImage.url}
              alt="avatar"
              style={avatarStyle}
            />
          ) : (
            <div style={avatarFallbackStyle}>👤</div>
          )}

          <div>
            <h3 style={{ margin: 0 }}>
              {review.accountId?.fullname || review.accountId?.username || "N/A"}
            </h3>
            <p style={{ margin: 0, color: "#667085" }}>
              {review.accountId?.username || "Unknown user"}
            </p>
          </div>
        </div>

        <div style={infoGridStyle}>
          <div style={infoItemStyle}>
            <span style={labelStyle}>Rating</span>
            <b>⭐ {review.rating || "N/A"}</b>
          </div>

          <div style={infoItemStyle}>
            <span style={labelStyle}>Created At</span>
            <b>
              {review.createdAt
                ? new Date(review.createdAt).toLocaleString()
                : "N/A"}
            </b>
          </div>

          <div style={infoItemStyle}>
            <span style={labelStyle}>Boarding House</span>
            <b>{review.boardingHouseId?.name || "N/A"}</b>
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Review Content</h3>
          <p style={contentStyle}>{review.content || "N/A"}</p>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Replies</h3>

          {replies?.length > 0 ? (
            replies.map((reply) => (
              <div style={replyBoxStyle} key={reply._id}>
                <b>
                  {reply.accountId?.fullname ||
                    reply.accountId?.username ||
                    "N/A"}
                </b>
                <p style={{ margin: "8px 0 0" }}>{reply.content}</p>
              </div>
            ))
          ) : (
            <p style={{ color: "#667085" }}>No replies</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

const topStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "28px",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#27364a",
  margin: 0,
};

const subTitleStyle = {
  color: "#667085",
  marginTop: "6px",
};

const backBtnStyle = {
  background: "#2f80ed",
  color: "white",
  padding: "10px 18px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "600",
};

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "28px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

const userBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  paddingBottom: "22px",
  borderBottom: "1px solid #eef0f3",
};

const avatarStyle = {
  width: "58px",
  height: "58px",
  borderRadius: "50%",
  objectFit: "cover",
};

const avatarFallbackStyle = {
  width: "58px",
  height: "58px",
  borderRadius: "50%",
  background: "#34d399",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "18px",
  marginTop: "24px",
};

const infoItemStyle = {
  background: "#f8fafc",
  borderRadius: "10px",
  padding: "16px",
};

const labelStyle = {
  display: "block",
  color: "#667085",
  fontSize: "14px",
  marginBottom: "6px",
};

const sectionStyle = {
  marginTop: "28px",
};

const sectionTitleStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#27364a",
};

const contentStyle = {
  background: "#f8fafc",
  padding: "18px",
  borderRadius: "10px",
  color: "#344054",
  lineHeight: "1.6",
};

const replyBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #eef0f3",
  borderRadius: "10px",
  padding: "16px",
  marginBottom: "12px",
};