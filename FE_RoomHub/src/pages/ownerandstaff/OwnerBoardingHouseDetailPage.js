import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, MessageSquare, Save, Send, Star, Trash2, Upload } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AdminLayout from "../layout/admin/AdminLayout";
import {
  createOwnBoardingHouse,
  getBoardingHouseTypes,
  getOwnBoardingHouseDetail,
  updateOwnBoardingHouse,
} from "../../api/boardingHouse";
import {
  deleteManagedReviewReply,
  getManagedBoardingHouseReviews,
  replyManagedReview,
  updateManagedReviewReply,
} from "../../api/review";

const emptyForm = {
  boardingHouseType: "",
  name: "",
  description: "",
  priceRange: "",
  totalRooms: "",
  availableRooms: "",
  electricityPrice: "",
  waterPrice: "",
  provinceName: "",
  provinceNameEn: "",
  districtName: "",
  districtNameEn: "",
  wardName: "",
  wardNameEn: "",
  detail: "",
  images: [],
  existingImages: [],
};

export default function OwnerBoardingHouseDetailPage() {
  const { id } = useParams();
  const isCreate = id === "new";
  const [searchParams] = useSearchParams();
  const isReadOnly = !isCreate && searchParams.get("mode") === "view";
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewPagination, setReviewPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 5,
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editingReplyId, setEditingReplyId] = useState("");
  const [editReplyContent, setEditReplyContent] = useState("");
  const [savingReplyId, setSavingReplyId] = useState("");

  const previews = useMemo(() => {
    const newImages = Array.from(form.images || []).map((file) => ({
      key: `${file.name}-${file.lastModified}`,
      url: URL.createObjectURL(file),
    }));

    return [
      ...(form.existingImages || []).map((image) => ({
        key: image._id || image.imageUrl,
        url: image.imageUrl,
      })),
      ...newImages,
    ];
  }, [form.images, form.existingImages]);

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const res = await getBoardingHouseTypes();
        setTypes(res?.data || []);
      } catch (err) {
        setError(err.message || "Không thể tải danh sách loại nhà trọ");
      }
    };

    loadTypes();
  }, []);

  useEffect(() => {
    if (isCreate) return;

    const loadDetail = async () => {
      try {
        setLoading(true);
        const res = await getOwnBoardingHouseDetail(id);
        const house = res?.data;

        setForm({
          boardingHouseType: house?.boardingHouseType?._id || house?.boardingHouseType || "",
          name: house?.name || "",
          description: house?.description || "",
          priceRange: house?.priceRange || "",
          totalRooms: house?.totalRooms ?? "",
          availableRooms: house?.availableRooms ?? "",
          electricityPrice: house?.electricityPrice || "",
          waterPrice: house?.waterPrice || "",
          provinceName: house?.address?.province?.name || "",
          provinceNameEn: house?.address?.province?.name_en || "",
          districtName: house?.address?.district?.name || "",
          districtNameEn: house?.address?.district?.name_en || "",
          wardName: house?.address?.ward?.name || "",
          wardNameEn: house?.address?.ward?.name_en || "",
          detail: house?.address?.detail || "",
          images: [],
          existingImages: house?.images || [],
        });
      } catch (err) {
        setError(err.message || "Không thể tải chi tiết nhà trọ");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, isCreate]);

  const fetchReviews = useCallback(async (page = 1) => {
    if (isCreate || !id) return;

    try {
      setReviewLoading(true);
      const res = await getManagedBoardingHouseReviews(id, page, reviewPagination.limit);
      setReviews(res?.data || []);
      setReviewPagination((prev) => ({
        ...prev,
        ...(res?.pagination || {}),
      }));
      setReviewError("");
    } catch (err) {
      setReviews([]);
      setReviewError(err.message || "Unable to load reviews");
    } finally {
      setReviewLoading(false);
    }
  }, [id, isCreate, reviewPagination.limit]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const buildPayload = () => {
    const data = new FormData();
    data.append("boardingHouseType", form.boardingHouseType);
    data.append("name", form.name);
    data.append("description", form.description);
    data.append("priceRange", form.priceRange);
    data.append("totalRooms", form.totalRooms || 0);
    data.append("availableRooms", form.availableRooms || 0);
    data.append("electricityPrice", form.electricityPrice);
    data.append("waterPrice", form.waterPrice);
    data.append("address[province][name]", form.provinceName);
    data.append("address[province][name_en]", form.provinceName);
    data.append("address[district][name]", form.districtName);
    data.append("address[district][name_en]", form.districtName);
    data.append("address[ward][name]", form.wardName);
    data.append("address[ward][name_en]", form.wardName);
    data.append("address[detail]", form.detail);

    if (!isCreate) {
      data.append("boardingHouse", JSON.stringify(form.existingImages || []));
    }

    Array.from(form.images || []).forEach((file) => {
      data.append("boardingHouse", file);
    });

    return data;
  };

  const validate = () => {
    const required = [
      "boardingHouseType",
      "name",
      "priceRange",
      "totalRooms",
      "availableRooms",
      "electricityPrice",
      "waterPrice",
      "provinceName",
      "districtName",
      "wardName",
      "detail",
    ];

    const missing = required.some((key) => String(form[key] || "").trim() === "");
    if (missing) return "Vui lòng nhập đầy đủ các trường bắt buộc.";
    if (isCreate && !form.images.length) return "Vui lòng tải lên ít nhất một hình ảnh.";

    const nonNegativeFields = [
      ["Giá thuê", form.priceRange],
      ["Tổng số phòng", form.totalRooms],
      ["Phòng còn trống", form.availableRooms],
      ["Giá điện", form.electricityPrice],
      ["Giá nước", form.waterPrice],
    ];

    for (const [label, value] of nonNegativeFields) {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue) || numberValue < 0) {
        return `${label} phải là số không âm.`;
      }
    }

    if (Number(form.availableRooms) > Number(form.totalRooms)) {
      return "Số phòng còn trống không được lớn hơn tổng số phòng.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      const res = isCreate
        ? await createOwnBoardingHouse(payload)
        : await updateOwnBoardingHouse(id, payload);

      if (res?.success) {
        alert(isCreate ? "Thêm nhà trọ thành công" : "Cập nhật nhà trọ thành công");
        navigate("/my-boarding-houses");
      }
    } catch (err) {
      setError(err.message || "Lưu thông tin thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    const content = replyDrafts[reviewId]?.trim();
    if (!content) return;

    try {
      setSavingReplyId(reviewId);
      await replyManagedReview({ parentId: reviewId, content });
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      fetchReviews(reviewPagination.currentPage || 1);
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
      fetchReviews(reviewPagination.currentPage || 1);
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
      fetchReviews(reviewPagination.currentPage || 1);
    } catch (err) {
      alert(err.message || "Delete reply failed");
    } finally {
      setSavingReplyId("");
    }
  };

  return (
    <AdminLayout>
      <div style={headerStyle}>
        <button style={secondaryBtnStyle} onClick={() => navigate("/my-boarding-houses")}>
          <ArrowLeft size={17} />
          Quay lại
        </button>
        <div>
          <h2 style={titleStyle}>{isCreate ? "Thêm nhà trọ" : isReadOnly ? "Thông tin nhà trọ" : "Cập nhật nhà trọ"}</h2>
          <p style={subtitleStyle}>{isCreate ? "Tạo nhà trọ mới cho tài khoản của bạn." : isReadOnly ? "Xem thông tin nhà trọ của bạn." : "Cập nhật thông tin nhà trọ."}</p>
        </div>
      </div>

      <form style={formCardStyle} onSubmit={handleSubmit}>
        {loading ? (
          <div style={emptyStyle}>Đang tải thông tin nhà trọ...</div>
        ) : (
          <>
            {error && <div style={errorStyle}>{error}</div>}

            <div style={gridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Loại nhà trọ *</span>
                <select value={form.boardingHouseType} onChange={(e) => updateField("boardingHouseType", e.target.value)} style={inputStyle} disabled={isReadOnly}>
                  <option value="">Chọn loại nhà trọ</option>
                  {types.map((type) => (
                    <option key={type._id || type.value} value={type._id || type.value}>{type.name || type.label}</option>
                  ))}
                </select>
              </label>

              <TextField label="Tên nhà trọ *" value={form.name} onChange={(value) => updateField("name", value)} disabled={isReadOnly} />
              <TextField label="Giá thuê dự kiến (VNĐ) *" type="number" value={form.priceRange} onChange={(value) => updateField("priceRange", value)} disabled={isReadOnly} />
              <TextField label="Tổng số phòng *" type="number" value={form.totalRooms} onChange={(value) => updateField("totalRooms", value)} disabled={isReadOnly} />
              <TextField label="Số phòng còn trống *" type="number" value={form.availableRooms} onChange={(value) => updateField("availableRooms", value)} disabled={isReadOnly} />
              <TextField label="Giá điện (VNĐ/kWh) *" type="number" value={form.electricityPrice} onChange={(value) => updateField("electricityPrice", value)} disabled={isReadOnly} />
              <TextField label="Giá nước (VNĐ/m3) *" type="number" value={form.waterPrice} onChange={(value) => updateField("waterPrice", value)} disabled={isReadOnly} />
            </div>

            <label style={{ ...fieldStyle, marginTop: 16 }}>
              <span style={labelStyle}>Mô tả</span>
              <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={4} style={textareaStyle} disabled={isReadOnly} />
            </label>

            <h3 style={sectionTitleStyle}>Địa chỉ</h3>
            <div style={gridStyle}>
              <TextField label="Tỉnh/Thành phố *" value={form.provinceName} onChange={(value) => updateField("provinceName", value)} disabled={isReadOnly} />
              <TextField label="Quận/Huyện *" value={form.districtName} onChange={(value) => updateField("districtName", value)} disabled={isReadOnly} />
              <TextField label="Phường/Xã *" value={form.wardName} onChange={(value) => updateField("wardName", value)} disabled={isReadOnly} />
            </div>

            <label style={{ ...fieldStyle, marginTop: 16 }}>
              <span style={labelStyle}>Địa chỉ chi tiết *</span>
              <textarea value={form.detail} onChange={(e) => updateField("detail", e.target.value)} rows={3} style={textareaStyle} disabled={isReadOnly} />
            </label>

            <h3 style={sectionTitleStyle}>Hình ảnh</h3>
            {!isReadOnly && (
              <label style={uploadStyle}>
                <Upload size={20} />
                <span>Chọn hình ảnh</span>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => updateField("images", Array.from(e.target.files || []))} />
              </label>
            )}

            {previews.length > 0 && (
              <div style={previewGridStyle}>
                {previews.map((image) => (
                  <img key={image.key} src={image.url} alt="Nhà trọ" style={previewStyle} />
                ))}
              </div>
            )}

            <div style={actionRowStyle}>
              <button type="button" style={secondaryBtnStyle} onClick={() => navigate("/my-boarding-houses")}>{isReadOnly ? "Quay lại" : "Hủy"}</button>
              {!isReadOnly && (
                <button type="submit" style={primaryBtnStyle} disabled={saving}>
                  <Save size={17} />
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              )}
            </div>
          </>
        )}
      </form>

      {!isCreate && (
        <section id="reviews" style={reviewSectionStyle}>
          <div style={reviewHeaderStyle}>
            <div>
              <h3 style={sectionTitleStyle}>Reviews</h3>
              <p style={subtitleStyle}>{reviewPagination.totalItems || 0} reviews from tenants</p>
            </div>
            <MessageSquare size={22} color="#2563eb" />
          </div>

          {reviewLoading ? (
            <div style={emptyStyle}>Loading reviews...</div>
          ) : reviewError ? (
            <div style={errorStyle}>{reviewError}</div>
          ) : reviews.length ? (
            <div style={reviewListStyle}>
              {reviews.map((review) => (
                <article key={review._id} style={reviewCardStyle}>
                  <div style={reviewTopStyle}>
                    <div>
                      <strong style={reviewNameStyle}>
                        {review.accountId?.fullname || review.accountId?.username || "Guest"}
                      </strong>
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
                    </div>
                    <span style={dateStyle}>{formatDate(review.createdAt)}</span>
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
                            onChange={(e) => setEditReplyContent(e.target.value)}
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
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review._id]: e.target.value }))}
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
            <div style={emptyStyle}>No reviews yet</div>
          )}

          <div style={paginationStyle}>
            <span style={subtitleStyle}>Showing {reviews.length} of {reviewPagination.totalItems || 0}</span>
            <div style={pageButtonWrapStyle}>
              <button
                type="button"
                style={pageBtnStyle(!reviewPagination.hasPrevPage || reviewLoading)}
                disabled={!reviewPagination.hasPrevPage || reviewLoading}
                onClick={() => fetchReviews((reviewPagination.currentPage || 1) - 1)}
              >
                Previous
              </button>
              <span style={pageTextStyle}>{reviewPagination.currentPage || 1}/{reviewPagination.totalPages || 1}</span>
              <button
                type="button"
                style={pageBtnStyle(!reviewPagination.hasNextPage || reviewLoading)}
                disabled={!reviewPagination.hasNextPage || reviewLoading}
                onClick={() => fetchReviews((reviewPagination.currentPage || 1) + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}

function TextField({ label, value, onChange, type = "text", disabled = false }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} disabled={disabled} />
    </label>
  );
}

const headerStyle = { display: "flex", alignItems: "center", gap: 16, marginBottom: 18 };
const titleStyle = { margin: 0, color: "#27364a", fontWeight: 700 };
const subtitleStyle = { margin: "4px 0 0", color: "#667085", fontSize: 13 };
const formCardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 };
const fieldStyle = { display: "flex", flexDirection: "column", gap: 8 };
const labelStyle = { color: "#344054", fontSize: 13, fontWeight: 700 };
const inputStyle = { minHeight: 42, border: "1px solid #d0d5dd", borderRadius: 6, padding: "0 12px", color: "#344054", outline: "none", background: "#fff" };
const textareaStyle = { ...inputStyle, padding: 12, resize: "vertical", fontFamily: "inherit" };
const sectionTitleStyle = { margin: "22px 0 14px", color: "#27364a", fontSize: 18 };
const uploadStyle = { display: "inline-flex", alignItems: "center", gap: 8, border: "1px dashed #98a2b3", borderRadius: 8, padding: "12px 16px", cursor: "pointer", color: "#344054", fontWeight: 700 };
const previewGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginTop: 14 };
const previewStyle = { width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" };
const actionRowStyle = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 };
const primaryBtnStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 6, background: "#12b76a", color: "#fff", padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryBtnStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #d0d5dd", borderRadius: 6, background: "#fff", color: "#344054", padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const errorStyle = { background: "#fef3f2", color: "#b42318", border: "1px solid #fecdca", borderRadius: 8, padding: 12, marginBottom: 16 };
const emptyStyle = { textAlign: "center", padding: 42, color: "#667085" };
const reviewSectionStyle = { ...formCardStyle, marginTop: 18 };
const reviewHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 14, marginBottom: 16 };
const reviewListStyle = { display: "grid", gap: 14 };
const reviewCardStyle = { border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" };
const reviewTopStyle = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" };
const reviewNameStyle = { color: "#27364a", display: "block", marginBottom: 6 };
const starRowStyle = { display: "flex", gap: 2 };
const dateStyle = { color: "#667085", fontSize: 12, whiteSpace: "nowrap" };
const reviewContentStyle = { margin: "12px 0 0", color: "#344054", lineHeight: 1.6 };
const replyBoxStyle = { marginTop: 14, padding: 14, borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff" };
const replyTitleStyle = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", color: "#1d4ed8", fontWeight: 700, fontSize: 13 };
const replyActionStyle = { display: "flex", gap: 8 };
const replyEditorStyle = { marginTop: 14, display: "grid", gap: 10 };
const replyButtonsStyle = { display: "flex", justifyContent: "flex-end", gap: 8 };
const replyContentStyle = { margin: "8px 0 0", color: "#344054", lineHeight: 1.6 };
const smallIconBtnStyle = { width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer" };
const smallDeleteBtnStyle = { ...smallIconBtnStyle, color: "#d92d20", border: "1px solid #fecdca" };
const paginationStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" };
const pageButtonWrapStyle = { display: "flex", alignItems: "center", gap: 8 };
const pageTextStyle = { color: "#344054", fontWeight: 700, minWidth: 44, textAlign: "center" };
const pageBtnStyle = (disabled) => ({ padding: "8px 13px", borderRadius: 6, border: "1px solid #d0d5dd", background: disabled ? "#f2f4f7" : "#fff", color: disabled ? "#98a2b3" : "#344054", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700 });
const formatDate = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "";
