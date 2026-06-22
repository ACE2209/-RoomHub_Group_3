import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Filter,
  Home,
  MapPin,
  RefreshCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import AdminLayout from "../layout/admin/AdminLayout";
import {
  deleteBoardingHouse,
  filterBoardingHouses,
  getBoardingHouses,
} from "../../api/boardingHouse";
import { getImageSource, setFallbackImage } from "../../api/config";

const initialFilters = {
  name: "",
  province: "",
  district: "",
  ward: "",
  rating: "",
};

const pageSizeOptions = [3, 5, 10, 20];

export default function BoardingHouseManagementPage() {
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [limit, setLimit] = useState(3);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 3,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const hasLoaded = useRef(false);
  const latestFilters = useRef(initialFilters);
  const lastLiveSearchValue = useRef(initialFilters.name);

  const stats = useMemo(() => {
    const availableRooms = boardingHouses.reduce(
      (total, item) => total + (Number(item.availableRooms) || 0),
      0
    );

    return {
      total: pagination.totalItems || boardingHouses.length,
      availableRooms,
    };
  }, [boardingHouses, pagination.totalItems]);

  const visiblePages = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    const currentPage = pagination.currentPage || 1;
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [pagination.currentPage, pagination.totalPages]);

  const normalizeResult = useCallback((res) => {
    if (res?.success && Array.isArray(res.data)) {
      setBoardingHouses(res.data);
      setPagination((prev) => ({
        ...prev,
        ...(res.pagination || {}),
      }));
      setError("");
      return;
    }

    setBoardingHouses([]);
    setError(res?.message || res?.error || "Unable to load boarding houses");
  }, []);

  const fetchBoardingHouses = useCallback(async (page = 1, pageLimit = limit) => {
    try {
      setLoading(true);
      const res = await getBoardingHouses({ page, limit: pageLimit });
      normalizeResult(res);
      setIsFiltered(false);
    } catch (err) {
      console.error("Get boarding houses failed:", err);
      setBoardingHouses([]);
      setError(err.message || "Unable to load boarding houses");
    } finally {
      setLoading(false);
    }
  }, [limit, normalizeResult]);

  const runFilter = useCallback(async (filterValues, page = 1, pageLimit = limit) => {
    try {
      setLoading(true);
      const res = await filterBoardingHouses({
        ...filterValues,
        page,
        limit: pageLimit,
      });
      normalizeResult(res);
      setIsFiltered(true);
    } catch (err) {
      console.error("Filter boarding houses failed:", err);
      setBoardingHouses([]);
      setError(err.message || "Filter failed");
    } finally {
      setLoading(false);
    }
  }, [limit, normalizeResult]);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      fetchBoardingHouses(1);
    }
  }, [fetchBoardingHouses]);

  useEffect(() => {
    latestFilters.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!hasLoaded.current || lastLiveSearchValue.current === filters.name) {
      return undefined;
    }

    lastLiveSearchValue.current = filters.name;

    const timer = setTimeout(() => {
      const currentFilters = latestFilters.current;
      const hasAnyFilter = Object.values(currentFilters).some((value) =>
        String(value || "").trim()
      );

      if (hasAnyFilter) {
        runFilter(currentFilters, 1, limit);
      } else {
        fetchBoardingHouses(1, limit);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchBoardingHouses, filters.name, limit, runFilter]);

  const handleFilter = (page = 1, pageLimit = limit) => {
    runFilter(filters, page, pageLimit);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    fetchBoardingHouses(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    if (isFiltered) {
      handleFilter(page);
    } else {
      fetchBoardingHouses(page);
    }
  };

  const handleLimitChange = (value) => {
    const nextLimit = Number(value);
    setLimit(nextLimit);
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
      limit: nextLimit,
    }));

    if (isFiltered) {
      handleFilter(1, nextLimit);
    } else {
      fetchBoardingHouses(1, nextLimit);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this boarding house?"
    );

    if (!confirmDelete) return;

    try {
      const res = await deleteBoardingHouse(id);

      if (res?.success) {
        setBoardingHouses((prev) => prev.filter((item) => item._id !== id));
        setPagination((prev) => ({
          ...prev,
          totalItems: Math.max((prev.totalItems || 1) - 1, 0),
        }));
        alert("Boarding house deleted successfully");
      } else {
        alert(res?.message || res?.error || "Delete failed");
      }
    } catch (err) {
      console.error("Delete boarding house failed:", err);
      alert(err.message || "Delete failed");
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <AdminLayout>
      <div style={pageHeaderStyle}>
        <div>
          <h2 style={titleStyle}>Boarding House Management</h2>

        </div>

        <div style={summaryStyle}>
          <div style={summaryItemStyle}>
            <Building2 size={18} />
            <span>{stats.total} houses</span>
          </div>
          <div style={summaryItemStyle}>
            <Home size={18} />
            <span>{stats.availableRooms} rooms available</span>
          </div>
        </div>
      </div>

      <div style={filterPanelStyle}>
        <div style={filterGridStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Name</span>
            <div style={inputWrapStyle}>
              <Search size={16} />
              <input
                value={filters.name}
                onChange={(e) => updateFilter("name", e.target.value)}
                placeholder="Search by name"
                style={inputStyle}
              />
            </div>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Province</span>
            <input
              value={filters.province}
              onChange={(e) => updateFilter("province", e.target.value)}
              placeholder="Province"
              style={plainInputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>District</span>
            <input
              value={filters.district}
              onChange={(e) => updateFilter("district", e.target.value)}
              placeholder="District"
              style={plainInputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Ward</span>
            <input
              value={filters.ward}
              onChange={(e) => updateFilter("ward", e.target.value)}
              placeholder="Ward"
              style={plainInputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Rating</span>
            <select
              value={filters.rating}
              onChange={(e) => updateFilter("rating", e.target.value)}
              style={plainInputStyle}
            >
              <option value="">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </label>

        </div>

        <div style={filterActionStyle}>
          <button onClick={() => handleFilter(1)} style={primaryBtnStyle}>
            <Filter size={16} />
            Filter
          </button>
          <button onClick={handleReset} style={secondaryBtnStyle}>
            <RefreshCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div style={tableCardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>House</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Rooms</th>
              <th style={thStyle}>Rating</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={emptyStyle}>Loading boarding houses...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" style={emptyStyle}>{error}</td>
              </tr>
            ) : boardingHouses.length > 0 ? (
              boardingHouses.map((house) => (
                <tr key={house._id} style={rowStyle}>
                  <td style={tdStyle}>
                    <div style={houseCellStyle}>
                      <img
                        src={getPrimaryImage(house)}
                        alt={house.name || "Boarding house"}
                        onError={(event) => setFallbackImage(event, "/image/logo.png")}
                        style={thumbStyle}
                      />
                      <div style={houseInfoStyle}>
                        <strong style={houseNameStyle}>{house.name || "N/A"}</strong>
                        <span style={mutedTextStyle}>
                          {house.boardingHouseType?.name || "No type"}
                        </span>
                        <span style={priceStyle}>{formatCurrency(house.priceRange)}</span>
                      </div>
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <div style={ownerStyle}>
                      <span>{house.ownerId?.fullname || house.ownerId?.username || "N/A"}</span>
                      <small>{house.ownerId?.email || ""}</small>
                    </div>
                  </td>

                  <td style={{ ...tdStyle, maxWidth: "300px" }}>
                    <div style={addressStyle}>
                      <MapPin size={16} />
                      <span style={ellipsisStyle}>{formatAddress(house.address)}</span>
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <span style={roomBadgeStyle}>
                      {house.availableRooms ?? 0}/{house.totalRooms ?? 0}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <span style={ratingStyle}>
                      <Star size={14} fill="#f59e0b" />
                      {house.rating ?? "N/A"}
                    </span>
                  </td>

                  <td style={tdStyle}>{formatDate(house.createdAt)}</td>

                  <td style={tdStyle}>
                    <div style={actionStyle}>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => handleDelete(house._id)}
                        style={deleteIconBtnStyle}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={emptyStyle}>No boarding house data found</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={paginationStyle}>
          <div style={paginationInfoStyle}>
            <span style={mutedTextStyle}>
              Showing {boardingHouses.length} of {pagination.totalItems || 0} houses
            </span>
            <label style={pageSizeStyle}>
              Rows
              <select
                value={limit}
                onChange={(e) => handleLimitChange(e.target.value)}
                disabled={loading}
                style={pageSizeSelectStyle}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={pageButtonWrapStyle}>
            <button
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => handlePageChange((pagination.currentPage || 1) - 1)}
              style={pageBtnStyle(!pagination.hasPrevPage || loading)}
            >
              Previous
            </button>
            {visiblePages[0] > 1 && (
              <>
                <button
                  disabled={loading}
                  onClick={() => handlePageChange(1)}
                  style={numberPageBtnStyle(false, loading)}
                >
                  1
                </button>
                <span style={dotsStyle}>...</span>
              </>
            )}
            {visiblePages.map((page) => (
              <button
                key={page}
                disabled={loading}
                onClick={() => handlePageChange(page)}
                style={numberPageBtnStyle(
                  page === (pagination.currentPage || 1),
                  loading
                )}
              >
                {page}
              </button>
            ))}
            {visiblePages[visiblePages.length - 1] < (pagination.totalPages || 1) && (
              <>
                <span style={dotsStyle}>...</span>
                <button
                  disabled={loading}
                  onClick={() => handlePageChange(pagination.totalPages || 1)}
                  style={numberPageBtnStyle(false, loading)}
                >
                  {pagination.totalPages || 1}
                </button>
              </>
            )}
            <button
              disabled={!pagination.hasNextPage || loading}
              onClick={() => handlePageChange((pagination.currentPage || 1) + 1)}
              style={pageBtnStyle(!pagination.hasNextPage || loading)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const getPrimaryImage = (house) => {
  return getImageSource(house?.images || house?.image, "/image/logo.png");
};

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numberValue);
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-GB");
};

const formatAddress = (address) => {
  if (!address) return "N/A";
  return [
    address.detail,
    address.ward?.name,
    address.district?.name,
    address.province?.name,
  ]
    .filter(Boolean)
    .join(", ");
};

const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "22px",
};

const titleStyle = {
  margin: 0,
  fontWeight: "700",
  color: "#27364a",
};

const summaryStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const summaryItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#344054",
  fontWeight: 600,
};

const filterPanelStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "18px",
  marginBottom: "18px",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle = {
  color: "#344054",
  fontSize: "13px",
  fontWeight: 700,
};

const inputWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid #d0d5dd",
  borderRadius: "6px",
  padding: "0 12px",
  minHeight: "42px",
};

const inputStyle = {
  border: "none",
  outline: "none",
  width: "100%",
  color: "#344054",
};

const plainInputStyle = {
  border: "1px solid #d0d5dd",
  borderRadius: "6px",
  minHeight: "42px",
  padding: "0 12px",
  color: "#344054",
  outline: "none",
  background: "#ffffff",
};

const filterActionStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "16px",
};

const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "#12b76a",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "6px",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "#ffffff",
  color: "#344054",
  border: "1px solid #d0d5dd",
  padding: "10px 18px",
  borderRadius: "6px",
  fontWeight: "700",
  cursor: "pointer",
};

const tableCardStyle = {
  background: "white",
  borderRadius: "8px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const headerRowStyle = {
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const rowStyle = {
  borderBottom: "1px solid #f3f4f6",
};

const thStyle = {
  padding: "16px",
  textAlign: "left",
  color: "#344054",
  fontWeight: "700",
  fontSize: "13px",
};

const tdStyle = {
  padding: "16px",
  color: "#344054",
  verticalAlign: "middle",
};

const houseCellStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: "260px",
};

const thumbStyle = {
  width: "58px",
  height: "58px",
  borderRadius: "8px",
  objectFit: "cover",
  border: "1px solid #e5e7eb",
};

const houseInfoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const houseNameStyle = {
  color: "#182230",
};

const priceStyle = {
  color: "#087443",
  fontWeight: 700,
  fontSize: "13px",
};

const ownerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const mutedTextStyle = {
  color: "#667085",
  fontSize: "13px",
};

const addressStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const ellipsisStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const roomBadgeStyle = {
  background: "#ecfdf3",
  color: "#087443",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 700,
};

const ratingStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  background: "#fffaeb",
  color: "#b54708",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 700,
};

