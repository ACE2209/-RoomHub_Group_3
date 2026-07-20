import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Edit3, MapPin, MessageSquare, Save, Send, Star, Trash2, Upload } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AdminLayout from "../layout/admin/AdminLayout";
import LocationPicker from "../../component/LocationPicker/LocationPicker";
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

const MemoizedLocationPicker = memo(LocationPicker);

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
  latitude: "",
  longitude: "",
  staffId: "",
  assignedStaff: null,
  images: [],
  existingImages: [],
};

const DEFAULT_MAP_POSITION = [16.047079, 108.20623];
const ADDRESS_FIELD_KEYS = new Set(["provinceName", "districtName", "wardName", "detail"]);

const buildAddressSearchText = ({ detail, wardName, districtName, provinceName }) => {
  const parts = [detail, wardName, districtName, provinceName]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  if (!parts.length) return "";

  return `${parts.join(", ")}, Viet Nam`;
};

const formatCoordinate = (value) => Number(value).toFixed(6);

const parseCoordinate = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const coordinate = Number(text);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const getReverseGeocodedAddress = async (lat, lon) => {
  const params = new URLSearchParams({
    format: "json",
    lat: String(lat),
    lon: String(lon),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "en",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
  );

  if (!response.ok) throw new Error("Unable to reverse geocode coordinates");

  const result = await response.json();
  return result?.display_name || "";
};

const getCurrentRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.role || localStorage.getItem("role") || "";
  } catch (error) {
    return localStorage.getItem("role") || "";
  }
};

