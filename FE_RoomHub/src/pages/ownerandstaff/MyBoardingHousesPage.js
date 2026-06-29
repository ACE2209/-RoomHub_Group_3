import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Edit3, Eye, Home, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layout/admin/AdminLayout";
import {
  deleteOwnBoardingHouse,
  getOwnBoardingHouses,
} from "../../api/boardingHouse";

const pageSizeOptions = [5, 10, 20];

export default function MyBoardingHousesPage() {
  const navigate = useNavigate();
  const [houses, setHouses] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const availableRooms = houses.reduce(
      (total, house) => total + (Number(house.availableRooms) || 0),
      0
    );

    return {
      total: pagination.totalItems || houses.length,
      availableRooms,
    };
  }, [houses, pagination.totalItems]);

  const fetchHouses = useCallback(async (page = 1, pageLimit = limit) => {
    try {
      setLoading(true);
      const res = await getOwnBoardingHouses({ page, limit: pageLimit });
      setHouses(res?.data || []);
      setPagination((prev) => ({
        ...prev,
        ...(res?.pagination || {}),
      }));
      setError("");
    } catch (err) {
      setHouses([]);
      setError(err.message || "Unable to load boarding houses");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchHouses(1);
  }, [fetchHouses]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this boarding house?")) return;

    try {
      const res = await deleteOwnBoardingHouse(id);
      if (res?.success) {
        fetchHouses(pagination.currentPage, limit);
        alert("Boarding house deleted successfully");
      }
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  const handleLimitChange = (value) => {
    const nextLimit = Number(value);
    setLimit(nextLimit);
    fetchHouses(1, nextLimit);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    fetchHouses(page, limit);
  };

  return (
    <AdminLayout>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>My Boarding Houses</h2>
          <p style={subtitleStyle}>Manage boarding houses assigned to your account.</p>
        </div>

        <button style={primaryBtnStyle} onClick={() => navigate("/my-boarding-houses/new")}>
          <Plus size={17} />
          Add Boarding House
        </button>
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

      <div style={tableCardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>House</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Rooms</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={emptyStyle}>Loading boarding houses...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" style={emptyStyle}>{error}</td></tr>
            ) : houses.length ? (
              houses.map((house) => (
                <tr key={house._id} style={rowStyle}>
                  <td style={tdStyle}>
                    <div style={houseCellStyle}>
                      <img src={getPrimaryImage(house)} alt={house.name} style={thumbStyle} />
                      <strong>{house.name || "N/A"}</strong>
                    </div>
                  </td>
                  <td style={tdStyle}>{house.boardingHouseType?.name || "N/A"}</td>
                  <td style={{ ...tdStyle, maxWidth: 340 }}>
                    <span style={ellipsisStyle}>{formatAddress(house.address)}</span>
                  </td>
                  <td style={tdStyle}>{formatCurrency(house.priceRange)}</td>
                  <td style={tdStyle}>{house.availableRooms ?? 0}/{house.totalRooms ?? 0}</td>
                  <td style={tdStyle}>
                    <div style={actionStyle}>
                      <button title="View detail" style={iconBtnStyle} onClick={() => navigate(`/my-boarding-houses/${house._id}?mode=view`)}>
                        <Eye size={17} />
                      </button>
                      <button title="Reviews" style={iconBtnStyle} onClick={() => navigate(`/my-boarding-houses/${house._id}?mode=view#reviews`)}>
                        <MessageSquare size={17} />
                      </button>
                      <button title="Update" style={iconBtnStyle} onClick={() => navigate(`/my-boarding-houses/${house._id}`)}>
                        <Edit3 size={17} />
                      </button>
                      <button title="Delete" style={deleteIconBtnStyle} onClick={() => handleDelete(house._id)}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={emptyStyle}>No boarding houses found</td></tr>
            )}
          </tbody>
        </table>

        <div style={paginationStyle}>
          <span style={subtitleStyle}>Showing {houses.length} of {pagination.totalItems || 0}</span>
          <div style={pageButtonWrapStyle}>
            <select value={limit} onChange={(e) => handleLimitChange(e.target.value)} style={pageSizeSelectStyle}>
              {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <button style={pageBtnStyle(!pagination.hasPrevPage || loading)} disabled={!pagination.hasPrevPage || loading} onClick={() => handlePageChange((pagination.currentPage || 1) - 1)}>Previous</button>
            <span style={pageTextStyle}>{pagination.currentPage || 1}/{pagination.totalPages || 1}</span>
            <button style={pageBtnStyle(!pagination.hasNextPage || loading)} disabled={!pagination.hasNextPage || loading} onClick={() => handlePageChange((pagination.currentPage || 1) + 1)}>Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const getPrimaryImage = (house) => house.images?.find((image) => image.isPrimary)?.imageUrl || house.images?.[0]?.imageUrl || "/image/logo.png";
const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const formatAddress = (address) => [address?.detail, address?.ward?.name, address?.district?.name, address?.province?.name].filter(Boolean).join(", ") || "N/A";

const headerStyle = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" };
const titleStyle = { margin: 0, color: "#27364a", fontWeight: 700 };
const subtitleStyle = { color: "#667085", fontSize: 13 };
const primaryBtnStyle = { display: "inline-flex", alignItems: "center", gap: 8, border: "none", borderRadius: 6, background: "#12b76a", color: "#fff", padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const summaryStyle = { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 };
const summaryItemStyle = { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", color: "#344054", fontWeight: 600 };
const tableCardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const headerRowStyle = { borderBottom: "1px solid #e5e7eb", background: "#f9fafb" };
const rowStyle = { borderBottom: "1px solid #f3f4f6" };
const thStyle = { padding: 16, textAlign: "left", color: "#344054", fontWeight: 700, fontSize: 13 };
const tdStyle = { padding: 16, color: "#344054", verticalAlign: "middle" };
const houseCellStyle = { display: "flex", alignItems: "center", gap: 12, minWidth: 230 };
const thumbStyle = { width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" };
const ellipsisStyle = { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const actionStyle = { display: "flex", gap: 8 };
const iconBtnStyle = { width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#eef4ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer" };
const deleteIconBtnStyle = { ...iconBtnStyle, background: "#fef3f2", color: "#d92d20", border: "1px solid #fecdca" };
const emptyStyle = { textAlign: "center", padding: 42, color: "#667085" };
const paginationStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "14px 16px", borderTop: "1px solid #e5e7eb", flexWrap: "wrap" };
const pageButtonWrapStyle = { display: "flex", alignItems: "center", gap: 8 };
const pageSizeSelectStyle = { height: 36, border: "1px solid #d0d5dd", borderRadius: 6, padding: "0 8px", background: "#fff" };
const pageTextStyle = { color: "#344054", fontWeight: 700, minWidth: 44, textAlign: "center" };
const pageBtnStyle = (disabled) => ({ padding: "8px 13px", borderRadius: 6, border: "1px solid #d0d5dd", background: disabled ? "#f2f4f7" : "#fff", color: disabled ? "#98a2b3" : "#344054", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700 });