const actionStyle = {
  display: "flex",
  gap: "8px",
};

const deleteIconBtnStyle = {
  width: "36px",
  height: "36px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fef3f2",
  color: "#d92d20",
  border: "1px solid #fecdca",
  borderRadius: "6px",
  cursor: "pointer",
};

const emptyStyle = {
  textAlign: "center",
  padding: "42px",
  color: "#667085",
};

const paginationStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "14px 16px",
  borderTop: "1px solid #e5e7eb",
  flexWrap: "wrap",
};

const paginationInfoStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
};

const pageSizeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: "#344054",
  fontSize: "13px",
  fontWeight: 700,
};

const pageSizeSelectStyle = {
  height: "34px",
  border: "1px solid #d0d5dd",
  borderRadius: "6px",
  padding: "0 8px",
  color: "#344054",
  background: "#ffffff",
};

const pageButtonWrapStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  flexWrap: "wrap",
};

const pageBtnStyle = (disabled) => ({
  padding: "8px 13px",
  borderRadius: "6px",
  border: "1px solid #d0d5dd",
  background: disabled ? "#f2f4f7" : "#ffffff",
  color: disabled ? "#98a2b3" : "#344054",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 700,
});

const numberPageBtnStyle = (active, disabled) => ({
  minWidth: "36px",
  height: "36px",
  borderRadius: "6px",
  border: active ? "1px solid #ff4d1c" : "1px solid #d0d5dd",
  background: active ? "#fff7f4" : disabled ? "#f2f4f7" : "#ffffff",
  color: active ? "#ff4d1c" : disabled ? "#98a2b3" : "#344054",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 700,
});

const dotsStyle = {
  color: "#667085",
  padding: "0 2px",
  fontWeight: 700,
};