export default function OwnerBoardingHouseDetailPage() {
  const { id } = useParams();
  const isCreate = id === "new";
  const [searchParams] = useSearchParams();
  const isReadOnly = !isCreate && searchParams.get("mode") === "view";
  const navigate = useNavigate();
  const currentRole = useMemo(() => getCurrentRole(), []);
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
  const [notice, setNotice] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editingReplyId, setEditingReplyId] = useState("");
  const [editReplyContent, setEditReplyContent] = useState("");
  const [savingReplyId, setSavingReplyId] = useState("");
  const [mapPosition, setMapPosition] = useState(DEFAULT_MAP_POSITION);
  const [mapCandidate, setMapCandidate] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [geocoding, setGeocoding] = useState(false);
  const [mapMessage, setMapMessage] = useState("Enter an address so the map can move to the matching area.");
  const [geocodeRequest, setGeocodeRequest] = useState({ query: "", precise: false });
  const geocodeRequestRef = useRef(0);

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

  const selectedPosition = useMemo(() => {
    const lat = parseCoordinate(form.latitude);
    const lon = parseCoordinate(form.longitude);

    return lat !== null && lon !== null ? [lat, lon] : null;
  }, [form.latitude, form.longitude]);

  useEffect(() => {
    if (isCreate && currentRole === "staff") {
      navigate("/my-boarding-houses", { replace: true });
    }
  }, [currentRole, isCreate, navigate]);

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const res = await getBoardingHouseTypes();
        setTypes(res?.data || []);
      } catch (err) {
        setError(err.message || "Unable to load boarding house types");
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
          provinceName: house?.address?.province?.name_en || house?.address?.province?.name || "",
          provinceNameEn: house?.address?.province?.name_en || "",
          districtName: house?.address?.district?.name_en || house?.address?.district?.name || "",
          districtNameEn: house?.address?.district?.name_en || "",
          wardName: house?.address?.ward?.name_en || house?.address?.ward?.name || "",
          wardNameEn: house?.address?.ward?.name_en || "",
          detail: house?.address?.detail || "",
          latitude: house?.location?.lat ?? "",
          longitude: house?.location?.lon ?? "",
          staffId: house?.staffId?._id || house?.staffId || "",
          assignedStaff: house?.staffId || null,
          images: [],
          existingImages: house?.images || [],
        });
      } catch (err) {
        setError(err.message || "Unable to load boarding house details");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, isCreate]);

  useEffect(() => {
    if (!selectedPosition) return;

    setMapPosition(selectedPosition);
    setMapCandidate({
      lat: selectedPosition[0],
      lon: selectedPosition[1],
      label: "Saved location",
    });
    setMapZoom(16);
    setMapMessage("The boarding house location is being shown on the map.");
  }, [selectedPosition]);

  useEffect(() => {
    if (isReadOnly) return;

    const query = geocodeRequest.query.trim();
    if (!query) {
      setGeocoding(false);
      return;
    }

    const requestId = geocodeRequestRef.current + 1;
    geocodeRequestRef.current = requestId;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setGeocoding(true);
        const params = new URLSearchParams({
          format: "json",
          q: query,
          limit: "1",
          addressdetails: "1",
          "accept-language": "en",
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error("Unable to geocode address");

        const results = await response.json();
        if (requestId !== geocodeRequestRef.current) return;

        const result = results?.[0];
        if (!result) {
          setMapCandidate(null);
          setMapMessage("No matching location found. You can click directly on the map to choose one.");
          return;
        }

        const lat = Number(result.lat);
        const lon = Number(result.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          throw new Error("Invalid coordinates");
        }

        setMapPosition([lat, lon]);
        setMapCandidate({
          lat,
          lon,
          label: result.display_name || query,
        });
        setMapZoom(geocodeRequest.precise ? 16 : 13);
        setMapMessage(
          geocodeRequest.precise
            ? "The map moved to the detailed address. Click \"Select this location\" to pin it."
            : "The map moved to the entered area. Add a detailed address for better accuracy."
        );
      } catch (err) {
        if (err.name === "AbortError" || requestId !== geocodeRequestRef.current) return;
        setMapMessage("Unable to find the location automatically right now. You can still click directly on the map.");
      } finally {
        if (requestId === geocodeRequestRef.current) {
          setGeocoding(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [geocodeRequest, isReadOnly]);

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
    const shouldResetPinnedLocation = ADDRESS_FIELD_KEYS.has(key);

    if (shouldResetPinnedLocation && mapCandidate) {
      setMapCandidate(null);
    }

    setForm((prev) => {
      const nextForm = {
        ...prev,
        [key]: value,
      };

      if (shouldResetPinnedLocation && (prev.latitude || prev.longitude)) {
        nextForm.latitude = "";
        nextForm.longitude = "";
      }

      return nextForm;
    });
  };

  const requestAddressLookup = (overrides = {}, precise = false) => {
    const address = {
      detail: precise ? form.detail : "",
      wardName: form.wardName,
      districtName: form.districtName,
      provinceName: form.provinceName,
      ...overrides,
    };
    const query = buildAddressSearchText(address);

    if (!query) {
      setMapMessage("Enter an address so the map can move to the matching area.");
      return;
    }

    setGeocodeRequest({ query, precise });
  };

  const handleAddressRegionBlur = (key, value) => {
    requestAddressLookup({ [key]: value, detail: "" }, false);
  };

  const handleDetailAddressBlur = (value) => {
    requestAddressLookup({ detail: value }, Boolean(String(value || "").trim()));
  };

  const handleMapCandidateChange = useCallback((lat, lon) => {
    setMapPosition([lat, lon]);
    setMapCandidate({
      lat,
      lon,
      label: "Location selected on the map",
    });
    setMapZoom(16);
    setMapMessage("The map pin has been moved. Click \"Select this location\" to save it.");
  }, []);

  const handleConfirmMapPosition = async () => {
    const candidate = mapCandidate;

    if (!candidate) {
      setError("Please enter an address or select a location on the map.");
      return;
    }

    try {
      setGeocoding(true);
      setMapMessage("Getting the address from the pinned location...");
      const pinnedAddress = await getReverseGeocodedAddress(candidate.lat, candidate.lon);

      setForm((prev) => ({
        ...prev,
        detail: pinnedAddress || prev.detail,
        latitude: formatCoordinate(candidate.lat),
        longitude: formatCoordinate(candidate.lon),
      }));
      setError("");
      setMapMessage(
        pinnedAddress
          ? "The location has been pinned and the detailed address has been updated."
          : "This location has been pinned for the boarding house."
      );
    } catch (err) {
      setForm((prev) => ({
        ...prev,
        latitude: formatCoordinate(candidate.lat),
        longitude: formatCoordinate(candidate.lon),
      }));
      setError("");
      setMapMessage("The location has been pinned, but the detailed address could not be retrieved from the map.");
    } finally {
      setGeocoding(false);
    }
  };

  const buildPayload = () => {
    const data = new FormData();
    data.append("boardingHouseType", form.boardingHouseType);
    data.append("name", form.name);
    data.append("description", form.description);
    data.append("priceRange", form.priceRange);
    data.append("totalRooms", isCreate ? 0 : form.totalRooms || 0);
    data.append("availableRooms", isCreate ? 0 : form.availableRooms || 0);
    data.append("electricityPrice", form.electricityPrice);
    data.append("waterPrice", form.waterPrice);
    data.append("address[province][name]", form.provinceName);
    data.append("address[province][name_en]", form.provinceName);
    data.append("address[district][name]", form.districtName);
    data.append("address[district][name_en]", form.districtName);
    data.append("address[ward][name]", form.wardName);
    data.append("address[ward][name_en]", form.wardName);
    data.append("address[detail]", form.detail);
    data.append("location[lat]", form.latitude);
    data.append("location[lon]", form.longitude);
    data.append("staffId", form.staffId || "");

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
      "electricityPrice",
      "waterPrice",
      "provinceName",
      "districtName",
      "wardName",
      "detail",
    ];

    const missing = required.some((key) => String(form[key] || "").trim() === "");
    if (missing) return "Please fill in all required fields.";
    if (isCreate && !form.images.length) return "Please upload at least one image.";

    if (!String(form.latitude || "").trim() || !String(form.longitude || "").trim()) {
      return "Please select a location on the map.";
    }

    const nonNegativeFields = [
      ["Expected rent", form.priceRange],
      ["Total rooms", form.totalRooms],
      ["Available rooms", form.availableRooms],
      ["Electricity price", form.electricityPrice],
      ["Water price", form.waterPrice],
    ];

    for (const [label, value] of nonNegativeFields) {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue) || numberValue < 0) {
        return `${label} must be a non-negative number.`;
      }
    }

    if (Number(form.availableRooms) > Number(form.totalRooms)) {
      return "Available rooms cannot be greater than total rooms.";
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return "Latitude must be between -90 and 90.";
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return "Longitude must be between -180 and 180.";
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
        setNotice({
          type: "success",
          message: isCreate ? "Boarding house created successfully." : "Boarding house updated successfully.",
        });
        window.setTimeout(() => navigate("/my-boarding-houses"), 700);
      }
    } catch (err) {
      setError(err.message || "Failed to save boarding house information");
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
          Back
        </button>
        <div>
          <h2 style={titleStyle}>{isCreate ? "Add Boarding House" : isReadOnly ? "Boarding House Detail" : "Update Boarding House"}</h2>
          <p style={subtitleStyle}>{isCreate ? "Create a new boarding house for your account." : isReadOnly ? "View your boarding house detail." : "Update boarding house information."}</p>
        </div>
      </div>

      <form style={formCardStyle} onSubmit={handleSubmit}>
        {loading ? (
          <div style={emptyStyle}>Loading boarding house information...</div>
        ) : (
          <>
            {notice && <div style={noticeStyle(notice.type)}>{notice.message}</div>}
            {error && <div style={errorStyle}>{error}</div>}

            <div style={gridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Boarding House Type *</span>
                <select value={form.boardingHouseType} onChange={(e) => updateField("boardingHouseType", e.target.value)} style={inputStyle} disabled={isReadOnly}>
                  <option value="">Select boarding house type</option>
                  {types.map((type) => (
                    <option key={type._id || type.value} value={type._id || type.value}>{getBoardingHouseTypeLabel(type)}</option>
                  ))}
                </select>
              </label>

              <TextField label="Boarding House Name *" value={form.name} onChange={(value) => updateField("name", value)} disabled={isReadOnly} />
              <TextField label="Expected Rent (VND) *" type="text" formatCurrency value={form.priceRange} onChange={(value) => updateField("priceRange", value)} disabled={isReadOnly} />
              <TextField label="Electricity Price (VND/kWh) *" type="text" formatCurrency value={form.electricityPrice} onChange={(value) => updateField("electricityPrice", value)} disabled={isReadOnly} />
              <TextField label="Water Price (VND/m3) *" type="text" formatCurrency value={form.waterPrice} onChange={(value) => updateField("waterPrice", value)} disabled={isReadOnly} />
            </div>

            <label style={{ ...fieldStyle, marginTop: 16 }}>
              <span style={labelStyle}>Description</span>
              <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={4} style={textareaStyle} disabled={isReadOnly} />
            </label>

            <h3 style={sectionTitleStyle}>Address</h3>
            <div style={gridStyle}>
              <TextField label="Province/City *" value={form.provinceName} onChange={(value) => updateField("provinceName", value)} onBlur={(value) => handleAddressRegionBlur("provinceName", value)} disabled={isReadOnly} />
              <TextField label="District *" value={form.districtName} onChange={(value) => updateField("districtName", value)} onBlur={(value) => handleAddressRegionBlur("districtName", value)} disabled={isReadOnly} />
              <TextField label="Ward/Commune *" value={form.wardName} onChange={(value) => updateField("wardName", value)} onBlur={(value) => handleAddressRegionBlur("wardName", value)} disabled={isReadOnly} />
            </div>

            <label style={{ ...fieldStyle, marginTop: 16 }}>
              <span style={labelStyle}>Detailed Address *</span>
              <textarea value={form.detail} onChange={(e) => updateField("detail", e.target.value)} onBlur={(e) => handleDetailAddressBlur(e.target.value)} rows={3} style={textareaStyle} disabled={isReadOnly} />
            </label>

            <section style={mapPickerSectionStyle}>
              <div style={mapHeaderStyle}>
                <div>
                  <h3 style={mapTitleStyle}>Map Location</h3>
                  <p style={mapHintStyle}>
                    {isReadOnly ? "The boarding house location is being shown on the map." : mapMessage}
                  </p>
                </div>
                {!isReadOnly && geocoding && <span style={mapLoadingStyle}>Searching...</span>}
              </div>

              <div style={mapFrameStyle}>
                <MemoizedLocationPicker
                  initialPosition={mapPosition}
                  onChange={handleMapCandidateChange}
                  readOnly={isReadOnly}
                  height="360px"
                  zoom={mapZoom}
                />
              </div>

              {!isReadOnly && (
                <div style={mapActionRowStyle}>
                  <button
                    type="button"
                    style={mapSelectBtnStyle(!mapCandidate || saving || geocoding)}
                    onClick={handleConfirmMapPosition}
                    disabled={!mapCandidate || saving || geocoding}
                  >
                    <MapPin size={17} />
                    Select this location
                  </button>
                  <span style={mapSelectedTextStyle}>
                    {form.latitude && form.longitude ? "Location pinned for this boarding house." : "No location pinned yet."}
                  </span>
                </div>
              )}
            </section>

            <h3 style={sectionTitleStyle}>Images</h3>
            {!isReadOnly && (
              <label style={uploadStyle}>
                <Upload size={20} />
                <span>Choose images</span>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => updateField("images", Array.from(e.target.files || []))} />
              </label>
            )}

            {previews.length > 0 && (
              <div style={previewGridStyle}>
                {previews.map((image) => (
                  <img key={image.key} src={image.url} alt="Boarding house" style={previewStyle} />
                ))}
              </div>
            )}

            <div style={actionRowStyle}>
              <button type="button" style={secondaryBtnStyle} onClick={() => navigate("/my-boarding-houses")}>{isReadOnly ? "Back" : "Cancel"}</button>
              {!isReadOnly && (
                <button type="submit" style={primaryBtnStyle} disabled={saving}>
                  <Save size={17} />
                  {saving ? "Saving..." : "Save"}
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

function TextField({ label, value, onChange, onBlur, type = "text", disabled = false, formatCurrency = false }) {
  const displayValue = formatCurrency
    ? formatCurrencyValue(value)
    : value ?? "";

  const handleChange = (e) => {
    if (formatCurrency) {
      const raw = String(e.target.value || "").replace(/[^0-9]/g, "");
      onChange(raw);
    } else {
      onChange(e.target.value);
    }
  };

  const handleBlur = (e) => {
    onBlur?.(formatCurrency ? String(value ?? "") : e.target.value);
  };

  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={formatCurrency ? "text" : type}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        style={inputStyle}
        disabled={disabled}
        inputMode={formatCurrency ? "numeric" : undefined}
      />
    </label>
  );
}

const formatCurrencyValue = (value) => {
  const cleaned = String(value ?? "").replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned).toLocaleString("vi-VN") : "";
};

const boardingHouseTypeLabels = {
  can_ho: "Apartment",
  can_ho_mini: "Mini Apartment",
  chung_cu: "Apartment Building",
  chung_cu_mini: "Mini Apartment",
  homestay: "Homestay",
  ky_tuc_xa: "Dormitory",
  nha_nguyen_can: "Whole House",
  nha_tro: "Boarding House",
  nha_tro_kien_truc_xa: "Dorm-style Boarding House",
  phong_tro: "Room for Rent",
};

const normalizeLabelKey = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const toTitleCase = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getBoardingHouseTypeLabel = (type = {}) => {
  const labelSource =
    type.nameEn ||
    type.name_en ||
    type.labelEn ||
    type.label_en ||
    type.code ||
    type.codeName ||
    type.name ||
    type.label;
  const normalizedKey = normalizeLabelKey(type.code || type.codeName || type.name || type.label);

  return boardingHouseTypeLabels[normalizedKey] || toTitleCase(labelSource) || "Boarding House";
};

const getStaffDisplayName = (staff) => {
  if (!staff) return "Not assigned";
  if (typeof staff === "string") return "Assigned staff";
  return staff.fullname || staff.username || staff.email || "Assigned staff";
};

const headerStyle = { display: "flex", alignItems: "center", gap: 16, marginBottom: 18 };
const titleStyle = { margin: 0, color: "#27364a", fontWeight: 700 };
const subtitleStyle = { margin: "4px 0 0", color: "#667085", fontSize: 13 };
const formCardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 };
const fieldStyle = { display: "flex", flexDirection: "column", gap: 8 };
const labelStyle = { color: "#344054", fontSize: 13, fontWeight: 700 };
const inputStyle = { minHeight: 42, border: "1px solid #d0d5dd", borderRadius: 6, padding: "0 12px", color: "#344054", outline: "none", background: "#fff" };
const readonlyInfoStyle = { minHeight: 42, border: "1px solid #d0d5dd", borderRadius: 6, padding: "8px 12px", color: "#344054", background: "#f9fafb", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 };
const textareaStyle = { ...inputStyle, padding: 12, resize: "vertical", fontFamily: "inherit" };
const sectionTitleStyle = { margin: "22px 0 14px", color: "#27364a", fontSize: 18 };
const mapPickerSectionStyle = { marginTop: 18, display: "grid", gap: 12 };
const mapHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" };
const mapTitleStyle = { margin: 0, color: "#27364a", fontSize: 18 };
const mapHintStyle = { margin: "6px 0 0", color: "#667085", fontSize: 13, lineHeight: 1.5 };
const mapLoadingStyle = { color: "#2563eb", fontSize: 13, fontWeight: 700, paddingTop: 3 };
const mapFrameStyle = { border: "1px solid #d0d5dd", borderRadius: 8, overflow: "hidden", background: "#f9fafb" };
const mapActionRowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" };
const mapSelectBtnStyle = (disabled) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "none",
  borderRadius: 6,
  background: disabled ? "#98a2b3" : "#2563eb",
  color: "#fff",
  padding: "10px 16px",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
});
const mapSelectedTextStyle = { color: "#667085", fontSize: 13, fontWeight: 700 };
const uploadStyle = { display: "inline-flex", alignItems: "center", gap: 8, border: "1px dashed #98a2b3", borderRadius: 8, padding: "12px 16px", cursor: "pointer", color: "#344054", fontWeight: 700 };
const previewGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginTop: 14 };
const previewStyle = { width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" };
const actionRowStyle = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 };
const primaryBtnStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 6, background: "#12b76a", color: "#fff", padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryBtnStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #d0d5dd", borderRadius: 6, background: "#fff", color: "#344054", padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const errorStyle = { background: "#fef3f2", color: "#b42318", border: "1px solid #fecdca", borderRadius: 8, padding: 12, marginBottom: 16 };
const noticeStyle = (type) => ({
  background: type === "success" ? "#ecfdf3" : "#fef3f2",
  color: type === "success" ? "#027a48" : "#b42318",
  border: `1px solid ${type === "success" ? "#abefc6" : "#fecdca"}`,
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  fontWeight: 700,
});
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
