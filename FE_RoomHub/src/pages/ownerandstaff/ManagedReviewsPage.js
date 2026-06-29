import { useCallback, useEffect, useState } from "react";
import { Edit3, MessageSquare, Save, Send, Star, Trash2 } from "lucide-react";
import AdminLayout from "../layout/admin/AdminLayout";
import {
  deleteManagedReviewReply,
  getManagedReviews,
  replyManagedReview,
  updateManagedReviewReply,
} from "../../api/review";

export default function ManagedReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editingReplyId, setEditingReplyId] = useState("");
  const [editReplyContent, setEditReplyContent] = useState("");
  const [savingReplyId, setSavingReplyId] = useState("");

  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getManagedReviews({ page, limit: pagination.limit });
      setReviews(res?.data || []);
      setPagination((prev) => ({
        ...prev,
        ...(res?.pagination || {}),
      }));
      setError("");
    } catch (err) {
      setReviews([]);
      setError(err.message || "Unable to load reviews");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleReplySubmit = async (reviewId) => {
    const content = replyDrafts[reviewId]?.trim();
    if (!content) return;

    try {
      setSavingReplyId(reviewId);
      await replyManagedReview({ parentId: reviewId, content });
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      fetchReviews(pagination.currentPage || 1);
    } catch (err) {
      alert(err.message || "Reply failed");
    } finally {
      setSavingReplyId("");
    }
  };

  const handleReplyUpdate = async (replyId) => {
    const content = editReplyContent.trim();
    if (!content) return;

    try {
      setSavingReplyId(replyId);
      await updateManagedReviewReply(replyId, { content });
      setEditingReplyId("");
      setEditReplyContent("");
      fetchReviews(pagination.currentPage || 1);
    } catch (err) {
      alert(err.message || "Update reply failed");
    } finally {
      setSavingReplyId("");
    }
  };

  const handleReplyDelete = async (replyId) => {
    if (!window.confirm("Delete this reply?")) return;

    try {
      setSavingReplyId(replyId);
      await deleteManagedReviewReply(replyId);
      fetchReviews(pagination.currentPage || 1);
    } catch (err) {
      alert(err.message || "Delete reply failed");
    } finally {
      setSavingReplyId("");
    }
  };

  return (
    <AdminLayout>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Review Management</h2>
          <p style={subtitleStyle}>View and reply to reviews for boarding houses you manage.</p>
        </div>
        <div style={summaryItemStyle}>
          <MessageSquare size={18} />
          <span>{pagination.totalItems || 0} reviews</span>
        </div>
      </div>

      <div style={listCardStyle}>
        {loading ? (
          <div style={emptyStyle}>Loading reviews...</div>
        ) : error ? (
          <div style={errorStyle}>{error}</div>
        ) : reviews.length ? (
          <div style={reviewListStyle}>
            {reviews.map((review) => (
              <article key={review._id} style={reviewCardStyle}>
                <div style={reviewTopStyle}>
                  <div>
                    <strong style={houseNameStyle}>{review.boardingHouseId?.name || "Unknown boarding house"}</strong>
                    <span style={reviewerStyle}>{review.accountId?.fullname || review.accountId?.username || "Guest"}</span>
                  </div>
                  <span style={dateStyle}>{formatDate(review.createdAt)}</span>
                </div>

                <div style={starRowStyle}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={15}
                      fill={index < Number(review.rating || 0) ? "#f59e0b" : "none"}
                      color={index < Number(review.rating || 0) ? "#f59e0b" : "#d0d5dd"}
                    />
                  ))}
                </div>

                <p style={reviewContentStyle}>{review.content || "No content"}</p>

                {review.replyContent ? (
                  <div style={replyBoxStyle}>
                    <div style={replyTitleStyle}>
                      <span>Management reply</span>
                      <div style={replyActionStyle}>
                        <button
                          type="button"
                          title="Edit reply"
                          style={smallIconBtnStyle}
                          onClick={() => {
                            setEditingReplyId(review.replyContent._id);
                            setEditReplyContent(review.replyContent.content || "");
                          }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          title="Delete reply"
                          style={smallDeleteBtnStyle}
                          disabled={savingReplyId === review.replyContent._id}
                          onClick={() => handleReplyDelete(review.replyContent._id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {editingReplyId === review.replyContent._id ? (
                      <div style={replyEditorStyle}>
                        <textarea
                          value={editReplyContent}
                          onChange={(event) => setEditReplyContent(event.target.value)}
                          rows={3}
                          style={textareaStyle}
                        />
                        <div style={replyButtonsStyle}>
                          <button type="button" style={secondaryBtnStyle} onClick={() => setEditingReplyId("")}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            style={primaryBtnStyle}
                            disabled={savingReplyId === review.replyContent._id}
                            onClick={() => handleReplyUpdate(review.replyContent._id)}
                          >
                            <Save size={16} />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={replyContentStyle}>{review.replyContent.content}</p>
                    )}
                  </div>
                ) : (
                  <div style={replyEditorStyle}>
                    <textarea
                      value={replyDrafts[review._id] || ""}
                      onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [review._id]: event.target.value }))}
                      rows={3}
                      placeholder="Write a reply..."
                      style={textareaStyle}
                    />
                    <div style={replyButtonsStyle}>
                      <button
                        type="button"
                        style={primaryBtnStyle}
                        disabled={savingReplyId === review._id}
                        onClick={() => handleReplySubmit(review._id)}
                      >
                        <Send size={16} />
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div style={emptyStyle}>No reviews found</div>
        )}

        <div style={paginationStyle}>
          <span style={subtitleStyle}>Showing {reviews.length} of {pagination.totalItems || 0}</span>
          <div style={pageButtonWrapStyle}>
            <button
              style={pageBtnStyle(!pagination.hasPrevPage || loading)}
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => fetchReviews((pagination.currentPage || 1) - 1)}
            >
              Previous
            </button>
            <span style={pageTextStyle}>{pagination.currentPage || 1}/{pagination.totalPages || 1}</span>
            <button
              style={pageBtnStyle(!pagination.hasNextPage || loading)}
              disabled={!pagination.hasNextPage || loading}
              onClick={() => fetchReviews((pagination.currentPage || 1) + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const formatDate = (value) => value ? new Date(value).toLocaleString("en-GB") : "N/A";

const headerStyle = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" };
const titleStyle = { margin: 0, color: "#27364a", fontWeight: 700 };
const subtitleStyle = { color: "#667085", fontSize: 13 };
const summaryItemStyle = { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", color: "#344054", fontWeight: 600 };
const listCardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" };
const reviewListStyle = { display: "grid", gap: 14, padding: 16 };
const reviewCardStyle = { border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" };
const reviewTopStyle = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" };
const houseNameStyle = { color: "#27364a", display: "block", marginBottom: 5 };
const reviewerStyle = { color: "#667085", fontSize: 13 };
const dateStyle = { color: "#667085", fontSize: 12, whiteSpace: "nowrap" };
const starRowStyle = { display: "flex", gap: 2, marginTop: 10 };
const reviewContentStyle = { margin: "12px 0 0", color: "#344054", lineHeight: 1.6 };
const replyBoxStyle = { marginTop: 14, padding: 14, borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff" };
const replyTitleStyle = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", color: "#1d4ed8", fontWeight: 700, fontSize: 13 };
const replyActionStyle = { display: "flex", gap: 8 };
const replyEditorStyle = { marginTop: 14, display: "grid", gap: 10 };
const replyButtonsStyle = { display: "flex", justifyContent: "flex-end", gap: 8 };
const replyContentStyle = { margin: "8px 0 0", color: "#344054", lineHeight: 1.6 };
const textareaStyle = { minHeight: 42, border: "1px solid #d0d5dd", borderRadius: 6, padding: 12, color: "#344054", outline: "none", background: "#fff", resize: "vertical", fontFamily: "inherit" };
const primaryBtnStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 6, background: "#12b76a", color: "#fff", padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryBtnStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #d0d5dd", borderRadius: 6, background: "#fff", color: "#344054", padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const smallIconBtnStyle = { width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer" };
const smallDeleteBtnStyle = { ...smallIconBtnStyle, color: "#d92d20", border: "1px solid #fecdca" };
const errorStyle = { background: "#fef3f2", color: "#b42318", border: "1px solid #fecdca", borderRadius: 8, padding: 12, margin: 16 };
const emptyStyle = { textAlign: "center", padding: 42, color: "#667085" };
const paginationStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "14px 16px", borderTop: "1px solid #e5e7eb", flexWrap: "wrap" };
const pageButtonWrapStyle = { display: "flex", alignItems: "center", gap: 8 };
const pageTextStyle = { color: "#344054", fontWeight: 700, minWidth: 44, textAlign: "center" };
const pageBtnStyle = (disabled) => ({ padding: "8px 13px", borderRadius: 6, border: "1px solid #d0d5dd", background: disabled ? "#f2f4f7" : "#fff", color: disabled ? "#98a2b3" : "#344054", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700 });
