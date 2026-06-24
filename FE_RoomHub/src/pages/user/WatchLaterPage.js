import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWatchLater, deleteWatchLater } from "../../api/watchLater";
import { Clock, Star, MapPin, BedDouble, X, Search, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import Footer from "../layout/homepage/footer";
import Header from "../layout/homepage/header";

const WatchLaterPage = () => {
    const [watchLater, setWatchLater] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [sortBy, setSortBy] = useState("default");
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            const res = await getWatchLater();
            if (res?.watchLater) setWatchLater(res.watchLater);
        };

        load();
    }, []);

    const formatCurrency = (value) => {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) return "Contact";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(numberValue);
    };

    const formatAddress = (address) => {
        if (!address) return "";

        return [
            address.detail,
            address.ward?.name,
            address.district?.name,
            address.province?.name,
        ].filter(Boolean).join(", ");
    };

    // DERIVED LIST: filter by keyword + sort (giữ nguyên mảng gốc watchLater)
    const visibleList = useMemo(() => {
        const kw = keyword.trim().toLowerCase();

        const filtered = watchLater.filter((item) => {
            if (!kw) return true;
            const name = (item.name || "").toLowerCase();
            const addr = formatAddress(item.address).toLowerCase();
            return name.includes(kw) || addr.includes(kw);
        });

        const sorted = [...filtered];
        switch (sortBy) {
            case "price-asc":
                sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
                break;
            case "price-desc":
                sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
                break;
            case "rating-desc":
                sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
                break;
            case "name-asc":
                sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            default:
                break;
        }
        return sorted;
    }, [watchLater, keyword, sortBy]);

    // REMOVE FROM WATCH LATER (có xác nhận)
    const handleRemoveWatchLater = async (e, id) => {
        e.stopPropagation();

        const confirm = await Swal.fire({
            title: "Remove from Watch Later?",
            text: "This boarding house will be removed from your watch later list.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ff6b00",
            cancelButtonColor: "#aaa",
            confirmButtonText: "Yes, remove",
            cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        try {
            await deleteWatchLater(id);

            setWatchLater(prev =>
                prev.filter(item => (item.id || item._id) !== id)
            );
        } catch (err) {
            console.error(err);
        }
    };

    // CLEAR ALL (loop deleteWatchLater)
    const handleClearAll = async () => {
        const confirm = await Swal.fire({
            title: "Clear all Watch Later?",
            text: `All ${watchLater.length} items will be removed.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ff3b30",
            cancelButtonColor: "#aaa",
            confirmButtonText: "Yes, clear all",
            cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        try {
            const ids = watchLater.map((item) => item.id || item._id);
            await Promise.all(ids.map((id) => deleteWatchLater(id)));
            setWatchLater([]);
            Swal.fire({
                title: "Cleared!",
                icon: "success",
                confirmButtonColor: "#ff6b00",
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <Header />

            <div className="container mt-4">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                    <h2 className="mb-0 d-flex align-items-center gap-2">
                        <Clock color="#ff6b00" /> Watch Later
                        <span
                            className="badge rounded-pill"
                            style={{ backgroundColor: "#ff6b00", fontSize: "14px" }}
                        >
                            {watchLater.length}
                        </span>
                    </h2>

                    {watchLater.length > 0 && (
                        <button
                            className="btn btn-sm rounded-pill d-flex align-items-center gap-1"
                            style={{ border: "1px solid #ff3b30", color: "#ff3b30" }}
                            onClick={handleClearAll}
                        >
                            <Trash2 size={16} /> Clear all
                        </button>
                    )}
                </div>

                {/* TOOLBAR: SEARCH + SORT */}
                {watchLater.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        <div className="position-relative flex-grow-1" style={{ maxWidth: "420px" }}>
                            <Search
                                size={16}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: 14,
                                    transform: "translateY(-50%)",
                                    color: "#999",
                                }}
                            />
                            <input
                                type="text"
                                className="form-control rounded-pill ps-5"
                                placeholder="Search by name or address..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                        </div>

                        <select
                            className="form-select rounded-pill"
                            style={{ maxWidth: "220px" }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="default">Sort: Default</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="rating-desc">Rating: High to Low</option>
                            <option value="name-asc">Name: A to Z</option>
                        </select>
                    </div>
                )}

                <div className="d-flex flex-column gap-3">
                    {visibleList.map((item) => {
                        const id = item.id || item._id;

                        return (
                            <div
                                key={id}
                                className="card border-0 shadow-sm"
                                style={{
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    position: "relative",
                                    borderLeft: "5px solid #ff6b00",
                                }}
                                onClick={() =>
                                    navigate(`/boarding-houses/${id}`)
                                }
                            >
                                {/* WATCH LATER RIBBON */}
                                <span
                                    className="d-flex align-items-center gap-1"
                                    style={{
                                        position: "absolute",
                                        top: 12,
                                        left: 12,
                                        zIndex: 10,
                                        background: "#ff6b00",
                                        color: "#fff",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                    }}
                                >
                                    <Clock size={13} /> Watch later
                                </span>

                                {/* REMOVE BUTTON */}
                                <button
                                    onClick={(e) => handleRemoveWatchLater(e, id)}
                                    style={{
                                        position: "absolute",
                                        top: 12,
                                        right: 12,
                                        zIndex: 10,
                                        border: "none",
                                        background: "rgba(255,255,255,0.9)",
                                        borderRadius: "50%",
                                        width: 32,
                                        height: 32,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                    }}
                                >
                                    <X size={16} color="#ff3b30" />
                                </button>

                                {/* HORIZONTAL LAYOUT: IMAGE LEFT + CONTENT RIGHT */}
                                <div className="row g-0 align-items-stretch">
                                    {/* IMAGE */}
                                    <div className="col-md-4">
                                        <div style={{ height: "100%", minHeight: "200px" }}>
                                            <img
                                                src={
                                                    item.img?.[0]?.imageUrl ||
                                                    "/image/logoconen.png"
                                                }
                                                alt={item.name}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* CONTENT */}
                                    <div className="col-md-8">
                                        <div className="p-4 d-flex flex-column gap-2 h-100">
                                            {/* NAME + RATING */}
                                            <div className="d-flex justify-content-between align-items-start">
                                                <h4 className="mb-0 fw-bold">{item.name}</h4>

                                                <span className="text-warning d-flex align-items-center gap-1 fw-semibold">
                                                    <Star size={18} fill="currentColor" />
                                                    {item.rating ?? 0}
                                                </span>
                                            </div>

                                            {/* ADDRESS */}
                                            <div className="text-muted small d-flex align-items-center gap-1">
                                                <MapPin size={15} />
                                                {formatAddress(item.address)}
                                            </div>

                                            {/* DESCRIPTION */}
                                            <p className="text-muted small mb-0">
                                                {item.detail}
                                            </p>

                                            {/* META ROW: PRICE + ROOMS */}
                                            <div className="d-flex align-items-center gap-4 mt-auto pt-2">
                                                <div
                                                    className="fw-bold fs-5"
                                                    style={{ color: "#ff6b00" }}
                                                >
                                                    {formatCurrency(item.price)}
                                                </div>

                                                <div className="text-secondary small d-flex align-items-center gap-2">
                                                    <BedDouble size={18} />
                                                    {item.availableRooms}/{item.totalRooms} rooms
                                                </div>

                                                <button
                                                    className="btn btn-sm rounded-pill ms-auto px-3 text-white"
                                                    style={{ backgroundColor: "#ff6b00" }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(
                                                            `/boarding-houses/${id}`
                                                        );
                                                    }}
                                                >
                                                    View detail
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {watchLater.length === 0 && (
                    <div className="text-center mt-5 text-muted">
                        You don't have any watch later items yet ⏰
                    </div>
                )}

                {watchLater.length > 0 && visibleList.length === 0 && (
                    <div className="text-center mt-5 text-muted">
                        No items match your search 🔍
                    </div>
                )}
            </div>

            <Footer />
        </>
    );
};

export default WatchLaterPage;
